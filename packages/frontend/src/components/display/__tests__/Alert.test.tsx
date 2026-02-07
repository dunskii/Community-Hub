import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Alert } from '../Alert';

expect.extend(toHaveNoViolations);

describe('Alert', () => {
  it('renders message', () => {
    render(<Alert message="Test alert" type="info" />);
    expect(screen.getByText('Test alert')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Alert message="Test alert" title="Alert Title" type="info" />);
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('renders dismissible alert', () => {
    const onClose = vi.fn();
    render(<Alert message="Test alert" type="info" dismissible onClose={onClose} />);
    const closeButton = screen.getByLabelText('Dismiss alert');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders critical type with correct styling', () => {
    const { container } = render(<Alert message="Critical alert" type="critical" />);
    const alert = container.querySelector('.bg-red-50');
    expect(alert).toBeInTheDocument();
  });

  it('renders warning type with correct styling', () => {
    const { container } = render(<Alert message="Warning alert" type="warning" />);
    const alert = container.querySelector('.bg-orange-50');
    expect(alert).toBeInTheDocument();
  });

  it('has proper ARIA role', () => {
    render(<Alert message="Test alert" type="info" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Alert message="Test alert" type="info" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders actions when provided', () => {
    render(
      <Alert
        message="Test alert"
        type="info"
        actions={<button>Action</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
