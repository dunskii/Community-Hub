import { describe, it, expect } from 'vitest';

import { ApiError } from '../../utils/api-error.js';

describe('ApiError', () => {
  it('should create an error with code, message, and statusCode', () => {
    const err = new ApiError('TEST_ERROR', 'test message', 418);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('TEST_ERROR');
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(418);
    expect(err.name).toBe('ApiError');
  });

  it('should default statusCode to 400', () => {
    const err = new ApiError('TEST', 'msg');
    expect(err.statusCode).toBe(400);
  });

  it('should include optional details', () => {
    const details = [{ field: 'email', message: 'required' }];
    const err = new ApiError('VALIDATION_ERROR', 'invalid', 400, details);
    expect(err.details).toEqual(details);
  });

  describe('static factories', () => {
    it('validation() returns 400 VALIDATION_ERROR', () => {
      const err = ApiError.validation('bad input', { field: 'name' });
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual({ field: 'name' });
    });

    it('notFound() returns 404 NOT_FOUND', () => {
      const err = ApiError.notFound();
      expect(err.code).toBe('NOT_FOUND');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Resource not found');
    });

    it('notFound() accepts custom message', () => {
      const err = ApiError.notFound('User not found');
      expect(err.message).toBe('User not found');
    });

    it('unauthorized() returns 401 UNAUTHORIZED', () => {
      const err = ApiError.unauthorized();
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.statusCode).toBe(401);
    });

    it('forbidden() returns 403 FORBIDDEN', () => {
      const err = ApiError.forbidden();
      expect(err.code).toBe('FORBIDDEN');
      expect(err.statusCode).toBe(403);
    });

    it('conflict() returns 409 ALREADY_EXISTS', () => {
      const err = ApiError.conflict('Email taken');
      expect(err.code).toBe('ALREADY_EXISTS');
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Email taken');
    });

    it('rateLimited() returns 429 RATE_LIMITED', () => {
      const err = ApiError.rateLimited();
      expect(err.code).toBe('RATE_LIMITED');
      expect(err.statusCode).toBe(429);
    });

    it('internal() returns 500 SERVER_ERROR', () => {
      const err = ApiError.internal();
      expect(err.code).toBe('SERVER_ERROR');
      expect(err.statusCode).toBe(500);
    });
  });
});
