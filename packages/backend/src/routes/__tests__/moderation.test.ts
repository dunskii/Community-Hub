/**
 * Moderation Routes Tests
 * Phase 6: User Engagement Features
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Request, type Response, type NextFunction } from 'express';
import { moderationRouter } from '../moderation.js';
import { errorHandler } from '../../middleware/error-handler.js';

// Mock users for authenticated requests
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'USER',
};

const mockAdmin = {
  id: 'admin-789',
  email: 'admin@example.com',
  role: 'ADMIN',
};

const mockSuperAdmin = {
  id: 'super-admin-999',
  email: 'superadmin@example.com',
  role: 'SUPER_ADMIN',
};

// Mock auth middleware
vi.mock('../../middleware/auth-middleware.js', () => ({
  requireAuth: (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer user-token') {
      (req as any).user = mockUser;
      next();
    } else if (authHeader === 'Bearer admin-token') {
      (req as any).user = mockAdmin;
      next();
    } else if (authHeader === 'Bearer super-admin-token') {
      (req as any).user = mockSuperAdmin;
      next();
    } else {
      next();
    }
  },
}));

// Mock rbac middleware
vi.mock('../../middleware/rbac-middleware.js', () => ({
  requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
    }
    next();
  },
}));

// Mock moderation controller
vi.mock('../../controllers/moderation-controller.js', () => ({
  moderationController: {
    getModerationQueue: vi.fn((_req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          reviews: [
            {
              id: 'review-1',
              status: 'PENDING',
              rating: 5,
              content: 'Great business!',
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        },
      });
    }),
    approveReview: vi.fn((_req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          id: 'review-1',
          status: 'PUBLISHED',
        },
      });
    }),
    rejectReview: vi.fn((_req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          id: 'review-1',
          status: 'HIDDEN',
        },
      });
    }),
  },
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1', moderationRouter);
app.use(errorHandler);

describe('Moderation Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/admin/moderation/reviews', () => {
    test('returns moderation queue for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/reviews')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews).toHaveLength(1);
      expect(res.body.data.reviews[0].status).toBe('PENDING');
    });

    test('returns moderation queue for super admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/reviews')
        .set('Authorization', 'Bearer super-admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('denies access for regular user', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/reviews')
        .set('Authorization', 'Bearer user-token');

      expect(res.status).toBe(403);
    });

    test('denies access for unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/admin/moderation/reviews');

      expect(res.status).toBe(401);
    });

    test('accepts filter parameters', async () => {
      const res = await request(app)
        .get('/api/v1/admin/moderation/reviews')
        .set('Authorization', 'Bearer admin-token')
        .query({ status: 'PENDING', page: 1, limit: 20 });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/admin/moderation/reviews/:id/approve', () => {
    test('approves review for admin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/approve')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED');
    });

    test('approves review for super admin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/approve')
        .set('Authorization', 'Bearer super-admin-token');

      expect(res.status).toBe(200);
    });

    test('denies access for regular user', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/approve')
        .set('Authorization', 'Bearer user-token');

      expect(res.status).toBe(403);
    });

    test('denies access for unauthenticated request', async () => {
      const res = await request(app).post('/api/v1/admin/moderation/reviews/review-123/approve');

      expect(res.status).toBe(401);
    });

    test('accepts optional moderation notes', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/approve')
        .set('Authorization', 'Bearer admin-token')
        .send({
          notes: 'Review approved after verification.',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/admin/moderation/reviews/:id/reject', () => {
    test('rejects review for admin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/reject')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('HIDDEN');
    });

    test('rejects review for super admin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/reject')
        .set('Authorization', 'Bearer super-admin-token');

      expect(res.status).toBe(200);
    });

    test('denies access for regular user', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/reject')
        .set('Authorization', 'Bearer user-token');

      expect(res.status).toBe(403);
    });

    test('denies access for unauthenticated request', async () => {
      const res = await request(app).post('/api/v1/admin/moderation/reviews/review-123/reject');

      expect(res.status).toBe(401);
    });

    test('accepts rejection reason', async () => {
      const res = await request(app)
        .post('/api/v1/admin/moderation/reviews/review-123/reject')
        .set('Authorization', 'Bearer admin-token')
        .send({
          reason: 'Violates community guidelines.',
          userMessage: 'Please review our content policy.',
        });

      expect(res.status).toBe(200);
    });
  });

  describe('Authorization Levels', () => {
    const adminEndpoints = [
      { method: 'get', path: '/api/v1/admin/moderation/reviews' },
      { method: 'post', path: '/api/v1/admin/moderation/reviews/review-1/approve' },
      { method: 'post', path: '/api/v1/admin/moderation/reviews/review-1/reject' },
    ];

    adminEndpoints.forEach(({ method, path }) => {
      test(`${method.toUpperCase()} ${path} requires admin or super admin role`, async () => {
        // Regular user should be denied
        const userRes = await (request(app) as any)
          [method](path)
          .set('Authorization', 'Bearer user-token');

        expect(userRes.status).toBe(403);

        // Admin should be allowed
        const adminRes = await (request(app) as any)
          [method](path)
          .set('Authorization', 'Bearer admin-token');

        expect(adminRes.status).toBe(200);

        // Super admin should be allowed
        const superAdminRes = await (request(app) as any)
          [method](path)
          .set('Authorization', 'Bearer super-admin-token');

        expect(superAdminRes.status).toBe(200);
      });
    });
  });
});
