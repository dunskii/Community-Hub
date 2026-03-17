import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ErrorBoundary } from '../ErrorBoundary';

expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'errorBoundary.title': 'Something went wrong',
        'errorBoundary.message': "We're sorry, but something unexpected happened. Please try again.",
        'errorBoundary.details': 'Error details',
        'errorBoundary.tryAgain': 'Try again',
        'errorBoundary.goHome': 'Go to home',
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

// Component that throws an error
interface ThrowErrorProps {
  shouldThrow?: boolean;
}

function ThrowError({ shouldThrow = true }: ThrowErrorProps) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="child-content">Child content</div>;
}

// Suppress console.error for cleaner test output
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    );
  };

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('when error occurs', () => {
    it('should render fallback UI when child throws', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display error message', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something unexpected happened/i)).toBeInTheDocument();
    });

    it('should have Try again button', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should have Go to home button', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      renderWithRouter(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error</div>}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('error callback', () => {
    it('should call onError when error is caught', () => {
      const onError = vi.fn();

      renderWithRouter(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should pass error message to callback', () => {
      const onError = vi.fn();

      renderWithRouter(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      const [error] = onError.mock.calls[0];
      expect(error.message).toBe('Test error');
    });
  });

  describe('retry functionality', () => {
    it('should reset error state when Try again is clicked', () => {
      let shouldThrow = true;

      function ConditionalThrow() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="recovered">Recovered content</div>;
      }

      const { rerender } = renderWithRouter(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      );

      // Error state shown
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Fix the error
      shouldThrow = false;

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));

      // Re-render with fixed component
      rerender(
        <MemoryRouter>
          <ErrorBoundary>
            <ConditionalThrow />
          </ErrorBoundary>
        </MemoryRouter>
      );

      // Should show recovered content
      expect(screen.getByTestId('recovered')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations in error state', async () => {
      const { container } = renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have role="alert" on error container', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have accessible buttons with proper labels', () => {
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const goHomeButton = screen.getByRole('button', { name: /go to home/i });

      expect(tryAgainButton).toBeInTheDocument();
      expect(goHomeButton).toBeInTheDocument();
    });
  });

  describe('development mode', () => {
    it('should not expose error details in production', () => {
      // In test environment, NODE_ENV is 'test' not 'development'
      // so error details should not be shown by default
      renderWithRouter(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error details summary should not be visible in non-development mode
      expect(screen.queryByText('Error details')).not.toBeInTheDocument();
    });
  });

  describe('multiple errors', () => {
    it('should handle multiple errors gracefully', () => {
      function MultiError() {
        throw new Error('First error');
      }

      renderWithRouter(
        <ErrorBoundary>
          <MultiError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});
