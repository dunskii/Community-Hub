/**
 * Admin Routes
 * RESTful API endpoints for platform administration.
 * Spec §23: Administration & Moderation, Appendix B.20
 */

import { Router } from 'express';
import { adminController } from '../controllers/admin-controller.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { requireRole } from '../middleware/rbac-middleware.js';

const router: ReturnType<typeof Router> = Router();

const curatorAndAdminAuth = [requireAuth, requireRole(['CURATOR', 'ADMIN', 'SUPER_ADMIN'])];
const adminOnlyAuth = [requireAuth, requireRole(['ADMIN', 'SUPER_ADMIN'])];

// ─── Dashboard ──────────────────────────────────────────────

router.get('/admin/dashboard', ...curatorAndAdminAuth, adminController.getDashboardOverview.bind(adminController));

// ─── Platform Analytics (Admin only - not available to Curators) ──

router.get('/admin/analytics', ...adminOnlyAuth, adminController.getPlatformAnalytics.bind(adminController));
router.get('/admin/analytics/export', ...adminOnlyAuth, adminController.exportPlatformAnalytics.bind(adminController));

// ─── User Management ────────────────────────────────────────

router.get('/admin/users', ...curatorAndAdminAuth, adminController.listUsers.bind(adminController));
router.get('/admin/users/search', ...curatorAndAdminAuth, adminController.searchUsers.bind(adminController));
router.post('/admin/users', ...curatorAndAdminAuth, adminController.createUser.bind(adminController));
router.put('/admin/users/:id/role', ...curatorAndAdminAuth, adminController.updateUserRole.bind(adminController));
router.post('/admin/users/:id/suspend', ...curatorAndAdminAuth, adminController.suspendUser.bind(adminController));
router.post('/admin/users/:id/unsuspend', ...curatorAndAdminAuth, adminController.unsuspendUser.bind(adminController));

// ─── Business Management ────────────────────────────────────

router.get('/admin/businesses', ...curatorAndAdminAuth, adminController.listBusinesses.bind(adminController));
router.put('/admin/businesses/:id/status', ...curatorAndAdminAuth, adminController.updateBusinessStatus.bind(adminController));
router.put('/admin/businesses/:id/owner', ...curatorAndAdminAuth, adminController.assignBusinessOwner.bind(adminController));

// ─── Event Management ───────────────────────────────────────

router.get('/admin/events', ...curatorAndAdminAuth, adminController.listEvents.bind(adminController));

export { router as adminRouter };
