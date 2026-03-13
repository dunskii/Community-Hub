/**
 * Quick Reply Service Unit Tests
 * Phase 9: Messaging System
 *
 * Unit tests with proper mocking for QuickReplyService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the service
const mockPrisma = {
  quickReplyTemplate: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  business: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

vi.mock('../../db/index.js', () => ({
  prisma: mockPrisma,
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
import { quickReplyService } from '../quick-reply-service.js';

describe('QuickReplyService', () => {
  const mockAuditContext = {
    actorId: 'owner-1',
    actorRole: 'BUSINESS_OWNER',
    ipAddress: '192.168.1.1',
    userAgent: 'test-agent',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTemplate', () => {
    const mockBusiness = {
      id: 'biz-1',
      claimedBy: 'owner-1',
    };

    it('should create a new template', async () => {
      const mockTemplate = {
        id: 'template-1',
        businessId: 'biz-1',
        name: 'Welcome',
        content: 'Thank you for contacting us!',
        shortcut: 'welcome',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.quickReplyTemplate.count.mockResolvedValue(0);
      mockPrisma.quickReplyTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.quickReplyTemplate.aggregate.mockResolvedValue({ _max: { displayOrder: null } });
      mockPrisma.quickReplyTemplate.create.mockResolvedValue(mockTemplate);
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await quickReplyService.createTemplate(
        'biz-1',
        'owner-1',
        { name: 'Welcome', content: 'Thank you for contacting us!', shortcut: 'welcome' },
        mockAuditContext
      );

      expect(result.id).toBe('template-1');
      expect(result.name).toBe('Welcome');
      expect(mockPrisma.quickReplyTemplate.create).toHaveBeenCalled();
    });

    it('should throw error if not business owner', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'biz-1',
        claimedBy: 'other-owner',
      });

      await expect(
        quickReplyService.createTemplate(
          'biz-1',
          'owner-1',
          { name: 'Test', content: 'Test content' },
          mockAuditContext
        )
      ).rejects.toThrow('Not authorized to manage this business');
    });

    it('should enforce template limit', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.quickReplyTemplate.count.mockResolvedValue(50); // At limit

      await expect(
        quickReplyService.createTemplate(
          'biz-1',
          'owner-1',
          { name: 'Test', content: 'Test' },
          mockAuditContext
        )
      ).rejects.toThrow('Maximum template limit reached');
    });

    it('should prevent duplicate shortcuts', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.quickReplyTemplate.count.mockResolvedValue(5);
      mockPrisma.quickReplyTemplate.findFirst.mockResolvedValue({
        id: 'existing-1',
        shortcut: 'welcome',
      });

      await expect(
        quickReplyService.createTemplate(
          'biz-1',
          'owner-1',
          { name: 'Welcome', content: 'Test', shortcut: 'welcome' },
          mockAuditContext
        )
      ).rejects.toThrow('Shortcut already exists');
    });
  });

  describe('getTemplates', () => {
    it('should return all templates for business', async () => {
      const mockBusiness = {
        id: 'biz-1',
        claimedBy: 'owner-1',
      };

      const mockTemplates = [
        { id: 't-1', name: 'Welcome', content: 'Hello!', displayOrder: 0 },
        { id: 't-2', name: 'Hours', content: 'We are open...', displayOrder: 1 },
      ];

      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.quickReplyTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await quickReplyService.getTemplates('biz-1', 'owner-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.quickReplyTemplate.findMany).toHaveBeenCalledWith({
        where: { businessId: 'biz-1' },
        orderBy: { displayOrder: 'asc' },
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template by ID', async () => {
      const mockTemplate = {
        id: 'template-1',
        businessId: 'biz-1',
        name: 'Welcome',
        content: 'Hello!',
        business: { claimedBy: 'owner-1' },
      };

      mockPrisma.quickReplyTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await quickReplyService.getTemplateById('template-1', 'owner-1');

      expect(result.id).toBe('template-1');
    });

    it('should throw error if template not found', async () => {
      mockPrisma.quickReplyTemplate.findUnique.mockResolvedValue(null);

      await expect(
        quickReplyService.getTemplateById('nonexistent', 'owner-1')
      ).rejects.toThrow('Template not found');
    });
  });

  describe('updateTemplate', () => {
    it('should update template', async () => {
      const mockTemplate = {
        id: 'template-1',
        businessId: 'biz-1',
        name: 'Welcome',
        content: 'Hello!',
        business: { claimedBy: 'owner-1' },
      };

      const updatedTemplate = {
        ...mockTemplate,
        content: 'Hello and welcome!',
      };

      mockPrisma.quickReplyTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.quickReplyTemplate.findFirst.mockResolvedValue(null);
      mockPrisma.quickReplyTemplate.update.mockResolvedValue(updatedTemplate);
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await quickReplyService.updateTemplate(
        'template-1',
        'owner-1',
        { content: 'Hello and welcome!' },
        mockAuditContext
      );

      expect(result.content).toBe('Hello and welcome!');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template and reorder remaining', async () => {
      const mockTemplate = {
        id: 'template-1',
        businessId: 'biz-1',
        displayOrder: 1,
        business: { claimedBy: 'owner-1' },
      };

      mockPrisma.quickReplyTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.quickReplyTemplate.delete.mockResolvedValue(mockTemplate);
      mockPrisma.quickReplyTemplate.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await quickReplyService.deleteTemplate('template-1', 'owner-1', mockAuditContext);

      expect(mockPrisma.quickReplyTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });

      // Should reorder templates after deletion
      expect(mockPrisma.quickReplyTemplate.updateMany).toHaveBeenCalledWith({
        where: {
          businessId: 'biz-1',
          displayOrder: { gt: 1 },
        },
        data: {
          displayOrder: { decrement: 1 },
        },
      });
    });
  });

  describe('reorderTemplates', () => {
    it('should reorder templates by ID list', async () => {
      const mockBusiness = {
        id: 'biz-1',
        claimedBy: 'owner-1',
      };

      const mockTemplates = [
        { id: 't-1', businessId: 'biz-1' },
        { id: 't-2', businessId: 'biz-1' },
        { id: 't-3', businessId: 'biz-1' },
      ];

      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.quickReplyTemplate.findMany.mockResolvedValue(mockTemplates);
      mockPrisma.quickReplyTemplate.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      await quickReplyService.reorderTemplates(
        'biz-1',
        'owner-1',
        ['t-3', 't-1', 't-2'],
        mockAuditContext
      );

      // Should update each template with new order
      expect(mockPrisma.quickReplyTemplate.update).toHaveBeenCalledTimes(3);
      expect(mockPrisma.quickReplyTemplate.update).toHaveBeenCalledWith({
        where: { id: 't-3' },
        data: { displayOrder: 0 },
      });
      expect(mockPrisma.quickReplyTemplate.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { displayOrder: 1 },
      });
      expect(mockPrisma.quickReplyTemplate.update).toHaveBeenCalledWith({
        where: { id: 't-2' },
        data: { displayOrder: 2 },
      });
    });

    it('should throw error if template IDs do not match', async () => {
      const mockBusiness = {
        id: 'biz-1',
        claimedBy: 'owner-1',
      };

      const mockTemplates = [
        { id: 't-1', businessId: 'biz-1' },
        { id: 't-2', businessId: 'biz-1' },
      ];

      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.quickReplyTemplate.findMany.mockResolvedValue(mockTemplates);

      await expect(
        quickReplyService.reorderTemplates(
          'biz-1',
          'owner-1',
          ['t-1', 't-2', 't-3'], // t-3 doesn't exist
          mockAuditContext
        )
      ).rejects.toThrow('Template IDs do not match existing templates');
    });
  });
});
