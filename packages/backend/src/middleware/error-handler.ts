import type { Request, Response, NextFunction } from 'express';

import { ApiError } from '../utils/api-error.js';
import { sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const id = req.requestId;

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ requestId: id, err }, err.message);
    }
    sendError(res, err.code, err.message, err.statusCode, id, err.details);
    return;
  }

  // Unexpected errors -- do not leak details to client
  logger.error({ requestId: id, err }, 'Unhandled error');
  sendError(res, 'SERVER_ERROR', 'An unexpected error occurred', 500, id);
}
