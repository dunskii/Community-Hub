/**
 * Main App Component
 *
 * Root component with routing and authentication provider.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './components/auth/VerifyEmailPage';
import { SkipLink } from './components/ui/index';

// Placeholder components for routes
const HomePage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Community Hub</h1>
    <p className="mt-4">Welcome to the Community Hub platform!</p>
  </div>
);

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
