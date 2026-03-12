/**
 * Event Service Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { eventService } from '../event-service.js';
import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/api-error.js';
import type { AuditContext } from '../event-service.js';
import { EventStatus, LocationType, RSVPStatus, CategoryType } from '../../generated/prisma/index.js';

// Mock platform config
vi.mock('../../config/platform-loader.js', () => ({
  getPlatformConfig: () => ({
    features: { eventsCalendar: true },
    location: { timezone: 'Australia/Sydney' },
  }),
}));

// Mock Redis
vi.mock('../../cache/redis-client.js', () => ({
  getRedis: () => null,
}));

describe('EventService', () => {
  // Test data IDs
  let testUserId: string;
  let testCategoryId: string;
  let testBusinessId: string;

  const mockAuditContext: AuditContext = {
    actorId: 'test-user-id',
    actorRole: 'COMMUNITY',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };

  // Helper to create a future date
  const futureDate = (days: number, hours = 0): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() + hours);
    return date;
  };

  // Basic event data
  const createEventData = () => ({
    title: 'Test Community Event',
    description: 'This is a test event for our community. Join us for a great time with activities and refreshments for everyone.',
    categoryId: testCategoryId,
    startTime: futureDate(7).toISOString(),
    endTime: futureDate(7, 2).toISOString(),
    timezone: 'Australia/Sydney',
    locationType: 'PHYSICAL' as const,
    venue: {
      name: 'Community Hall',
      street: '123 Test Street',
      suburb: 'TestSuburb',
      state: 'NSW',
      postcode: '2000',
      country: 'Australia',
    },
  });

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'event-test@example.com',
        passwordHash: 'hashed-password',
        displayName: 'Event Test User',
        status: 'ACTIVE',
        role: 'COMMUNITY',
        emailVerified: true,
      },
    });
    testUserId = user.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: { en: 'Community Events' },
        slug: 'community-events-test',
        type: CategoryType.EVENT,
        icon: '🎉',
        displayOrder: 1,
        active: true,
      },
    });
    testCategoryId = category.id;

    // Create test business
    const business = await prisma.business.create({
      data: {
        name: 'Test Business',
        slug: 'test-business-events',
        description: 'A test business for event linking',
        address: {
          street: '456 Business St',
          suburb: 'BusinessSuburb',
          state: 'NSW',
          postcode: '2001',
        },
        contactInfo: { phone: '0400000000' },
        status: 'ACTIVE',
        claimedBy: testUserId,
      },
    });
    testBusinessId = business.id;

    // Update audit context with real user ID
    mockAuditContext.actorId = testUserId;
  });

  afterAll(async () => {
    // Clean up in reverse order of dependencies
    await prisma.eventRSVP.deleteMany({ where: { event: { createdById: testUserId } } });
    await prisma.event.deleteMany({ where: { createdById: testUserId } });
    await prisma.business.deleteMany({ where: { id: testBusinessId } });
    await prisma.category.deleteMany({ where: { id: testCategoryId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  beforeEach(async () => {
    // Clean up events before each test
    await prisma.eventRSVP.deleteMany({ where: { event: { createdById: testUserId } } });
    await prisma.event.deleteMany({ where: { createdById: testUserId } });
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // CREATE EVENT TESTS
  // ─────────────────────────────────────────────────────────────

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const eventData = createEventData();

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.title).toBe(eventData.title);
      expect(event.description).toBe(eventData.description);
      expect(event.status).toBe(EventStatus.PENDING);
      expect(event.createdById).toBe(testUserId);
      expect(event.slug).toBeDefined();
    });

    it('should create an event with PENDING status', async () => {
      const eventData = createEventData();

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.status).toBe(EventStatus.PENDING);
    });

    it('should generate a unique slug', async () => {
      const eventData = createEventData();
      eventData.title = 'Unique Slug Test Event';

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.slug).toBe('unique-slug-test-event');
    });

    it('should generate unique slug with counter for duplicates', async () => {
      const eventData1 = createEventData();
      eventData1.title = 'Duplicate Test';
      const eventData2 = createEventData();
      eventData2.title = 'Duplicate Test';

      const event1 = await eventService.createEvent(eventData1, testUserId, mockAuditContext);
      const event2 = await eventService.createEvent(eventData2, testUserId, mockAuditContext);

      expect(event1.slug).toBe('duplicate-test');
      expect(event2.slug).toBe('duplicate-test-1');
    });

    it('should throw error for invalid category', async () => {
      const eventData = createEventData();
      eventData.categoryId = '00000000-0000-0000-0000-000000000000';

      await expect(
        eventService.createEvent(eventData, testUserId, mockAuditContext)
      ).rejects.toThrow('Category not found');
    });

    it('should allow linking a business the user owns', async () => {
      const eventData = {
        ...createEventData(),
        linkedBusinessId: testBusinessId,
      };

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.linkedBusinessId).toBe(testBusinessId);
    });

    it('should throw error when linking business user does not own', async () => {
      // Create another user who doesn't own the business
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-user@example.com',
          passwordHash: 'hashed-password',
          displayName: 'Other User',
          status: 'ACTIVE',
          role: 'COMMUNITY',
          emailVerified: true,
        },
      });

      const eventData = {
        ...createEventData(),
        linkedBusinessId: testBusinessId,
      };

      try {
        await expect(
          eventService.createEvent(eventData, otherUser.id, {
            ...mockAuditContext,
            actorId: otherUser.id,
          })
        ).rejects.toThrow('You must be the business owner to link events');
      } finally {
        await prisma.user.delete({ where: { id: otherUser.id } });
      }
    });

    it('should create online event with URL', async () => {
      const eventData = {
        ...createEventData(),
        locationType: 'ONLINE' as const,
        venue: undefined,
        onlineUrl: 'https://zoom.us/j/123456',
      };

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.locationType).toBe('ONLINE');
      expect(event.onlineUrl).toBe('https://zoom.us/j/123456');
      expect(event.venue).toBeNull();
    });

    it('should create hybrid event with both venue and URL', async () => {
      const eventData = {
        ...createEventData(),
        locationType: 'HYBRID' as const,
        onlineUrl: 'https://zoom.us/j/123456',
      };

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.locationType).toBe('HYBRID');
      expect(event.venue).toBeDefined();
      expect(event.onlineUrl).toBe('https://zoom.us/j/123456');
    });

    it('should set capacity when provided', async () => {
      const eventData = {
        ...createEventData(),
        capacity: 100,
      };

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.capacity).toBe(100);
    });

    it('should set accessibility features', async () => {
      const eventData = {
        ...createEventData(),
        accessibility: ['wheelchair', 'hearing-loop', 'sign-language'],
      };

      const event = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      expect(event.accessibility).toEqual(['wheelchair', 'hearing-loop', 'sign-language']);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET EVENT TESTS
  // ─────────────────────────────────────────────────────────────

  describe('getEvent', () => {
    it('should get an active event by ID', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      // Approve the event first
      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.ACTIVE },
      });

      const event = await eventService.getEvent(created.id);

      expect(event).toBeDefined();
      expect(event.id).toBe(created.id);
      expect(event.title).toBe(eventData.title);
    });

    it('should return RSVP count', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.ACTIVE },
      });

      const event = await eventService.getEvent(created.id);

      expect(event.rsvpCount).toBeDefined();
      expect(event.rsvpCount.going).toBe(0);
      expect(event.rsvpCount.interested).toBe(0);
      expect(event.rsvpCount.total).toBe(0);
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        eventService.getEvent('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Event not found');
    });

    it('should allow owner to view pending event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      // Event is in PENDING status
      const event = await eventService.getEvent(created.id, testUserId);

      expect(event).toBeDefined();
      expect(event.status).toBe(EventStatus.PENDING);
    });

    it('should not allow non-owner to view pending event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      // Try to get as different user
      await expect(
        eventService.getEvent(created.id, 'different-user-id')
      ).rejects.toThrow('Event not found');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET EVENT BY SLUG TESTS
  // ─────────────────────────────────────────────────────────────

  describe('getEventBySlug', () => {
    it('should get event by slug', async () => {
      const eventData = createEventData();
      eventData.title = 'Slug Test Event';
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.ACTIVE },
      });

      const event = await eventService.getEventBySlug('slug-test-event');

      expect(event).toBeDefined();
      expect(event.id).toBe(created.id);
    });

    it('should throw error for non-existent slug', async () => {
      await expect(
        eventService.getEventBySlug('non-existent-slug')
      ).rejects.toThrow('Event not found');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // UPDATE EVENT TESTS
  // ─────────────────────────────────────────────────────────────

  describe('updateEvent', () => {
    it('should update event title', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      const updated = await eventService.updateEvent(
        created.id,
        { title: 'Updated Title' },
        testUserId,
        mockAuditContext
      );

      expect(updated.title).toBe('Updated Title');
    });

    it('should update event description', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      const newDescription = 'This is a brand new description that is long enough to pass validation requirements.';
      const updated = await eventService.updateEvent(
        created.id,
        { description: newDescription },
        testUserId,
        mockAuditContext
      );

      expect(updated.description).toBe(newDescription);
    });

    it('should not allow non-owner to update event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await expect(
        eventService.updateEvent(
          created.id,
          { title: 'Hacked Title' },
          'different-user-id',
          { ...mockAuditContext, actorId: 'different-user-id' }
        )
      ).rejects.toThrow('You are not the event owner');
    });

    it('should not allow updating cancelled event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      // Cancel the event
      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.CANCELLED },
      });

      await expect(
        eventService.updateEvent(
          created.id,
          { title: 'Updated Title' },
          testUserId,
          mockAuditContext
        )
      ).rejects.toThrow('Cannot update a cancelled event');
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        eventService.updateEvent(
          '00000000-0000-0000-0000-000000000000',
          { title: 'New Title' },
          testUserId,
          mockAuditContext
        )
      ).rejects.toThrow('Event not found');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // DELETE EVENT TESTS
  // ─────────────────────────────────────────────────────────────

  describe('deleteEvent', () => {
    it('should cancel (soft delete) event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await eventService.deleteEvent(created.id, testUserId, mockAuditContext);

      // Verify event is cancelled, not deleted
      const event = await prisma.event.findUnique({ where: { id: created.id } });
      expect(event).toBeDefined();
      expect(event!.status).toBe(EventStatus.CANCELLED);
    });

    it('should not allow non-owner to delete event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await expect(
        eventService.deleteEvent(
          created.id,
          'different-user-id',
          { ...mockAuditContext, actorId: 'different-user-id' }
        )
      ).rejects.toThrow('You are not the event owner');
    });

    it('should throw error for non-existent event', async () => {
      await expect(
        eventService.deleteEvent(
          '00000000-0000-0000-0000-000000000000',
          testUserId,
          mockAuditContext
        )
      ).rejects.toThrow('Event not found');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // LIST EVENTS TESTS
  // ─────────────────────────────────────────────────────────────

  describe('listEvents', () => {
    beforeEach(async () => {
      // Create multiple events for listing tests
      const baseData = createEventData();

      for (let i = 0; i < 5; i++) {
        const event = await prisma.event.create({
          data: {
            title: `Test Event ${i + 1}`,
            description: baseData.description,
            categoryId: testCategoryId,
            startTime: futureDate(i + 1),
            endTime: futureDate(i + 1, 2),
            timezone: 'Australia/Sydney',
            locationType: LocationType.PHYSICAL,
            venue: baseData.venue as object,
            createdById: testUserId,
            status: EventStatus.ACTIVE,
            slug: `test-event-${i + 1}`,
          },
        });
      }
    });

    it('should list active events', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'upcoming',
        includePast: false,
        freeOnly: false,
      });

      expect(result.events.length).toBeGreaterThanOrEqual(5);
      expect(result.pagination.page).toBe(1);
    });

    it('should paginate results', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 2,
        sort: 'upcoming',
        includePast: false,
        freeOnly: false,
      });

      expect(result.events.length).toBe(2);
      expect(result.pagination.totalPages).toBeGreaterThan(1);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should sort by upcoming', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'upcoming',
        includePast: false,
        freeOnly: false,
      });

      const dates = result.events.map((e) => new Date(e.startTime).getTime());
      const sorted = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sorted);
    });

    it('should sort by newest', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'newest',
        includePast: false,
        freeOnly: false,
      });

      const dates = result.events.map((e) => new Date(e.createdAt).getTime());
      const sorted = [...dates].sort((a, b) => b - a);
      expect(dates).toEqual(sorted);
    });

    it('should filter by category', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'upcoming',
        categoryId: testCategoryId,
        includePast: false,
        freeOnly: false,
      });

      result.events.forEach((event) => {
        expect(event.categoryId).toBe(testCategoryId);
      });
    });

    it('should filter by location type', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'upcoming',
        locationType: 'PHYSICAL',
        includePast: false,
        freeOnly: false,
      });

      result.events.forEach((event) => {
        expect(event.locationType).toBe('PHYSICAL');
      });
    });

    it('should search by title', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'upcoming',
        search: 'Test Event 1',
        includePast: false,
        freeOnly: false,
      });

      expect(result.events.length).toBeGreaterThanOrEqual(1);
      expect(result.events.some((e) => e.title.includes('Test Event 1'))).toBe(true);
    });

    it('should filter by createdById', async () => {
      const result = await eventService.listEvents({
        page: 1,
        limit: 10,
        sort: 'upcoming',
        createdById: testUserId,
        includePast: false,
        freeOnly: false,
      });

      result.events.forEach((event) => {
        expect(event.createdById).toBe(testUserId);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // RSVP TESTS
  // ─────────────────────────────────────────────────────────────

  describe('RSVP Operations', () => {
    let activeEventId: string;

    beforeEach(async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.ACTIVE },
      });

      activeEventId = created.id;
    });

    describe('rsvpToEvent', () => {
      it('should create GOING RSVP', async () => {
        const result = await eventService.rsvpToEvent(
          activeEventId,
          testUserId,
          { status: 'GOING', guestCount: 1 },
          mockAuditContext
        );

        expect(result.rsvp.status).toBe('GOING');
        expect(result.rsvp.guestCount).toBe(1);
        expect(result.event.rsvpCount.going).toBe(1);
      });

      it('should create INTERESTED RSVP', async () => {
        const result = await eventService.rsvpToEvent(
          activeEventId,
          testUserId,
          { status: 'INTERESTED', guestCount: 1 },
          mockAuditContext
        );

        expect(result.rsvp.status).toBe('INTERESTED');
        expect(result.event.rsvpCount.interested).toBe(1);
      });

      it('should update existing RSVP', async () => {
        // First RSVP
        await eventService.rsvpToEvent(
          activeEventId,
          testUserId,
          { status: 'INTERESTED', guestCount: 1 },
          mockAuditContext
        );

        // Update to GOING
        const result = await eventService.rsvpToEvent(
          activeEventId,
          testUserId,
          { status: 'GOING', guestCount: 2 },
          mockAuditContext
        );

        expect(result.rsvp.status).toBe('GOING');
        expect(result.rsvp.guestCount).toBe(2);
      });

      it('should include guest count in RSVP', async () => {
        const result = await eventService.rsvpToEvent(
          activeEventId,
          testUserId,
          { status: 'GOING', guestCount: 3 },
          mockAuditContext
        );

        expect(result.rsvp.guestCount).toBe(3);
        expect(result.event.rsvpCount.going).toBe(3);
      });

      it('should enforce capacity limits', async () => {
        // Create event with capacity
        const capacityEvent = await prisma.event.create({
          data: {
            title: 'Limited Capacity Event',
            description: createEventData().description,
            categoryId: testCategoryId,
            startTime: futureDate(5),
            endTime: futureDate(5, 2),
            timezone: 'Australia/Sydney',
            locationType: LocationType.PHYSICAL,
            venue: createEventData().venue as object,
            createdById: testUserId,
            status: EventStatus.ACTIVE,
            capacity: 2,
            slug: 'limited-capacity-event',
          },
        });

        // First RSVP (within capacity)
        await eventService.rsvpToEvent(
          capacityEvent.id,
          testUserId,
          { status: 'GOING', guestCount: 2 },
          mockAuditContext
        );

        // Create another user for second RSVP
        const otherUser = await prisma.user.create({
          data: {
            email: 'other-rsvp@example.com',
            passwordHash: 'hash',
            displayName: 'Other RSVP User',
            status: 'ACTIVE',
            role: 'COMMUNITY',
            emailVerified: true,
          },
        });

        try {
          // Second RSVP should fail (exceeds capacity)
          await expect(
            eventService.rsvpToEvent(
              capacityEvent.id,
              otherUser.id,
              { status: 'GOING', guestCount: 1 },
              { ...mockAuditContext, actorId: otherUser.id }
            )
          ).rejects.toThrow('at full capacity');
        } finally {
          await prisma.eventRSVP.deleteMany({ where: { eventId: capacityEvent.id } });
          await prisma.event.delete({ where: { id: capacityEvent.id } });
          await prisma.user.delete({ where: { id: otherUser.id } });
        }
      });

      it('should not allow RSVP to inactive event', async () => {
        const pendingEvent = await eventService.createEvent(
          createEventData(),
          testUserId,
          mockAuditContext
        );

        await expect(
          eventService.rsvpToEvent(
            pendingEvent.id,
            testUserId,
            { status: 'GOING', guestCount: 1 },
            mockAuditContext
          )
        ).rejects.toThrow('not active');
      });
    });

    describe('cancelRSVP', () => {
      it('should cancel RSVP', async () => {
        // Create RSVP first
        await eventService.rsvpToEvent(
          activeEventId,
          testUserId,
          { status: 'GOING', guestCount: 1 },
          mockAuditContext
        );

        // Cancel it
        await eventService.cancelRSVP(activeEventId, testUserId, mockAuditContext);

        // Verify it's gone
        const event = await eventService.getEvent(activeEventId, testUserId);
        expect(event.userRSVP).toBeNull();
      });

      it('should throw error for non-existent RSVP', async () => {
        await expect(
          eventService.cancelRSVP(activeEventId, testUserId, mockAuditContext)
        ).rejects.toThrow('RSVP not found');
      });
    });

    describe('getEventAttendees', () => {
      it('should return attendees for event owner', async () => {
        // Create some RSVPs
        await prisma.eventRSVP.create({
          data: {
            eventId: activeEventId,
            userId: testUserId,
            status: RSVPStatus.GOING,
            guestCount: 2,
          },
        });

        const result = await eventService.getEventAttendees(
          activeEventId,
          testUserId,
          { page: 1, limit: 50 }
        );

        expect(result.attendees.length).toBe(1);
        expect(result.summary.going).toBe(1);
        expect(result.summary.totalGuests).toBe(2);
      });

      it('should not allow non-owner to view attendees', async () => {
        await expect(
          eventService.getEventAttendees(
            activeEventId,
            'different-user-id',
            { page: 1, limit: 50 }
          )
        ).rejects.toThrow('Only the event owner can view attendees');
      });

      it('should filter by RSVP status', async () => {
        // Create multiple RSVPs with different statuses
        await prisma.eventRSVP.createMany({
          data: [
            { eventId: activeEventId, userId: testUserId, status: RSVPStatus.GOING, guestCount: 1 },
          ],
        });

        const result = await eventService.getEventAttendees(
          activeEventId,
          testUserId,
          { page: 1, limit: 50, status: 'GOING' }
        );

        result.attendees.forEach((a) => {
          expect(a.status).toBe('GOING');
        });
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ICS EXPORT TESTS
  // ─────────────────────────────────────────────────────────────

  describe('exportEventICS', () => {
    it('should export event to ICS format', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.ACTIVE },
      });

      const ics = await eventService.exportEventICS(created.id);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain(`SUMMARY:${eventData.title}`);
    });

    it('should include location for physical events', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      await prisma.event.update({
        where: { id: created.id },
        data: { status: EventStatus.ACTIVE },
      });

      const ics = await eventService.exportEventICS(created.id);

      expect(ics).toContain('LOCATION:');
      expect(ics).toContain('123 Test Street');
    });

    it('should not export inactive event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      // Event is still PENDING
      await expect(
        eventService.exportEventICS(created.id)
      ).rejects.toThrow('Cannot export an event that is not active');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // APPROVE EVENT TESTS
  // ─────────────────────────────────────────────────────────────

  describe('approveEvent', () => {
    it('should approve pending event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      const approved = await eventService.approveEvent(
        created.id,
        testUserId,
        { ...mockAuditContext, actorRole: 'MODERATOR' }
      );

      expect(approved.status).toBe(EventStatus.ACTIVE);
    });

    it('should not approve already active event', async () => {
      const eventData = createEventData();
      const created = await eventService.createEvent(eventData, testUserId, mockAuditContext);

      // Approve first
      await eventService.approveEvent(created.id, testUserId, {
        ...mockAuditContext,
        actorRole: 'MODERATOR',
      });

      // Try to approve again
      await expect(
        eventService.approveEvent(created.id, testUserId, {
          ...mockAuditContext,
          actorRole: 'MODERATOR',
        })
      ).rejects.toThrow('Only pending events can be approved');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // UPDATE PAST EVENTS STATUS TESTS
  // ─────────────────────────────────────────────────────────────

  describe('updatePastEventsStatus', () => {
    it('should update past events to PAST status', async () => {
      // Create an event with past end time
      const pastEvent = await prisma.event.create({
        data: {
          title: 'Past Event',
          description: createEventData().description,
          categoryId: testCategoryId,
          startTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
          endTime: new Date(Date.now() - 86400000), // 1 day ago
          timezone: 'Australia/Sydney',
          locationType: LocationType.PHYSICAL,
          venue: createEventData().venue as object,
          createdById: testUserId,
          status: EventStatus.ACTIVE,
          slug: 'past-event-test',
        },
      });

      const count = await eventService.updatePastEventsStatus();

      expect(count).toBeGreaterThanOrEqual(1);

      const updated = await prisma.event.findUnique({ where: { id: pastEvent.id } });
      expect(updated!.status).toBe(EventStatus.PAST);
    });
  });
});
