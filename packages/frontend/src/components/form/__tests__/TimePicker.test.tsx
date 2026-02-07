import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TimePicker } from '../TimePicker';

expect.extend(toHaveNoViolations);

describe('TimePicker', () => {
  it('renders with label', () => {
    render(<TimePicker label="Select time" />);
    expect(screen.getByLabelText('Select time')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<TimePicker label="Select time" error="Time is required" />);
    expect(screen.getByText('Time is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TimePicker label="Select time" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<TimePicker label="Select time" disabled />);
    const input = screen.getByLabelText('Select time');
    expect(input).toBeDisabled();
  });
});
