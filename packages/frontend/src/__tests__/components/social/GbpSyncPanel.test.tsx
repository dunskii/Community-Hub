/**
 * GbpSyncPanel Tests
 *
 * Tests the Google Business Profile sync UI component.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GbpProfileData, GbpSyncStatus, GbpSyncResult } from '@community-hub/shared';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string | Record<string, unknown>) => {
      if (typeof fallback === 'string') return fallback;
      if (typeof fallback === 'object' && 'defaultValue' in fallback) return fallback.defaultValue as string;
      return key;
    },
  }),
}));

// Mock social API
const mockFetchGbpProfile = vi.fn();
const mockApplyGbpSync = vi.fn();
const mockGetGbpSyncStatus = vi.fn();
vi.mock('../../../services/social-api', () => ({
  socialApi: {
    fetchGbpProfile: (...args: unknown[]) => mockFetchGbpProfile(...args),
    applyGbpSync: (...args: unknown[]) => mockApplyGbpSync(...args),
    getGbpSyncStatus: (...args: unknown[]) => mockGetGbpSyncStatus(...args),
  },
}));

import { GbpSyncPanel } from '../../../components/social/GbpSyncPanel';

const DEFAULT_FORM_DATA = {
  name: 'Local Business Name',
  description: 'Local description',
  detailedDescription: '',
  phone: '0400 000 000',
  secondaryPhone: '',
  email: '',
  website: 'https://local.com',
  street: '1 Local St',
  suburb: 'Guildford',
  state: 'NSW',
  postcode: '2161',
  priceRange: '',
  yearEstablished: '',
  parkingInformation: '',
  languagesSpoken: [] as string[],
  paymentMethods: [] as string[],
  accessibilityFeatures: [] as string[],
  operatingHours: {} as Record<string, { open: string; close: string; closed: boolean; byAppointment: boolean }>,
  publicHolidays: { open: '09:00', close: '17:00', closed: true, byAppointment: false },
  specialNotes: '',
  socialLinks: { facebook: '', instagram: '', twitter: '', linkedin: '', youtube: '' },
};

const CONNECTED_STATUS: GbpSyncStatus = {
  lastSyncAt: '2026-03-25T10:00:00.000Z',
  syncStatus: 'SUCCESS',
  isGbpConnected: true,
  locationName: 'My Google Business',
};

const DISCONNECTED_STATUS: GbpSyncStatus = {
  lastSyncAt: null,
  syncStatus: null,
  isGbpConnected: false,
  locationName: null,
};

const MOCK_GBP_DATA: GbpProfileData = {
  name: 'Google Business Name',
  phone: '+61 2 9876 5432',
  website: 'https://google-biz.com',
  description: 'Description from Google',
  address: {
    street: '123 Google St',
    suburb: 'Guildford',
    state: 'NSW',
    postcode: '2161',
    country: 'AU',
    latitude: -33.85,
    longitude: 151.01,
  },
};

describe('GbpSyncPanel', () => {
  const onFieldsApplied = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    mockGetGbpSyncStatus.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );
    // Skeleton should be visible (animate-pulse divs)
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows disconnected state when GBP is not connected', async () => {
    mockGetGbpSyncStatus.mockResolvedValue(DISCONNECTED_STATUS);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Connect your Google Business Profile/)).toBeInTheDocument();
    });

    // Sync button should NOT be visible
    expect(screen.queryByText('Sync from Google')).not.toBeInTheDocument();
  });

  it('shows sync button when GBP is connected', async () => {
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    expect(screen.getByText('My Google Business')).toBeInTheDocument();
  });

  it('shows last sync date when available', async () => {
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Last synced/)).toBeInTheDocument();
    });
  });

  it('fetches and displays GBP profile data on sync button click', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    // Wait for status to load
    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    // Click sync
    await user.click(screen.getByText('Sync from Google'));

    // Should show diff view with field labels
    await waitFor(() => {
      expect(screen.getByText('Business Name')).toBeInTheDocument();
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
    });

    // Should show apply button
    expect(screen.getByText('Apply Selected Changes')).toBeInTheDocument();
  });

  it('auto-selects fields that differ from current data', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      // Name differs → checkbox should be checked
      const nameCheckbox = screen.getByLabelText(/Business Name/);
      expect(nameCheckbox).toBeChecked();
    });
  });

  it('calls onFieldsApplied after successful sync', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);
    mockApplyGbpSync.mockResolvedValue({
      fieldsUpdated: ['name', 'phone'],
      syncedAt: '2026-03-26T12:00:00.000Z',
      status: 'SUCCESS',
    } satisfies GbpSyncResult);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      expect(screen.getByText('Apply Selected Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Apply Selected Changes'));

    await waitFor(() => {
      expect(onFieldsApplied).toHaveBeenCalled();
    });

    // Verify the form updates include the GBP data
    const updates = onFieldsApplied.mock.calls[0][0];
    expect(updates.name).toBe('Google Business Name');
    expect(updates.phone).toBe('+61 2 9876 5432');
  });

  it('shows error message on fetch failure', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockRejectedValue(new Error('GBP API unavailable'));

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      expect(screen.getByText('GBP API unavailable')).toBeInTheDocument();
    });
  });

  it('shows error message on apply failure', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);
    mockApplyGbpSync.mockRejectedValue(new Error('Sync failed'));

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      expect(screen.getByText('Apply Selected Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Apply Selected Changes'));

    await waitFor(() => {
      expect(screen.getByText('Sync failed')).toBeInTheDocument();
    });
  });

  it('select all / deselect all buttons work', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    // Deselect all
    await user.click(screen.getByText('Deselect All'));

    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      expect(cb).not.toBeChecked();
    }

    // Select all
    await user.click(screen.getByText('Select All'));

    await waitFor(() => {
      const checked = screen.getAllByRole('checkbox').filter((cb) => (cb as HTMLInputElement).checked);
      expect(checked.length).toBeGreaterThan(0);
    });
  });

  it('cancel button hides the diff view', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancel'));

    // Diff view should be gone, sync button should reappear
    await waitFor(() => {
      expect(screen.queryByText('Apply Selected Changes')).not.toBeInTheDocument();
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });
  });

  it('disables apply button when no fields selected', async () => {
    const user = userEvent.setup();
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);
    mockFetchGbpProfile.mockResolvedValue(MOCK_GBP_DATA);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync from Google')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sync from Google'));

    await waitFor(() => {
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    // Deselect all
    await user.click(screen.getByText('Deselect All'));

    const applyBtn = screen.getByText('Apply Selected Changes');
    expect(applyBtn.closest('button')).toBeDisabled();
  });

  it('has proper ARIA attributes for accessibility', async () => {
    mockGetGbpSyncStatus.mockResolvedValue(CONNECTED_STATUS);

    render(
      <GbpSyncPanel businessId="biz-1" formData={DEFAULT_FORM_DATA} onFieldsApplied={onFieldsApplied} />
    );

    await waitFor(() => {
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label');
    });
  });
});
