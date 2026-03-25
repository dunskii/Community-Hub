/**
 * Admin User Service
 *
 * User listing, creation, role management, and suspension.
 * Spec §23: Administration & Moderation
 */

import { prisma } from '../../db/index.js';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/api-error.js';
import { UserRole, UserStatus } from '../../generated/prisma/index.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import type { AdminUserListItem, AdminActionContext } from './admin-types.js';

export class AdminUserService {
  /**
   * List all users with filtering and pagination
   */
  async listUsers(options: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    search?: string;
    sort?: string;
  }): Promise<{ users: AdminUserListItem[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (options.role) where.role = options.role;
    if (options.status) where.status = options.status;
    if (options.search) {
      where.OR = [
        { display_name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (options.sort) {
      case 'oldest': orderBy.created_at = 'asc'; break;
      case 'name': orderBy.display_name = 'asc'; break;
      case 'lastLogin': orderBy.last_login = 'desc'; break;
      default: orderBy.created_at = 'desc';
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          display_name: true,
          profile_photo: true,
          role: true,
          status: true,
          email_verified: true,
          created_at: true,
          last_login: true,
          _count: { select: { businesses: true } },
        },
        orderBy,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.users.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.display_name,
        profilePhoto: u.profile_photo,
        role: u.role,
        status: u.status,
        emailVerified: u.email_verified,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        businessCount: u._count.businesses,
      })),
      total,
    };
  }

  /**
   * Create a new user (admin action)
   * Creates user with ACTIVE status and verified email (no verification needed)
   */
  async createUser(
    data: { email: string; password: string; displayName: string; role: UserRole },
    ctx: AdminActionContext
  ): Promise<{ id: string; email: string; displayName: string; role: UserRole }> {
    // Check email uniqueness
    const existing = await prisma.users.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      throw ApiError.conflict('EMAIL_EXISTS', 'A user with this email already exists');
    }

    if (data.role === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('CANNOT_ASSIGN_SUPER_ADMIN', 'Cannot assign SUPER_ADMIN role through this endpoint');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = crypto.randomUUID();
    const now = new Date();

    await prisma.$transaction([
      prisma.users.create({
        data: {
          id: userId,
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          display_name: data.displayName,
          role: data.role,
          status: UserStatus.ACTIVE,
          email_verified: true,
          created_at: now,
          updated_at: now,
        },
      }),
      prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: ctx.adminId,
          actor_role: 'ADMIN',
          action: 'user.create',
          target_type: 'User',
          target_id: userId,
          new_value: { email: data.email.toLowerCase(), role: data.role },
          ip_address: ctx.ipAddress,
          user_agent: ctx.userAgent,
        },
      }),
    ]);

    logger.info({ userId, email: data.email, role: data.role }, 'Admin created new user');

    return { id: userId, email: data.email.toLowerCase(), displayName: data.displayName, role: data.role };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, newRole: UserRole, ctx: AdminActionContext): Promise<void> {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');

    if (newRole === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('CANNOT_ASSIGN_SUPER_ADMIN', 'Cannot assign SUPER_ADMIN role through this endpoint');
    }

    const previousRole = user.role;

    await prisma.$transaction([
      prisma.users.update({ where: { id: userId }, data: { role: newRole, updated_at: new Date() } }),
      prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: ctx.adminId,
          actor_role: 'ADMIN',
          action: 'user.role_change',
          target_type: 'User',
          target_id: userId,
          previous_value: { role: previousRole },
          new_value: { role: newRole },
          ip_address: ctx.ipAddress,
          user_agent: ctx.userAgent,
        },
      }),
    ]);
  }

  /**
   * Suspend a user
   */
  async suspendUser(userId: string, reason: string, ctx: AdminActionContext): Promise<void> {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, status: true, role: true } });
    if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    if (user.role === UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('CANNOT_SUSPEND_SUPER_ADMIN', 'Cannot suspend a SUPER_ADMIN');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw ApiError.conflict('ALREADY_SUSPENDED', 'User is already suspended');
    }

    await prisma.$transaction([
      prisma.users.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED, updated_at: new Date() } }),
      prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: ctx.adminId,
          actor_role: 'ADMIN',
          action: 'user.suspend',
          target_type: 'User',
          target_id: userId,
          previous_value: { status: user.status },
          new_value: { status: 'SUSPENDED' },
          reason,
          ip_address: ctx.ipAddress,
          user_agent: ctx.userAgent,
        },
      }),
    ]);
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId: string, ctx: AdminActionContext): Promise<void> {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!user) throw ApiError.notFound('USER_NOT_FOUND', 'User not found');
    if (user.status !== UserStatus.SUSPENDED) {
      throw ApiError.conflict('NOT_SUSPENDED', 'User is not suspended');
    }

    await prisma.$transaction([
      prisma.users.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE, updated_at: new Date() } }),
      prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: ctx.adminId,
          actor_role: 'ADMIN',
          action: 'user.unsuspend',
          target_type: 'User',
          target_id: userId,
          previous_value: { status: 'SUSPENDED' },
          new_value: { status: 'ACTIVE' },
          ip_address: ctx.ipAddress,
          user_agent: ctx.userAgent,
        },
      }),
    ]);
  }

  /**
   * Search users by email or display name (for owner assignment autocomplete)
   */
  async searchUsers(query: string, limit = 10): Promise<Array<{ id: string; email: string; displayName: string; role: string }>> {
    const users = await prisma.users.findMany({
      where: {
        status: UserStatus.ACTIVE,
        OR: [
          { email: { contains: query.toLowerCase(), mode: 'insensitive' } },
          { display_name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, email: true, display_name: true, role: true },
      take: limit,
      orderBy: { display_name: 'asc' },
    });

    return users.map((u) => ({ id: u.id, email: u.email, displayName: u.display_name, role: u.role }));
  }
}
