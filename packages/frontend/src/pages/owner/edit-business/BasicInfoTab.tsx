/**
 * BasicInfoTab
 *
 * Business name, description, categories, price range, and year established.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FormSection } from './FormSection';
import { PRICE_RANGES, INPUT_CLASS_NAME, LABEL_CLASS_NAME } from './constants';
import type { TabProps } from './types';
import type { Category } from '../../../services/business-api';

interface BasicInfoTabProps extends TabProps {
  categories: Category[];
  onSecondaryCategoryToggle: (categoryId: string) => void;
}

export function BasicInfoTab({ formData, handleInputChange, t, categories, onSecondaryCategoryToggle }: BasicInfoTabProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  // Build a flat list of categories with parent context for display
  const categoryOptions = useMemo(() => {
    const parents = categories.filter(c => !c.parentId);
    const result: Array<{ id: string; label: string; parentId: string | null }> = [];

    for (const parent of parents) {
      const parentName = typeof parent.name === 'string' ? parent.name : (parent.name[lang] || parent.name.en || parent.slug);
      result.push({ id: parent.id, label: parentName, parentId: null });

      // Add children indented
      const children = categories.filter(c => c.parentId === parent.id);
      for (const child of children) {
        const childName = typeof child.name === 'string' ? child.name : (child.name[lang] || child.name.en || child.slug);
        result.push({ id: child.id, label: `  ${childName}`, parentId: parent.id });
      }
    }

    // Also add any categories without parents that aren't already included
    const includedIds = new Set(result.map(r => r.id));
    for (const cat of categories) {
      if (!includedIds.has(cat.id)) {
        const catName = typeof cat.name === 'string' ? cat.name : (cat.name[lang] || cat.name.en || cat.slug);
        result.push({ id: cat.id, label: catName, parentId: cat.parentId });
      }
    }

    return result;
  }, [categories, lang]);

  // Categories available as secondary (exclude the primary)
  const secondaryOptions = useMemo(
    () => categoryOptions.filter(c => c.id !== formData.categoryPrimaryId),
    [categoryOptions, formData.categoryPrimaryId]
  );

  return (
    <div className="space-y-6">
      <FormSection title={t('editBusiness.basicInfo', 'Basic Information')}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.name', 'Business Name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={100}
              className={INPUT_CLASS_NAME}
            />
          </div>

          <div>
            <label htmlFor="description" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.description', 'Short Description')} *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              maxLength={500}
              className={INPUT_CLASS_NAME}
            />
            <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500</p>
          </div>

          <div>
            <label htmlFor="detailedDescription" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.detailedDescription', 'Detailed Description')}
            </label>
            <textarea
              id="detailedDescription"
              name="detailedDescription"
              value={formData.detailedDescription}
              onChange={handleInputChange}
              rows={5}
              maxLength={2000}
              className={INPUT_CLASS_NAME}
            />
            <p className="text-xs text-slate-500 mt-1">{formData.detailedDescription.length}/2000</p>
          </div>
        </div>
      </FormSection>

      {/* Categories Section */}
      {categoryOptions.length > 0 && (
        <FormSection title={t('editBusiness.categories', 'Categories')}>
          <div className="space-y-4">
            <div>
              <label htmlFor="categoryPrimaryId" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.primaryCategory', 'Primary Category')} *
              </label>
              <select
                id="categoryPrimaryId"
                name="categoryPrimaryId"
                value={formData.categoryPrimaryId}
                onChange={handleInputChange}
                required
                className={INPUT_CLASS_NAME}
              >
                <option value="">{t('editBusiness.fields.selectCategory', 'Select a category...')}</option>
                {categoryOptions.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {t('editBusiness.fields.primaryCategoryHint', 'The main category your business belongs to')}
              </p>
            </div>

            <div>
              <label htmlFor="secondaryCategory" className={LABEL_CLASS_NAME}>
                {t('editBusiness.fields.secondaryCategories', 'Secondary Categories')}
              </label>
              <p className="text-xs text-slate-500 mb-2">
                {t('editBusiness.fields.secondaryCategoriesHint', 'Select up to 3 additional categories (max 3)')}
              </p>
              <select
                id="secondaryCategory"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onSecondaryCategoryToggle(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={formData.categoriesSecondary.length >= 3}
                className={INPUT_CLASS_NAME}
              >
                <option value="">
                  {formData.categoriesSecondary.length >= 3
                    ? t('editBusiness.fields.maxCategoriesReached', 'Maximum 3 categories selected')
                    : t('editBusiness.fields.addCategory', 'Add a category...')}
                </option>
                {secondaryOptions
                  .filter(cat => !formData.categoriesSecondary.includes(cat.id))
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label.trim()}
                    </option>
                  ))}
              </select>

              {/* Selected secondary categories as removable chips */}
              {formData.categoriesSecondary.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.categoriesSecondary.map(catId => {
                    const cat = categoryOptions.find(c => c.id === catId);
                    return (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                      >
                        {cat?.label.trim() || catId}
                        <button
                          type="button"
                          onClick={() => onSecondaryCategoryToggle(catId)}
                          className="hover:text-red-500 transition-colors"
                          aria-label={t('editBusiness.fields.removeCategory', 'Remove category')}
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FormSection>
      )}

      {/* Price Range & Year */}
      <FormSection title={t('editBusiness.businessDetails', 'Business Details')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="priceRange" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.priceRange', 'Price Range')}
            </label>
            <select
              id="priceRange"
              name="priceRange"
              value={formData.priceRange}
              onChange={handleInputChange}
              className={INPUT_CLASS_NAME}
            >
              <option value="">Select...</option>
              {PRICE_RANGES.map(range => (
                <option key={range} value={range}>
                  {t(`editBusiness.priceRange.${range.toLowerCase()}`, range)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="yearEstablished" className={LABEL_CLASS_NAME}>
              {t('editBusiness.fields.yearEstablished', 'Year Established')}
            </label>
            <input
              type="number"
              id="yearEstablished"
              name="yearEstablished"
              value={formData.yearEstablished}
              onChange={handleInputChange}
              min={1800}
              max={new Date().getFullYear()}
              className={INPUT_CLASS_NAME}
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
