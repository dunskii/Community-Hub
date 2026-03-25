/**
 * Header Component
 * Global navigation header with platform title, auth, language, and theme controls
 * WCAG 2.1 AA compliant
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  UserCircleIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  vi: 'Tiếng Việt',
  hi: 'हिन्दी',
  ur: 'اردو',
  ko: '한국어',
  el: 'Ελληνικά',
  it: 'Italiano',
};

interface HeaderProps {
  /** Platform name from config */
  platformName?: string;
  /** Platform logo URL */
  logoUrl?: string;
}

export function Header({
  platformName = 'Guildford South Community Hub',
  logoUrl,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLanguageChange = async (langCode: string) => {
    await changeLanguage(langCode);
    setLanguageMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  // Determine which dashboard link to show based on user role
  const getDashboardLink = () => {
    if (!isAuthenticated || !user) return null;
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return { href: '/admin', label: t('navigation.adminDashboard', 'Admin Dashboard') };
      case 'CURATOR':
        return { href: '/curator', label: t('navigation.curatorDashboard', 'Curator Dashboard') };
      case 'BUSINESS_OWNER':
        return { href: '/business/dashboard', label: t('navigation.businessDashboard', 'Business Dashboard') };
      default:
        return { href: '/dashboard', label: t('navigation.dashboard', 'Dashboard') };
    }
  };

  const dashboardLink = getDashboardLink();

  const navLinks = [
    { href: '/', label: t('navigation.home', 'Home') },
    { href: '/businesses', label: t('navigation.businesses', 'Businesses') },
    { href: '/events', label: t('navigation.events', 'Events') },
    { href: '/categories', label: t('navigation.categories', 'Categories') },
    ...(dashboardLink ? [dashboardLink] : []),
  ];

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-8 w-auto"
                />
              ) : (
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GS</span>
                </div>
              )}
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 hidden sm:block">
                {platformName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label={t('accessibility.mainNavigation', 'Main navigation')}
            className="hidden md:flex items-center space-x-1"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />

            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                aria-expanded={languageMenuOpen}
                aria-haspopup="true"
                aria-label={t('accessibility.selectLanguage', 'Select language')}
                className="flex items-center gap-1 px-2 py-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <GlobeAltIcon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium hidden sm:block">{currentLanguage.toUpperCase()}</span>
                <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Language Dropdown */}
              {languageMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentLanguage === lang
                          ? 'text-primary bg-primary/10 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      role="menuitem"
                    >
                      {LANGUAGE_NAMES[lang] || lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons - Always visible */}
            {isAuthenticated && user ? (
              /* User Menu (when authenticated) */
              <div className="flex items-center gap-2" ref={userMenuRef}>
                {/* User dropdown trigger */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-slate-400" />
                    )}
                    <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                      {user.displayName || user.email}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
                      role="menu"
                    >
                      {dashboardLink && (
                        <Link
                          to={dashboardLink.href}
                          className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {dashboardLink.label}
                        </Link>
                      )}
                      <Link
                        to="/saved"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('navigation.saved', 'Saved')}
                      </Link>
                      <Link
                        to="/messages"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t('navigation.messages', 'Messages')}
                      </Link>
                      <hr className="my-1 border-slate-200 dark:border-slate-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        role="menuitem"
                      >
                        {t('navigation.logout', 'Log Out')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button - always visible */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  {t('navigation.logout', 'Log Out')}
                </button>
              </div>
            ) : (
              /* Login Button (when not authenticated) */
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t('navigation.login', 'Log In')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={t('accessibility.toggleMenu', 'Toggle navigation menu')}
              className="md:hidden p-2 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label={t('accessibility.mobileNavigation', 'Mobile navigation')}
          className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActivePath(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-700 dark:text-slate-300 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <hr className="my-3 border-slate-200 dark:border-slate-700" />

            {/* Mobile Theme Toggle */}
            <div className="px-3 py-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 block">
                {t('theme.toggle', 'Theme')}
              </span>
              <ThemeToggle variant="segmented" size="sm" />
            </div>

            <hr className="my-3 border-slate-200 dark:border-slate-700" />

            {/* Mobile Auth Links */}
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/saved"
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('navigation.saved', 'Saved')}
                </Link>
                <Link
                  to="/messages"
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('navigation.messages', 'Messages')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('navigation.logout', 'Log Out')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('navigation.login', 'Log In')}
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('navigation.register', 'Sign Up')}
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
