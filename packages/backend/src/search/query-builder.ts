/**
 * Elasticsearch Query Builder
 * Phase 5: Search & Discovery
 *
 * Builds Elasticsearch queries from search parameters
 * Supports 11 filter types and 7 sort options
 */

import type { SearchParams } from '@community-hub/shared';

interface Location {
  lat: number;
  lng: number;
}

interface ElasticsearchQuery {
  index: string;
  body: {
    query?: {
      bool: {
        must: unknown[];
        filter: unknown[];
      };
    };
    sort?: unknown[];
    from: number;
    size: number;
    highlight?: {
      fields: Record<string, Record<string, unknown>>;
      pre_tags: string[];
      post_tags: string[];
    };
    script_fields?: Record<string, unknown>;
  };
}


const INDEX_NAME = 'businesses';

/**
 * Build Elasticsearch query from search parameters
 */
export function buildSearchQuery(params: SearchParams): ElasticsearchQuery {
  const {
    q,
    category,
    distance,
    lat,
    lng,
    rating,
    languages,
    priceRange,
    certifications,
    accessibilityFeatures,
    verifiedOnly,
    sort = 'relevance',
    page = 1,
    limit = 20,
  } = params;

  // Base query structure
  const query: {
    bool: {
      must: unknown[];
      filter: unknown[];
    };
  } = {
    bool: {
      must: [],
      filter: [],
    },
  };

  // 1. Full-text search with field weighting
  if (q && q.trim()) {
    query.bool.must.push({
      multi_match: {
        query: q.trim(),
        fields: [
          'name^3', // 3x weight - name is most important
          'categorySlug^2', // 2x weight - category is secondary
          'description', // 1x weight - description is tertiary
        ],
        type: 'best_fields',
        fuzziness: q.trim().length > 3 ? 'AUTO' : undefined, // Fuzzy only for 4+ chars
        prefix_length: 2, // Prevent excessive fuzzy matches
      },
    });
  }

  // 2. Filter: Always published status
  query.bool.filter.push({
    term: { status: 'ACTIVE' },
  });

  // 3. Filter: Category (single or multiple)
  if (category) {
    const categories = Array.isArray(category) ? category : [category];
    query.bool.filter.push({
      terms: { categorySlug: categories },
    });
  }

  // 4. Filter: Distance (requires lat/lng)
  if (distance && lat !== undefined && lng !== undefined) {
    query.bool.filter.push({
      geo_distance: {
        distance: `${distance}km`,
        location: {
          lat,
          lon: lng,
        },
      },
    });
  }

  // 5. Filter: Rating
  if (rating) {
    query.bool.filter.push({
      range: {
        rating: { gte: rating },
      },
    });
  }

  // 6. Filter: Languages
  if (languages && languages.length > 0) {
    query.bool.filter.push({
      terms: { languagesSpoken: languages },
    });
  }

  // 7. Filter: Price Range
  if (priceRange && priceRange.length > 0) {
    // Convert number array to string array for keyword matching
    const priceRangeStrings = priceRange.map((p: number) => {
      switch (p) {
        case 1:
          return 'BUDGET';
        case 2:
          return 'MODERATE';
        case 3:
          return 'PREMIUM';
        case 4:
          return 'LUXURY';
        default:
          return 'MODERATE';
      }
    });
    query.bool.filter.push({
      terms: { priceRange: priceRangeStrings },
    });
  }

  // 8. Filter: Certifications
  if (certifications && certifications.length > 0) {
    query.bool.filter.push({
      terms: { certifications },
    });
  }

  // 9. Filter: Accessibility Features
  if (accessibilityFeatures && accessibilityFeatures.length > 0) {
    query.bool.filter.push({
      terms: { accessibilityFeatures },
    });
  }

  // 10. Filter: Verified Only
  if (verifiedOnly) {
    query.bool.filter.push({
      term: { verified: true },
    });
  }

  // Note: hasPromotions and hasEvents filters require JOIN with Deal/Event tables
  // These will be handled at the service layer, not in Elasticsearch

  // Build sort options
  const sortOptions = buildSortQuery(
    sort,
    lat !== undefined && lng !== undefined ? { lat, lng } : undefined
  );

  // Pagination
  const from = (page - 1) * limit;
  const size = Math.min(limit, 100); // Cap at 100 results per page

  return {
    index: INDEX_NAME,
    body: {
      query,
      sort: sortOptions,
      from,
      size,
      highlight: {
        fields: {
          name: {},
          description: {},
        },
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
      },
      // Include distance in response if geo-sorting
      ...(sort === 'distance' && lat && lng
        ? {
            script_fields: {
              distance: {
                script: {
                  source: "doc['location'].arcDistance(params.lat, params.lon) / 1000",
                  params: { lat, lon: lng },
                },
              },
            },
          }
        : {}),
    },
  };
}

/**
 * Build sort query based on sort option
 */
function buildSortQuery(sort: string, userLocation?: Location): unknown[] {
  switch (sort) {
    case 'relevance':
      // Sort by Elasticsearch relevance score
      return [{ _score: 'desc' }];

    case 'distance':
      if (!userLocation) {
        throw new Error('User location required for distance sort');
      }
      // Sort by geo-distance (nearest first)
      return [
        {
          _geo_distance: {
            location: {
              lat: userLocation.lat,
              lon: userLocation.lng,
            },
            order: 'asc',
            unit: 'km',
          },
        },
      ];

    case 'rating':
      // Sort by rating (highest first), then review count
      return [{ rating: 'desc' }, { reviewCount: 'desc' }];

    case 'reviews':
      // Sort by review count (most reviewed first)
      return [{ reviewCount: 'desc' }];

    case 'updated':
      // Sort by recently updated
      return [{ updatedAt: 'desc' }];

    case 'name':
      // Sort alphabetically by name
      return [{ 'name.keyword': 'asc' }];

    case 'newest':
      // Sort by recently added
      return [{ createdAt: 'desc' }];

    default:
      // Default to relevance
      return [{ _score: 'desc' }];
  }
}

/**
 * Build autocomplete query
 */
export function buildAutocompleteQuery(q: string, limit: number = 10): ElasticsearchQuery {
  const query: ElasticsearchQuery = {
    index: INDEX_NAME,
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                fields: ['name^3', 'categorySlug^2'],
                type: 'bool_prefix', // Optimized for prefix matching
              },
            },
          ],
          filter: [{ term: { status: 'ACTIVE' } }],
        },
      },
      from: 0,
      size: limit,
    },
  };

  // Add _source filter (not in main body type to avoid TS errors with Elasticsearch types)
  (query.body as unknown as { _source: string[] })._source = ['id', 'name', 'categorySlug'];

  return query;
}
