import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from '../Badge';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders primary variant', () => {
    const { container } = render(<Badge variant="primary">New</Badge>);
    const badge = container.querySelector('.bg-primary');
    expect(badge).toBeInTheDocument();
  });

  it('renders success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });

  it('renders error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeInTheDocument();
  });

  it('renders small size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.querySelector('.text-xs');
    expect(badge).toBeInTheDocument();
  });

  it('renders large size', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    const badge = container.querySelector('.text-base');
    expect(badge).toBeInTheDocument();
  });

  it('renders dot variant', () => {
    const { container } = render(<Badge dot variant="primary">Content</Badge>);
    const dot = container.querySelector('.w-2.h-2');
    expect(dot).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge>Badge</Badge>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
