/**
 * Main App Component
 *
 * Root component with routing and authentication provider.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPlatformConfig } from './config/platform-loader';
import type { PlatformConfig } from '@community-hub/shared';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { SkipLink } from './components/ui/index';
import { GlobalShortcuts, OfflineHandler } from './components/app/index';
import { ErrorBoundary } from './components/error/index';
import { BusinessListPage } from './pages/BusinessListPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SavedBusinessesPage } from './pages/SavedBusinessesPage';
import { FollowingPage } from './pages/FollowingPage';
import { ModerationPage } from './pages/ModerationPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { AnalyticsDashboardPage } from './pages/owner/AnalyticsDashboardPage';
import { ClaimBusinessPage } from './pages/owner/ClaimBusinessPage';
import { EditBusinessPage } from './pages/owner/EditBusinessPage';
import { PhotosManagementPage } from './pages/owner/PhotosManagementPage';
import { EventsListingPage } from './pages/events/EventsListingPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { BusinessInboxPage } from './pages/owner/BusinessInboxPage';
import { Layout } from './components/layout/Layout';
import {
  BuildingStorefrontIcon,
  CakeIcon,
  BuildingOffice2Icon,
  HeartIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  ShoppingBagIcon,
  ScissorsIcon,
} from '@heroicons/react/24/outline';

// Category icon mapping
const CategoryIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  restaurants: BuildingStorefrontIcon,
  cafes: CakeIcon,
  medical: BuildingOffice2Icon,
  fitness: HeartIcon,
  pharmacy: BeakerIcon,
  electronics: ComputerDesktopIcon,
  bakery: ShoppingBagIcon,
  hairBeauty: ScissorsIcon,
};

// HomePage component with i18n and platform config
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  useEffect(() => {
    // Try to get cached config, or use defaults
    try {
      setConfig(getPlatformConfig());
    } catch {
      // Config not loaded yet, use defaults
    }
  }, []);

  const platformName = config?.platform?.id === 'guildford-south'
    ? 'Guildford South Community Hub'
    : (config?.platform?.id || t('defaultPlatformName', 'Community Hub'));
  const locationName = config?.location?.suburbName || t('defaultLocation', 'your area');

  const categories = [
    { nameKey: 'restaurants', slug: 'restaurant' },
    { nameKey: 'cafes', slug: 'cafe' },
    { nameKey: 'medical', slug: 'medical' },
    { nameKey: 'fitness', slug: 'fitness' },
    { nameKey: 'pharmacy', slug: 'pharmacy' },
    { nameKey: 'electronics', slug: 'electronics' },
    { nameKey: 'bakery', slug: 'bakery' },
    { nameKey: 'hairBeauty', slug: 'haircut-salon' },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary-shade-20 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('hero.welcome', `Welcome to ${platformName}`, { platformName })}
          </h1>
          <p className="text-xl mb-8 opacity-90">
            {t('hero.subtitle', `Discover local businesses, events, and deals in ${locationName}`, { location: locationName })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/businesses')}
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              {t('hero.browseBusinesses', 'Browse Businesses')}
            </button>
            <button
              onClick={() => navigate('/categories')}
              className="bg-primary-shade-10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-shade-20 transition border-2 border-white/30"
            >
              {t('hero.viewCategories', 'View Categories')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-primary mb-2">8+</div>
            <div className="text-gray-600 dark:text-gray-400">{t('stats.businesses', 'Local Businesses')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-primary mb-2">8</div>
            <div className="text-gray-600 dark:text-gray-400">{t('stats.categories', 'Categories')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-primary mb-2">10</div>
            <div className="text-gray-600 dark:text-gray-400">{t('stats.languages', 'Languages Supported')}</div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{t('categories.title', 'Popular Categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = CategoryIcons[category.nameKey] || BuildingStorefrontIcon;
            return (
              <button
                key={category.slug}
                onClick={() => navigate(`/businesses?category=${category.slug}`)}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition text-center group border border-gray-100 dark:border-gray-700"
              >
                <Icon className="w-10 h-10 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                  {t(`categories.${category.nameKey}`, category.nameKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-secondary text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta.title', `Own a business in ${locationName}?`, { location: locationName })}</h2>
          <p className="text-xl mb-8 opacity-90">
            {t('cta.subtitle', 'Claim your business listing and connect with the community')}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-secondary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            {t('cta.button', 'Get Started')}
          </button>
        </div>
      </div>
    </>
  );
};

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Quick links for dashboard
  const quickLinks = [
    { href: '/saved', label: t('navigation.saved', 'Saved Businesses'), icon: '❤️' },
    { href: '/following', label: t('navigation.following', 'Following'), icon: '👥' },
    { href: '/messages', label: t('navigation.messages', 'Messages'), icon: '💬' },
  ];

  // Business owner links
  const ownerLinks = [
    { href: '/owner/dashboard', label: t('navigation.businessDashboard', 'Business Dashboard'), icon: '📊' },
    { href: '/claim-business', label: t('navigation.claimBusiness', 'Claim a Business'), icon: '🏪' },
  ];

  const isBusinessOwner = user?.role === 'BUSINESS_OWNER' || user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        {t('dashboard.welcome', 'Welcome back')}, {user?.displayName || 'User'}!
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        {t('dashboard.subtitle', 'Manage your account and explore the community.')}
      </p>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((link) => (
          <button
            key={link.href}
            onClick={() => navigate(link.href)}
            className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary hover:shadow-md transition-all text-left"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="font-medium text-slate-900 dark:text-white">{link.label}</span>
          </button>
        ))}
      </div>

      {/* Business Owner Section */}
      {isBusinessOwner && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            {t('dashboard.businessTools', 'Business Tools')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ownerLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="flex items-center gap-3 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 hover:border-primary hover:shadow-md transition-all text-left"
              >
                <span className="text-2xl">{link.icon}</span>
                <span className="font-medium text-slate-900 dark:text-white">{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t('dashboard.accountInfo', 'Account Information')}
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">{t('dashboard.email', 'Email')}</dt>
            <dd className="text-slate-900 dark:text-white">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500 dark:text-slate-400">{t('dashboard.role', 'Account Type')}</dt>
            <dd className="text-slate-900 dark:text-white capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</dd>
          </div>
        </dl>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          {t('navigation.logout', 'Log Out')}
        </button>
      </div>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider position="top-right" maxVisible={3}>
          <AuthProvider>
            <GlobalShortcuts>
            <OfflineHandler>
            <ErrorBoundary>
            <SkipLink />
            <Layout>
              <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Business Directory Routes */}
            <Route path="/businesses" element={<BusinessListPage />} />
            <Route path="/businesses/:slug" element={<BusinessDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedBusinessesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/following"
              element={
                <ProtectedRoute>
                  <FollowingPage />
                </ProtectedRoute>
              }
            />

            {/* Owner Dashboard Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute>
                  <OwnerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/business/:businessId/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/business/:businessId/edit"
              element={
                <ProtectedRoute>
                  <EditBusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/business/:businessId/photos"
              element={
                <ProtectedRoute>
                  <PhotosManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/business/:businessId/inbox"
              element={
                <ProtectedRoute>
                  <BusinessInboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/business/:businessId/inbox/:conversationId"
              element={
                <ProtectedRoute>
                  <BusinessInboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claim/:businessId"
              element={
                <ProtectedRoute>
                  <ClaimBusinessPage />
                </ProtectedRoute>
              }
            />

            {/* Events Routes */}
            <Route path="/events" element={<EventsListingPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />

            {/* Messaging Routes */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/moderation"
              element={
                <AdminProtectedRoute>
                  <ModerationPage />
                </AdminProtectedRoute>
              }
            />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
            </ErrorBoundary>
            </OfflineHandler>
            </GlobalShortcuts>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
