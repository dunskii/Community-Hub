import { Router, type Request, type Response } from 'express';
import type { LanguagesResponse } from '@community-hub/shared';
import { cacheService } from '../cache/cache-service.js';
import { loadPlatformConfig } from '../config/platform-loader.js';
import { rateLimiter } from '../middleware/rate-limiter.js';
import { logger } from '../utils/logger.js';

const router: ReturnType<typeof Router> = Router();

/**
 * GET /api/v1/languages
 * Returns list of enabled languages from platform.json
 * Public endpoint (no auth required)
 * Rate limited to 30 requests per minute (baseline for public endpoints)
 */
router.get('/languages', rateLimiter, async (_req: Request, res: Response) => {
  try {
    // Check cache first (30-day TTL)
    const cacheKey = 'platform:languages';
    const cached = await cacheService.get<LanguagesResponse>(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Load from platform config
    const config = loadPlatformConfig();
    const { defaultLanguage, supportedLanguages } = config.multilingual;

    // Filter enabled languages
    const enabledLanguages = supportedLanguages
      .filter((lang) => lang.enabled)
      .map(({ code, name, nativeName, rtl }) => ({
        code,
        name,
        nativeName,
        rtl,
      }));

    const response: LanguagesResponse = {
      defaultLanguage: defaultLanguage as any,
      languages: enabledLanguages as any,
    };

    // Cache for 30 days (languages rarely change)
    await cacheService.set(cacheKey, response, 30 * 24 * 60 * 60);

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Error fetching languages');
    res.status(500).json({
      error: 'Failed to fetch languages',
      message: 'An error occurred while retrieving language settings',
    });
  }
});

export default router;
