/**
 * EventsListingPage Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EventsListingPage } from '../EventsListingPage';
import * as eventServiceModule from '../../../services/event-service';
import * as useAuthModule from '../../../hooks/useAuth';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'events.pageTitle': 'Events',
        'events.pageDescription': 'Find events in your community',
        'events.createEvent': 'Create Event',
        'events.resultsCount': `${options?.count || 0} events found`,
        'events.noEventsTitle': 'No Events',
        'events.noEventsDescription': 'No events to display',
        'events.noEventsFiltered': 'No events match your filters',
        'events.createFirstEvent': 'Create First Event',
        'events.filters.title': 'Filters',
        'events.filters.sortBy': 'Sort By',
        'events.filters.dateFrom': 'From',
        'events.filters.dateTo': 'To',
        'events.filters.category': 'Category',
        'events.filters.locationType': 'Location Type',
        'events.filters.anyLocationType': 'Any',
        'events.filters.distance': 'Distance',
        'events.filters.anyDistance': 'Any distance',
        'events.filters.freeOnly': 'Free events only',
        'events.filters.includePast': 'Include past events',
        'events.filters.clear': 'Clear Filters',
        'events.filters.allCategories': 'All Categories',
        'events.sort.upcoming': 'Upcoming',
        'events.sort.popular': 'Popular',
        'events.sort.newest': 'Newest',
        'events.sort.distance': 'Distance',
        'events.locationType.physical': 'In Person',
        'events.locationType.online': 'Online',
        'events.locationType.hybrid': 'Hybrid',
        'events.error.loadFailed': 'Failed to load events',
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

// Mock event service
vi.mock('../../../services/event-service', () => ({
  eventService: {
    listEvents: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
  })),
}));

// Mock components that may have complex dependencies
vi.mock('../../../components/layout/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

vi.mock('../../../components/events/EventFilters', () => ({
  EventFilters: ({
    onChange,
  }: {
    filters: unknown;
    onChange: (f: unknown) => void;
  }) => (
    <aside data-testid="event-filters" role="complementary">
      <button onClick={() => onChange({ sort: 'popular' })}>Change Sort</button>
    </aside>
  ),
}));

vi.mock('../../../components/events/EventCard', () => ({
  EventCard: ({ event }: { event: { id: string; title: string } }) => (
    <article data-testid={`event-card-${event.id}`}>
      <h2>{event.title}</h2>
    </article>
  ),
}));

vi.mock('../../../components/display/Pagination', () => ({
  Pagination: ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
  }) => (
    <nav data-testid="pagination" aria-label="Pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
    </nav>
  ),
}));

vi.mock('../../../components/display/Skeleton', () => ({
  Skeleton: ({ variant }: { variant?: string }) => (
    <div data-testid={`skeleton-${variant || 'default'}`} />
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

vi.mock('../../../components/display/Alert', () => ({
  Alert: ({ type, message }: { type: string; message: string }) => (
    <div data-testid="alert" role="alert" data-type={type}>
      {message}
    </div>
  ),
}));

const mockEvents = [
  {
    id: 'event-1',
    title: 'Community Cleanup',
    description: 'Join us for a cleanup event',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    locationType: 'PHYSICAL',
    status: 'ACTIVE',
    slug: 'community-cleanup',
    rsvpCount: { going: 10, interested: 5, total: 15 },
  },
  {
    id: 'event-2',
    title: 'Online Workshop',
    description: 'Learn new skills online',
    startTime: new Date(Date.now() + 172800000).toISOString(),
    endTime: new Date(Date.now() + 176400000).toISOString(),
    locationType: 'ONLINE',
    status: 'ACTIVE',
    slug: 'online-workshop',
    rsvpCount: { going: 20, interested: 15, total: 35 },
  },
];

const mockEventService = eventServiceModule.eventService as {
  listEvents: ReturnType<typeof vi.fn>;
};

const mockUseAuth = useAuthModule.useAuth as ReturnType<typeof vi.fn>;

const renderWithRouter = (ui: React.ReactElement, initialEntries = ['/events']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};

describe('EventsListingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventService.listEvents.mockResolvedValue({
      data: {
        events: mockEvents,
        pagination: {
          page: 1,
          totalPages: 1,
          total: 2,
          hasMore: false,
        },
      },
    });
    mockUseAuth.mockReturnValue({ user: null });
  });

  it('renders page title', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Events');
    });
  });

  it('renders page description', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByText('Find events in your community')).toBeInTheDocument();
    });
  });

  it('shows loading skeletons initially', () => {
    mockEventService.listEvents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithRouter(<EventsListingPage />);

    expect(screen.getAllByTestId(/skeleton-/).length).toBeGreaterThan(0);
  });

  it('displays events after loading', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
    });
  });

  it('shows results count', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByText('2 events found')).toBeInTheDocument();
    });
  });

  it('shows empty state when no events', async () => {
    mockEventService.listEvents.mockResolvedValue({
      data: {
        events: [],
        pagination: {
          page: 1,
          totalPages: 0,
          total: 0,
          hasMore: false,
        },
      },
    });

    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No Events')).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    mockEventService.listEvents.mockRejectedValue(new Error('Network error'));

    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  it('hides create button when not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.queryByText('Create Event')).not.toBeInTheDocument();
    });
  });

  it('shows create button when logged in', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', displayName: 'Test User' },
    });

    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });
  });

  it('renders event filters', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('event-filters')).toBeInTheDocument();
    });
  });

  it('shows pagination when multiple pages', async () => {
    mockEventService.listEvents.mockResolvedValue({
      data: {
        events: mockEvents,
        pagination: {
          page: 1,
          totalPages: 3,
          total: 30,
          hasMore: true,
        },
      },
    });

    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  it('hides pagination when single page', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  it('fetches events on mount', async () => {
    renderWithRouter(<EventsListingPage />);

    await waitFor(() => {
      expect(mockEventService.listEvents).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('uses semantic heading hierarchy', async () => {
      renderWithRouter(<EventsListingPage />);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();
      });
    });

    it('renders filters in aside element', async () => {
      renderWithRouter(<EventsListingPage />);

      await waitFor(() => {
        expect(screen.getByTestId('event-filters')).toBeInTheDocument();
      });
    });
  });

  describe('URL sync', () => {
    it('reads filters from URL params', async () => {
      renderWithRouter(<EventsListingPage />, ['/events?sort=popular&freeOnly=true']);

      await waitFor(() => {
        expect(mockEventService.listEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'popular',
            freeOnly: true,
          })
        );
      });
    });

    it('reads page from URL params', async () => {
      renderWithRouter(<EventsListingPage />, ['/events?page=2']);

      await waitFor(() => {
        expect(mockEventService.listEvents).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });
  });
});
