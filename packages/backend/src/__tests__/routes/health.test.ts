import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before import
const mockPrismaQueryRaw = vi.fn();
const mockRedisHealthCheck = vi.fn();
const mockEsHealthCheck = vi.fn();

vi.mock('../../db/index.js', () => ({
  prisma: { $queryRaw: mockPrismaQueryRaw },
}));

vi.mock('../../cache/index.js', () => ({
  redisHealthCheck: () => mockRedisHealthCheck(),
}));

vi.mock('../../search/index.js', () => ({
  esHealthCheck: () => mockEsHealthCheck(),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { default: healthRouter } = await import('../../routes/health.js');

// Minimal Express-like test harness
type Handler = (req: unknown, res: unknown, next?: unknown) => void;

interface RouteLayer {
  route?: {
    path: string;
    stack: Array<{ handle: Handler }>;
  };
}

function createTestApp() {
  const routes = new Map<string, Handler>();

  // Walk the router stack to extract route handlers
  const stack = (healthRouter as unknown as { stack: RouteLayer[] }).stack;
  for (const layer of stack) {
    if (layer.route) {
      const handler = layer.route.stack[0]?.handle;
      if (handler) {
        routes.set(layer.route.path, handler);
      }
    }
  }

  return {
    async request(path: string) {
      const handler = routes.get(path);
      if (!handler) throw new Error(`No handler for ${path}`);

      let statusCode = 200;
      let body: unknown;
      const res = {
        status(code: number) { statusCode = code; return res; },
        json(data: unknown) { body = data; return res; },
      };

      await handler({} as unknown, res);
      return { statusCode, body: body as Record<string, unknown> };
    },
  };
}

describe('health routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const { statusCode, body } = await app.request('/health');

      expect(statusCode).toBe(200);
      expect(body).toMatchObject({
        success: true,
        data: expect.objectContaining({ status: 'ok' }),
      });
      expect((body['data'] as Record<string, unknown>)['timestamp']).toBeDefined();
    });
  });

  describe('GET /status', () => {
    it('should return healthy when all services are up', async () => {
      mockPrismaQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisHealthCheck.mockResolvedValue(true);
      mockEsHealthCheck.mockResolvedValue(true);

      const { statusCode, body } = await app.request('/status');

      expect(statusCode).toBe(200);
      const data = body['data'] as Record<string, unknown>;
      expect(data['status']).toBe('healthy');
      const services = data['services'] as Record<string, string>;
      expect(services['database']).toBe('ok');
      expect(services['redis']).toBe('ok');
      expect(services['elasticsearch']).toBe('ok');
    });

    it('should return 503 when database is down', async () => {
      mockPrismaQueryRaw.mockRejectedValue(new Error('connection refused'));
      mockRedisHealthCheck.mockResolvedValue(true);
      mockEsHealthCheck.mockResolvedValue(true);

      const { statusCode, body } = await app.request('/status');

      expect(statusCode).toBe(503);
      const data = body['data'] as Record<string, unknown>;
      expect(data['status']).toBe('degraded');
      const services = data['services'] as Record<string, string>;
      expect(services['database']).toBe('error');
    });

    it('should return 200 when only ES is down (graceful degradation)', async () => {
      mockPrismaQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
      mockRedisHealthCheck.mockResolvedValue(true);
      mockEsHealthCheck.mockResolvedValue(false);

      const { statusCode, body } = await app.request('/status');

      expect(statusCode).toBe(200);
      const data = body['data'] as Record<string, unknown>;
      expect(data['status']).toBe('healthy');
      const services = data['services'] as Record<string, string>;
      expect(services['elasticsearch']).toBe('unavailable');
    });
  });
});
