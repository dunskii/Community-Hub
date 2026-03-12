/**
 * EventDetailPage Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import EventDetailPage from '../EventDetailPage';
import * as eventServiceModule from '../../../services/event-service';
import * as useAuthModule from '../../../hooks/useAuth';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'events.notFoundTitle': 'Event Not Found',
        'events.notFoundDescription': 'The event you are looking for does not exist',
        'events.backToEvents': 'Back to Events',
        'events.browseEvents': 'Browse Events',
        'events.editEvent': 'Edit Event',
        'events.cancelEvent': 'Cancel Event',
        'events.shareEvent': 'Share',
        'events.addToCalendar': 'Add to Calendar',
        'events.downloadICS': 'Download ICS',
        'events.getDirections': 'Get Directions',
        'events.joinOnline': 'Join Online',
        'events.onlineEvent': 'Online Event',
        'events.about': 'About',
        'events.hostedBy': 'Hosted by',
        'events.tickets': 'Tickets',
        'events.buyTickets': 'Buy Tickets',
        'events.organizer': 'Organizer',
        'events.date': 'Date',
        'events.time': 'Time',
        'events.location': 'Location',
        'events.cost': 'Cost',
        'events.capacity': 'Capacity',
        'events.ageRestriction': 'Age Restriction',
        'events.accessibility': 'Accessibility',
        'events.free': 'Free',
        'events.loginToRsvp': 'Log in to RSVP',
        'events.rsvp.title': 'RSVP',
        'events.rsvp.going': 'Going',
        'events.rsvp.interested': 'Interested',
        'events.rsvp.notGoing': 'Not Going',
        'events.rsvp.goingCount': `${options?.count || 0} going`,
        'events.rsvp.interestedCount': `${options?.count || 0} interested`,
        'events.capacity.full': 'Full',
        'events.capacity.spotsLeft': `${options?.count || 0} spots left`,
        'events.status.pending': 'Pending',
        'events.status.cancelled': 'Cancelled',
        'events.status.past': 'Past',
        'events.locationType.physical': 'In Person',
        'events.locationType.online': 'Online',
        'events.locationType.hybrid': 'Hybrid',
        'events.error.loadFailed': 'Failed to load event',
        'common.loading': 'Loading...',
        'common.error': 'Error',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      dir: () => 'ltr',
    },
  }),
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock event service - must include all exports
vi.mock('../../../services/event-service', () => ({
  eventService: {
    getEvent: vi.fn(),
    getEventBySlug: vi.fn(),
    rsvpToEvent: vi.fn(),
    cancelRSVP: vi.fn(),
    getExportUrl: vi.fn((id: string) => `/api/v1/events/${id}/export`),
    getGoogleCalendarUrl: vi.fn(() => 'https://calendar.google.com/calendar/render?action=TEMPLATE'),
  },
  formatEventDate: vi.fn(() => ({
    date: 'Thu, 15 Mar 2026',
    time: '10:00 am - 12:00 pm',
    duration: '2h',
  })),
  getLocationTypeBadgeVariant: vi.fn(() => 'default'),
  formatEventLocation: vi.fn(() => 'Guildford, NSW'),
  getSmartDateLabel: vi.fn(() => 'Tomorrow'),
}));

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
  })),
}));

// Mock components
vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

vi.mock('../../../components/events/RSVPButton', () => ({
  RSVPButton: ({
    onRSVP,
    disabled,
  }: {
    onRSVP: (status: string) => void;
    disabled: boolean;
  }) => (
    <button
      data-testid="rsvp-button"
      onClick={() => onRSVP('GOING')}
      disabled={disabled}
    >
      RSVP
    </button>
  ),
}));

vi.mock('../../../components/display/Skeleton', () => ({
  Skeleton: ({ variant }: { variant?: string }) => (
    <div data-testid={`skeleton-${variant || 'default'}`} />
  ),
}));

vi.mock('../../../components/display/Badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

vi.mock('../../../components/display/Avatar', () => ({
  Avatar: ({ name }: { name: string }) => (
    <div data-testid="avatar">{name}</div>
  ),
}));

vi.mock('../../../components/display/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

vi.mock('../../../components/display/Modal', () => ({
  Modal: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title: string }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

const mockEvent = {
  id: 'event-1',
  title: 'Community Cleanup Day',
  description: 'Join us for a community cleanup event to make our neighborhood beautiful.',
  categoryId: 'cat-1',
  category: {
    id: 'cat-1',
    name: { en: 'Community' },
    slug: 'community',
    icon: '🤝',
  },
  startTime: new Date(Date.now() + 86400000).toISOString(),
  endTime: new Date(Date.now() + 90000000).toISOString(),
  timezone: 'Australia/Sydney',
  locationType: 'PHYSICAL' as const,
  venue: {
    name: 'Community Center',
    street: '123 Main St',
    suburb: 'Guildford',
    state: 'NSW',
    postcode: '2161',
    country: 'Australia',
  },
  onlineUrl: null,
  linkedBusinessId: null,
  linkedBusiness: null,
  imageUrl: 'https://example.com/event.jpg',
  ticketUrl: null,
  cost: null,
  capacity: 50,
  ageRestriction: null,
  accessibility: ['wheelchair', 'hearing-loop'],
  recurrence: null,
  createdById: 'user-1',
  createdBy: {
    id: 'user-1',
    displayName: 'John Doe',
    profilePhoto: null,
  },
  status: 'ACTIVE' as const,
  slug: 'community-cleanup-day',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  rsvpCount: {
    going: 25,
    interested: 10,
    total: 35,
  },
  userRSVP: null,
  spotsRemaining: 25,
};

const mockEventService = eventServiceModule.eventService as {
  getEvent: ReturnType<typeof vi.fn>;
  getEventBySlug: ReturnType<typeof vi.fn>;
  rsvpToEvent: ReturnType<typeof vi.fn>;
  cancelRSVP: ReturnType<typeof vi.fn>;
  getExportUrl: ReturnType<typeof vi.fn>;
  getGoogleCalendarUrl: ReturnType<typeof vi.fn>;
};

const mockUseAuth = useAuthModule.useAuth as ReturnType<typeof vi.fn>;

const renderWithRouter = (eventIdOrSlug: string = 'community-cleanup-day') => {
  return render(
    <MemoryRouter initialEntries={[`/events/${eventIdOrSlug}`]}>
      <Routes>
        <Route path="/events/:idOrSlug" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('EventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventService.getEventBySlug.mockResolvedValue({ data: mockEvent });
    mockEventService.getEvent.mockResolvedValue({ data: mockEvent });
    mockUseAuth.mockReturnValue({ user: null });
  });

  it('renders event title', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Community Cleanup Day'
      );
    });
  });

  it('renders event description', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText(/Join us for a community cleanup event/)
      ).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockEventService.getEventBySlug.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithRouter();

    expect(screen.getAllByTestId(/skeleton-/).length).toBeGreaterThan(0);
  });

  it('renders category badge', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Community')).toBeInTheDocument();
    });
  });

  it('renders location for physical events', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      expect(screen.getByText(/Guildford/)).toBeInTheDocument();
    });
  });

  it('renders RSVP counts', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('25 going')).toBeInTheDocument();
      expect(screen.getByText('10 interested')).toBeInTheDocument();
    });
  });

  it('renders spots remaining', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('25 spots left')).toBeInTheDocument();
    });
  });

  it('renders organizer info', async () => {
    renderWithRouter();

    await waitFor(() => {
      // "John Doe" appears in both Avatar and in the organizer section
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getByText('Organizer')).toBeInTheDocument();
    });
  });

  it('renders accessibility features', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/wheelchair/i)).toBeInTheDocument();
      expect(screen.getByText(/hearing-loop/i)).toBeInTheDocument();
    });
  });

  it('shows not found for non-existent event', async () => {
    mockEventService.getEventBySlug.mockRejectedValue(new Error('Event not found'));

    renderWithRouter('non-existent');

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('fetches by slug when idOrSlug is not a UUID', async () => {
    renderWithRouter('community-cleanup-day');

    await waitFor(() => {
      expect(mockEventService.getEventBySlug).toHaveBeenCalledWith('community-cleanup-day');
      expect(mockEventService.getEvent).not.toHaveBeenCalled();
    });
  });

  it('fetches by ID when idOrSlug has no hyphen', async () => {
    // Component uses hyphen check to determine slug vs ID
    // IDs without hyphens are treated as direct IDs
    const shortId = 'abc123';
    mockEventService.getEvent.mockResolvedValue({ data: mockEvent });

    renderWithRouter(shortId);

    await waitFor(() => {
      expect(mockEventService.getEvent).toHaveBeenCalledWith(shortId);
      expect(mockEventService.getEventBySlug).not.toHaveBeenCalled();
    });
  });

  describe('RSVP functionality', () => {
    it('shows RSVP button when logged in', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-2', displayName: 'Test User' },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-button')).toBeInTheDocument();
      });
    });

    it('shows login prompt when not logged in', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Log in to RSVP')).toBeInTheDocument();
      });
    });

    it('shows user current RSVP status', async () => {
      const eventWithRSVP = {
        ...mockEvent,
        userRSVP: { status: 'GOING', guestCount: 1 },
      };
      mockEventService.getEventBySlug.mockResolvedValue({ data: eventWithRSVP });
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', displayName: 'Test User' },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-button')).toBeInTheDocument();
      });
    });
  });

  describe('owner actions', () => {
    it('shows edit button for event owner', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', displayName: 'John Doe' },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Edit Event')).toBeInTheDocument();
      });
    });

    it('hides edit button for non-owners', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: 'user-2', displayName: 'Other User' },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.queryByText('Edit Event')).not.toBeInTheDocument();
      });
    });
  });

  describe('event status', () => {
    it('shows pending badge for pending events', async () => {
      const pendingEvent = { ...mockEvent, status: 'PENDING' as const };
      mockEventService.getEventBySlug.mockResolvedValue({ data: pendingEvent });
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', displayName: 'John Doe' },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('shows cancelled badge for cancelled events', async () => {
      const cancelledEvent = { ...mockEvent, status: 'CANCELLED' as const };
      mockEventService.getEventBySlug.mockResolvedValue({ data: cancelledEvent });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
      });
    });

    it('shows full badge when no spots remaining', async () => {
      const fullEvent = { ...mockEvent, spotsRemaining: 0 };
      mockEventService.getEventBySlug.mockResolvedValue({ data: fullEvent });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Full')).toBeInTheDocument();
      });
    });
  });

  describe('online events', () => {
    it('shows join online button for online events', async () => {
      const onlineEvent = {
        ...mockEvent,
        locationType: 'ONLINE' as const,
        venue: null,
        onlineUrl: 'https://zoom.us/j/123456',
      };
      mockEventService.getEventBySlug.mockResolvedValue({ data: onlineEvent });
      mockUseAuth.mockReturnValue({
        user: { id: 'user-1', displayName: 'Test User' },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Join Online')).toBeInTheDocument();
      });
    });

    it('shows location type badge', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('In Person')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('uses semantic heading hierarchy', async () => {
      renderWithRouter();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();
        expect(h1).toHaveTextContent('Community Cleanup Day');
      });
    });
  });

  describe('calendar actions', () => {
    it('shows add to calendar button', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Add to Calendar')).toBeInTheDocument();
      });
    });
  });
});
