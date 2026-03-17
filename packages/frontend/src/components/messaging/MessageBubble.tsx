/**
 * MessageBubble Component
 * Phase 9: Messaging System
 * [UI/UX Spec v2.2 §9 - Message States]
 * Displays a single message in a conversation
 * WCAG 2.1 AA compliant
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../display/Avatar';
import './MessageBubble.css';

/** Message status types per UI/UX Spec v2.2 */
export type MessageStatus = 'sending' | 'sent' | 'read' | 'failed';

export interface MessageAttachment {
  id: string;
  url: string;
  altText?: string;
  mimeType: string;
  sizeBytes: number;
}

export interface MessageBubbleProps {
  /** Message ID */
  id: string;
  /** Message content */
  content: string;
  /** Whether this message is from the current user */
  isOwn: boolean;
  /** Sender information */
  sender?: {
    id: string;
    displayName: string;
    profilePhoto?: string | null;
  };
  /** Message attachments */
  attachments?: MessageAttachment[];
  /**
   * Message status (sending, sent, read, failed)
   * Per UI/UX Spec v2.2 §9 - no "delivered" state
   */
  status?: MessageStatus;
  /** @deprecated Use status prop instead */
  isRead?: boolean;
  /** Whether message is deleted */
  isDeleted?: boolean;
  /** Message timestamp */
  createdAt: Date;
  /** Whether to show sender info (first message in group) */
  showSender?: boolean;
  /** Whether to show timestamp (last message in group) */
  showTimestamp?: boolean;
  /** Callback when delete is clicked (only for own messages within 24h) */
  onDelete?: () => void;
  /** Whether delete is allowed */
  canDelete?: boolean;
  /** Callback when retry is clicked (for failed messages) */
  onRetry?: () => void;
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('default', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  isOwn,
  sender,
  attachments = [],
  status,
  isRead = false,
  isDeleted = false,
  createdAt,
  showSender = false,
  showTimestamp = true,
  onDelete,
  canDelete = false,
  onRetry,
}) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = React.useState(false);

  // Derive status from isRead for backwards compatibility
  const effectiveStatus: MessageStatus | undefined = status ?? (isRead ? 'read' : undefined);

  const bubbleClasses = [
    'message-bubble',
    isOwn ? 'message-bubble--own' : 'message-bubble--other',
    isDeleted ? 'message-bubble--deleted' : '',
    effectiveStatus === 'failed' ? 'message-bubble--failed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowActions(!showActions);
    }
  };

  return (
    <div
      className={`message-bubble-container ${isOwn ? 'message-bubble-container--own' : ''}`}
      data-testid={`message-bubble-${id}`}
    >
      {/* Sender avatar (only for received messages) */}
      {!isOwn && showSender && sender && (
        <div className="message-bubble__avatar">
          <Avatar
            name={sender.displayName}
            src={sender.profilePhoto ?? undefined}
            alt={sender.displayName}
            size="sm"
          />
        </div>
      )}

      <div className="message-bubble__content-wrapper">
        {/* Sender name (only for received messages) */}
        {!isOwn && showSender && sender && (
          <span className="message-bubble__sender-name">{sender.displayName}</span>
        )}

        <div
          className={bubbleClasses}
          role="article"
          aria-label={t('messaging.messageFrom', {
            sender: isOwn ? t('messaging.you') : sender?.displayName ?? t('messaging.unknown'),
          })}
          tabIndex={0}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
          onFocus={() => setShowActions(true)}
          onBlur={() => setShowActions(false)}
          onKeyDown={handleKeyDown}
        >
          {isDeleted ? (
            <span className="message-bubble__deleted-text">
              {t('messaging.messageDeleted')}
            </span>
          ) : (
            <>
              {/* Message text */}
              <p className="message-bubble__text">{content}</p>

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="message-bubble__attachments">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="message-bubble__attachment"
                      aria-label={attachment.altText ?? t('messaging.viewAttachment')}
                    >
                      {attachment.mimeType.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.altText ?? t('messaging.attachment')}
                          className="message-bubble__attachment-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="message-bubble__attachment-file">
                          <span className="message-bubble__attachment-icon">📎</span>
                          <span className="message-bubble__attachment-size">
                            {formatFileSize(attachment.sizeBytes)}
                          </span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Actions (delete) */}
          {isOwn && canDelete && !isDeleted && showActions && (
            <div className="message-bubble__actions">
              <button
                type="button"
                className="message-bubble__action-btn"
                onClick={onDelete}
                aria-label={t('messaging.deleteMessage')}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          )}
        </div>

        {/* Timestamp and status indicator */}
        {showTimestamp && (
          <div className="message-bubble__meta">
            <time
              dateTime={createdAt.toISOString()}
              className="message-bubble__time"
            >
              {formatTime(createdAt)}
            </time>
            {isOwn && <MessageStatusIndicator status={effectiveStatus} onRetry={onRetry} />}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Message status indicator component
 * Shows sending spinner, sent checkmark, read double checkmark, or failed icon
 */
interface MessageStatusIndicatorProps {
  status?: MessageStatus;
  onRetry?: () => void;
}

function MessageStatusIndicator({ status, onRetry }: MessageStatusIndicatorProps) {
  const { t } = useTranslation();

  if (!status) {
    return null;
  }

  switch (status) {
    case 'sending':
      return (
        <span
          className="message-bubble__status message-bubble__status--sending"
          aria-label={t('messaging.status.sending', 'Sending...')}
        >
          <svg
            className="message-bubble__spinner"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="28"
              strokeDashoffset="10"
            />
          </svg>
        </span>
      );

    case 'sent':
      return (
        <span
          className="message-bubble__status message-bubble__status--sent"
          aria-label={t('messaging.status.sent', 'Sent')}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3,8 7,12 13,4" />
          </svg>
        </span>
      );

    case 'read':
      return (
        <span
          className="message-bubble__status message-bubble__status--read"
          aria-label={t('messaging.status.read', 'Read')}
        >
          <svg
            viewBox="0 0 20 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="1,8 5,12 11,4" />
            <polyline points="7,8 11,12 17,4" />
          </svg>
        </span>
      );

    case 'failed':
      return (
        <span className="message-bubble__status message-bubble__status--failed">
          {onRetry ? (
            <button
              type="button"
              className="message-bubble__retry-btn"
              onClick={onRetry}
              aria-label={t('messaging.status.tapToRetry', 'Tap to retry')}
            >
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="bold">!</text>
              </svg>
              <span className="message-bubble__retry-text">
                {t('messaging.status.retry', 'Retry')}
              </span>
            </button>
          ) : (
            <span aria-label={t('messaging.status.failed', 'Failed to send')}>
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="bold">!</text>
              </svg>
            </span>
          )}
        </span>
      );

    default:
      return null;
  }
}

export default MessageBubble;
