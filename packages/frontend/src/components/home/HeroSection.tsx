/**
 * HeroSection Component
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Hero section with background image and prominent search bar
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SearchBar } from '../search/SearchBar.js';
import { getPlatformConfig } from '@community-hub/shared';

export interface HeroSectionProps {
  /** Callback when search is submitted */
  onSearch: (query: string) => void;
  /** Callback when suggestion is selected */
  onSuggestionSelect: (suggestion: { type: string; id?: string; name: string }) => void;
}

export function HeroSection({ onSearch, onSuggestionSelect }: HeroSectionProps) {
  const { t } = useTranslation('home');
  const config = getPlatformConfig();

  return (
    <section
      className="relative bg-primary-shade-20 text-white overflow-hidden"
      style={{ minHeight: '500px' }}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-shade-30 via-primary-shade-20 to-primary opacity-90 z-10" />

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            {t('hero.title', { platformName: config.platformName })}
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl mb-8 text-white opacity-95">
            {t('hero.subtitle', { location: config.location.suburb })}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSubmit={onSearch}
              onSuggestionSelect={onSuggestionSelect}
              placeholder={t('hero.searchPlaceholder')}
              showAutocomplete={true}
              className="shadow-2xl"
            />
          </div>

          {/* CTA Text */}
          <p className="mt-6 text-sm sm:text-base text-white opacity-90">
            {t('hero.cta')}
          </p>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          className="w-full h-12 sm:h-16"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C300,80 600,80 900,40 C1050,20 1150,0 1200,0 L1200,120 L0,120 Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
