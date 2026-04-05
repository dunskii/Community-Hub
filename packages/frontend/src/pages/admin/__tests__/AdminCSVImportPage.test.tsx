/**
 * Unit tests for AdminCSVImportPage - CSV parsing logic
 *
 * Tests the parseCSV function indirectly through the component's file upload flow,
 * plus component rendering and interaction tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AdminCSVImportPage } from '../AdminCSVImportPage';

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

vi.mock('../../../services/business-api', () => ({
  businessApi: {
    listCategories: vi.fn().mockResolvedValue([
      { id: 'cat-1', name: 'Food & Drink', type: 'PRIMARY' },
      { id: 'cat-2', name: 'Retail', type: 'PRIMARY' },
    ]),
  },
}));

vi.mock('../../../services/admin-api', () => ({
  enrichBusinessesFromCSV: vi.fn(),
  bulkImportBusinesses: vi.fn(),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <AdminCSVImportPage />
      </BrowserRouter>
    </HelmetProvider>,
  );
}

function createCSVFile(content: string, name = 'test.csv') {
  return new File([content], name, { type: 'text/csv' });
}

function uploadFile(file: File) {
  const input = document.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('AdminCSVImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders upload step by default', () => {
      renderPage();
      expect(screen.getByText('Import Businesses')).toBeInTheDocument();
      expect(screen.getByText('Click to upload CSV file')).toBeInTheDocument();
      expect(screen.getByText('CSV Format Guide')).toBeInTheDocument();
    });

    it('shows the format guide with column descriptions', () => {
      renderPage();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('phone')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
    });
  });

  describe('file upload validation', () => {
    it('rejects non-CSV files', () => {
      renderPage();
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      uploadFile(file);
      expect(screen.getByText('Please upload a CSV file')).toBeInTheDocument();
    });

    it('rejects files over 5MB', () => {
      renderPage();
      const largeContent = 'x'.repeat(6 * 1024 * 1024);
      const file = createCSVFile(largeContent);
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      uploadFile(file);
      expect(screen.getByText('File size must be under 5MB')).toBeInTheDocument();
    });
  });

  describe('CSV parsing', () => {
    it('parses a valid CSV with standard headers', async () => {
      renderPage();

      const csv = `name,phone,email,street,suburb,state,postcode
Test Bakery,(02) 1234 5678,info@test.com,123 Main St,Sydney,NSW,2000`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText('Test Bakery')).toBeInTheDocument();
      });
    });

    it('handles header variations (Business Name, tel, address, etc.)', async () => {
      renderPage();

      const csv = `Business Name,telephone,website url,address,city,province,postal code
My Shop,555-1234,https://shop.com,456 Oak Ave,Melbourne,VIC,3000`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText('My Shop')).toBeInTheDocument();
      });
    });

    it('handles quoted fields with commas', async () => {
      renderPage();

      const csv = `name,phone,street
"Smith, Jones & Co",555-1234,"123 Main St, Suite 4"`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText('Smith, Jones & Co')).toBeInTheDocument();
      });
    });

    it('handles UTF-8 BOM', async () => {
      renderPage();

      const csv = `\uFEFFname,phone
BOM Business,555-1234`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText('BOM Business')).toBeInTheDocument();
      });
    });

    it('skips rows without a name', async () => {
      renderPage();

      const csv = `name,phone
Business A,111
,222
Business C,333`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText('Business A')).toBeInTheDocument();
        expect(screen.getByText('Business C')).toBeInTheDocument();
        expect(screen.getByText('2 businesses')).toBeInTheDocument();
      });
    });

    it('shows error for CSV with no data rows', async () => {
      renderPage();

      const csv = `name,phone`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText(/No valid rows found/)).toBeInTheDocument();
      });
    });

    it('shows error for CSV with too many rows', async () => {
      renderPage();

      const header = 'name,phone';
      const rows = Array.from({ length: 101 }, (_, i) => `Business ${i},555-${i}`);
      const csv = [header, ...rows].join('\n');

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText(/Maximum 100 businesses/)).toBeInTheDocument();
      });
    });
  });

  describe('preview step interactions', () => {
    async function goToPreview() {
      renderPage();

      const csv = `name,phone,street,suburb,state,postcode
Business A,(02) 1111 1111,1 Test St,Sydney,NSW,2000
Business B,(02) 2222 2222,2 Test St,Melbourne,VIC,3000`;

      uploadFile(createCSVFile(csv));

      await waitFor(() => {
        expect(screen.getByText('Business A')).toBeInTheDocument();
      });
    }

    it('shows the preview table with parsed data', async () => {
      await goToPreview();

      expect(screen.getByText('Business A')).toBeInTheDocument();
      expect(screen.getByText('Business B')).toBeInTheDocument();
      expect(screen.getByText('2 businesses')).toBeInTheDocument();
    });

    it('allows toggling row selection', async () => {
      await goToPreview();

      const checkbox = screen.getByLabelText('Select Business A');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('allows toggling all rows', async () => {
      await goToPreview();

      const selectAllCheckbox = screen.getByLabelText('Select all');
      fireEvent.click(selectAllCheckbox); // Deselect all
      expect(screen.getByText('0 selected')).toBeInTheDocument();

      fireEvent.click(selectAllCheckbox); // Select all
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('allows removing a row', async () => {
      await goToPreview();

      const removeButton = screen.getByLabelText('Remove Business A');
      fireEvent.click(removeButton);

      expect(screen.queryByText('Business A')).not.toBeInTheDocument();
      expect(screen.getByText('Business B')).toBeInTheDocument();
      expect(screen.getByText('1 businesses')).toBeInTheDocument();
    });

    it('shows "Start Over" button in preview step', async () => {
      await goToPreview();

      const startOverButton = screen.getByText('Start Over');
      expect(startOverButton).toBeInTheDocument();

      fireEvent.click(startOverButton);

      // Should go back to upload step
      expect(screen.getByText('Click to upload CSV file')).toBeInTheDocument();
    });

    it('has accessible aria labels on row checkboxes', async () => {
      await goToPreview();

      expect(screen.getByLabelText('Select Business A')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Business B')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Business A')).toBeInTheDocument();
      expect(screen.getByLabelText('Category for Business A')).toBeInTheDocument();
    });
  });
});
