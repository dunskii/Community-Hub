import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import type { MailgunMessageData, MessagesSendResult } from 'mailgun.js/interfaces/Messages';

import { logger } from '../utils/logger.js';

const mailgun = new Mailgun(FormData);

interface MailgunConfig {
  apiKey: string;
  domain: string;
}

interface SendEmailParams {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
  tags?: string[];
}

/**
 * Mailgun API client for sending emails.
 * Spec Section 26.3: Mailgun as email provider.
 */
export class MailgunClient {
  private client: ReturnType<typeof mailgun.client>;
  private domain: string;

  constructor(config: MailgunConfig) {
    this.client = mailgun.client({
      username: 'api',
      key: config.apiKey,
      url: 'https://api.mailgun.net', // US region; change to 'https://api.eu.mailgun.net' for EU
    });
    this.domain = config.domain;
  }

  /**
   * Send an email via Mailgun.
   * Returns the Mailgun message ID on success.
   * Throws on failure (network error, API error, invalid domain).
   */
  async sendEmail(params: SendEmailParams): Promise<string> {
    const { to, from, subject, html, text, headers, tags } = params;

    const messageData: MailgunMessageData = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      'h:X-Mailgun-Variables': JSON.stringify({ app: 'community-hub' }),
      ...(tags && { 'o:tag': tags }),
    };

    // Add custom headers (e.g., List-Unsubscribe)
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        // Mailgun expects headers in the format 'h:HeaderName'
        const headerKey = `h:${key}` as keyof MailgunMessageData;
        (messageData as any)[headerKey] = value;
      }
    }

    try {
      const result: MessagesSendResult = await this.client.messages.create(this.domain, messageData);
      logger.info('Email sent via Mailgun', {
        messageId: result.id,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
      });
      return result.id;
    } catch (error) {
      logger.error('Failed to send email via Mailgun', {
        error,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
      });
      throw new Error(`Mailgun send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify that the Mailgun domain is configured and active.
   * Call this during application startup.
   */
  async verifyDomain(): Promise<boolean> {
    try {
      const domain = await this.client.domains.get(this.domain);
      if (domain.state !== 'active') {
        logger.warn('Mailgun domain is not active', { domain: this.domain, state: domain.state });
        return false;
      }
      logger.info('Mailgun domain verified', { domain: this.domain });
      return true;
    } catch (error) {
      logger.error('Failed to verify Mailgun domain', { domain: this.domain, error });
      return false;
    }
  }
}

/**
 * Singleton Mailgun client instance.
 * Initialized from environment variables.
 */
let mailgunClient: MailgunClient | null = null;

export function getMailgunClient(): MailgunClient {
  if (!mailgunClient) {
    const apiKey = process.env['MAILGUN_API_KEY'];
    const domain = process.env['MAILGUN_DOMAIN'];

    if (!apiKey || !domain) {
      throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN must be set');
    }

    mailgunClient = new MailgunClient({ apiKey, domain });
  }

  return mailgunClient;
}
