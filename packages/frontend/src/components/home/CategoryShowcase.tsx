/**
 * CategoryShowcase Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Grid of category cards for easy browsing
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

export function CategoryShowcase() {
  const { t } = useTranslation('home');

  const categories = [
    {
      slug: 'restaurants',
      name: t('categories.restaurants'),
      icon: '🍽️',
      color: 'from-orange-400 to-orange-600',
      count: 45,
    },
    {
      slug: 'retail',
      name: t('categories.retail'),
      icon: '🛍️',
      color: 'from-pink-400 to-pink-600',
      count: 32,
    },
    {
      slug: 'services',
      name: t('categories.services'),
      icon: '🔧',
      color: 'from-blue-400 to-blue-600',
      count: 28,
    },
    {
      slug: 'health',
      name: t('categories.health'),
      icon: '🏥',
      color: 'from-green-400 to-green-600',
      count: 18,
    },
    {
      slug: 'education',
      name: t('categories.education'),
      icon: '📚',
      color: 'from-purple-400 to-purple-600',
      count: 15,
    },
    {
      slug: 'entertainment',
      name: t('categories.entertainment'),
      icon: '🎭',
      color: 'from-red-400 to-red-600',
      count: 12,
    },
    {
      slug: 'automotive',
      name: t('categories.automotive'),
      icon: '🚗',
      color: 'from-gray-400 to-gray-600',
      count: 10,
    },
    {
      slug: 'home',
      name: t('categories.home'),
      icon: '🏠',
      color: 'from-teal-400 to-teal-600',
      count: 14,
    },
  ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-dark mb-1">{t('categories.title')}</h2>
        <p className="text-neutral-dark">{t('categories.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <a
            key={category.slug}
            href={`/search?category=${category.slug}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            <div className={`h-32 bg-gradient-to-br ${category.color} flex items-center justify-center relative overflow-hidden`}>
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }} />
              </div>

              {/* Icon */}
              <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </span>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-dark mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-neutral-dark">
                {category.count} {t('categories.businesses')}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* View All Categories Link */}
      <div className="mt-8 text-center">
        <a
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-shade-10 transition-colors font-medium"
        >
          {t('categories.viewAll')}
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
