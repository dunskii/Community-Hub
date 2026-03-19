/**
 * Data Retention Scheduler Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before any imports
vi.mock('../../db/index.js', () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    message: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks are set up
import { DataRetentionScheduler } from '../data-retention-scheduler.js';
import { prisma } from '../../db/index.js';

// Cast prisma methods for type safety in tests
const mockPrisma = prisma as unknown as {
  auditLog: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  message: {
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

describe('DataRetentionScheduler', () => {
  let scheduler: DataRetentionScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    scheduler = new DataRetentionScheduler();
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
  });

  describe('Lifecycle', () => {
    it('should start the scheduler', () => {
      scheduler.start();

      const status = scheduler.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should not start if already running', () => {
      scheduler.start();
      scheduler.start(); // Second call should be ignored

      const status = scheduler.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop the scheduler', () => {
      scheduler.start();
      scheduler.stop();

      const status = scheduler.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('Status', () => {
    it('should return correct status', () => {
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.isProcessing).toBe(false);
      expect(status.intervalMs).toBe(24 * 60 * 60 * 1000);
      expect(status.retentionPeriods.ipAddressDays).toBe(90);
      expect(status.retentionPeriods.auditLogDays).toBe(365);
      expect(status.retentionPeriods.deletedMessageDays).toBe(30);
    });
  });

  describe('IP Anonymization', () => {
    it('should anonymize old IP addresses in audit logs', async () => {
      const oldAuditLogs = [
        { id: 'log-1', ipAddress: '192.168.1.1' },
        { id: 'log-2', ipAddress: '10.0.0.1' },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(oldAuditLogs);
      mockPrisma.auditLog.update.mockResolvedValue({});
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 0 });

      const result = await scheduler.triggerRetention();

      expect(result.ipAddressesAnonymized).toBe(2);
      expect(mockPrisma.auditLog.update).toHaveBeenCalledTimes(2);
    });

    it('should skip already anonymized IPs (filtered at query level)', async () => {
      // With the NOT { startsWith: 'ANON:' } filter, findMany won't return
      // already anonymized entries, so we mock an empty result
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 0 });

      const result = await scheduler.triggerRetention();

      expect(result.ipAddressesAnonymized).toBe(0);
      expect(mockPrisma.auditLog.update).not.toHaveBeenCalled();
    });
  });

  describe('Audit Log Cleanup', () => {
    it('should delete old audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(100);
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 100 });
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 0 });

      const result = await scheduler.triggerRetention();

      expect(result.auditLogsDeleted).toBe(100);
      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalled();
    });

    it('should handle no logs to delete', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 0 });

      const result = await scheduler.triggerRetention();

      expect(result.auditLogsDeleted).toBe(0);
    });
  });

  describe('Message Hard Delete', () => {
    it('should hard delete soft-deleted messages past retention', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 50 });

      const result = await scheduler.triggerRetention();

      expect(result.messagesHardDeleted).toBe(50);
      expect(mockPrisma.message.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('DB error'));
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.message.deleteMany.mockResolvedValue({ count: 0 });

      // Should not throw
      const result = await scheduler.triggerRetention();

      expect(result.ipAddressesAnonymized).toBe(0);
    });
  });
});
