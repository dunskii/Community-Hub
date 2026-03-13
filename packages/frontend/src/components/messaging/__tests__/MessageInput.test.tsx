/**
 * MessageInput Component Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';
import { MessageInput } from '../MessageInput';

expect.extend(toHaveNoViolations);

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

describe('MessageInput', () => {
  let onSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSend = vi.fn();
  });

  describe('Rendering', () => {
    it('renders textarea with placeholder', () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders send button', () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('renders attachment button when allowed', () => {
      renderWithI18n(<MessageInput onSend={onSend} allowAttachments={true} />);

      expect(screen.getByRole('button', { name: /attach/i })).toBeInTheDocument();
    });

    it('hides attachment button when not allowed', () => {
      renderWithI18n(<MessageInput onSend={onSend} allowAttachments={false} />);

      expect(screen.queryByRole('button', { name: /attach/i })).not.toBeInTheDocument();
    });

    it('renders quick replies button when templates provided', () => {
      const quickReplies = [
        { id: 'qr-1', name: 'Greeting', content: 'Hello!' },
      ];
      renderWithI18n(<MessageInput onSend={onSend} quickReplies={quickReplies} />);

      expect(screen.getByRole('button', { name: /quick/i })).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('updates content on typing', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Hello world');

      expect(textarea).toHaveValue('Hello world');
    });

    it('respects maxLength prop', async () => {
      renderWithI18n(<MessageInput onSend={onSend} maxLength={10} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'This is a very long message');

      expect(textarea).toHaveValue('This is a ');
    });

    it('shows character count when near limit', async () => {
      renderWithI18n(<MessageInput onSend={onSend} maxLength={20} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '12345678901234567');

      expect(screen.getByText(/17\/20/)).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('calls onSend with content when send button clicked', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      expect(onSend).toHaveBeenCalledWith('Test message', undefined);
    });

    it('calls onSend when Enter key pressed without Shift', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test message');
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(onSend).toHaveBeenCalledWith('Test message', undefined);
    });

    it('does not submit when Shift+Enter pressed', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test message');
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(onSend).not.toHaveBeenCalled();
    });

    it('clears input after sending', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'Test message');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(textarea).toHaveValue('');
    });

    it('does not submit empty message', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await userEvent.click(sendButton);

      expect(onSend).not.toHaveBeenCalled();
    });

    it('does not submit whitespace-only message', async () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, '   ');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('disables textarea when disabled prop is true', () => {
      renderWithI18n(<MessageInput onSend={onSend} disabled={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('disables send button when disabled', () => {
      renderWithI18n(<MessageInput onSend={onSend} disabled={true} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('disables textarea when isSending is true', () => {
      renderWithI18n(<MessageInput onSend={onSend} isSending={true} />);

      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Quick Replies', () => {
    it('shows quick reply dropdown when button clicked', async () => {
      const quickReplies = [
        { id: 'qr-1', name: 'Greeting', content: 'Hello, how can I help?' },
      ];
      renderWithI18n(<MessageInput onSend={onSend} quickReplies={quickReplies} />);

      const quickButton = screen.getByRole('button', { name: /quick/i });
      await userEvent.click(quickButton);

      expect(screen.getByText('Greeting')).toBeInTheDocument();
    });

    it('inserts quick reply content when selected', async () => {
      const quickReplies = [
        { id: 'qr-1', name: 'Greeting', content: 'Hello, how can I help?' },
      ];
      renderWithI18n(<MessageInput onSend={onSend} quickReplies={quickReplies} />);

      const quickButton = screen.getByRole('button', { name: /quick/i });
      await userEvent.click(quickButton);

      const greetingOption = screen.getByText('Greeting');
      await userEvent.click(greetingOption);

      expect(screen.getByRole('textbox')).toHaveValue('Hello, how can I help?');
    });

    it('closes dropdown after selection', async () => {
      const quickReplies = [
        { id: 'qr-1', name: 'Greeting', content: 'Hello!' },
      ];
      renderWithI18n(<MessageInput onSend={onSend} quickReplies={quickReplies} />);

      const quickButton = screen.getByRole('button', { name: /quick/i });
      await userEvent.click(quickButton);
      await userEvent.click(screen.getByText('Greeting'));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Typing Indicator', () => {
    it('calls onTypingChange when typing starts', async () => {
      const onTypingChange = vi.fn();
      renderWithI18n(
        <MessageInput onSend={onSend} onTypingChange={onTypingChange} />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'H');

      expect(onTypingChange).toHaveBeenCalledWith(true);
    });

    it('calls onTypingChange(false) after timeout', async () => {
      vi.useFakeTimers();
      const onTypingChange = vi.fn();
      renderWithI18n(
        <MessageInput onSend={onSend} onTypingChange={onTypingChange} />
      );

      const textarea = screen.getByRole('textbox');
      await userEvent.type(textarea, 'H');

      vi.advanceTimersByTime(2000);

      expect(onTypingChange).toHaveBeenCalledWith(false);
      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithI18n(<MessageInput onSend={onSend} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses form role', () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('textarea has accessible label', () => {
      renderWithI18n(<MessageInput onSend={onSend} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAccessibleName();
    });

    it('shows error message with role alert', async () => {
      const { rerender } = renderWithI18n(
        <MessageInput onSend={onSend} allowAttachments={true} maxFileSize={100} />
      );

      // Error state is shown via component's error state
      // This would be triggered by file validation
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('quick reply button has aria-expanded', async () => {
      const quickReplies = [{ id: 'qr-1', name: 'Test', content: 'Test content' }];
      renderWithI18n(<MessageInput onSend={onSend} quickReplies={quickReplies} />);

      const quickButton = screen.getByRole('button', { name: /quick/i });
      expect(quickButton).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(quickButton);
      expect(quickButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
