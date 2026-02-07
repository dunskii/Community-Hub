/**
 * User Routes
 *
 * RESTful API endpoints for user profile management.
 * Spec Appendix B.4: User Endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth-middleware';
import { requireOwnershipOrAdmin } from '../middleware/rbac-middleware';
import { isValidLanguageCode } from '../utils/language-validator';
import {
  getUserById,
  updateUserProfile,
  updateProfilePhoto,
  deleteProfilePhoto,
  changePassword,
  changeEmail,
  verifyEmailChange,
  updateNotificationPreferences,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '../services/user-service';
import {
  listUserSessions,
  revokeSession,
  revokeAllUserSessions,
  findSessionByJti,
} from '../services/session-service';
import { verifyRefreshToken } from '../services/token-service';
import { prisma } from '../db/index';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { getClientIp } from '../utils/ip-address';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────────

const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

const updateProfileBodySchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  suburb: z.string().optional(),
  languagePreference: z.string().optional().refine(
    (lang) => !lang || isValidLanguageCode(lang),
    { message: 'Unsupported language code. Check platform configuration.' }
  ),
  interests: z.array(z.string()).optional(),
});

const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const changeEmailBodySchema = z.object({
  newEmail: z.string().email('Invalid email address'),
});

const verifyEmailChangeBodySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const updatePreferencesBodySchema = z.object({
  emailDigest: z.enum(['none', 'daily', 'weekly']).optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  dealAlerts: z.boolean().optional(),
  eventReminders: z.boolean().optional(),
  businessUpdates: z.boolean().optional(),
  emergencyAlerts: z.enum(['all', 'critical_only', 'none']).optional(),
});

// ─── Routes ──────────────────────────────────────────────────────

/**
 * GET /users/:id
 *
 * Get user profile by ID.
 * Users can view own profile, admins can view any profile.
 */
router.get(
  '/:id',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id as string; // Validated by middleware
      const user = await getUserById(userId);

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error({ error }, 'Get user error');
      throw error;
    }
  }
);

/**
 * PUT /users/:id
 *
 * Update user profile.
 * Users can only update own profile.
 */
router.put(
  '/:id',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema, body: updateProfileBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const user = await updateUserProfile(userId, req.body);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error({ error }, 'Update user profile error');
      throw error;
    }
  }
);

/**
 * PUT /users/:id/photo
 *
 * Upload profile photo.
 * Accepts multipart/form-data with 'photo' field.
 */
router.put(
  '/:id/photo',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  uploadSingle,
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        throw ApiError.validation('No photo file provided');
      }

      const userId = req.params.id!;
      const user = await updateProfilePhoto(userId, req.file.buffer);

      res.json({
        success: true,
        data: {
          user,
          message: 'Profile photo uploaded successfully',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('at least 100x100')) {
          throw ApiError.validation(error.message);
        }
        if (error.message.includes('Failed to')) {
          throw ApiError.internal(error.message);
        }
      }
      logger.error({ error }, 'Update profile photo error');
      throw error;
    }
  }
);

/**
 * DELETE /users/:id/photo
 *
 * Delete profile photo.
 */
router.delete(
  '/:id/photo',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const user = await deleteProfilePhoto(userId);

      res.json({
        success: true,
        data: {
          user,
          message: 'Profile photo deleted successfully',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No profile photo')) {
          throw ApiError.notFound(error.message);
        }
      }
      logger.error({ error }, 'Delete profile photo error');
      throw error;
    }
  }
);

/**
 * PUT /users/:id/password
 *
 * Change user password.
 * Requires current password verification.
 */
router.put(
  '/:id/password',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema, body: changePasswordBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const ipAddress = getClientIp(req);

      // Get current session ID from refresh token (to exclude from revocation)
      let currentSessionId: string | undefined;
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) {
        const payload = await verifyRefreshToken(refreshToken);
        if (payload) {
          const session = await findSessionByJti(payload.jti);
          if (session) {
            currentSessionId = session.id;
          }
        }
      }

      await changePassword(
        userId,
        req.body.currentPassword,
        req.body.newPassword,
        currentSessionId,
        ipAddress
      );

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully. Other sessions have been logged out.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('incorrect')) {
          throw ApiError.unauthorized('Current password is incorrect');
        }
        throw ApiError.validation(error.message);
      }
      throw error;
    }
  }
);

/**
 * PUT /users/:id/email
 *
 * Request email change.
 * Sets pendingEmail and sends verification to new email address.
 */
router.put(
  '/:id/email',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema, body: changeEmailBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const ipAddress = getClientIp(req);
      await changeEmail(userId, req.body.newEmail, ipAddress);

      res.json({
        success: true,
        data: {
          message:
            'Verification email sent to new address. Please check your inbox.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already in use')) {
          throw ApiError.conflict('Email already in use');
        }
        if (error.message.includes('Failed to send')) {
          throw ApiError.internal('Failed to send verification email');
        }
      }
      throw error;
    }
  }
);

/**
 * POST /users/:id/email/verify
 *
 * Verify email change with token.
 */
router.post(
  '/:id/email/verify',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema, body: verifyEmailChangeBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const user = await verifyEmailChange(userId, req.body.token);

      res.json({
        success: true,
        data: {
          user,
          message: 'Email changed successfully.',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid or expired') ||
          error.message.includes('does not match')
        ) {
          throw ApiError.validation(error.message);
        }
      }
      throw error;
    }
  }
);

/**
 * PUT /users/:id/preferences
 *
 * Update notification preferences.
 */
router.put(
  '/:id/preferences',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema, body: updatePreferencesBodySchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const user = await updateNotificationPreferences(userId, req.body);

      res.json({
        success: true,
        data: {
          user,
          message: 'Notification preferences updated',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Update preferences error');
      throw error;
    }
  }
);

/**
 * GET /users/:id/sessions
 *
 * List active sessions for user.
 */
router.get(
  '/:id/sessions',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const sessions = await listUserSessions(userId);

      res.json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      logger.error({ error }, 'Get sessions error');
      throw error;
    }
  }
);

/**
 * DELETE /users/:id/sessions/:sessionId
 *
 * Revoke specific session.
 */
router.delete(
  '/:id/sessions/:sessionId',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const sessionId = req.params.sessionId;

      const revoked = await revokeSession(sessionId, userId);

      if (!revoked) {
        throw ApiError.notFound('Session not found or already revoked');
      }

      res.json({
        success: true,
        data: {
          message: 'Session revoked successfully',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Revoke session error');
      throw error;
    }
  }
);

/**
 * DELETE /users/:id/sessions
 *
 * Revoke all sessions for user.
 */
router.delete(
  '/:id/sessions',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const count = await revokeAllUserSessions(userId);

      res.json({
        success: true,
        data: {
          message: `${count} session(s) revoked successfully`,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Revoke all sessions error');
      throw error;
    }
  }
);

/**
 * DELETE /users/:id
 *
 * Request account deletion.
 * Sets status to DELETED with 14-day grace period.
 */
router.delete(
  '/:id',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      const ipAddress = getClientIp(req);
      await requestAccountDeletion(userId, ipAddress);

      res.json({
        success: true,
        data: {
          message:
            'Account deletion requested. You have 14 days to cancel before permanent deletion.',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Delete account error');
      throw error;
    }
  }
);

/**
 * POST /users/:id/cancel-deletion
 *
 * Cancel account deletion within 14-day grace period.
 */
router.post(
  '/:id/cancel-deletion',
  requireAuth,
  requireOwnershipOrAdmin(),
  validate({ params: userIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.id!;
      await cancelAccountDeletion(userId);

      res.json({
        success: true,
        data: {
          message: 'Account deletion cancelled. Your account has been restored.',
        },
      });
    } catch (error) {
      logger.error({ error }, 'Cancel deletion error');
      throw error;
    }
  }
);

export default router;
