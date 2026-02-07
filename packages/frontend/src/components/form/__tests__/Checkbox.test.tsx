import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Checkbox } from '../Checkbox';

expect.extend(toHaveNoViolations);

describe('Checkbox', () => {
  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Checkbox label="Accept terms" error="You must accept the terms" />);
    expect(screen.getByText('You must accept the terms')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-invalid when error is present', () => {
    render(<Checkbox label="Accept terms" error="You must accept the terms" />);
    const checkbox = screen.getByLabelText('Accept terms');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Checkbox label="Accept terms" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<Checkbox label="Accept terms" disabled />);
    const checkbox = screen.getByLabelText('Accept terms');
    expect(checkbox).toBeDisabled();
  });

  it('renders checked state', () => {
    render(<Checkbox label="Accept terms" checked readOnly />);
    const checkbox = screen.getByLabelText('Accept terms');
    expect(checkbox).toBeChecked();
  });
});
