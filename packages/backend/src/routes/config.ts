import type { PlatformConfig } from '@community-hub/shared';
import { Router, type IRouter } from 'express';

import { loadPlatformConfig } from '../config/platform-loader.js';
import { sendSuccess } from '../utils/api-response.js';

const router: IRouter = Router();

/**
 * Filter platform config to only include fields safe for the frontend.
 * Removes partner contact emails, internal analytics IDs, and sensitive location details.
 */
function filterConfigForFrontend(config: PlatformConfig) {
  return {
    platform: config.platform,
    location: {
      suburbName: config.location.suburbName,
      suburbNameShort: config.location.suburbNameShort,
      region: config.location.region,
      city: config.location.city,
      state: config.location.state,
      stateFullName: config.location.stateFullName,
      country: config.location.country,
      countryCode: config.location.countryCode,
      postcode: config.location.postcode,
      coordinates: config.location.coordinates,
      timezone: config.location.timezone,
      locale: config.location.locale,
      currency: config.location.currency,
      currencySymbol: config.location.currencySymbol,
      defaultSearchRadiusKm: config.location.defaultSearchRadiusKm,
      maxSearchRadiusKm: config.location.maxSearchRadiusKm,
    },
    branding: config.branding,
    partners: {
      council: {
        name: config.partners.council.name,
        website: config.partners.council.website,
        logo: config.partners.council.logo,
      },
      chamber: {
        name: config.partners.chamber.name,
        website: config.partners.chamber.website,
        logo: config.partners.chamber.logo,
      },
    },
    features: config.features,
    multilingual: config.multilingual,
    seo: config.seo,
    legal: config.legal,
    limits: config.limits,
  };
}

/**
 * GET /api/v1/config
 *
 * Serves platform configuration to the frontend.
 * The frontend platform-loader fetches this on startup to hydrate
 * design tokens, feature flags, and branding.
 *
 * Filtered to exclude sensitive fields (partner emails, analytics IDs, etc.).
 */
router.get('/config', (_req, res) => {
  const config = loadPlatformConfig();
  sendSuccess(res, filterConfigForFrontend(config));
});

export default router;
