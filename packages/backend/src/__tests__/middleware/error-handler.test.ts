import { describe, it, expect, vi } from 'vitest';

import { errorHandler } from '../../middleware/error-handler.js';
import { ApiError } from '../../utils/api-error.js';

vi.mock('../../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

function mockReqRes() {
  const req = { requestId: 'test-req-id' } as unknown as import('express').Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as import('express').Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('errorHandler', () => {
  it('should handle ApiError with correct status and code', () => {
    const { req, res, next } = mockReqRes();
    const err = ApiError.notFound('User not found');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'User not found',
          requestId: 'test-req-id',
        }),
      }),
    );
  });

  it('should handle ApiError with details', () => {
    const { req, res, next } = mockReqRes();
    const err = ApiError.validation('Invalid input', [{ field: 'email' }]);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const call = vi.mocked(res.json).mock.calls[0]?.[0] as Record<string, unknown>;
    expect((call['error'] as Record<string, unknown>)['details']).toEqual([{ field: 'email' }]);
  });

  it('should handle unknown errors as 500 SERVER_ERROR', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('Something broke');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        }),
      }),
    );
  });

  it('should not leak error details for unknown errors', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('database connection refused');

    errorHandler(err, req, res, next);

    const call = vi.mocked(res.json).mock.calls[0]?.[0] as Record<string, unknown>;
    expect((call['error'] as Record<string, unknown>)['message']).not.toContain(
      'database connection refused',
    );
  });

  it('should log 5xx ApiError with logger.error', async () => {
    const { logger } = await import('../../utils/logger.js');
    const { req, res, next } = mockReqRes();
    const err = ApiError.internal('Database failure');

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'test-req-id' }),
      'Database failure',
    );
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should not log 4xx ApiError with logger.error', async () => {
    const { logger } = await import('../../utils/logger.js');
    vi.mocked(logger.error).mockClear();
    const { req, res, next } = mockReqRes();
    const err = ApiError.notFound('Not here');

    errorHandler(err, req, res, next);

    expect(logger.error).not.toHaveBeenCalled();
  });
});
