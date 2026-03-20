import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

import { ApiError } from '../utils/api-error.js';

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
 *
 * For body: replaces with parsed (coerced) values on success.
 * For params: replaces with parsed values on success.
 * For query: validates but does not replace (Express 5 req.query is read-only).
 *            Route handlers can continue to use req.query after validation.
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
      // Note: In Express 5, req.query is read-only (getter property).
      // We validate but don't try to replace it - handlers use original req.query.
      // If coercion is needed, handlers should coerce values themselves.
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        // Log full validation error for debugging
        console.log('[VALIDATE] Body validation failed:', JSON.stringify(formatValidationErrors(result.error), null, 2));
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
