/**
 * Unsubscribe Routes
 *
 * Token-based one-click unsubscribe for weekly digest emails.
 * No authentication required (RFC 8058 compliant).
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db/index.js';
import { verifyUnsubscribeToken } from '../utils/unsubscribe-token.js';
import { logger } from '../utils/logger.js';
import { loadPlatformConfig } from '../config/platform-loader.js';

const router: ReturnType<typeof Router> = Router();

// Rate limit: 10 requests per minute per IP
const unsubscribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many unsubscribe requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /unsubscribe
 *
 * One-click unsubscribe via token.
 * Query params: ?token=xxx&type=deals|events|all
 * Returns an HTML confirmation page.
 */
router.get('/', unsubscribeLimiter, async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).send(buildHtmlPage('Invalid Request', 'Missing or invalid unsubscribe token.'));
    return;
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    res.status(400).send(buildHtmlPage('Invalid Token', 'This unsubscribe link is invalid or has been tampered with.'));
    return;
  }

  try {
    const updateData: Record<string, boolean> = {};

    if (payload.type === 'deals' || payload.type === 'all') {
      updateData['receive_deal_emails'] = false;
    }
    if (payload.type === 'events' || payload.type === 'all') {
      updateData['receive_event_emails'] = false;
    }

    await prisma.users.update({
      where: { id: payload.userId },
      data: updateData,
    });

    logger.info({ userId: payload.userId, type: payload.type }, 'User unsubscribed from digest emails');

    const config = loadPlatformConfig();
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    const preferencesUrl = `${frontendUrl}/saved`;

    const typeLabel = payload.type === 'deals' ? 'deal alerts' :
                      payload.type === 'events' ? 'event updates' :
                      'weekly digest emails';

    res.send(buildHtmlPage(
      'Unsubscribed',
      `You have been unsubscribed from ${typeLabel}.`,
      `<p style="margin-top: 16px;">Changed your mind? <a href="${preferencesUrl}" style="color: #2C5F7C;">Manage your preferences</a></p>`,
      config.branding.platformName
    ));
  } catch (error) {
    logger.error({ error, userId: payload.userId }, 'Failed to process unsubscribe');
    res.status(500).send(buildHtmlPage('Error', 'Something went wrong. Please try again later.'));
  }
});

/**
 * Build a simple HTML confirmation page.
 */
function buildHtmlPage(title: string, message: string, extra = '', platformName = 'Community Hub'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${platformName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 60px auto; padding: 0 20px; color: #2C3E50; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { font-size: 16px; line-height: 1.6; color: #555; }
    a { color: #2C5F7C; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
  ${extra}
</body>
</html>`;
}

export { router as unsubscribeRouter };
