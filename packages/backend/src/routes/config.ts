import { Router, type IRouter } from 'express';

import { loadPlatformConfig } from '../config/platform-loader.js';
import { sendSuccess } from '../utils/api-response.js';

const router: IRouter = Router();

/**
 * GET /api/v1/config
 *
 * Serves platform configuration to the frontend.
 * The frontend platform-loader fetches this on startup to hydrate
 * design tokens, feature flags, and branding.
 */
router.get('/config', (_req, res) => {
  const config = loadPlatformConfig();
  sendSuccess(res, config);
});

export default router;
