/**
 * CategoryShowcase Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Grid of category cards for easy browsing
 * Fetches real categories from the API
 * Uses Heroicons for professional iconography
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  WrenchScrewdriverIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  TicketIcon,
  HeartIcon,
  BriefcaseIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useCategories } from '../../hooks/useCategories';
import { Skeleton } from '../display/Skeleton';

// Map category slugs to icons
const CategoryIcon: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'food-beverage': BuildingStorefrontIcon,
  restaurant: BuildingStorefrontIcon,
  retail: ShoppingBagIcon,
  services: WrenchScrewdriverIcon,
  health: PlusCircleIcon,
  education: AcademicCapIcon,
  entertainment: TicketIcon,
  fitness: HeartIcon,
  professional: BriefcaseIcon,
};

export function CategoryShowcase() {
  const { t, i18n } = useTranslation('home');
  const { categories, loading } = useCategories({ type: 'BUSINESS', active: true });

  // Get top-level categories (no parent) that have businesses
  const topCategories = categories
    .filter(cat => cat.parentId === null)
    .sort((a, b) => (b.businessCount ?? 0) - (a.businessCount ?? 0))
    .slice(0, 8);

  const getCategoryName = (cat: { name: string | Record<string, string> }): string => {
    if (typeof cat.name === 'string') return cat.name;
    return cat.name[i18n.language] || cat.name['en'] || Object.values(cat.name)[0] || '';
  };

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {t('categories.title', 'Browse by Category')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('categories.subtitle', 'Find exactly what you need')}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height="180px" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {topCategories.map((category) => {
            const Icon = CategoryIcon[category.slug] || BuildingStorefrontIcon;
            const name = getCategoryName(category);
            const cleanName = name.replace('[UNTRANSLATED] ', '');

            return (
              <a
                key={category.slug}
                href={`/businesses?category=${category.slug}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group border border-gray-100 dark:border-gray-700"
              >
                {/* Icon Container */}
                <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-30">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }}
                    />
                  </div>
                  <Icon className="w-16 h-16 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                    {cleanName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.businessCount ?? 0} {t('categories.businesses', 'businesses')}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* View All Categories Link */}
      <div className="mt-8 text-center">
        <a
          href="/businesses"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          {t('categories.viewAll', 'View All Categories')}
          <ArrowRightIcon className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}
