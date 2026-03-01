/**
 * Business Service
 * Handles CRUD operations, geocoding, search indexing, and audit logging for businesses
 */

import type {
  BusinessCreateInput,
  BusinessUpdateInput,
  BusinessStatus,
} from '@community-hub/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/index.js';
import { geocodeAddress } from './maps/geocoding-service.js';
import { getEsClient } from '../search/index.js';
import { seoService } from './seo-service.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

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
    const category = await prisma.category.findUnique({
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
    const business = await prisma.business.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        categoryPrimaryId: data.categoryPrimaryId,
        categoriesSecondary: data.categoriesSecondary || [],
        address: address as Prisma.JsonValue,
        phone: data.phone,
        email: data.email,
        website: data.website,
        secondaryPhone: data.secondaryPhone,
        operatingHours: data.operatingHours as Prisma.JsonValue,
        socialLinks: data.socialLinks as Prisma.JsonValue,
        languagesSpoken: data.languagesSpoken || [],
        certifications: data.certifications || [],
        paymentMethods: data.paymentMethods || [],
        accessibilityFeatures: data.accessibilityFeatures || [],
        priceRange: data.priceRange,
        parkingInformation: data.parkingInformation,
        yearEstablished: data.yearEstablished,
        status: 'PENDING', // Default status - admin must approve
        claimed: false,
      },
      include: {
        categoryPrimary: true,
        claimedByUser: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Index in Elasticsearch (async, don't block)
    this.indexBusiness(business.id).catch((error) => {
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
    const business = await prisma.business.findUnique({
      where: { id },
      include: includeRelations
        ? {
            categoryPrimary: true,
            claimedByUser: {
              select: {
                id: true,
                displayName: true,
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
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        categoryPrimary: true,
        claimedByUser: {
          select: {
            id: true,
            displayName: true,
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
      where.categoryPrimaryId = filters.category;
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
      const sortField = options.sortBy === 'name' ? 'name' : 'createdAt';
      const sortDirection = options.sortOrder === 'asc' ? 'asc' : 'desc';
      orderBy.push({ [sortField]: sortDirection });
    } else {
      // Default sort: newest first
      orderBy.push({ createdAt: 'desc' });
    }

    // Get businesses and total count
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
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
      prisma.business.count({ where }),
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
    const existingBusiness = await prisma.business.findUnique({
      where: { id },
    });

    if (!existingBusiness) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // If address changed, re-geocode
    let address = existingBusiness.address as Record<string, unknown>;

    if (data.address) {
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
      } catch (error) {
        logger.warn(
          { error, address: data.address },
          'Geocoding failed during update, keeping old coordinates'
        );
        address = {
          ...data.address,
          latitude: (existingBusiness.address as Record<string, unknown>).latitude || 0,
          longitude: (existingBusiness.address as Record<string, unknown>).longitude || 0,
        };
      }
    }

    // Update business
    const business = await prisma.business.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        categoryPrimaryId: data.categoryPrimaryId,
        categoriesSecondary: data.categoriesSecondary,
        address: address as Prisma.JsonValue,
        phone: data.phone,
        email: data.email,
        website: data.website,
        secondaryPhone: data.secondaryPhone,
        operatingHours: data.operatingHours as Prisma.JsonValue,
        socialLinks: data.socialLinks as Prisma.JsonValue,
        languagesSpoken: data.languagesSpoken,
        certifications: data.certifications,
        paymentMethods: data.paymentMethods,
        accessibilityFeatures: data.accessibilityFeatures,
        priceRange: data.priceRange,
        parkingInformation: data.parkingInformation,
        yearEstablished: data.yearEstablished,
      },
      include: {
        categoryPrimary: true,
        claimedByUser: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    // Re-index in Elasticsearch (async)
    this.indexBusiness(id).catch((error) => {
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
    const existingBusiness = await prisma.business.findUnique({
      where: { id },
    });

    if (!existingBusiness) {
      throw ApiError.notFound('BUSINESS_NOT_FOUND', 'Business not found');
    }

    // Soft delete: set status to DELETED
    await prisma.business.update({
      where: { id },
      data: {
        status: 'DELETED',
      },
    });

    // Remove from Elasticsearch index (async)
    this.removeFromIndex(id).catch((error) => {
      logger.error({ error, businessId: id }, 'Failed to remove business from Elasticsearch');
    });

    // Log audit trail
    await this.logBusinessChange(auditContext, 'delete', id, existingBusiness, null);
  }

  /**
   * Indexes a business in Elasticsearch
   */
  private async indexBusiness(businessId: string): Promise<void> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          categoryPrimary: true,
        },
      });

      if (!business || business.status === 'DELETED') {
        return;
      }

      const esClient = getEsClient();
      const address = business.address as Record<string, unknown>;

      await esClient.index({
        index: 'businesses',
        id: businessId,
        document: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          description: business.description,
          category_primary: business.categoryPrimaryId,
          categories_secondary: business.categoriesSecondary,
          suburb: address.suburb,
          postcode: address.postcode,
          location: {
            lat: address.latitude,
            lon: address.longitude,
          },
          status: business.status,
          created_at: business.createdAt,
        },
      });

      logger.debug({ businessId }, 'Business indexed in Elasticsearch');
    } catch (error) {
      logger.error({ error, businessId }, 'Failed to index business');
      throw error;
    }
  }

  /**
   * Removes a business from Elasticsearch index
   */
  private async removeFromIndex(businessId: string): Promise<void> {
    try {
      const esClient = getEsClient();
      await esClient.delete({
        index: 'businesses',
        id: businessId,
      });

      logger.debug({ businessId }, 'Business removed from Elasticsearch');
    } catch (error) {
      // Ignore 404 errors (document not found)
      if ((error as { statusCode?: number }).statusCode !== 404) {
        logger.error({ error, businessId }, 'Failed to remove business from index');
        throw error;
      }
    }
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
      await prisma.auditLog.create({
        data: {
          actorId: auditContext.actorId,
          actorRole: auditContext.actorRole as Prisma.JsonValue,
          action: `business.${action}`,
          targetType: 'Business',
          targetId: businessId,
          previousValue: (previousValue || undefined) as Prisma.JsonValue,
          newValue: (newValue || undefined) as Prisma.JsonValue,
          ipAddress: auditContext.ipAddress || '0.0.0.0',
          userAgent: auditContext.userAgent || 'unknown',
        },
      });
    } catch (error) {
      // Log error but don't fail the operation
      logger.error({ error, businessId, action }, 'Failed to create audit log entry');
    }
  }
}

export const businessService = new BusinessService();
