import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Footer } from '../Footer';

expect.extend(toHaveNoViolations);

describe('Footer', () => {
  it('renders platform links', () => {
    render(<Footer />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Businesses')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('renders legal links', () => {
    render(<Footer />);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
  });

  it('renders newsletter signup', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('renders copyright with current year', () => {
    render(<Footer platformName="Guildford South Hub" />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}.*Guildford South Hub`))).toBeInTheDocument();
  });

  it('renders social links when provided', () => {
    const socialLinks = [
      { platform: 'Facebook', url: 'https://facebook.com/test' },
      { platform: 'Twitter', url: 'https://twitter.com/test' },
    ];
    render(<Footer socialLinks={socialLinks} />);
    expect(screen.getByLabelText('Follow us on Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow us on Twitter')).toBeInTheDocument();
  });

  it('renders partner logos when provided', () => {
    const partnerLogos = [
      { name: 'Partner 1', url: '/partner1.png', altText: 'Partner 1 logo' },
    ];
    render(<Footer partnerLogos={partnerLogos} />);
    expect(screen.getByAltText('Partner 1 logo')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Footer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
