import type { Request, Response, NextFunction } from 'express';

import { sanitizeRichText, stripHtml } from '../utils/sanitizer.js';

interface SanitizeOptions {
  /** Fields in req.body to sanitize as rich text (allow safe HTML subset) */
  richTextFields?: string[];
  /** Fields in req.body to sanitize as plain text (strip all HTML) */
  plainTextFields?: string[];
}

/**
 * Express middleware factory for input sanitization.
 * Apply after validation middleware -- operates on already-validated body fields.
 *
 * @example
 * router.post('/reviews',
 *   validate({ body: createReviewSchema }),
 *   sanitize({ richTextFields: ['content'], plainTextFields: ['title'] }),
 *   createReviewHandler,
 * );
 */
export function sanitize(options: SanitizeOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      for (const field of options.richTextFields ?? []) {
        if (typeof req.body[field] === 'string') {
          req.body[field] = sanitizeRichText(req.body[field]);
        }
      }
      for (const field of options.plainTextFields ?? []) {
        if (typeof req.body[field] === 'string') {
          req.body[field] = stripHtml(req.body[field]);
        }
      }
    }
    next();
  };
}
