/**
 * Weekly Digest Service
 *
 * Gathers deals and events from a user's saved businesses
 * and sends a weekly digest email.
 */

import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { EmailService } from '../email/email-service.js';
import { loadPlatformConfig } from '../config/platform-loader.js';
import { generateUnsubscribeToken } from '../utils/unsubscribe-token.js';
import { DealStatus, EventStatus } from '../generated/prisma/index.js';
import type { LanguageCode } from '../email/template-types.js';

// ─── HTML Escaping ──────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS in email content.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Types ──────────────────────────────────────────────────

interface DigestUser {
  id: string;
  email: string;
  display_name: string;
  language_preference: string;
  receive_deal_emails: boolean;
  receive_event_emails: boolean;
}

interface DigestDeal {
  title: string;
  description: string;
  businessName: string;
  discount: string;
  validUntil: string;
  dealUrl: string;
}

interface DigestEvent {
  title: string;
  businessName: string;
  date: string;
  time: string;
  location: string;
  eventUrl: string;
}

// ─── Service ────────────────────────────────────────────────

export class WeeklyDigestService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Get all users who have opted in to at least one digest type.
   */
  async getDigestUsers(): Promise<DigestUser[]> {
    return prisma.users.findMany({
      where: {
        OR: [
          { receive_deal_emails: true },
          { receive_event_emails: true },
        ],
        email_verified: true,
        deletion_requested_at: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        language_preference: true,
        receive_deal_emails: true,
        receive_event_emails: true,
      },
    });
  }

  /**
   * Get active deals from a user's saved businesses.
   * Returns deals that are currently valid.
   */
  async getDealsForUser(userId: string): Promise<DigestDeal[]> {
    const now = new Date();
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

    const deals = await prisma.deals.findMany({
      where: {
        status: DealStatus.ACTIVE,
        valid_from: { lte: now },
        valid_until: { gte: now },
        businesses: {
          saved_businesses: {
            some: { user_id: userId },
          },
          status: 'ACTIVE',
        },
      },
      include: {
        businesses: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { valid_until: 'asc' },
      take: 10,
    });

    return deals.map((deal) => {
      let discount = '';
      if (deal.discount_type === 'PERCENTAGE' && deal.discount_value) {
        discount = `${deal.discount_value}% off`;
      } else if (deal.discount_type === 'FIXED' && deal.discount_value) {
        discount = `$${deal.discount_value} off`;
      } else if (deal.discount_type === 'BOGO') {
        discount = 'Buy one get one';
      } else if (deal.discount_type === 'FREE_ITEM') {
        discount = 'Free item';
      }

      return {
        title: deal.title,
        description: deal.description,
        businessName: deal.businesses.name,
        discount,
        validUntil: deal.valid_until.toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        dealUrl: `${frontendUrl}/businesses/${deal.businesses.slug}`,
      };
    });
  }

  /**
   * Get upcoming events from a user's saved businesses.
   * Returns events starting in the next 7 days.
   */
  async getEventsForUser(userId: string): Promise<DigestEvent[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

    const events = await prisma.events.findMany({
      where: {
        status: EventStatus.ACTIVE,
        start_time: { gte: now, lte: nextWeek },
        linked_business_id: { not: null },
        businesses: {
          saved_businesses: {
            some: { user_id: userId },
          },
          status: 'ACTIVE',
        },
      },
      include: {
        businesses: {
          select: { name: true },
        },
      },
      orderBy: { start_time: 'asc' },
      take: 10,
    });

    return events.map((event) => {
      const venue = event.venue as { name?: string; address?: string } | null;
      let location = '';
      if (event.location_type === 'ONLINE') {
        location = 'Online';
      } else if (venue) {
        location = venue.name || venue.address || '';
      }

      return {
        title: event.title,
        businessName: event.businesses?.name ?? '',
        date: event.start_time.toLocaleDateString('en-AU', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        time: event.start_time.toLocaleTimeString('en-AU', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        location,
        eventUrl: `${frontendUrl}/events/${event.slug || event.id}`,
      };
    });
  }

  /**
   * Build HTML for the deals section of the digest email.
   */
  buildDealsHtml(deals: DigestDeal[]): string {
    if (deals.length === 0) return '';

    const dealCards = deals.map((deal) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #F0F0F0;">
          <a href="${escapeHtml(deal.dealUrl)}" style="text-decoration: none; color: inherit;">
            <strong style="font-size: 15px; color: #2C3E50;">${escapeHtml(deal.title)}</strong>
            ${deal.discount ? `<span style="display: inline-block; margin-left: 8px; padding: 2px 8px; background: #E67E22; color: white; border-radius: 4px; font-size: 12px; font-weight: 600;">${escapeHtml(deal.discount)}</span>` : ''}
            <br />
            <span style="font-size: 13px; color: #7F8C8D;">${escapeHtml(deal.businessName)}</span>
            <span style="font-size: 12px; color: #95A5A6;"> &middot; Valid until ${escapeHtml(deal.validUntil)}</span>
          </a>
        </td>
      </tr>
    `).join('');

    return `
      <h3 style="margin: 24px 0 12px; font-family: 'Montserrat', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #2C3E50;">
        Deals & Promotions
      </h3>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        ${dealCards}
      </table>
    `;
  }

  /**
   * Build HTML for the events section of the digest email.
   */
  buildEventsHtml(events: DigestEvent[]): string {
    if (events.length === 0) return '';

    const eventCards = events.map((event) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #F0F0F0;">
          <a href="${escapeHtml(event.eventUrl)}" style="text-decoration: none; color: inherit;">
            <strong style="font-size: 15px; color: #2C3E50;">${escapeHtml(event.title)}</strong>
            <br />
            <span style="font-size: 13px; color: #2C5F7C;">${escapeHtml(event.date)} at ${escapeHtml(event.time)}</span>
            ${event.location ? `<span style="font-size: 13px; color: #7F8C8D;"> &middot; ${escapeHtml(event.location)}</span>` : ''}
            <br />
            <span style="font-size: 13px; color: #95A5A6;">${escapeHtml(event.businessName)}</span>
          </a>
        </td>
      </tr>
    `).join('');

    return `
      <h3 style="margin: 24px 0 12px; font-family: 'Montserrat', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #2C3E50;">
        Upcoming Events
      </h3>
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
        ${eventCards}
      </table>
    `;
  }

  /**
   * Send the weekly digest for a single user.
   * Returns true if sent, false if skipped (no content).
   */
  async sendDigestForUser(user: DigestUser): Promise<boolean> {
    const config = loadPlatformConfig();
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';

    // Gather content based on user preferences
    const deals = user.receive_deal_emails ? await this.getDealsForUser(user.id) : [];
    const events = user.receive_event_emails ? await this.getEventsForUser(user.id) : [];

    // Skip if no content
    if (deals.length === 0 && events.length === 0) {
      logger.debug({ userId: user.id }, 'Skipping digest - no content for user');
      return false;
    }

    // Build HTML sections
    const dealsHtml = this.buildDealsHtml(deals);
    const eventsHtml = this.buildEventsHtml(events);

    // Generate unsubscribe token
    const unsubscribeType = user.receive_deal_emails && user.receive_event_emails ? 'all' :
                            user.receive_deal_emails ? 'deals' : 'events';
    const unsubscribeToken = generateUnsubscribeToken(user.id, unsubscribeType);
    const unsubscribeUrl = `${frontendUrl}/unsubscribe?token=${unsubscribeToken}`;
    const preferencesUrl = `${frontendUrl}/saved`;

    try {
      await this.emailService.sendTemplatedEmail(
        'weekly_digest',
        user.email,
        {
          userName: user.display_name,
          platformName: config.branding.platformName,
          dealsHtml,
          eventsHtml,
          hasDeals: deals.length > 0 ? 'true' : '',
          hasEvents: events.length > 0 ? 'true' : '',
          unsubscribeUrl,
          preferencesUrl,
        },
        user.language_preference as LanguageCode
      );

      logger.info(
        { userId: user.id, dealCount: deals.length, eventCount: events.length },
        'Weekly digest sent'
      );
      return true;
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to send weekly digest');
      return false;
    }
  }
}

// Export singleton
export const weeklyDigestService = new WeeklyDigestService();
