import { logger } from '../utils/logger.js';

import { getEsClient } from './elasticsearch-client.js';

const ES_REPLICAS = Number(process.env['ES_NUMBER_OF_REPLICAS'] ?? '0');

const INDICES = {
  businesses: {
    settings: {
      number_of_shards: 1,
      number_of_replicas: ES_REPLICAS,
      analysis: {
        analyzer: {
          multilingual: { type: 'standard' as const, stopwords: ['_english_'] },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' as const },
        name: { type: 'text' as const, analyzer: 'multilingual' },
        description: { type: 'text' as const, analyzer: 'multilingual' },
        categorySlug: { type: 'keyword' as const },
        suburb: { type: 'keyword' as const },
        location: { type: 'geo_point' as const },
        rating: { type: 'float' as const },
        status: { type: 'keyword' as const },
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
