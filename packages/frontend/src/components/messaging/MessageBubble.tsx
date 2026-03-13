/**
 * MessageBubble Component
 * Phase 9: Messaging System
 * Displays a single message in a conversation
 * WCAG 2.1 AA compliant
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../display/Avatar';
import './MessageBubble.css';

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
  /** Whether message has been read */
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
  isRead = false,
  isDeleted = false,
  createdAt,
  showSender = false,
  showTimestamp = true,
  onDelete,
  canDelete = false,
}) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = React.useState(false);

  const bubbleClasses = [
    'message-bubble',
    isOwn ? 'message-bubble--own' : 'message-bubble--other',
    isDeleted ? 'message-bubble--deleted' : '',
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

        {/* Timestamp and read status */}
        {showTimestamp && (
          <div className="message-bubble__meta">
            <time
              dateTime={createdAt.toISOString()}
              className="message-bubble__time"
            >
              {formatTime(createdAt)}
            </time>
            {isOwn && isRead && (
              <span
                className="message-bubble__read-indicator"
                aria-label={t('messaging.read')}
              >
                ✓✓
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
