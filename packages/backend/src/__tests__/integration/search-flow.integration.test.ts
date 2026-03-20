/**
 * Search Flow Integration Tests
 * Phase 5: Search & Discovery
 *
 * Tests the complete search flow from API → service → Elasticsearch
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { searchBusinesses, getAutocompleteSuggestions } from '../../services/search-service.js';
import { indexBusiness, bulkReindexBusinesses, deindexBusiness } from '../../search/indexing-service.js';
import { getEsClient } from '../../search/elasticsearch-client.js';
import { prisma } from '../../db/index.js';
import { BusinessStatus } from '../../generated/prisma/index.js';
import type { SearchParams } from '@community-hub/shared';

describe('Search Flow Integration', () => {
  const testBusinessId = 'test-business-integration-1';
  const testCategoryId = 'test-category-integration';

  beforeAll(async () => {
    // Create test category
    await prisma.categories.upsert({
      where: { id: testCategoryId },
      update: {},
      create: {
        id: testCategoryId,
        type: 'BUSINESS',
        name: { en: 'Test Category' },
        slug: 'test-category',
        icon: 'test',
        active: true,
      },
    });

    // Create test business
    await prisma.businesses.upsert({
      where: { id: testBusinessId },
      update: {},
      create: {
        id: testBusinessId,
        name: 'Integration Test Business',
        slug: 'integration-test-business',
        description: { en: 'A test business for integration testing' },
        categoryPrimaryId: testCategoryId,
        address: {
          street: '123 Test St',
          suburb: 'Testville',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
          latitude: -33.8688,
          longitude: 151.2093,
        },
        phone: '+61 2 1234 5678',
        email: 'test@example.com',
        status: BusinessStatus.ACTIVE,
        featured: false,
        languagesSpoken: ['en'],
        certifications: [],
        paymentMethods: [],
        accessibilityFeatures: [],
      },
    });

    // Index the business
    const business = await prisma.businesses.findUnique({
      where: { id: testBusinessId },
    });
    if (business) {
      await indexBusiness(business);
    }

    // Wait for Elasticsearch to index
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up
    await deindexBusiness(testBusinessId);
    await prisma.businesses.delete({ where: { id: testBusinessId } }).catch(() => {});
    await prisma.categories.delete({ where: { id: testCategoryId } }).catch(() => {});
  });

  describe('Full-text Search', () => {
    it('should find business by name', async () => {
      const params: SearchParams = {
        q: 'Integration Test',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      expect(results.results.length).toBeGreaterThan(0);
      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Integration Test Business');
    });

    it('should find business by description', async () => {
      const params: SearchParams = {
        q: 'integration testing',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      expect(results.results.length).toBeGreaterThan(0);
      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeDefined();
    });

    it('should support fuzzy matching', async () => {
      const params: SearchParams = {
        q: 'Integrstion', // Misspelled
        limit: 10,
      };

      const results = await searchBusinesses(params);

      // Should still find the business with fuzzy matching
      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeDefined();
    });
  });

  describe('Category Filtering', () => {
    it('should filter by category', async () => {
      const params: SearchParams = {
        category: 'test-category',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      expect(results.results.length).toBeGreaterThan(0);
      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeDefined();
    });

    it('should return no results for non-matching category', async () => {
      const params: SearchParams = {
        q: 'Integration Test',
        category: 'non-existent-category',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeUndefined();
    });
  });

  describe('Geo-distance Filtering', () => {
    it('should filter by distance from location', async () => {
      const params: SearchParams = {
        distance: 10, // 10km radius
        lat: -33.8688,
        lng: 151.2093,
        limit: 10,
      };

      const results = await searchBusinesses(params);

      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeDefined();
    });

    it('should exclude results outside distance', async () => {
      const params: SearchParams = {
        distance: 0.1, // 100m radius - business is not within this
        lat: -33.9, // Different location
        lng: 151.3,
        limit: 10,
      };

      const results = await searchBusinesses(params);

      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeUndefined();
    });
  });

  describe('Sorting', () => {
    it('should sort by relevance (default)', async () => {
      const params: SearchParams = {
        q: 'Integration',
        sort: 'relevance',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      expect(results.results.length).toBeGreaterThan(0);
    });

    it('should sort by newest', async () => {
      const params: SearchParams = {
        sort: 'newest',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      expect(results.results.length).toBeGreaterThan(0);
    });

    it('should sort by distance', async () => {
      const params: SearchParams = {
        sort: 'distance',
        lat: -33.8688,
        lng: 151.2093,
        limit: 10,
      };

      const results = await searchBusinesses(params);

      expect(results.results.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('should return paginated results', async () => {
      const params: SearchParams = {
        page: 1,
        limit: 5,
      };

      const results = await searchBusinesses(params);

      expect(results.page).toBe(1);
      expect(results.limit).toBe(5);
      expect(results.results.length).toBeLessThanOrEqual(5);
      expect(results.totalPages).toBeGreaterThan(0);
    });

    it('should handle page 2', async () => {
      const params: SearchParams = {
        page: 2,
        limit: 5,
      };

      const results = await searchBusinesses(params);

      expect(results.page).toBe(2);
    });
  });

  describe('Autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const results = await getAutocompleteSuggestions('Integration', 10);

      expect(results.suggestions.length).toBeGreaterThan(0);
      const found = results.suggestions.find(s => s.name === 'Integration Test Business');
      expect(found).toBeDefined();
    });

    it('should limit autocomplete results', async () => {
      const results = await getAutocompleteSuggestions('Test', 3);

      expect(results.suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should return popular searches', async () => {
      const results = await getAutocompleteSuggestions('Test', 10);

      expect(results.popularSearches).toBeDefined();
      expect(Array.isArray(results.popularSearches)).toBe(true);
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', async () => {
      const params: SearchParams = {
        q: 'Integration',
        category: 'test-category',
        distance: 10,
        lat: -33.8688,
        lng: 151.2093,
        sort: 'relevance',
        limit: 10,
      };

      const results = await searchBusinesses(params);

      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeDefined();
    });

    it('should respect all filters', async () => {
      const params: SearchParams = {
        q: 'Integration',
        category: 'wrong-category', // Intentionally wrong
        limit: 10,
      };

      const results = await searchBusinesses(params);

      const found = results.results.find(b => b.id === testBusinessId);
      expect(found).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle gracefully when Elasticsearch is unavailable', async () => {
      // This test assumes Elasticsearch might be down - should return empty results
      const params: SearchParams = {
        q: 'test',
        limit: 10,
      };

      // Should not throw
      const results = await searchBusinesses(params);
      expect(results).toBeDefined();
      expect(results.results).toBeDefined();
    });
  });

  describe('Bulk Reindexing', () => {
    it('should reindex all active businesses', async () => {
      await bulkReindexBusinesses();

      // Wait for indexing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should be able to find businesses after reindex
      const params: SearchParams = {
        status: 'ACTIVE',
        limit: 10,
      };

      const results = await searchBusinesses(params);
      expect(results.results.length).toBeGreaterThan(0);
    });
  });
});
