/**
 * EventDetailPage
 * Phase 8: Events & Calendar System
 * Individual event detail page
 * WCAG 2.1 AA compliant, SEO optimized
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Badge } from '../../components/display/Badge';
import { Skeleton } from '../../components/display/Skeleton';
import { EmptyState } from '../../components/display/EmptyState';
import { Avatar } from '../../components/display/Avatar';
import { RSVPButton } from '../../components/events/RSVPButton';
import { useAuth } from '../../hooks/useAuth';
import { eventService, formatEventDate, getLocationTypeBadgeVariant } from '../../services/event-service';
import type { Event, RSVPStatus } from '../../services/event-service';
import { BusinessMap } from '../../components/maps/BusinessMap';
import { post } from '../../services/api-client';

export function EventDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch event
  const fetchEvent = useCallback(async () => {
    if (!idOrSlug) return;

    setLoading(true);
    setError(null);

    try {
      // Try by slug first, then by ID
      let response;
      if (idOrSlug.includes('-')) {
        // Likely a slug
        response = await eventService.getEventBySlug(idOrSlug);
      } else {
        response = await eventService.getEvent(idOrSlug);
      }
      setEvent(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('events.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [idOrSlug, t]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Geocode venue address for map
  useEffect(() => {
    if (!event?.venue || event.locationType === 'ONLINE') return;

    // Use existing coordinates if available
    if (event.venue.latitude && event.venue.longitude) {
      setMapCoords({ lat: event.venue.latitude, lng: event.venue.longitude });
      return;
    }

    // Geocode the address
    let cancelled = false;
    async function geocode() {
      try {
        const result = await post<{ success: boolean; data: { latitude: number; longitude: number } }>('/geocode', {
          street: event!.venue!.street,
          suburb: event!.venue!.suburb,
          postcode: event!.venue!.postcode,
          country: event!.venue!.country || 'Australia',
        });
        if (!cancelled && result.data) {
          setMapCoords({ lat: result.data.latitude, lng: result.data.longitude });
        }
      } catch {
        // Silently fail - map just won't show
      }
    }
    geocode();
    return () => { cancelled = true; };
  }, [event?.venue, event?.locationType]);

  // Anonymous RSVP stored in localStorage
  const [anonRSVP, setAnonRSVP] = useState<RSVPStatus | null>(() => {
    if (!idOrSlug) return null;
    try {
      const stored = localStorage.getItem(`event-rsvp-${idOrSlug}`);
      return stored as RSVPStatus | null;
    } catch {
      return null;
    }
  });

  // Handle RSVP - works for both logged-in and anonymous users
  const handleRSVP = async (status: RSVPStatus, guestCount: number = 1) => {
    if (!event) return;

    setRsvpLoading(true);
    try {
      if (user) {
        // Authenticated: persist to backend
        const response = await eventService.rsvpToEvent(event.id, { status, guestCount });
        setEvent(response.data.event);
      } else {
        // Anonymous: store locally
        localStorage.setItem(`event-rsvp-${idOrSlug}`, status);
        setAnonRSVP(status);
      }
    } catch (err) {
      // Show error toast
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle cancel RSVP
  const handleCancelRSVP = async () => {
    if (!event) return;

    setRsvpLoading(true);
    try {
      if (user) {
        // Authenticated: cancel on backend
        await eventService.cancelRSVP(event.id);
        fetchEvent();
      } else {
        // Anonymous: remove local status
        localStorage.removeItem(`event-rsvp-${idOrSlug}`);
        setAnonRSVP(null);
      }
    } catch (err) {
      // Show error toast
    } finally {
      setRsvpLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="event-detail-page">
          <Skeleton variant="rectangular" width="100%" height="300px" />
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            <Skeleton variant="text" width="30%" height="24px" />
            <Skeleton variant="text" width="70%" height="40px" />
            <Skeleton variant="text" width="50%" height="24px" />
            <Skeleton variant="text" width="100%" height="120px" />
          </div>
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <PageContainer>
        <EmptyState
          title={t('events.notFoundTitle')}
          description={error || t('events.notFoundDescription')}
          icon="📅"
          action={
            <Link
              to="/events"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              {t('events.browseEvents')}
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const dateInfo = formatEventDate(event.startTime, event.endTime, i18n.language === 'en' ? 'en-AU' : i18n.language);
  const isPast = new Date(event.endTime) < new Date();
  const isFull = event.capacity !== null && event.spotsRemaining === 0;
  const isOwner = user?.id === event.createdById;

  // Get category name
  const categoryName =
    typeof event.category?.name === 'string'
      ? event.category.name
      : event.category?.name?.[i18n.language] || event.category?.name?.en || '';

  // Location type label
  const locationTypeLabels: Record<string, string> = {
    PHYSICAL: t('events.locationType.physical'),
    ONLINE: t('events.locationType.online'),
    HYBRID: t('events.locationType.hybrid'),
  };

  // SEO
  const platformName = import.meta.env.VITE_PLATFORM_NAME || 'Community Hub';
  const pageTitle = `${event.title} | ${platformName}`;
  const pageDescription = event.description.substring(0, 160);
  const canonicalUrl = `${window.location.origin}/events/${event.slug || event.id}`;

  // Schema.org Event
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startTime,
    endDate: event.endTime,
    eventStatus: event.status === 'CANCELLED' ? 'EventCancelled' : 'EventScheduled',
    eventAttendanceMode:
      event.locationType === 'ONLINE'
        ? 'OnlineEventAttendanceMode'
        : event.locationType === 'HYBRID'
        ? 'MixedEventAttendanceMode'
        : 'OfflineEventAttendanceMode',
    ...(event.imageUrl && { image: event.imageUrl }),
    ...(event.venue && {
      location: {
        '@type': 'Place',
        name: event.venue.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.venue.street,
          addressLocality: event.venue.suburb,
          addressRegion: event.venue.state,
          postalCode: event.venue.postcode,
          addressCountry: event.venue.country,
        },
      },
    }),
    ...(event.onlineUrl &&
      event.locationType !== 'PHYSICAL' && {
        location: {
          '@type': 'VirtualLocation',
          url: event.onlineUrl,
        },
      }),
    organizer: {
      '@type': 'Person',
      name: event.createdBy.displayName,
    },
    ...(event.cost && {
      offers: {
        '@type': 'Offer',
        price: event.cost === 'free' || event.cost === '0' ? '0' : event.cost,
        priceCurrency: 'AUD',
      },
    }),
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={canonicalUrl} />
        {event.imageUrl && <meta property="og:image" content={event.imageUrl} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={pageDescription} />
        {event.imageUrl && <meta name="twitter:image" content={event.imageUrl} />}

        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <PageContainer>
        <article className="max-w-4xl mx-auto py-8">
          {/* Back link */}
          <Link
            to="/events"
            className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('events.backToEvents')}
          </Link>

          {/* Hero Image */}
          {event.imageUrl ? (
            <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={event.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {(event.status === 'CANCELLED' || isPast) && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge
                    variant={event.status === 'CANCELLED' ? 'error' : 'default'}
                    size="lg"
                  >
                    {event.status === 'CANCELLED' ? t('events.status.cancelled') : t('events.status.past')}
                  </Badge>
                </div>
              )}
              {(isOwner || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CURATOR') && (
                <Link
                  to={user?.role === 'CURATOR' ? `/curator/events/${event.id}/edit` : `/admin/events/${event.id}/edit`}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('events.editEvent')}
                </Link>
              )}
            </div>
          ) : (
            <div className="relative w-full h-64 md:h-80 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center">
              <span className="text-8xl" role="img" aria-hidden="true">📅</span>
              {(event.status === 'CANCELLED' || isPast) && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <Badge
                    variant={event.status === 'CANCELLED' ? 'error' : 'default'}
                    size="lg"
                  >
                    {event.status === 'CANCELLED' ? t('events.status.cancelled') : t('events.status.past')}
                  </Badge>
                </div>
              )}
              {(isOwner || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'CURATOR') && (
                <Link
                  to={user?.role === 'CURATOR' ? `/curator/events/${event.id}/edit` : `/admin/events/${event.id}/edit`}
                  className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('events.editEvent')}
                </Link>
              )}
            </div>
          )}

          {/* Header Card (overlapping hero like business profile) */}
          <div className="relative -mt-20 mx-4 md:mx-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8">
            {/* Title Row */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {event.title}
                </h1>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {categoryName && (
                    <Badge variant="default" size="sm">{categoryName}</Badge>
                  )}
                  <Badge variant={getLocationTypeBadgeVariant(event.locationType)} size="sm">
                    {locationTypeLabels[event.locationType]}
                  </Badge>
                  {(event.cost === null || event.cost === '' || event.cost === '0' || event.cost?.toLowerCase() === 'free') && (
                    <Badge variant="success" size="sm">{t('events.free')}</Badge>
                  )}
                  {event.status === 'PENDING' && (
                    <Badge variant="warning" size="sm">{t('events.status.pending')}</Badge>
                  )}
                </div>

                {/* Date and Time */}
                <div className="flex items-start gap-3 mt-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                      {new Date(event.startTime).toLocaleDateString(i18n.language, { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-primary leading-tight">
                      {new Date(event.startTime).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{dateInfo.date}</p>
                    <p className="text-slate-600 dark:text-slate-300">{dateInfo.time}</p>
                    {dateInfo.duration && (
                      <p className="text-sm text-slate-400">{dateInfo.duration}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="flex-shrink-0 w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={t('events.addToCalendar')}
                    title={t('events.addToCalendar')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>

            {/* Description */}
            <div className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* RSVP */}
            {!isPast && event.status !== 'CANCELLED' && (
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <RSVPButton
                  currentStatus={user ? (event.userRSVP?.status || null) : anonRSVP}
                  onRSVP={handleRSVP}
                  onCancel={handleCancelRSVP}
                  isFull={isFull}
                  isPast={isPast}
                  disabled={rsvpLoading || isOwner}
                  variant="full"
                  shareUrl={canonicalUrl}
                  shareTitle={event.title}
                />
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  {event.rsvpCount.going > 0 && (
                    <span>{t('events.rsvp.goingCount', { count: event.rsvpCount.going })}</span>
                  )}
                  {event.rsvpCount.interested > 0 && (
                    <span>{t('events.rsvp.interestedCount', { count: event.rsvpCount.interested })}</span>
                  )}
                  {event.capacity && (
                    <span>
                      {isFull
                        ? t('events.capacity.full')
                        : t('events.capacity.spotsLeft', { count: event.spotsRemaining ?? 0 })}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Content Cards */}
          <div className="mt-6 space-y-6">
            {/* Location & Map Card */}
            {event.locationType !== 'ONLINE' && event.venue && (() => {
              const lat = mapCoords?.lat ?? (event.venue as Record<string, unknown>).latitude as number ?? -33.8535;
              const lng = mapCoords?.lng ?? (event.venue as Record<string, unknown>).longitude as number ?? 150.987;
              const fullAddress = [event.venue!.name, event.venue!.street, event.venue!.suburb, event.venue!.state, event.venue!.postcode].filter(Boolean).join(', ');
              return (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        {t('events.location', 'Location')}
                      </h2>
                      {event.venue!.name && <p className="font-semibold text-slate-900 dark:text-white">{event.venue!.name}</p>}
                      <address className="not-italic text-slate-600 dark:text-slate-300 mt-1">
                        {event.venue!.street}<br />
                        {event.venue!.suburb}, {event.venue!.state} {event.venue!.postcode}
                      </address>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue!.street}, ${event.venue!.suburb}, ${event.venue!.state} ${event.venue!.postcode}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        {t('events.getDirections', 'Get Directions')}
                      </a>
                    </div>
                    <div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block cursor-pointer"
                        aria-label={t('events.getDirections', 'Get Directions')}
                      >
                        <BusinessMap
                          latitude={lat}
                          longitude={lng}
                          businessName={event.venue!.name || event.title}
                          address={fullAddress}
                          className="h-48 rounded-xl"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Online URL Card */}
            {(event.locationType === 'ONLINE' || event.locationType === 'HYBRID') && event.onlineUrl && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{t('events.onlineEvent')}</p>
                    <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {t('events.joinOnline')}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Details Card (cost, age, accessibility, tickets) */}
            {(
              (event.cost && event.cost !== 'free' && event.cost !== '0') ||
              event.ageRestriction ||
              (event.accessibility && event.accessibility.length > 0) ||
              event.ticketUrl
            ) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {t('events.details', 'Details')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {event.cost && event.cost !== 'free' && event.cost !== '0' && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('events.cost')}</p>
                        <p className="text-slate-900 dark:text-white font-medium">{event.cost}</p>
                      </div>
                    </div>
                  )}

                  {event.ageRestriction && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('events.ageRestriction')}</p>
                        <p className="text-slate-900 dark:text-white font-medium">{event.ageRestriction}</p>
                      </div>
                    </div>
                  )}

                  {event.accessibility && event.accessibility.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('events.accessibility')}</p>
                        <ul className="text-slate-700 dark:text-slate-300 space-y-0.5">
                          {event.accessibility.map((item, index) => (
                            <li key={index} className="text-sm">{t(`events.accessibilityOptions.${item}`, item)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {event.ticketUrl && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('events.tickets')}</p>
                        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                          {t('events.buyTickets')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Organizer Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.hostedBy')}
              </h2>
              <div className="flex items-center gap-3">
                <Avatar
                  name={event.createdBy.displayName}
                  src={event.createdBy.profilePhoto || undefined}
                  size="md"
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {event.createdBy.displayName}
                  </p>
                  {event.linkedBusiness && (
                    <Link
                      to={`/businesses/${event.linkedBusiness.slug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {event.linkedBusiness.name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add to Calendar Panel */}
          {showCalendarModal && (
            <div className="fixed inset-0 z-50" onClick={() => setShowCalendarModal(false)}>
              <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('events.addToCalendar')}</h3>
                  <button
                    onClick={() => setShowCalendarModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label={t('common.close', 'Close')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <a
                    href={eventService.getGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-900 dark:text-white">Google Calendar</span>
                  </a>
                  <a
                    href={eventService.getExportUrl(event.id)}
                    download
                    className="flex items-center px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-slate-900 dark:text-white">{t('events.downloadICS')}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </article>
      </PageContainer>
    </>
  );
}

export default EventDetailPage;
