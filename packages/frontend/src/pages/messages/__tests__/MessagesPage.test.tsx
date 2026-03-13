/**
 * MessagesPage Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { MessagesPage } from '../MessagesPage';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';

// Mock the hooks
const mockUseAuth = vi.fn();
const mockUseConversations = vi.fn();
const mockUseConversation = vi.fn();

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../hooks/useConversations', () => ({
  useConversations: () => mockUseConversations(),
}));

vi.mock('../../../hooks/useConversation', () => ({
  useConversation: () => mockUseConversation(),
}));

vi.mock('../../../services/messaging-service', () => ({
  messagingService: {
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    createConversation: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

const defaultAuthState = {
  isAuthenticated: true,
  user: { id: 'user-123', email: 'test@example.com', displayName: 'Test User' },
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
};

const defaultConversationsState = {
  conversations: [],
  isLoading: false,
  error: null,
  pagination: null,
  filterStatus: 'active' as const,
  searchQuery: '',
  setFilterStatus: vi.fn(),
  setSearchQuery: vi.fn(),
  setPage: vi.fn(),
  refresh: vi.fn(),
};

const defaultConversationState = {
  conversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  isLoadingMore: false,
  hasMore: false,
  error: null,
  sendMessage: vi.fn(),
  loadMore: vi.fn(),
  deleteMessage: vi.fn(),
  archive: vi.fn(),
  unarchive: vi.fn(),
  report: vi.fn(),
  refresh: vi.fn(),
};

const renderWithProviders = (ui: React.ReactElement, { route = '/messages' } = {}) => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <I18nextProvider i18n={i18n}>
          <Routes>
            <Route path="/messages" element={ui} />
            <Route path="/messages/:conversationId" element={ui} />
          </Routes>
        </I18nextProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthState);
    mockUseConversations.mockReturnValue(defaultConversationsState);
    mockUseConversation.mockReturnValue(defaultConversationState);
  });

  it('renders the page title', async () => {
    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  it('renders the new conversation button', async () => {
    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no conversation selected', async () => {
    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
    });
  });

  it('shows login prompt when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      ...defaultAuthState,
      isAuthenticated: false,
      user: null,
    });

    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
    });
  });

  it('displays error message when list error occurs', async () => {
    mockUseConversations.mockReturnValue({
      ...defaultConversationsState,
      error: 'Failed to load conversations',
    });

    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('MessagesPage Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthState);
    mockUseConversations.mockReturnValue(defaultConversationsState);
    mockUseConversation.mockReturnValue(defaultConversationState);
  });

  it('has proper heading hierarchy', async () => {
    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });
  });

  it('has accessible buttons with labels', async () => {
    renderWithProviders(<MessagesPage />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Each button should have accessible name
        expect(button).toHaveAccessibleName();
      });
    });
  });
});
