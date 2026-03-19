/**
 * Category Routes
 * API endpoints for category management
 * Spec Appendix B.16: Category Endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db/index.js';
import { sendSuccess, sendError } from '../utils/api-response.js';
import { apiRateLimiter } from '../middleware/rate-limiter.js';

const router: ReturnType<typeof Router> = Router();

/**
 * GET /categories
 * List all categories with optional filtering
 * Public access
 *
 * Query params:
 * - type: Filter by category type
 * - parent: Filter by parent ID ('null' for top-level)
 * - active: Filter by active status
 * - withBusinesses: Only return categories that have businesses (true/false)
 */
router.get('/categories', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, parent, active, withBusinesses } = req.query;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (parent) {
      where.parentId = parent === 'null' ? null : parent;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    } else {
      // Default: only show active categories
      where.active = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        _count: {
          select: {
            businesses: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    // Calculate business counts including children
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        // Get direct business count
        let businessCount = category._count.businesses;

        // If this is a parent category, also count businesses in child categories
        if (category.children && category.children.length > 0) {
          const childIds = category.children.map(c => c.id);
          const childBusinessCount = await prisma.business.count({
            where: {
              categoryPrimaryId: { in: childIds },
              status: 'ACTIVE',
            },
          });
          businessCount += childBusinessCount;
        }

        // Return category with businessCount, omitting _count
        const { _count, ...categoryData } = category;
        return {
          ...categoryData,
          businessCount,
        };
      })
    );

    // Filter to only categories with businesses if requested
    const filteredCategories = withBusinesses === 'true'
      ? categoriesWithCounts.filter(cat => cat.businessCount > 0)
      : categoriesWithCounts;

    sendSuccess(res, filteredCategories);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /categories/:id
 * Get single category by ID
 * Public access
 */
router.get('/categories/:id', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: id as string },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    if (!category) {
      sendError(res, 'CATEGORY_NOT_FOUND', 'Category not found', 404);
      return;
    }

    sendSuccess(res, category);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /categories/:id/businesses
 * Get all businesses for a category
 * Public access
 */
router.get(
  '/categories/:id/businesses',
  apiRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = '1', limit = '20', sort } = req.query;

      const pageNum = Number(page);
      const limitNum = Math.min(Number(limit), 100);
      const skip = (pageNum - 1) * limitNum;

      // Check if category exists
      const category = await prisma.category.findUnique({
        where: { id: id as string },
      });

      if (!category) {
        sendError(res, 'CATEGORY_NOT_FOUND', 'Category not found', 404);
        return;
      }

      // Build orderBy clause
      const orderBy: Record<string, string>[] = [];
      if (sort) {
        const sortField = (sort as string).replace(/^[-+]/, '');
        const sortDirection = (sort as string).startsWith('-') ? 'desc' : 'asc';
        orderBy.push({ [sortField]: sortDirection });
      } else {
        orderBy.push({ createdAt: 'desc' });
      }

      // Get businesses and total count
      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where: {
            categoryPrimaryId: id as string,
            status: 'ACTIVE',
          },
          skip,
          take: limitNum,
          orderBy,
          include: {
            categoryPrimary: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.business.count({
          where: {
            categoryPrimaryId: id as string,
            status: 'ACTIVE',
          },
        }),
      ]);

      sendSuccess(res, {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        businesses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
