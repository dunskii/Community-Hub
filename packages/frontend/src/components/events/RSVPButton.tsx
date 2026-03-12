/**
 * RSVPButton Component
 * Phase 8: Events & Calendar System
 * Button for RSVP actions (Going, Interested, Not Going)
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import React, { useState } from 'react';
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
   * Additional CSS classes
   */
  className?: string;
}

const STATUS_CONFIG: Record<RSVPStatus, { icon: string; variant: string }> = {
  GOING: { icon: '✓', variant: 'success' },
  INTERESTED: { icon: '★', variant: 'warning' },
  NOT_GOING: { icon: '✕', variant: 'neutral' },
};

export const RSVPButton: React.FC<RSVPButtonProps> = ({
  currentStatus,
  onRSVP,
  onCancel,
  isFull = false,
  isPast = false,
  variant = 'full',
  size = 'medium',
  disabled = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isDisabled = disabled || isPast || isLoading;
  const cannotGo = isFull && currentStatus !== 'GOING';

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
            ? config.variant === 'success'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : config.variant === 'warning'
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
            <span aria-hidden="true">{currentStatus ? config.icon : '+'}</span>
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
      <div className={`relative inline-block ${className}`}>
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
            {(['GOING', 'INTERESTED', 'NOT_GOING'] as RSVPStatus[]).map((status) => {
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
                  <span aria-hidden="true">{statusConfig.icon}</span>
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
    );
  }

  // Full variant: Three buttons side by side
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role="group" aria-label={t('events.rsvp.options')}>
      {(['GOING', 'INTERESTED', 'NOT_GOING'] as RSVPStatus[]).map((status) => {
        const config = STATUS_CONFIG[status];
        const isSelected = currentStatus === status;
        const isGoingDisabled = status === 'GOING' && cannotGo;

        let buttonClasses = baseButtonClasses;
        if (isSelected) {
          buttonClasses += config.variant === 'success'
            ? ' bg-green-500 text-white hover:bg-green-600'
            : config.variant === 'warning'
            ? ' bg-yellow-500 text-white hover:bg-yellow-600'
            : ' bg-gray-500 text-white hover:bg-gray-600';
        } else {
          buttonClasses += config.variant === 'success'
            ? ' bg-green-100 text-green-800 hover:bg-green-200'
            : config.variant === 'warning'
            ? ' bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            : ' bg-gray-100 text-gray-800 hover:bg-gray-200';
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
              <span aria-hidden="true">{config.icon}</span>
            )}
            <span>{getStatusLabel(status)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RSVPButton;
