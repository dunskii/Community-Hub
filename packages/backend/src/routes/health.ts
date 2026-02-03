import { Router, type IRouter } from 'express';

import { redisHealthCheck } from '../cache/index.js';
import { prisma } from '../db/index.js';
import { esHealthCheck } from '../search/index.js';
import { sendSuccess } from '../utils/api-response.js';

const router: IRouter = Router();

// Basic health check -- always responds quickly
router.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// Detailed service connectivity status
// TODO: Phase 2 - add admin authentication to /status endpoint (H-04)
router.get('/status', async (_req, res) => {
  const [dbOk, redisOk, esOk] = await Promise.all([
    prisma
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    redisHealthCheck(),
    esHealthCheck(),
  ]);

  const services = {
    database: dbOk ? 'ok' : 'error',
    redis: redisOk ? 'ok' : 'error',
    elasticsearch: esOk ? 'ok' : 'unavailable',
  };

  // DB and Redis are required; ES is optional (graceful degradation)
  const healthy = dbOk && redisOk;
  res.status(healthy ? 200 : 503).json({
    success: true,
    data: {
      status: healthy ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
