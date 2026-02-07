import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface HeaderProps {
  /** Platform logo URL from config */
  logoUrl?: string;
  /** Platform name from config */
  platformName?: string;
  /** Show "List Your Business" CTA */
  showListBusinessCTA?: boolean;
  /** User authentication state */
  isAuthenticated?: boolean;
  /** User display name */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string;
}

export function Header({
  logoUrl = '/logo.svg',
  platformName = 'Community Hub',
  showListBusinessCTA = true,
  isAuthenticated = false,
  userName,
  userAvatar,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentLanguage } = useLanguage();

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 bg-white shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img
                src={logoUrl}
                alt={`${platformName} logo`}
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-bold text-primary hidden sm:block">
                {platformName}
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center space-x-8"
          >
            <a href="/" className="text-dark hover:text-primary transition-colors">
              Home
            </a>
            <a href="/businesses" className="text-dark hover:text-primary transition-colors">
              Businesses
            </a>
            <a href="/events" className="text-dark hover:text-primary transition-colors">
              Events
            </a>
            <a href="/community" className="text-dark hover:text-primary transition-colors">
              Community
            </a>
            <a href="/deals" className="text-dark hover:text-primary transition-colors">
              Deals
            </a>
          </nav>

          {/* Right Side: Language Selector + CTA + User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                aria-label="Change language"
                className="flex items-center text-dark hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              >
                <span className="text-sm font-medium">{currentLanguage.toUpperCase()}</span>
              </button>
            </div>

            {/* List Your Business CTA */}
            {showListBusinessCTA && !isAuthenticated && (
              <a
                href="/list-business"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-shade-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                List Your Business
              </a>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center">
                <img
                  src={userAvatar || '/default-avatar.png'}
                  alt={userName || 'User'}
                  className="h-8 w-8 rounded-full"
                />
                <span className="ml-2 text-sm text-dark">{userName}</span>
              </div>
            ) : (
              <a
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-secondary hover:bg-secondary-shade-10 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
              >
                Log In
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="text-dark hover:text-primary transition-colors p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden bg-white border-t border-neutral-medium"
        >
          <div className="px-4 py-4 space-y-2">
            <a href="/" className="block py-2 text-dark hover:text-primary transition-colors">
              Home
            </a>
            <a href="/businesses" className="block py-2 text-dark hover:text-primary transition-colors">
              Businesses
            </a>
            <a href="/events" className="block py-2 text-dark hover:text-primary transition-colors">
              Events
            </a>
            <a href="/community" className="block py-2 text-dark hover:text-primary transition-colors">
              Community
            </a>
            <a href="/deals" className="block py-2 text-dark hover:text-primary transition-colors">
              Deals
            </a>
            {!isAuthenticated && (
              <>
                <a href="/list-business" className="block py-2 text-secondary hover:text-secondary-shade-20 transition-colors font-semibold">
                  List Your Business
                </a>
                <a href="/login" className="block py-2 text-primary hover:text-primary-shade-20 transition-colors">
                  Log In
                </a>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
