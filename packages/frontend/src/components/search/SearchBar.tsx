/**
 * SearchBar Component
 * Phase 5: Search & Discovery
 *
 * Search input with autocomplete suggestions
 * Displays recent searches (authenticated users) and popular searches
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getAutocompleteSuggestions } from '../../services/search-api.js';
import { logger } from '../../utils/logger.js';
import type { AutocompleteResponse } from '@community-hub/shared';

export interface SearchBarProps {
  /** Current search query */
  value?: string;
  /** Callback when search query changes */
  onChange?: (value: string) => void;
  /** Callback when search is submitted */
  onSubmit?: (query: string) => void;
  /** Callback when suggestion is selected */
  onSuggestionSelect?: (suggestion: { type: 'business' | 'recent' | 'popular'; id?: string; name: string }) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show autocomplete dropdown */
  showAutocomplete?: boolean;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Custom CSS class */
  className?: string;
}

export function SearchBar({
  value = '',
  onChange,
  onSubmit,
  onSuggestionSelect,
  placeholder,
  showAutocomplete = true,
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number>();

  // Update local state when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Fetch autocomplete suggestions (debounced)
  useEffect(() => {
    if (!showAutocomplete || query.trim().length < 2) {
      setSuggestions(null);
      setIsOpen(false);
      return;
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await getAutocompleteSuggestions(query.trim(), 10);
        setSuggestions(results);
        setIsOpen(true);
      } catch (error) {
        logger.error('Autocomplete failed', error instanceof Error ? error : undefined);
        setSuggestions(null);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, showAutocomplete, debounceMs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedIndex(-1);
    onChange?.(newValue);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit?.(query.trim());
      setIsOpen(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: { type: 'business' | 'recent' | 'popular'; id?: string; name: string }) => {
    setQuery(suggestion.name);
    setIsOpen(false);
    onSuggestionSelect?.(suggestion);
  };

  // Get all suggestions as flat list
  const allSuggestions = suggestions
    ? [
        ...suggestions.recentSearches.map(name => ({ type: 'recent' as const, name })),
        ...suggestions.popularSearches.map(name => ({ type: 'popular' as const, name })),
        ...suggestions.suggestions.map(s => ({ type: 'business' as const, id: s.id, name: s.name })),
      ]
    : [];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allSuggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < allSuggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(allSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-neutral-dark"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="search"
            role="searchbox"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions && query.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder || t('search.placeholder')}
            aria-label={t('search.label')}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={isOpen}
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
            className="block w-full pl-10 pr-3 py-2 border border-neutral-medium rounded-md leading-5 bg-white placeholder-neutral-dark text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
          />

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="animate-spin h-5 w-5 text-neutral-dark"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions && (
        <div
          ref={dropdownRef}
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        >
          {/* Recent Searches */}
          {suggestions.recentSearches.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-neutral-dark bg-neutral-light">
                {t('search.recentSearches')}
              </div>
              {suggestions.recentSearches.map((name, index) => {
                const flatIndex = index;
                return (
                  <button
                    key={`recent-${index}`}
                    id={`suggestion-${flatIndex}`}
                    role="option"
                    aria-selected={selectedIndex === flatIndex}
                    onClick={() => handleSuggestionClick({ type: 'recent', name })}
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-light flex items-center ${
                      selectedIndex === flatIndex ? 'bg-neutral-light' : ''
                    }`}
                  >
                    <svg className="h-4 w-4 text-neutral-dark mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Popular Searches */}
          {suggestions.popularSearches.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-neutral-dark bg-neutral-light">
                {t('search.popularSearches')}
              </div>
              {suggestions.popularSearches.map((name, index) => {
                const flatIndex = suggestions.recentSearches.length + index;
                return (
                  <button
                    key={`popular-${index}`}
                    id={`suggestion-${flatIndex}`}
                    role="option"
                    aria-selected={selectedIndex === flatIndex}
                    onClick={() => handleSuggestionClick({ type: 'popular', name })}
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-light flex items-center ${
                      selectedIndex === flatIndex ? 'bg-neutral-light' : ''
                    }`}
                  >
                    <svg className="h-4 w-4 text-neutral-dark mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Business Suggestions */}
          {suggestions.suggestions.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-neutral-dark bg-neutral-light">
                {t('search.businesses')}
              </div>
              {suggestions.suggestions.map((suggestion, index) => {
                const flatIndex = suggestions.recentSearches.length + suggestions.popularSearches.length + index;
                return (
                  <button
                    key={`business-${suggestion.id}`}
                    id={`suggestion-${flatIndex}`}
                    role="option"
                    aria-selected={selectedIndex === flatIndex}
                    onClick={() => handleSuggestionClick({ type: 'business', id: suggestion.id, name: suggestion.name })}
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-light ${
                      selectedIndex === flatIndex ? 'bg-neutral-light' : ''
                    }`}
                  >
                    <div className="font-medium text-dark">{suggestion.name}</div>
                    <div className="text-xs text-neutral-dark">{suggestion.categoryName}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {suggestions.recentSearches.length === 0 &&
            suggestions.popularSearches.length === 0 &&
            suggestions.suggestions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-neutral-dark">
                {t('search.noSuggestions')}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
