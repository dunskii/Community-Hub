import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('SESSION_SECRET', 'a'.repeat(64));

const { csrfProtection } = await import('../../middleware/csrf.js');

function mockReqRes(
  method = 'GET',
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
) {
  const req = {
    method,
    cookies,
    headers,
  } as unknown as import('express').Request;

  const setCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const res = {
    cookie(name: string, value: string, options: Record<string, unknown>) {
      setCookies.push({ name, value, options });
      return res;
    },
    _setCookies: setCookies,
  } as unknown as import('express').Response & {
    _setCookies: typeof setCookies;
  };

  const next = vi.fn();
  return { req, res, next };
}

describe('csrfProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safe methods', () => {
    it('should pass GET requests without CSRF token', () => {
      const { req, res, next } = mockReqRes('GET');
      csrfProtection(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass HEAD requests without CSRF token', () => {
      const { req, res, next } = mockReqRes('HEAD');
      csrfProtection(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should pass OPTIONS requests without CSRF token', () => {
      const { req, res, next } = mockReqRes('OPTIONS');
      csrfProtection(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('cookie setting', () => {
    it('should set XSRF-TOKEN cookie on response', () => {
      const { req, res, next } = mockReqRes('GET');
      csrfProtection(req, res, next);

      expect(res._setCookies.length).toBe(1);
      expect(res._setCookies[0]!.name).toBe('XSRF-TOKEN');
    });

    it('should set cookie with correct attributes', () => {
      const { req, res, next } = mockReqRes('GET');
      csrfProtection(req, res, next);

      const cookieOpts = res._setCookies[0]!.options;
      expect(cookieOpts.httpOnly).toBe(false); // Client JS must read it
      expect(cookieOpts.sameSite).toBe('strict');
      expect(cookieOpts.path).toBe('/');
    });

    it('should set signed token (token.signature format)', () => {
      const { req, res, next } = mockReqRes('GET');
      csrfProtection(req, res, next);

      const cookieValue = res._setCookies[0]!.value;
      expect(cookieValue).toContain('.');
      const parts = cookieValue.split('.');
      expect(parts.length).toBe(2);
      // Token should be 64 hex chars (32 bytes)
      expect(parts[0]!.length).toBe(64);
      // Signature should be 64 hex chars (sha256)
      expect(parts[1]!.length).toBe(64);
    });
  });

  describe('unsafe methods', () => {
    it('should reject POST without CSRF header', () => {
      const { req, res, next } = mockReqRes('POST');

      expect(() => csrfProtection(req, res, next)).toThrow('CSRF token missing');
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject PUT without CSRF header', () => {
      const { req, res, next } = mockReqRes('PUT');

      expect(() => csrfProtection(req, res, next)).toThrow('CSRF token missing');
    });

    it('should reject DELETE without CSRF header', () => {
      const { req, res, next } = mockReqRes('DELETE');

      expect(() => csrfProtection(req, res, next)).toThrow('CSRF token missing');
    });

    it('should reject POST with invalid CSRF header', () => {
      const { req, res, next } = mockReqRes('POST', {}, {
        'x-csrf-token': 'invalid-token',
      });

      expect(() => csrfProtection(req, res, next)).toThrow('CSRF token invalid');
    });

    it('should accept POST with valid CSRF token from existing cookie', () => {
      // First, do a GET to generate a token
      const getReqRes = mockReqRes('GET');
      csrfProtection(getReqRes.req, getReqRes.res, getReqRes.next);
      const signedToken = getReqRes.res._setCookies[0]!.value;

      // Now do a POST with the cookie and matching header
      const { req, res, next } = mockReqRes(
        'POST',
        { 'XSRF-TOKEN': signedToken },
        { 'x-csrf-token': signedToken },
      );
      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject POST with mismatched CSRF tokens', () => {
      // Get a valid token
      const getReqRes = mockReqRes('GET');
      csrfProtection(getReqRes.req, getReqRes.res, getReqRes.next);
      const signedToken = getReqRes.res._setCookies[0]!.value;

      // Get another token (different)
      const getReqRes2 = mockReqRes('GET');
      csrfProtection(getReqRes2.req, getReqRes2.res, getReqRes2.next);
      const signedToken2 = getReqRes2.res._setCookies[0]!.value;

      // POST with cookie from first, header from second
      const { req, res, next } = mockReqRes(
        'POST',
        { 'XSRF-TOKEN': signedToken },
        { 'x-csrf-token': signedToken2 },
      );

      expect(() => csrfProtection(req, res, next)).toThrow('CSRF token invalid');
    });
  });

  describe('cookie reuse', () => {
    it('should reuse valid existing cookie token without re-setting cookie', () => {
      // Get initial token
      const getReqRes = mockReqRes('GET');
      csrfProtection(getReqRes.req, getReqRes.res, getReqRes.next);
      const signedToken = getReqRes.res._setCookies[0]!.value;

      // Make another GET with existing valid cookie
      const getReqRes2 = mockReqRes('GET', { 'XSRF-TOKEN': signedToken });
      csrfProtection(getReqRes2.req, getReqRes2.res, getReqRes2.next);

      // No new Set-Cookie header since existing cookie is valid
      expect(getReqRes2.res._setCookies.length).toBe(0);
      expect(getReqRes2.next).toHaveBeenCalled();
    });

    it('should accept POST with valid reused cookie token', () => {
      // Get initial token via GET
      const getReqRes = mockReqRes('GET');
      csrfProtection(getReqRes.req, getReqRes.res, getReqRes.next);
      const signedToken = getReqRes.res._setCookies[0]!.value;

      // POST with the same cookie and matching header (cookie reused, not re-set)
      const postReqRes = mockReqRes(
        'POST',
        { 'XSRF-TOKEN': signedToken },
        { 'x-csrf-token': signedToken },
      );
      csrfProtection(postReqRes.req, postReqRes.res, postReqRes.next);

      expect(postReqRes.next).toHaveBeenCalled();
    });

    it('should generate new token if cookie signature is invalid', () => {
      const { req, res, next } = mockReqRes('GET', {
        'XSRF-TOKEN': 'abcd1234.invalidsignature',
      });
      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalled();
      // Should have set a new valid cookie
      expect(res._setCookies.length).toBe(1);
      const newToken = res._setCookies[0]!.value;
      expect(newToken).not.toBe('abcd1234.invalidsignature');
    });
  });
});
