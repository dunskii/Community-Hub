/**
 * EventCard Component
 * Phase 8: Events & Calendar System
 * Displays event information in a card format matching homepage style.
 * WCAG 2.1 AA compliant, mobile-first, RTL-aware
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../display/Badge';
import type { Event, LocationType } from '../../services/event-service';
import { getLocationTypeBadgeVariant } from '../../services/event-service';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  compact?: boolean;
}

function getLocationTypeLabel(locationType: LocationType, t: (key: string) => string): string {
  switch (locationType) {
    case 'PHYSICAL': return t('events.locationType.physical');
    case 'ONLINE': return t('events.locationType.online');
    case 'HYBRID': return t('events.locationType.hybrid');
    default: return '';
  }
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;

  const categoryName =
    typeof event.category?.name === 'string'
      ? event.category.name
      : event.category?.name?.[i18n.language] || event.category?.name?.en || '';

  // Smart date label (Today, Tomorrow, or short date)
  const now = new Date();
  const eventDate = new Date(event.startTime);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = eventDate.toDateString() === now.toDateString();
  const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();
  const dateLabel = isToday
    ? t('events.date.today', 'Today')
    : isTomorrow
    ? t('events.date.tomorrow', 'Tomorrow')
    : eventDate.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeLabel = eventDate.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });

  const linkPath = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

  const card = (
    <article className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 ${compact ? 'flex gap-4' : ''}`}>
      {/* Event Image */}
      <div className={`relative overflow-hidden ${compact ? 'w-24 h-24 shrink-0' : 'h-48'}`}>
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
        {!compact && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 text-center">
            <div className="text-xs font-semibold text-primary uppercase">{dateLabel}</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{timeLabel}</div>
          </div>
        )}

        {/* Location type badge */}
        {!compact && (
          <div className="absolute top-3 right-3">
            <Badge
              variant={getLocationTypeBadgeVariant(event.locationType)}
              size="sm"
            >
              {getLocationTypeLabel(event.locationType, t)}
            </Badge>
          </div>
        )}

        {/* Status badge for non-active events */}
        {event.status !== 'ACTIVE' && (
          <div className="absolute bottom-2 left-2">
            <Badge
              variant={event.status === 'CANCELLED' ? 'error' : event.status === 'PENDING' ? 'warning' : 'default'}
              size="sm"
            >
              {t(`events.status.${event.status.toLowerCase()}`)}
            </Badge>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className={`p-4 ${compact ? 'flex-1 min-w-0' : 'pt-3'}`}>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {event.title}
        </h3>

        {/* Category */}
        {categoryName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {categoryName}
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
              ? [event.venue.name, event.venue.street, event.venue.suburb, event.venue.state, event.venue.postcode].filter(Boolean).join(', ')
              : t('events.location', 'Location TBA')}
          </span>
        </div>

        {/* Footer: RSVP count and cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('events.rsvp.goingCount', { count: event.rsvpCount?.going ?? 0 })}
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
    </article>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
        type="button"
      >
        {card}
      </button>
    );
  }

  return (
    <Link
      to={linkPath}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      {card}
    </Link>
  );
}
