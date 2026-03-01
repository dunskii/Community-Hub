import { logger } from '../utils/logger.js';

import { getEsClient } from './elasticsearch-client.js';

const ES_REPLICAS = Number(process.env['ES_NUMBER_OF_REPLICAS'] ?? '0');

const INDICES = {
  businesses: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: ES_REPLICAS,
      analysis: {
        filter: {
          // Synonym filter for common business terms
          business_synonyms: {
            type: 'synonym' as const,
            synonyms: [
              'restaurant, eatery, dining, diner',
              'grocery, supermarket, market, grocer',
              'pharmacy, chemist, drugstore',
              'petrol, gas station, service station, fuel',
              'cafe, coffee shop, coffeehouse',
              'bakery, patisserie, boulangerie',
              'butcher, meat shop, butchery',
              'doctor, physician, gp, general practitioner',
              'dentist, dental clinic, dental surgery',
              'gym, fitness center, health club, fitness centre',
            ],
          },
          // English stopwords filter
          english_stop: {
            type: 'stop' as const,
            stopwords: '_english_' as const,
          },
          // English stemmer
          english_stemmer: {
            type: 'stemmer' as const,
            language: 'english' as const,
          },
        },
        analyzer: {
          // Enhanced multilingual analyzer with synonyms, stopwords, and stemming
          multilingual: {
            type: 'custom' as const,
            tokenizer: 'standard' as const,
            filter: [
              'lowercase',
              'asciifolding', // Remove accents (café → cafe)
              'business_synonyms',
              'english_stop',
              'english_stemmer',
            ],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' as const },
        name: {
          type: 'text' as const,
          analyzer: 'multilingual',
          fields: {
            keyword: { type: 'keyword' as const }, // For exact sorting
          },
        },
        description: { type: 'text' as const, analyzer: 'multilingual' },
        categorySlug: { type: 'keyword' as const },
        suburb: { type: 'keyword' as const },
        location: { type: 'geo_point' as const },
        rating: { type: 'float' as const },
        reviewCount: { type: 'integer' as const },
        status: { type: 'keyword' as const },
        verified: { type: 'boolean' as const },
        featured: { type: 'boolean' as const },
        languagesSpoken: { type: 'keyword' as const },
        certifications: { type: 'keyword' as const },
        accessibilityFeatures: { type: 'keyword' as const },
        priceRange: { type: 'keyword' as const },
        createdAt: { type: 'date' as const },
        updatedAt: { type: 'date' as const },
      },
    },
  },
};

export async function setupIndices(): Promise<void> {
  const es = getEsClient();

  for (const [name, config] of Object.entries(INDICES)) {
    try {
      const exists = await es.indices.exists({ index: name });
      if (!exists) {
        await es.indices.create({ index: name, ...config });
        logger.info(`Elasticsearch index created: ${name}`);
      } else {
        logger.info(`Elasticsearch index exists: ${name}`);
      }
    } catch (err) {
      // Graceful degradation per Spec Section 27.5
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to create ES index "${name}": ${message}`);
    }
  }
}
