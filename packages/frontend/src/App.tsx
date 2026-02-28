/**
 * Main App Component
 *
 * Root component with routing and authentication provider.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { SkipLink } from './components/ui/index';
import { BusinessListPage } from './pages/BusinessListPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';

// Placeholder components for routes
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to Guilford Community Hub
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Discover local businesses, services, and community resources in Guilford
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/businesses')}
              className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Browse Businesses
            </button>
            <button
              onClick={() => navigate('/categories')}
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition border-2 border-white"
            >
              View Categories
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">8+</div>
            <div className="text-gray-600">Local Businesses</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">8</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">10</div>
            <div className="text-gray-600">Languages Supported</div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Restaurants', emoji: '🍽️', slug: 'restaurant' },
            { name: 'Cafes', emoji: '☕', slug: 'cafe' },
            { name: 'Medical', emoji: '🏥', slug: 'medical' },
            { name: 'Fitness', emoji: '💪', slug: 'fitness' },
            { name: 'Pharmacy', emoji: '💊', slug: 'pharmacy' },
            { name: 'Electronics', emoji: '💻', slug: 'electronics' },
            { name: 'Bakery', emoji: '🥖', slug: 'bakery' },
            { name: 'Hair & Beauty', emoji: '💇', slug: 'haircut-salon' },
          ].map((category) => (
            <button
              key={category.slug}
              onClick={() => navigate(`/businesses?category=${category.slug}`)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center"
            >
              <div className="text-4xl mb-2">{category.emoji}</div>
              <div className="font-semibold text-gray-800">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Own a Business in Guilford?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Claim your business listing and connect with the community
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Get Started
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

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
