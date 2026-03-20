/**
 * BusinessInboxPage
 * Phase 9: Messaging System
 * Business owner's inbox for managing customer conversations
 * WCAG 2.1 AA compliant
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/display/EmptyState';
import { Skeleton } from '../../components/display/Skeleton';
import { Alert } from '../../components/display/Alert';
import { Modal } from '../../components/display/Modal';
import { ConversationList } from '../../components/messaging/ConversationList';
import { ConversationView } from '../../components/messaging/ConversationView';
import { useAuth } from '../../hooks/useAuth';
import { messagingService } from '../../services/messaging-service';
import type {
  ConversationSummary as ServiceConversationSummary,
  ConversationDetail,
  Message as ServiceMessage,
  QuickReplyTemplate as ServiceQuickReplyTemplate,
  PaginatedConversations,
  PaginatedMessages,
} from '../../services/messaging-service';
import type { ConversationSummary as ComponentConversationSummary } from '../../components/messaging/ConversationList';
import type {
  ConversationDetails,
  Message,
  QuickReplyTemplate,
} from '../../components/messaging/ConversationView';
import './BusinessInboxPage.css';

export function BusinessInboxPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { businessId, conversationId } = useParams<{
    businessId: string;
    conversationId?: string;
  }>();
  const { isAuthenticated, user } = useAuth();

  // Conversations list state
  const [conversations, setConversations] = useState<ServiceConversationSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'active' | 'archived' | 'blocked' | 'all'>(
    'active'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Selected conversation state
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);

  // Quick replies
  const [quickReplies, setQuickReplies] = useState<ServiceQuickReplyTemplate[]>([]);
  const [showQuickReplyModal, setShowQuickReplyModal] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState<ServiceQuickReplyTemplate | null>(
    null
  );
  const [newQuickReplyName, setNewQuickReplyName] = useState('');
  const [newQuickReplyContent, setNewQuickReplyContent] = useState('');
  const [isSavingQuickReply, setIsSavingQuickReply] = useState(false);

  // Mobile view state
  const [isMobileListView, setIsMobileListView] = useState(!conversationId);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!businessId) return;

    setIsLoadingList(true);
    setListError(null);

    try {
      const result: PaginatedConversations = await messagingService.getBusinessInbox(businessId, {
        status: filterStatus,
        unreadOnly,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });

      setConversations(result.conversations);
      setPagination(result.pagination);
    } catch (err) {
      setListError(err instanceof Error ? err.message : t('messaging.errors.loadFailed'));
    } finally {
      setIsLoadingList(false);
    }
  }, [businessId, filterStatus, unreadOnly, searchQuery, page, t]);

  // Fetch conversation detail
  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }

    setIsLoadingConversation(true);
    setConversationError(null);

    try {
      const result = await messagingService.getConversation(conversationId);
      setConversation(result);

      const messagesResult: PaginatedMessages = await messagingService.getMessages(
        conversationId,
        { page: 1, limit: 50 }
      );
      setMessages(messagesResult.messages);
      setHasMoreMessages(messagesResult.pagination.hasMore);
      setMessagesPage(1);

      // Mark as read
      await messagingService.markAsRead(conversationId);
    } catch (err) {
      setConversationError(err instanceof Error ? err.message : t('messaging.errors.loadFailed'));
    } finally {
      setIsLoadingConversation(false);
    }
  }, [conversationId, t]);

  // Fetch quick replies
  const fetchQuickReplies = useCallback(async () => {
    if (!businessId) return;

    try {
      const result = await messagingService.getQuickReplies(businessId);
      setQuickReplies(result);
    } catch {
      // Silently fail - not critical
    }
  }, [businessId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    fetchQuickReplies();
  }, [fetchQuickReplies]);

  useEffect(() => {
    if (conversationId) {
      setIsMobileListView(false);
    }
  }, [conversationId]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery, unreadOnly]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (id: string) => {
      navigate(`/business/manage/${businessId}/inbox/${id}`);
    },
    [navigate, businessId]
  );

  // Handle back to list (mobile)
  const handleBackToList = useCallback(() => {
    setIsMobileListView(true);
    navigate(`/business/manage/${businessId}/inbox`);
  }, [navigate, businessId]);

  // Handle send message
  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;

    setIsSending(true);
    try {
      const newMessage = await messagingService.sendMessage(conversationId, { content });
      setMessages((prev) => [...prev, newMessage]);
      await fetchConversations(); // Refresh list to update last message
    } catch (err) {
      setConversationError(err instanceof Error ? err.message : t('messaging.errors.sendFailed'));
    } finally {
      setIsSending(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messagingService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, deletedAt: new Date().toISOString() } : msg
        )
      );
    } catch (err) {
      setConversationError(
        err instanceof Error ? err.message : t('messaging.errors.deleteFailed')
      );
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!conversationId) return;

    try {
      if (conversation?.status === 'ARCHIVED') {
        await messagingService.unarchiveConversation(conversationId);
        setConversation((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null));
      } else {
        await messagingService.archiveConversation(conversationId);
        setConversation((prev) => (prev ? { ...prev, status: 'ARCHIVED' } : null));
      }
      await fetchConversations();
    } catch (err) {
      setConversationError(
        err instanceof Error ? err.message : t('messaging.errors.archiveFailed')
      );
    }
  };

  // Handle block
  const handleBlock = async () => {
    if (!conversationId || !businessId) return;

    try {
      if (conversation?.status === 'BLOCKED') {
        await messagingService.unblockConversation(businessId, conversationId);
        setConversation((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null));
      } else {
        await messagingService.blockConversation(businessId, conversationId);
        setConversation((prev) => (prev ? { ...prev, status: 'BLOCKED' } : null));
      }
      await fetchConversations();
    } catch {
      // Error handled silently
    }
  };

  // Handle load more messages
  const handleLoadMore = async () => {
    if (!conversationId || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      const nextPage = messagesPage + 1;
      const result = await messagingService.getMessages(conversationId, {
        page: nextPage,
        limit: 50,
      });

      setMessages((prev) => [...result.messages, ...prev]);
      setHasMoreMessages(result.pagination.hasMore);
      setMessagesPage(nextPage);
    } catch {
      // Error handled silently
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle save quick reply
  const handleSaveQuickReply = async () => {
    if (!businessId || !newQuickReplyName.trim() || !newQuickReplyContent.trim()) return;

    setIsSavingQuickReply(true);
    try {
      if (editingQuickReply) {
        await messagingService.updateQuickReply(businessId, editingQuickReply.id, {
          name: newQuickReplyName.trim(),
          content: newQuickReplyContent.trim(),
        });
      } else {
        await messagingService.createQuickReply(businessId, {
          name: newQuickReplyName.trim(),
          content: newQuickReplyContent.trim(),
        });
      }
      setShowQuickReplyModal(false);
      setEditingQuickReply(null);
      setNewQuickReplyName('');
      setNewQuickReplyContent('');
      await fetchQuickReplies();
    } catch {
      // Error handled silently
    } finally {
      setIsSavingQuickReply(false);
    }
  };

  // Handle delete quick reply
  const handleDeleteQuickReply = async (templateId: string) => {
    if (!businessId) return;

    try {
      await messagingService.deleteQuickReply(businessId, templateId);
      await fetchQuickReplies();
    } catch {
      // Error handled silently
    }
  };

  // If not authenticated, redirect
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Helmet>
          <title>{t('messaging.businessInbox.pageTitle')}</title>
        </Helmet>
        <EmptyState
          title={t('messaging.loginRequired')}
          description={t('messaging.loginRequiredDescription')}
          icon="🔒"
          action={
            <a href="/login" className="business-inbox__login-link">
              {t('auth.login')}
            </a>
          }
        />
      </PageContainer>
    );
  }

  // Transform conversations for component
  const transformedConversations: ComponentConversationSummary[] = conversations.map((conv) => ({
    id: conv.id,
    subject: conv.subject,
    subjectCategory: conv.subjectCategory,
    status: conv.status,
    lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : null,
    lastMessagePreview: conv.lastMessagePreview,
    unreadCount: conv.unreadCount,
    business: conv.business,
    user: conv.user,
  }));

  // Transform conversation detail
  const transformedConversation: ConversationDetails | null = conversation
    ? {
        id: conversation.id,
        subject: conversation.subject,
        subjectCategory: conversation.subjectCategory,
        status: conversation.status,
        business: conversation.business,
        user: conversation.user,
        createdAt: new Date(conversation.createdAt),
      }
    : null;

  // Transform messages
  const transformedMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    senderType: msg.senderType,
    senderId: msg.senderId,
    sender: msg.sender,
    attachments: msg.attachments.map((att) => ({
      id: att.id,
      url: att.url,
      altText: att.altText || 'attachment',
      sizeBytes: att.sizeBytes,
      mimeType: att.mimeType,
    })),
    readAt: msg.readAt ? new Date(msg.readAt) : null,
    deletedAt: msg.deletedAt ? new Date(msg.deletedAt) : null,
    createdAt: new Date(msg.createdAt),
  }));

  // Transform quick replies
  const transformedQuickReplies: QuickReplyTemplate[] = quickReplies.map((qr) => ({
    id: qr.id,
    name: qr.name,
    content: qr.content,
  }));

  return (
    <>
      <Helmet>
        <title>{t('messaging.businessInbox.pageTitle')}</title>
        <meta name="description" content={t('messaging.businessInbox.pageDescription')} />
      </Helmet>

      <PageContainer>
        <div className="business-inbox">
          {/* Header */}
          <header className="business-inbox__header">
            <h1 className="business-inbox__title">{t('messaging.businessInbox.pageTitle')}</h1>
            <div className="business-inbox__actions">
              <button
                type="button"
                className="business-inbox__quick-replies-btn"
                onClick={() => setShowQuickReplyModal(true)}
              >
                {t('messaging.businessInbox.manageQuickReplies')}
              </button>
              <label className="business-inbox__unread-filter">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                />
                {t('messaging.businessInbox.filterUnread')}
              </label>
            </div>
          </header>

          {/* Error display */}
          {listError && <Alert type="critical" message={listError} />}

          {/* Main content */}
          <div className="business-inbox__content">
            {/* Conversation list */}
            <aside
              className={`business-inbox__sidebar ${isMobileListView ? 'business-inbox__sidebar--visible' : ''}`}
              aria-label={t('messaging.conversationList')}
            >
              {isLoadingList && conversations.length === 0 ? (
                <div className="business-inbox__loading">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} width="100%" height={72} />
                  ))}
                </div>
              ) : (
                <ConversationList
                  conversations={transformedConversations}
                  selectedId={conversationId}
                  viewMode="business"
                  onSelect={handleSelectConversation}
                  onSearchChange={setSearchQuery}
                  searchQuery={searchQuery}
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                  isLoading={isLoadingList}
                  pagination={
                    pagination
                      ? {
                          page: pagination.page,
                          totalPages: pagination.totalPages,
                          total: pagination.total,
                        }
                      : undefined
                  }
                  onPageChange={setPage}
                />
              )}
            </aside>

            {/* Conversation detail */}
            <main
              className={`business-inbox__main ${!isMobileListView ? 'business-inbox__main--visible' : ''}`}
              aria-label={t('messaging.conversationDetail')}
            >
              {conversationId ? (
                isLoadingConversation && !conversation ? (
                  <div className="business-inbox__loading-conversation">
                    <Skeleton width="100%" height={60} />
                    <div className="business-inbox__loading-messages">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton
                          key={i}
                          width={i % 2 === 0 ? '60%' : '40%'}
                          height={60}
                        />
                      ))}
                    </div>
                    <Skeleton width="100%" height={80} />
                  </div>
                ) : conversationError ? (
                  <Alert type="critical" message={conversationError} />
                ) : transformedConversation ? (
                  <ConversationView
                    conversation={transformedConversation}
                    messages={transformedMessages}
                    currentUserId={user?.id || ''}
                    isBusinessView={true}
                    onSendMessage={handleSendMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onArchive={handleArchive}
                    onBlock={handleBlock}
                    onBack={handleBackToList}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMoreMessages}
                    onLoadMore={handleLoadMore}
                    isSending={isSending}
                    quickReplies={transformedQuickReplies}
                  />
                ) : null
              ) : (
                <EmptyState
                  title={t('messaging.selectConversation')}
                  description={t('messaging.selectConversationDescription')}
                  icon="💬"
                />
              )}
            </main>
          </div>
        </div>

        {/* Quick Replies Modal */}
        <Modal
          isOpen={showQuickReplyModal}
          onClose={() => {
            setShowQuickReplyModal(false);
            setEditingQuickReply(null);
            setNewQuickReplyName('');
            setNewQuickReplyContent('');
          }}
          title={t('messaging.businessInbox.manageQuickReplies')}
          size="lg"
        >
          <div className="business-inbox__quick-replies">
            {/* Existing quick replies */}
            {quickReplies.length > 0 && (
              <ul className="business-inbox__quick-reply-list">
                {quickReplies.map((qr) => (
                  <li key={qr.id} className="business-inbox__quick-reply-item">
                    <div className="business-inbox__quick-reply-info">
                      <strong>{qr.name}</strong>
                      <p>{qr.content}</p>
                    </div>
                    <div className="business-inbox__quick-reply-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuickReply(qr);
                          setNewQuickReplyName(qr.name);
                          setNewQuickReplyContent(qr.content);
                        }}
                        aria-label={t('common.edit')}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuickReply(qr.id)}
                        aria-label={t('common.delete')}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {quickReplies.length === 0 && !editingQuickReply && (
              <p className="business-inbox__no-quick-replies">
                {t('messaging.businessInbox.noQuickReplies')}
              </p>
            )}

            {/* Add/Edit form */}
            <div className="business-inbox__quick-reply-form">
              <h3>
                {editingQuickReply
                  ? t('messaging.businessInbox.editQuickReply')
                  : t('messaging.businessInbox.addQuickReply')}
              </h3>
              <div className="business-inbox__form-field">
                <label htmlFor="qr-name">{t('messaging.businessInbox.quickReplyName')}</label>
                <input
                  id="qr-name"
                  type="text"
                  value={newQuickReplyName}
                  onChange={(e) => setNewQuickReplyName(e.target.value)}
                  placeholder={t('messaging.businessInbox.quickReplyName')}
                />
              </div>
              <div className="business-inbox__form-field">
                <label htmlFor="qr-content">
                  {t('messaging.businessInbox.quickReplyContent')}
                </label>
                <textarea
                  id="qr-content"
                  value={newQuickReplyContent}
                  onChange={(e) => setNewQuickReplyContent(e.target.value)}
                  placeholder={t('messaging.businessInbox.quickReplyContent')}
                  rows={4}
                />
              </div>
              <div className="business-inbox__form-actions">
                {editingQuickReply && (
                  <button
                    type="button"
                    className="business-inbox__btn business-inbox__btn--secondary"
                    onClick={() => {
                      setEditingQuickReply(null);
                      setNewQuickReplyName('');
                      setNewQuickReplyContent('');
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                )}
                <button
                  type="button"
                  className="business-inbox__btn business-inbox__btn--primary"
                  onClick={handleSaveQuickReply}
                  disabled={
                    isSavingQuickReply ||
                    !newQuickReplyName.trim() ||
                    !newQuickReplyContent.trim()
                  }
                >
                  {isSavingQuickReply ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </>
  );
}
