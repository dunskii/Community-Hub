/**
 * Unit tests for Category Routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import categoryRouter from './category.js';
import { prisma } from '../db/index.js';

// Mock dependencies
vi.mock('../db/index.js', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    business: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../middleware/rate-limiter.js', () => ({
  apiRateLimiter: vi.fn((req, res, next) => next()),
}));

describe('Category Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', categoryRouter);
    vi.clearAllMocks();
  });

  describe('GET /categories', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Restaurants',
        slug: 'restaurants',
        type: 'BUSINESS',
        icon: '🍽️',
        active: true,
        displayOrder: 0,
        parentId: null,
        parent: null,
        children: [],
      },
      {
        id: 'cat-2',
        name: 'Cafes',
        slug: 'cafes',
        type: 'BUSINESS',
        icon: '☕',
        active: true,
        displayOrder: 1,
        parentId: null,
        parent: null,
        children: [],
      },
    ];

    it('should list all active categories', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

      const response = await request(app).get('/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: expect.any(Object),
      });
    });

    it('should filter categories by type', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

      const response = await request(app).get('/categories?type=BUSINESS');

      expect(response.status).toBe(200);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'BUSINESS',
            active: true,
          }),
        })
      );
    });

    it('should filter categories by parent ID', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

      const response = await request(app).get('/categories?parent=cat-1');

      expect(response.status).toBe(200);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: 'cat-1',
          }),
        })
      );
    });

    it('should filter for top-level categories (parent=null)', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

      const response = await request(app).get('/categories?parent=null');

      expect(response.status).toBe(200);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: null,
          }),
        })
      );
    });

    it('should include inactive categories when active=false', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

      const response = await request(app).get('/categories?active=false');

      expect(response.status).toBe(200);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: false,
          }),
        })
      );
    });

    it('should include children in response', async () => {
      const categoriesWithChildren = [
        {
          ...mockCategories[0],
          children: [
            {
              id: 'cat-3',
              name: 'Fast Food',
              slug: 'fast-food',
              icon: '🍔',
            },
          ],
        },
      ];

      vi.mocked(prisma.category.findMany).mockResolvedValue(categoriesWithChildren as never);

      const response = await request(app).get('/categories');

      expect(response.status).toBe(200);
      expect(response.body.data[0].children).toHaveLength(1);
    });
  });

  describe('GET /categories/:id', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Restaurants',
      slug: 'restaurants',
      type: 'BUSINESS',
      icon: '🍽️',
      active: true,
      displayOrder: 0,
      parentId: null,
      parent: null,
      children: [],
    };

    it('should return a category by ID', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never);

      const response = await request(app).get('/categories/cat-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: expect.any(Object),
      });
    });

    it('should return 404 for non-existent category', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/categories/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('GET /categories/:id/businesses', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Restaurants',
      slug: 'restaurants',
    };

    const mockBusinesses = [
      {
        id: 'biz-1',
        name: 'Pizza Place',
        slug: 'pizza-place',
        categoryPrimaryId: 'cat-1',
        status: 'ACTIVE',
        categoryPrimary: mockCategory,
      },
    ];

    it('should return businesses for a category', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/categories/cat-1/businesses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toEqual(mockCategory);
      expect(response.body.data.businesses).toEqual(mockBusinesses);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should return 404 for non-existent category', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const response = await request(app).get('/categories/non-existent/businesses');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('should handle pagination correctly', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(50);

      const response = await request(app).get('/categories/cat-1/businesses?page=2&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should enforce maximum limit of 100', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(200);

      const response = await request(app).get('/categories/cat-1/businesses?limit=500');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(100);
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should support custom sorting', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/categories/cat-1/businesses?sort=-name');

      expect(response.status).toBe(200);
      expect(prisma.business.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ name: 'desc' }],
        })
      );
    });

    it('should only return ACTIVE businesses', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(prisma.business.findMany).mockResolvedValue(mockBusinesses as never);
      vi.mocked(prisma.business.count).mockResolvedValue(1);

      const response = await request(app).get('/categories/cat-1/businesses');

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
});
