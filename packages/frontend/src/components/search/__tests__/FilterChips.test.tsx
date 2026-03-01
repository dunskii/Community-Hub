/**
 * FilterChips Component Tests
 * Phase 5: Search & Discovery
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips } from '../FilterChips';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Simple mock translations
      if (key === 'distanceKm') return `${params?.distance} km`;
      if (key.startsWith('sort.')) return key.split('.')[1];
      if (key.startsWith('priceRangeLabels.')) return '$'.repeat(parseInt(key.split('.')[1]));
      return key;
    },
  }),
}));

describe('FilterChips', () => {
  const categories = [
    { slug: 'restaurants', name: 'Restaurants' },
    { slug: 'retail', name: 'Retail' },
  ];

  test('renders nothing when no filters are active', () => {
    const { container } = render(<FilterChips filters={{}} onRemoveFilter={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays category filter chip', () => {
    const filters = { category: 'restaurants' };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} categories={categories} />);

    expect(screen.getByText(/Restaurants/)).toBeInTheDocument();
  });

  test('displays distance filter chip', () => {
    const filters = { distance: 5 };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    expect(screen.getByText('5 km')).toBeInTheDocument();
  });

  test('displays rating filter chip', () => {
    const filters = { rating: 4 };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    expect(screen.getByText('4+ stars')).toBeInTheDocument();
  });

  test('displays sort filter chip (non-default)', () => {
    const filters = { sort: 'rating' as const };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    expect(screen.getByText(/rating/)).toBeInTheDocument();
  });

  test('does not display sort chip for default relevance', () => {
    const filters = { sort: 'relevance' as const };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    expect(screen.queryByText(/relevance/)).not.toBeInTheDocument();
  });

  test('displays boolean filter chips', () => {
    const filters = {
      openNow: true,
      verifiedOnly: true,
      hasPromotions: true,
      hasEvents: true,
    };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    expect(screen.getByText('openNow')).toBeInTheDocument();
    expect(screen.getByText('verifiedOnly')).toBeInTheDocument();
    expect(screen.getByText('hasPromotions')).toBeInTheDocument();
    expect(screen.getByText('hasEvents')).toBeInTheDocument();
  });

  test('displays price range filter chip', () => {
    const filters = { priceRange: [2, 3] };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    expect(screen.getByText(/\$\$/)).toBeInTheDocument();
  });

  test('calls onRemoveFilter when chip is clicked', async () => {
    const user = userEvent.setup();
    const onRemoveFilter = vi.fn();
    const filters = { category: 'restaurants' };

    render(<FilterChips filters={filters} onRemoveFilter={onRemoveFilter} categories={categories} />);

    const chip = screen.getByRole('button', { name: /Remove filter/ });
    await user.click(chip);

    expect(onRemoveFilter).toHaveBeenCalledWith('category');
  });

  test('displays Clear All button when multiple filters are active', () => {
    const filters = { category: 'restaurants', rating: 4 };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} onClearAll={vi.fn()} categories={categories} />);

    expect(screen.getByText('clearFilters')).toBeInTheDocument();
  });

  test('does not display Clear All button when only one filter is active', () => {
    const filters = { category: 'restaurants' };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} onClearAll={vi.fn()} categories={categories} />);

    expect(screen.queryByText('clearFilters')).not.toBeInTheDocument();
  });

  test('calls onClearAll when Clear All is clicked', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    const filters = { category: 'restaurants', rating: 4 };

    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} onClearAll={onClearAll} categories={categories} />);

    const clearButton = screen.getByText('clearFilters');
    await user.click(clearButton);

    expect(onClearAll).toHaveBeenCalled();
  });

  test('displays multiple chips for array filters', () => {
    const filters = {
      languages: ['English', 'Spanish'],
      certifications: ['Halal', 'Kosher'],
    };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} />);

    // Should have 4 chips total (2 languages + 2 certifications)
    const chips = screen.getAllByRole('button', { name: /Remove filter/ });
    expect(chips).toHaveLength(4);
  });

  test('has proper ARIA attributes', () => {
    const filters = { category: 'restaurants' };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} categories={categories} />);

    expect(screen.getByRole('group', { name: 'Active filters' })).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('Remove filter'));
  });

  test('displays category name from categories prop', () => {
    const filters = { category: 'restaurants' };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} categories={categories} />);

    expect(screen.getByText(/Restaurants/)).toBeInTheDocument();
  });

  test('displays category slug when category name not found', () => {
    const filters = { category: 'unknown-category' };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} categories={categories} />);

    expect(screen.getByText(/unknown-category/)).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const filters = { category: 'restaurants' };
    const { container } = render(
      <FilterChips filters={filters} onRemoveFilter={vi.fn()} categories={categories} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('renders chips with proper styling classes', () => {
    const filters = { category: 'restaurants' };
    render(<FilterChips filters={filters} onRemoveFilter={vi.fn()} categories={categories} />);

    const chip = screen.getByRole('button');
    expect(chip).toHaveClass('bg-primary-tint-90');
    expect(chip).toHaveClass('text-primary');
    expect(chip).toHaveClass('rounded-full');
  });
});
