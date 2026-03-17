/**
 * MessageInput Component
 * Phase 9: Messaging System
 * [UI/UX Spec v2.2 §9.3 - Failed State with Retry]
 * Text input for composing and sending messages
 * WCAG 2.1 AA compliant
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './MessageInput.css';

/** Failed message info for retry */
export interface FailedMessage {
  id: string;
  content: string;
  attachments?: File[];
  error?: string;
}

export interface MessageInputProps {
  /** Placeholder text */
  placeholder?: string;
  /** Maximum message length */
  maxLength?: number;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether sending is in progress */
  isSending?: boolean;
  /** Quick reply templates available */
  quickReplies?: Array<{
    id: string;
    name: string;
    content: string;
  }>;
  /** Callback when message is submitted */
  onSend: (content: string, attachments?: File[]) => void;
  /** Callback when typing status changes */
  onTypingChange?: (isTyping: boolean) => void;
  /** Allow file attachments */
  allowAttachments?: boolean;
  /** Maximum attachments allowed */
  maxAttachments?: number;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Failed message to show with retry option */
  failedMessage?: FailedMessage;
  /** Callback when retry is clicked */
  onRetry?: (message: FailedMessage) => void;
  /** Callback when failed message is dismissed */
  onDismissFailure?: (id: string) => void;
}

const DEFAULT_MAX_LENGTH = 1000;
const DEFAULT_MAX_ATTACHMENTS = 3;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder,
  maxLength = DEFAULT_MAX_LENGTH,
  disabled = false,
  isSending = false,
  quickReplies = [],
  onSend,
  onTypingChange,
  allowAttachments = true,
  maxAttachments = DEFAULT_MAX_ATTACHMENTS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  failedMessage,
  onRetry,
  onDismissFailure,
}) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const placeholderText = placeholder ?? t('messaging.typeMessage');

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  // Handle typing indicator
  useEffect(() => {
    if (onTypingChange && content.length > 0) {
      onTypingChange(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        onTypingChange(false);
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, onTypingChange]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0 && attachments.length === 0) {
      return;
    }

    onSend(trimmedContent, attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);
    setShowQuickReplies(false);

    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (attachments.length + validFiles.length >= maxAttachments) {
        errors.push(t('messaging.maxAttachmentsReached', { max: maxAttachments }));
        break;
      }

      if (file.size > maxFileSize) {
        errors.push(
          t('messaging.fileTooLarge', {
            name: file.name,
            max: `${maxFileSize / 1024 / 1024}MB`,
          })
        );
        continue;
      }

      if (!file.type.startsWith('image/')) {
        errors.push(t('messaging.onlyImagesAllowed'));
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors[0] ?? null);
    }

    if (validFiles.length > 0) {
      setAttachments((prev) => [...prev, ...validFiles]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickReplySelect = (template: { content: string }) => {
    setContent(template.content);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  const isSubmitDisabled =
    disabled ||
    isSending ||
    (content.trim().length === 0 && attachments.length === 0);

  const handleRetry = () => {
    if (failedMessage && onRetry) {
      onRetry(failedMessage);
    }
  };

  const handleDismissFailure = () => {
    if (failedMessage && onDismissFailure) {
      onDismissFailure(failedMessage.id);
    }
  };

  const handleCopyFailedMessage = async () => {
    if (failedMessage) {
      try {
        await navigator.clipboard.writeText(failedMessage.content);
        // Could show a toast here
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = failedMessage.content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="message-input" role="form" aria-label={t('messaging.composeMessage')}>
      {/* Failed message banner */}
      {failedMessage && (
        <div className="message-input__failed-banner" role="alert">
          <div className="message-input__failed-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <text x="8" y="11" textAnchor="middle" fontSize="10" fontWeight="bold">!</text>
            </svg>
          </div>
          <div className="message-input__failed-content">
            <span className="message-input__failed-title">
              {t('messaging.status.failedToSend', 'Message failed to send')}
            </span>
            <span className="message-input__failed-text">
              {failedMessage.content.length > 50
                ? `${failedMessage.content.substring(0, 50)}...`
                : failedMessage.content}
            </span>
          </div>
          <div className="message-input__failed-actions">
            <button
              type="button"
              className="message-input__failed-retry"
              onClick={handleRetry}
              aria-label={t('messaging.status.tapToRetry', 'Tap to retry')}
            >
              {t('messaging.status.retry', 'Retry')}
            </button>
            <button
              type="button"
              className="message-input__failed-copy"
              onClick={handleCopyFailedMessage}
              aria-label={t('messaging.copyMessage', 'Copy message')}
            >
              {t('common.copy', 'Copy')}
            </button>
            <button
              type="button"
              className="message-input__failed-dismiss"
              onClick={handleDismissFailure}
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="message-input__error" role="alert">
          {error}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="message-input__attachments" aria-label={t('messaging.attachments')}>
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="message-input__attachment-preview">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="message-input__attachment-thumb"
              />
              <button
                type="button"
                className="message-input__attachment-remove"
                onClick={() => handleRemoveAttachment(index)}
                aria-label={t('messaging.removeAttachment', { name: file.name })}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick replies dropdown */}
      {showQuickReplies && quickReplies.length > 0 && (
        <div className="message-input__quick-replies" role="listbox">
          {quickReplies.map((template) => (
            <button
              key={template.id}
              type="button"
              className="message-input__quick-reply"
              onClick={() => handleQuickReplySelect(template)}
              role="option"
            >
              <span className="message-input__quick-reply-name">{template.name}</span>
              <span className="message-input__quick-reply-preview">
                {template.content.substring(0, 50)}
                {template.content.length > 50 ? '...' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="message-input__container">
        {/* Quick replies toggle (for business owners) */}
        {quickReplies.length > 0 && (
          <button
            type="button"
            className="message-input__quick-btn"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
            aria-label={t('messaging.quickReplies')}
            aria-expanded={showQuickReplies}
            disabled={disabled}
          >
            <span aria-hidden="true">⚡</span>
          </button>
        )}

        {/* Attachment button */}
        {allowAttachments && (
          <>
            <button
              type="button"
              className="message-input__attach-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t('messaging.attachFile')}
              disabled={disabled || attachments.length >= maxAttachments}
            >
              <span aria-hidden="true">📎</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="message-input__file-input"
              aria-hidden="true"
            />
          </>
        )}

        {/* Text input */}
        <textarea
          ref={textareaRef}
          className="message-input__textarea"
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={disabled || isSending}
          aria-label={placeholderText}
          rows={1}
        />

        {/* Character count */}
        {content.length > maxLength * 0.8 && (
          <span
            className={`message-input__char-count ${
              content.length >= maxLength ? 'message-input__char-count--limit' : ''
            }`}
            aria-live="polite"
          >
            {content.length}/{maxLength}
          </span>
        )}

        {/* Send button */}
        <button
          type="button"
          className="message-input__send-btn"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          aria-label={t('messaging.send')}
        >
          {isSending ? (
            <span className="message-input__sending" aria-hidden="true">
              ...
            </span>
          ) : (
            <span aria-hidden="true">➤</span>
          )}
        </button>
      </div>

      {/* Screen reader hint */}
      <div className="sr-only" aria-live="polite">
        {t('messaging.pressEnterToSend')}
      </div>
    </div>
  );
};

export default MessageInput;
