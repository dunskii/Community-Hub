/**
 * User Service
 *
 * Handles user profile management, preferences, and account operations.
 * Spec §12: Community User Features
 */

import { prisma } from '../db/index';
import { users } from '../generated/prisma';
import { EmailService } from '../email/email-service';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { UserPublic, NotificationPreferences } from '../types/auth';
import { logger } from '../utils/logger';
import { TIME_MS } from '../constants/time';

const emailService = new EmailService();

// Re-export User type with proper name
export type User = users;

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
    notificationPreferences: user.notification_preferences as NotificationPreferences | null,
    receiveDealEmails: user.receive_deal_emails,
    receiveEventEmails: user.receive_event_emails,
    role: user.role,
    status: user.status,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLogin: user.last_login,
  };
}

/**
 * Get user by ID
 *
 * @param userId - User ID
 * @returns Public user object or null
 */
export async function getUserById(userId: string): Promise<UserPublic | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  return toUserPublic(user);
}

/**
 * Update user profile
 *
 * Allowed fields: displayName, bio, suburb, languagePreference, interests
 * Cannot change: email, role, status (admin only)
 *
 * @param userId - User ID
 * @param data - Update data
 * @returns Updated user object
 */
export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    bio?: string;
    suburb?: string;
    languagePreference?: string;
    interests?: string[];
  }
): Promise<UserPublic> {
  // Transform camelCase to snake_case
  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData['display_name'] = data.displayName;
  if (data.bio !== undefined) updateData['bio'] = data.bio;
  if (data.suburb !== undefined) updateData['suburb'] = data.suburb;
  if (data.languagePreference !== undefined) updateData['language_preference'] = data.languagePreference;
  if (data.interests !== undefined) updateData['interests'] = data.interests;

  const user = await prisma.users.update({
    where: { id: userId },
    data: updateData,
  });

  logger.info({ userId }, 'User profile updated');

  return toUserPublic(user);
}

/**
 * Update user profile photo
 *
 * @param userId - User ID
 * @param imageBuffer - Image buffer from multer
 * @returns Updated user object
 */
export async function updateProfilePhoto(
  userId: string,
  imageBuffer: Buffer
): Promise<UserPublic> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Get current user to check for existing photo
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Process image
  const { processProfilePhoto, validateImageDimensions } = await import(
    '../utils/image-processor'
  );

  const isValid = await validateImageDimensions(imageBuffer);
  if (!isValid) {
    throw new Error('Image must be at least 100x100 pixels');
  }

  const processedImage = await processProfilePhoto(imageBuffer);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'profiles');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    logger.error({ error }, 'Failed to create uploads directory');
  }

  // Save to disk
  const filename = `${userId}.webp`;
  const filepath = path.join(uploadsDir, filename);

  try {
    await fs.writeFile(filepath, processedImage);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to save profile photo');
    throw new Error('Failed to save profile photo');
  }

  // Delete old photo if exists and is different
  if (user.profile_photo && user.profile_photo !== `/uploads/profiles/${filename}`) {
    const oldPath = path.join(process.cwd(), user.profile_photo.replace(/^\//, ''));
    try {
      await fs.unlink(oldPath);
    } catch (error) {
      // Old file might not exist, ignore error
      logger.debug({ error, oldPath }, 'Could not delete old profile photo');
    }
  }

  // Update user record
  const photoUrl = `/uploads/profiles/${filename}`;
  const updatedUser = await prisma.users.update({
    where: { id: userId },
    data: { profile_photo: photoUrl },
  });

  logger.info({ userId, photoUrl }, 'Profile photo updated');

  return toUserPublic(updatedUser);
}

/**
 * Delete user profile photo
 *
 * @param userId - User ID
 * @returns Updated user object
 */
export async function deleteProfilePhoto(userId: string): Promise<UserPublic> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Get current user
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.profile_photo) {
    throw new Error('No profile photo to delete');
  }

  // Delete file from disk
  const filepath = path.join(process.cwd(), user.profile_photo.replace(/^\//, ''));
  try {
    await fs.unlink(filepath);
  } catch (error) {
    // File might not exist, log but don't fail
    logger.warn({ error, filepath }, 'Could not delete profile photo file');
  }

  // Update user record
  const updatedUser = await prisma.users.update({
    where: { id: userId },
    data: { profile_photo: null },
  });

  logger.info({ userId }, 'Profile photo deleted');

  return toUserPublic(updatedUser);
}

/**
 * Change user password
 *
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @param currentSessionId - Current session ID to exclude from revocation
 * @param ipAddress - Client IP address for logging
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  currentSessionId?: string,
  ipAddress?: string
): Promise<void> {
  // Get user with password hash
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const passwordValid = await comparePassword(currentPassword, user.password_hash);
  if (!passwordValid) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await prisma.users.update({
    where: { id: userId },
    data: { password_hash: passwordHash },
  });

  // Revoke all user sessions except current one (force re-login on other devices)
  const { revokeAllUserSessions } = await import('./session-service');
  await revokeAllUserSessions(userId, currentSessionId);

  // Send confirmation email
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
    logger.error({ error, userId }, 'Failed to send password changed email');
  }

  logger.info(
    { userId, ipAddress: ipAddress || 'unknown' },
    'Password changed by user'
  );
}

/**
 * Change user email
 *
 * Sets pendingEmail and sends verification email to new address.
 * Email is not changed until user verifies the new address.
 *
 * @param userId - User ID
 * @param newEmail - New email address
 */
export async function changeEmail(
  userId: string,
  newEmail: string,
  ipAddress?: string
): Promise<void> {
  // Check if email is already taken
  const existingUser = await prisma.users.findUnique({
    where: { email: newEmail.toLowerCase() },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new Error('Email already in use');
  }

  // Get current user
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Set pending email (don't change actual email yet)
  await prisma.users.update({
    where: { id: userId },
    data: {
      pending_email: newEmail.toLowerCase(),
    },
  });

  // Generate verification token
  const { generateEmailToken, storeEmailVerificationToken } = await import(
    './token-service'
  );
  const token = generateEmailToken();
  await storeEmailVerificationToken(userId, newEmail, token);

  // Send verification email to NEW address
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('FRONTEND_URL must be set in production');
        })()
      : 'http://localhost:5173');
  const verificationLink = `${frontendUrl}/auth/verify-email-change?token=${token}&userId=${userId}`;

  try {
    await emailService.sendTemplatedEmail(
      'email_verification',
      newEmail.toLowerCase(),
      {
        userName: user.display_name,
        verificationLink,
        expiryHours: 24,
      },
      user.language_preference as any
    );
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send email change verification');
    throw new Error('Failed to send verification email');
  }

  logger.info(
    { userId, oldEmail: user.email, newEmail, ipAddress: ipAddress || 'unknown' },
    'Email change requested'
  );
}

/**
 * Verify email change
 *
 * Confirms the new email address and updates user record.
 *
 * @param userId - User ID
 * @param token - Verification token
 * @returns Updated user object
 */
export async function verifyEmailChange(
  userId: string,
  token: string
): Promise<UserPublic> {
  // Verify token
  const { verifyEmailVerificationToken } = await import('./token-service');
  const email = await verifyEmailVerificationToken(userId, token);
  if (!email) {
    throw new Error('Invalid or expired verification token');
  }

  // Get user
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify that the token matches the pending email
  if (!user.pending_email || user.pending_email !== email.toLowerCase()) {
    throw new Error('Verification token does not match pending email');
  }

  const oldEmail = user.email;

  // Update email and clear pending email
  const updatedUser = await prisma.users.update({
    where: { id: userId },
    data: {
      email: user.pending_email,
      pending_email: null,
      email_verified: true,
    },
  });

  // Send confirmation email to both old and new addresses
  try {
    await emailService.sendTemplatedEmail(
      'password_changed', // TODO: Create email_changed template
      oldEmail,
      {
        userName: user.display_name,
      },
      user.language_preference as any
    );

    await emailService.sendTemplatedEmail(
      'password_changed', // TODO: Create email_changed template
      updatedUser.email,
      {
        userName: user.display_name,
      },
      user.language_preference as any
    );
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send email change confirmation');
  }

  logger.info(
    { userId, oldEmail, newEmail: updatedUser.email },
    'Email change verified and completed'
  );

  return toUserPublic(updatedUser);
}

/**
 * Update notification preferences
 *
 * @param userId - User ID
 * @param preferences - Notification preferences
 * @returns Updated user object
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences & { receiveDealEmails?: boolean; receiveEventEmails?: boolean }
): Promise<UserPublic> {
  const updateData: Record<string, unknown> = {
    notification_preferences: preferences as any,
  };

  if (preferences.receiveDealEmails !== undefined) {
    updateData['receive_deal_emails'] = preferences.receiveDealEmails;
  }
  if (preferences.receiveEventEmails !== undefined) {
    updateData['receive_event_emails'] = preferences.receiveEventEmails;
  }

  const user = await prisma.users.update({
    where: { id: userId },
    data: updateData,
  });

  logger.info({ userId }, 'Notification preferences updated');

  return toUserPublic(user);
}

/**
 * Request account deletion
 *
 * Sets deletionRequestedAt and schedules cleanup after 30 days.
 *
 * @param userId - User ID
 */
export async function requestAccountDeletion(
  userId: string,
  ipAddress?: string
): Promise<void> {
  const user = await prisma.users.update({
    where: { id: userId },
    data: {
      deletion_requested_at: new Date(),
    },
  });

  // Send confirmation email with cancellation link
  // const frontendUrl =
  //   process.env.FRONTEND_URL ||
  //   (process.env.NODE_ENV === 'production'
  //     ? (() => {
  //         throw new Error('FRONTEND_URL must be set in production');
  //       })()
  //     : 'http://localhost:5173');
  // const cancelLink = `${frontendUrl}/account/cancel-deletion`;

  try {
    await emailService.sendTemplatedEmail(
      'password_changed', // TODO: Create account_deletion template
      user.email,
      {
        userName: user.display_name,
      } as any,
      user.language_preference as any
    );
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send account deletion email');
  }

  logger.info(
    { userId, ipAddress: ipAddress || 'unknown' },
    'Account deletion requested'
  );
}

/**
 * Cancel account deletion
 *
 * Cancels deletion if within 30-day grace period.
 *
 * @param userId - User ID
 */
export async function cancelAccountDeletion(userId: string): Promise<void> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.deletion_requested_at) {
    throw new Error('No deletion request found');
  }

  // Check if within grace period (30 days)
  const now = new Date();
  const daysSinceRequest =
    (now.getTime() - user.deletion_requested_at.getTime()) / TIME_MS.DAY;

  if (daysSinceRequest >= 30) {
    throw new Error('Grace period has expired');
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      deletion_requested_at: null,
    },
  });

  logger.info({ userId }, 'Account deletion cancelled');
}

/**
 * Delete expired accounts
 *
 * Permanently deletes user accounts where deletionRequestedAt is >= 30 days ago.
 * Should be called by a scheduled job.
 *
 * @returns Number of accounts deleted
 */
export async function deleteExpiredAccounts(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * TIME_MS.DAY);

  // Find users scheduled for deletion
  const usersToDelete = await prisma.users.findMany({
    where: {
      deletion_requested_at: {
        lte: thirtyDaysAgo,
      },
    },
  });

  // Send final confirmation emails
  for (const user of usersToDelete) {
    try {
      await emailService.sendTemplatedEmail(
        'password_changed', // TODO: Create account_deleted template
        user.email,
        {
          userName: user.display_name,
        },
        user.language_preference as any
      );
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to send account deleted email');
    }
  }

  // Delete users (cascade will handle related records)
  const result = await prisma.users.deleteMany({
    where: {
      deletion_requested_at: {
        lte: thirtyDaysAgo,
      },
    },
  });

  logger.info({ count: result.count }, 'Expired accounts deleted');

  return result.count;
}
