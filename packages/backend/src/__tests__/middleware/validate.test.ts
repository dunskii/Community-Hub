import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

import { validate } from '../../middleware/validate.js';
import { ApiError } from '../../utils/api-error.js';

function mockReqRes(overrides: { body?: unknown; query?: unknown; params?: unknown } = {}) {
  const req = {
    body: overrides.body ?? {},
    query: overrides.query ?? {},
    params: overrides.params ?? {},
  } as unknown as import('express').Request;
  const res = {} as unknown as import('express').Response;
  const next = vi.fn();
  return { req, res, next };
}

describe('validate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('body validation', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('should pass valid body and replace with parsed data', () => {
      const { req, res, next } = mockReqRes({ body: { name: 'Test', age: 25 } });
      validate({ body: schema })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'Test', age: 25 });
    });

    it('should throw ApiError for invalid body', () => {
      const { req, res, next } = mockReqRes({ body: { name: '', age: -1 } });

      expect(() => validate({ body: schema })(req, res, next)).toThrow(ApiError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should include field-level error details', () => {
      const { req, res, next } = mockReqRes({ body: { name: '', age: -1 } });

      try {
        validate({ body: schema })(req, res, next);
        expect.fail('should have thrown');
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.statusCode).toBe(400);
        expect(apiErr.code).toBe('VALIDATION_ERROR');
        const details = apiErr.details as Array<{ field: string; message: string }>;
        expect(details).toBeInstanceOf(Array);
        expect(details.length).toBeGreaterThan(0);
        expect(details[0]).toHaveProperty('field');
        expect(details[0]).toHaveProperty('message');
      }
    });

    it('should strip unknown fields', () => {
      const strictSchema = z.object({ name: z.string() }).strict();
      const { req, res, next } = mockReqRes({ body: { name: 'Test', extra: 'field' } });

      expect(() => validate({ body: strictSchema })(req, res, next)).toThrow(ApiError);
    });
  });

  describe('query validation', () => {
    const schema = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    });

    it('should pass valid query and apply coercion', () => {
      const { req, res, next } = mockReqRes({ query: { page: '2', limit: '50' } });
      validate({ query: schema })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 2, limit: 50 });
    });

    it('should throw ApiError for invalid query', () => {
      const { req, res, next } = mockReqRes({ query: { page: 'abc' } });

      expect(() => validate({ query: schema })(req, res, next)).toThrow(ApiError);
    });
  });

  describe('params validation', () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    it('should pass valid params', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const { req, res, next } = mockReqRes({ params: { id } });
      validate({ params: schema })(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.params).toEqual({ id });
    });

    it('should throw ApiError for invalid params', () => {
      const { req, res, next } = mockReqRes({ params: { id: 'not-a-uuid' } });

      expect(() => validate({ params: schema })(req, res, next)).toThrow(ApiError);
    });
  });

  describe('combined validation', () => {
    it('should validate body, query, and params together', () => {
      const { req, res, next } = mockReqRes({
        body: { name: 'Test' },
        query: { page: '1' },
        params: { id: '550e8400-e29b-41d4-a716-446655440000' },
      });

      validate({
        body: z.object({ name: z.string() }),
        query: z.object({ page: z.coerce.number() }),
        params: z.object({ id: z.string().uuid() }),
      })(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail on first invalid schema (params checked first)', () => {
      const { req, res, next } = mockReqRes({
        body: { name: 'Test' },
        params: { id: 'bad' },
      });

      try {
        validate({
          body: z.object({ name: z.string() }),
          params: z.object({ id: z.string().uuid() }),
        })(req, res, next);
        expect.fail('should have thrown');
      } catch (err) {
        const apiErr = err as ApiError;
        expect(apiErr.message).toBe('Invalid path parameters');
      }
    });
  });

  describe('no schemas', () => {
    it('should pass through when no schemas provided', () => {
      const { req, res, next } = mockReqRes({ body: { anything: true } });
      validate({})(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
