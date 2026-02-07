import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BottomNavigation } from '../BottomNavigation';

expect.extend(toHaveNoViolations);

describe('BottomNavigation', () => {
  it('renders all navigation items', () => {
    render(<BottomNavigation />);
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Explore')).toBeInTheDocument();
    expect(screen.getByLabelText('Messages')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Menu')).toBeInTheDocument();
  });

  it('highlights active item', () => {
    render(<BottomNavigation currentPath="/businesses" />);
    const exploreLink = screen.getByLabelText('Explore');
    expect(exploreLink).toHaveAttribute('aria-current', 'page');
  });

  it('has minimum touch target size of 44px', () => {
    render(<BottomNavigation />);
    const homeLink = screen.getByLabelText('Home');
    const styles = window.getComputedStyle(homeLink);
    expect(styles.minWidth).toBe('44px');
    expect(styles.minHeight).toBe('44px');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BottomNavigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<BottomNavigation />);
    expect(screen.getByRole('navigation', { name: 'Bottom navigation' })).toBeInTheDocument();
  });
});
