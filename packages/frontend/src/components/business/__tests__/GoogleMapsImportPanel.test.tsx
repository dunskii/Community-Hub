/**
 * Unit tests for GoogleMapsImportPanel Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleMapsImportPanel } from '../GoogleMapsImportPanel';
import type { FormData } from '../../../pages/owner/edit-business/types';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      let text = typeof fallbackOrOpts === 'string' ? fallbackOrOpts : key;
      const interpolation = opts || (typeof fallbackOrOpts === 'object' ? fallbackOrOpts : undefined);
      if (interpolation) {
        for (const [k, v] of Object.entries(interpolation)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

const mockLookupGoogle = vi.fn();
vi.mock('../../../services/business-api', () => ({
  businessApi: {
    lookupGoogle: (...args: unknown[]) => mockLookupGoogle(...args),
  },
}));

// ─── Test Data ────────────────────────────────────────────

const defaultFormData: FormData = {
  name: 'Test Business',
  description: '',
  phone: '',
  email: '',
  website: '',
  street: '',
  suburb: '',
  state: '',
  postcode: '',
  latitude: 0,
  longitude: 0,
  parking: '',
  socialMedia: { facebook: '', instagram: '', twitter: '' },
  operatingHours: {
    monday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
    tuesday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
    wednesday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
    thursday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
    friday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
    saturday: { open: '09:00', close: '17:00', closed: false, byAppointment: false },
    sunday: { open: '09:00', close: '17:00', closed: true, byAppointment: false },
  },
};

const mockEnrichedData = {
  name: 'Test Business',
  formattedAddress: '123 Main St, Sydney NSW 2000',
  street: '123 Main St',
  suburb: 'Sydney',
  state: 'NSW',
  postcode: '2000',
  country: 'Australia',
  latitude: -33.8688,
  longitude: 151.2093,
  phone: '(02) 1234 5678',
  website: 'https://testbusiness.com',
  googleMapsUri: 'https://maps.google.com/?cid=123',
  googlePlaceId: 'ChIJ_test',
  operatingHours: {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
  },
  rating: 4.5,
  userRatingCount: 50,
  businessType: 'Restaurant',
};

// ─── Tests ────────────────────────────────────────────────

describe('GoogleMapsImportPanel', () => {
  const mockOnFieldsApplied = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the panel with title and lookup button', () => {
    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    expect(screen.getByText('Import from Google Maps')).toBeInTheDocument();
    expect(screen.getByText('Look up on Google Maps')).toBeInTheDocument();
  });

  it('collapses and expands the panel', () => {
    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    const toggleButton = screen.getByText('Import from Google Maps').closest('button')!;
    expect(screen.getByText('Look up on Google Maps')).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.queryByText('Look up on Google Maps')).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText('Look up on Google Maps')).toBeInTheDocument();
  });

  it('shows loading state during lookup', async () => {
    mockLookupGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Looking up on Google Maps...')).toBeInTheDocument();
    });
  });

  it('displays diffs when Google data differs from current', async () => {
    mockLookupGoogle.mockResolvedValue(mockEnrichedData);

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    // Should show diffs for fields that differ (phone, website, street, suburb, state, postcode)
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('(02) 1234 5678')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('https://testbusiness.com')).toBeInTheDocument();
  });

  it('auto-selects empty fields', async () => {
    mockLookupGoogle.mockResolvedValue(mockEnrichedData);

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    // All checkboxes should be checked since all current fields are empty
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it('applies selected fields when apply button is clicked', async () => {
    mockLookupGoogle.mockResolvedValue(mockEnrichedData);

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    // Click apply
    const applyButton = screen.getByText(/Apply \d+ Fields/);
    fireEvent.click(applyButton);

    expect(mockOnFieldsApplied).toHaveBeenCalledTimes(1);
    const updates = mockOnFieldsApplied.mock.calls[0][0];
    expect(updates.phone).toBe('(02) 1234 5678');
    expect(updates.website).toBe('https://testbusiness.com');
    expect(updates.street).toBe('123 Main St');
  });

  it('shows success message after applying fields', async () => {
    mockLookupGoogle.mockResolvedValue(mockEnrichedData);

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Apply \d+ Fields/));

    expect(screen.getByText(/Google Maps data applied/)).toBeInTheDocument();
  });

  it('shows error when business not found on Google', async () => {
    mockLookupGoogle.mockRejectedValue(new Error('No matching business found on Google Maps'));

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText(/Could not find your business/)).toBeInTheDocument();
    });
  });

  it('shows no-new-data message when Google data matches current', async () => {
    const matchingFormData: FormData = {
      ...defaultFormData,
      phone: '(02) 1234 5678',
      website: 'https://testbusiness.com',
      street: '123 Main St',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    };

    const matchingEnrichedData = {
      ...mockEnrichedData,
      operatingHours: null, // No hours data to diff either
    };

    mockLookupGoogle.mockResolvedValue(matchingEnrichedData);

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={matchingFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText(/Google Maps data matches/)).toBeInTheDocument();
    });
  });

  it('does not show diffs for fields that already match', async () => {
    const partialFormData: FormData = {
      ...defaultFormData,
      phone: '(02) 1234 5678', // Same as Google data
      street: '', // Different - should show diff
    };

    mockLookupGoogle.mockResolvedValue({ ...mockEnrichedData, operatingHours: null });

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={partialFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    // Phone should NOT be in the diff since it matches
    const diffRows = screen.getAllByRole('row');
    const phoneRow = diffRows.find((row) => row.textContent?.includes('Phone Number'));
    expect(phoneRow).toBeUndefined();

    // Street SHOULD be in the diff since it's empty
    const streetRow = diffRows.find((row) => row.textContent?.includes('Street Address'));
    expect(streetRow).toBeDefined();
  });

  it('shows rating when available', async () => {
    mockLookupGoogle.mockResolvedValue(mockEnrichedData);

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText(/4\.5\/5/)).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });
  });

  it('allows toggling individual field selection', async () => {
    mockLookupGoogle.mockResolvedValue({ ...mockEnrichedData, operatingHours: null });

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    // Find and uncheck the phone checkbox
    const phoneCheckbox = screen.getByLabelText('Import Phone Number');
    expect(phoneCheckbox).toBeChecked();
    fireEvent.click(phoneCheckbox);
    expect(phoneCheckbox).not.toBeChecked();
  });

  it('has accessible aria labels on checkboxes', async () => {
    mockLookupGoogle.mockResolvedValue({ ...mockEnrichedData, operatingHours: null });

    render(
      <GoogleMapsImportPanel
        businessId="biz-1"
        formData={defaultFormData}
        onFieldsApplied={mockOnFieldsApplied}
      />,
    );

    fireEvent.click(screen.getByText('Look up on Google Maps'));

    await waitFor(() => {
      expect(screen.getByText('Found: Test Business')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Import Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Import Website')).toBeInTheDocument();
    expect(screen.getByLabelText('Import Street Address')).toBeInTheDocument();
  });
});
