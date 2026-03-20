import { getEsClient } from './elasticsearch-client.js';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import type { businesses, Prisma } from '../generated/prisma/index.js';
import { BusinessStatus } from '../generated/prisma/index.js';

// Re-export Business type for compatibility
export type Business = businesses;

const INDEX_NAME = 'businesses';

interface BusinessAddress {
  suburb?: string;
  latitude?: number;
  longitude?: number;
}

interface ElasticsearchError extends Error {
  meta?: {
    statusCode?: number;
  };
}

interface BulkResponseItem {
  index?: {
    error?: unknown;
    _id?: string;
  };
}

/**
 * Index a single business document in Elasticsearch
 */
export async function indexBusiness(business: Business): Promise<void> {
  const client = getEsClient();

  try {
    // Only index active businesses
    if (business.status !== BusinessStatus.ACTIVE) {
      logger.debug(`Skipping indexing for non-active business: ${business.id}`);
      return;
    }

    // Parse address JSON
    const address = business.address as Prisma.JsonValue as BusinessAddress | null;

    const document = {
      id: business.id,
      name: business.name,
      description: business.description,
      categorySlug: business.category_primary_id, // Will be resolved to slug in query builder
      suburb: address?.suburb || '',
      location: {
        lat: address?.latitude || 0,
        lon: address?.longitude || 0,
      },
      rating: 0, // TODO: Calculate from reviews in Phase 6
      reviewCount: 0, // TODO: Calculate from reviews in Phase 6
      status: business.status,
      verified: business.verified_at !== null,
      featured: business.featured,
      languagesSpoken: business.languages_spoken,
      certifications: business.certifications,
      accessibilityFeatures: business.accessibility_features,
      priceRange: business.price_range,
      createdAt: business.created_at,
      updatedAt: business.updated_at,
    };

    await client.index({
      index: INDEX_NAME,
      id: business.id,
      document,
    });

    logger.info(`Indexed business in Elasticsearch: ${business.id}`);
  } catch (error) {
    logger.error({ error, businessId: business.id }, `Failed to index business ${business.id}`);
    // Don't throw - graceful degradation per Spec Section 27.5
  }
}

/**
 * Remove a business document from Elasticsearch
 */
export async function deindexBusiness(businessId: string): Promise<void> {
  const client = getEsClient();

  try {
    await client.delete({
      index: INDEX_NAME,
      id: businessId,
    });

    logger.info(`Deindexed business from Elasticsearch: ${businessId}`);
  } catch (error) {
    // Ignore 404 errors (document doesn't exist)
    const esError = error as ElasticsearchError;
    if (esError.meta?.statusCode !== 404) {
      logger.error({ error, businessId }, `Failed to deindex business ${businessId}`);
    }
  }
}

/**
 * Bulk reindex all businesses
 * Use for initial setup or full refresh
 */
export async function bulkReindexBusinesses(): Promise<void> {
  const client = getEsClient();

  try {
    // Fetch all active businesses
    const businesses = await prisma.businesses.findMany({
      where: { status: BusinessStatus.ACTIVE },
    });

    if (businesses.length === 0) {
      logger.info('No active businesses to index');
      return;
    }

    logger.info(`Starting bulk reindex of ${businesses.length} businesses...`);

    // Build bulk operations
    const operations: unknown[] = [];
    for (const business of businesses) {
      const address = business.address as Prisma.JsonValue as BusinessAddress | null;

      operations.push({ index: { _index: INDEX_NAME, _id: business.id } });
      operations.push({
        id: business.id,
        name: business.name,
        description: business.description,
        categorySlug: business.category_primary_id,
        suburb: address?.suburb || '',
        location: {
          lat: address?.latitude || 0,
          lon: address?.longitude || 0,
        },
        rating: 0,
        reviewCount: 0,
        status: business.status,
        verified: business.verified_at !== null,
        featured: business.featured,
        languagesSpoken: business.languages_spoken,
        certifications: business.certifications,
        accessibilityFeatures: business.accessibility_features,
        priceRange: business.price_range,
        createdAt: business.created_at,
        updatedAt: business.updated_at,
      });
    }

    // Execute bulk operation
    const result = await client.bulk({
      operations,
      refresh: true,
    });

    if (result.errors) {
      const errorCount = result.items.filter((item) => (item as BulkResponseItem).index?.error).length;
      logger.error(`Bulk indexing completed with ${errorCount} errors`);
      result.items.forEach((item) => {
        const bulkItem = item as BulkResponseItem;
        if (bulkItem.index?.error) {
          logger.error({ error: bulkItem.index.error, businessId: bulkItem.index._id }, `Failed to index ${bulkItem.index._id}`);
        }
      });
    } else {
      logger.info(`Successfully bulk indexed ${businesses.length} businesses`);
    }
  } catch (error) {
    logger.error({ error }, 'Bulk reindex failed');
    throw error;
  }
}

/**
 * Refresh index to make changes searchable immediately
 */
export async function refreshIndex(): Promise<void> {
  const client = getEsClient();

  try {
    await client.indices.refresh({ index: INDEX_NAME });
    logger.info('Refreshed Elasticsearch index');
  } catch (error) {
    logger.error({ error }, 'Failed to refresh index');
  }
}
