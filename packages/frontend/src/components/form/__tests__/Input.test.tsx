import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../Input';

expect.extend(toHaveNoViolations);

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<Input label="Email" helperText="We'll never share your email" />);
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it('has aria-invalid when error is present', () => {
    render(<Input label="Email" error="Email is required" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('has aria-describedby linking to error', () => {
    render(<Input label="Email" error="Email is required" />);
    const input = screen.getByLabelText('Email');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent('Email is required');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Input label="Email" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with error', async () => {
    const { container } = render(<Input label="Email" error="Email is required" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders disabled state', () => {
    render(<Input label="Email" disabled />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeDisabled();
  });
});
