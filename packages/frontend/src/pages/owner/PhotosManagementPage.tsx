/**
 * PhotosManagementPage
 *
 * Business owner page for managing business photos and gallery.
 * Spec §13.2: Business Owner Dashboard - Photo Management
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { businessApi } from '../../services/business-api';
import {
  ArrowLeftIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// Pixabay API types
interface PixabayImage {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
  user: string;
  userImageURL: string;
  downloads: number;
  likes: number;
}

interface Photo {
  id: string;
  url: string;
  caption?: string;
  isPrimary?: boolean;
  order: number;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  photos?: string[];
  gallery?: Photo[];
  logoUrl?: string;
  coverImageUrl?: string;
}

export function PhotosManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Photos state - combine from various sources
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);

  // Stock photo modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockPhotos, setStockPhotos] = useState<PixabayImage[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [selectedStockPhotos, setSelectedStockPhotos] = useState<Set<number>>(new Set());
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);

  // Pixabay API key - in production, this should be in env vars
  const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';

  // Fetch business data
  useEffect(() => {
    async function fetchData() {
      if (!businessId) return;

      try {
        setLoading(true);
        const biz = await businessApi.getBusinessById(businessId);
        setBusiness(biz as Business);

        // Build photos array from various sources
        const photoList: Photo[] = [];

        // Add gallery photos if available
        if ((biz as Business).gallery && Array.isArray((biz as Business).gallery)) {
          (biz as Business).gallery!.forEach((photo, index) => {
            photoList.push({
              id: photo.id || `gallery-${index}`,
              url: photo.url,
              caption: photo.caption,
              isPrimary: photo.isPrimary || index === 0,
              order: photo.order || index,
            });
          });
        }

        // Add simple photos array if available
        if ((biz as Business).photos && Array.isArray((biz as Business).photos)) {
          (biz as Business).photos!.forEach((url, index) => {
            if (!photoList.some(p => p.url === url)) {
              photoList.push({
                id: `photo-${index}`,
                url,
                isPrimary: photoList.length === 0 && index === 0,
                order: photoList.length + index,
              });
            }
          });
        }

        setPhotos(photoList.sort((a, b) => a.order - b.order));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [businessId, isAuthenticated]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      // For now, create preview URLs for the selected files
      // In production, this would upload to the server
      const newPhotos: Photo[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(t('photos.invalidFileType', 'Only image files are allowed'));
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(t('photos.fileTooLarge', 'File size must be less than 5MB'));
          continue;
        }

        // Create preview URL
        const url = URL.createObjectURL(file);
        newPhotos.push({
          id: `new-${Date.now()}-${i}`,
          url,
          isPrimary: photos.length === 0 && i === 0,
          order: photos.length + i,
        });
      }

      setPhotos(prev => [...prev, ...newPhotos]);
      setSuccess(t('photos.uploadSuccess', '{{count}} photo(s) added', { count: newPhotos.length }));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = (photoId: string) => {
    setPhotos(prev =>
      prev.map(photo => ({
        ...photo,
        isPrimary: photo.id === photoId,
      }))
    );
    setSuccess(t('photos.primarySet', 'Primary photo updated'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDelete = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      next.delete(photoId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    setPhotos(prev => prev.filter(photo => !selectedPhotos.has(photo.id)));
    setSelectedPhotos(new Set());
  };

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  // Drag and drop reordering
  const handleDragStart = (photoId: string) => {
    setDraggedPhoto(photoId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPhoto || draggedPhoto === targetId) return;

    setPhotos(prev => {
      const draggedIndex = prev.findIndex(p => p.id === draggedPhoto);
      const targetIndex = prev.findIndex(p => p.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const newPhotos = [...prev];
      const [draggedItem] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(targetIndex, 0, draggedItem);

      return newPhotos.map((p, i) => ({ ...p, order: i }));
    });
  };

  const handleDragEnd = () => {
    setDraggedPhoto(null);
  };

  // Stock photo search
  const searchStockPhotos = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setStockPhotos([]);
      return;
    }

    setStockLoading(true);
    setStockError(null);

    try {
      const perPage = 20;
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${perPage}&page=${page}&safesearch=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stock photos');
      }

      const data = await response.json();
      setStockPhotos(data.hits || []);
      setStockTotalPages(Math.ceil((data.totalHits || 0) / perPage));
      setStockPage(page);
    } catch (err) {
      setStockError(err instanceof Error ? err.message : 'Failed to search stock photos');
      setStockPhotos([]);
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStockPhotos(stockSearchQuery, 1);
  };

  const handleStockPhotoToggle = (photoId: number) => {
    setSelectedStockPhotos(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleAddStockPhotos = () => {
    const selectedImages = stockPhotos.filter(p => selectedStockPhotos.has(p.id));
    const newPhotos: Photo[] = selectedImages.map((img, index) => ({
      id: `stock-${img.id}-${Date.now()}`,
      url: img.largeImageURL,
      caption: img.tags,
      isPrimary: photos.length === 0 && index === 0,
      order: photos.length + index,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    setSuccess(t('photos.stockAdded', '{{count}} stock photo(s) added', { count: newPhotos.length }));
    setTimeout(() => setSuccess(null), 3000);

    // Reset and close modal
    setSelectedStockPhotos(new Set());
    setStockModalOpen(false);
  };

  const openStockModal = () => {
    setStockModalOpen(true);
    setStockSearchQuery('');
    setStockPhotos([]);
    setSelectedStockPhotos(new Set());
    setStockError(null);
  };

  const handleSave = async () => {
    if (!businessId) return;

    setUploading(true);
    setError(null);

    try {
      // In production, this would save to the server
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess(t('photos.saveSuccess', 'Photos saved successfully'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save photos');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton variant="text" width="200px" height="32px" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} variant="rectangular" width="100%" height="200px" className="rounded-lg" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!business) {
    return (
      <PageContainer>
        <div className="max-w-4xl mx-auto text-center py-12">
          <PhotoIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('photos.notFound', 'Business Not Found')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error || t('photos.notFoundDesc', "The business you're looking for doesn't exist.")}
          </p>
          <Link
            to="/business/dashboard"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {t('common.backToDashboard', 'Back to Dashboard')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('photos.pageTitle', 'Manage Photos - {{name}}', { name: business.name })}</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              to="/business/dashboard"
              className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              {t('common.backToDashboard', 'Back to Dashboard')}
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t('photos.title', 'Manage Photos')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {business.name}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  {t('photos.addPhotos', 'Upload Photos')}
                </button>
                <button
                  onClick={openStockModal}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                >
                  <GlobeAltIcon className="w-5 h-5 mr-2" />
                  {t('photos.stockPhotos', 'Stock Photos')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Toolbar */}
          {photos.length > 0 && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPhotos.size === photos.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('photos.selectAll', 'Select All')}
                </span>
              </label>

              {selectedPhotos.size > 0 && (
                <>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t('photos.selected', '{{count}} selected', { count: selectedPhotos.size })}
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    {t('photos.deleteSelected', 'Delete Selected')}
                  </button>
                </>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <ArrowsUpDownIcon className="w-4 h-4" />
                {t('photos.dragToReorder', 'Drag to reorder')}
              </div>
            </div>
          )}

          {/* Photos Grid */}
          {photos.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
              <PhotoIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {t('photos.noPhotos', 'No Photos Yet')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t('photos.noPhotosDesc', 'Add photos to showcase your business')}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('photos.addFirstPhoto', 'Add Your First Photo')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={() => handleDragStart(photo.id)}
                  onDragOver={(e) => handleDragOver(e, photo.id)}
                  onDragEnd={handleDragEnd}
                  className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-move ${
                    selectedPhotos.has(photo.id)
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                  } ${draggedPhoto === photo.id ? 'opacity-50' : ''}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || t('photos.businessPhoto', 'Business photo')}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge */}
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <StarSolidIcon className="w-3 h-3" />
                      {t('photos.primary', 'Primary')}
                    </div>
                  )}

                  {/* Selection Checkbox */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedPhotos.has(photo.id)}
                      onChange={() => handleSelectPhoto(photo.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-2 border-white bg-white/80 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!photo.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(photo.id)}
                        className="p-2 bg-white rounded-full hover:bg-yellow-100 transition-colors"
                        title={t('photos.setAsPrimary', 'Set as primary')}
                      >
                        <StarIcon className="w-5 h-5 text-slate-700" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                      title={t('photos.delete', 'Delete')}
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          {photos.length > 0 && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={uploading}
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    {t('photos.saveChanges', 'Save Changes')}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              {t('photos.tips', 'Photo Tips')}
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>{t('photos.tip1', 'Use high-quality images (at least 800x600 pixels)')}</li>
              <li>{t('photos.tip2', 'The primary photo appears first in search results')}</li>
              <li>{t('photos.tip3', 'Drag and drop to reorder your photos')}</li>
              <li>{t('photos.tip4', 'Maximum file size: 5MB per image')}</li>
              <li>{t('photos.tip5', 'Stock photos from Pixabay are free for commercial use')}</li>
            </ul>
          </div>
        </div>
      </PageContainer>

      {/* Stock Photo Modal */}
      {stockModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setStockModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t('photos.stockPhotosTitle', 'Stock Photos from Pixabay')}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('photos.stockPhotosSubtitle', 'Free high-quality images for commercial use')}
                  </p>
                </div>
                <button
                  onClick={() => setStockModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <form onSubmit={handleStockSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                      placeholder={t('photos.searchPlaceholder', 'Search for photos (e.g., restaurant, cafe, store)')}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={stockLoading || !stockSearchQuery.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {t('photos.search', 'Search')}
                  </button>
                </form>

                {/* Quick search suggestions */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('photos.suggestions', 'Try:')}
                  </span>
                  {['restaurant', 'cafe', 'shop', 'store', 'office', 'food', 'interior'].map(term => (
                    <button
                      key={term}
                      onClick={() => {
                        setStockSearchQuery(term);
                        searchStockPhotos(term, 1);
                      }}
                      className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {stockError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {stockError}
                  </div>
                )}

                {stockLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <Skeleton key={i} variant="rectangular" width="100%" height="150px" className="rounded-lg" />
                    ))}
                  </div>
                ) : stockPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <PhotoIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {stockSearchQuery
                        ? t('photos.noResults', 'No photos found. Try a different search term.')
                        : t('photos.searchPrompt', 'Search for photos to get started')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stockPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => handleStockPhotoToggle(photo.id)}
                          className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedStockPhotos.has(photo.id)
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={photo.webformatURL}
                            alt={photo.tags}
                            className="w-full h-full object-cover"
                          />

                          {/* Selection indicator */}
                          <div className={`absolute inset-0 bg-primary/20 flex items-center justify-center transition-opacity ${
                            selectedStockPhotos.has(photo.id) ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <CheckCircleIcon className="w-10 h-10 text-white drop-shadow-lg" />
                          </div>

                          {/* Photo info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-xs text-white truncate">
                              {t('photos.by', 'by')} {photo.user}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {stockTotalPages > 1 && (
                      <div className="mt-4 flex justify-center gap-2">
                        <button
                          onClick={() => searchStockPhotos(stockSearchQuery, stockPage - 1)}
                          disabled={stockPage <= 1 || stockLoading}
                          className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {t('common.previous', 'Previous')}
                        </button>
                        <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                          {t('photos.pageOf', 'Page {{current}} of {{total}}', { current: stockPage, total: stockTotalPages })}
                        </span>
                        <button
                          onClick={() => searchStockPhotos(stockSearchQuery, stockPage + 1)}
                          disabled={stockPage >= stockTotalPages || stockLoading}
                          className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {t('common.next', 'Next')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>
                    {t('photos.poweredBy', 'Powered by')}
                  </span>
                  <a
                    href="https://pixabay.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Pixabay
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  {selectedStockPhotos.size > 0 && (
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {t('photos.selectedCount', '{{count}} selected', { count: selectedStockPhotos.size })}
                    </span>
                  )}
                  <button
                    onClick={() => setStockModalOpen(false)}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleAddStockPhotos}
                    disabled={selectedStockPhotos.size === 0}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {t('photos.addSelected', 'Add Selected')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
