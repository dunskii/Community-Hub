import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Spinner } from '../../components/ui/Spinner.js';

describe('Spinner', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('is hidden from screen readers', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')?.className.baseVal).toContain('animate-spin');
  });

  it('applies size classes correctly', () => {
    const { container: sm } = render(<Spinner size="sm" />);
    expect(sm.querySelector('svg')?.className.baseVal).toContain('h-4');

    const { container: md } = render(<Spinner size="md" />);
    expect(md.querySelector('svg')?.className.baseVal).toContain('h-5');

    const { container: lg } = render(<Spinner size="lg" />);
    expect(lg.querySelector('svg')?.className.baseVal).toContain('h-6');
  });

  it('applies additional className', () => {
    const { container } = render(<Spinner className="text-white" />);
    expect(container.querySelector('svg')?.className.baseVal).toContain('text-white');
  });
});
