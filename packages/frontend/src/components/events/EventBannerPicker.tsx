/**
 * EventBannerPicker
 *
 * Allows admin to set an event banner via:
 * 1. File upload (local preview)
 * 2. Pixabay stock image search
 * 3. Manual URL entry
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PhotoIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { proxyStockImage, searchStockPhotos } from '../../services/image-proxy';
import type { StockPhotoHit } from '../../services/image-proxy';

interface EventBannerPickerProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

type PickerMode = 'none' | 'upload' | 'pixabay' | 'url';

export function EventBannerPicker({ value, onChange, error }: EventBannerPickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<PickerMode>('none');
  const [pixabayQuery, setPixabayQuery] = useState('');
  const [pixabayResults, setPixabayResults] = useState<StockPhotoHit[]>([]);
  const [pixabayLoading, setPixabayLoading] = useState(false);
  const [pixabayError, setPixabayError] = useState<string | null>(null);
  const [pixabayDownloading, setPixabayDownloading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);
    setMode('none');
  }, [onChange]);

  const searchPixabay = useCallback(async () => {
    if (!pixabayQuery.trim()) return;

    setPixabayLoading(true);
    setPixabayError(null);

    try {
      const data = await searchStockPhotos(pixabayQuery.trim(), {
        perPage: 12,
        orientation: 'horizontal',
        minWidth: 800,
      });
      setPixabayResults(data.hits);

      if (data.hits.length === 0) {
        setPixabayError(t('events.banner.noResults', 'No images found. Try a different search term.'));
      }
    } catch (err) {
      setPixabayError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setPixabayLoading(false);
    }
  }, [pixabayQuery, t]);

  const handlePixabaySelect = useCallback(async (hit: StockPhotoHit) => {
    setPixabayDownloading(true);
    setPixabayError(null);

    try {
      // Use largeImageURL for better quality — backend will process/resize
      const localPath = await proxyStockImage(hit.largeImageURL, 'event');
      onChange(localPath);
      setMode('none');
      setPixabayResults([]);
      setPixabayQuery('');
    } catch (err) {
      setPixabayError(err instanceof Error ? err.message : t('events.banner.downloadError', 'Failed to download stock image'));
    } finally {
      setPixabayDownloading(false);
    }
  }, [onChange, t]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      try {
        new URL(urlInput.trim());
        onChange(urlInput.trim());
        setMode('none');
      } catch {
        // invalid URL - don't submit
      }
    }
  }, [urlInput, onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    setUrlInput('');
  }, [onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('events.banner.label', 'Event Banner Image')}
      </label>

      {/* Current Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={value}
            alt={t('events.banner.preview', 'Banner preview')}
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label={t('events.banner.remove', 'Remove banner')}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Source Buttons */}
      {!value && mode === 'none' && (
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors text-gray-600 dark:text-gray-300"
          >
            <PhotoIcon className="h-6 w-6" />
            <span className="text-xs font-medium">{t('events.banner.upload', 'Upload')}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('pixabay')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors text-gray-600 dark:text-gray-300"
          >
            <MagnifyingGlassIcon className="h-6 w-6" />
            <span className="text-xs font-medium">{t('events.banner.stockImage', 'Stock Image')}</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('url')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors text-gray-600 dark:text-gray-300"
          >
            <LinkIcon className="h-6 w-6" />
            <span className="text-xs font-medium">{t('events.banner.fromUrl', 'From URL')}</span>
          </button>
        </div>
      )}

      {/* Change button when image is set */}
      {value && mode === 'none' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <PhotoIcon className="h-3.5 w-3.5 inline mr-1" />
            {t('events.banner.upload', 'Upload')}
          </button>
          <button
            type="button"
            onClick={() => setMode('pixabay')}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5 inline mr-1" />
            {t('events.banner.stockImage', 'Stock Image')}
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LinkIcon className="h-3.5 w-3.5 inline mr-1" />
            {t('events.banner.fromUrl', 'From URL')}
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label={t('events.banner.uploadFile', 'Upload banner image')}
      />

      {/* Pixabay Search Panel */}
      {mode === 'pixabay' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('events.banner.searchStockImages', 'Search Stock Images')}
            </h3>
            <button
              type="button"
              onClick={() => { setMode('none'); setPixabayResults([]); setPixabayError(null); }}
              className="text-gray-400 hover:text-gray-600"
              aria-label={t('common.close')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={pixabayQuery}
              onChange={(e) => setPixabayQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchPixabay(); } }}
              placeholder={t('events.banner.searchPlaceholder', 'e.g. community, park, festival...')}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              aria-label={t('events.banner.searchStockImages', 'Search Stock Images')}
            />
            <button
              type="button"
              onClick={searchPixabay}
              disabled={pixabayLoading || !pixabayQuery.trim()}
              className="px-3 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {pixabayLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <MagnifyingGlassIcon className="h-4 w-4" />}
            </button>
          </div>

          {pixabayError && (
            <p className="text-xs text-red-500">{pixabayError}</p>
          )}

          {pixabayResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {pixabayResults.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => handlePixabaySelect(hit)}
                  disabled={pixabayDownloading}
                  className="relative aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-teal-500 focus:border-teal-500 focus:outline-none transition-colors disabled:opacity-50"
                >
                  <img
                    src={hit.webformatURL}
                    alt={hit.tags}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {pixabayResults.length > 0 && (
            <p className="text-[10px] text-gray-400 text-center">
              Images by <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="underline">Pixabay</a>
            </p>
          )}
        </div>
      )}

      {/* URL Input Panel */}
      {mode === 'url' && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('events.banner.enterUrl', 'Enter Image URL')}
            </h3>
            <button
              type="button"
              onClick={() => setMode('none')}
              className="text-gray-400 hover:text-gray-600"
              aria-label={t('common.close')}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              aria-label={t('events.banner.enterUrl', 'Enter Image URL')}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      )}
    </div>
  );
}
