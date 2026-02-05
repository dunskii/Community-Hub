import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MailgunClient } from '../../email/mailgun-client.js';

// Mock the mailgun.js module
vi.mock('mailgun.js', () => {
  const MockMailgun = vi.fn(() => ({
    client: vi.fn(() => ({
      messages: {
        create: vi.fn(),
      },
      domains: {
        get: vi.fn(),
      },
    })),
  }));
  return { default: MockMailgun };
});

describe('MailgunClient', () => {
  let client: MailgunClient;
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockDomainsGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new MailgunClient({
      apiKey: 'test-api-key',
      domain: 'test.example.com',
    });

    // Access the mocked methods
    mockCreate = vi.fn().mockResolvedValue({ id: '<test-message-id>', status: 200 });
    mockDomainsGet = vi.fn().mockResolvedValue({ state: 'active' });

    // Replace the client's methods with our mocks
    (client as any).client.messages.create = mockCreate;
    (client as any).client.domains.get = mockDomainsGet;
  });

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      const messageId = await client.sendEmail({
        to: 'user@example.com',
        from: 'noreply@guildfordhub.com.au',
        subject: 'Test Email',
        html: '<p>Test HTML</p>',
        text: 'Test plain text',
      });

      expect(messageId).toBe('<test-message-id>');
      expect(mockCreate).toHaveBeenCalledWith(
        'test.example.com',
        expect.objectContaining({
          to: ['user@example.com'],
          from: 'noreply@guildfordhub.com.au',
          subject: 'Test Email',
          html: '<p>Test HTML</p>',
          text: 'Test plain text',
        })
      );
    });

    it('should handle array of recipients', async () => {
      await client.sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        from: 'noreply@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'test.example.com',
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com'],
        })
      );
    });

    it('should include custom headers', async () => {
      await client.sendEmail({
        to: 'user@example.com',
        from: 'noreply@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
        headers: {
          'List-Unsubscribe': '<https://example.com/unsubscribe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'test.example.com',
        expect.objectContaining({
          'h:List-Unsubscribe': '<https://example.com/unsubscribe>',
          'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        })
      );
    });

    it('should include tags', async () => {
      await client.sendEmail({
        to: 'user@example.com',
        from: 'noreply@test.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
        tags: ['email_verification', 'auth'],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        'test.example.com',
        expect.objectContaining({
          'o:tag': ['email_verification', 'auth'],
        })
      );
    });

    it('should throw error on Mailgun API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(
        client.sendEmail({
          to: 'user@example.com',
          from: 'noreply@test.com',
          subject: 'Test',
          html: '<p>Test</p>',
          text: 'Test',
        })
      ).rejects.toThrow('Mailgun send failed');
    });
  });

  describe('verifyDomain', () => {
    it('should return true for active domain', async () => {
      mockDomainsGet.mockResolvedValue({ state: 'active' });

      const result = await client.verifyDomain();

      expect(result).toBe(true);
      expect(mockDomainsGet).toHaveBeenCalledWith('test.example.com');
    });

    it('should return false for inactive domain', async () => {
      mockDomainsGet.mockResolvedValue({ state: 'unverified' });

      const result = await client.verifyDomain();

      expect(result).toBe(false);
    });

    it('should return false on domain verification error', async () => {
      mockDomainsGet.mockRejectedValue(new Error('Domain not found'));

      const result = await client.verifyDomain();

      expect(result).toBe(false);
    });
  });
});
