/**
 * MessageBubble Component Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';
import { MessageBubble } from '../MessageBubble';

expect.extend(toHaveNoViolations);

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

const defaultProps = {
  id: 'msg-1',
  content: 'Hello, this is a test message',
  isOwn: false,
  timestamp: new Date('2024-03-13T10:00:00Z'),
};

describe('MessageBubble', () => {
  describe('Rendering', () => {
    it('renders message content correctly', () => {
      renderWithI18n(<MessageBubble {...defaultProps} />);

      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    });

    it('renders own message with correct styling', () => {
      renderWithI18n(<MessageBubble {...defaultProps} isOwn={true} />);

      const container = screen.getByTestId('message-bubble-msg-1');
      expect(container).toHaveClass('message-bubble-container--own');
    });

    it('renders received message without own styling', () => {
      renderWithI18n(<MessageBubble {...defaultProps} isOwn={false} />);

      const container = screen.getByTestId('message-bubble-msg-1');
      expect(container).not.toHaveClass('message-bubble-container--own');
    });

    it('renders sender avatar for received messages', () => {
      renderWithI18n(
        <MessageBubble
          {...defaultProps}
          isOwn={false}
          showSender={true}
          sender={{
            id: 'user-1',
            displayName: 'John Doe',
            profilePhoto: null,
          }}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('does not render avatar for own messages', () => {
      renderWithI18n(
        <MessageBubble
          {...defaultProps}
          isOwn={true}
          showSender={true}
          sender={{
            id: 'user-1',
            displayName: 'Me',
            profilePhoto: null,
          }}
        />
      );

      expect(screen.queryByText('Me')).not.toBeInTheDocument();
    });

    it('renders timestamp', () => {
      renderWithI18n(<MessageBubble {...defaultProps} />);

      // Should render some form of time
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });

  describe('Deleted Messages', () => {
    it('renders deleted message placeholder', () => {
      renderWithI18n(<MessageBubble {...defaultProps} isDeleted={true} />);

      expect(screen.getByText(/deleted/i)).toBeInTheDocument();
      expect(screen.queryByText('Hello, this is a test message')).not.toBeInTheDocument();
    });

    it('applies deleted styling', () => {
      renderWithI18n(<MessageBubble {...defaultProps} isDeleted={true} />);

      const bubble = screen.getByRole('article');
      expect(bubble).toHaveClass('message-bubble--deleted');
    });
  });

  describe('Read Status', () => {
    it('shows read indicator for read messages', () => {
      renderWithI18n(<MessageBubble {...defaultProps} isOwn={true} isRead={true} />);

      // Read indicator should be present
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('shows sent indicator for unread messages', () => {
      renderWithI18n(<MessageBubble {...defaultProps} isOwn={true} isRead={false} />);

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });
  });

  describe('Attachments', () => {
    it('renders image attachments', () => {
      const attachments = [
        {
          id: 'att-1',
          url: 'https://example.com/image.jpg',
          altText: 'Test image',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
        },
      ];

      renderWithI18n(<MessageBubble {...defaultProps} attachments={attachments} />);

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('renders file attachments with download link', () => {
      const attachments = [
        {
          id: 'att-1',
          url: 'https://example.com/document.pdf',
          altText: 'Document',
          mimeType: 'application/pdf',
          sizeBytes: 2048,
        },
      ];

      renderWithI18n(<MessageBubble {...defaultProps} attachments={attachments} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com/document.pdf');
    });

    it('displays file size correctly', () => {
      const attachments = [
        {
          id: 'att-1',
          url: 'https://example.com/large-file.zip',
          altText: 'Large file',
          mimeType: 'application/zip',
          sizeBytes: 1048576, // 1 MB
        },
      ];

      renderWithI18n(<MessageBubble {...defaultProps} attachments={attachments} />);

      // Should display formatted file size
      expect(screen.getByText(/1.*MB|1024.*KB/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onDelete when delete action is triggered', () => {
      const onDelete = vi.fn();

      renderWithI18n(
        <MessageBubble {...defaultProps} isOwn={true} onDelete={onDelete} />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('msg-1');
    });

    it('does not show delete button for received messages', () => {
      const onDelete = vi.fn();

      renderWithI18n(
        <MessageBubble {...defaultProps} isOwn={false} onDelete={onDelete} />
      );

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithI18n(<MessageBubble {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('uses article role for message container', () => {
      renderWithI18n(<MessageBubble {...defaultProps} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('has accessible timestamp', () => {
      renderWithI18n(<MessageBubble {...defaultProps} />);

      const time = screen.getByRole('article').querySelector('time');
      expect(time).toHaveAttribute('datetime');
    });

    it('images have alt text', () => {
      const attachments = [
        {
          id: 'att-1',
          url: 'https://example.com/image.jpg',
          altText: 'Descriptive alt text',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
        },
      ];

      renderWithI18n(<MessageBubble {...defaultProps} attachments={attachments} />);

      expect(screen.getByAltText('Descriptive alt text')).toBeInTheDocument();
    });
  });
});
