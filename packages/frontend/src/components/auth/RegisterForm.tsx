/**
 * Register Form Component
 *
 * User registration form with email, password, display name, and preferences.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export const RegisterForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { register, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    languagePreference: i18n.language || 'en',
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
  }>({});

  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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

    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('auth.errors.emailInvalid');
    }

    // Display name validation
    if (!formData.displayName) {
      errors.displayName = t('auth.errors.displayNameRequired');
    } else if (formData.displayName.length < 2) {
      errors.displayName = t('auth.errors.displayNameTooShort');
    }

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

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        languagePreference: formData.languagePreference,
      });

      // Show success message
      setShowSuccess(true);
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Registration error:', err);
    }
  };

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
              {t('auth.registrationSuccess')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('auth.verificationEmailSent')}
            </p>
            <Link
              to="/login"
              className="inline-block bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700"
            >
              {t('auth.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {t('auth.register')}
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
              {t('auth.email')} *
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
              aria-required="true"
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

          {/* Display Name Field */}
          <div className="mb-4">
            <label
              htmlFor="displayName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.displayName')} *
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                validationErrors.displayName
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder={t('auth.displayNamePlaceholder')}
              aria-invalid={!!validationErrors.displayName}
              aria-describedby={
                validationErrors.displayName ? 'displayName-error' : undefined
              }
              aria-required="true"
              disabled={isLoading}
              autoComplete="name"
            />
            {validationErrors.displayName && (
              <p
                id="displayName-error"
                className="text-red-500 text-xs mt-1"
                role="alert"
              >
                {validationErrors.displayName}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.password')} *
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
          <div className="mb-4">
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

          {/* Language Preference */}
          <div className="mb-6">
            <label
              htmlFor="languagePreference"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              {t('auth.languagePreference')}
            </label>
            <select
              id="languagePreference"
              name="languagePreference"
              value={formData.languagePreference}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={isLoading}
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="zh-CN">简体中文 (Chinese Simplified)</option>
              <option value="zh-TW">繁體中文 (Chinese Traditional)</option>
              <option value="vi">Tiếng Việt (Vietnamese)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ur">اردو (Urdu)</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="el">Ελληνικά (Greek)</option>
              <option value="it">Italiano (Italian)</option>
            </select>
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
            {isLoading ? t('auth.registering') : t('auth.register')}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 text-sm mt-6">
          {t('auth.haveAccount')}{' '}
          <Link
            to="/login"
            className="text-teal-600 hover:text-teal-800 font-semibold"
          >
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};
