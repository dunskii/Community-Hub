import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TemplateRenderer } from '../../email/template-renderer.js';

// Mock dependencies
vi.mock('../../db/index.js', () => ({
  prisma: {
    emailTemplate: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../config/platform-loader.js', () => ({
  loadPlatformConfig: vi.fn(() => ({
    branding: {
      platformName: 'Test Community Hub',
      copyrightHolder: 'Test Organization',
      colors: {
        primary: '#2C5F7C',
        secondary: '#E67E22',
      },
    },
    contact: {
      supportEmail: 'support@test.com',
    },
    multilingual: {
      defaultLanguage: 'en',
    },
  })),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(() =>
    Promise.resolve(`
<!DOCTYPE html>
<html lang="{{lang}}" dir="{{dir}}">
<head><title>{{platformName}}</title></head>
<body>
  <header style="background-color: {{primaryColor}}">
    <h1>{{platformName}}</h1>
  </header>
  <main>{{content}}</main>
  <footer>
    <p>© {{copyrightHolder}}</p>
    <p>{{supportEmail}}</p>
  </footer>
</body>
</html>
  `)
  ),
}));

import { prisma } from '../../db/index.js';

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer;

  beforeEach(() => {
    renderer = new TemplateRenderer();
    vi.clearAllMocks();
  });

  describe('render', () => {
    it('should render email verification template in English', async () => {
      const mockTemplate = {
        id: 'test-id',
        templateKey: 'email_verification',
        name: 'Email Verification',
        description: 'Test description',
        subject: {
          en: 'Verify your email address',
          ar: 'تحقق من عنوان بريدك الإلكتروني',
        },
        bodyHtml: {
          en: '<p>Welcome {{userName}}! Click here: {{verificationLink}}</p>',
          ar: '<p>مرحباً {{userName}}!</p>',
        },
        bodyText: {
          en: 'Welcome {{userName}}! Visit: {{verificationLink}}',
          ar: 'مرحباً {{userName}}!',
        },
        variables: ['userName', 'verificationLink', 'expiryHours'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate);

      const result = await renderer.render(
        'email_verification',
        {
          userName: 'John Doe',
          verificationLink: 'https://example.com/verify?token=abc123',
          expiryHours: 24,
        },
        'en'
      );

      expect(result.subject).toBe('Verify your email address');
      expect(result.bodyHtml).toContain('John Doe');
      expect(result.bodyHtml).toContain('https://example.com/verify?token=abc123');
      expect(result.bodyHtml).toContain('Test Community Hub'); // From base template
      expect(result.bodyText).toContain('John Doe');
      expect(result.bodyText).toContain('https://example.com/verify?token=abc123');
      expect(result.language).toBe('en');
    });

    it('should render password reset template in Arabic with RTL', async () => {
      const mockTemplate = {
        id: 'test-id',
        templateKey: 'password_reset',
        name: 'Password Reset',
        description: 'Test description',
        subject: {
          en: 'Reset your password',
          ar: 'إعادة تعيين كلمة المرور',
        },
        bodyHtml: {
          en: '<p>Hi {{userName}}, reset link: {{resetLink}}</p>',
          ar: '<p>مرحباً {{userName}}, رابط إعادة التعيين: {{resetLink}}</p>',
        },
        bodyText: {
          en: 'Hi {{userName}}, reset link: {{resetLink}}',
          ar: 'مرحباً {{userName}}, رابط: {{resetLink}}',
        },
        variables: ['userName', 'resetLink', 'expiryMinutes', 'ipAddress', 'timestamp'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate);

      const result = await renderer.render(
        'password_reset',
        {
          userName: 'أحمد',
          resetLink: 'https://example.com/reset?token=xyz789',
          expiryMinutes: 60,
          ipAddress: '192.168.1.1',
          timestamp: '2026-02-05 10:30 AM',
        },
        'ar'
      );

      expect(result.subject).toBe('إعادة تعيين كلمة المرور');
      expect(result.bodyHtml).toContain('dir="rtl"'); // RTL direction
      expect(result.bodyHtml).toContain('أحمد');
      expect(result.bodyText).toContain('أحمد');
      expect(result.language).toBe('ar');
    });

    it('should fall back to English if language not available', async () => {
      const mockTemplate = {
        id: 'test-id',
        templateKey: 'email_verification',
        name: 'Email Verification',
        description: 'Test description',
        subject: {
          en: 'Verify your email',
        },
        bodyHtml: {
          en: '<p>Test {{userName}}</p>',
        },
        bodyText: {
          en: 'Test {{userName}}',
        },
        variables: ['userName', 'verificationLink', 'expiryHours'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate);

      const result = await renderer.render(
        'email_verification',
        {
          userName: 'Test User',
          verificationLink: 'https://example.com/verify',
          expiryHours: 24,
        },
        'fr' as any // French not supported
      );

      expect(result.subject).toBe('Verify your email');
      expect(result.bodyHtml).toContain('Test User');
      expect(result.language).toBe('fr'); // Requested language preserved
    });

    it('should use default language if user language not provided', async () => {
      const mockTemplate = {
        id: 'test-id',
        templateKey: 'email_verification',
        name: 'Email Verification',
        description: 'Test description',
        subject: {
          en: 'Verify email',
        },
        bodyHtml: {
          en: '<p>Test</p>',
        },
        bodyText: {
          en: 'Test',
        },
        variables: ['userName', 'verificationLink', 'expiryHours'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate);

      const result = await renderer.render(
        'email_verification',
        {
          userName: 'Test',
          verificationLink: 'https://test.com',
          expiryHours: 24,
        }
        // No language specified
      );

      expect(result.language).toBe('en'); // Default from platform config
    });

    it('should substitute all variables correctly', async () => {
      const mockTemplate = {
        id: 'test-id',
        templateKey: 'password_reset',
        name: 'Password Reset',
        description: 'Test description',
        subject: {
          en: 'Reset for {{userName}}',
        },
        bodyHtml: {
          en: '<p>{{userName}}, link: {{resetLink}}, IP: {{ipAddress}}, time: {{timestamp}}, expires: {{expiryMinutes}}</p>',
        },
        bodyText: {
          en: '{{userName}}, {{resetLink}}, {{ipAddress}}, {{timestamp}}, {{expiryMinutes}}',
        },
        variables: ['userName', 'resetLink', 'expiryMinutes', 'ipAddress', 'timestamp'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate);

      const result = await renderer.render(
        'password_reset',
        {
          userName: 'Test User',
          resetLink: 'https://example.com/reset',
          expiryMinutes: 60,
          ipAddress: '10.0.0.1',
          timestamp: '2026-02-05 12:00 PM',
        },
        'en'
      );

      expect(result.subject).toBe('Reset for Test User');
      expect(result.bodyHtml).toContain('Test User');
      expect(result.bodyHtml).toContain('https://example.com/reset');
      expect(result.bodyHtml).toContain('60');
      expect(result.bodyHtml).toContain('10.0.0.1');
      expect(result.bodyHtml).toContain('2026-02-05 12:00 PM');
    });

    it('should throw error if template not found', async () => {
      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(null);

      await expect(
        renderer.render(
          'email_verification',
          {
            userName: 'Test',
            verificationLink: 'https://test.com',
            expiryHours: 24,
          },
          'en'
        )
      ).rejects.toThrow('Email template not found or inactive');
    });

    it('should wrap content in base template with platform branding', async () => {
      const mockTemplate = {
        id: 'test-id',
        templateKey: 'email_verification',
        name: 'Email Verification',
        description: 'Test description',
        subject: {
          en: 'Test',
        },
        bodyHtml: {
          en: '<p>Content</p>',
        },
        bodyText: {
          en: 'Content',
        },
        variables: ['userName', 'verificationLink', 'expiryHours'],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate);

      const result = await renderer.render(
        'email_verification',
        {
          userName: 'Test',
          verificationLink: 'https://test.com',
          expiryHours: 24,
        },
        'en'
      );

      expect(result.bodyHtml).toContain('Test Community Hub');
      expect(result.bodyHtml).toContain('#2C5F7C'); // Primary color
      expect(result.bodyHtml).toContain('Test Organization'); // Copyright holder
      expect(result.bodyHtml).toContain('support@test.com'); // Support email
    });
  });
});
