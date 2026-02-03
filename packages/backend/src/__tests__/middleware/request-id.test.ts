import { describe, it, expect, vi } from 'vitest';

import { requestId } from '../../middleware/request-id.js';

function mockRes() {
  return {
    setHeader: vi.fn(),
  } as unknown as import('express').Response;
}

describe('requestId middleware', () => {
  it('should assign a UUID requestId to the request', () => {
    const req = {} as import('express').Request;
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(next).toHaveBeenCalled();
  });

  it('should generate unique IDs for each request', () => {
    const req1 = {} as import('express').Request;
    const req2 = {} as import('express').Request;
    const res = mockRes();
    const next = vi.fn();

    requestId(req1, res, next);
    requestId(req2, res, next);

    expect(req1.requestId).not.toBe(req2.requestId);
  });

  it('should set X-Request-Id response header', () => {
    const req = {} as import('express').Request;
    const res = mockRes();
    const next = vi.fn();

    requestId(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.requestId);
  });
});
