import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LiveRegion } from '../LiveRegion';

expect.extend(toHaveNoViolations);

describe('LiveRegion', () => {
  it('renders message', () => {
    render(<LiveRegion message="Test announcement" />);
    expect(screen.getByText('Test announcement')).toBeInTheDocument();
  });

  it('has polite aria-live by default', () => {
    const { container } = render(<LiveRegion message="Test announcement" />);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();
  });

  it('supports assertive aria-live', () => {
    const { container } = render(<LiveRegion message="Test announcement" politeness="assertive" />);
    const region = container.querySelector('[aria-live="assertive"]');
    expect(region).toBeInTheDocument();
  });

  it('has status role by default', () => {
    render(<LiveRegion message="Test announcement" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('supports alert role', () => {
    render(<LiveRegion message="Test announcement" role="alert" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-atomic="true"', () => {
    const { container } = render(<LiveRegion message="Test announcement" />);
    const region = container.querySelector('[aria-atomic="true"]');
    expect(region).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<LiveRegion message="Test announcement" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('does not render when message is empty', () => {
    const { container } = render(<LiveRegion message="" />);
    expect(container.firstChild).toBeNull();
  });
});
