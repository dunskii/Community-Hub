/**
 * HomePage
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Main landing page with hero, search, and discovery sections
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger.js';
import { SearchBar } from '../components/search/SearchBar.js';
import { HeroSection } from '../components/home/HeroSection.js';
import { StatsStrip } from '../components/home/StatsStrip.js';
import { FeaturedBusinesses } from '../components/home/FeaturedBusinesses.js';
import { NearYouSection } from '../components/home/NearYouSection.js';
import { HighlyRatedSection } from '../components/home/HighlyRatedSection.js';
import { NewBusinessesSection } from '../components/home/NewBusinessesSection.js';
import { CategoryShowcase } from '../components/home/CategoryShowcase.js';
import { QuickFilters } from '../components/home/QuickFilters.js';
import { UpcomingEventsSection } from '../components/home/UpcomingEventsSection.js';

export function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          logger.debug('Geolocation not available', { message: error.message });
          // Continue without location - Near You section will be hidden
        }
      );
    }
  }, []);

  // Handle search submission
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: { type: string; id?: string; name: string }) => {
    if (suggestion.type === 'business' && suggestion.id) {
      navigate(`/businesses/${suggestion.id}`);
    } else {
      handleSearch(suggestion.name);
    }
  };

  // Handle quick filter click
  const handleQuickFilter = (filter: { category?: string; openNow?: boolean; verifiedOnly?: boolean }) => {
    const params = new URLSearchParams();
    if (filter.category) params.set('category', filter.category);
    if (filter.openNow) params.set('openNow', 'true');
    if (filter.verifiedOnly) params.set('verifiedOnly', 'true');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <HeroSection
        onSearch={handleSearch}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {/* Quick Filter Chips */}
      <QuickFilters onFilterClick={handleQuickFilter} />

      {/* Stats Strip */}
      <StatsStrip />

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Featured Businesses Carousel */}
        <FeaturedBusinesses />

        {/* Near You Section (conditional on geolocation) */}
        {userLocation && (
          <NearYouSection
            latitude={userLocation.lat}
            longitude={userLocation.lng}
          />
        )}

        {/* Upcoming Events Section */}
        <UpcomingEventsSection />

        {/* Highly Rated Section */}
        <HighlyRatedSection />

        {/* New Businesses Section */}
        <NewBusinessesSection />

        {/* Category Showcase */}
        <CategoryShowcase />
      </div>
    </div>
  );
}
