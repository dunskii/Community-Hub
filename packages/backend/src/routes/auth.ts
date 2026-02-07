/**
 * Authentication Routes
 *
 * RESTful API endpoints for user authentication.
 * Spec Appendix B.1: Authentication Endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import {
  authRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
} from '../middleware/rate-limiter';
import { requireAuth } from '../middleware/auth-middleware';
import { isValidLanguageCode } from '../utils/language-validator';
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  initiatePasswordReset,
  completePasswordReset,
} from '../services/auth-service';
import {
  generateAccessToken,
  generateRefreshToken,
  generateRefreshTokenWithJti,
  verifyRefreshToken,
  revokeToken,
  rotateRefreshToken,
} from '../services/token-service';
import {
  createSession,
  findSessionByJti,
  revokeSession,
  updateSessionActivity,
} from '../services/session-service';
import { prisma } from '../db/index';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { getClientIp } from '../utils/ip-address';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────

const registerBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  languagePreference: z.string().optional().refine(
    (lang) => !lang || isValidLanguageCode(lang),
    { message: 'Unsupported language code. Check platform configuration.' }
  ),
  suburb: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

const loginBodySchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const forgotPasswordBodySchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordBodySchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const verifyEmailBodySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  token: z.string().min(1, 'Verification token is required'),
});

const resendVerificationBodySchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ─── Routes ──────────────────────────────────────────────────────

/**
 * POST /auth/register
 *
 * Register a new user account.
 * Creates user with PENDING status and sends email verification.
 */
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const user = await registerUser(req.body);

      res.status(201).json({
        success: true,
        data: {
          user,
          message:
            'Registration successful. Please check your email to verify your account.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email already registered') {
          throw ApiError.conflict('Email already registered');
        }
        throw ApiError.validation(error.message);
      }
      throw error;
    }
  }
);

/**
 * POST /auth/login
 *
 * Authenticate user and return user data.
 * Sets access_token and refresh_token as HttpOnly cookies.
 */
router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const ipAddress = getClientIp(req);
      const { accessToken, user } = await loginUser(req.body, ipAddress);
      const { token: refreshToken, jti, expiresAt } = generateRefreshTokenWithJti(
        user.id,
        req.body.rememberMe
      );

      // Create session record
      const userAgent = req.headers['user-agent'] || 'Unknown';
      await createSession(user.id, jti, userAgent, ipAddress || 'unknown', expiresAt);

      // Set access token as HttpOnly cookie (15 minutes)
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      // Set refresh token as HttpOnly cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: req.body.rememberMe
          ? 30 * 24 * 60 * 60 * 1000 // 30 days
          : 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid email or password') ||
          error.message.includes('Account locked') ||
          error.message.includes('Account suspended') ||
          error.message.includes('Account deleted') ||
          error.message.includes('verify your email')
        ) {
          throw ApiError.unauthorized(error.message);
        }
      }
      throw error;
    }
  }
);

/**
 * POST /auth/logout
 *
 * Revoke current access token and refresh token.
 * Clears access_token and refresh_token cookies.
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    // Revoke current access token (JTI from req.user)
    if (req.user) {
      await revokeToken(req.user.jti, 15 * 60); // 15 minutes (access token expiry)
    }

    // Revoke refresh token if present and delete session
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const payload = await verifyRefreshToken(refreshToken);
      if (payload) {
        await revokeToken(payload.jti, 30 * 24 * 60 * 60); // 30 days max

        // Delete session from database
        const session = await findSessionByJti(payload.jti);
        if (session && req.user) {
          await revokeSession(session.id, req.user.id);
        }
      }
    }

    // Clear both cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Logout error');
    throw ApiError.internal('Logout failed');
  }
});

/**
 * POST /auth/forgot-password
 *
 * Initiate password reset flow.
 * Sends reset link to user's email (silent failure if email doesn't exist).
 */
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validate({ body: forgotPasswordBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const ipAddress = getClientIp(req);
      await initiatePasswordReset(req.body.email, ipAddress);

      // Always return success (don't reveal if email exists)
      res.json({
        success: true,
        data: {
          message:
            'If an account exists with this email, you will receive a password reset link.',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Password reset initiation error');
      // Silent failure
      res.json({
        success: true,
        data: {
          message:
            'If an account exists with this email, you will receive a password reset link.',
        },
      });
    }
  }
);

/**
 * POST /auth/reset-password
 *
 * Complete password reset with token.
 * Revokes all user sessions and sends confirmation email.
 */
router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  validate({ body: resetPasswordBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const ipAddress = getClientIp(req);
      await completePasswordReset(req.body.token, req.body.newPassword, ipAddress);

      res.json({
        success: true,
        data: {
          message: 'Password reset successfully. Please login with your new password.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid or expired')) {
          throw ApiError.validation('Invalid or expired reset token');
        }
        throw ApiError.validation(error.message);
      }
      throw error;
    }
  }
);

/**
 * POST /auth/verify-email
 *
 * Verify user's email address with token.
 * Sets user status to ACTIVE and sends welcome email.
 */
router.post(
  '/verify-email',
  validate({ body: verifyEmailBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const user = await verifyEmail(req.body.userId, req.body.token);

      res.json({
        success: true,
        data: {
          user,
          message: 'Email verified successfully. You can now login.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid or expired')) {
          throw ApiError.validation('Invalid or expired verification token');
        }
      }
      throw error;
    }
  }
);

/**
 * POST /auth/resend-verification
 *
 * Resend email verification link.
 * Rate limited to prevent abuse.
 */
router.post(
  '/resend-verification',
  authRateLimiter,
  validate({ body: resendVerificationBodySchema }),
  async (req: Request, res: Response) => {
    try {
      await resendVerificationEmail(req.body.email);

      res.json({
        success: true,
        data: {
          message: 'Verification email sent. Please check your inbox.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email already verified') {
          throw ApiError.conflict('Email already verified');
        }
        throw ApiError.internal('Failed to send verification email');
      }
      throw error;
    }
  }
);

/**
 * GET /auth/me
 *
 * Get current authenticated user.
 * Requires valid access token.
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Fetch full user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        profilePhoto: true,
        languagePreference: true,
        suburb: true,
        bio: true,
        interests: true,
        notificationPreferences: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error({ error }, 'Get current user error');
    throw error;
  }
});

/**
 * POST /auth/refresh
 *
 * Refresh access token using refresh token.
 * Rotates refresh token for security.
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token required');
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Update session activity
    await updateSessionActivity(payload.jti);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.role, user.email);
    const newRefreshToken = await rotateRefreshToken(refreshToken);

    if (!newRefreshToken) {
      throw ApiError.unauthorized('Failed to rotate refresh token');
    }

    // Set new access token cookie
    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set new refresh token cookie
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      success: true,
      data: {
        message: 'Token refreshed successfully',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Token refresh error');
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal('Token refresh failed');
  }
});

export default router;
