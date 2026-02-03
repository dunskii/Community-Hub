import type { Request, Response } from 'express';

import { sendError } from '../utils/api-response.js';

export function notFound(req: Request, res: Response): void {
  sendError(res, 'NOT_FOUND', 'Route not found', 404, req.requestId);
}
