/**
 * Search Routes Tests
 * Phase 5: Search & Discovery
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import searchRouter from '../search.js';
import { sendSuccess } from '../../utils/api-response.js';
import * as searchService from '../../services/search-service.js';

// Mock the search service
vi.mock('../../services/search-service.js', () => ({
  searchBusinesses: vi.fn(),
  getAutocompleteSuggestions: vi.fn(),
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/search', searchRouter);

// Mock Elasticsearch client
vi.mock('../../search/elasticsearch-client.js', () => ({
  getEsClient: vi.fn(() => ({
    search: vi.fn().mockResolvedValue({
      hits: { hits: [], total: 0 },
    }),
  })),
}));

describe('GET /api/v1/search/businesses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('searches businesses successfully', async () => {
    const mockResults = {
      results: [
        {
          id: '1',
          name: 'Test Business',
          description: 'Test description',
          categorySlug: 'restaurants',
          categoryName: 'Restaurants',
          rating: 4.5,
          reviewCount: 10,
          photos: [],
          verified: true,
          featured: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    vi.mocked(searchService.searchBusinesses).mockResolvedValue(mockResults);

    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ q: 'pizza' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toHaveLength(1);
    expect(searchService.searchBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'pizza' }),
      undefined
    );
  });

  test('applies category filter', async () => {
    vi.mocked(searchService.searchBusinesses).mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await request(app)
      .get('/api/v1/search/businesses')
      .query({ q: 'food', category: 'restaurants' });

    expect(searchService.searchBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'food',
        category: 'restaurants',
      }),
      undefined
    );
  });

  test('applies distance filter', async () => {
    vi.mocked(searchService.searchBusinesses).mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await request(app)
      .get('/api/v1/search/businesses')
      .query({ q: 'pizza', distance: 2, lat: -33.9366, lng: 150.6966 });

    expect(searchService.searchBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({
        distance: 2,
        lat: -33.9366,
        lng: 150.6966,
      }),
      undefined
    );
  });

  test('applies rating filter', async () => {
    vi.mocked(searchService.searchBusinesses).mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await request(app)
      .get('/api/v1/search/businesses')
      .query({ rating: 4 });

    expect(searchService.searchBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4 }),
      undefined
    );
  });

  test('validates query parameter max length', async () => {
    const longQuery = 'a'.repeat(101);
    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ q: longQuery });

    expect(res.status).toBe(400);
  });

  test('validates distance range', async () => {
    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ distance: 30 }); // Max is 25

    expect(res.status).toBe(400);
  });

  test('validates lat/lng range', async () => {
    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ lat: 100 }); // Max is 90

    expect(res.status).toBe(400);
  });

  test('validates page minimum', async () => {
    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ page: 0 }); // Min is 1

    expect(res.status).toBe(400);
  });

  test('validates limit maximum', async () => {
    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ limit: 200 }); // Max is 100

    expect(res.status).toBe(400);
  });

  test('supports pagination', async () => {
    vi.mocked(searchService.searchBusinesses).mockResolvedValue({
      results: [],
      total: 100,
      page: 2,
      limit: 20,
      totalPages: 5,
    });

    await request(app)
      .get('/api/v1/search/businesses')
      .query({ q: 'business', page: 2, limit: 20 });

    expect(searchService.searchBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 20 }),
      undefined
    );
  });

  test('supports sort options', async () => {
    vi.mocked(searchService.searchBusinesses).mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    await request(app)
      .get('/api/v1/search/businesses')
      .query({ sort: 'rating' });

    expect(searchService.searchBusinesses).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'rating' }),
      undefined
    );
  });

  test('validates sort enum values', async () => {
    const res = await request(app)
      .get('/api/v1/search/businesses')
      .query({ sort: 'invalid' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/search/suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns autocomplete suggestions', async () => {
    const mockResults = {
      suggestions: [
        { type: 'business' as const, id: '1', name: 'Pizza Place', categoryName: 'Restaurants' },
      ],
      recentSearches: [],
      popularSearches: [],
    };

    vi.mocked(searchService.getAutocompleteSuggestions).mockResolvedValue(mockResults);

    const res = await request(app)
      .get('/api/v1/search/suggestions')
      .query({ q: 'piz' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggestions).toHaveLength(1);
  });

  test('validates query required', async () => {
    const res = await request(app).get('/api/v1/search/suggestions');

    expect(res.status).toBe(400);
  });

  test('validates limit maximum', async () => {
    const res = await request(app)
      .get('/api/v1/search/suggestions')
      .query({ q: 'pizza', limit: 30 }); // Max is 20

    expect(res.status).toBe(400);
  });

  test('respects custom limit', async () => {
    vi.mocked(searchService.getAutocompleteSuggestions).mockResolvedValue({
      suggestions: [],
      recentSearches: [],
      popularSearches: [],
    });

    await request(app)
      .get('/api/v1/search/suggestions')
      .query({ q: 'pizza', limit: 5 });

    expect(searchService.getAutocompleteSuggestions).toHaveBeenCalledWith('pizza', 5, undefined);
  });
});

describe('GET /api/v1/search/events', () => {
  test('returns stub response', async () => {
    const res = await request(app).get('/api/v1/search/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.data.total).toBe(0);
  });
});

describe('GET /api/v1/search/all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns combined search results', async () => {
    vi.mocked(searchService.searchBusinesses).mockResolvedValue({
      results: [
        {
          id: '1',
          name: 'Test Business',
          description: 'Test',
          categorySlug: 'restaurants',
          categoryName: 'Restaurants',
          rating: 4.5,
          reviewCount: 10,
          photos: [],
          verified: true,
          featured: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const res = await request(app)
      .get('/api/v1/search/all')
      .query({ q: 'pizza' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.businesses).toHaveLength(1);
    expect(res.body.data.events).toEqual([]);
    expect(res.body.data.total).toBe(1);
  });
});
