import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { RadioButton } from '../RadioButton';

expect.extend(toHaveNoViolations);

describe('RadioButton', () => {
  it('renders with label', () => {
    render(<RadioButton label="Option 1" name="options" />);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<RadioButton label="Option 1" name="options" error="Selection is required" />);
    expect(screen.getByText('Selection is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-invalid when error is present', () => {
    render(<RadioButton label="Option 1" name="options" error="Selection is required" />);
    const radio = screen.getByLabelText('Option 1');
    expect(radio).toHaveAttribute('aria-invalid', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RadioButton label="Option 1" name="options" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<RadioButton label="Option 1" name="options" disabled />);
    const radio = screen.getByLabelText('Option 1');
    expect(radio).toBeDisabled();
  });

  it('renders checked state', () => {
    render(<RadioButton label="Option 1" name="options" checked readOnly />);
    const radio = screen.getByLabelText('Option 1');
    expect(radio).toBeChecked();
  });
});
