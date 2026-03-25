/**
 * HomePage
 * Phase 5: Search & Discovery - Homepage Discovery
 *
 * Main landing page with hero, search, and discovery sections
 */

import { useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection.js';
import { FeaturedBusinesses } from '../components/home/FeaturedBusinesses.js';
import { QuickFilters } from '../components/home/QuickFilters.js';
import { UpcomingEventsSection } from '../components/home/UpcomingEventsSection.js';
import { TodayDealsSection } from '../components/home/TodayDealsSection.js';

export function HomePage() {
  const navigate = useNavigate();

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

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Featured Businesses */}
        <FeaturedBusinesses />

        {/* Upcoming Events Section */}
        <UpcomingEventsSection />

        {/* Today's Deals Section */}
        <TodayDealsSection />
      </div>
    </div>
  );
}
