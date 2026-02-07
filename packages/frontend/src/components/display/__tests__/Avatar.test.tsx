import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Avatar } from '../Avatar';

expect.extend(toHaveNoViolations);

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar name="John Doe" src="/avatar.jpg" alt="John's avatar" />);
    const img = screen.getByAltText("John's avatar");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/avatar.jpg');
  });

  it('renders initials when no src provided', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('has proper ARIA label for initials avatar', () => {
    render(<Avatar name="John Doe" />);
    const avatar = screen.getByLabelText("John Doe's avatar");
    expect(avatar).toBeInTheDocument();
  });

  it('renders small size', () => {
    const { container } = render(<Avatar name="John Doe" size="sm" />);
    const avatar = container.querySelector('.w-8');
    expect(avatar).toBeInTheDocument();
  });

  it('renders large size', () => {
    const { container } = render(<Avatar name="John Doe" size="lg" />);
    const avatar = container.querySelector('.w-12');
    expect(avatar).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Avatar name="John Doe" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with image', async () => {
    const { container } = render(<Avatar name="John Doe" src="/avatar.jpg" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
