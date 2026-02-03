import express from 'express';
import helmet from 'helmet';

import { corsConfig } from './middleware/cors-config.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { setupRoutes } from './routes/index.js';

export function createApp(): express.Express {
  const app = express();

  // Security
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(rateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request pipeline
  app.use(requestId);
  app.use(corsConfig);
  app.use(requestLogger);

  // Routes
  setupRoutes(app);

  // Error handling (must be after routes)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
