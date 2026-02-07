import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Header } from '../Header';

expect.extend(toHaveNoViolations);

// Mock useLanguage hook
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    availableLanguages: ['en', 'ar', 'zh'],
    changeLanguage: vi.fn(),
  }),
}));

describe('Header', () => {
  it('renders logo and platform name', () => {
    render(<Header platformName="Guildford South Hub" />);
    expect(screen.getByAltText('Guildford South Hub logo')).toBeInTheDocument();
    expect(screen.getByText('Guildford South Hub')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Businesses')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
  });

  it('shows "List Your Business" CTA when not authenticated', () => {
    render(<Header isAuthenticated={false} />);
    expect(screen.getByText('List Your Business')).toBeInTheDocument();
  });

  it('shows user info when authenticated', () => {
    render(<Header isAuthenticated={true} userName="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('List Your Business')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle navigation menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Change language')).toBeInTheDocument();
  });
});
