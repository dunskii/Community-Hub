/**
 * ConversationList Component
 * Phase 9: Messaging System
 * Displays a list of conversations with filtering and search
 * WCAG 2.1 AA compliant
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../display/Avatar';
import { Badge } from '../display/Badge';
import { Skeleton } from '../display/Skeleton';
import { EmptyState } from '../display/EmptyState';
import { Pagination } from '../display/Pagination';
import './ConversationList.css';

export interface ConversationSummary {
  id: string;
  subject: string;
  subjectCategory: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  business?: {
    id: string;
    name: string;
    logo: string | null;
  };
  user?: {
    id: string;
    displayName: string;
    profilePhoto: string | null;
  };
}

export interface ConversationListProps {
  /** List of conversations */
  conversations: ConversationSummary[];
  /** Currently selected conversation ID */
  selectedId?: string;
  /** Whether list is loading */
  isLoading?: boolean;
  /** View mode: user inbox or business inbox */
  viewMode: 'user' | 'business';
  /** Current filter status */
  filterStatus?: 'active' | 'archived' | 'blocked' | 'all';
  /** Search query */
  searchQuery?: string;
  /** Pagination info */
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
  };
  /** Callback when conversation is selected */
  onSelect: (conversationId: string) => void;
  /** Callback when filter changes */
  onFilterChange?: (status: 'active' | 'archived' | 'blocked' | 'all') => void;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return new Intl.DateTimeFormat('default', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const ConversationItem: React.FC<{
  conversation: ConversationSummary;
  isSelected: boolean;
  viewMode: 'user' | 'business';
  onSelect: () => void;
}> = ({ conversation, isSelected, viewMode, onSelect }) => {
  const { t } = useTranslation();

  const displayName =
    viewMode === 'user'
      ? (conversation.business?.name ?? t('messaging.unknown'))
      : (conversation.user?.displayName ?? t('messaging.unknown'));
  const displayPhoto =
    viewMode === 'user'
      ? conversation.business?.logo
      : conversation.user?.profilePhoto;

  const itemClasses = [
    'conversation-item',
    isSelected ? 'conversation-item--selected' : '',
    conversation.unreadCount > 0 ? 'conversation-item--unread' : '',
    conversation.status === 'ARCHIVED' ? 'conversation-item--archived' : '',
    conversation.status === 'BLOCKED' ? 'conversation-item--blocked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={itemClasses}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="conversation-item__avatar">
        <Avatar
          name={displayName}
          src={displayPhoto ?? undefined}
          alt={displayName}
          size="md"
        />
        {conversation.unreadCount > 0 && (
          <span className="conversation-item__unread-badge" aria-hidden="true">
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        )}
      </div>

      <div className="conversation-item__content">
        <div className="conversation-item__header">
          <span className="conversation-item__name">{displayName}</span>
          {conversation.lastMessageAt && (
            <time
              className="conversation-item__time"
              dateTime={conversation.lastMessageAt.toISOString()}
            >
              {formatRelativeTime(conversation.lastMessageAt)}
            </time>
          )}
        </div>

        <div className="conversation-item__subject">{conversation.subject}</div>

        <div className="conversation-item__preview">
          {conversation.lastMessagePreview ?? t('messaging.noMessages')}
        </div>

        <div className="conversation-item__meta">
          {conversation.status !== 'ACTIVE' && (
            <Badge
              variant={conversation.status === 'BLOCKED' ? 'error' : 'default'}
              size="sm"
            >
              {t(`messaging.status.${conversation.status.toLowerCase()}`)}
            </Badge>
          )}
        </div>
      </div>

      {/* Screen reader announcement for unread */}
      {conversation.unreadCount > 0 && (
        <span className="sr-only">
          {t('messaging.unreadMessages', { count: conversation.unreadCount })}
        </span>
      )}
    </div>
  );
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  isLoading = false,
  viewMode,
  filterStatus = 'active',
  searchQuery = '',
  pagination,
  onSelect,
  onFilterChange,
  onSearchChange,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  const searchTimeoutRef = React.useRef<number | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      onSearchChange?.(value);
    }, 300);
  };

  const filterOptions =
    viewMode === 'business'
      ? ['active', 'archived', 'blocked', 'all']
      : ['active', 'archived', 'all'];

  return (
    <div className="conversation-list" role="region" aria-label={t('messaging.conversations')}>
      {/* Search and filters */}
      <div className="conversation-list__toolbar">
        <div className="conversation-list__search">
          <input
            type="search"
            className="conversation-list__search-input"
            placeholder={t('messaging.searchConversations')}
            value={localSearch}
            onChange={handleSearchChange}
            aria-label={t('messaging.searchConversations')}
          />
        </div>

        {onFilterChange && (
          <div className="conversation-list__filters" role="tablist">
            {filterOptions.map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={filterStatus === status}
                className={`conversation-list__filter ${
                  filterStatus === status ? 'conversation-list__filter--active' : ''
                }`}
                onClick={() => onFilterChange(status as typeof filterStatus)}
              >
                {t(`messaging.filter.${status}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div
        className="conversation-list__items"
        role="listbox"
        aria-label={t('messaging.conversationList')}
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="conversation-item conversation-item--loading">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="conversation-item__content">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="80%" height={14} />
                <Skeleton variant="text" width="100%" height={14} />
              </div>
            </div>
          ))
        ) : conversations.length === 0 ? (
          <EmptyState
            title={t('messaging.noConversations')}
            description={
              searchQuery
                ? t('messaging.noSearchResults')
                : t('messaging.startConversation')
            }
            icon="💬"
          />
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              viewMode={viewMode}
              onSelect={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="conversation-list__pagination">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange ?? (() => {})}
          />
        </div>
      )}
    </div>
  );
};

export default ConversationList;
