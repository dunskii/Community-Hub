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
 */
router.get('/categories', apiRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, parent, active } = req.query;

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
      },
    });

    sendSuccess(res, categories);
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
