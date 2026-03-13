/**
 * ConversationList Component Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';
import { ConversationList, ConversationSummary } from '../ConversationList';

expect.extend(toHaveNoViolations);

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

const mockConversations: ConversationSummary[] = [
  {
    id: 'conv-1',
    subject: 'Product inquiry',
    subjectCategory: 'GENERAL',
    status: 'ACTIVE',
    lastMessageAt: new Date('2024-03-13T10:00:00Z'),
    lastMessagePreview: 'Hello, I have a question about...',
    unreadCount: 2,
    business: { id: 'biz-1', name: 'Test Business', logo: null },
    user: { id: 'user-1', displayName: 'John Doe', profilePhoto: null },
  },
  {
    id: 'conv-2',
    subject: 'Booking request',
    subjectCategory: 'BOOKING',
    status: 'ARCHIVED',
    lastMessageAt: new Date('2024-03-12T15:00:00Z'),
    lastMessagePreview: 'I would like to book...',
    unreadCount: 0,
    business: { id: 'biz-2', name: 'Another Business', logo: null },
    user: { id: 'user-2', displayName: 'Jane Smith', profilePhoto: null },
  },
];

const defaultProps = {
  conversations: mockConversations,
  viewMode: 'user' as const,
  onSelect: vi.fn(),
};

describe('ConversationList', () => {
  describe('Rendering', () => {
    it('renders all conversations', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      expect(screen.getByText('Product inquiry')).toBeInTheDocument();
      expect(screen.getByText('Booking request')).toBeInTheDocument();
    });

    it('renders business name in user view mode', () => {
      renderWithI18n(<ConversationList {...defaultProps} viewMode="user" />);

      expect(screen.getByText('Test Business')).toBeInTheDocument();
      expect(screen.getByText('Another Business')).toBeInTheDocument();
    });

    it('renders user name in business view mode', () => {
      renderWithI18n(<ConversationList {...defaultProps} viewMode="business" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('shows unread badge for unread conversations', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays message preview', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      expect(screen.getByText(/Hello, I have a question/)).toBeInTheDocument();
    });

    it('shows empty state when no conversations', () => {
      renderWithI18n(
        <ConversationList {...defaultProps} conversations={[]} />
      );

      expect(screen.getByText(/no conversations/i)).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('highlights selected conversation', () => {
      renderWithI18n(
        <ConversationList {...defaultProps} selectedId="conv-1" />
      );

      const selectedItem = screen.getByRole('option', { selected: true });
      expect(selectedItem).toBeInTheDocument();
    });

    it('calls onSelect when conversation is clicked', async () => {
      const onSelect = vi.fn();
      renderWithI18n(<ConversationList {...defaultProps} onSelect={onSelect} />);

      const firstConversation = screen.getByText('Product inquiry').closest('[role="option"]');
      await userEvent.click(firstConversation!);

      expect(onSelect).toHaveBeenCalledWith('conv-1');
    });

    it('supports keyboard navigation', async () => {
      const onSelect = vi.fn();
      renderWithI18n(<ConversationList {...defaultProps} onSelect={onSelect} />);

      const firstConversation = screen.getByText('Product inquiry').closest('[role="option"]');
      firstConversation!.focus();
      fireEvent.keyDown(firstConversation!, { key: 'Enter' });

      expect(onSelect).toHaveBeenCalledWith('conv-1');
    });

    it('supports space key for selection', async () => {
      const onSelect = vi.fn();
      renderWithI18n(<ConversationList {...defaultProps} onSelect={onSelect} />);

      const firstConversation = screen.getByText('Product inquiry').closest('[role="option"]');
      firstConversation!.focus();
      fireEvent.keyDown(firstConversation!, { key: ' ' });

      expect(onSelect).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('Filtering', () => {
    it('renders filter buttons', () => {
      const onFilterChange = vi.fn();
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          filterStatus="active"
          onFilterChange={onFilterChange}
        />
      );

      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /archived/i })).toBeInTheDocument();
    });

    it('calls onFilterChange when filter is clicked', async () => {
      const onFilterChange = vi.fn();
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          filterStatus="active"
          onFilterChange={onFilterChange}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /archived/i }));

      expect(onFilterChange).toHaveBeenCalledWith('archived');
    });

    it('highlights active filter', () => {
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          filterStatus="archived"
          onFilterChange={vi.fn()}
        />
      );

      const archivedButton = screen.getByRole('button', { name: /archived/i });
      expect(archivedButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Search', () => {
    it('renders search input', () => {
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          searchQuery=""
          onSearchChange={vi.fn()}
        />
      );

      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('calls onSearchChange when typing', async () => {
      const onSearchChange = vi.fn();
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          searchQuery=""
          onSearchChange={onSearchChange}
        />
      );

      const searchInput = screen.getByRole('searchbox');
      await userEvent.type(searchInput, 'test');

      expect(onSearchChange).toHaveBeenCalled();
    });

    it('displays current search query', () => {
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          searchQuery="product"
          onSearchChange={vi.fn()}
        />
      );

      expect(screen.getByRole('searchbox')).toHaveValue('product');
    });
  });

  describe('Pagination', () => {
    it('renders pagination when provided', () => {
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          pagination={{ page: 1, totalPages: 3, total: 60 }}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('calls onPageChange when page is changed', async () => {
      const onPageChange = vi.fn();
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          pagination={{ page: 1, totalPages: 3, total: 60 }}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('does not render pagination for single page', () => {
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          pagination={{ page: 1, totalPages: 1, total: 5 }}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeletons when loading', () => {
      renderWithI18n(
        <ConversationList {...defaultProps} isLoading={true} conversations={[]} />
      );

      // Should show skeleton elements
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('shows conversations after loading', () => {
      renderWithI18n(
        <ConversationList {...defaultProps} isLoading={false} />
      );

      expect(screen.getByText('Product inquiry')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithI18n(<ConversationList {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses listbox role', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('uses option role for conversation items', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    it('has accessible search input', () => {
      renderWithI18n(
        <ConversationList
          {...defaultProps}
          searchQuery=""
          onSearchChange={vi.fn()}
        />
      );

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAccessibleName();
    });

    it('conversation items are focusable', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      const options = screen.getAllByRole('option');
      options.forEach((option) => {
        expect(option).toHaveAttribute('tabindex', '0');
      });
    });
  });

  describe('Status Badges', () => {
    it('shows archived badge for archived conversations', () => {
      renderWithI18n(<ConversationList {...defaultProps} />);

      expect(screen.getByText(/archived/i)).toBeInTheDocument();
    });

    it('shows blocked badge for blocked conversations', () => {
      const conversationsWithBlocked = [
        {
          ...mockConversations[0],
          status: 'BLOCKED' as const,
        },
      ];

      renderWithI18n(
        <ConversationList {...defaultProps} conversations={conversationsWithBlocked} />
      );

      expect(screen.getByText(/blocked/i)).toBeInTheDocument();
    });
  });
});
