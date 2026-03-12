/**
 * CalendarView Component
 * Phase 8: Events & Calendar System
 * Month, week, and day calendar views with event display
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '../display/Badge';
import type { Event } from '../../services/event-service';

// ─── Types ────────────────────────────────────────────────────

export type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  /** Events to display */
  events: Event[];
  /** Current view type */
  view?: CalendarViewType;
  /** Callback when view changes */
  onViewChange?: (view: CalendarViewType) => void;
  /** Current date (center of view) */
  currentDate?: Date;
  /** Callback when date changes */
  onDateChange?: (date: Date) => void;
  /** Callback when event is clicked */
  onEventClick?: (event: Event) => void;
  /** Loading state */
  loading?: boolean;
  /** Custom class name */
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

interface CalendarWeek {
  days: CalendarDay[];
}

// ─── Helper Functions ─────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getEventsForDay(events: Event[], date: Date): Event[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startTime);
    return isSameDay(eventStart, date);
  });
}

function getHourSlots(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

// ─── Sub-Components ───────────────────────────────────────────

interface ViewToggleProps {
  view: CalendarViewType;
  onChange: (view: CalendarViewType) => void;
}

function ViewToggle({ view, onChange }: ViewToggleProps) {
  const { t } = useTranslation();
  const views: CalendarViewType[] = ['month', 'week', 'day'];

  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-1" role="group" aria-label={t('events.calendar.viewSelector')}>
      {views.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
            view === v
              ? 'bg-primary text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-pressed={view === v}
        >
          {t(`events.calendar.${v}`)}
        </button>
      ))}
    </div>
  );
}

interface NavigationProps {
  currentDate: Date;
  view: CalendarViewType;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

function Navigation({ currentDate, view, onPrevious, onNext, onToday }: NavigationProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const getTitle = () => {
    const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;
    switch (view) {
      case 'month':
        return currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      case 'week': {
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return `${weekStart.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      case 'day':
        return currentDate.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToday}
        className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 min-h-[44px]"
      >
        {t('events.calendar.today')}
      </button>
      <div className="flex items-center">
        <button
          type="button"
          onClick={isRtl ? onNext : onPrevious}
          className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('events.calendar.previous')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={isRtl ? onPrevious : onNext}
          className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('events.calendar.next')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 min-w-[200px]">{getTitle()}</h2>
    </div>
  );
}

interface EventPillProps {
  event: Event;
  compact?: boolean;
  onClick?: () => void;
}

function EventPill({ event, compact = false, onClick }: EventPillProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;
  const startTime = new Date(event.startTime);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const content = (
    <div
      className={`group rounded px-2 py-1 text-xs cursor-pointer transition-colors ${
        event.status === 'CANCELLED'
          ? 'bg-red-100 text-red-800 hover:bg-red-200'
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      } ${compact ? 'truncate' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${event.title} at ${formatTime(startTime, locale)}`}
    >
      {!compact && (
        <span className="font-medium">{formatTime(startTime, locale)}</span>
      )}
      <span className={compact ? '' : 'ml-1'}>{event.title}</span>
    </div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link to={`/events/${event.slug || event.id}`} className="block">
      {content}
    </Link>
  );
}

// ─── Month View ───────────────────────────────────────────────

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
  onDayClick?: (date: Date) => void;
}

function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  // Generate calendar weeks
  const weeks = useMemo((): CalendarWeek[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const result: CalendarWeek[] = [];
    let current = calendarStart;

    while (current <= calendarEnd) {
      const week: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        week.push({
          date: new Date(current),
          isCurrentMonth: current.getMonth() === currentDate.getMonth(),
          isToday: isToday(current),
          events: getEventsForDay(events, current),
        });
        current = addDays(current, 1);
      }
      result.push({ days: week });
    }

    return result;
  }, [currentDate, events]);

  // Day names
  const dayNames = useMemo(() => {
    const days = [];
    const date = startOfWeek(new Date());
    for (let i = 0; i < 7; i++) {
      days.push(addDays(date, i).toLocaleDateString(locale, { weekday: 'short' }));
    }
    return isRtl ? days.reverse() : days;
  }, [locale, isRtl]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, date: Date) => {
    let newDate: Date | null = null;
    const rtlMultiplier = isRtl ? -1 : 1;

    switch (e.key) {
      case 'ArrowLeft':
        newDate = addDays(date, -1 * rtlMultiplier);
        break;
      case 'ArrowRight':
        newDate = addDays(date, 1 * rtlMultiplier);
        break;
      case 'ArrowUp':
        newDate = addDays(date, -7);
        break;
      case 'ArrowDown':
        newDate = addDays(date, 7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onDayClick?.(date);
        return;
    }

    if (newDate) {
      e.preventDefault();
      setFocusedDate(newDate);
    }
  }, [isRtl, onDayClick]);

  // Focus management
  useEffect(() => {
    if (focusedDate && gridRef.current) {
      const dateStr = focusedDate.toISOString().split('T')[0];
      const cell = gridRef.current.querySelector(`[data-date="${dateStr}"]`) as HTMLElement;
      cell?.focus();
    }
  }, [focusedDate]);

  return (
    <div
      ref={gridRef}
      className="border border-gray-200 rounded-lg overflow-hidden"
      role="grid"
      aria-label={t('events.calendar.monthView')}
    >
      {/* Header row */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200" role="row">
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="py-2 text-center text-sm font-medium text-gray-600"
            role="columnheader"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0" role="row">
          {(isRtl ? [...week.days].reverse() : week.days).map((day, dayIndex) => (
            <div
              key={dayIndex}
              data-date={day.date.toISOString().split('T')[0]}
              className={`min-h-[100px] p-1 border-r border-gray-200 last:border-r-0 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${day.isToday ? 'bg-primary/5' : ''} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset`}
              role="gridcell"
              tabIndex={day.isToday || (weekIndex === 0 && dayIndex === 0) ? 0 : -1}
              aria-label={`${day.date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })}, ${day.events.length} ${day.events.length === 1 ? t('events.calendar.event') : t('events.calendar.events')}`}
              onKeyDown={(e) => handleKeyDown(e, day.date)}
              onClick={() => onDayClick?.(day.date)}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isToday
                  ? 'w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center'
                  : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    compact
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                  />
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{day.events.length - 3} {t('events.calendar.more')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
}

function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;
  const hours = getHourSlots();

  // Generate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      days.push({
        date,
        isToday: isToday(date),
        events: getEventsForDay(events, date),
      });
    }
    return isRtl ? days.reverse() : days;
  }, [currentDate, events, isRtl]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
        <div className="w-16 border-r border-gray-200" />
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`py-2 text-center border-r border-gray-200 last:border-r-0 ${
              day.isToday ? 'bg-primary/5' : ''
            }`}
          >
            <div className="text-xs font-medium text-gray-500">
              {day.date.toLocaleDateString(locale, { weekday: 'short' })}
            </div>
            <div className={`text-lg font-semibold ${
              day.isToday ? 'text-primary' : 'text-gray-900'
            }`}>
              {day.date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
            <div className="w-16 px-2 py-1 text-xs text-gray-500 text-right border-r border-gray-200">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, dayIndex) => {
              const hourEvents = day.events.filter((event) => {
                const eventHour = new Date(event.startTime).getHours();
                return eventHour === hour;
              });

              return (
                <div
                  key={dayIndex}
                  className={`border-r border-gray-100 last:border-r-0 p-1 ${
                    day.isToday ? 'bg-primary/5' : ''
                  }`}
                >
                  {hourEvents.map((event) => (
                    <EventPill
                      key={event.id}
                      event={event}
                      onClick={onEventClick ? () => onEventClick(event) : undefined}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
}

function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-AU' : i18n.language;
  const hours = getHourSlots();
  const dayEvents = getEventsForDay(events, currentDate);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`py-3 px-4 bg-gray-50 border-b border-gray-200 ${
        isToday(currentDate) ? 'bg-primary/5' : ''
      }`}>
        <div className="text-sm font-medium text-gray-500">
          {currentDate.toLocaleDateString(locale, { weekday: 'long' })}
        </div>
        <div className={`text-2xl font-semibold ${
          isToday(currentDate) ? 'text-primary' : 'text-gray-900'
        }`}>
          {currentDate.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Time slots */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((event) => {
            const eventHour = new Date(event.startTime).getHours();
            return eventHour === hour;
          });

          return (
            <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
              <div className="w-20 flex-shrink-0 px-3 py-2 text-sm text-gray-500 text-right border-r border-gray-200">
                {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
              </div>
              <div className="flex-1 p-2 space-y-1">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-lg p-3 ${
                      event.status === 'CANCELLED'
                        ? 'bg-red-50 border-l-4 border-red-500'
                        : 'bg-primary/5 border-l-4 border-primary'
                    }`}
                  >
                    <Link
                      to={`/events/${event.slug || event.id}`}
                      onClick={(e) => {
                        if (onEventClick) {
                          e.preventDefault();
                          onEventClick(event);
                        }
                      }}
                      className="block"
                    >
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {formatTime(new Date(event.startTime), locale)} - {formatTime(new Date(event.endTime), locale)}
                      </div>
                      {event.venue && (
                        <div className="text-sm text-gray-500 mt-1">
                          {event.venue.name || event.venue.street}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default" size="sm">
                          {event.locationType === 'PHYSICAL' ? t('events.locationType.physical') :
                           event.locationType === 'ONLINE' ? t('events.locationType.online') :
                           t('events.locationType.hybrid')}
                        </Badge>
                        {event.rsvpCount.going > 0 && (
                          <span className="text-xs text-gray-500">
                            {t('events.rsvp.goingCount', { count: event.rsvpCount.going })}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function CalendarView({
  events,
  view: controlledView,
  onViewChange,
  currentDate: controlledDate,
  onDateChange,
  onEventClick,
  loading = false,
  className = '',
}: CalendarViewProps) {
  const { t } = useTranslation();

  // Internal state for uncontrolled usage
  const [internalView, setInternalView] = useState<CalendarViewType>('month');
  const [internalDate, setInternalDate] = useState(new Date());

  // Use controlled or internal state
  const view = controlledView ?? internalView;
  const currentDate = controlledDate ?? internalDate;

  const handleViewChange = useCallback((newView: CalendarViewType) => {
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setInternalView(newView);
    }
  }, [onViewChange]);

  const handleDateChange = useCallback((newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  }, [onDateChange]);

  const handlePrevious = useCallback(() => {
    switch (view) {
      case 'month':
        handleDateChange(addMonths(currentDate, -1));
        break;
      case 'week':
        handleDateChange(addWeeks(currentDate, -1));
        break;
      case 'day':
        handleDateChange(addDays(currentDate, -1));
        break;
    }
  }, [view, currentDate, handleDateChange]);

  const handleNext = useCallback(() => {
    switch (view) {
      case 'month':
        handleDateChange(addMonths(currentDate, 1));
        break;
      case 'week':
        handleDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
        handleDateChange(addDays(currentDate, 1));
        break;
    }
  }, [view, currentDate, handleDateChange]);

  const handleToday = useCallback(() => {
    handleDateChange(new Date());
  }, [handleDateChange]);

  const handleDayClick = useCallback((date: Date) => {
    handleDateChange(date);
    handleViewChange('day');
  }, [handleDateChange, handleViewChange]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 rounded mb-4" />
        <div className="h-[400px] bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <Navigation
          currentDate={currentDate}
          view={view}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />
        <ViewToggle view={view} onChange={handleViewChange} />
      </div>

      {/* Calendar content */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
          onDayClick={handleDayClick}
        />
      )}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
        />
      )}
      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
        />
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>{t('events.calendar.noEvents')}</p>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
