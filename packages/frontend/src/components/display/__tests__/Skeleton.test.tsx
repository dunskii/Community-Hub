import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Skeleton } from '../Skeleton';

expect.extend(toHaveNoViolations);

describe('Skeleton', () => {
  it('renders text variant by default', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('.rounded.h-4');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" width={40} height={40} />);
    const skeleton = container.querySelector('.rounded-full');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" width={200} height={100} />);
    const skeleton = container.querySelector('.rounded');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders multiple text lines', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    const skeletons = container.querySelectorAll('.bg-gray-200');
    expect(skeletons).toHaveLength(3);
  });

  it('has proper ARIA attributes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector('[aria-busy="true"]');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Skeleton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
