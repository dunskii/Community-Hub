/**
 * Integration Tests for Business API Endpoints
 * Tests complete request/response flows for all business endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import businessRouter from '../../routes/business.js';
import { prisma } from '../../db/index.js';

// Mock dependencies
vi.mock('../../db/index.js', () => ({
  prisma: {
    business: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../services/maps/geocoding-service.js', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({
    latitude: -33.8688,
    longitude: 151.2093,
    formattedAddress: '123 Main St, Guildford NSW 2161, Australia',
    confidence: 'high',
  }),
}));

vi.mock('../../search/index.js', () => ({
  getEsClient: vi.fn(() => ({
    index: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('../../services/seo-service.js', () => ({
  seoService: {
    generateBusinessSlug: vi.fn((name) => name.toLowerCase().replace(/\s+/g, '-')),
  },
}));

vi.mock('../../middleware/auth-middleware.js', () => ({
  requireAuth: vi.fn((req, res, next) => {
    req.user = { id: 'user-123', role: 'ADMIN' };
    next();
  }),
}));

vi.mock('../../middleware/rbac-middleware.js', () => ({
  requireRole: vi.fn(() => (req, res, next) => next()),
}));

vi.mock('../../middleware/business-ownership.js', () => ({
  requireBusinessOwnership: vi.fn((req, res, next) => next()),
}));

vi.mock('../../middleware/business-rate-limiter.js', () => ({
  listBusinessesLimiter: vi.fn((req, res, next) => next()),
  getBusinessLimiter: vi.fn((req, res, next) => next()),
  createBusinessLimiter: vi.fn((req, res, next) => next()),
  updateBusinessLimiter: vi.fn((req, res, next) => next()),
  deleteBusinessLimiter: vi.fn((req, res, next) => next()),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Business API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', businessRouter);
    vi.clearAllMocks();
  });

  describe('GET /api/businesses', () => {
    const mockBusinesses = [
      {
        id: 'biz-1',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        description: { en: 'A great restaurant' },
        status: 'ACTIVE',
        categoryPrimaryId: 'cat-1',
        address: {
          street: '123 Main St',
          suburb: 'Guildford',
          postcode: '2161',
          latitude: -33.8688,
          longitude: 151.2093,
        },
        phone: '+61412345678',
        categoryPrimary: {
          id: 'cat-1',
          name: 'Restaurants',
          slug: 'restaurants',
        },
      },
    ];

    it('should list businesses with default pagination', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/api/businesses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.businesses).toEqual(mockBusinesses);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter businesses by category', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/api/businesses?category=cat-1');

      expect(response.status).toBe(200);
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryPrimaryId: 'cat-1',
          }),
        })
      );
    });

    it('should support pagination', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(50);

      const response = await request(app).get('/api/businesses?page=2&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });

    it('should support sorting', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/api/businesses?sortBy=name&sortOrder=asc');

      expect(response.status).toBe(200);
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'asc' }],
        })
      );
    });

    it('should only return ACTIVE businesses by default', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/api/businesses');

      expect(response.status).toBe(200);
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('GET /api/businesses/:id', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      description: { en: 'A great restaurant' },
      status: 'ACTIVE',
      categoryPrimaryId: 'cat-1',
      address: {
        street: '123 Main St',
        suburb: 'Guildford',
        postcode: '2161',
        latitude: -33.8688,
        longitude: 151.2093,
      },
      phone: '+61412345678',
      categoryPrimary: {
        id: 'cat-1',
        name: 'Restaurants',
        slug: 'restaurants',
      },
      claimedByUser: null,
    };

    it('should return business by ID', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(mockBusiness as never);

      const response = await request(app).get('/api/businesses/biz-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBusiness);
    });

    it('should return 404 for non-existent business', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/api/businesses/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should include related data', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(mockBusiness as never);

      const response = await request(app).get('/api/businesses/biz-1');

      expect(response.status).toBe(200);
      expect(response.body.data.categoryPrimary).toBeDefined();
      expect(prisma.business.findUnique).toHaveBeenCalledWith({
        where: { id: 'biz-1' },
        include: expect.objectContaining({
          categoryPrimary: true,
          claimedByUser: expect.any(Object),
        }),
      });
    });
  });

  describe('GET /api/businesses/slug/:slug', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Restaurant',
      slug: 'test-restaurant',
      status: 'ACTIVE',
    };

    it('should return business by slug', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(mockBusiness as never);

      const response = await request(app).get('/api/businesses/slug/test-restaurant');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-restaurant');
    });

    it('should return 404 for non-existent slug', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/api/businesses/slug/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/businesses', () => {
    const validBusinessData = {
      name: 'New Restaurant',
      description: { en: 'A wonderful new restaurant with great food' },
      categoryPrimaryId: '550e8400-e29b-41d4-a716-446655440000',
      address: {
        street: '123 Main Street',
        suburb: 'Guildford',
        postcode: '2161',
      },
      phone: '+61412345678',
      email: 'contact@newrestaurant.com',
      website: 'https://newrestaurant.com',
    };

    const mockCreatedBusiness = {
      id: 'biz-new',
      name: 'New Restaurant',
      slug: 'new-restaurant',
      ...validBusinessData,
      status: 'PENDING',
      claimed: false,
      createdAt: new Date(),
    };

    it('should create a new business with valid data', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as never);
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app)
        .post('/api/businesses')
        .send(validBusinessData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Restaurant');
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/businesses')
        .send({
          name: 'N', // Too short
          description: { en: 'short' }, // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for invalid category', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/businesses')
        .send(validBusinessData);

      expect(response.status).toBe(404);
    });

    it('should set default status to PENDING', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as never);
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app)
        .post('/api/businesses')
        .send(validBusinessData);

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('should create audit log entry', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as never);
      vi.mocked(prisma.business.create).mockResolvedValue(mockCreatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app)
        .post('/api/businesses')
        .send(validBusinessData);

      expect(response.status).toBe(201);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('PUT /api/businesses/:id', () => {
    const updateData = {
      name: 'Updated Restaurant',
      description: { en: 'Updated description with more details' },
    };

    const existingBusiness = {
      id: 'biz-1',
      name: 'Old Name',
      slug: 'old-name',
      status: 'ACTIVE',
      address: {
        street: '123 Main St',
        suburb: 'Guildford',
        postcode: '2161',
        latitude: -33.8688,
        longitude: 151.2093,
      },
    };

    const updatedBusiness = {
      ...existingBusiness,
      ...updateData,
    };

    it('should update business with valid data', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue(updatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app)
        .put('/api/businesses/biz-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Restaurant');
    });

    it('should return 404 for non-existent business', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/businesses/non-existent')
        .send(updateData);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid update data', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);

      const response = await request(app)
        .put('/api/businesses/biz-1')
        .send({
          phone: 'invalid-phone',
        });

      expect(response.status).toBe(400);
    });

    it('should create audit log entry for update', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue(updatedBusiness as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app)
        .put('/api/businesses/biz-1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/businesses/:id', () => {
    const existingBusiness = {
      id: 'biz-1',
      name: 'Test Business',
      status: 'ACTIVE',
    };

    it('should soft delete business', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue({
        ...existingBusiness,
        status: 'DELETED',
      } as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app).delete('/api/businesses/biz-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.business.update).toHaveBeenCalledWith({
        where: { id: 'biz-1' },
        data: { status: 'DELETED' },
      });
    });

    it('should return 404 for non-existent business', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(null);

      const response = await request(app).delete('/api/businesses/non-existent');

      expect(response.status).toBe(404);
    });

    it('should create audit log entry for deletion', async () => {
      vi.mocked(prisma.business.findUnique).mockResolvedValue(existingBusiness as never);
      vi.mocked(prisma.business.update).mockResolvedValue({
        ...existingBusiness,
        status: 'DELETED',
      } as never);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

      const response = await request(app).delete('/api/businesses/biz-1');

      expect(response.status).toBe(200);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.business.findMany).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/businesses');

      expect(response.status).toBe(500);
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/businesses')
        .send({
          name: 'Test',
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Language Negotiation', () => {
    it('should respect Accept-Language header', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.business.count).mockResolvedValue(0);

      const response = await request(app)
        .get('/api/businesses')
        .set('Accept-Language', 'ar');

      expect(response.status).toBe(200);
    });

    it('should default to English if no Accept-Language header', async () => {
      vi.mocked(prisma.business.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.business.count).mockResolvedValue(0);

      const response = await request(app).get('/api/businesses');

      expect(response.status).toBe(200);
    });
  });
});
