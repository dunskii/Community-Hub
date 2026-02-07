import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DatePicker } from '../DatePicker';

expect.extend(toHaveNoViolations);

describe('DatePicker', () => {
  it('renders with label', () => {
    render(<DatePicker label="Select date" />);
    expect(screen.getByLabelText('Select date')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<DatePicker label="Select date" error="Date is required" />);
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<DatePicker label="Select date" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<DatePicker label="Select date" disabled />);
    const input = screen.getByLabelText('Select date');
    expect(input).toBeDisabled();
  });
});
