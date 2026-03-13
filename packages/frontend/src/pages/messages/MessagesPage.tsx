/**
 * MessagesPage
 * Phase 9: Messaging System
 * Main user inbox with conversation list and detail view
 * WCAG 2.1 AA compliant
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/display/EmptyState';
import { Skeleton } from '../../components/display/Skeleton';
import { Alert } from '../../components/display/Alert';
import { Modal } from '../../components/display/Modal';
import { ConversationList } from '../../components/messaging/ConversationList';
import { ConversationView } from '../../components/messaging/ConversationView';
import { NewConversationForm } from '../../components/messaging/NewConversationForm';
import { useConversations } from '../../hooks/useConversations';
import { useConversation } from '../../hooks/useConversation';
import { useAuth } from '../../hooks/useAuth';
import { messagingService } from '../../services/messaging-service';
import type { ConversationSummary as ServiceConversationSummary } from '../../services/messaging-service';
import type { ConversationSummary as ComponentConversationSummary } from '../../components/messaging/ConversationList';
import type { ConversationDetails, Message } from '../../components/messaging/ConversationView';
import './MessagesPage.css';

export function MessagesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  // Conversations list state
  const {
    conversations,
    isLoading: isLoadingList,
    error: listError,
    pagination,
    filterStatus,
    searchQuery,
    setFilterStatus,
    setSearchQuery,
    setPage,
    refresh: refreshList,
  } = useConversations();

  // Selected conversation state
  const {
    conversation,
    messages,
    isLoading: isLoadingConversation,
    isSending,
    isLoadingMore,
    hasMore,
    error: conversationError,
    sendMessage,
    loadMore,
    deleteMessage,
    archive,
    unarchive,
    report,
  } = useConversation(conversationId || null);

  // New conversation modal state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Mobile view state
  const [isMobileListView, setIsMobileListView] = useState(!conversationId);

  // Check for businessId param (for starting new conversation from business page)
  useEffect(() => {
    const businessId = searchParams.get('businessId');
    if (businessId && isAuthenticated) {
      setShowNewConversation(true);
    }
  }, [searchParams, isAuthenticated]);

  // Update mobile view state when conversation changes
  useEffect(() => {
    if (conversationId) {
      setIsMobileListView(false);
    }
  }, [conversationId]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    (id: string) => {
      navigate(`/messages/${id}`);
    },
    [navigate]
  );

  // Handle back to list (mobile)
  const handleBackToList = useCallback(() => {
    setIsMobileListView(true);
    navigate('/messages');
  }, [navigate]);

  // Handle new conversation creation
  const handleCreateConversation = async (data: {
    businessId: string;
    subject: string;
    subjectCategory: string;
    message: string;
    preferredContact?: string;
  }) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const newConversation = await messagingService.createConversation(data);
      setShowNewConversation(false);
      await refreshList();
      navigate(`/messages/${newConversation.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('messaging.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  // Handle archive/unarchive
  const handleArchive = async () => {
    try {
      if (conversation?.status === 'ARCHIVED') {
        await unarchive();
      } else {
        await archive();
      }
      await refreshList();
    } catch {
      // Error is handled in the hook
    }
  };

  // Handle report
  const handleReport = async () => {
    if (!reportReason.trim()) return;

    setIsReporting(true);
    try {
      await report(reportReason, reportDetails || undefined);
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch {
      // Error is handled in the hook
    } finally {
      setIsReporting(false);
    }
  };

  // Handle send message
  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Helmet>
          <title>{t('messaging.pageTitle')}</title>
        </Helmet>
        <EmptyState
          title={t('messaging.loginRequired')}
          description={t('messaging.loginRequiredDescription')}
          icon="🔒"
          action={
            <a href="/login" className="messages-page__login-link">
              {t('auth.login')}
            </a>
          }
        />
      </PageContainer>
    );
  }

  // Transform service conversations to component format
  const transformedConversations: ComponentConversationSummary[] = conversations.map(
    (conv: ServiceConversationSummary) => ({
      id: conv.id,
      subject: conv.subject,
      subjectCategory: conv.subjectCategory,
      status: conv.status,
      lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : null,
      lastMessagePreview: conv.lastMessagePreview,
      unreadCount: conv.unreadCount,
      business: conv.business,
      user: conv.user,
    })
  );

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

  return (
    <>
      <Helmet>
        <title>{t('messaging.pageTitle')}</title>
        <meta name="description" content={t('messaging.pageDescription')} />
      </Helmet>

      <PageContainer>
        <div className="messages-page">
          {/* Header */}
          <header className="messages-page__header">
            <h1 className="messages-page__title">{t('messaging.inbox')}</h1>
            <button
              type="button"
              className="messages-page__new-btn"
              onClick={() => setShowNewConversation(true)}
              aria-label={t('messaging.newConversation')}
            >
              <span className="messages-page__new-btn-icon" aria-hidden="true">
                +
              </span>
              <span className="messages-page__new-btn-text">
                {t('messaging.newConversation')}
              </span>
            </button>
          </header>

          {/* Error display */}
          {listError && <Alert type="critical" message={listError} />}

          {/* Main content */}
          <div className="messages-page__content">
            {/* Conversation list */}
            <aside
              className={`messages-page__sidebar ${isMobileListView ? 'messages-page__sidebar--visible' : ''}`}
              aria-label={t('messaging.conversationList')}
            >
              {isLoadingList && conversations.length === 0 ? (
                <div className="messages-page__loading">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} width="100%" height={72} />
                  ))}
                </div>
              ) : (
                <ConversationList
                  conversations={transformedConversations}
                  selectedId={conversationId}
                  viewMode="user"
                  onSelect={handleSelectConversation}
                  onSearchChange={setSearchQuery}
                  searchQuery={searchQuery}
                  filterStatus={filterStatus as 'active' | 'archived' | 'blocked' | 'all'}
                  onFilterChange={(status) => {
                    if (status !== 'blocked') {
                      setFilterStatus(status);
                    }
                  }}
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
              className={`messages-page__main ${!isMobileListView ? 'messages-page__main--visible' : ''}`}
              aria-label={t('messaging.conversationDetail')}
            >
              {conversationId ? (
                isLoadingConversation && !conversation ? (
                  <div className="messages-page__loading-conversation">
                    <Skeleton width="100%" height={60} />
                    <div className="messages-page__loading-messages">
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
                    isBusinessView={false}
                    onSendMessage={handleSendMessage}
                    onDeleteMessage={deleteMessage}
                    onArchive={handleArchive}
                    onReport={() => setShowReportModal(true)}
                    onBack={handleBackToList}
                    isLoadingMore={isLoadingMore}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    isSending={isSending}
                    quickReplies={[]}
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

        {/* New Conversation Modal */}
        <Modal
          isOpen={showNewConversation}
          onClose={() => {
            setShowNewConversation(false);
            setCreateError(null);
          }}
          title={t('messaging.newConversation')}
          size="lg"
        >
          <NewConversationForm
            onSubmit={handleCreateConversation}
            onCancel={() => {
              setShowNewConversation(false);
              setCreateError(null);
            }}
            isSubmitting={isCreating}
            error={createError || undefined}
            defaultBusinessId={searchParams.get('businessId') || undefined}
          />
        </Modal>

        {/* Report Modal */}
        <Modal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportReason('');
            setReportDetails('');
          }}
          title={t('messaging.reportConversation')}
        >
          <div className="messages-page__report-form">
            <div className="messages-page__report-field">
              <label htmlFor="report-reason" className="messages-page__report-label">
                {t('messaging.reportReason')} *
              </label>
              <select
                id="report-reason"
                className="messages-page__report-select"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
              >
                <option value="">{t('messaging.selectReason')}</option>
                <option value="SPAM">{t('messaging.reasonSpam')}</option>
                <option value="HARASSMENT">{t('messaging.reasonHarassment')}</option>
                <option value="INAPPROPRIATE">{t('messaging.reasonInappropriate')}</option>
                <option value="SCAM">{t('messaging.reasonScam')}</option>
                <option value="OTHER">{t('messaging.reasonOther')}</option>
              </select>
            </div>

            <div className="messages-page__report-field">
              <label htmlFor="report-details" className="messages-page__report-label">
                {t('messaging.reportDetails')}
              </label>
              <textarea
                id="report-details"
                className="messages-page__report-textarea"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                placeholder={t('messaging.reportDetailsPlaceholder')}
              />
            </div>

            <div className="messages-page__report-actions">
              <button
                type="button"
                className="messages-page__btn messages-page__btn--secondary"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDetails('');
                }}
                disabled={isReporting}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="messages-page__btn messages-page__btn--danger"
                onClick={handleReport}
                disabled={isReporting || !reportReason}
              >
                {isReporting ? t('common.submitting') : t('messaging.submitReport')}
              </button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </>
  );
}
