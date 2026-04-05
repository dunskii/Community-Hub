/**
 * AdminCSVImportPage
 *
 * Admin/Curator page for bulk importing businesses from CSV files.
 * Supports Google Places API enrichment to prefill business profiles.
 *
 * Flow:
 * 1. Upload CSV file with business data
 * 2. Preview parsed rows in a table
 * 3. (Optional) Enrich with Google Places API
 * 4. Select category and review data
 * 5. Import businesses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { businessApi, type Category } from '../../services/business-api';
import {
  enrichBusinessesFromCSV,
  bulkImportBusinesses,
  type EnrichedBusinessData,
  type BulkImportResult,
} from '../../services/admin-api';

// ─── Types ──────────────────────────────────────────────────

interface CSVRow {
  name: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  description: string;
}

interface ImportRow extends CSVRow {
  enriched: EnrichedBusinessData | null;
  selected: boolean;
  categoryPrimaryId: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: Record<string, { open: string; close: string }>;
}

type Step = 'upload' | 'preview' | 'results';

// ─── CSV Parser ─────────────────────────────────────────────

function parseCSV(text: string): CSVRow[] {
  // Strip UTF-8 BOM that Excel commonly adds to CSV exports
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header row
  const headerLine = lines[0];
  if (!headerLine) return [];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  // Map common header variations
  const headerMap: Record<string, keyof CSVRow> = {};
  for (const h of headers) {
    if (['name', 'business name', 'business_name', 'businessname'].includes(h))
      headerMap[h] = 'name';
    else if (['phone', 'phone number', 'phone_number', 'tel', 'telephone'].includes(h))
      headerMap[h] = 'phone';
    else if (['email', 'email address', 'email_address'].includes(h))
      headerMap[h] = 'email';
    else if (['website', 'url', 'web', 'website url'].includes(h))
      headerMap[h] = 'website';
    else if (['street', 'street address', 'street_address', 'address'].includes(h))
      headerMap[h] = 'street';
    else if (['suburb', 'city', 'town', 'locality'].includes(h))
      headerMap[h] = 'suburb';
    else if (['state', 'province', 'region'].includes(h))
      headerMap[h] = 'state';
    else if (['postcode', 'postal code', 'postal_code', 'zip', 'zipcode', 'zip code'].includes(h))
      headerMap[h] = 'postcode';
    else if (['description', 'desc', 'about'].includes(h))
      headerMap[h] = 'description';
  }

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: CSVRow = {
      name: '',
      phone: '',
      email: '',
      website: '',
      street: '',
      suburb: '',
      state: '',
      postcode: '',
      description: '',
    };

    headers.forEach((header, idx) => {
      const field = headerMap[header];
      if (field && values[idx]) {
        row[field] = values[idx].trim();
      }
    });

    // Only include rows with at least a name
    if (row.name) {
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// ─── Component ──────────────────────────────────────────────

export function AdminCSVImportPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/curator') ? '/curator' : '/admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult[] | null>(null);
  const [importSummary, setImportSummary] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [fileName, setFileName] = useState('');

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await businessApi.listCategories({ active: true });
        setCategories(cats);
      } catch {
        // Categories will just be empty
      }
    }
    fetchCategories();
  }, []);

  // ─── File Upload ────────────────────────────────────────

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError(t('admin.businesses.import.invalidFileType', 'Please upload a CSV file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('admin.businesses.import.fileTooLarge', 'File size must be under 5MB'));
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);

        if (parsed.length === 0) {
          setError(t('admin.businesses.import.noRows', 'No valid rows found in CSV. Ensure it has a header row with at least a "name" column.'));
          return;
        }

        if (parsed.length > 100) {
          setError(t('admin.businesses.import.tooManyRows', 'Maximum 100 businesses per import. Your file has {{count}} rows.', { count: parsed.length }));
          return;
        }

        const importRows: ImportRow[] = parsed.map((row) => ({
          ...row,
          enriched: null,
          selected: true,
          categoryPrimaryId: '',
        }));

        setRows(importRows);
        setStep('preview');
      } catch {
        setError(t('admin.businesses.import.parseError', 'Failed to parse CSV file'));
      }
    };
    reader.readAsText(file);
  }, [t]);

  // ─── Google Places Enrichment ───────────────────────────

  const handleEnrich = useCallback(async () => {
    setError(null);
    setEnriching(true);

    try {
      const inputs = rows.map((row) => ({
        name: row.name,
        address: [row.street, row.suburb, row.state, row.postcode].filter(Boolean).join(', ') || undefined,
        phone: row.phone || undefined,
      }));

      const enriched = await enrichBusinessesFromCSV(inputs);

      setRows((prev) =>
        prev.map((row, idx) => {
          const data = enriched[idx];
          if (!data) return { ...row, enriched: null };

          return {
            ...row,
            enriched: data,
            // Prefill empty fields from Google Places
            phone: row.phone || data.phone,
            email: row.email,
            website: row.website || data.website,
            street: row.street || data.street,
            suburb: row.suburb || data.suburb,
            state: row.state || data.state,
            postcode: row.postcode || data.postcode,
            latitude: data.latitude,
            longitude: data.longitude,
            operatingHours: data.operatingHours || undefined,
          };
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.businesses.import.enrichFailed', 'Failed to enrich with Google Places'),
      );
    } finally {
      setEnriching(false);
    }
  }, [rows, t]);

  // ─── Import ─────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    setError(null);

    const selectedRows = rows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setError(t('admin.businesses.import.noSelection', 'Please select at least one business to import'));
      return;
    }

    // Validate all selected rows have a category
    const missingCategory = selectedRows.find((r) => !r.categoryPrimaryId && !defaultCategoryId);
    if (missingCategory) {
      setError(t('admin.businesses.import.categoryRequired', 'Please select a default category or assign categories individually'));
      return;
    }

    // Validate required fields
    const missingFields = selectedRows.find((r) => !r.phone || !r.street || !r.suburb || !r.state || !r.postcode);
    if (missingFields) {
      setError(t('admin.businesses.import.missingFields', 'All selected businesses must have phone, street, suburb, state and postcode. Use Google Maps enrichment to fill missing data.'));
      return;
    }

    setImporting(true);

    try {
      const businesses = selectedRows.map((row) => ({
        name: row.name,
        description: row.description || undefined,
        categoryPrimaryId: row.categoryPrimaryId || defaultCategoryId,
        phone: row.phone,
        email: row.email || undefined,
        website: row.website || undefined,
        street: row.street,
        suburb: row.suburb,
        state: row.state,
        postcode: row.postcode,
        latitude: row.latitude,
        longitude: row.longitude,
        operatingHours: row.operatingHours,
      }));

      const response = await bulkImportBusinesses(businesses);
      setImportResults(response.results);
      setImportSummary(response.summary);
      setStep('results');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('admin.businesses.import.importFailed', 'Failed to import businesses'),
      );
    } finally {
      setImporting(false);
    }
  }, [rows, defaultCategoryId, t]);

  // ─── Row Selection ──────────────────────────────────────

  const toggleRow = (idx: number) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, selected: !row.selected } : row)),
    );
  };

  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((row) => ({ ...row, selected: !allSelected })));
  };

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRowCategory = (idx: number, categoryId: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, categoryPrimaryId: categoryId } : row)),
    );
  };

  // ─── Reset ──────────────────────────────────────────────

  const handleReset = () => {
    setStep('upload');
    setRows([]);
    setError(null);
    setImportResults(null);
    setImportSummary(null);
    setFileName('');
    setDefaultCategoryId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Helpers ────────────────────────────────────────────

  const getCategoryName = (cat: Category): string => {
    if (typeof cat.name === 'string') return cat.name;
    return (cat.name as Record<string, string>).en || cat.id;
  };

  const selectedCount = rows.filter((r) => r.selected).length;
  const enrichedCount = rows.filter((r) => r.enriched).length;

  const inputClasses =
    'w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm';

  // ─── Render ─────────────────────────────────────────────

  return (
    <PageContainer>
      <Helmet>
        <title>
          {t('admin.businesses.import.title', 'Import Businesses')} |{' '}
          {basePath === '/curator' ? 'Curator' : 'Admin'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to={`${basePath}/businesses`}
              className="inline-flex items-center text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors mb-2"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              {t('admin.businesses.backToBusinesses', 'Back to Businesses')}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {t('admin.businesses.import.title', 'Import Businesses')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t(
                'admin.businesses.import.subtitle',
                'Bulk import businesses from a CSV file with optional Google Maps enrichment',
              )}
            </p>
          </div>

          {step !== 'upload' && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              {t('admin.businesses.import.startOver', 'Start Over')}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
            {/* Upload area */}
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <ArrowUpTrayIcon className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                {t('admin.businesses.import.dropzone', 'Click to upload CSV file')}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('admin.businesses.import.dropzoneHint', 'Max 100 businesses, 5MB file size')}
              </p>
              <input
                ref={fileInputRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* CSV Format Guide */}
            <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                <DocumentTextIcon className="h-5 w-5" />
                {t('admin.businesses.import.formatGuide', 'CSV Format Guide')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {t(
                  'admin.businesses.import.formatDescription',
                  'Your CSV should include a header row with these columns. Only "name" is required - Google Maps can fill the rest.',
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="text-xs text-slate-600 dark:text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-1.5 pr-4 text-left font-medium">{t('admin.businesses.import.column', 'Column')}</th>
                      <th className="py-1.5 pr-4 text-left font-medium">{t('admin.businesses.import.required', 'Required')}</th>
                      <th className="py-1.5 text-left font-medium">{t('admin.businesses.import.example', 'Example')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['name', t('common.yes', 'Yes'), t('admin.businesses.import.examples.name', 'Local Bakery')],
                      ['phone', t('admin.businesses.import.recommended', 'Recommended'), t('admin.businesses.import.examples.phone', '(02) 1234 5678')],
                      ['address / street', t('admin.businesses.import.recommended', 'Recommended'), t('admin.businesses.import.examples.street', '123 Main St')],
                      ['suburb', t('admin.businesses.import.recommended', 'Recommended'), t('admin.businesses.import.examples.suburb', 'Town Centre')],
                      ['state', t('admin.businesses.import.recommended', 'Recommended'), t('admin.businesses.import.examples.state', 'NSW')],
                      ['postcode', t('admin.businesses.import.recommended', 'Recommended'), t('admin.businesses.import.examples.postcode', '2000')],
                      ['email', t('common.optional', 'Optional'), 'info@business.com'],
                      ['website', t('common.optional', 'Optional'), 'https://business.com'],
                      ['description', t('common.optional', 'Optional'), t('admin.businesses.import.examples.description', 'Fresh bread daily')],
                    ].map(([col, req, ex]) => (
                      <tr key={col} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1.5 pr-4 font-mono">{col}</td>
                        <td className="py-1.5 pr-4">{req}</td>
                        <td className="py-1.5 text-slate-400">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Actions bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Info */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                    {fileName}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {t('admin.businesses.import.rowCount', '{{count}} businesses', { count: rows.length })}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('admin.businesses.import.selectedCount', '{{count}} selected', { count: selectedCount })}
                  </span>
                  {enrichedCount > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                      {t('admin.businesses.import.enrichedCount', '{{count}} enriched', { count: enrichedCount })}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleEnrich}
                    disabled={enriching}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enriching ? (
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    )}
                    {enriching
                      ? t('admin.businesses.import.enrichingProgress', 'Enriching...')
                      : t('admin.businesses.import.enrichButton', 'Enrich with Google Maps')}
                  </button>

                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || selectedCount === 0}
                    className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    )}
                    {importing
                      ? t('admin.businesses.import.importingProgress', 'Importing...')
                      : t('admin.businesses.import.importButton', 'Import {{count}} Businesses', { count: selectedCount })}
                  </button>
                </div>
              </div>

              {/* Default category selector */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <label
                  htmlFor="default-category"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                >
                  {t('admin.businesses.import.defaultCategory', 'Default Category:')}
                </label>
                <select
                  id="default-category"
                  value={defaultCategoryId}
                  onChange={(e) => setDefaultCategoryId(e.target.value)}
                  className={inputClasses + ' sm:max-w-xs'}
                >
                  <option value="">
                    {t('admin.businesses.import.selectDefaultCategory', '-- Select default category --')}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {getCategoryName(cat)}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t(
                    'admin.businesses.import.defaultCategoryHint',
                    'Applied to businesses without an individual category',
                  )}
                </span>
              </div>
            </div>

            {/* Data table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-3 text-left">
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && rows.every((r) => r.selected)}
                          onChange={toggleAll}
                          className="rounded border-slate-300 dark:border-slate-600"
                          aria-label={t('admin.businesses.import.selectAll', 'Select all')}
                        />
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        #
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnName', 'Name')}
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnPhone', 'Phone')}
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnAddress', 'Address')}
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnWebsite', 'Website')}
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnCategory', 'Category')}
                      </th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnEnriched', 'Google Maps')}
                      </th>
                      <th className="py-3 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                          !row.selected ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => toggleRow(idx)}
                            className="rounded border-slate-300 dark:border-slate-600"
                            aria-label={t('admin.businesses.import.selectRow', 'Select {{name}}', { name: row.name })}
                          />
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                          {row.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {row.phone || (
                            <span className="text-amber-500 text-xs">{t('admin.businesses.import.missing', 'Missing')}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[250px] truncate">
                          {[row.street, row.suburb, row.state, row.postcode].filter(Boolean).join(', ') || (
                            <span className="text-amber-500 text-xs">{t('admin.businesses.import.missing', 'Missing')}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                          {row.website || <span className="text-slate-300 dark:text-slate-600">-</span>}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={row.categoryPrimaryId}
                            onChange={(e) => updateRowCategory(idx, e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            aria-label={t('admin.businesses.import.selectCategory', 'Category for {{name}}', { name: row.name })}
                          >
                            <option value="">
                              {defaultCategoryId
                                ? t('admin.businesses.import.useDefault', 'Use default')
                                : t('admin.businesses.import.selectCat', 'Select...')}
                            </option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {getCategoryName(cat)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          {row.enriched ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="h-4 w-4" />
                              {t('admin.businesses.import.enrichedYes', 'Matched')}
                            </span>
                          ) : enriching ? (
                            <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            aria-label={t('admin.businesses.import.removeRow', 'Remove {{name}}', { name: row.name })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Enrichment details panel */}
            {enrichedCount > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-4">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                  <CheckCircleIcon className="h-5 w-5 inline mr-1" />
                  {t('admin.businesses.import.enrichmentSummary', 'Google Maps Enrichment Results')}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {t(
                    'admin.businesses.import.enrichmentDetail',
                    '{{matched}} of {{total}} businesses matched. Matched businesses had their addresses, phone numbers, websites, coordinates, and operating hours updated from Google Maps.',
                    { matched: enrichedCount, total: rows.length },
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && importResults && importSummary && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{importSummary.total}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('admin.businesses.import.totalProcessed', 'Total Processed')}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-5 text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{importSummary.success}</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {t('admin.businesses.import.successCount', 'Successfully Imported')}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-5 text-center ${
                  importSummary.failed > 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <p
                  className={`text-3xl font-bold ${
                    importSummary.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                  }`}
                >
                  {importSummary.failed}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    importSummary.failed > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {t('admin.businesses.import.failedCount', 'Failed')}
                </p>
              </div>
            </div>

            {/* Results table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        #
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnName', 'Name')}
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnStatus', 'Status')}
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        {t('admin.businesses.import.columnDetails', 'Details')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.map((result) => (
                      <tr
                        key={result.row}
                        className="border-b border-slate-100 dark:border-slate-700/50"
                      >
                        <td className="py-3 px-4 text-slate-400">{result.row}</td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {result.name}
                        </td>
                        <td className="py-3 px-4">
                          {result.success ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="h-4 w-4" />
                              {t('admin.businesses.import.statusSuccess', 'Created')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                              <XCircleIcon className="h-4 w-4" />
                              {t('admin.businesses.import.statusFailed', 'Failed')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {result.success ? (
                            <Link
                              to={`${basePath}/businesses/${result.businessId}/edit`}
                              className="text-primary hover:underline"
                            >
                              {t('admin.businesses.import.editBusiness', 'Edit details')}
                            </Link>
                          ) : (
                            <span className="text-red-500 text-xs">{result.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                {t('admin.businesses.import.importMore', 'Import More Businesses')}
              </button>
              <Link
                to={`${basePath}/businesses`}
                className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('admin.businesses.import.viewBusinesses', 'View All Businesses')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
