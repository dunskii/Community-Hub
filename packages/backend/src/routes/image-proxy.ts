/**
 * Image Proxy Routes
 *
 * Endpoints for searching stock photos (Pixabay) and downloading remote
 * stock images to the server, so we store local paths instead of temporary
 * external URLs. Search is proxied through the backend to keep the API key
 * secret and avoid CSP violations on the frontend.
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth-middleware.js';
import { imageProxyRateLimiter } from '../middleware/rate-limiter.js';
import { validate } from '../middleware/validate.js';
import { imageProxyService } from '../services/image-proxy-service.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env-validate.js';
import type { Request, Response, NextFunction } from 'express';

const imageProxySchema = z.object({
  url: z.string().url().max(2048),
  context: z.enum(['business', 'deal', 'event']),
  entityId: z.string().max(255).optional(),
});

const stockSearchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).max(100).default(1),
  per_page: z.coerce.number().int().min(3).max(50).default(20),
  orientation: z.enum(['all', 'horizontal', 'vertical']).default('all'),
  min_width: z.coerce.number().int().min(0).default(0),
});

const router: ReturnType<typeof Router> = Router();

/**
 * POST /images/proxy-download
 * Downloads a remote image, processes it, and saves to /uploads/
 * Returns the local path.
 * Requires authentication.
 */
router.post(
  '/proxy-download',
  imageProxyRateLimiter,
  requireAuth,
  validate({ body: imageProxySchema }),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { url, context, entityId } = req.body as z.infer<typeof imageProxySchema>;

      const localPath = await imageProxyService.downloadAndSave(
        url,
        context,
        entityId,
      );

      sendSuccess(res, { path: localPath }, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to download image';

      logger.error({ error, body: req.body }, 'Image proxy download failed');

      // Map error messages to appropriate HTTP status codes
      if (message.includes('allowlist') || message.includes('Invalid URL')) {
        sendError(res, 'INVALID_URL', message, 400);
      } else if (message.includes('file size')) {
        sendError(res, 'FILE_TOO_LARGE', message, 413);
      } else if (message.includes('not a valid image') || message.includes('format')) {
        sendError(res, 'INVALID_IMAGE', message, 422);
      } else if (message.includes('timed out') || message.includes('Upstream')) {
        sendError(res, 'UPSTREAM_ERROR', message, 502);
      } else {
        sendError(res, 'DOWNLOAD_FAILED', message, 500);
      }
    }
  },
);

/**
 * GET /images/stock-search
 * Proxies Pixabay search so the API key stays server-side and
 * the frontend doesn't need pixabay.com in its CSP connect-src.
 * Requires authentication.
 */
router.get(
  '/stock-search',
  imageProxyRateLimiter,
  requireAuth,
  validate({ query: stockSearchSchema }),
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const apiKey = env.PIXABAY_API_KEY;
      if (!apiKey) {
        sendError(res, 'NOT_CONFIGURED', 'Stock photo search is not configured', 503);
        return;
      }

      const { q, page, per_page, orientation, min_width } = req.query as unknown as z.infer<typeof stockSearchSchema>;

      const params = new URLSearchParams({
        key: apiKey,
        q,
        image_type: 'photo',
        per_page: String(per_page),
        page: String(page),
        safesearch: 'true',
      });

      if (orientation !== 'all') {
        params.set('orientation', orientation);
      }
      if (min_width > 0) {
        params.set('min_width', String(min_width));
      }

      const pixabayUrl = `https://pixabay.com/api/?${params}`;
      const response = await fetch(pixabayUrl);

      if (!response.ok) {
        logger.error({ status: response.status }, 'Pixabay API error');
        sendError(res, 'UPSTREAM_ERROR', 'Stock photo search failed', 502);
        return;
      }

      const data = (await response.json()) as {
        hits?: Array<Record<string, unknown>>;
        totalHits?: number;
      };

      // Only forward the fields the frontend needs (strip the API key context)
      const hits = (data.hits || []).map((hit: Record<string, unknown>) => ({
        id: hit.id,
        webformatURL: hit.webformatURL,
        largeImageURL: hit.largeImageURL,
        tags: hit.tags,
        user: hit.user,
      }));

      sendSuccess(res, {
        hits,
        totalHits: data.totalHits || 0,
      });
    } catch (error) {
      logger.error({ error }, 'Stock photo search failed');
      sendError(res, 'SEARCH_FAILED', 'Failed to search stock photos', 500);
    }
  },
);

export { router as imageProxyRouter };
