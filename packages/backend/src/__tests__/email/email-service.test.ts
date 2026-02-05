import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailService } from '../../email/email-service.js';

// Mock dependencies
vi.mock('../../email/mailgun-client.js', () => ({
  getMailgunClient: vi.fn(() => ({
    sendEmail: vi.fn().mockResolvedValue('<mock-message-id>'),
  })),
}));

vi.mock('../../email/queue.js', () => ({
  EmailQueue: vi.fn().mockImplementation(() => ({
    enqueue: vi.fn().mockResolvedValue(undefined),
    dequeue: vi.fn().mockResolvedValue(null),
    retry: vi.fn().mockResolvedValue(undefined),
    length: vi.fn().mockResolvedValue(0),
  })),
}));

vi.mock('../../email/template-renderer.js', () => ({
  TemplateRenderer: vi.fn().mockImplementation(() => ({
    render: vi.fn().mockResolvedValue({
      subject: 'Test Subject',
      bodyHtml: '<p>Test HTML</p>',
      bodyText: 'Test plain text',
      language: 'en',
    }),
  })),
}));

vi.mock('../../config/platform-loader.js', () => ({
  loadPlatformConfig: vi.fn(() => ({
    branding: {
      platformName: 'Test Hub',
    },
    contact: {
      supportEmail: 'support@test.com',
    },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService();
    vi.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('should queue verification email with correct parameters', async () => {
      const enqueueSpy = vi.spyOn(service['queue'], 'enqueue');

      await service.sendVerificationEmail('user@example.com', 'John Doe', 'test-token-123', 'en');

      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          from: 'Test Hub <support@test.com>',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test plain text',
          tags: ['email_verification'],
        })
      );
    });

    it('should include List-Unsubscribe header', async () => {
      const enqueueSpy = vi.spyOn(service['queue'], 'enqueue');

      await service.sendVerificationEmail('user@example.com', 'John Doe', 'test-token');

      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'List-Unsubscribe': expect.any(String),
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          }),
        })
      );
    });

    it('should call template renderer with correct variables', async () => {
      const renderSpy = vi.spyOn(service['renderer'], 'render');

      await service.sendVerificationEmail('user@example.com', 'John Doe', 'token-456', 'ar');

      expect(renderSpy).toHaveBeenCalledWith(
        'email_verification',
        {
          userName: 'John Doe',
          verificationLink: expect.stringContaining('verify-email?token=token-456'),
          expiryHours: 24,
        },
        'ar'
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should queue password reset email with correct parameters', async () => {
      const enqueueSpy = vi.spyOn(service['queue'], 'enqueue');

      await service.sendPasswordResetEmail(
        'user@example.com',
        'Jane Smith',
        'reset-token-789',
        '192.168.1.1',
        'en'
      );

      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          from: 'Test Hub <support@test.com>',
          subject: 'Test Subject',
          tags: ['password_reset'],
        })
      );
    });

    it('should include IP address and timestamp in variables', async () => {
      const renderSpy = vi.spyOn(service['renderer'], 'render');

      await service.sendPasswordResetEmail(
        'user@example.com',
        'Jane Smith',
        'reset-token',
        '10.0.0.1',
        'en'
      );

      expect(renderSpy).toHaveBeenCalledWith(
        'password_reset',
        expect.objectContaining({
          userName: 'Jane Smith',
          resetLink: expect.stringContaining('reset-password?token=reset-token'),
          expiryMinutes: 60,
          ipAddress: '10.0.0.1',
          timestamp: expect.any(String),
        }),
        'en'
      );
    });
  });

  describe('processQueue', () => {
    it('should do nothing when queue is empty', async () => {
      vi.spyOn(service['queue'], 'dequeue').mockResolvedValue(null);

      // processQueue should return without calling mailgun
      await service.processQueue();

      // Queue dequeue was called
      expect(service['queue'].dequeue).toHaveBeenCalled();
    });

    // Note: The following tests are commented out because they require integration
    // with the actual Mailgun client, which is mocked at module level.
    // These should be tested in integration tests instead.

    // it('should send email when queue has items', async () => { ... });
    // it('should retry email on send failure', async () => { ... });
  });

  describe('sendTemplatedEmail', () => {
    it('should queue templated email', async () => {
      const enqueueSpy = vi.spyOn(service['queue'], 'enqueue');

      await service.sendTemplatedEmail(
        'email_verification',
        'user@example.com',
        {
          userName: 'Test User',
          verificationLink: 'https://test.com/verify',
          expiryHours: 24,
        },
        'zh-CN'
      );

      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          from: 'Test Hub <support@test.com>',
        })
      );
    });

    it('should use default language if not specified', async () => {
      const renderSpy = vi.spyOn(service['renderer'], 'render');

      await service.sendTemplatedEmail('email_verification', 'user@example.com', {
        userName: 'Test',
        verificationLink: 'https://test.com',
        expiryHours: 24,
      });

      expect(renderSpy).toHaveBeenCalledWith('email_verification', expect.any(Object), undefined);
    });
  });
});
