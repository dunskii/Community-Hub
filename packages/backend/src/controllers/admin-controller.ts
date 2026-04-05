/**
 * Admin Controller
 *
 * Handles admin dashboard, platform analytics, user management,
 * and business status management requests.
 * Spec §23: Administration & Moderation
 */

import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin-service.js';
import { sendSuccess, sendList } from '../utils/api-response.js';
import {
  adminAnalyticsQuerySchema,
  adminUsersQuerySchema,
  updateUserRoleSchema,
  suspendUserSchema,
  adminBusinessesQuerySchema,
  updateBusinessStatusSchema,
  adminEventsQuerySchema,
  createUserSchema,
  assignBusinessOwnerSchema,
  type OperatingHours,
} from '@community-hub/shared';
import { UserRole, BusinessStatus } from '../generated/prisma/index.js';
import { businessService } from '../services/business-service.js';
import { batchEnrichBusinesses } from '../services/maps/google-places-service.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  const val = Array.isArray(fwd) ? fwd[0] : fwd;
  return val || req.ip || '0.0.0.0';
}

function getClientUA(req: Request): string {
  const ua = req.headers['user-agent'];
  return (Array.isArray(ua) ? ua[0] : ua) || 'Unknown';
}

class AdminController {
  /**
   * GET /admin/dashboard
   */
  async getDashboardOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await adminService.getDashboardOverview();
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/analytics
   */
  async getPlatformAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = adminAnalyticsQuerySchema.parse(req.query);
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const analytics = await adminService.getPlatformAnalytics(startDate, endDate, query.granularity);
      sendSuccess(res, analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/analytics/export
   */
  async exportPlatformAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = adminAnalyticsQuerySchema.parse(req.query);
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const csv = await adminService.exportPlatformCSV(startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="platform-analytics-${query.startDate}-${query.endDate}.csv"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users
   */
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = adminUsersQuerySchema.parse(req.query);
      const { users, total } = await adminService.listUsers(query);
      sendList(res, users, { page: query.page, limit: query.limit, total });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/users/:id/role
   */
  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = updateUserRoleSchema.parse(req.body);
      const userId = req.params.id as string;
      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);

      await adminService.updateUserRole(userId, role as UserRole, adminId, ipAddress, userAgent);
      sendSuccess(res, { message: 'User role updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users/:id/suspend
   */
  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = suspendUserSchema.parse(req.body);
      const userId = req.params.id as string;
      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);

      await adminService.suspendUser(userId, reason, adminId, ipAddress, userAgent);
      sendSuccess(res, { message: 'User suspended successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/users/:id/unsuspend
   */
  async unsuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id as string;
      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);

      await adminService.unsuspendUser(userId, adminId, ipAddress, userAgent);
      sendSuccess(res, { message: 'User unsuspended successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/businesses
   */
  async listBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = adminBusinessesQuerySchema.parse(req.query);
      const { businesses, total } = await adminService.listBusinesses(query);
      sendList(res, businesses, { page: query.page, limit: query.limit, total });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/businesses/:id/status
   */
  async updateBusinessStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reason } = updateBusinessStatusSchema.parse(req.body);
      const businessId = req.params.id as string;
      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);

      await adminService.updateBusinessStatus(businessId, status as BusinessStatus, adminId, ipAddress, userAgent, reason);
      sendSuccess(res, { message: 'Business status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/events
   */
  async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = adminEventsQuerySchema.parse(req.query);
      const { events, total } = await adminService.listEvents(query);
      sendList(res, events, { page: query.page, limit: query.limit, total });
    } catch (error) {
      next(error);
    }
  }
  /**
   * POST /admin/users
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createUserSchema.parse(req.body);
      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);

      const user = await adminService.createUser(
        { email: data.email, password: data.password, displayName: data.displayName, role: data.role as UserRole },
        adminId,
        ipAddress,
        userAgent
      );
      sendSuccess(res, user, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /admin/businesses/:id/owner
   */
  async assignBusinessOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = assignBusinessOwnerSchema.parse(req.body);
      const businessId = req.params.id as string;
      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);

      await adminService.assignBusinessOwner(businessId, userId, adminId, ipAddress, userAgent);
      sendSuccess(res, { message: userId ? 'Business owner assigned' : 'Business owner removed' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/users/search
   */
  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || '';
      if (query.length < 2) {
        sendSuccess(res, []);
        return;
      }
      const users = await adminService.searchUsers(query, 10);
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/businesses/enrich
   * Enrich CSV rows with Google Places API data
   */
  async enrichBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enrichSchema = z.object({
        businesses: z.array(z.object({
          name: z.string().min(1),
          address: z.string().optional(),
          phone: z.string().optional(),
        })).min(1).max(100),
      });

      const { businesses } = enrichSchema.parse(req.body);

      const enriched = await batchEnrichBusinesses(
        businesses.map((b) => ({ name: b.name, address: b.address, phone: b.phone })),
      );

      sendSuccess(res, { enriched });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/businesses/bulk-import
   * Bulk create businesses from CSV data (with optional Google Places enrichment)
   */
  async bulkImportBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const importSchema = z.object({
        businesses: z.array(z.object({
          name: z.string().min(1).max(100),
          description: z.string().optional(),
          categoryPrimaryId: z.string().min(1),
          phone: z.string().min(1),
          email: z.string().email().optional().or(z.literal('')),
          website: z.string().url().optional().or(z.literal('')),
          street: z.string().min(1),
          suburb: z.string().min(1),
          state: z.string().min(1),
          postcode: z.string().min(1),
          country: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          operatingHours: z.record(z.object({ open: z.string(), close: z.string() })).optional(),
        })).min(1).max(100),
      });

      const { businesses } = importSchema.parse(req.body);

      const adminId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = getClientUA(req);
      const auditContext = { actorId: adminId, actorRole: req.user!.role, ipAddress, userAgent };

      const results: Array<{
        row: number;
        name: string;
        success: boolean;
        businessId?: string;
        error?: string;
      }> = [];

      for (const [i, row] of businesses.entries()) {
        try {
          const business = await businessService.createBusiness(
            {
              name: row.name,
              description: row.description ? { en: row.description } : { en: '' },
              categoryPrimaryId: row.categoryPrimaryId,
              phone: row.phone,
              email: row.email || undefined,
              website: row.website || undefined,
              address: {
                street: row.street,
                suburb: row.suburb,
                state: row.state,
                postcode: row.postcode,
                country: row.country || 'Australia',
              },
              operatingHours: row.operatingHours as OperatingHours | undefined,
            },
            auditContext,
          );

          results.push({
            row: i + 1,
            name: row.name,
            success: true,
            businessId: business.id as string,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          logger.warn({ error: err, row: i + 1, name: row.name }, 'Bulk import row failed');
          results.push({ row: i + 1, name: row.name, success: false, error: message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      sendSuccess(res, { results, summary: { total: businesses.length, success: successCount, failed: failCount } });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
