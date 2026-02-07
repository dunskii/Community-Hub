/**
 * Upload Middleware
 *
 * Handles file uploads using multer.
 * Spec §12: Community User Features - Profile Photo Upload
 */

import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/api-error';

// File size limit: 5MB
const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * File filter function for multer
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }
}

/**
 * Multer configuration for memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMIT,
  },
  fileFilter,
});

/**
 * Single file upload middleware
 */
export const uploadSingle = upload.single('photo');

/**
 * Export upload instance for custom configurations
 */
export default upload;
