/**
 * Image Proxy Service
 *
 * Downloads remote stock images (e.g. from Pixabay), validates them,
 * processes with Sharp, and saves to the local /uploads/ directory.
 * This prevents storing temporary external URLs that expire.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { logger } from '../utils/logger.js';

/** Allowed source domains to prevent SSRF */
const ALLOWED_DOMAINS = [
  'pixabay.com',
  'cdn.pixabay.com',
  'picsum.photos',
  'fastly.picsum.photos',
  'i.picsum.photos',
];

/** Max file size: 10MB */
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

/** Max redirect hops */
const MAX_REDIRECTS = 5;

/** Download timeout in ms */
const DOWNLOAD_TIMEOUT_MS = 20_000;

/** Image processing config per context */
const PROCESSING_CONFIG = {
  business: { maxWidth: 1200, maxHeight: 800, quality: 80 },
  deal: { maxWidth: 1200, maxHeight: 800, quality: 80 },
  event: { maxWidth: 1200, maxHeight: 800, quality: 80 },
} as const;

export type ImageContext = keyof typeof PROCESSING_CONFIG;

/** Base uploads directory (relative to backend package root) */
const UPLOADS_BASE = path.resolve('uploads');

function isDomainAllowed(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function getOutputDir(context: ImageContext, entityId?: string): string {
  switch (context) {
    case 'business':
      return entityId
        ? path.join(UPLOADS_BASE, 'businesses', entityId)
        : path.join(UPLOADS_BASE, 'businesses');
    case 'deal':
      return path.join(UPLOADS_BASE, 'deals');
    case 'event':
      return path.join(UPLOADS_BASE, 'events');
  }
}

/**
 * Download a remote image buffer, following redirects.
 * Enforces domain allowlist and file size limit.
 */
function downloadImage(
  url: string,
  redirectCount = 0,
): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      return reject(new Error('Too many redirects'));
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error('Invalid URL'));
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return reject(new Error('Only HTTP(S) URLs are supported'));
    }

    // Allow any domain in redirect chain — Pixabay redirects through CDN domains
    // that we can't predict. The initial URL is validated in downloadAndSave().
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      url,
      { headers: { 'User-Agent': 'CommunityHub/1.0' }, timeout: DOWNLOAD_TIMEOUT_MS },
      (response) => {
        // Follow redirects
        if (
          (response.statusCode === 301 ||
            response.statusCode === 302 ||
            response.statusCode === 303 ||
            response.statusCode === 307 ||
            response.statusCode === 308) &&
          response.headers.location
        ) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          response.destroy();
          return downloadImage(redirectUrl, redirectCount + 1)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          response.destroy();
          return reject(
            new Error(`Upstream returned HTTP ${response.statusCode}`),
          );
        }

        const contentType = response.headers['content-type'] || '';

        const chunks: Buffer[] = [];
        let totalBytes = 0;

        response.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_DOWNLOAD_BYTES) {
            response.destroy();
            reject(new Error('Image exceeds maximum file size (10MB)'));
          }
          chunks.push(chunk);
        });

        response.on('end', () => {
          resolve({ buffer: Buffer.concat(chunks), contentType });
        });

        response.on('error', reject);
      },
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timed out'));
    });

    req.on('error', reject);
  });
}

/**
 * Download a remote image, validate, process with Sharp, and save locally.
 *
 * @returns The local path (e.g. "/uploads/businesses/abc123/img-uuid.webp")
 */
export async function downloadAndSave(
  url: string,
  context: ImageContext,
  entityId?: string,
): Promise<string> {
  // 1. Validate the initial URL domain
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!isDomainAllowed(parsed.hostname)) {
    throw new Error(
      `Domain "${parsed.hostname}" is not in the allowlist. Allowed: ${ALLOWED_DOMAINS.join(', ')}`,
    );
  }

  // 2. Download
  logger.info({ url, context, entityId }, 'Downloading stock image');
  const { buffer, contentType } = await downloadImage(url);

  // 3. Validate content type
  const validTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jpg',
  ];
  const isImage =
    validTypes.some((t) => contentType.startsWith(t)) || contentType === '';

  // Also validate via Sharp metadata as a fallback (some CDNs return wrong content-type)
  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
  } catch {
    throw new Error('Downloaded file is not a valid image');
  }

  if (!metadata.format) {
    throw new Error('Could not determine image format');
  }

  if (!isImage && !metadata.format) {
    throw new Error(`Invalid content type: ${contentType}`);
  }

  // 4. Process with Sharp
  const config = PROCESSING_CONFIG[context];
  const processed = await sharp(buffer)
    .resize(config.maxWidth, config.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: config.quality })
    .rotate() // Auto-rotate based on EXIF
    .toBuffer();

  // 5. Save to disk
  const outputDir = getOutputDir(context, entityId);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, processed);

  // 6. Return the URL path (relative to static mount)
  const relativePath = path.relative(UPLOADS_BASE, filepath).replace(/\\/g, '/');
  const urlPath = `/uploads/${relativePath}`;

  logger.info(
    { url, context, entityId, localPath: urlPath, sizeBytes: processed.length },
    'Stock image downloaded and saved',
  );

  return urlPath;
}

export const imageProxyService = { downloadAndSave };
