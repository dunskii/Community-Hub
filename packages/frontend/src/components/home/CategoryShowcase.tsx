/**
 * CategoryShowcase Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Grid of category cards for easy browsing
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
  TruckIcon,
  HomeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Category icon component mapping
const CategoryIcon: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  restaurants: BuildingStorefrontIcon,
  retail: ShoppingBagIcon,
  services: WrenchScrewdriverIcon,
  health: PlusCircleIcon,
  education: AcademicCapIcon,
  entertainment: TicketIcon,
  automotive: TruckIcon,
  home: HomeIcon,
};

export function CategoryShowcase() {
  const { t } = useTranslation('home');

  const categories = [
    {
      slug: 'restaurants',
      name: t('categories.restaurants', 'Restaurants'),
      count: 45,
    },
    {
      slug: 'retail',
      name: t('categories.retail', 'Retail'),
      count: 32,
    },
    {
      slug: 'services',
      name: t('categories.services', 'Services'),
      count: 28,
    },
    {
      slug: 'health',
      name: t('categories.health', 'Health'),
      count: 18,
    },
    {
      slug: 'education',
      name: t('categories.education', 'Education'),
      count: 15,
    },
    {
      slug: 'entertainment',
      name: t('categories.entertainment', 'Entertainment'),
      count: 12,
    },
    {
      slug: 'automotive',
      name: t('categories.automotive', 'Automotive'),
      count: 10,
    },
    {
      slug: 'home',
      name: t('categories.home', 'Home'),
      count: 14,
    },
  ];

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = CategoryIcon[category.slug] || BuildingStorefrontIcon;

          return (
            <a
              key={category.slug}
              href={`/search?category=${category.slug}`}
              className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group border border-gray-100 dark:border-gray-700"
            >
              {/* Icon Container - Uses primary color with opacity */}
              <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-30">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  />
                </div>

                {/* Icon */}
                <Icon className="w-16 h-16 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.count} {t('categories.businesses', 'businesses')}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {/* View All Categories Link */}
      <div className="mt-8 text-center">
        <a
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          {t('categories.viewAll', 'View All Categories')}
          <ArrowRightIcon className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}
