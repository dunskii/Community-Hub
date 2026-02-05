import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

import { ApiError } from '../utils/api-error.js';

// Module augmentation: allow validated query replacement on Express Request.
// Express types req.query as ParsedQs which is read-only in practice.
declare module 'express' {
  interface Request {
    query: Record<string, unknown>;
  }
}

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

function formatValidationErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Express middleware factory for Zod-based request validation.
 * Validates body, query, and/or params against provided schemas.
 * Replaces req.body/query/params with parsed (coerced) values on success.
 *
 * Errors are thrown as ApiError.validation() and handled by the error-handler middleware.
 *
 * @example
 * router.post('/businesses',
 *   validate({ body: createBusinessSchema }),
 *   createBusinessHandler,
 * );
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw ApiError.validation(
          'Invalid path parameters',
          formatValidationErrors(result.error),
        );
      }
      req.params = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw ApiError.validation(
          'Invalid query parameters',
          formatValidationErrors(result.error),
        );
      }
      req.query = result.data;
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw ApiError.validation(
          'Invalid request body',
          formatValidationErrors(result.error),
        );
      }
      req.body = result.data;
    }

    next();
  };
}
