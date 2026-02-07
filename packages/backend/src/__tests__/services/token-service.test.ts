/**
 * Token Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../generated/prisma';

// Create a Map to track revoked tokens across the mock
const revokedTokens = new Map<string, string>();

// Mock Redis before importing token-service
vi.mock('../../cache/redis-client', () => {
  // Create mock functions inside factory
  const mockSetex = vi.fn((key: string, ttl: number, value: string) => {
    if (key.startsWith('revoked:jti:')) {
      const jti = key.replace('revoked:jti:', '');
      revokedTokens.set(jti, value);
    }
    return Promise.resolve('OK');
  });

  const mockGet = vi.fn((key: string) => {
    if (key.startsWith('revoked:jti:')) {
      const jti = key.replace('revoked:jti:', '');
      return Promise.resolve(revokedTokens.get(jti) || null);
    }
    return Promise.resolve(null);
  });

  const mockDel = vi.fn((key: string) => {
    if (key.startsWith('revoked:jti:')) {
      const jti = key.replace('revoked:jti:', '');
      revokedTokens.delete(jti);
    }
    return Promise.resolve(1);
  });

  const mockScan = vi.fn(() => Promise.resolve(['0', []]));

  return {
    getRedis: vi.fn(() => ({
      setex: mockSetex,
      get: mockGet,
      del: mockDel,
      scan: mockScan,
    })),
  };
});

// Import after mocking and env setup
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateEmailToken,
  revokeToken,
} from '../../services/token-service';

describe('Token Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the revoked tokens map before each test
    revokedTokens.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear the revoked tokens map after each test
    revokedTokens.clear();
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Decode and verify structure
      const decoded = jwt.decode(token) as any;
      expect(decoded.sub).toBe('user-123');
      expect(decoded.role).toBe(UserRole.COMMUNITY);
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.jti).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate different JTIs for each token', () => {
      const token1 = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );
      const token2 = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );

      const decoded1 = jwt.decode(token1) as any;
      const decoded2 = jwt.decode(token2) as any;

      expect(decoded1.jti).not.toBe(decoded2.jti);
    });

    it('should set expiry time', () => {
      const token = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );

      const decoded = jwt.decode(token) as any;
      const expectedExpiry = decoded.iat + 15 * 60; // 15 minutes

      expect(decoded.exp).toBe(expectedExpiry);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = generateRefreshToken('user-123', false);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Decode and verify structure
      const decoded = jwt.decode(token) as any;
      expect(decoded.sub).toBe('user-123');
      expect(decoded.type).toBe('refresh');
      expect(decoded.jti).toBeDefined();
    });

    it('should use extended expiry with rememberMe=true', () => {
      const tokenShort = generateRefreshToken('user-123', false);
      const tokenLong = generateRefreshToken('user-123', true);

      const decodedShort = jwt.decode(tokenShort) as any;
      const decodedLong = jwt.decode(tokenLong) as any;

      const expiryShort = decodedShort.exp - decodedShort.iat;
      const expiryLong = decodedLong.exp - decodedLong.iat;

      expect(expiryLong).toBeGreaterThan(expiryShort);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      const token = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );

      const payload = await verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-123');
      expect(payload?.role).toBe(UserRole.COMMUNITY);
      expect(payload?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', async () => {
      const payload = await verifyAccessToken('invalid.token.here');

      expect(payload).toBeNull();
    });

    it('should return null for revoked access token', async () => {
      const token = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );

      // Extract JTI from token
      const decoded = jwt.decode(token) as any;

      // Revoke the token using the service function
      await revokeToken(decoded.jti, 900); // 15 minutes TTL

      // Verify the token
      const payload = await verifyAccessToken(token);

      expect(payload).toBeNull();
      // Verify the token is actually in the revoked map
      expect(revokedTokens.get(decoded.jti)).toBe('1');
    });

    it('should return null for expired token', async () => {
      // Create token with past expiry
      const expiredToken = jwt.sign(
        {
          sub: 'user-123',
          role: UserRole.COMMUNITY,
          email: 'test@example.com',
          jti: 'test-jti',
        },
        process.env.JWT_SECRET as string,
        { expiresIn: -1 } // Already expired
      );

      const payload = await verifyAccessToken(expiredToken);

      expect(payload).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const token = generateRefreshToken('user-123', false);

      const payload = await verifyRefreshToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-123');
      expect(payload?.type).toBe('refresh');
    });

    it('should return null for access token (wrong type)', async () => {
      const token = generateAccessToken(
        'user-123',
        UserRole.COMMUNITY,
        'test@example.com'
      );

      const payload = await verifyRefreshToken(token);

      expect(payload).toBeNull();
    });

    it('should return null for revoked refresh token', async () => {
      const token = generateRefreshToken('user-123', false);

      // Extract JTI from token
      const decoded = jwt.decode(token) as any;

      // Revoke the token using the service function
      await revokeToken(decoded.jti, 604800); // 7 days TTL

      // Verify the token
      const payload = await verifyRefreshToken(token);

      expect(payload).toBeNull();
      // Verify the token is actually in the revoked map
      expect(revokedTokens.get(decoded.jti)).toBe('1');
    });
  });

  describe('generateEmailToken', () => {
    it('should generate a random token', () => {
      const token = generateEmailToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate different tokens each time', () => {
      const token1 = generateEmailToken();
      const token2 = generateEmailToken();

      expect(token1).not.toBe(token2);
    });

    it('should only contain hexadecimal characters', () => {
      const token = generateEmailToken();

      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });
});
