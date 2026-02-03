import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';

import { Button } from '../../components/ui/Button.js';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const button = within(container).getByRole('button');
    expect(button.className).toContain('bg-secondary');
    expect(button.className).toContain('text-white');
  });

  it('applies secondary variant classes', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = within(container).getByRole('button');
    expect(button.className).toContain('border-primary');
    expect(button.className).toContain('text-primary');
  });

  it('applies tertiary variant classes', () => {
    const { container } = render(<Button variant="tertiary">Tertiary</Button>);
    const button = within(container).getByRole('button');
    expect(button.className).toContain('bg-transparent');
  });

  it('has minimum 44px touch target height at md size', () => {
    const { container } = render(<Button size="md">Touch</Button>);
    const button = within(container).getByRole('button');
    expect(button.className).toContain('min-h-[2.75rem]');
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(<Button onClick={onClick}>Click</Button>);
    await user.click(within(container).getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    await user.click(within(container).getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders disabled state with correct attributes', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = within(container).getByRole('button');
    expect(button).toBeDisabled();
    expect(button.className).toContain('cursor-not-allowed');
  });

  it('shows loading state with spinner and aria-busy', () => {
    const { container } = render(<Button loading>Save</Button>);
    const button = within(container).getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(within(button).getByText('Loading...')).toBeInTheDocument();
  });

  it('does not call onClick when loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    await user.click(within(container).getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Full</Button>);
    const button = within(container).getByRole('button');
    expect(button.className).toContain('w-full');
  });

  it('forwards ref to button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('passes through extra HTML attributes', () => {
    render(<Button data-testid="custom">Extra</Button>);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });

  it('has focus-visible outline class for accessibility', () => {
    const { container } = render(<Button>Focus</Button>);
    const button = within(container).getByRole('button');
    expect(button.className).toContain('focus-visible:focus-ring');
  });
});
