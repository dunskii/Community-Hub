import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Textarea } from '../Textarea';

expect.extend(toHaveNoViolations);

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Textarea label="Description" error="Description is required" />);
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<Textarea label="Description" helperText="Add a detailed description" />);
    expect(screen.getByText('Add a detailed description')).toBeInTheDocument();
  });

  it('shows character counter when enabled', () => {
    render(<Textarea label="Description" showCounter maxLength={100} />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('updates character counter on input', () => {
    render(<Textarea label="Description" showCounter maxLength={100} />);
    const textarea = screen.getByLabelText('Description');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('has aria-invalid when error is present', () => {
    render(<Textarea label="Description" error="Description is required" />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Textarea label="Description" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with error', async () => {
    const { container } = render(<Textarea label="Description" error="Description is required" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<Textarea label="Description" disabled />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea).toBeDisabled();
  });
});
