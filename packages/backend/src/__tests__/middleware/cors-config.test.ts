import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:5173,http://example.com');

const { corsConfig } = await import('../../middleware/cors-config.js');

function mockReqRes(origin?: string, method = 'GET') {
  const req = {
    headers: origin ? { origin } : {},
    method,
  } as unknown as import('express').Request;
  const res = {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    end: vi.fn(),
  } as unknown as import('express').Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('corsConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set Allow-Origin for allowed origin', () => {
    const { req, res, next } = mockReqRes('http://localhost:5173');
    corsConfig(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'http://localhost:5173',
    );
    expect(next).toHaveBeenCalled();
  });

  it('should not set Allow-Origin for disallowed origin', () => {
    const { req, res, next } = mockReqRes('http://evil.com');
    corsConfig(req, res, next);

    const calls = vi.mocked(res.setHeader).mock.calls;
    const originCall = calls.find(([header]) => header === 'Access-Control-Allow-Origin');
    expect(originCall).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should set Vary: Origin header', () => {
    const { req, res, next } = mockReqRes('http://localhost:5173');
    corsConfig(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
  });

  it('should expose X-Request-Id header', () => {
    const { req, res, next } = mockReqRes('http://localhost:5173');
    corsConfig(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Expose-Headers', 'X-Request-Id');
  });

  it('should respond 204 for preflight OPTIONS request', () => {
    const { req, res, next } = mockReqRes('http://example.com', 'OPTIONS');
    corsConfig(req, res, next);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should not include PATCH in allowed methods', () => {
    const { req, res, next } = mockReqRes('http://localhost:5173');
    corsConfig(req, res, next);

    const methodsCall = vi.mocked(res.setHeader).mock.calls.find(
      ([header]) => header === 'Access-Control-Allow-Methods',
    );
    expect(methodsCall?.[1]).not.toContain('PATCH');
  });

  it('should include X-CSRF-Token in allowed headers', () => {
    const { req, res, next } = mockReqRes('http://localhost:5173');
    corsConfig(req, res, next);

    const headersCall = vi.mocked(res.setHeader).mock.calls.find(
      ([header]) => header === 'Access-Control-Allow-Headers',
    );
    expect(headersCall?.[1]).toContain('X-CSRF-Token');
  });
});
