import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Toggle } from '../Toggle';

expect.extend(toHaveNoViolations);

describe('Toggle', () => {
  it('renders with label', () => {
    render(<Toggle label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Toggle label="Enable notifications" error="Toggle is required" />);
    expect(screen.getByText('Toggle is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has role="switch"', () => {
    render(<Toggle label="Enable notifications" />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('has aria-checked attribute', () => {
    render(<Toggle label="Enable notifications" checked readOnly />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Toggle label="Enable notifications" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<Toggle label="Enable notifications" disabled />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
  });

  it('renders checked state', () => {
    render(<Toggle label="Enable notifications" checked readOnly />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
  });
});
