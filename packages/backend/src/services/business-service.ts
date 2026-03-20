/**
 * Business Service
 * Handles CRUD operations, geocoding, search indexing, and audit logging for businesses
 */

import type {
  BusinessCreateInput,
  BusinessUpdateInput,
  BusinessStatus,
} from '@community-hub/shared';
import { Prisma, ActorRole } from '../generated/prisma/index.js';
import { prisma } from '../db/index.js';
import { geocodeAddress } from './maps/geocoding-service.js';
import { indexBusiness, deindexBusiness } from '../search/indexing-service.js';
import { seoService } from './seo-service.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';
import crypto from 'crypto';

export interface BusinessListFilters {
  category?: string; // Category ID
  status?: BusinessStatus;
  openNow?: boolean;
  search?: string;
}

export interface BusinessListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditContext {
  actorId: string;
  actorRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export class BusinessService {
  /**
   * Creates a new business with geocoding and search indexing
   */
  async createBusiness(
    data: BusinessCreateInput,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    // Validate category exists
    const category = await prisma.categories.findUnique({
      where: { id: data.categoryPrimaryId },
    });

    if (!category) {
      throw ApiError.notFound('CATEGORY_NOT_FOUND', 'Category not found');
    }

    // Generate unique slug
    const slug = await seoService.generateBusinessSlug(data.name);

    // Geocode address to get coordinates
    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const geocodeResult = await geocodeAddress({
        street: data.address.street,
        suburb: data.address.suburb,
        postcode: data.address.postcode,
        country: data.address.country || 'Australia',
      });

      latitude = geocodeResult.latitude;
      longitude = geocodeResult.longitude;
    } catch (error) {
      logger.warn(
        { error, address: data.address },
        'Geocoding failed, creating business without coordinates'
      );
      // Continue without coordinates - can be geocoded later
    }

    // Prepare address with coordinates
    const address = {
      ...data.address,
      latitude: latitude || 0,
      longitude: longitude || 0,
    };

    // Create business in database
    const business = await prisma.businesses.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        slug,
        description: data.description as Prisma.InputJsonValue,
        category_primary_id: data.categoryPrimaryId,
        categories_secondary: data.categoriesSecondary || [],
        address: address as Prisma.InputJsonValue,
        phone: data.phone,
        email: data.email,
        website: data.website,
        secondary_phone: data.secondaryPhone,
        operating_hours: data.operatingHours as unknown as Prisma.InputJsonValue,
        languages_spoken: data.languagesSpoken || [],
        certifications: data.certifications || [],
        payment_methods: data.paymentMethods || [],
        accessibility_features: data.accessibilityFeatures || [],
        price_range: data.priceRange,
        parking_information: data.parkingInformation,
        year_established: data.yearEstablished,
        status: 'PENDING', // Default status - admin must approve
        claimed: false,
        updated_at: new Date(),
      },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    // Index in Elasticsearch (async, don't block)
    indexBusiness(business).catch((error) => {
      logger.error({ error, businessId: business.id }, 'Failed to index business in Elasticsearch');
    });

    // Log audit trail
    await this.logBusinessChange(auditContext, 'create', business.id, null, business);

    return business;
  }

  /**
   * Gets a business by ID
   */
  async getBusinessById(id: string, includeRelations: boolean = true): Promise<Record<string, unknown> | null> {
    const business = await prisma.businesses.findUnique({
      where: { id },
      include: includeRelations
        ? {
            categories: true,
            users: {
              select: {
                id: true,
                display_name: true,
                email: true,
              },
            },
          }
        : undefined,
    });

    return business;
  }

  /**
   * Gets a business by slug (for SEO URLs)
   */
  async getBusinessBySlug(slug: string): Promise<Record<string, unknown> | null> {
    const business = await prisma.businesses.findUnique({
      where: { slug },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    return business;
  }

  /**
   * Lists businesses with pagination and filtering
   */
  async listBusinesses(
    filters: BusinessListFilters = {},
    options: BusinessListOptions = {}
  ): Promise<{
    businesses: Record<string, unknown>[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.category) {
      // Check if this is a parent category with children
      const category = await prisma.categories.findUnique({
        where: { id: filters.category },
        include: {
          other_categories: {
            select: { id: true },
          },
        },
      });

      if (category && category.other_categories && category.other_categories.length > 0) {
        // Parent category - include all child category IDs
        const categoryIds = [filters.category, ...category.other_categories.map((c: { id: string }) => c.id)];
        where.category_primary_id = { in: categoryIds };
      } else {
        // Leaf category or not found - filter by exact ID
        where.category_primary_id = filters.category;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    } else {
      // Default: only show active businesses
      where.status = 'ACTIVE';
    }

    // Build orderBy clause
    const orderBy: Record<string, string>[] = [];
    if (options.sortBy) {
      const sortField = options.sortBy === 'name' ? 'name' : 'created_at';
      const sortDirection = options.sortOrder === 'asc' ? 'asc' : 'desc';
      orderBy.push({ [sortField]: sortDirection });
    } else {
      // Default sort: newest first
      orderBy.push({ created_at: 'desc' });
    }

    // Get businesses and total count
    const [businesses, total] = await Promise.all([
      prisma.businesses.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.businesses.count({ where }),
    ]);

    return {
      businesses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Updates a business
   */
  async updateBusiness(
    id: string,
    data: BusinessUpdateInput,
    auditContext: AuditContext
  ): Promise<Record<string, unknown>> {
    // Get existing business for audit log
    const existingBusiness = await prisma.businesses.findUnique({
      where: { id },
    });

    if (!existingBusiness) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // If address changed, re-geocode
    let address = existingBusiness.address as Record<string, unknown>;

    if (data.address) {
      logger.info({ address: data.address }, 'Attempting to geocode address for business update');
      try {
        const geocodeResult = await geocodeAddress({
          street: data.address.street,
          suburb: data.address.suburb,
          postcode: data.address.postcode,
          country: data.address.country || 'Australia',
        });

        address = {
          ...data.address,
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude,
        };
        logger.info({ latitude: geocodeResult.latitude, longitude: geocodeResult.longitude }, 'Geocoding successful');
      } catch (error) {
        const existingLat = (existingBusiness.address as Record<string, unknown>).latitude;
        const existingLng = (existingBusiness.address as Record<string, unknown>).longitude;
        logger.warn(
          { error, address: data.address, existingLat, existingLng },
          'Geocoding failed during update, keeping old coordinates'
        );
        address = {
          ...data.address,
          latitude: existingLat || 0,
          longitude: existingLng || 0,
        };
      }
    }

    // Update business
    const business = await prisma.businesses.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description as Prisma.InputJsonValue,
        category_primary_id: data.categoryPrimaryId,
        categories_secondary: data.categoriesSecondary,
        address: address as Prisma.InputJsonValue,
        phone: data.phone,
        email: data.email,
        website: data.website,
        secondary_phone: data.secondaryPhone,
        operating_hours: data.operatingHours as unknown as Prisma.InputJsonValue,
        languages_spoken: data.languagesSpoken,
        certifications: data.certifications,
        payment_methods: data.paymentMethods,
        accessibility_features: data.accessibilityFeatures,
        price_range: data.priceRange,
        parking_information: data.parkingInformation,
        year_established: data.yearEstablished,
        updated_at: new Date(),
      },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            display_name: true,
            email: true,
          },
        },
      },
    });

    // Re-index in Elasticsearch (async)
    indexBusiness(business).catch((error) => {
      logger.error({ error, businessId: id }, 'Failed to re-index business in Elasticsearch');
    });

    // Log audit trail
    await this.logBusinessChange(auditContext, 'update', id, existingBusiness, business);

    return business;
  }

  /**
   * Soft deletes a business (sets status to DELETED)
   */
  async deleteBusiness(id: string, auditContext: AuditContext): Promise<void> {
    // Get business for audit log
    const existingBusiness = await prisma.businesses.findUnique({
      where: { id },
    });

    if (!existingBusiness) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Soft delete: set status to DELETED
    await prisma.businesses.update({
      where: { id },
      data: {
        status: 'DELETED',
        updated_at: new Date(),
      },
    });

    // Remove from Elasticsearch index (async)
    deindexBusiness(id).catch((error) => {
      logger.error({ error, businessId: id }, 'Failed to remove business from Elasticsearch');
    });

    // Log audit trail
    await this.logBusinessChange(auditContext, 'delete', id, existingBusiness, null);
  }

  /**
   * Logs business changes to audit trail
   */
  private async logBusinessChange(
    auditContext: AuditContext,
    action: 'create' | 'update' | 'delete',
    businessId: string,
    previousValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null
  ): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          actor_id: auditContext.actorId,
          actor_role: auditContext.actorRole as ActorRole,
          action: `business.${action}`,
          target_type: 'Business',
          target_id: businessId,
          previous_value: previousValue as Prisma.InputJsonValue ?? Prisma.DbNull,
          new_value: newValue as Prisma.InputJsonValue ?? Prisma.DbNull,
          ip_address: auditContext.ipAddress || '0.0.0.0',
          user_agent: auditContext.userAgent || 'unknown',
        },
      });
    } catch (error) {
      // Log error but don't fail the operation
      logger.error({ error, businessId, action }, 'Failed to create audit log entry');
    }
  }
}

export const businessService = new BusinessService();
