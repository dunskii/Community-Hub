/**
 * AdminBusinessCreatePage
 *
 * Page for admins/curators to create a new business listing.
 * Collects required fields, then redirects to edit page for further details.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { businessApi, type Category } from '../../services/business-api';

export function AdminBusinessCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/curator') ? '/curator' : '/admin';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryPrimaryId: '',
    phone: '',
    email: '',
    website: '',
    street: '',
    suburb: '',
    state: '',
    postcode: '',
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.name.trim()) {
      setError(t('admin.businesses.create.nameRequired', 'Business name is required'));
      return;
    }
    if (!formData.categoryPrimaryId) {
      setError(t('admin.businesses.create.categoryRequired', 'Category is required'));
      return;
    }
    if (!formData.phone.trim()) {
      setError(t('admin.businesses.create.phoneRequired', 'Phone number is required'));
      return;
    }
    if (!formData.street.trim() || !formData.suburb.trim() || !formData.state.trim() || !formData.postcode.trim()) {
      setError(t('admin.businesses.create.addressRequired', 'Full address is required'));
      return;
    }

    try {
      setLoading(true);
      const business = await businessApi.createBusiness({
        name: formData.name.trim(),
        description: { en: formData.description.trim() },
        categoryPrimaryId: formData.categoryPrimaryId,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: {
          street: formData.street.trim(),
          suburb: formData.suburb.trim(),
          state: formData.state.trim(),
          postcode: formData.postcode.trim(),
          country: 'Australia',
        },
      });

      // Redirect to edit page for further details
      navigate(`${basePath}/businesses/${business.id}/edit`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.businesses.create.failed', 'Failed to create business'));
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary";

  return (
    <PageContainer>
      <Helmet>
        <title>{t('admin.businesses.create.title', 'Add Business')} | {basePath === '/curator' ? 'Curator' : 'Admin'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        <Link to={`${basePath}/businesses`} className="inline-flex items-center text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          {t('admin.businesses.backToBusinesses', 'Back to Businesses')}
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {t('admin.businesses.create.title', 'Add Business')}
        </h1>

        {error && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
          {/* Business Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('admin.businesses.create.name', 'Business Name')} *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className={inputClasses}
              placeholder={t('admin.businesses.create.namePlaceholder', 'Enter business name')}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('admin.businesses.create.description', 'Description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={inputClasses}
              placeholder={t('admin.businesses.create.descriptionPlaceholder', 'Brief description of the business')}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryPrimaryId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('admin.businesses.create.category', 'Category')} *
            </label>
            <select
              id="categoryPrimaryId"
              name="categoryPrimaryId"
              required
              value={formData.categoryPrimaryId}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">{t('admin.businesses.create.selectCategory', 'Select a category')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {typeof cat.name === 'string' ? cat.name : (cat.name as Record<string, string>).en || cat.id}
                </option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('admin.businesses.create.phone', 'Phone')} *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className={inputClasses}
              placeholder={t('admin.businesses.create.phonePlaceholder', 'e.g. (02) 9632 1234')}
            />
          </div>

          {/* Email & Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.businesses.create.email', 'Email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClasses}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.businesses.create.website', 'Website')}
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className={inputClasses}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Address */}
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('admin.businesses.create.address', 'Address')} *
            </legend>
            <div className="space-y-3">
              <input
                name="street"
                type="text"
                required
                value={formData.street}
                onChange={handleChange}
                className={inputClasses}
                placeholder={t('admin.businesses.create.streetPlaceholder', 'Street address')}
                aria-label={t('admin.businesses.create.street', 'Street address')}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <input
                  name="suburb"
                  type="text"
                  required
                  value={formData.suburb}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder={t('admin.businesses.create.suburbPlaceholder', 'Suburb')}
                  aria-label={t('admin.businesses.create.suburb', 'Suburb')}
                />
                <input
                  name="state"
                  type="text"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder={t('admin.businesses.create.statePlaceholder', 'State')}
                  aria-label={t('admin.businesses.create.state', 'State')}
                />
                <input
                  name="postcode"
                  type="text"
                  required
                  value={formData.postcode}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder={t('admin.businesses.create.postcodePlaceholder', 'Postcode')}
                  aria-label={t('admin.businesses.create.postcode', 'Postcode')}
                />
              </div>
            </div>
          </fieldset>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to={`${basePath}/businesses`}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('admin.businesses.create.creating', 'Creating...')
                : t('admin.businesses.create.submit', 'Create Business')
              }
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
