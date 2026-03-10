/**
 * Admin Protected Route Component
 *
 * Wrapper component that requires admin or super admin authentication.
 * Redirects to home if user is not authorized.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  allowedRoles = ['ADMIN', 'SUPER_ADMIN'],
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // User is authenticated but not authorized - redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
