/**
 * CalendarView Component Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CalendarView, CalendarViewType } from '../CalendarView';
import type { Event } from '../../../services/event-service';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'events.calendar.month': 'Month',
        'events.calendar.week': 'Week',
        'events.calendar.day': 'Day',
        'events.calendar.today': 'Today',
        'events.calendar.previous': 'Previous',
        'events.calendar.next': 'Next',
        'events.calendar.viewSelector': 'Calendar view selector',
        'events.calendar.monthView': 'Month View',
        'events.calendar.event': `${options?.count || 0} event`,
        'events.calendar.event_plural': `${options?.count || 0} events`,
        'events.calendar.events': 'events',
        'events.calendar.more': `+${options?.count || 0} more`,
        'events.calendar.noEvents': 'No events on this day',
        'events.locationType.physical': 'In Person',
        'events.locationType.online': 'Online',
        'events.locationType.hybrid': 'Hybrid',
        'events.rsvp.goingCount': `${options?.count || 0} going`,
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      dir: () => 'ltr',
    },
  }),
}));

// Create mock event for a specific date
function createMockEvent(date: Date, overrides: Partial<Event> = {}): Event {
  const startTime = new Date(date);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(12, 0, 0, 0);

  return {
    id: `event-${Date.now()}-${Math.random()}`,
    title: 'Community Cleanup Day',
    description: 'Join us for a community cleanup event.',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: { en: 'Community' },
      slug: 'community',
      icon: '🤝',
    },
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timezone: 'Australia/Sydney',
    locationType: 'PHYSICAL',
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
    imageUrl: null,
    ticketUrl: null,
    cost: null,
    capacity: 50,
    ageRestriction: null,
    accessibility: [],
    recurrence: null,
    createdById: 'user-1',
    createdBy: {
      id: 'user-1',
      displayName: 'John Doe',
      profilePhoto: null,
    },
    status: 'ACTIVE',
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
    ...overrides,
  };
}

// Get the current date to ensure tests are date-independent
const today = new Date();
const mockEventToday = createMockEvent(today, { id: 'event-today', title: 'Today Event' });

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('View Toggle', () => {
    it('renders view toggle buttons', () => {
      renderWithRouter(<CalendarView events={[]} />);

      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
    });

    it('starts with month view by default', () => {
      renderWithRouter(<CalendarView events={[]} />);

      const monthButton = screen.getByText('Month');
      expect(monthButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('changes view when toggle is clicked', () => {
      renderWithRouter(<CalendarView events={[]} />);

      const weekButton = screen.getByText('Week');
      fireEvent.click(weekButton);

      expect(weekButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('calls onViewChange when provided', () => {
      const onViewChange = vi.fn();
      renderWithRouter(
        <CalendarView events={[]} view="month" onViewChange={onViewChange} />
      );

      fireEvent.click(screen.getByText('Week'));
      expect(onViewChange).toHaveBeenCalledWith('week');
    });

    it('renders view selector with proper aria-label', () => {
      renderWithRouter(<CalendarView events={[]} />);

      expect(screen.getByRole('group', { name: 'Calendar view selector' })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('renders today button', () => {
      renderWithRouter(<CalendarView events={[]} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders previous and next buttons', () => {
      renderWithRouter(<CalendarView events={[]} />);

      expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('navigates to today when Today button is clicked', () => {
      const onDateChange = vi.fn();
      const pastDate = new Date(2020, 0, 1);

      renderWithRouter(
        <CalendarView
          events={[]}
          currentDate={pastDate}
          onDateChange={onDateChange}
        />
      );

      fireEvent.click(screen.getByText('Today'));

      expect(onDateChange).toHaveBeenCalled();
      const newDate = onDateChange.mock.calls[0][0];
      // Should be today's date (comparing date parts only)
      const now = new Date();
      expect(newDate.getFullYear()).toBe(now.getFullYear());
      expect(newDate.getMonth()).toBe(now.getMonth());
      expect(newDate.getDate()).toBe(now.getDate());
    });

    it('navigates to previous month when Previous is clicked in month view', () => {
      const onDateChange = vi.fn();
      const currentDate = new Date(2026, 5, 15); // June 2026

      renderWithRouter(
        <CalendarView
          events={[]}
          view="month"
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

      expect(onDateChange).toHaveBeenCalled();
      const newDate = onDateChange.mock.calls[0][0];
      expect(newDate.getMonth()).toBe(4); // May
    });

    it('navigates to next month when Next is clicked in month view', () => {
      const onDateChange = vi.fn();
      const currentDate = new Date(2026, 5, 15); // June 2026

      renderWithRouter(
        <CalendarView
          events={[]}
          view="month"
          currentDate={currentDate}
          onDateChange={onDateChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));

      expect(onDateChange).toHaveBeenCalled();
      const newDate = onDateChange.mock.calls[0][0];
      expect(newDate.getMonth()).toBe(6); // July
    });
  });

  describe('Month View', () => {
    it('renders month grid', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('renders day of week headers', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBe(7);
    });

    it('renders calendar cells', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      const cells = screen.getAllByRole('gridcell');
      // Should have 35-42 cells depending on month layout
      expect(cells.length).toBeGreaterThanOrEqual(28);
    });

    it('highlights today cell', () => {
      renderWithRouter(<CalendarView events={[mockEventToday]} view="month" />);

      // Find today's date number
      const todayNumber = today.getDate().toString();
      const todayCell = screen.getAllByRole('gridcell').find(
        cell => cell.textContent?.includes(todayNumber)
      );

      expect(todayCell).toHaveClass('bg-primary/5');
    });

    it('displays events in calendar cells', () => {
      renderWithRouter(<CalendarView events={[mockEventToday]} view="month" />);

      expect(screen.getByText('Today Event')).toBeInTheDocument();
    });

    it('shows "+X more" when more than 3 events on a day', () => {
      const events = [
        createMockEvent(today, { id: '1', title: 'Event 1' }),
        createMockEvent(today, { id: '2', title: 'Event 2' }),
        createMockEvent(today, { id: '3', title: 'Event 3' }),
        createMockEvent(today, { id: '4', title: 'Event 4' }),
        createMockEvent(today, { id: '5', title: 'Event 5' }),
      ];

      renderWithRouter(<CalendarView events={events} view="month" />);

      // Should show 3 events and "+2 more"
      expect(screen.getByText(/\+2/)).toBeInTheDocument();
    });

    it('handles keyboard navigation with arrow keys', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      const cells = screen.getAllByRole('gridcell');
      const firstCell = cells[0];

      fireEvent.keyDown(firstCell, { key: 'ArrowRight' });
      // Keyboard navigation should work without errors
      expect(firstCell).toBeInTheDocument();
    });
  });

  describe('Week View', () => {
    it('renders week view grid', () => {
      renderWithRouter(<CalendarView events={[]} view="week" />);

      // Week view has 8 columns (time + 7 days)
      const headers = screen.getAllByText(/AM|PM/).length > 0;
      expect(headers).toBe(true);
    });

    it('shows hours in time column', () => {
      renderWithRouter(<CalendarView events={[]} view="week" />);

      expect(screen.getByText('12 AM')).toBeInTheDocument();
      expect(screen.getByText('12 PM')).toBeInTheDocument();
    });

    it('displays events at correct time slots', () => {
      // Create event at 10 AM today
      const tenAmEvent = createMockEvent(today, { id: 'ten-am', title: '10 AM Meeting' });

      renderWithRouter(<CalendarView events={[tenAmEvent]} view="week" />);

      expect(screen.getByText('10 AM Meeting')).toBeInTheDocument();
    });

    it('highlights today column', () => {
      renderWithRouter(<CalendarView events={[]} view="week" />);

      // Today's date should have primary color styling
      const todayNumber = today.getDate().toString();
      const todayHeader = screen.getByText(todayNumber);

      expect(todayHeader).toHaveClass('text-primary');
    });
  });

  describe('Day View', () => {
    it('renders day view with time slots', () => {
      renderWithRouter(<CalendarView events={[]} view="day" />);

      expect(screen.getByText('12:00 AM')).toBeInTheDocument();
      expect(screen.getByText('12:00 PM')).toBeInTheDocument();
    });

    it('displays full day header', () => {
      const testDate = new Date(2026, 2, 15); // March 15, 2026

      renderWithRouter(
        <CalendarView events={[]} view="day" currentDate={testDate} />
      );

      // Day view shows full date in navigation header (e.g., "Sunday 15 March 2026")
      // and weekday + date separately in the day header
      const headings = screen.getAllByRole('heading', { level: 2 });
      const hasDateHeading = headings.some(h =>
        h.textContent?.includes('Sunday') || h.textContent?.includes('March')
      );
      expect(hasDateHeading).toBe(true);
    });

    it('displays events with full details', () => {
      const dayEvent = createMockEvent(today, {
        id: 'day-event',
        title: 'Full Day Event',
        venue: {
          name: 'Test Venue',
          street: '123 Test St',
          suburb: 'Test',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
        },
      });

      renderWithRouter(<CalendarView events={[dayEvent]} view="day" />);

      expect(screen.getByText('Full Day Event')).toBeInTheDocument();
      expect(screen.getByText('Test Venue')).toBeInTheDocument();
      expect(screen.getByText('In Person')).toBeInTheDocument();
    });

    it('displays event RSVP count', () => {
      const eventWithRsvp = createMockEvent(today, {
        id: 'rsvp-event',
        title: 'RSVP Event',
        rsvpCount: { going: 10, interested: 5, total: 15 },
      });

      renderWithRouter(<CalendarView events={[eventWithRsvp]} view="day" />);

      expect(screen.getByText('10 going')).toBeInTheDocument();
    });
  });

  describe('Event Interaction', () => {
    it('calls onEventClick when event is clicked', () => {
      const onEventClick = vi.fn();

      renderWithRouter(
        <CalendarView
          events={[mockEventToday]}
          view="month"
          onEventClick={onEventClick}
        />
      );

      fireEvent.click(screen.getByText('Today Event'));
      expect(onEventClick).toHaveBeenCalledWith(mockEventToday);
    });

    it('renders event as link when onEventClick is not provided', () => {
      renderWithRouter(
        <CalendarView events={[mockEventToday]} view="month" />
      );

      const link = screen.getByRole('link', { name: /Today Event/i });
      expect(link).toHaveAttribute('href', '/events/community-cleanup-day');
    });

    it('navigates to day view when day is clicked in month view', () => {
      const onViewChange = vi.fn();
      const onDateChange = vi.fn();

      renderWithRouter(
        <CalendarView
          events={[]}
          view="month"
          onViewChange={onViewChange}
          onDateChange={onDateChange}
        />
      );

      const cells = screen.getAllByRole('gridcell');
      fireEvent.click(cells[10]); // Click a day cell

      expect(onViewChange).toHaveBeenCalledWith('day');
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading', () => {
      const { container } = renderWithRouter(<CalendarView events={[]} loading />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does not render calendar when loading', () => {
      renderWithRouter(<CalendarView events={[]} loading />);

      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no events', () => {
      renderWithRouter(<CalendarView events={[]} />);

      expect(screen.getByText('No events on this day')).toBeInTheDocument();
    });
  });

  describe('Cancelled Events', () => {
    it('styles cancelled events differently', () => {
      const cancelledEvent = createMockEvent(today, {
        id: 'cancelled',
        title: 'Cancelled Event',
        status: 'CANCELLED',
      });

      renderWithRouter(<CalendarView events={[cancelledEvent]} view="month" />);

      const eventElement = screen.getByText('Cancelled Event').closest('div');
      expect(eventElement).toHaveClass('bg-red-100');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as uncontrolled component', () => {
      renderWithRouter(<CalendarView events={[]} />);

      // Should render without errors and handle internal state
      fireEvent.click(screen.getByText('Week'));
      expect(screen.getByText('Week')).toHaveAttribute('aria-pressed', 'true');
    });

    it('works as controlled component', () => {
      const onViewChange = vi.fn();

      renderWithRouter(
        <CalendarView
          events={[]}
          view="month"
          onViewChange={onViewChange}
        />
      );

      fireEvent.click(screen.getByText('Week'));
      expect(onViewChange).toHaveBeenCalledWith('week');
      // View should still be month since we're controlling it
      expect(screen.getByText('Month')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in month view', async () => {
      const { container } = renderWithRouter(
        <CalendarView events={[mockEventToday]} view="month" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in week view', async () => {
      const { container } = renderWithRouter(
        <CalendarView events={[mockEventToday]} view="week" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in day view', async () => {
      const { container } = renderWithRouter(
        <CalendarView events={[mockEventToday]} view="day" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper grid role in month view', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('has proper row structure', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header row + week rows
    });

    it('grid cells are focusable', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      const cells = screen.getAllByRole('gridcell');
      const focusableCell = cells.find(cell => cell.tabIndex === 0);
      expect(focusableCell).toBeTruthy();
    });

    it('buttons have minimum touch target size', () => {
      renderWithRouter(<CalendarView events={[]} />);

      const todayButton = screen.getByText('Today');
      expect(todayButton).toHaveClass('min-h-[44px]');
    });

    it('view toggle buttons have aria-pressed', () => {
      renderWithRouter(<CalendarView events={[]} view="month" />);

      expect(screen.getByText('Month')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Week')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('Day')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = renderWithRouter(
        <CalendarView events={[]} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
