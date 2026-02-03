import { Router } from 'express';
import type { Express } from 'express';

import { sendError } from '../utils/api-response.js';

import configRouter from './config.js';
import healthRouter from './health.js';

export function setupRoutes(app: Express): void {
  // API v1
  const v1 = Router();
  v1.use('/', healthRouter);
  v1.use('/', configRouter);
  // Future route modules: auth, businesses, events, users, search, etc.

  app.use('/api/v1', v1);

  // Future API versions return 404 with guidance
  app.use('/api/v2', (_req, res) => {
    sendError(res, 'NOT_FOUND', 'API v2 is not available. Use /api/v1.', 404);
  });
}
