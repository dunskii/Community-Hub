/**
 * Query Builder Tests
 * Phase 5: Search & Discovery
 */

import { describe, test, expect } from 'vitest';
import { buildSearchQuery, buildAutocompleteQuery } from '../query-builder.js';

describe('buildSearchQuery', () => {
  describe('Full-text search', () => {
    test('builds basic text search query', () => {
      const query = buildSearchQuery({ q: 'pizza' });

      expect(query.body.query.bool.must[0].multi_match.query).toBe('pizza');
      expect(query.body.query.bool.must[0].multi_match.fields).toContain('name^3');
      expect(query.body.query.bool.must[0].multi_match.fields).toContain('categorySlug^2');
      expect(query.body.query.bool.must[0].multi_match.fields).toContain('description');
    });

    test('enables fuzzy matching for queries >3 chars', () => {
      const query = buildSearchQuery({ q: 'pizza' });

      expect(query.body.query.bool.must[0].multi_match.fuzziness).toBe('AUTO');
    });

    test('disables fuzzy matching for queries <=3 chars', () => {
      const query = buildSearchQuery({ q: 'piz' });

      expect(query.body.query.bool.must[0].multi_match.fuzziness).toBeUndefined();
    });

    test('trims whitespace from query', () => {
      const query = buildSearchQuery({ q: '  pizza  ' });

      expect(query.body.query.bool.must[0].multi_match.query).toBe('pizza');
    });
  });

  describe('Status filter', () => {
    test('always filters by ACTIVE status', () => {
      const query = buildSearchQuery({ q: 'pizza' });

      expect(query.body.query.bool.filter).toContainEqual({
        term: { status: 'ACTIVE' },
      });
    });
  });

  describe('Category filter', () => {
    test('applies single category filter', () => {
      const query = buildSearchQuery({ q: 'pizza', category: 'restaurants' });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { categorySlug: ['restaurants'] },
      });
    });

    test('applies multiple category filters', () => {
      const query = buildSearchQuery({ q: 'food', category: ['restaurants', 'cafes'] });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { categorySlug: ['restaurants', 'cafes'] },
      });
    });
  });

  describe('Distance filter', () => {
    test('applies geo-distance filter', () => {
      const query = buildSearchQuery({
        q: 'pizza',
        distance: 2,
        lat: -33.9366,
        lng: 150.6966,
      });

      expect(query.body.query.bool.filter).toContainEqual({
        geo_distance: {
          distance: '2km',
          location: { lat: -33.9366, lon: 150.6966 },
        },
      });
    });

    test('skips distance filter without lat/lng', () => {
      const query = buildSearchQuery({ q: 'pizza', distance: 2 });

      const hasGeoFilter = query.body.query.bool.filter.some(
        (f: any) => f.geo_distance !== undefined
      );
      expect(hasGeoFilter).toBe(false);
    });
  });

  describe('Rating filter', () => {
    test('applies rating filter', () => {
      const query = buildSearchQuery({ rating: 4 });

      expect(query.body.query.bool.filter).toContainEqual({
        range: { rating: { gte: 4 } },
      });
    });
  });

  describe('Languages filter', () => {
    test('applies languages filter', () => {
      const query = buildSearchQuery({ languages: ['en', 'ar'] });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { languagesSpoken: ['en', 'ar'] },
      });
    });
  });

  describe('Price range filter', () => {
    test('applies price range filter', () => {
      const query = buildSearchQuery({ priceRange: [1, 2] });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { priceRange: ['BUDGET', 'MODERATE'] },
      });
    });

    test('converts numeric price ranges to enum values', () => {
      const query = buildSearchQuery({ priceRange: [3, 4] });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { priceRange: ['PREMIUM', 'LUXURY'] },
      });
    });
  });

  describe('Certifications filter', () => {
    test('applies certifications filter', () => {
      const query = buildSearchQuery({ certifications: ['halal', 'organic'] });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { certifications: ['halal', 'organic'] },
      });
    });
  });

  describe('Accessibility features filter', () => {
    test('applies accessibility features filter', () => {
      const query = buildSearchQuery({ accessibilityFeatures: ['wheelchair', 'hearing-loop'] });

      expect(query.body.query.bool.filter).toContainEqual({
        terms: { accessibilityFeatures: ['wheelchair', 'hearing-loop'] },
      });
    });
  });

  describe('Verified only filter', () => {
    test('applies verified only filter', () => {
      const query = buildSearchQuery({ verifiedOnly: true });

      expect(query.body.query.bool.filter).toContainEqual({
        term: { verified: true },
      });
    });

    test('skips verified filter when false', () => {
      const query = buildSearchQuery({ verifiedOnly: false });

      const hasVerifiedFilter = query.body.query.bool.filter.some(
        (f: any) => f.term?.verified !== undefined
      );
      expect(hasVerifiedFilter).toBe(false);
    });
  });

  describe('Sort options', () => {
    test('sorts by relevance (default)', () => {
      const query = buildSearchQuery({ q: 'pizza' });

      expect(query.body.sort).toEqual([{ _score: 'desc' }]);
    });

    test('sorts by rating', () => {
      const query = buildSearchQuery({ q: 'pizza', sort: 'rating' });

      expect(query.body.sort).toEqual([{ rating: 'desc' }, { reviewCount: 'desc' }]);
    });

    test('sorts by distance', () => {
      const query = buildSearchQuery({
        q: 'pizza',
        sort: 'distance',
        lat: -33.9366,
        lng: 150.6966,
      });

      expect(query.body.sort[0]._geo_distance).toBeDefined();
      expect(query.body.sort[0]._geo_distance.location).toEqual({
        lat: -33.9366,
        lon: 150.6966,
      });
      expect(query.body.sort[0]._geo_distance.order).toBe('asc');
    });

    test('throws error for distance sort without location', () => {
      expect(() => {
        buildSearchQuery({ q: 'pizza', sort: 'distance' });
      }).toThrow('User location required for distance sort');
    });

    test('sorts by reviews', () => {
      const query = buildSearchQuery({ sort: 'reviews' });

      expect(query.body.sort).toEqual([{ reviewCount: 'desc' }]);
    });

    test('sorts by updated', () => {
      const query = buildSearchQuery({ sort: 'updated' });

      expect(query.body.sort).toEqual([{ updatedAt: 'desc' }]);
    });

    test('sorts by name', () => {
      const query = buildSearchQuery({ sort: 'name' });

      expect(query.body.sort).toEqual([{ 'name.keyword': 'asc' }]);
    });

    test('sorts by newest', () => {
      const query = buildSearchQuery({ sort: 'newest' });

      expect(query.body.sort).toEqual([{ createdAt: 'desc' }]);
    });
  });

  describe('Pagination', () => {
    test('calculates pagination correctly', () => {
      const query = buildSearchQuery({ q: 'pizza', page: 3, limit: 20 });

      expect(query.body.from).toBe(40); // (3-1) * 20
      expect(query.body.size).toBe(20);
    });

    test('defaults to page 1 and limit 20', () => {
      const query = buildSearchQuery({ q: 'pizza' });

      expect(query.body.from).toBe(0);
      expect(query.body.size).toBe(20);
    });

    test('caps limit at 100', () => {
      const query = buildSearchQuery({ q: 'pizza', limit: 200 });

      expect(query.body.size).toBe(100);
    });
  });

  describe('Highlighting', () => {
    test('includes highlight configuration', () => {
      const query = buildSearchQuery({ q: 'pizza' });

      expect(query.body.highlight).toBeDefined();
      expect(query.body.highlight.fields.name).toBeDefined();
      expect(query.body.highlight.fields.description).toBeDefined();
      expect(query.body.highlight.pre_tags).toEqual(['<em>']);
      expect(query.body.highlight.post_tags).toEqual(['</em>']);
    });
  });

  describe('Combined filters', () => {
    test('combines multiple filters with AND logic', () => {
      const query = buildSearchQuery({
        q: 'pizza',
        category: 'restaurants',
        rating: 4,
        verifiedOnly: true,
        languages: ['en'],
      });

      // Should have: status + category + rating + verified + languages = 5 filters
      expect(query.body.query.bool.filter.length).toBe(5);
    });

    test('combines all 11 filter types', () => {
      const query = buildSearchQuery({
        q: 'restaurant',
        category: ['restaurants', 'cafes'],
        distance: 5,
        lat: -33.9366,
        lng: 150.6966,
        rating: 4,
        languages: ['en', 'ar'],
        priceRange: [1, 2],
        certifications: ['halal'],
        accessibilityFeatures: ['wheelchair'],
        verifiedOnly: true,
      });

      // Should have: status + category + distance + rating + languages + priceRange +
      // certifications + accessibilityFeatures + verified = 9 filters
      // (openNow, hasPromotions, hasEvents handled at service layer)
      expect(query.body.query.bool.filter.length).toBe(9);
    });
  });
});

describe('buildAutocompleteQuery', () => {
  test('builds autocomplete query', () => {
    const query = buildAutocompleteQuery('piz', 10);

    expect(query.body.query.bool.must[0].multi_match.query).toBe('piz');
    expect(query.body.query.bool.must[0].multi_match.type).toBe('bool_prefix');
    expect(query.body.size).toBe(10);
  });

  test('filters by ACTIVE status', () => {
    const query = buildAutocompleteQuery('pizza');

    expect(query.body.query.bool.filter).toContainEqual({
      term: { status: 'ACTIVE' },
    });
  });

  test('limits returned fields', () => {
    const query = buildAutocompleteQuery('pizza');

    expect(query.body._source).toEqual(['id', 'name', 'categorySlug']);
  });

  test('defaults to limit 10', () => {
    const query = buildAutocompleteQuery('pizza');

    expect(query.body.size).toBe(10);
  });

  test('respects custom limit', () => {
    const query = buildAutocompleteQuery('pizza', 5);

    expect(query.body.size).toBe(5);
  });
});
