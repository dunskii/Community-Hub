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
  const { t } = useTranslation();
  const { categories, loading, error } = useCategories({ active: true, parent: 'null' });

  return (
    <PageContainer>
      <div className="categories-page">
        <header className="categories-page__header">
          <h1>{t('category.browseTitle')}</h1>
          <p className="categories-page__description">
            {t('category.browseDescription')}
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
