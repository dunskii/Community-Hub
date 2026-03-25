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
import searchRouter from './search.js';
import { reviewRouter } from './review.js';
import { savedRouter } from './saved.js';
import { followRouter } from './follow.js';
import { moderationRouter } from './moderation.js';
import claimRouter from './claim.js';
import analyticsRouter from './analytics.js';
import { eventRouter } from './events.js';
import { conversationsRouter } from './conversations.js';
import { dealRouter, businessDealRouter } from './deals.js';
import { enquiryRouter } from './enquiry.js';
import { adminRouter } from './admin.js';
import { socialRouter } from './social.js';

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
  v1.use('/search', searchRouter);
  v1.use('/', reviewRouter);
  v1.use('/', savedRouter);
  v1.use('/', followRouter);
  v1.use('/', moderationRouter);
  v1.use('/', claimRouter);
  v1.use('/', analyticsRouter);
  v1.use('/events', eventRouter);
  v1.use('/', conversationsRouter);
  v1.use('/deals', dealRouter);
  v1.use('/businesses/:businessId/deals', businessDealRouter);
  v1.use('/', enquiryRouter);
  v1.use('/', adminRouter);
  v1.use('/businesses/:businessId/social', socialRouter);

  app.use('/api/v1', v1);

  // Future API versions return 404 with guidance
  app.use('/api/v2', (_req, res) => {
    sendError(res, 'NOT_FOUND', 'API v2 is not available. Use /api/v1.', 404);
  });
}
