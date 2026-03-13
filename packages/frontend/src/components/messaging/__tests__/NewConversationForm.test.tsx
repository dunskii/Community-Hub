/**
 * NewConversationForm Component Tests
 * Phase 9: Messaging System
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/config';
import { NewConversationForm, BusinessInfo } from '../NewConversationForm';

expect.extend(toHaveNoViolations);

const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
};

const mockBusiness: BusinessInfo = {
  id: 'biz-1',
  name: 'Test Business',
  logo: null,
};

const mockBusinesses: BusinessInfo[] = [
  { id: 'biz-1', name: 'Test Business', logo: null },
  { id: 'biz-2', name: 'Another Business', logo: null },
  { id: 'biz-3', name: 'Third Business', logo: null },
];

describe('NewConversationForm', () => {
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
  });

  describe('Rendering', () => {
    it('renders form with all fields', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      expect(screen.getByLabelText(/subject category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preferred contact/i)).toBeInTheDocument();
    });

    it('shows business search when no business prop provided', () => {
      renderWithI18n(
        <NewConversationForm onSubmit={onSubmit} businesses={mockBusinesses} />
      );

      expect(screen.getByLabelText(/select.*business/i)).toBeInTheDocument();
    });

    it('shows business info when business prop provided', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      expect(screen.getByText(/contact.*Test Business/i)).toBeInTheDocument();
    });

    it('shows subject category options', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      const select = screen.getByLabelText(/subject category/i);
      expect(select).toBeInTheDocument();
    });

    it('shows preferred contact options', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      const select = screen.getByLabelText(/preferred contact/i);
      expect(select).toBeInTheDocument();
    });

    it('shows privacy notice', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      expect(screen.getByText(/privacy/i)).toBeInTheDocument();
    });

    it('shows cancel button when onCancel provided', () => {
      renderWithI18n(
        <NewConversationForm
          business={mockBusiness}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Business Selection', () => {
    it('shows business list when businesses prop provided', () => {
      renderWithI18n(
        <NewConversationForm onSubmit={onSubmit} businesses={mockBusinesses} />
      );

      expect(screen.getByText('Test Business')).toBeInTheDocument();
      expect(screen.getByText('Another Business')).toBeInTheDocument();
    });

    it('selects business when clicked', async () => {
      renderWithI18n(
        <NewConversationForm onSubmit={onSubmit} businesses={mockBusinesses} />
      );

      const businessButton = screen.getByRole('option', { name: /Test Business/i });
      await userEvent.click(businessButton);

      expect(screen.getByText(/Test Business/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    });

    it('allows changing selected business', async () => {
      renderWithI18n(
        <NewConversationForm onSubmit={onSubmit} businesses={mockBusinesses} />
      );

      // Select a business
      await userEvent.click(screen.getByRole('option', { name: /Test Business/i }));

      // Change selection
      await userEvent.click(screen.getByRole('button', { name: /change/i }));

      // Should show search again
      expect(screen.getByLabelText(/select.*business/i)).toBeInTheDocument();
    });

    it('searches businesses when typing', async () => {
      const onSearchBusinesses = vi.fn().mockResolvedValue([
        { id: 'search-result', name: 'Search Result', logo: null },
      ]);

      renderWithI18n(
        <NewConversationForm
          onSubmit={onSubmit}
          onSearchBusinesses={onSearchBusinesses}
        />
      );

      const searchInput = screen.getByLabelText(/select.*business/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(onSearchBusinesses).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('Validation', () => {
    it('shows error when business not selected', async () => {
      renderWithI18n(
        <NewConversationForm onSubmit={onSubmit} businesses={mockBusinesses} />
      );

      // Fill in other fields
      await userEvent.type(screen.getByLabelText(/subject$/i), 'Test Subject');
      await userEvent.type(screen.getByLabelText(/message/i), 'Test message');

      // Submit without selecting business
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error when subject too short', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Hi');
      await userEvent.type(screen.getByLabelText(/message/i), 'Test message');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByText(/too short/i)).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error when message is empty', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Test Subject');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByText(/required/i)).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows character count for subject', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Test Subject');

      expect(screen.getByText(/12\/200/)).toBeInTheDocument();
    });

    it('shows character count for message', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/message/i), 'Test message');

      expect(screen.getByText(/12\/1000/)).toBeInTheDocument();
    });
  });

  describe('Submission', () => {
    it('calls onSubmit with form data', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Test Subject');
      await userEvent.type(screen.getByLabelText(/message/i), 'Test message content');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        businessId: 'biz-1',
        subject: 'Test Subject',
        subjectCategory: 'GENERAL',
        message: 'Test message content',
        preferredContact: undefined,
      });
    });

    it('includes preferred contact when selected', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Test Subject');
      await userEvent.type(screen.getByLabelText(/message/i), 'Test message content');
      await userEvent.selectOptions(
        screen.getByLabelText(/preferred contact/i),
        'email'
      );
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          preferredContact: 'email',
        })
      );
    });

    it('includes selected subject category', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.selectOptions(
        screen.getByLabelText(/subject category/i),
        'BOOKING'
      );
      await userEvent.type(screen.getByLabelText(/subject$/i), 'Test Subject');
      await userEvent.type(screen.getByLabelText(/message/i), 'Test message content');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectCategory: 'BOOKING',
        })
      );
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when cancel button clicked', async () => {
      renderWithI18n(
        <NewConversationForm
          business={mockBusiness}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables form when isSubmitting', () => {
      renderWithI18n(
        <NewConversationForm
          business={mockBusiness}
          onSubmit={onSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByLabelText(/subject$/i)).toBeDisabled();
      expect(screen.getByLabelText(/message/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    });

    it('shows sending text on submit button', () => {
      renderWithI18n(
        <NewConversationForm
          business={mockBusiness}
          onSubmit={onSubmit}
          isSubmitting={true}
        />
      );

      expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('shows error banner when error prop provided', () => {
      renderWithI18n(
        <NewConversationForm
          business={mockBusiness}
          onSubmit={onSubmit}
          error="Something went wrong"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('form has accessible name', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      expect(screen.getByRole('form')).toHaveAccessibleName();
    });

    it('required fields are marked', () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      // Required indicators should be present
      const requiredMarkers = document.querySelectorAll('[aria-hidden="true"]');
      const hasRequiredMarker = Array.from(requiredMarkers).some(
        (el) => el.textContent === '*'
      );
      expect(hasRequiredMarker).toBe(true);
    });

    it('error messages have alert role', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Hi');
      await userEvent.type(screen.getByLabelText(/message/i), 'Test');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('inputs have aria-invalid when in error state', async () => {
      renderWithI18n(
        <NewConversationForm business={mockBusiness} onSubmit={onSubmit} />
      );

      await userEvent.type(screen.getByLabelText(/subject$/i), 'Hi');
      await userEvent.click(screen.getByRole('button', { name: /send/i }));

      expect(screen.getByLabelText(/subject$/i)).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
