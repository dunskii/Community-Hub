/**
 * Message Service Unit Tests
 * Phase 9: Messaging System
 *
 * Unit tests with proper mocking for MessageService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message, MessageAttachment, Conversation, Business, User } from '../../generated/prisma/index.js';
import { SenderType, ConversationStatus, ActorRole } from '../../generated/prisma/index.js';

// Mock dependencies before importing the service
const mockPrisma = {
  conversation: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  message: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  messageAttachment: {
    createMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

const mockRedis = {
  del: vi.fn(),
};

vi.mock('../../db/index.js', () => ({
  prisma: mockPrisma,
}));

vi.mock('../../cache/redis-client.js', () => ({
  getRedis: () => mockRedis,
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { messageService } from '../message-service.js';

describe('MessageService', () => {
  const mockAuditContext = {
    actorId: 'user-1',
    actorRole: 'COMMUNITY',
    ipAddress: '192.168.1.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    const mockConversation = {
      id: 'conv-1',
      userId: 'user-1',
      businessId: 'biz-1',
      status: ConversationStatus.ACTIVE,
      business: {
        id: 'biz-1',
        claimedBy: 'owner-1',
      },
      user: {
        id: 'user-1',
        displayName: 'Test User',
        profilePhoto: null,
      },
    };

    it('should send a message from user', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderType: SenderType.USER,
        senderId: 'user-1',
        content: 'Hello, I have a question',
        readAt: null,
        deletedAt: null,
        createdAt: new Date(),
        attachments: [],
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage);
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await messageService.sendMessage(
        'conv-1',
        'user-1',
        { content: 'Hello, I have a question' },
        mockAuditContext
      );

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello, I have a question');
      expect(result.senderType).toBe(SenderType.USER);
      expect(result.sender).toEqual(mockConversation.user);
    });

    it('should send a message from business owner', async () => {
      const mockOwner = {
        id: 'owner-1',
        displayName: 'Business Owner',
        profilePhoto: 'photo.jpg',
      };

      const mockMessage = {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderType: SenderType.BUSINESS,
        senderId: 'owner-1',
        content: 'Thank you for reaching out!',
        readAt: null,
        deletedAt: null,
        createdAt: new Date(),
        attachments: [],
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.message.findUnique.mockResolvedValue(mockMessage);
      mockPrisma.conversation.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await messageService.sendMessage(
        'conv-1',
        'owner-1',
        { content: 'Thank you for reaching out!' },
        { ...mockAuditContext, actorId: 'owner-1', actorRole: 'BUSINESS_OWNER' }
      );

      expect(result.senderType).toBe(SenderType.BUSINESS);
      expect(result.sender).toEqual(mockOwner);
    });

    it('should throw error if conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        messageService.sendMessage('nonexistent', 'user-1', { content: 'test' }, mockAuditContext)
      ).rejects.toThrow('Conversation not found');
    });

    it('should throw error if user is not participant', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        messageService.sendMessage('conv-1', 'stranger-1', { content: 'test' }, mockAuditContext)
      ).rejects.toThrow('You are not a participant in this conversation');
    });

    it('should throw error if conversation is blocked', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.BLOCKED,
      });

      await expect(
        messageService.sendMessage('conv-1', 'user-1', { content: 'test' }, mockAuditContext)
      ).rejects.toThrow('You are blocked from messaging this business');
    });
  });

  describe('getMessages', () => {
    const mockConversation = {
      id: 'conv-1',
      userId: 'user-1',
      businessId: 'biz-1',
      business: {
        claimedBy: 'owner-1',
      },
    };

    it('should get paginated messages with batch-loaded senders', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderType: SenderType.USER,
          senderId: 'user-1',
          content: 'First message',
          readAt: null,
          deletedAt: null,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          attachments: [],
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          senderType: SenderType.BUSINESS,
          senderId: 'owner-1',
          content: 'Reply message',
          readAt: null,
          deletedAt: null,
          createdAt: new Date('2024-01-01T11:00:00Z'),
          attachments: [],
        },
      ];

      const mockSenders = [
        { id: 'user-1', displayName: 'Test User', profilePhoto: null },
        { id: 'owner-1', displayName: 'Business Owner', profilePhoto: 'photo.jpg' },
      ];

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.message.count.mockResolvedValue(2);
      mockPrisma.message.findMany.mockResolvedValue(mockMessages);
      mockPrisma.user.findMany.mockResolvedValue(mockSenders);

      const result = await messageService.getMessages('conv-1', 'user-1', { page: 1, limit: 20 });

      expect(result.messages).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);

      // Verify batch query was used (single findMany call)
      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'owner-1'] } },
        select: { id: true, displayName: true, profilePhoto: true },
      });

      // Verify senders are mapped correctly
      expect(result.messages[0].sender?.displayName).toBe('Test User');
      expect(result.messages[1].sender?.displayName).toBe('Business Owner');
    });

    it('should throw error if not authorized', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        messageService.getMessages('conv-1', 'stranger-1', { page: 1, limit: 20 })
      ).rejects.toThrow('You are not authorized to view these messages');
    });

    it('should handle empty message list', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.message.count.mockResolvedValue(0);
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await messageService.getMessages('conv-1', 'user-1', { page: 1, limit: 20 });

      expect(result.messages).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      // Should not call findMany for senders when no messages
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    const mockConversation = {
      id: 'conv-1',
      userId: 'user-1',
      businessId: 'biz-1',
      business: {
        claimedBy: 'owner-1',
      },
    };

    it('should mark messages as read for user', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.message.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.conversation.update.mockResolvedValue({});

      await messageService.markAsRead('conv-1', 'user-1', mockAuditContext);

      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          senderType: SenderType.BUSINESS,
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });

      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { unreadCountUser: 0 },
      });
    });

    it('should mark messages as read for business owner', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.message.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.conversation.update.mockResolvedValue({});

      await messageService.markAsRead('conv-1', 'owner-1', mockAuditContext);

      expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          senderType: SenderType.USER,
          readAt: null,
        },
        data: { readAt: expect.any(Date) },
      });

      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { unreadCountBusiness: 0 },
      });
    });
  });

  describe('deleteMessage', () => {
    it('should soft delete a message within 24h window', async () => {
      const recentMessage = {
        id: 'msg-1',
        senderId: 'user-1',
        createdAt: new Date(), // Just created
        deletedAt: null,
        content: 'Test message',
        conversation: {
          userId: 'user-1',
          businessId: 'biz-1',
          business: { claimedBy: 'owner-1' },
        },
      };

      mockPrisma.message.findUnique.mockResolvedValue(recentMessage);
      mockPrisma.message.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      await messageService.deleteMessage('msg-1', 'user-1', mockAuditContext);

      expect(mockPrisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error if message already deleted', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'user-1',
        createdAt: new Date(),
        deletedAt: new Date(),
        content: 'Test',
        conversation: {},
      });

      await expect(
        messageService.deleteMessage('msg-1', 'user-1', mockAuditContext)
      ).rejects.toThrow('Message is already deleted');
    });

    it('should throw error if not message sender', async () => {
      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'other-user',
        createdAt: new Date(),
        deletedAt: null,
        content: 'Test',
        conversation: {},
      });

      await expect(
        messageService.deleteMessage('msg-1', 'user-1', mockAuditContext)
      ).rejects.toThrow('You can only delete your own messages');
    });

    it('should throw error if 24h window expired', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago

      mockPrisma.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'user-1',
        createdAt: oldDate,
        deletedAt: null,
        content: 'Test',
        conversation: {},
      });

      await expect(
        messageService.deleteMessage('msg-1', 'user-1', mockAuditContext)
      ).rejects.toThrow('Messages can only be deleted within 24 hours of sending');
    });
  });
});
