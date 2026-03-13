/**
 * Conversation Service Unit Tests
 * Phase 9: Messaging System
 *
 * Unit tests with proper mocking for ConversationService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationStatus, SenderType, UserStatus, ModerationStatus } from '../../generated/prisma/index.js';

// Mock dependencies before importing the service
const mockPrisma = {
  conversation: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  business: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  message: {
    count: vi.fn(),
  },
  moderationReport: {
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

const mockRedis = {
  get: vi.fn(),
  setex: vi.fn(),
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
import { conversationService } from '../conversation-service.js';

describe('ConversationService', () => {
  const mockAuditContext = {
    actorId: 'user-1',
    actorRole: 'COMMUNITY',
    ipAddress: '192.168.1.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversation', () => {
    const mockBusiness = {
      id: 'biz-1',
      name: 'Test Business',
      slug: 'test-business',
      status: 'ACTIVE',
      claimedBy: 'owner-1',
      owner: {
        id: 'owner-1',
        displayName: 'Business Owner',
        profilePhoto: null,
      },
    };

    const mockUser = {
      id: 'user-1',
      displayName: 'Test User',
      profilePhoto: null,
      status: UserStatus.ACTIVE,
    };

    it('should create a new conversation', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        unreadCountUser: 0,
        unreadCountBusiness: 1,
        business: {
          id: 'biz-1',
          name: 'Test Business',
          slug: 'test-business',
        },
      };

      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.conversation.create.mockResolvedValue(mockConversation);
      mockPrisma.conversation.count.mockResolvedValue(0);
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await conversationService.createConversation(
        'user-1',
        'biz-1',
        { subject: 'Question about hours', initialMessage: 'When do you open?' },
        mockAuditContext
      );

      expect(result.id).toBe('conv-1');
      expect(mockPrisma.conversation.create).toHaveBeenCalled();
    });

    it('should return existing conversation if one exists', async () => {
      const existingConversation = {
        id: 'existing-conv',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        business: {
          id: 'biz-1',
          name: 'Test Business',
          slug: 'test-business',
        },
      };

      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findFirst.mockResolvedValue(existingConversation);

      const result = await conversationService.createConversation(
        'user-1',
        'biz-1',
        { subject: 'Another question', initialMessage: 'Hello again' },
        mockAuditContext
      );

      expect(result.id).toBe('existing-conv');
      expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
    });

    it('should throw error if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);

      await expect(
        conversationService.createConversation(
          'user-1',
          'nonexistent',
          { subject: 'Test', initialMessage: 'Test' },
          mockAuditContext
        )
      ).rejects.toThrow('Business not found');
    });

    it('should throw error if business not claimed', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        ...mockBusiness,
        claimedBy: null,
      });

      await expect(
        conversationService.createConversation(
          'user-1',
          'biz-1',
          { subject: 'Test', initialMessage: 'Test' },
          mockAuditContext
        )
      ).rejects.toThrow('This business is not accepting messages');
    });

    it('should enforce daily conversation limit', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      mockPrisma.conversation.count.mockResolvedValue(10); // At limit

      await expect(
        conversationService.createConversation(
          'user-1',
          'biz-1',
          { subject: 'Test', initialMessage: 'Test' },
          mockAuditContext
        )
      ).rejects.toThrow('Daily conversation limit reached');
    });
  });

  describe('getConversationById', () => {
    it('should return conversation for participant', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        business: {
          id: 'biz-1',
          name: 'Test Business',
          slug: 'test-business',
          claimedBy: 'owner-1',
        },
        user: {
          id: 'user-1',
          displayName: 'Test User',
          profilePhoto: null,
        },
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await conversationService.getConversationById('conv-1', 'user-1');

      expect(result.id).toBe('conv-1');
    });

    it('should throw error if not participant', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        business: { claimedBy: 'owner-1' },
        user: {},
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        conversationService.getConversationById('conv-1', 'stranger-1')
      ).rejects.toThrow('You are not authorized to view this conversation');
    });
  });

  describe('getUserConversations', () => {
    it('should return paginated conversations for user', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          userId: 'user-1',
          businessId: 'biz-1',
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
          business: { id: 'biz-1', name: 'Business 1', slug: 'biz-1' },
          messages: [{ content: 'Latest message' }],
        },
        {
          id: 'conv-2',
          userId: 'user-1',
          businessId: 'biz-2',
          status: ConversationStatus.ACTIVE,
          lastMessageAt: new Date(),
          business: { id: 'biz-2', name: 'Business 2', slug: 'biz-2' },
          messages: [{ content: 'Another message' }],
        },
      ];

      mockPrisma.conversation.count.mockResolvedValue(2);
      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await conversationService.getUserConversations('user-1', {
        page: 1,
        limit: 20,
      });

      expect(result.conversations).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrisma.conversation.count.mockResolvedValue(1);
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      await conversationService.getUserConversations('user-1', {
        page: 1,
        limit: 20,
        status: ConversationStatus.ARCHIVED,
      });

      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ConversationStatus.ARCHIVED,
          }),
        })
      );
    });
  });

  describe('archiveConversation', () => {
    it('should archive conversation for user', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        business: { claimedBy: 'owner-1' },
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.conversation.update.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.ARCHIVED,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await conversationService.archiveConversation('conv-1', 'user-1', mockAuditContext);

      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.ARCHIVED },
      });
    });
  });

  describe('blockConversation', () => {
    it('should block conversation for business owner', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        business: { claimedBy: 'owner-1' },
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.conversation.update.mockResolvedValue({
        ...mockConversation,
        status: ConversationStatus.BLOCKED,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await conversationService.blockConversation('conv-1', 'owner-1', mockAuditContext);

      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { status: ConversationStatus.BLOCKED },
      });
    });

    it('should throw error if not business owner', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        business: { claimedBy: 'owner-1' },
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(
        conversationService.blockConversation('conv-1', 'user-1', mockAuditContext)
      ).rejects.toThrow('Only business owners can block conversations');
    });
  });

  describe('reportConversation', () => {
    it('should create moderation report', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        businessId: 'biz-1',
        status: ConversationStatus.ACTIVE,
        business: { claimedBy: 'owner-1' },
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrisma.moderationReport.create.mockResolvedValue({
        id: 'report-1',
        status: ModerationStatus.PENDING,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await conversationService.reportConversation(
        'conv-1',
        'owner-1',
        { reason: 'HARASSMENT', description: 'User is sending harassing messages' },
        mockAuditContext
      );

      expect(result.status).toBe(ModerationStatus.PENDING);
      expect(mockPrisma.moderationReport.create).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count from cache', async () => {
      mockRedis.get.mockResolvedValue('5');

      const result = await conversationService.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrisma.conversation.findMany).not.toHaveBeenCalled();
    });

    it('should calculate and cache unread count on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.conversation.findMany.mockResolvedValue([
        { unreadCountUser: 3 },
        { unreadCountUser: 2 },
      ]);

      const result = await conversationService.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('unread'),
        300,
        '5'
      );
    });
  });
});
