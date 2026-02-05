import { loadPlatformConfig } from '../config/platform-loader.js';
import { logger } from '../utils/logger.js';
import { getMailgunClient } from './mailgun-client.js';
import { EmailQueue } from './queue.js';
import { TemplateRenderer } from './template-renderer.js';
import type { EmailTemplateKey, LanguageCode, TemplateVariables } from './template-types.js';

/**
 * Email service for sending templated emails.
 * High-level API used by application code (auth, notifications, etc.).
 *
 * Spec Section 26.3: Email service with Mailgun provider.
 */
export class EmailService {
  private renderer: TemplateRenderer;
  private queue: EmailQueue;

  constructor() {
    this.renderer = new TemplateRenderer();
    this.queue = new EmailQueue();
  }

  /**
   * Send a templated email.
   * Email is queued for async processing.
   *
   * @param templateKey - Template identifier
   * @param to - Recipient email address
   * @param variables - Template variables
   * @param userLanguage - User's preferred language (optional)
   */
  async sendTemplatedEmail<K extends EmailTemplateKey>(
    templateKey: K,
    to: string,
    variables: TemplateVariables[K],
    userLanguage?: LanguageCode
  ): Promise<void> {
    const platformConfig = loadPlatformConfig();

    // Render template
    const rendered = await this.renderer.render(templateKey, variables, userLanguage);

    // Build sender address
    const senderName = platformConfig.branding.platformName;
    const senderEmail = platformConfig.contact.supportEmail;
    const from = `${senderName} <${senderEmail}>`;

    // Add List-Unsubscribe header (RFC 8058 one-click unsubscribe)
    // Actual unsubscribe endpoint implemented in Phase 16
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    const unsubscribeUrl = `${frontendUrl}/unsubscribe`;
    const headers = {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };

    // Queue email
    await this.queue.enqueue({
      to,
      from,
      subject: rendered.subject,
      html: rendered.bodyHtml,
      text: rendered.bodyText,
      headers,
      tags: [templateKey],
    });

    logger.info('Email queued for sending', { templateKey, to, language: rendered.language });
  }

  /**
   * Process email queue (call from worker process).
   * Dequeues and sends emails via Mailgun.
   */
  async processQueue(): Promise<void> {
    const email = await this.queue.dequeue();
    if (!email) return;

    try {
      const mailgun = getMailgunClient();
      await mailgun.sendEmail(email);
      logger.info('Email sent successfully', { to: email.to, subject: email.subject });
    } catch (error) {
      logger.error('Failed to send email', { to: email.to, subject: email.subject, error });
      await this.queue.retry(email);
    }
  }

  /**
   * Convenience method: Send email verification.
   */
  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationToken: string,
    userLanguage?: LanguageCode
  ): Promise<void> {
    const baseUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

    await this.sendTemplatedEmail(
      'email_verification',
      to,
      {
        userName,
        verificationLink,
        expiryHours: 24,
      },
      userLanguage
    );
  }

  /**
   * Convenience method: Send password reset.
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
    ipAddress: string,
    userLanguage?: LanguageCode
  ): Promise<void> {
    const baseUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    await this.sendTemplatedEmail(
      'password_reset',
      to,
      {
        userName,
        resetLink,
        expiryMinutes: 60,
        ipAddress,
        timestamp: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' }),
      },
      userLanguage
    );
  }
}

/**
 * Singleton email service instance.
 */
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}
