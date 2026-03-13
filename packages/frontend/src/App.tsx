/**
 * Main App Component
 *
 * Root component with routing and authentication provider.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadPlatformConfig, getPlatformConfig } from './config/platform-loader';
import type { PlatformConfig } from '@community-hub/shared';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { SkipLink } from './components/ui/index';
import { BusinessListPage } from './pages/BusinessListPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SavedBusinessesPage } from './pages/SavedBusinessesPage';
import { FollowingPage } from './pages/FollowingPage';
import { ModerationPage } from './pages/ModerationPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { AnalyticsDashboardPage } from './pages/owner/AnalyticsDashboardPage';
import { ClaimBusinessPage } from './pages/owner/ClaimBusinessPage';
import { EventsListingPage } from './pages/events/EventsListingPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { BusinessInboxPage } from './pages/owner/BusinessInboxPage';

// HomePage component with i18n and platform config
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [config, setConfig] = useState<PlatformConfig | null>(null);

  useEffect(() => {
    // Try to get cached config, or use defaults
    try {
      setConfig(getPlatformConfig());
    } catch {
      // Config not loaded yet, use defaults
    }
  }, []);

  const platformName = config?.platform?.name || t('home.defaultPlatformName', 'Community Hub');
  const locationName = config?.location?.name || t('home.defaultLocation', 'your area');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('home.hero.welcome', { platformName })}
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            {t('home.hero.subtitle', { location: locationName })}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/businesses')}
              className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              {t('home.hero.browseBusinesses', 'Browse Businesses')}
            </button>
            <button
              onClick={() => navigate('/categories')}
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition border-2 border-white"
            >
              {t('home.hero.viewCategories', 'View Categories')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">8+</div>
            <div className="text-gray-600">{t('home.stats.businesses', 'Local Businesses')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">8</div>
            <div className="text-gray-600">{t('home.stats.categories', 'Categories')}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">10</div>
            <div className="text-gray-600">{t('home.stats.languages', 'Languages Supported')}</div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">{t('home.categories.title', 'Popular Categories')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { nameKey: 'restaurants', emoji: '🍽️', slug: 'restaurant' },
            { nameKey: 'cafes', emoji: '☕', slug: 'cafe' },
            { nameKey: 'medical', emoji: '🏥', slug: 'medical' },
            { nameKey: 'fitness', emoji: '💪', slug: 'fitness' },
            { nameKey: 'pharmacy', emoji: '💊', slug: 'pharmacy' },
            { nameKey: 'electronics', emoji: '💻', slug: 'electronics' },
            { nameKey: 'bakery', emoji: '🥖', slug: 'bakery' },
            { nameKey: 'hairBeauty', emoji: '💇', slug: 'haircut-salon' },
          ].map((category) => (
            <button
              key={category.slug}
              onClick={() => navigate(`/businesses?category=${category.slug}`)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
            >
              <span className="text-4xl mb-2 block" aria-hidden="true">{category.emoji}</span>
              <span className="font-semibold text-gray-800">{t(`home.categories.${category.nameKey}`, category.nameKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('home.cta.title', { location: locationName })}</h2>
          <p className="text-xl mb-8 text-blue-100">
            {t('home.cta.subtitle', 'Claim your business listing and connect with the community')}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            {t('home.cta.button', 'Get Started')}
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="mt-4">This is a protected page that requires authentication.</p>
  </div>
);

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SkipLink />
        <main id="main-content">
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
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
