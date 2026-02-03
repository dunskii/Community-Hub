import { allEnabledFeatures } from '@community-hub/shared/testing';
import { describe, it, expect, vi } from 'vitest';

import { featureGate } from '../middleware/feature-gate.js';

function mockReqRes() {
  const req = { requestId: 'test-req-id' } as unknown as import('express').Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as import('express').Response;
  return { req, res };
}

describe('featureGate middleware', () => {
  it('should call next() when feature is enabled', () => {
    const middleware = featureGate('dealsHub', () => allEnabledFeatures);
    const next = vi.fn();
    const { req, res } = mockReqRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 404 with standard error format when feature is disabled', () => {
    const features = { ...allEnabledFeatures, dealsHub: false };
    const middleware = featureGate('dealsHub', () => features);
    const next = vi.fn();
    const { req, res } = mockReqRes();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'This feature is not available.',
          requestId: 'test-req-id',
        }),
      }),
    );
  });

  it('should propagate errors from getFeatures()', () => {
    const middleware = featureGate('dealsHub', () => {
      throw new Error('Config not loaded');
    });
    const next = vi.fn();
    const { req, res } = mockReqRes();

    expect(() => {
      middleware(req, res, next);
    }).toThrow('Config not loaded');
  });
});
