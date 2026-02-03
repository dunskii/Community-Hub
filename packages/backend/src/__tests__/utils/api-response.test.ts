import { describe, it, expect, vi } from 'vitest';

import { sendSuccess, sendList, sendError } from '../../utils/api-response.js';

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response;
}

describe('sendSuccess', () => {
  it('should send { success: true, data } with 200', () => {
    const res = mockRes();
    sendSuccess(res, { id: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: '1' } });
  });

  it('should accept custom status code', () => {
    const res = mockRes();
    sendSuccess(res, { id: '1' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('sendList', () => {
  it('should calculate totalPages correctly', () => {
    const res = mockRes();
    sendList(res, [1, 2, 3], { page: 1, limit: 2, total: 5 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [1, 2, 3],
      pagination: { page: 1, limit: 2, total: 5, totalPages: 3 },
    });
  });

  it('should handle empty data', () => {
    const res = mockRes();
    sendList(res, [], { page: 1, limit: 20, total: 0 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('should handle exact page boundary', () => {
    const res = mockRes();
    sendList(res, [1, 2], { page: 1, limit: 2, total: 4 });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { page: 1, limit: 2, total: 4, totalPages: 2 },
      }),
    );
  });
});

describe('sendList edge cases', () => {
  it('should return totalPages 0 when limit is 0 (division by zero guard)', () => {
    const res = mockRes();
    sendList(res, [], { page: 1, limit: 0, total: 10 });

    const call = vi.mocked(res.json).mock.calls[0]?.[0] as Record<string, unknown>;
    const pagination = (call as { pagination: { totalPages: number } }).pagination;
    expect(pagination.totalPages).toBe(0);
  });
});

describe('sendError', () => {
  it('should send standardized error response', () => {
    const res = mockRes();
    sendError(res, 'NOT_FOUND', 'Resource not found', 404, 'req-123');

    expect(res.status).toHaveBeenCalledWith(404);
    const call = vi.mocked(res.json).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(call).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        requestId: 'req-123',
      },
    });
    const timestamp = (call['error'] as Record<string, unknown>)['timestamp'] as string;
    expect(timestamp).toBeDefined();
    // Verify ISO 8601 format
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('should include details when provided', () => {
    const res = mockRes();
    const details = [{ field: 'email' }];
    sendError(res, 'VALIDATION_ERROR', 'Invalid', 400, 'req-456', details);

    const call = vi.mocked(res.json).mock.calls[0]?.[0] as Record<string, unknown>;
    expect((call['error'] as Record<string, unknown>)['details']).toEqual(details);
  });

  it('should omit details when not provided', () => {
    const res = mockRes();
    sendError(res, 'SERVER_ERROR', 'Unexpected', 500);

    const call = vi.mocked(res.json).mock.calls[0]?.[0] as Record<string, unknown>;
    expect((call['error'] as Record<string, unknown>)['details']).toBeUndefined();
  });
});
