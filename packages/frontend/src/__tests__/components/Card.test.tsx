import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Card } from '../../components/ui/Card.js';

describe('Card', () => {
  it('renders children content', () => {
    const { getByText } = render(<Card>Card content</Card>);
    expect(getByText('Card content')).toBeInTheDocument();
  });

  it('has white background and rounded corners', () => {
    const { container } = render(<Card>Styled</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('bg-white');
    expect(card.className).toContain('rounded-md');
  });

  it('has card shadow', () => {
    const { container } = render(<Card>Shadow</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('shadow-card');
  });

  it('adds hover shadow and lift when hoverable', () => {
    const { container } = render(<Card hoverable>Hover</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('hover:shadow-card-hover');
    expect(card.className).toContain('hover:-translate-y-0.5');
  });

  it('does not add hover shadow by default', () => {
    const { container } = render(<Card>No hover</Card>);
    const card = container.firstElementChild!;
    expect(card.className).not.toContain('hover:shadow-card-hover');
  });

  it('renders as custom element via as prop', () => {
    const { container } = render(<Card as="section">Section card</Card>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    const { container } = render(<Card className="mt-4">Custom class</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('mt-4');
  });

  it('has padding', () => {
    const { container } = render(<Card>Padded</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain('p-4');
  });
});
