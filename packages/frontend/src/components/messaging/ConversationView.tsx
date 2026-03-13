/**
 * ConversationView Component
 * Phase 9: Messaging System
 * Displays a full conversation with messages and input
 * WCAG 2.1 AA compliant
 */

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../display/Avatar';
import { Badge } from '../display/Badge';
import { Skeleton } from '../display/Skeleton';
import { MessageBubble, MessageAttachment } from './MessageBubble';
import { MessageInput } from './MessageInput';
import './ConversationView.css';

export interface Message {
  id: string;
  content: string;
  senderType: 'USER' | 'BUSINESS';
  senderId: string;
  sender?: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  } | null;
  attachments: MessageAttachment[];
  readAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface ConversationDetails {
  id: string;
  subject: string;
  subjectCategory: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  business: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  user: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
  createdAt: Date;
}

export interface QuickReplyTemplate {
  id: string;
  name: string;
  content: string;
}

export interface ConversationViewProps {
  /** Conversation details */
  conversation: ConversationDetails | null;
  /** List of messages */
  messages: Message[];
  /** Current user ID */
  currentUserId: string;
  /** Whether view is in business mode */
  isBusinessView: boolean;
  /** Whether loading */
  isLoading?: boolean;
  /** Whether sending message */
  isSending?: boolean;
  /** Whether loading more messages */
  isLoadingMore?: boolean;
  /** Whether there are more messages to load */
  hasMore?: boolean;
  /** Quick reply templates (business view only) */
  quickReplies?: QuickReplyTemplate[];
  /** Callback to send message */
  onSendMessage: (content: string, attachments?: File[]) => void;
  /** Callback to load more messages */
  onLoadMore?: () => void;
  /** Callback to delete message */
  onDeleteMessage?: (messageId: string) => void;
  /** Callback to go back (mobile) */
  onBack?: () => void;
  /** Callback to archive/unarchive */
  onArchive?: () => void;
  /** Callback to block/unblock (business only) */
  onBlock?: () => void;
  /** Callback to report */
  onReport?: () => void;
}

/**
 * Group messages by sender for visual grouping
 */
function groupMessages(messages: Message[]): Array<Message & { isFirstInGroup: boolean; isLastInGroup: boolean }> {
  return messages.map((msg, index, arr) => {
    const prevMsg = arr[index - 1];
    const nextMsg = arr[index + 1];

    const isFirstInGroup =
      !prevMsg ||
      prevMsg.senderType !== msg.senderType ||
      (msg.createdAt.getTime() - prevMsg.createdAt.getTime()) > 60000;

    const isLastInGroup =
      !nextMsg ||
      nextMsg.senderType !== msg.senderType ||
      (nextMsg.createdAt.getTime() - msg.createdAt.getTime()) > 60000;

    return { ...msg, isFirstInGroup, isLastInGroup };
  });
}

/**
 * Check if message can be deleted (within 24h)
 */
function canDeleteMessage(message: Message, currentUserId: string): boolean {
  if (message.senderId !== currentUserId) return false;
  if (message.deletedAt) return false;

  const hoursSinceCreation =
    (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceCreation <= 24;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  messages,
  currentUserId,
  isBusinessView,
  isLoading = false,
  isSending = false,
  isLoadingMore = false,
  hasMore = false,
  quickReplies = [],
  onSendMessage,
  onLoadMore,
  onDeleteMessage,
  onBack,
  onArchive,
  onBlock,
  onReport,
}) => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!messagesContainerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop } = messagesContainerRef.current;
    if (scrollTop < 100) {
      onLoadMore?.();
    }
  };

  if (isLoading) {
    return (
      <div className="conversation-view conversation-view--loading">
        <div className="conversation-view__header">
          <Skeleton variant="circular" width={40} height={40} />
          <div>
            <Skeleton variant="text" width={150} height={18} />
            <Skeleton variant="text" width={100} height={14} />
          </div>
        </div>
        <div className="conversation-view__messages">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`message-skeleton ${i % 2 === 0 ? '' : 'message-skeleton--own'}`}>
              <Skeleton variant="rectangular" width={200} height={60} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="conversation-view conversation-view--empty">
        <div className="conversation-view__empty-state">
          <span className="conversation-view__empty-icon" aria-hidden="true">💬</span>
          <h2 className="conversation-view__empty-title">
            {t('messaging.selectConversation')}
          </h2>
          <p className="conversation-view__empty-description">
            {t('messaging.selectConversationDescription')}
          </p>
        </div>
      </div>
    );
  }

  const otherParty = isBusinessView ? conversation.user : conversation.business;
  const isBlocked = conversation.status === 'BLOCKED';
  const isArchived = conversation.status === 'ARCHIVED';
  const groupedMessages = groupMessages(messages);

  return (
    <div className="conversation-view" role="region" aria-label={t('messaging.conversation')}>
      {/* Header */}
      <header className="conversation-view__header">
        {onBack && (
          <button
            type="button"
            className="conversation-view__back-btn"
            onClick={onBack}
            aria-label={t('common.back')}
          >
            <span aria-hidden="true">←</span>
          </button>
        )}

        <Avatar
          name={'name' in otherParty ? otherParty.name : otherParty.displayName}
          src={'logo' in otherParty ? otherParty.logo ?? undefined : otherParty.profilePhoto ?? undefined}
          alt={'name' in otherParty ? otherParty.name : otherParty.displayName}
          size="sm"
        />

        <div className="conversation-view__header-info">
          <h1 className="conversation-view__header-name">
            {'name' in otherParty ? otherParty.name : otherParty.displayName}
          </h1>
          <span className="conversation-view__header-subject">
            {conversation.subject}
          </span>
        </div>

        {/* Status badges */}
        {(isBlocked || isArchived) && (
          <Badge
            variant={isBlocked ? 'error' : 'default'}
            size="sm"
          >
            {t(`messaging.status.${conversation.status.toLowerCase()}`)}
          </Badge>
        )}

        {/* Actions menu */}
        <div className="conversation-view__actions">
          <button
            type="button"
            className="conversation-view__action-btn"
            onClick={onArchive}
            aria-label={isArchived ? t('messaging.unarchive') : t('messaging.archive')}
            title={isArchived ? t('messaging.unarchive') : t('messaging.archive')}
          >
            <span aria-hidden="true">{isArchived ? '📥' : '📦'}</span>
          </button>

          {isBusinessView && (
            <button
              type="button"
              className="conversation-view__action-btn"
              onClick={onBlock}
              aria-label={isBlocked ? t('messaging.unblock') : t('messaging.block')}
              title={isBlocked ? t('messaging.unblock') : t('messaging.block')}
            >
              <span aria-hidden="true">{isBlocked ? '✓' : '🚫'}</span>
            </button>
          )}

          {!isBusinessView && (
            <button
              type="button"
              className="conversation-view__action-btn"
              onClick={onReport}
              aria-label={t('messaging.report')}
              title={t('messaging.report')}
            >
              <span aria-hidden="true">⚠️</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="conversation-view__messages"
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label={t('messaging.messageHistory')}
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="conversation-view__loading-more">
            <Skeleton variant="rectangular" width={200} height={40} />
          </div>
        )}

        {/* Messages */}
        {groupedMessages.map((message) => {
          const isOwn = isBusinessView
            ? message.senderType === 'BUSINESS'
            : message.senderType === 'USER';

          return (
            <MessageBubble
              key={message.id}
              id={message.id}
              content={message.content}
              isOwn={isOwn}
              sender={message.sender ?? undefined}
              attachments={message.attachments}
              isRead={message.readAt !== null}
              isDeleted={message.deletedAt !== null}
              createdAt={message.createdAt}
              showSender={message.isFirstInGroup && !isOwn}
              showTimestamp={message.isLastInGroup}
              canDelete={canDeleteMessage(message, currentUserId)}
              onDelete={() => onDeleteMessage?.(message.id)}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isBlocked ? (
        <div className="conversation-view__blocked-notice">
          {isBusinessView
            ? t('messaging.userBlockedNotice')
            : t('messaging.blockedNotice')}
        </div>
      ) : (
        <MessageInput
          onSend={onSendMessage}
          isSending={isSending}
          disabled={isSending}
          quickReplies={isBusinessView ? quickReplies : undefined}
          allowAttachments={true}
        />
      )}
    </div>
  );
};

export default ConversationView;
