import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

import type { Request, Response, NextFunction } from 'express';

import { ApiError } from '../utils/api-error.js';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getSecret(): string {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) {
    throw new Error('SESSION_SECRET is required for CSRF protection');
  }
  return secret;
}

function generateToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex');
}

function signToken(token: string): string {
  const hmac = createHmac('sha256', getSecret());
  hmac.update(token);
  return `${token}.${hmac.digest('hex')}`;
}

function verifySignedToken(signedToken: string): string | null {
  const dotIndex = signedToken.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const token = signedToken.substring(0, dotIndex);
  const signature = signedToken.substring(dotIndex + 1);

  const hmac = createHmac('sha256', getSecret());
  hmac.update(token);
  const expected = hmac.digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
  } catch {
    return null;
  }

  return token;
}

/**
 * CSRF protection middleware.
 * Sets a signed XSRF-TOKEN cookie on every response and validates
 * the X-CSRF-Token header on non-safe (non-GET/HEAD/OPTIONS) requests.
 *
 * Spec Section 4.7: SameSite=Strict cookies + CSRF token for non-GET requests.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env['NODE_ENV'] === 'production';

  const existingCookie = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  let token: string;
  let cookieChanged = true;

  if (existingCookie) {
    const verified = verifySignedToken(existingCookie);
    if (verified) {
      token = verified;
      cookieChanged = false;
    } else {
      token = generateToken();
    }
  } else {
    token = generateToken();
  }

  // Only set the cookie when it's new or the previous one was invalid,
  // avoiding unnecessary Set-Cookie headers on every response.
  if (cookieChanged) {
    const signedToken = signToken(token);
    res.cookie(CSRF_COOKIE_NAME, signedToken, {
      httpOnly: false, // Client JS must read this to send in header
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });
  }

  // Skip validation for safe methods
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Validate CSRF token from header against cookie
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  if (!headerToken) {
    throw ApiError.forbidden('CSRF token missing');
  }

  const headerVerified = verifySignedToken(headerToken);
  if (!headerVerified || headerVerified !== token) {
    throw ApiError.forbidden('CSRF token invalid');
  }

  next();
}
