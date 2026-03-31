/**
 * Main App Component
 *
 * Root component with routing and authentication provider.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
import { ModerationPage } from './pages/ModerationPage';
import { UnsubscribePage } from './pages/UnsubscribePage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { AnalyticsDashboardPage } from './pages/owner/AnalyticsDashboardPage';
import { ClaimBusinessPage } from './pages/owner/ClaimBusinessPage';
import { EditBusinessPage } from './pages/owner/EditBusinessPage';
import { PhotosManagementPage } from './pages/owner/PhotosManagementPage';
import { ReviewsManagementPage } from './pages/owner/ReviewsManagementPage';
import { OwnerEventsPage } from './pages/owner/OwnerEventsPage';
import { OwnerEventCreatePage } from './pages/owner/OwnerEventCreatePage';
import { OwnerEventEditPage } from './pages/owner/OwnerEventEditPage';
import { EventsListingPage } from './pages/events/EventsListingPage';
import { DealsListingPage } from './pages/DealsListingPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { BusinessInboxPage } from './pages/owner/BusinessInboxPage';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminBusinessesPage } from './pages/admin/AdminBusinessesPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminEventCreatePage } from './pages/admin/AdminEventCreatePage';
import { AdminEventEditPage } from './pages/admin/AdminEventEditPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminBusinessCreatePage } from './pages/admin/AdminBusinessCreatePage';
import { CuratorLayout } from './components/admin/CuratorLayout';
import { CuratorDashboardPage } from './pages/admin/CuratorDashboardPage';
import { HomePage as RealHomePage } from './pages/HomePage';
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
    { href: '/messages', label: t('navigation.messages', 'Messages'), icon: '💬' },
  ];

  // Business owner links
  const ownerLinks = [
    { href: '/business/dashboard', label: t('navigation.businessDashboard', 'Business Dashboard'), icon: '📊' },
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

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
            <Route path="/" element={<RealHomePage />} />
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
            {/* Owner Dashboard Routes */}
            <Route
              path="/business/dashboard"
              element={
                <ProtectedRoute>
                  <OwnerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/edit"
              element={
                <ProtectedRoute>
                  <EditBusinessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/photos"
              element={
                <ProtectedRoute>
                  <PhotosManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/reviews"
              element={
                <ProtectedRoute>
                  <ReviewsManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/inbox"
              element={
                <ProtectedRoute>
                  <BusinessInboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/inbox/:conversationId"
              element={
                <ProtectedRoute>
                  <BusinessInboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/events"
              element={
                <ProtectedRoute>
                  <OwnerEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/events/create"
              element={
                <ProtectedRoute>
                  <OwnerEventCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/manage/:businessId/events/:eventId/edit"
              element={
                <ProtectedRoute>
                  <OwnerEventEditPage />
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
            <Route path="/events/:idOrSlug" element={<EventDetailPage />} />

            {/* Deals Routes */}
            <Route path="/deals" element={<DealsListingPage />} />

            {/* Unsubscribe Route (no auth required) */}
            <Route path="/unsubscribe" element={<UnsubscribePage />} />

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
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="businesses" element={<AdminBusinessesPage />} />
              <Route path="businesses/create" element={<AdminBusinessCreatePage />} />
              <Route path="businesses/:businessId/edit" element={<EditBusinessPage />} />
              <Route path="businesses/:businessId/photos" element={<PhotosManagementPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="events/create" element={<AdminEventCreatePage />} />
              <Route path="events/:eventId/edit" element={<AdminEventEditPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="moderation" element={<ModerationPage />} />
            </Route>

            {/* Curator Routes - same as admin minus analytics */}
            <Route
              path="/curator"
              element={
                <AdminProtectedRoute allowedRoles={['CURATOR', 'ADMIN', 'SUPER_ADMIN']}>
                  <CuratorLayout />
                </AdminProtectedRoute>
              }
            >
              <Route index element={<CuratorDashboardPage />} />
              <Route path="businesses" element={<AdminBusinessesPage basePath="/curator" />} />
              <Route path="businesses/create" element={<AdminBusinessCreatePage />} />
              <Route path="businesses/:businessId/edit" element={<EditBusinessPage />} />
              <Route path="businesses/:businessId/photos" element={<PhotosManagementPage />} />
              <Route path="events" element={<AdminEventsPage basePath="/curator" />} />
              <Route path="events/create" element={<AdminEventCreatePage />} />
              <Route path="events/:eventId/edit" element={<AdminEventEditPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="moderation" element={<ModerationPage />} />
            </Route>

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
