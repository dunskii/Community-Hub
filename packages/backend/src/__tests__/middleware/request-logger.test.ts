import { EventEmitter } from 'node:events';

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { requestLogger } = await import('../../middleware/request-logger.js');
const { logger } = await import('../../utils/logger.js');

function createMockReqRes() {
  const req = {
    requestId: 'test-req-id',
    method: 'GET',
    path: '/api/v1/health',
    ip: '127.0.0.1',
  } as unknown as import('express').Request;

  const res = new EventEmitter() as EventEmitter & { statusCode: number };
  res.statusCode = 200;

  return { req, res: res as unknown as import('express').Response };
}

describe('requestLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call next() immediately', () => {
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should log request details on response finish', () => {
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    requestLogger(req, res, next);

    // Simulate response finishing
    (res as unknown as EventEmitter).emit('finish');

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-req-id',
        method: 'GET',
        path: '/api/v1/health',
        status: 200,
        ip: '127.0.0.1',
        duration: expect.any(Number),
      }),
    );
  });

  it('should not log before response finishes', () => {
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    requestLogger(req, res, next);

    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should include duration in milliseconds', () => {
    const { req, res } = createMockReqRes();
    const next = vi.fn();

    requestLogger(req, res, next);
    (res as unknown as EventEmitter).emit('finish');

    const logCall = vi.mocked(logger.info).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof logCall['duration']).toBe('number');
    expect(logCall['duration']).toBeGreaterThanOrEqual(0);
  });
});
