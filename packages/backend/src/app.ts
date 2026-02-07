import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import { corsConfig } from './middleware/cors-config.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { setupRoutes } from './routes/index.js';

export function createApp(): express.Express {
  const app = express();
  const isDev = process.env['NODE_ENV'] !== 'production';

  // Security
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  // TLS 1.3: Configured at reverse proxy level (Cloudflare/nginx). See Phase 19.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https://api.mapbox.com', 'https://*.tiles.mapbox.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: [
            "'self'",
            'https://api.mapbox.com',
            'https://events.mapbox.com',
            ...(isDev ? ['ws://localhost:*'] : []),
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      frameguard: { action: 'deny' },
    }),
  );
  app.use(rateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request pipeline
  app.use(requestId);
  app.use(corsConfig);

  // Cookies & CSRF (after CORS so error responses include CORS headers)
  app.use(cookieParser());
  app.use(csrfProtection);

  app.use(requestLogger);

  // Static file serving for uploads
  app.use('/uploads', express.static('uploads'));

  // Routes
  setupRoutes(app);

  // Error handling (must be after routes)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
