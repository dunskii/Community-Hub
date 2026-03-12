/**
 * Event Reminder Scheduler Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing scheduler
vi.mock('../../db/index.js', () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    systemSetting: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../cache/redis-client.js', () => ({
  getRedis: vi.fn(),
}));

vi.mock('../../services/event-notification-service.js', () => ({
  eventNotificationService: {
    sendEventReminders: vi.fn().mockResolvedValue(undefined),
  },
  EventNotificationService: vi.fn(),
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { EventReminderScheduler } from '../event-reminder-scheduler.js';
import { prisma } from '../../db/index.js';
import { getRedis } from '../../cache/redis-client.js';
import { eventNotificationService } from '../../services/event-notification-service.js';
import { logger } from '../../utils/logger.js';

describe('EventReminderScheduler', () => {
  let scheduler: EventReminderScheduler;
  let mockRedis: {
    exists: ReturnType<typeof vi.fn>;
    setex: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    scheduler = new EventReminderScheduler();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup mock Redis
    mockRedis = {
      exists: vi.fn().mockResolvedValue(0),
      setex: vi.fn().mockResolvedValue('OK'),
    };
    vi.mocked(getRedis).mockReturnValue(mockRedis as unknown as ReturnType<typeof getRedis>);
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
  });

  describe('start/stop', () => {
    it('should start the scheduler', () => {
      scheduler.start();
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.intervalMs).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should not start twice', () => {
      scheduler.start();
      scheduler.start();

      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        'Event reminder scheduler is already running'
      );
    });

    it('should stop the scheduler', () => {
      scheduler.start();
      scheduler.stop();

      const status = scheduler.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe('checkAndSendReminders', () => {
    it('should log when no events need reminders', async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([]);

      await scheduler.triggerCheck();

      expect(vi.mocked(logger.debug)).toHaveBeenCalledWith(
        'No events need reminders at this time'
      );
    });

    it('should find and process 24h reminders', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
        locationType: 'PHYSICAL',
        venue: { street: '123 Main St', suburb: 'Sydney', state: 'NSW', postcode: '2000' },
        onlineUrl: null,
        createdBy: { displayName: 'John Doe' },
      };

      // First call (24h check) returns event, second call (1h check) returns empty
      vi.mocked(prisma.event.findMany)
        .mockResolvedValueOnce([{ id: 'event-1', title: 'Test Event', startTime: mockEvent.startTime }] as never[])
        .mockResolvedValueOnce([]);

      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
      vi.mocked(mockRedis.exists).mockResolvedValue(0);

      await scheduler.triggerCheck();

      expect(vi.mocked(eventNotificationService.sendEventReminders)).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-1',
          eventTitle: 'Test Event',
        }),
        '24h'
      );
    });

    it('should find and process 1h reminders', async () => {
      const mockEvent = {
        id: 'event-2',
        title: 'Soon Event',
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        locationType: 'ONLINE',
        venue: null,
        onlineUrl: 'https://meet.example.com/event',
        createdBy: { displayName: 'Jane Doe' },
      };

      // First call (24h check) returns empty, second call (1h check) returns event
      vi.mocked(prisma.event.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'event-2', title: 'Soon Event', startTime: mockEvent.startTime }] as never[]);

      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
      vi.mocked(mockRedis.exists).mockResolvedValue(0);

      await scheduler.triggerCheck();

      expect(vi.mocked(eventNotificationService.sendEventReminders)).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-2',
          eventTitle: 'Soon Event',
          onlineUrl: 'https://meet.example.com/event',
        }),
        '1h'
      );
    });

    it('should skip events that already had reminders sent', async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([
        { id: 'event-1', title: 'Test Event', startTime: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      ] as never[]);

      // Simulate reminder already sent in Redis
      vi.mocked(mockRedis.exists).mockResolvedValue(1);

      await scheduler.triggerCheck();

      // Should not send reminders for already-processed events
      expect(vi.mocked(eventNotificationService.sendEventReminders)).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(prisma.event.findMany).mockRejectedValue(new Error('Database error'));

      await scheduler.triggerCheck();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) }),
        'Error in event reminder scheduler'
      );
    });
  });

  describe('reminder status tracking', () => {
    it('should mark reminder as sent in Redis', async () => {
      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
        locationType: 'PHYSICAL',
        venue: { street: '123 Main St', suburb: 'Sydney', state: 'NSW', postcode: '2000' },
        onlineUrl: null,
        createdBy: { displayName: 'John Doe' },
      };

      vi.mocked(prisma.event.findMany)
        .mockResolvedValueOnce([{ id: 'event-1', title: 'Test Event', startTime: mockEvent.startTime }] as never[])
        .mockResolvedValueOnce([]);

      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
      vi.mocked(mockRedis.exists).mockResolvedValue(0);

      await scheduler.triggerCheck();

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'event:reminder:sent:event-1:24h',
        48 * 60 * 60, // 48 hours TTL
        '1'
      );
    });

    it('should use database fallback when Redis is unavailable', async () => {
      vi.mocked(getRedis).mockReturnValue(null);

      const mockEvent = {
        id: 'event-1',
        title: 'Test Event',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
        locationType: 'PHYSICAL',
        venue: { street: '123 Main St', suburb: 'Sydney', state: 'NSW', postcode: '2000' },
        onlineUrl: null,
        createdBy: { displayName: 'John Doe' },
      };

      vi.mocked(prisma.event.findMany)
        .mockResolvedValueOnce([{ id: 'event-1', title: 'Test Event', startTime: mockEvent.startTime }] as never[])
        .mockResolvedValueOnce([]);

      vi.mocked(prisma.event.findUnique).mockResolvedValue(mockEvent as never);
      vi.mocked(prisma.systemSetting.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as never);

      await scheduler.triggerCheck();

      expect(vi.mocked(prisma.systemSetting.upsert)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'reminder_sent_event-1_24h' },
        })
      );
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.intervalMs).toBe(5 * 60 * 1000);
    });

    it('should return correct status when running', () => {
      scheduler.start();
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.intervalMs).toBe(5 * 60 * 1000);
    });
  });

  describe('periodic execution', () => {
    it('should schedule periodic checks with setInterval', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      vi.mocked(prisma.event.findMany).mockResolvedValue([]);

      scheduler.start();

      // Verify setInterval was called with the correct interval
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes
      );

      scheduler.stop();
      setIntervalSpy.mockRestore();
    });

    it('should clear interval on stop', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      vi.mocked(prisma.event.findMany).mockResolvedValue([]);

      scheduler.start();
      scheduler.stop();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });
});
