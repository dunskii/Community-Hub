/**
 * Moderation Service Unit Tests
 * Phase 6: User Engagement Features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModerationService } from '../moderation-service.js';
import { ApiError } from '../../utils/api-error.js';

// Mock Prisma
vi.mock('../../db/index.js', () => ({
  prisma: {
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    moderationReport: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    appeal: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '../../db/index.js';

describe('ModerationService', () => {
  let moderationService: ModerationService;
  const mockReviewId = 'review-123';
  const mockModeratorId = 'moderator-456';
  const mockUserId = 'user-789';
  const mockAuditContext = {
    actorId: mockModeratorId,
    actorRole: 'ADMIN',
    ipAddress: '127.0.0.1',
    userAgent: 'TestAgent',
  };

  beforeEach(() => {
    moderationService = new ModerationService();
    vi.clearAllMocks();
  });

  describe('approveReview', () => {
    it('should approve a pending review', async () => {
      const mockReview = {
        id: mockReviewId,
        status: 'PENDING',
        userId: mockUserId,
        businessId: 'business-1',
      };
      const mockUpdatedReview = {
        ...mockReview,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        user: { id: mockUserId, displayName: 'Test User', email: 'test@example.com' },
        business: { id: 'business-1', name: 'Test Business', slug: 'test-business' },
      };

      vi.mocked(prisma.review.findUnique).mockResolvedValue(mockReview as any);
      vi.mocked(prisma.review.update).mockResolvedValue(mockUpdatedReview as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await moderationService.approveReview(
        mockReviewId,
        mockModeratorId,
        'Looks good',
        mockAuditContext
      );

      expect(result.status).toBe('PUBLISHED');
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: {
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
          moderationNotes: 'Looks good',
        },
        include: expect.any(Object),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw error when review not found', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);

      await expect(
        moderationService.approveReview(mockReviewId, mockModeratorId, null, mockAuditContext)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when review is not pending', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue({
        id: mockReviewId,
        status: 'PUBLISHED', // Already published
      } as any);

      await expect(
        moderationService.approveReview(mockReviewId, mockModeratorId, null, mockAuditContext)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('rejectReview', () => {
    it('should reject a pending review', async () => {
      const mockReview = { id: mockReviewId, status: 'PENDING' };

      vi.mocked(prisma.review.findUnique).mockResolvedValue(mockReview as any);
      vi.mocked(prisma.review.update).mockResolvedValue({} as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await moderationService.rejectReview(
        mockReviewId,
        mockModeratorId,
        'Violates guidelines',
        'Please review our terms of service',
        mockAuditContext
      );

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: {
          status: 'HIDDEN',
          moderationNotes: 'Violates guidelines\n\nPlease review our terms of service',
        },
      });
    });

    it('should throw error when review not found', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);

      await expect(
        moderationService.rejectReview(
          mockReviewId,
          mockModeratorId,
          'Reason',
          null,
          mockAuditContext
        )
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when review is not pending', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue({
        id: mockReviewId,
        status: 'HIDDEN', // Already hidden
      } as any);

      await expect(
        moderationService.rejectReview(
          mockReviewId,
          mockModeratorId,
          'Reason',
          null,
          mockAuditContext
        )
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getModerationQueue', () => {
    it('should return paginated pending reviews', async () => {
      const mockReviews = [
        { id: 'review-1', status: 'PENDING', createdAt: new Date() },
        { id: 'review-2', status: 'PENDING', createdAt: new Date() },
      ];

      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);
      vi.mocked(prisma.review.count).mockResolvedValue(10);

      const result = await moderationService.getModerationQueue({}, { page: 1, limit: 2 });

      expect(result.reviews).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.totalPages).toBe(5);
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.review.findMany).mockResolvedValue([]);
      vi.mocked(prisma.review.count).mockResolvedValue(0);

      await moderationService.getModerationQueue({ status: 'PENDING' }, { page: 1, limit: 10 });

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
        })
      );
    });
  });

  describe('reportContent', () => {
    it('should create a moderation report', async () => {
      const mockReport = {
        id: 'report-1',
        reporterId: mockUserId,
        contentType: 'REVIEW',
        contentId: mockReviewId,
        reason: 'SPAM',
        details: 'This is spam',
        status: 'PENDING',
        reporter: { id: mockUserId, displayName: 'Test User', email: 'test@test.com' },
      };

      vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: mockReviewId } as any);
      vi.mocked(prisma.moderationReport.create).mockResolvedValue(mockReport as any);

      const result = await moderationService.reportContent(
        'REVIEW',
        mockReviewId,
        'SPAM',
        'This is spam',
        mockUserId
      );

      expect(result).toEqual(mockReport);
      expect(prisma.moderationReport.create).toHaveBeenCalledWith({
        data: {
          reporterId: mockUserId,
          contentType: 'REVIEW',
          contentId: mockReviewId,
          reason: 'SPAM',
          details: 'This is spam',
          status: 'PENDING',
        },
        include: expect.any(Object),
      });
    });

    it('should throw error when content not found', async () => {
      vi.mocked(prisma.review.findUnique).mockResolvedValue(null);

      await expect(
        moderationService.reportContent('REVIEW', mockReviewId, 'SPAM', null, mockUserId)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('appealRejection', () => {
    it('should create an appeal', async () => {
      const mockAppeal = {
        id: 'appeal-1',
        userId: mockUserId,
        contentType: 'REVIEW',
        contentId: mockReviewId,
        originalAction: 'REJECTED',
        reason: 'I believe this was a mistake and I have evidence to support my claim',
        supportingEvidence: ['screenshot.png'],
        status: 'PENDING',
        user: { id: mockUserId, displayName: 'Test User', email: 'test@test.com' },
      };

      vi.mocked(prisma.appeal.create).mockResolvedValue(mockAppeal as any);

      const result = await moderationService.appealRejection(
        mockReviewId,
        'REVIEW',
        'REJECTED',
        'I believe this was a mistake and I have evidence to support my claim',
        ['screenshot.png'],
        mockUserId
      );

      expect(result).toEqual(mockAppeal);
    });

    it('should throw error when reason too short', async () => {
      await expect(
        moderationService.appealRejection(
          mockReviewId,
          'REVIEW',
          'REJECTED',
          'Short', // Less than 10 characters
          [],
          mockUserId
        )
      ).rejects.toThrow(ApiError);
    });
  });

  describe('reviewAppeal', () => {
    it('should uphold an appeal', async () => {
      const mockAppeal = {
        id: 'appeal-1',
        userId: mockUserId,
        contentType: 'REVIEW',
        contentId: mockReviewId,
        status: 'PENDING',
      };
      const mockUpdatedAppeal = {
        ...mockAppeal,
        status: 'UPHELD',
        reviewerId: mockModeratorId,
        user: { id: mockUserId, displayName: 'Test User', email: 'test@test.com' },
      };

      vi.mocked(prisma.appeal.findUnique).mockResolvedValue(mockAppeal as any);
      vi.mocked(prisma.appeal.update).mockResolvedValue(mockUpdatedAppeal as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await moderationService.reviewAppeal(
        'appeal-1',
        'UPHELD',
        'Appeal is valid',
        mockModeratorId,
        mockAuditContext
      );

      expect(result.status).toBe('UPHELD');
    });

    it('should reject an appeal', async () => {
      const mockAppeal = {
        id: 'appeal-1',
        userId: mockUserId,
        contentType: 'REVIEW',
        contentId: mockReviewId,
        status: 'PENDING',
      };
      const mockUpdatedAppeal = {
        ...mockAppeal,
        status: 'REJECTED',
        user: { id: mockUserId, displayName: 'Test User', email: 'test@test.com' },
      };

      vi.mocked(prisma.appeal.findUnique).mockResolvedValue(mockAppeal as any);
      vi.mocked(prisma.appeal.update).mockResolvedValue(mockUpdatedAppeal as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      const result = await moderationService.reviewAppeal(
        'appeal-1',
        'REJECTED',
        'Appeal not valid',
        mockModeratorId,
        mockAuditContext
      );

      expect(result.status).toBe('REJECTED');
    });

    it('should throw error when appeal not found', async () => {
      vi.mocked(prisma.appeal.findUnique).mockResolvedValue(null);

      await expect(
        moderationService.reviewAppeal(
          'appeal-1',
          'UPHELD',
          'Notes',
          mockModeratorId,
          mockAuditContext
        )
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when appeal already reviewed', async () => {
      vi.mocked(prisma.appeal.findUnique).mockResolvedValue({
        id: 'appeal-1',
        status: 'UPHELD', // Already reviewed
      } as any);

      await expect(
        moderationService.reviewAppeal(
          'appeal-1',
          'UPHELD',
          'Notes',
          mockModeratorId,
          mockAuditContext
        )
      ).rejects.toThrow(ApiError);
    });
  });
});
