/**
 * CategoryGrid Component
 * Displays categories in a responsive grid
 * WCAG 2.1 AA compliant, mobile-first
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Category } from '../../services/business-api';
import { Skeleton } from '../display/Skeleton';
import { EmptyState } from '../display/EmptyState';

interface CategoryGridProps {
  categories: Category[];
  loading?: boolean;
  error?: string | null;
}

export function CategoryGrid({ categories, loading = false, error = null }: CategoryGridProps) {
  const { t, i18n } = useTranslation();

  // Error state
  if (error) {
    return (
      <EmptyState
        title={t('category.errorTitle')}
        description={error}
        icon="⚠️"
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="category-grid" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{t('common.loading')}</span>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="category-card category-card--skeleton">
            <Skeleton variant="circular" width="48px" height="48px" />
            <Skeleton variant="text" width="80%" height="20px" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <EmptyState
        title={t('category.noCategoriesTitle')}
        description={t('category.noCategoriesDescription')}
        icon="📂"
      />
    );
  }

  return (
    <div className="category-grid">
      {categories.map(category => {
        const name = typeof category.name === 'string'
          ? category.name
          : category.name[i18n.language] || category.name.en;

        return (
          <Link
            key={category.id}
            to={`/businesses?category=${category.id}`}
            className="category-card"
          >
            {category.icon && (
              <span className="category-card__icon" aria-hidden="true">
                {category.icon}
              </span>
            )}
            <span className="category-card__name">{name}</span>
            {category.children && category.children.length > 0 && (
              <span className="category-card__count" aria-label={t('category.subcategories')}>
                {category.children.length}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
