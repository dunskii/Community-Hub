/**
 * Reset Password Form Component
 *
 * Allows users to set a new password using a reset token from email.
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPassword } from '../../services/auth-api';
import { HttpError } from '../../services/api-client';

export const ResetPasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Password validation
    if (!formData.password) {
      errors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('auth.errors.passwordTooShort');
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = t('auth.errors.passwordNoUppercase');
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = t('auth.errors.passwordNoNumber');
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = t('auth.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError(t('auth.errors.tokenMissing'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, formData.password);
      setShowSuccess(true);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError(t('auth.errors.passwordResetFailed'));
      }
    }
  };

  // Invalid or missing token
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('auth.invalidResetLink')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('auth.invalidResetLinkDescription')}
            </p>
            <Link
              to="/forgot-password"
              className="inline-block bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700"
            >
              {t('auth.requestNewLink')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('auth.passwordResetSuccess')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('auth.passwordResetSuccessDescription')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700"
            >
              {t('auth.goToLogin')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {t('auth.resetPassword')}
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          {t('auth.resetPasswordDescription')}
        </p>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.newPassword')} *
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
              aria-required="true"
              disabled={isLoading}
              autoComplete="new-password"
              autoFocus
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
            <p className="text-gray-500 text-xs mt-1">
              {t('auth.passwordRequirements')}
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.confirmPassword')} *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                validationErrors.confirmPassword
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              aria-invalid={!!validationErrors.confirmPassword}
              aria-describedby={
                validationErrors.confirmPassword
                  ? 'confirmPassword-error'
                  : undefined
              }
              aria-required="true"
              disabled={isLoading}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-busy={isLoading}
          >
            {isLoading ? t('auth.resettingPassword') : t('auth.resetPassword')}
          </button>
        </form>
      </div>
    </div>
  );
};
