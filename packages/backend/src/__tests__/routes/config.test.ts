import { createValidPlatformConfig } from '@community-hub/shared/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockConfig = createValidPlatformConfig();

vi.mock('../../config/platform-loader.js', () => ({
  loadPlatformConfig: () => mockConfig,
}));

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { default: configRouter } = await import('../../routes/config.js');

// Minimal Express-like test harness (same pattern as health.test.ts)
type Handler = (req: unknown, res: unknown, next?: unknown) => void;

interface RouteLayer {
  route?: {
    path: string;
    stack: Array<{ handle: Handler }>;
  };
}

function createTestApp() {
  const routes = new Map<string, Handler>();

  const stack = (configRouter as unknown as { stack: RouteLayer[] }).stack;
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
        status(code: number) {
          statusCode = code;
          return res;
        },
        json(data: unknown) {
          body = data;
          return res;
        },
      };

      await handler({} as unknown, res);
      return { statusCode, body: body as Record<string, unknown> };
    },
  };
}

describe('config routes', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /config', () => {
    it('should return platform config with success wrapper', async () => {
      const { statusCode, body } = await app.request('/config');

      expect(statusCode).toBe(200);
      expect(body['success']).toBe(true);
      expect(body['data']).toBeDefined();
    });

    it('should include platform id in config data', async () => {
      const { body } = await app.request('/config');

      const data = body['data'] as Record<string, unknown>;
      const platform = data['platform'] as Record<string, unknown>;
      expect(platform['id']).toBe('test');
    });

    it('should include branding colours in config data', async () => {
      const { body } = await app.request('/config');

      const data = body['data'] as Record<string, unknown>;
      const branding = data['branding'] as Record<string, unknown>;
      const colors = branding['colors'] as Record<string, unknown>;
      expect(colors['primary']).toBeDefined();
    });
  });
});
