/**
 * Login Form Component
 *
 * User login form with email, password, and remember me checkbox.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.email) {
      errors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('auth.errors.emailInvalid');
    }

    if (!formData.password) {
      errors.password = t('auth.errors.passwordRequired');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData);

      // Redirect to intended page or home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Login error:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {t('auth.login')}
        </h2>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                validationErrors.email
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={t('auth.emailPlaceholder')}
              aria-invalid={!!validationErrors.email}
              aria-describedby={
                validationErrors.email ? 'email-error' : undefined
              }
              disabled={isLoading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <p
                id="email-error"
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                validationErrors.password
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={t('auth.passwordPlaceholder')}
              aria-invalid={!!validationErrors.password}
              aria-describedby={
                validationErrors.password ? 'password-error' : undefined
              }
              disabled={isLoading}
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <p
                id="password-error"
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700">
                {t('auth.rememberMe')}
              </span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-teal-600 hover:text-teal-800"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-busy={isLoading}
          >
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            className="text-teal-600 hover:text-teal-800 font-semibold"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};
