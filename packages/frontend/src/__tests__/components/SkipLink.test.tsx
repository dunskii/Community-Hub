import { render, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SkipLink } from '../../components/ui/SkipLink.js';

describe('SkipLink', () => {
  it('renders a link with "Skip to main content" text', () => {
    const { container } = render(<SkipLink />);
    expect(within(container).getByText('Skip to main content')).toBeInTheDocument();
  });

  it('links to #main-content by default', () => {
    const { container } = render(<SkipLink />);
    const link = within(container).getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('links to custom target when specified', () => {
    const { container } = render(<SkipLink targetId="content" />);
    const link = within(container).getByText('Skip to main content');
    expect(link).toHaveAttribute('href', '#content');
  });

  it('is visually hidden by default (sr-only)', () => {
    const { container } = render(<SkipLink />);
    const link = within(container).getByText('Skip to main content');
    expect(link.className).toContain('sr-only');
  });

  it('becomes visible on focus (not-sr-only)', () => {
    const { container } = render(<SkipLink />);
    const link = within(container).getByText('Skip to main content');
    expect(link.className).toContain('focus:not-sr-only');
  });
});
