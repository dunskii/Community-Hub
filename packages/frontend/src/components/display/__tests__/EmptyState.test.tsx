import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EmptyState } from '../EmptyState';

expect.extend(toHaveNoViolations);

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No results found" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No results found"
        description="Try adjusting your search filters"
      />
    );
    expect(screen.getByText('Try adjusting your search filters')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        title="No results found"
        action={<button>Create New</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No results found"
        icon={<svg data-testid="custom-icon" />}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EmptyState title="No results found" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
