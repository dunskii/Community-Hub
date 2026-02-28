import { Router } from 'express';
import type { Express } from 'express';

import { sendError } from '../utils/api-response.js';

import configRouter from './config.js';
import healthRouter from './health.js';
import { geocodingRouter } from './geocoding.js';
import languagesRouter from './languages.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import businessRouter from './business.js';
import categoryRouter from './category.js';

export function setupRoutes(app: Express): void {
  // API v1
  const v1 = Router();
  v1.use('/', healthRouter);
  v1.use('/', configRouter);
  v1.use('/', geocodingRouter);
  v1.use('/', languagesRouter);
  v1.use('/auth', authRouter);
  v1.use('/users', usersRouter);
  v1.use('/', businessRouter);
  v1.use('/', categoryRouter);
  // Future route modules: events, search, etc.

  app.use('/api/v1', v1);

  // Future API versions return 404 with guidance
  app.use('/api/v2', (_req, res) => {
    sendError(res, 'NOT_FOUND', 'API v2 is not available. Use /api/v1.', 404);
  });
}
