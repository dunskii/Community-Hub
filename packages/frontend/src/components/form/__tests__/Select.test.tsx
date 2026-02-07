import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Select } from '../Select';

expect.extend(toHaveNoViolations);

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Select', () => {
  it('renders with label', () => {
    render(<Select label="Choose option" options={mockOptions} />);
    expect(screen.getByLabelText('Choose option')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select label="Choose option" options={mockOptions} />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('renders placeholder', () => {
    render(<Select label="Choose option" options={mockOptions} placeholder="Select..." />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Select label="Choose option" options={mockOptions} error="Option is required" />);
    expect(screen.getByText('Option is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-invalid when error is present', () => {
    render(<Select label="Choose option" options={mockOptions} error="Option is required" />);
    const select = screen.getByLabelText('Choose option');
    expect(select).toHaveAttribute('aria-invalid', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Select label="Choose option" options={mockOptions} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<Select label="Choose option" options={mockOptions} disabled />);
    const select = screen.getByLabelText('Choose option');
    expect(select).toBeDisabled();
  });
});
