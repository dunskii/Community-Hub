/**
 * CategoriesPage
 * Browse all business categories
 * WCAG 2.1 AA compliant
 */

import { useTranslation } from 'react-i18next';
import { PageContainer } from '../components/layout/PageContainer';
import { CategoryGrid } from '../components/business/CategoryGrid';
import { useCategories } from '../hooks/useCategories';

export function CategoriesPage() {
  const { t } = useTranslation('category');
  const { categories, loading, error } = useCategories({ active: true, parent: 'null', withBusinesses: true });

  return (
    <PageContainer>
      <div className="py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {t('browseTitle', 'Browse Categories')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('browseDescription', 'Explore businesses by category')}
          </p>
        </header>

        <CategoryGrid
          categories={categories}
          loading={loading}
          error={error}
        />
      </div>
    </PageContainer>
  );
}
