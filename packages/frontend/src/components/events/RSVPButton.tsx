/**
 * RSVPButton Component
 * Phase 8: Events & Calendar System
 * Button for RSVP actions (Going, Interested) and Share
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { RSVPStatus } from '@community-hub/shared';

export interface RSVPButtonProps {
  /**
   * Current RSVP status (null if not RSVP'd)
   */
  currentStatus: RSVPStatus | null;
  /**
   * Callback when RSVP status changes
   */
  onRSVP: (status: RSVPStatus, guestCount?: number) => void | Promise<void>;
  /**
   * Callback when RSVP is cancelled
   */
  onCancel?: () => void | Promise<void>;
  /**
   * Whether the event is full
   */
  isFull?: boolean;
  /**
   * Whether the event is in the past
   */
  isPast?: boolean;
  /**
   * Button variant
   */
  variant?: 'compact' | 'full' | 'dropdown';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * URL to share (defaults to current page)
   */
  shareUrl?: string;
  /**
   * Title text for sharing
   */
  shareTitle?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const RSVP_STATUSES: RSVPStatus[] = ['GOING', 'INTERESTED'];

const STATUS_CONFIG: Record<string, { icon: string; variant: string }> = {
  GOING: { icon: '✓', variant: 'success' },
  INTERESTED: { icon: '★', variant: 'warning' },
};

interface ShareOption {
  key: string;
  label: string;
  icon: React.ReactNode;
  getUrl: (url: string, title: string) => string;
}

function getShareOptions(t: (key: string) => string): ShareOption[] {
  return [
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
      getUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      key: 'messenger',
      label: 'Messenger',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/></svg>,
      getUrl: (url) => `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=&redirect_uri=${encodeURIComponent(url)}`,
    },
    {
      key: 'x',
      label: 'X',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
      getUrl: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      key: 'email',
      label: t('events.share.email'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      getUrl: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
    },
    {
      key: 'sms',
      label: t('events.share.sms'),
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      getUrl: (url, title) => `sms:?body=${encodeURIComponent(`${title} ${url}`)}`,
    },
  ];
}

export const RSVPButton: React.FC<RSVPButtonProps> = ({
  currentStatus,
  onRSVP,
  onCancel,
  isFull = false,
  isPast = false,
  variant = 'full',
  size = 'medium',
  disabled = false,
  shareUrl,
  shareTitle,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || isPast || isLoading;
  const cannotGo = isFull && currentStatus !== 'GOING';

  const resolvedShareUrl = shareUrl || window.location.href;
  const resolvedShareTitle = shareTitle || document.title;

  // Close share menu on outside click
  useEffect(() => {
    if (!showShareMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  const handleRSVP = async (status: RSVPStatus) => {
    if (isLoading || disabled || isPast) return;

    // If already this status, cancel RSVP
    if (currentStatus === status && onCancel) {
      setIsLoading(true);
      try {
        await onCancel();
      } finally {
        setIsLoading(false);
        setShowDropdown(false);
      }
      return;
    }

    // Cannot RSVP as going if event is full
    if (status === 'GOING' && cannotGo) {
      return;
    }

    setIsLoading(true);
    try {
      await onRSVP(status);
    } finally {
      setIsLoading(false);
      setShowDropdown(false);
    }
  };

  const handleShare = (option: ShareOption) => {
    const url = option.getUrl(resolvedShareUrl, resolvedShareTitle);
    if (option.key === 'email' || option.key === 'sms') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedShareUrl);
    } catch {
      // Fallback: select from hidden input
    }
    setShowShareMenu(false);
  };

  const getStatusLabel = (status: RSVPStatus): string => {
    switch (status) {
      case 'GOING':
        return t('events.rsvp.going');
      case 'INTERESTED':
        return t('events.rsvp.interested');
      case 'NOT_GOING':
        return t('events.rsvp.notGoing');
      default:
        return '';
    }
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const baseButtonClasses = `
    inline-flex items-center justify-center gap-2 font-medium rounded-lg
    transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const shareButton = (
    <div className="relative" ref={shareMenuRef}>
      <button
        type="button"
        className={`${baseButtonClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`}
        onClick={() => setShowShareMenu(!showShareMenu)}
        aria-expanded={showShareMenu}
        aria-haspopup="menu"
        aria-label={t('events.share.title', 'Share with a friend')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>{t('events.share.title', 'Share')}</span>
      </button>

      {showShareMenu && (
        <div
          className="absolute z-20 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 right-0"
          role="menu"
          aria-orientation="vertical"
          aria-label={t('events.share.title', 'Share')}
        >
          {getShareOptions(t).map((option) => (
            <button
              key={option.key}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              onClick={() => handleShare(option)}
              role="menuitem"
            >
              {option.icon}
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
          <hr className="my-1 border-gray-200 dark:border-slate-600" />
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            onClick={handleCopyLink}
            role="menuitem"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span className="text-sm font-medium">{t('events.share.copyLink', 'Copy link')}</span>
          </button>
        </div>
      )}
    </div>
  );

  // Compact variant: Single button showing current status or "RSVP"
  if (variant === 'compact') {
    const displayStatus = currentStatus || 'GOING';
    const config = STATUS_CONFIG[displayStatus];

    return (
      <button
        type="button"
        className={`
          ${baseButtonClasses}
          ${currentStatus
            ? config?.variant === 'success'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : config?.variant === 'warning'
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            : 'bg-primary text-white hover:bg-primary/90'
          }
          ${className}
        `}
        onClick={() => handleRSVP(displayStatus)}
        disabled={isDisabled || (displayStatus === 'GOING' && cannotGo)}
        aria-label={currentStatus ? getStatusLabel(currentStatus) : t('events.rsvp.rsvp')}
        aria-pressed={currentStatus !== null}
      >
        {isLoading ? (
          <span className="animate-spin" aria-hidden="true">⏳</span>
        ) : (
          <>
            <span aria-hidden="true">{currentStatus ? config?.icon : '+'}</span>
            <span>{currentStatus ? getStatusLabel(currentStatus) : t('events.rsvp.rsvp')}</span>
          </>
        )}
      </button>
    );
  }

  // Dropdown variant: Button with dropdown menu
  if (variant === 'dropdown') {
    const displayStatus = currentStatus;
    const config = displayStatus ? STATUS_CONFIG[displayStatus] : null;

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative inline-block">
          <button
            type="button"
            className={`
              ${baseButtonClasses}
              ${currentStatus
                ? config?.variant === 'success'
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : config?.variant === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                : 'bg-primary text-white hover:bg-primary/90'
              }
            `}
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isDisabled}
            aria-expanded={showDropdown}
            aria-haspopup="menu"
          >
            {isLoading ? (
              <span className="animate-spin" aria-hidden="true">⏳</span>
            ) : (
              <>
                <span aria-hidden="true">{config?.icon || '+'}</span>
                <span>{currentStatus ? getStatusLabel(currentStatus) : t('events.rsvp.rsvp')}</span>
                <svg
                  className={`w-4 h-4 ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>

          {showDropdown && (
            <div
              className="absolute z-10 mt-2 w-48 bg-white rounded-lg shadow-dropdown py-1"
              role="menu"
              aria-orientation="vertical"
            >
              {RSVP_STATUSES.map((status) => {
                const statusConfig = STATUS_CONFIG[status];
                const isSelected = currentStatus === status;
                const isGoingDisabled = status === 'GOING' && cannotGo;

                return (
                  <button
                    key={status}
                    type="button"
                    className={`
                      w-full flex items-center gap-2 px-4 py-2 text-left
                      ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}
                      ${isGoingDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => handleRSVP(status)}
                    disabled={isGoingDisabled}
                    role="menuitem"
                  >
                    <span aria-hidden="true">{statusConfig?.icon}</span>
                    <span>{getStatusLabel(status)}</span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 ml-auto text-primary"
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
                    )}
                  </button>
                );
              })}
              {currentStatus && onCancel && (
                <>
                  <hr className="my-1 border-gray-200" />
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        await onCancel();
                      } finally {
                        setIsLoading(false);
                        setShowDropdown(false);
                      }
                    }}
                    role="menuitem"
                  >
                    <span aria-hidden="true">✕</span>
                    <span>{t('events.rsvp.cancel')}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {shareButton}
      </div>
    );
  }

  // Full variant: Going, Interested, Share
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label={t('events.rsvp.options')}>
      {RSVP_STATUSES.map((status) => {
        const config = STATUS_CONFIG[status];
        const isSelected = currentStatus === status;
        const isGoingDisabled = status === 'GOING' && cannotGo;

        let buttonClasses = baseButtonClasses;
        if (isSelected) {
          buttonClasses += config?.variant === 'success'
            ? ' bg-green-500 text-white hover:bg-green-600'
            : ' bg-yellow-500 text-white hover:bg-yellow-600';
        } else {
          buttonClasses += config?.variant === 'success'
            ? ' bg-green-100 text-green-800 hover:bg-green-200'
            : ' bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        }

        return (
          <button
            key={status}
            type="button"
            className={buttonClasses}
            onClick={() => handleRSVP(status)}
            disabled={isDisabled || isGoingDisabled}
            aria-pressed={isSelected}
          >
            {isLoading && currentStatus === status ? (
              <span className="animate-spin" aria-hidden="true">⏳</span>
            ) : (
              <span aria-hidden="true">{config?.icon}</span>
            )}
            <span>{getStatusLabel(status)}</span>
          </button>
        );
      })}
      {shareButton}
    </div>
  );
};

export default RSVPButton;
