/**
 * Authentication Service
 *
 * Handles user registration, login, email verification, and password reset.
 * Spec §4: Security & Privacy, §9: Onboarding
 */

import { prisma } from '../db/index';
import { UserStatus, users } from '../generated/prisma';
import { EmailService } from '../email/email-service';
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from '../utils/password';
import {
  generateAccessToken,
  // generateRefreshToken, // Generated in route handler for cookie setting
  generateEmailToken,
  storeEmailVerificationToken,
  verifyEmailVerificationToken,
  storePasswordResetToken,
  verifyPasswordResetToken,
  incrementFailedLoginAttempts,
  getFailedLoginAttempts,
  clearFailedLoginAttempts,
} from './token-service';
import {
  RegisterData,
  LoginData,
  LoginResponse,
  UserPublic,
} from '../types/auth';
import { logger } from '../utils/logger';
import { TIME_MS } from '../constants/time';

const emailService = new EmailService();

// Account lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Convert User model to public user data (omit password hash)
 */
function toUserPublic(user: users): UserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    profilePhoto: user.profile_photo,
    languagePreference: user.language_preference as any,
    suburb: user.suburb,
    bio: user.bio,
    interests: user.interests,
    notificationPreferences: user.notification_preferences as any,
    role: user.role,
    status: user.status,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLogin: user.last_login,
  };
}

/**
 * Register a new user
 *
 * Steps:
 * 1. Validate password strength
 * 2. Check email uniqueness
 * 3. Hash password
 * 4. Create user with PENDING status
 * 5. Generate email verification token
 * 6. Send verification email
 *
 * @param data - Registration data
 * @returns Public user object
 */
export async function registerUser(data: RegisterData): Promise<UserPublic> {
  // Validate password strength
  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Check if email already exists
  const existingUser = await prisma.users.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Default notification preferences
  const defaultPreferences = {
    emailDigest: 'daily',
    pushEnabled: true,
    smsEnabled: false,
    dealAlerts: false,
    eventReminders: true,
    businessUpdates: true,
    emergencyAlerts: 'all',
  };

  // Create user
  const user = await prisma.users.create({
    data: {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      display_name: data.displayName,
      language_preference: data.languagePreference || 'en',
      suburb: data.suburb,
      interests: data.interests || [],
      notification_preferences: defaultPreferences,
      status: UserStatus.PENDING,
      email_verified: false,
      updated_at: new Date(),
    },
  });

  // Generate verification token
  const token = generateEmailToken();
  await storeEmailVerificationToken(user.id, user.email, token);

  // Send verification email
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('FRONTEND_URL must be set in production');
        })()
      : 'http://localhost:5173');
  const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}&userId=${user.id}`;

  try {
    await emailService.sendTemplatedEmail(
      'email_verification',
      user.email,
      {
        userName: user.display_name,
        verificationLink,
        expiryHours: 24,
      },
      data.languagePreference as any
    );
  } catch (error) {
    logger.error({ error, userId: user.id }, 'Failed to send verification email');
    // Don't fail registration if email fails
  }

  logger.info({ userId: user.id, email: user.email }, 'User registered');

  return toUserPublic(user);
}

/**
 * Login a user
 *
 * Steps:
 * 1. Find user by email
 * 2. Check account lockout
 * 3. Verify password
 * 4. Check user status (must be ACTIVE)
 * 5. Generate tokens
 * 6. Update last login
 * 7. Clear failed attempts
 *
 * @param data - Login credentials
 * @returns Access token and user object
 */
export async function loginUser(
  data: LoginData,
  ipAddress?: string
): Promise<LoginResponse> {
  // Find user by email
  const user = await prisma.users.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    logger.warn(
      { email: data.email, ipAddress: ipAddress || 'unknown' },
      'Failed login attempt - user not found'
    );
    throw new Error('Invalid email or password');
  }

  // Check account lockout
  const failedAttempts = await getFailedLoginAttempts(user.id);
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw new Error(
      `Account locked due to too many failed login attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
    );
  }

  // Verify password
  const passwordValid = await comparePassword(data.password, user.password_hash);
  if (!passwordValid) {
    // Increment failed attempts
    const newAttempts = await incrementFailedLoginAttempts(user.id);

    logger.warn(
      { userId: user.id, email: user.email, attempts: newAttempts, ipAddress: ipAddress || 'unknown' },
      'Failed login attempt - invalid password'
    );

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      logger.warn(
        { userId: user.id, email: user.email, ipAddress: ipAddress || 'unknown' },
        'Account locked due to failed attempts'
      );
      throw new Error(
        `Account locked due to too many failed login attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
      );
    }

    throw new Error('Invalid email or password');
  }

  // Check for pending deletion
  if (user.deletion_requested_at) {
    const daysSinceRequest =
      (new Date().getTime() - user.deletion_requested_at.getTime()) /
      TIME_MS.DAY;

    if (daysSinceRequest >= 30) {
      // Grace period expired - proceed with deletion
      const { deleteExpiredAccounts } = await import('./user-service');
      await deleteExpiredAccounts();
      throw new Error('Account has been deleted.');
    } else {
      // Within grace period - show warning
      const daysRemaining = Math.ceil(30 - daysSinceRequest);
      logger.warn(
        { userId: user.id, daysRemaining },
        'User logging in with pending deletion'
      );
      // Allow login but application should show warning
    }
  }

  // Check user status
  if (user.status === UserStatus.SUSPENDED) {
    throw new Error('Account suspended. Please contact support.');
  }

  if (user.status === UserStatus.DELETED) {
    throw new Error('Account deleted.');
  }

  if (user.status === UserStatus.PENDING) {
    throw new Error('Please verify your email address before logging in.');
  }

  // Clear failed attempts on successful login
  await clearFailedLoginAttempts(user.id);

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role, user.email);
  // Note: refreshToken is generated in the route handler to set cookie

  // Update last login
  const updatedUser = await prisma.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  logger.info(
    { userId: user.id, email: user.email, ipAddress: ipAddress || 'unknown' },
    'User logged in successfully'
  );

  return {
    accessToken,
    user: toUserPublic(updatedUser),
  };
}

/**
 * Verify email address
 *
 * @param userId - User ID
 * @param token - Verification token
 * @returns Public user object
 */
export async function verifyEmail(
  userId: string,
  token: string
): Promise<UserPublic> {
  // Verify token
  const email = await verifyEmailVerificationToken(userId, token);
  if (!email) {
    throw new Error('Invalid or expired verification token');
  }

  // Update user
  const user = await prisma.users.update({
    where: { id: userId },
    data: {
      email_verified: true,
      status: UserStatus.ACTIVE,
    },
  });

  // Send welcome email
  try {
    await emailService.sendTemplatedEmail(
      'welcome',
      user.email,
      {
        userName: user.display_name,
      },
      user.language_preference as any
    );
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send welcome email');
  }

  logger.info({ userId, email }, 'Email verified');

  return toUserPublic(user);
}

/**
 * Resend verification email
 *
 * @param email - User email
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Silent failure - don't reveal if email exists
    return;
  }

  if (user.email_verified) {
    throw new Error('Email already verified');
  }

  // Generate new token
  const token = generateEmailToken();
  await storeEmailVerificationToken(user.id, user.email, token);

  // Send verification email
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('FRONTEND_URL must be set in production');
        })()
      : 'http://localhost:5173');
  const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}&userId=${user.id}`;

  try {
    await emailService.sendTemplatedEmail(
      'email_verification',
      user.email,
      {
        userName: user.display_name,
        verificationLink,
        expiryHours: 24,
      },
      user.language_preference as any
    );
  } catch (error) {
    logger.error({ error, userId: user.id }, 'Failed to resend verification email');
    throw new Error('Failed to send verification email');
  }

  logger.info({ userId: user.id, email: user.email }, 'Verification email resent');
}

/**
 * Initiate password reset
 *
 * @param email - User email
 */
export async function initiatePasswordReset(
  email: string,
  ipAddress?: string
): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Silent failure - don't reveal if email exists
    return;
  }

  // Generate reset token
  const token = generateEmailToken();
  await storePasswordResetToken(user.id, user.email, token);

  // Send reset email
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('FRONTEND_URL must be set in production');
        })()
      : 'http://localhost:5173');
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

  try {
    await emailService.sendTemplatedEmail(
      'password_reset',
      user.email,
      {
        userName: user.display_name,
        resetLink,
        expiryMinutes: 60,
        ipAddress: ipAddress || 'unknown',
        timestamp: new Date().toISOString(),
      },
      user.language_preference as any
    );
  } catch (error) {
    logger.error({ error, userId: user.id }, 'Failed to send password reset email');
    // Don't throw - silent failure
  }

  logger.info(
    { userId: user.id, email: user.email, ipAddress: ipAddress || 'unknown' },
    'Password reset initiated'
  );
}

/**
 * Complete password reset
 *
 * @param token - Reset token
 * @param newPassword - New password
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  ipAddress?: string
): Promise<void> {
  // Verify token
  const tokenData = await verifyPasswordResetToken(token);
  if (!tokenData) {
    throw new Error('Invalid or expired reset token');
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  await prisma.users.update({
    where: { id: tokenData.userId },
    data: { password_hash: passwordHash },
  });

  // Revoke all user sessions (force re-login)
  const { revokeAllUserSessions } = await import('./session-service');
  await revokeAllUserSessions(tokenData.userId);

  // Send confirmation email
  const user = await prisma.users.findUnique({
    where: { id: tokenData.userId },
  });

  if (user) {
    try {
      await emailService.sendTemplatedEmail(
        'password_changed',
        user.email,
        {
          userName: user.display_name,
        },
        user.language_preference as any
      );
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to send password changed email');
    }
  }

  logger.info(
    { userId: tokenData.userId, ipAddress: ipAddress || 'unknown' },
    'Password reset completed'
  );
}

/**
 * Validate password strength (exported for API validation)
 */
export { validatePasswordStrength };
