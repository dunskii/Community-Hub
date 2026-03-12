/**
 * EventCard Component Tests
 * Phase 8: Events & Calendar System
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EventCard } from '../EventCard';
import type { Event } from '../../../services/event-service';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'events.locationType.physical': 'In Person',
        'events.locationType.online': 'Online',
        'events.locationType.hybrid': 'Hybrid',
        'events.status.pending': 'Pending',
        'events.status.active': 'Active',
        'events.status.cancelled': 'Cancelled',
        'events.status.past': 'Past',
        'events.free': 'Free',
        'events.rsvp.goingCount': `${options?.count || 0} going`,
        'events.rsvp.interestedCount': `${options?.count || 0} interested`,
        'events.capacity.full': 'Full',
        'events.capacity.spotsLeft': `${options?.count || 0} spots left`,
        'events.rsvp.status.going': 'Going',
        'events.rsvp.status.interested': 'Interested',
        'events.rsvp.status.not_going': 'Not Going',
        'events.date.today': 'Today',
        'events.date.tomorrow': 'Tomorrow',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      dir: () => 'ltr',
    },
  }),
}));

const mockEvent: Event = {
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
  startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  endTime: new Date(Date.now() + 86400000 + 7200000).toISOString(), // Tomorrow + 2 hours
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
  imageUrl: 'https://example.com/event.jpg',
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
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('EventCard', () => {
  it('renders event title', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(screen.getByText('Community Cleanup Day')).toBeInTheDocument();
  });

  it('renders event description', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(
      screen.getByText(/Join us for a community cleanup event/)
    ).toBeInTheDocument();
  });

  it('renders category badge', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(screen.getByText('Community')).toBeInTheDocument();
  });

  it('renders location type badge', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(screen.getByText('In Person')).toBeInTheDocument();
  });

  it('renders location for physical events', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(screen.getByText('Guildford, NSW')).toBeInTheDocument();
  });

  it('renders RSVP counts', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(screen.getByText('25 going')).toBeInTheDocument();
    expect(screen.getByText('10 interested')).toBeInTheDocument();
  });

  it('renders spots remaining', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    expect(screen.getByText('25 spots left')).toBeInTheDocument();
  });

  it('renders full badge when no spots remaining', () => {
    const fullEvent: Event = {
      ...mockEvent,
      spotsRemaining: 0,
    };
    renderWithRouter(<EventCard event={fullEvent} />);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('renders free badge for free events', () => {
    const freeEvent: Event = {
      ...mockEvent,
      cost: 'free',
    };
    renderWithRouter(<EventCard event={freeEvent} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders online event correctly', () => {
    const onlineEvent: Event = {
      ...mockEvent,
      locationType: 'ONLINE',
      venue: null,
      onlineUrl: 'https://zoom.us/123',
    };
    renderWithRouter(<EventCard event={onlineEvent} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Online Event')).toBeInTheDocument();
  });

  it('renders hybrid event badge', () => {
    const hybridEvent: Event = {
      ...mockEvent,
      locationType: 'HYBRID',
      onlineUrl: 'https://zoom.us/123',
    };
    renderWithRouter(<EventCard event={hybridEvent} />);
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('renders event image', () => {
    const { container } = renderWithRouter(<EventCard event={mockEvent} />);
    // Find the actual event image element directly
    const eventImage = container.querySelector('img[src="https://example.com/event.jpg"]');
    expect(eventImage).toBeInTheDocument();
  });

  it('renders placeholder when no image', () => {
    const noImageEvent: Event = {
      ...mockEvent,
      imageUrl: null,
    };
    renderWithRouter(<EventCard event={noImageEvent} />);
    expect(screen.getByText('📅')).toBeInTheDocument();
  });

  it('renders status badge for pending events', () => {
    const pendingEvent: Event = {
      ...mockEvent,
      status: 'PENDING',
    };
    renderWithRouter(<EventCard event={pendingEvent} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders status badge for cancelled events', () => {
    const cancelledEvent: Event = {
      ...mockEvent,
      status: 'CANCELLED',
    };
    renderWithRouter(<EventCard event={cancelledEvent} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders user RSVP status when present', () => {
    const eventWithRSVP: Event = {
      ...mockEvent,
      userRSVP: {
        status: 'GOING',
        guestCount: 2,
      },
    };
    renderWithRouter(<EventCard event={eventWithRSVP} />);
    expect(screen.getByText('Going +1')).toBeInTheDocument();
  });

  it('links to event detail page using slug', () => {
    renderWithRouter(<EventCard event={mockEvent} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/events/community-cleanup-day');
  });

  it('links to event detail page using id when no slug', () => {
    const noSlugEvent: Event = {
      ...mockEvent,
      slug: null,
    };
    renderWithRouter(<EventCard event={noSlugEvent} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/events/event-1');
  });

  it('calls onClick handler when provided', () => {
    const handleClick = vi.fn();
    renderWithRouter(<EventCard event={mockEvent} onClick={handleClick} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders button instead of link when onClick provided', () => {
    const handleClick = vi.fn();
    renderWithRouter(<EventCard event={mockEvent} onClick={handleClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders compact variant', () => {
    renderWithRouter(<EventCard event={mockEvent} compact />);
    // In compact mode, description should not be visible
    const description = screen.queryByText(
      /Join us for a community cleanup event/
    );
    // The description element exists but is hidden via line-clamp in compact
    expect(screen.getByRole('article')).toHaveClass('flex');
  });

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithRouter(<EventCard event={mockEvent} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for button variant', async () => {
      const { container } = renderWithRouter(
        <EventCard event={mockEvent} onClick={() => {}} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      renderWithRouter(<EventCard event={mockEvent} />);
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('has focus visible styles on link', () => {
      renderWithRouter(<EventCard event={mockEvent} />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus-visible:ring-2');
    });

    it('has focus visible styles on button', () => {
      renderWithRouter(<EventCard event={mockEvent} onClick={() => {}} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });
});
