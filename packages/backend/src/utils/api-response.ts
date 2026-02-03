import type { Response } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

export function sendList(
  res: Response,
  data: unknown[],
  pagination: { page: number; limit: number; total: number },
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: pagination.limit > 0 ? Math.ceil(pagination.total / pagination.limit) : 0,
    } satisfies Pagination,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number,
  requestId?: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
