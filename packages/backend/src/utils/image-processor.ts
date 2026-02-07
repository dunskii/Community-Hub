/**
 * Image Processor Utility
 *
 * Handles image processing using sharp library.
 * Spec §12: Community User Features - Profile Photo Upload
 */

import sharp from 'sharp';
import { logger } from './logger';
import { IMAGE_CONSTANTS } from '../constants/time';

// Maximum dimensions for profile photos
const { MAX_WIDTH, MAX_HEIGHT, MIN_WIDTH, MIN_HEIGHT, WEBP_QUALITY } = IMAGE_CONSTANTS;

/**
 * Process uploaded image
 *
 * - Resize to max 800x800px (maintain aspect ratio)
 * - Convert to WebP format for optimization
 * - Strip EXIF data for privacy
 *
 * @param buffer - Image buffer from multer
 * @returns Processed image buffer
 * @throws Error if image is invalid, corrupt, or too small
 */
export async function processProfilePhoto(buffer: Buffer): Promise<Buffer> {
  try {
    // Validate input
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty image buffer provided');
    }

    // Validate image format and metadata before processing
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (metadataError) {
      logger.error({ error: metadataError }, 'Failed to read image metadata');
      throw new Error('Invalid or corrupt image file');
    }

    // Check for valid dimensions in source image
    if (!metadata.width || !metadata.height) {
      throw new Error('Image has invalid dimensions');
    }

    // Check minimum dimensions before processing
    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
      throw new Error(
        `Image too small - minimum ${MIN_WIDTH}x${MIN_HEIGHT}px required (received ${metadata.width}x${metadata.height}px)`
      );
    }

    // Check for unsupported format
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff', 'bmp'];
    if (metadata.format && !supportedFormats.includes(metadata.format)) {
      throw new Error(`Unsupported image format: ${metadata.format}`);
    }

    // Process image
    let processedImage;
    try {
      processedImage = await sharp(buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside', // Maintain aspect ratio, fit within dimensions
          withoutEnlargement: true, // Don't enlarge if image is smaller
        })
        .webp({
          quality: WEBP_QUALITY, // Good balance between quality and file size
        })
        .rotate() // Auto-rotate based on EXIF orientation
        .toBuffer({ resolveWithObject: false });
    } catch (processingError) {
      logger.error({ error: processingError }, 'Failed during image processing');
      throw new Error('Failed to process image - image may be corrupt or invalid');
    }

    // Validate output
    const outputMetadata = await sharp(processedImage as Buffer).metadata();
    if (!outputMetadata.width || !outputMetadata.height) {
      throw new Error('Image processing produced invalid output');
    }

    // Additional sanity check on output size
    if (outputMetadata.width < MIN_WIDTH || outputMetadata.height < MIN_HEIGHT) {
      throw new Error(
        `Processed image too small - minimum ${MIN_WIDTH}x${MIN_HEIGHT}px required`
      );
    }

    logger.debug(
      {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        outputWidth: outputMetadata.width,
        outputHeight: outputMetadata.height,
      },
      'Profile photo processed successfully'
    );

    return processedImage as Buffer;
  } catch (error) {
    // Re-throw with better context if it's our custom error
    if (error instanceof Error) {
      logger.error({ error, message: error.message }, 'Failed to process profile photo');
      throw error;
    }
    // Unknown error type
    logger.error({ error }, 'Failed to process profile photo - unknown error');
    throw new Error('Failed to process image - unknown error');
  }
}

/**
 * Validate image dimensions
 *
 * @param buffer - Image buffer
 * @returns True if valid dimensions
 */
export async function validateImageDimensions(
  buffer: Buffer
): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();

    // Ensure image has valid dimensions
    if (!metadata.width || !metadata.height) {
      return false;
    }

    // Check minimum dimensions
    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to validate image dimensions');
    return false;
  }
}
