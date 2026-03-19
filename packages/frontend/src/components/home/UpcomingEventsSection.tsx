/**
 * UpcomingEventsSection Component
 * Phase 8: Events & Calendar System - Homepage Integration
 *
 * Displays upcoming events on the homepage with horizontal scroll
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { eventService, type Event } from '../../services/event-service';
import { Badge } from '../display/Badge';
import { logger } from '../../utils/logger';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export function UpcomingEventsSection() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const response = await eventService.listEvents({
          sort: 'upcoming',
          limit: 6,
          includePast: false,
        });
        setEvents(response.data.events);
      } catch (error) {
        logger.error('Failed to fetch upcoming events', error instanceof Error ? error : undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return {
        label: t('events.date.today'),
        time: date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
    }

    if (isTomorrow) {
      return {
        label: t('events.date.tomorrow'),
        time: date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true }),
      };
    }

    return {
      label: date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  if (isLoading) {
    return (
      <section aria-labelledby="upcoming-events-heading">
        <h2 id="upcoming-events-heading" className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('home.upcomingEvents.title', 'Upcoming Events')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
              <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="upcoming-events-heading">
      <div className="flex items-center justify-between mb-6">
        <h2 id="upcoming-events-heading" className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('home.upcomingEvents.title', 'Upcoming Events')}
        </h2>
        <Link
          to="/events"
          className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
        >
          {t('home.upcomingEvents.viewAll', 'View All')} &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const { label: dateLabel, time: timeLabel } = formatEventDate(event.startTime);

          return (
            <Link
              key={event.id}
              to={`/events/${event.slug || event.id}`}
              className="group block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border border-gray-100 dark:border-gray-700"
            >
              {/* Event Image */}
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <CalendarDaysIcon className="w-12 h-12 text-primary" aria-hidden="true" />
                  </div>
                )}

                {/* Date badge overlay */}
                <div className="absolute top-3 left-3 bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 text-center">
                  <div className="text-xs font-semibold text-primary uppercase">{dateLabel}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{timeLabel}</div>
                </div>

                {/* Location type badge */}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={
                      event.locationType === 'ONLINE' ? 'success' :
                      event.locationType === 'HYBRID' ? 'warning' : 'default'
                    }
                    size="sm"
                  >
                    {t(`events.locationType.${event.locationType.toLowerCase()}`)}
                  </Badge>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>

                {/* Category */}
                {event.category && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {event.category.name.en || Object.values(event.category.name)[0]}
                  </p>
                )}

                {/* Location */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">
                    {event.locationType === 'ONLINE'
                      ? t('events.onlineEvent')
                      : event.venue
                      ? `${event.venue.suburb}, ${event.venue.state}`
                      : t('events.location')}
                  </span>
                </div>

                {/* RSVP Count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t('events.rsvp.goingCount', { count: event.rsvpCount.going })}
                  </div>

                  {event.cost === null || event.cost === '' || event.cost?.toLowerCase() === 'free' ? (
                    <Badge variant="success" size="sm">
                      {t('events.free')}
                    </Badge>
                  ) : (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{event.cost}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
