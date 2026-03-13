/**
 * ConversationView Component Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';
import { ConversationView, ConversationDetails, Message } from '../ConversationView';

expect.extend(toHaveNoViolations);

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

const mockConversation: ConversationDetails = {
  id: 'conv-1',
  subject: 'Product inquiry',
  subjectCategory: 'GENERAL',
  status: 'ACTIVE',
  business: {
    id: 'biz-1',
    name: 'Test Business',
    slug: 'test-business',
    logo: null,
  },
  user: {
    id: 'user-1',
    displayName: 'John Doe',
    profilePhoto: null,
  },
  createdAt: new Date('2024-03-13T10:00:00Z'),
};

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Hello, I have a question about your products.',
    senderType: 'USER',
    senderId: 'user-1',
    sender: { id: 'user-1', displayName: 'John Doe', profilePhoto: null },
    attachments: [],
    readAt: new Date(),
    deletedAt: null,
    createdAt: new Date('2024-03-13T10:00:00Z'),
  },
  {
    id: 'msg-2',
    content: 'Sure, how can I help you?',
    senderType: 'BUSINESS',
    senderId: 'biz-1',
    sender: { id: 'biz-1', displayName: 'Test Business', profilePhoto: null },
    attachments: [],
    readAt: null,
    deletedAt: null,
    createdAt: new Date('2024-03-13T10:01:00Z'),
  },
];

const defaultProps = {
  conversation: mockConversation,
  messages: mockMessages,
  currentUserId: 'user-1',
  isBusinessView: false,
  onSendMessage: vi.fn(),
};

describe('ConversationView', () => {
  describe('Rendering', () => {
    it('renders conversation header with business name', () => {
      renderWithI18n(<ConversationView {...defaultProps} />);

      expect(screen.getByText('Test Business')).toBeInTheDocument();
      expect(screen.getByText('Product inquiry')).toBeInTheDocument();
    });

    it('renders user name in business view mode', () => {
      renderWithI18n(
        <ConversationView {...defaultProps} isBusinessView={true} />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders all messages', () => {
      renderWithI18n(<ConversationView {...defaultProps} />);

      expect(screen.getByText(/Hello, I have a question/)).toBeInTheDocument();
      expect(screen.getByText(/Sure, how can I help you/)).toBeInTheDocument();
    });

    it('shows loading state', () => {
      renderWithI18n(
        <ConversationView {...defaultProps} isLoading={true} />
      );

      // Should show skeleton loaders
      expect(screen.queryByText('Test Business')).not.toBeInTheDocument();
    });

    it('shows empty state when no conversation selected', () => {
      renderWithI18n(
        <ConversationView {...defaultProps} conversation={null} />
      );

      expect(screen.getByText(/select.*conversation/i)).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('shows blocked badge for blocked conversation', () => {
      const blockedConversation = { ...mockConversation, status: 'BLOCKED' as const };
      renderWithI18n(
        <ConversationView {...defaultProps} conversation={blockedConversation} />
      );

      expect(screen.getByText(/blocked/i)).toBeInTheDocument();
    });

    it('shows archived badge for archived conversation', () => {
      const archivedConversation = { ...mockConversation, status: 'ARCHIVED' as const };
      renderWithI18n(
        <ConversationView {...defaultProps} conversation={archivedConversation} />
      );

      expect(screen.getByText(/archived/i)).toBeInTheDocument();
    });

    it('shows blocked notice and hides input for blocked conversation', () => {
      const blockedConversation = { ...mockConversation, status: 'BLOCKED' as const };
      renderWithI18n(
        <ConversationView {...defaultProps} conversation={blockedConversation} />
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onBack when back button is clicked', () => {
      const onBack = vi.fn();
      renderWithI18n(
        <ConversationView {...defaultProps} onBack={onBack} />
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });

    it('calls onArchive when archive button is clicked', () => {
      const onArchive = vi.fn();
      renderWithI18n(
        <ConversationView {...defaultProps} onArchive={onArchive} />
      );

      const archiveButton = screen.getByRole('button', { name: /archive/i });
      fireEvent.click(archiveButton);

      expect(onArchive).toHaveBeenCalled();
    });

    it('shows unarchive button for archived conversation', () => {
      const archivedConversation = { ...mockConversation, status: 'ARCHIVED' as const };
      const onArchive = vi.fn();
      renderWithI18n(
        <ConversationView
          {...defaultProps}
          conversation={archivedConversation}
          onArchive={onArchive}
        />
      );

      expect(screen.getByRole('button', { name: /unarchive/i })).toBeInTheDocument();
    });

    it('shows block button in business view', () => {
      const onBlock = vi.fn();
      renderWithI18n(
        <ConversationView
          {...defaultProps}
          isBusinessView={true}
          onBlock={onBlock}
        />
      );

      const blockButton = screen.getByRole('button', { name: /block/i });
      expect(blockButton).toBeInTheDocument();
      fireEvent.click(blockButton);
      expect(onBlock).toHaveBeenCalled();
    });

    it('shows report button in user view', () => {
      const onReport = vi.fn();
      renderWithI18n(
        <ConversationView {...defaultProps} onReport={onReport} />
      );

      const reportButton = screen.getByRole('button', { name: /report/i });
      expect(reportButton).toBeInTheDocument();
      fireEvent.click(reportButton);
      expect(onReport).toHaveBeenCalled();
    });
  });

  describe('Message Input', () => {
    it('renders message input for active conversation', () => {
      renderWithI18n(<ConversationView {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows quick replies in business view', () => {
      const quickReplies = [
        { id: 'qr-1', name: 'Greeting', content: 'Hello, thank you for contacting us!' },
      ];
      renderWithI18n(
        <ConversationView
          {...defaultProps}
          isBusinessView={true}
          quickReplies={quickReplies}
        />
      );

      // Quick replies button should be present
      const quickReplyButton = screen.getByRole('button', { name: /quick/i });
      expect(quickReplyButton).toBeInTheDocument();
    });
  });

  describe('Load More', () => {
    it('shows loading indicator when loading more messages', () => {
      renderWithI18n(
        <ConversationView {...defaultProps} isLoadingMore={true} hasMore={true} />
      );

      // Should show skeleton loader at top
      const region = screen.getByRole('log');
      expect(region).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithI18n(<ConversationView {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses region role for main container', () => {
      renderWithI18n(<ConversationView {...defaultProps} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('uses log role for messages container', () => {
      renderWithI18n(<ConversationView {...defaultProps} />);

      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    it('has aria-live on messages container', () => {
      renderWithI18n(<ConversationView {...defaultProps} />);

      const log = screen.getByRole('log');
      expect(log).toHaveAttribute('aria-live', 'polite');
    });
  });
});
