/**
 * EventCard Component
 * Phase 8: Events & Calendar System
 * Displays event information in a card format for listings
 * WCAG 2.1 AA compliant, mobile-first, RTL-aware
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../display/Badge';
import { ResponsiveImage } from '../ui/ResponsiveImage';
import type { Event, LocationType } from '../../services/event-service';
import {
  formatEventDate,
  getSmartDateLabel,
  formatEventLocation,
  getLocationTypeBadgeVariant,
} from '../../services/event-service';

interface EventCardProps {
  event: Event;
  /** Custom click handler (overrides default link) */
  onClick?: () => void;
  /** Show compact version for lists */
  compact?: boolean;
}

/**
 * Get location type label
 */
function getLocationTypeLabel(locationType: LocationType, t: (key: string) => string): string {
  switch (locationType) {
    case 'PHYSICAL':
      return t('events.locationType.physical');
    case 'ONLINE':
      return t('events.locationType.online');
    case 'HYBRID':
      return t('events.locationType.hybrid');
    default:
      return '';
  }
}

/**
 * Get event status badge variant
 */
function getStatusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'CANCELLED':
      return 'error';
    case 'PAST':
      return 'default';
    default:
      return 'default';
  }
}

export function EventCard({ event, onClick, compact = false }: EventCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  // Get localized category name
  const categoryName =
    typeof event.category?.name === 'string'
      ? event.category.name
      : event.category?.name?.[i18n.language] || event.category?.name?.en || '';

  // Format date/time
  const dateInfo = formatEventDate(event.startTime, event.endTime, i18n.language === 'en' ? 'en-AU' : i18n.language);
  const smartDate = getSmartDateLabel(event.startTime, t);
  const location = formatEventLocation(event);

  // Capacity info
  const hasCapacity = event.capacity !== null && event.capacity > 0;
  const isFull = hasCapacity && event.spotsRemaining === 0;
  const spotsLeft = event.spotsRemaining;

  const content = (
    <article
      className={`event-card bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow ${
        compact ? 'flex gap-4' : ''
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Event Image */}
      <div
        className={`event-card__image relative overflow-hidden ${
          compact ? 'w-24 h-24 shrink-0 rounded-l-lg' : 'w-full h-48 rounded-t-lg'
        }`}
      >
        {event.imageUrl ? (
          <ResponsiveImage
            src={event.imageUrl}
            alt=""
            decorative
            aspectRatio={compact ? '1:1' : '16:9'}
            objectFit="cover"
            className="w-full h-full"
            sizes={compact ? '96px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-4xl" role="img" aria-hidden="true">
              📅
            </span>
          </div>
        )}

        {/* Date badge overlay */}
        {!compact && (
          <div
            className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} bg-white rounded-lg shadow-md px-3 py-2 text-center`}
          >
            <div className="text-xs font-semibold text-primary uppercase">
              {new Date(event.startTime).toLocaleDateString(i18n.language, { month: 'short' })}
            </div>
            <div className="text-xl font-bold text-gray-900">
              {new Date(event.startTime).getDate()}
            </div>
          </div>
        )}

        {/* Status badge for non-active events */}
        {event.status !== 'ACTIVE' && (
          <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'}`}>
            <Badge variant={getStatusBadgeVariant(event.status)} size="sm">
              {t(`events.status.${event.status.toLowerCase()}`)}
            </Badge>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className={`event-card__content p-4 ${compact ? 'flex-1 min-w-0' : ''}`}>
        {/* Category and Location Type */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {categoryName && (
            <Badge variant="default" size="sm">
              {categoryName}
            </Badge>
          )}
          <Badge variant={getLocationTypeBadgeVariant(event.locationType)} size="sm">
            {getLocationTypeLabel(event.locationType, t)}
          </Badge>
          {event.cost === null || event.cost === '' || event.cost === '0' || event.cost?.toLowerCase() === 'free' ? (
            <Badge variant="success" size="sm">
              {t('events.free')}
            </Badge>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="event-card__title text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
          {event.title}
        </h3>

        {/* Date and Time */}
        <div className="event-card__datetime flex items-center gap-2 text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>
            <span className="font-medium">{smartDate}</span>
            {' · '}
            {dateInfo.time}
          </span>
        </div>

        {/* Location */}
        {location && (
          <div className="event-card__location flex items-center gap-2 text-sm text-gray-600 mb-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{location}</span>
          </div>
        )}

        {/* Description preview (non-compact only) */}
        {!compact && event.description && (
          <p className="event-card__description text-sm text-gray-600 line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Footer: RSVP count and capacity */}
        <div className="event-card__footer flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          {/* RSVP counts */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {event.rsvpCount?.going > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('events.rsvp.goingCount', { count: event.rsvpCount.going })}
              </span>
            )}
            {event.rsvpCount?.interested > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-warning"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('events.rsvp.interestedCount', { count: event.rsvpCount.interested })}
              </span>
            )}
          </div>

          {/* Capacity indicator */}
          {hasCapacity && (
            <div className="text-sm">
              {isFull ? (
                <span className="text-error font-medium">{t('events.capacity.full')}</span>
              ) : (
                <span className="text-gray-500">
                  {t('events.capacity.spotsLeft', { count: spotsLeft ?? 0 })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* User's RSVP status */}
        {event.userRSVP && (
          <div className="mt-2">
            <Badge
              variant={event.userRSVP.status === 'GOING' ? 'success' : 'default'}
              size="sm"
            >
              {t(`events.rsvp.status.${event.userRSVP.status.toLowerCase()}`)}
              {event.userRSVP.guestCount > 1 && ` +${event.userRSVP.guestCount - 1}`}
            </Badge>
          </div>
        )}
      </div>
    </article>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="event-card-button block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        type="button"
      >
        {content}
      </button>
    );
  }

  const linkPath = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

  return (
    <Link
      to={linkPath}
      className="event-card-link block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
    >
      {content}
    </Link>
  );
}
