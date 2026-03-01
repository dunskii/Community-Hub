/**
 * SearchBar Component Tests
 * Phase 5: Search & Discovery
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';
import * as searchApi from '../../../services/search-api';

// Mock search API
vi.mock('../../../services/search-api', () => ({
  getAutocompleteSuggestions: vi.fn(),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders search input', () => {
    render(<SearchBar />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  test('displays placeholder text', () => {
    render(<SearchBar />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'search.placeholder');
  });

  test('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar onChange={onChange} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    expect(onChange).toHaveBeenCalledWith('p');
    expect(onChange).toHaveBeenCalledWith('pi');
    expect(onChange).toHaveBeenCalledWith('piz');
    expect(onChange).toHaveBeenCalledWith('pizz');
    expect(onChange).toHaveBeenCalledWith('pizza');
  });

  test('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SearchBar onSubmit={onSubmit} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('pizza');
  });

  test('fetches autocomplete suggestions when typing', async () => {
    const user = userEvent.setup();
    const mockSuggestions = {
      suggestions: [
        { type: 'business' as const, id: '1', name: 'Pizza Place', categoryName: 'Restaurants' },
      ],
      recentSearches: ['coffee'],
      popularSearches: ['restaurant'],
    };

    vi.mocked(searchApi.getAutocompleteSuggestions).mockResolvedValue(mockSuggestions);

    render(<SearchBar showAutocomplete={true} debounceMs={100} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    await waitFor(
      () => {
        expect(searchApi.getAutocompleteSuggestions).toHaveBeenCalledWith('pizza', 10);
      },
      { timeout: 500 }
    );
  });

  test('displays autocomplete dropdown with suggestions', async () => {
    const user = userEvent.setup();
    const mockSuggestions = {
      suggestions: [
        { type: 'business' as const, id: '1', name: 'Pizza Place', categoryName: 'Restaurants' },
      ],
      recentSearches: ['coffee'],
      popularSearches: ['restaurant'],
    };

    vi.mocked(searchApi.getAutocompleteSuggestions).mockResolvedValue(mockSuggestions);

    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    expect(screen.getByText('Pizza Place')).toBeInTheDocument();
    expect(screen.getByText('coffee')).toBeInTheDocument();
    expect(screen.getByText('restaurant')).toBeInTheDocument();
  });

  test('calls onSuggestionSelect when suggestion is clicked', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();
    const mockSuggestions = {
      suggestions: [
        { type: 'business' as const, id: '1', name: 'Pizza Place', categoryName: 'Restaurants' },
      ],
      recentSearches: [],
      popularSearches: [],
    };

    vi.mocked(searchApi.getAutocompleteSuggestions).mockResolvedValue(mockSuggestions);

    render(<SearchBar showAutocomplete={true} debounceMs={50} onSuggestionSelect={onSuggestionSelect} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    await waitFor(() => {
      expect(screen.getByText('Pizza Place')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Pizza Place'));

    expect(onSuggestionSelect).toHaveBeenCalledWith({
      type: 'business',
      id: '1',
      name: 'Pizza Place',
    });
  });

  test('supports keyboard navigation in dropdown', async () => {
    const user = userEvent.setup();
    const mockSuggestions = {
      suggestions: [
        { type: 'business' as const, id: '1', name: 'Pizza Place', categoryName: 'Restaurants' },
        { type: 'business' as const, id: '2', name: 'Pizza Hut', categoryName: 'Restaurants' },
      ],
      recentSearches: [],
      popularSearches: [],
    };

    vi.mocked(searchApi.getAutocompleteSuggestions).mockResolvedValue(mockSuggestions);

    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    await waitFor(() => {
      expect(screen.getByText('Pizza Place')).toBeInTheDocument();
    });

    // Arrow down should select first item
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-0');

    // Arrow down should select second item
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-1');

    // Arrow up should go back to first
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-0');
  });

  test('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    const mockSuggestions = {
      suggestions: [
        { type: 'business' as const, id: '1', name: 'Pizza Place', categoryName: 'Restaurants' },
      ],
      recentSearches: [],
      popularSearches: [],
    };

    vi.mocked(searchApi.getAutocompleteSuggestions).mockResolvedValue(mockSuggestions);

    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  test('does not fetch suggestions for queries less than 2 characters', async () => {
    const user = userEvent.setup();
    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'p');

    await waitFor(() => {
      expect(searchApi.getAutocompleteSuggestions).not.toHaveBeenCalled();
    });
  });

  test('shows loading spinner while fetching', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    vi.mocked(searchApi.getAutocompleteSuggestions).mockReturnValue(promise as Promise<any>);

    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    await waitFor(() => {
      const spinner = screen.getByRole('searchbox').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    resolvePromise!({
      suggestions: [],
      recentSearches: [],
      popularSearches: [],
    });
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(searchApi.getAutocompleteSuggestions).mockRejectedValue(new Error('API Error'));

    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'pizza');

    // Should not crash or show error to user
    await waitFor(() => {
      expect(searchApi.getAutocompleteSuggestions).toHaveBeenCalled();
    });
  });

  test('displays "No suggestions" when empty results', async () => {
    const user = userEvent.setup();
    const mockSuggestions = {
      suggestions: [],
      recentSearches: [],
      popularSearches: [],
    };

    vi.mocked(searchApi.getAutocompleteSuggestions).mockResolvedValue(mockSuggestions);

    render(<SearchBar showAutocomplete={true} debounceMs={50} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'xyzabc');

    await waitFor(() => {
      expect(screen.getByText('search.noSuggestions')).toBeInTheDocument();
    });
  });
});
