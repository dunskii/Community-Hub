import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Toast } from '../Toast';

expect.extend(toHaveNoViolations);

describe('Toast', () => {
  it('renders when isVisible is true', () => {
    render(<Toast message="Test message" isVisible={true} onClose={() => {}} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render when isVisible is false', () => {
    render(<Toast message="Test message" isVisible={false} onClose={() => {}} />);
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" isVisible={true} onClose={onClose} />);
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(<Toast message="Test message" isVisible={true} onClose={() => {}} />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders success type with correct styling', () => {
    const { container } = render(
      <Toast message="Success!" type="success" isVisible={true} onClose={() => {}} />
    );
    const toast = container.querySelector('.bg-green-50');
    expect(toast).toBeInTheDocument();
  });

  it('renders error type with correct styling', () => {
    const { container } = render(
      <Toast message="Error!" type="error" isVisible={true} onClose={() => {}} />
    );
    const toast = container.querySelector('.bg-red-50');
    expect(toast).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Toast message="Test message" isVisible={true} onClose={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
