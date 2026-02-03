import { render, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { FormField } from '../../components/ui/FormField.js';

describe('FormField', () => {
  it('renders label with htmlFor linking to input', () => {
    const { container } = render(
      <FormField label="Email" id="email">
        <input id="email" type="email" />
      </FormField>,
    );
    const label = within(container).getByText('Email');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('renders children (input element)', () => {
    const { container } = render(
      <FormField label="Name" id="name">
        <input id="name" type="text" data-testid="name-input" />
      </FormField>,
    );
    expect(container.querySelector('[data-testid="name-input"]')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    const { container } = render(
      <FormField label="Password" id="password" required>
        <input id="password" type="password" />
      </FormField>,
    );
    expect(within(container).getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator when not required', () => {
    const { container } = render(
      <FormField label="Bio" id="bio">
        <textarea id="bio" />
      </FormField>,
    );
    expect(within(container).queryByText('*')).not.toBeInTheDocument();
  });

  it('shows error message with role alert', () => {
    const { container } = render(
      <FormField label="Email" id="email" error="Invalid email address">
        <input id="email" type="email" />
      </FormField>,
    );
    const errorMessage = within(container).getByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid email address');
  });

  it('shows hint text when no error', () => {
    const { container } = render(
      <FormField label="Username" id="username" hint="Must be 3-20 characters">
        <input id="username" type="text" />
      </FormField>,
    );
    expect(within(container).getByText('Must be 3-20 characters')).toBeInTheDocument();
  });

  it('hides hint when error is shown', () => {
    const { container } = render(
      <FormField label="Username" id="username" hint="Must be 3-20 characters" error="Too short">
        <input id="username" type="text" />
      </FormField>,
    );
    expect(within(container).queryByText('Must be 3-20 characters')).not.toBeInTheDocument();
    expect(within(container).getByText('Too short')).toBeInTheDocument();
  });

  it('applies additional className to wrapper', () => {
    const { container } = render(
      <FormField label="Test" id="test" className="mb-4">
        <input id="test" />
      </FormField>,
    );
    expect(container.firstChild).toHaveClass('mb-4');
  });

  it('links error to input via aria-describedby', () => {
    const { container } = render(
      <FormField label="Email" id="email" error="Invalid email">
        <input id="email" type="email" />
      </FormField>,
    );
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('links hint to input via aria-describedby', () => {
    const { container } = render(
      <FormField label="Username" id="username" hint="Choose a unique name">
        <input id="username" type="text" />
      </FormField>,
    );
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('aria-describedby', 'username-hint');
  });

  it('sets aria-invalid on input when error is present', () => {
    const { container } = render(
      <FormField label="Email" id="email" error="Required">
        <input id="email" type="email" />
      </FormField>,
    );
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when no error', () => {
    const { container } = render(
      <FormField label="Email" id="email">
        <input id="email" type="email" />
      </FormField>,
    );
    const input = container.querySelector('input')!;
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('does not set aria-describedby when no error or hint', () => {
    const { container } = render(
      <FormField label="Name" id="name">
        <input id="name" type="text" />
      </FormField>,
    );
    const input = container.querySelector('input')!;
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
