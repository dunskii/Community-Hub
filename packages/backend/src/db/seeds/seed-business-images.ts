/**
 * Seed Business Images
 *
 * Downloads sample images for businesses and updates the database.
 * Uses picsum.photos for free, no-API-key-required placeholder images.
 */

import { prisma } from '../index.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads/businesses');

// Business slug -> search-appropriate image seed (picsum uses numeric IDs for consistent images)
const BUSINESS_IMAGES: Record<string, { cover: number; gallery: number[] }> = {
  'styles-hair-salon': { cover: 633, gallery: [634, 635, 64] },
  'guildford-pharmacy-plus': { cover: 312, gallery: [313, 314] },
  'fitness-first-guildford': { cover: 399, gallery: [400, 401, 402] },
  'tech-hub-electronics': { cover: 180, gallery: [181, 182] },
  'guildford-medical-centre': { cover: 306, gallery: [307, 308] },
  'golden-crust-bakery': { cover: 292, gallery: [293, 294, 295] },
  'daily-grind-cafe': { cover: 425, gallery: [426, 427] },
  'guildford-grill-house': { cover: 225, gallery: [237, 239, 240] },
};

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, { headers: { 'User-Agent': 'CommunityHub/1.0' } }, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(filepath);
          return downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        }
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', (err) => { fs.unlinkSync(filepath); reject(err); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

export async function seedBusinessImages(): Promise<void> {
  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const businesses = await prisma.businesses.findMany({
    select: { id: true, slug: true, name: true },
  });

  for (const business of businesses) {
    const imageConfig = BUSINESS_IMAGES[business.slug];
    if (!imageConfig) {
      logger.info(`No image config for ${business.slug}, skipping`);
      continue;
    }

    const bizDir = path.join(UPLOADS_DIR, business.slug);
    if (!fs.existsSync(bizDir)) {
      fs.mkdirSync(bizDir, { recursive: true });
    }

    try {
      // Download cover photo
      const coverFilename = `cover.jpg`;
      const coverPath = path.join(bizDir, coverFilename);
      if (!fs.existsSync(coverPath)) {
        logger.info(`Downloading cover image for ${business.name}...`);
        await downloadImage(`https://picsum.photos/id/${imageConfig.cover}/800/400`, coverPath);
      }
      const coverUrl = `/uploads/businesses/${business.slug}/${coverFilename}`;

      // Download gallery images
      const galleryUrls: string[] = [];
      for (let i = 0; i < imageConfig.gallery.length; i++) {
        const galFilename = `gallery-${i + 1}.jpg`;
        const galPath = path.join(bizDir, galFilename);
        if (!fs.existsSync(galPath)) {
          logger.info(`Downloading gallery image ${i + 1} for ${business.name}...`);
          await downloadImage(`https://picsum.photos/id/${imageConfig.gallery[i]}/800/600`, galPath);
        }
        galleryUrls.push(`/uploads/businesses/${business.slug}/${galFilename}`);
      }

      // Update database
      await prisma.businesses.update({
        where: { id: business.id },
        data: {
          cover_photo: coverUrl,
          gallery: galleryUrls,
          updated_at: new Date(),
        },
      });

      logger.info(`Updated images for ${business.name}: cover + ${galleryUrls.length} gallery`);
    } catch (error) {
      logger.error(`Failed to seed images for ${business.name}: ${error instanceof Error ? error.message : error}`);
    }
  }

  logger.info('Business image seeding complete');
}

// Run directly
seedBusinessImages()
  .then(() => { process.exit(0); })
  .catch((err) => { console.error(err); process.exit(1); });
