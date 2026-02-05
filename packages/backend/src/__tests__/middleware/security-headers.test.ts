import express from 'express';
import helmet from 'helmet';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NODE_ENV', 'production');

/**
 * Test the exact helmet configuration used in app.ts.
 * Rather than importing createApp() (which pulls in DB/Redis/ES),
 * we replicate the helmet config here to test header output in isolation.
 */
function createTestApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'https://api.mapbox.com', 'https://*.tiles.mapbox.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          connectSrc: ["'self'", 'https://api.mapbox.com', 'https://events.mapbox.com'],
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

  app.get('/test', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

function makeRequest(
  app: express.Express,
): Promise<{ headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve) => {
    const req = {
      method: 'GET',
      url: '/test',
      path: '/test',
      headers: {},
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
      get(_name: string) {
        return undefined;
      },
      on() { return req; },
      once() { return req; },
      emit() { return false; },
    };

    const headers: Record<string, string> = {};
    const res = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
        return res;
      },
      getHeader(name: string) {
        return headers[name.toLowerCase()];
      },
      removeHeader(name: string) {
        delete headers[name.toLowerCase()];
        return res;
      },
      writeHead() { return res; },
      write() { return true; },
      end() {
        resolve({ headers });
      },
      on() { return res; },
      once() { return res; },
      emit() { return false; },
      headersSent: false,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json(_data: unknown) {
        headers['content-type'] = 'application/json';
        res.end();
        return res;
      },
    };

    app(req as unknown as express.Request, res as unknown as express.Response);
  });
}

describe('security headers', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should set Content-Security-Policy header', async () => {
    const { headers } = await makeRequest(app);
    const csp = headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
  });

  it('should allow Google Fonts in CSP style-src and font-src', async () => {
    const { headers } = await makeRequest(app);
    const csp = headers['content-security-policy'] as string;
    expect(csp).toContain('fonts.googleapis.com');
    expect(csp).toContain('fonts.gstatic.com');
  });

  it('should allow Mapbox in CSP img-src and connect-src', async () => {
    const { headers } = await makeRequest(app);
    const csp = headers['content-security-policy'] as string;
    expect(csp).toContain('api.mapbox.com');
  });

  it('should not allow unsafe-inline scripts', async () => {
    const { headers } = await makeRequest(app);
    const csp = headers['content-security-policy'] as string;
    const scriptSrc = csp.match(/script-src ([^;]+)/)?.[1] ?? '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('should block frames via CSP frame-src none', async () => {
    const { headers } = await makeRequest(app);
    const csp = headers['content-security-policy'] as string;
    expect(csp).toContain("frame-src 'none'");
  });

  it('should block objects via CSP object-src none', async () => {
    const { headers } = await makeRequest(app);
    const csp = headers['content-security-policy'] as string;
    expect(csp).toContain("object-src 'none'");
  });

  it('should set Strict-Transport-Security header with correct values', async () => {
    const { headers } = await makeRequest(app);
    const hsts = headers['strict-transport-security'];
    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('should set X-Frame-Options to DENY', async () => {
    const { headers } = await makeRequest(app);
    expect(headers['x-frame-options']).toBe('DENY');
  });

  it('should set X-Content-Type-Options to nosniff', async () => {
    const { headers } = await makeRequest(app);
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  it('should set Referrer-Policy to strict-origin-when-cross-origin', async () => {
    const { headers } = await makeRequest(app);
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should not expose X-Powered-By header', async () => {
    const { headers } = await makeRequest(app);
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
