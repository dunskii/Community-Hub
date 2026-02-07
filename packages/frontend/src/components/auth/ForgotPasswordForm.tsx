/**
 * Forgot Password Form Component
 *
 * Allows users to request a password reset email.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPassword } from '../../services/auth-api';
import { HttpError } from '../../services/api-client';

export const ForgotPasswordForm: React.FC = () => {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t('auth.errors.emailRequired'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.errors.emailInvalid'));
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
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

  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-teal-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('auth.resetEmailSent')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('auth.resetEmailSentDescription')}
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
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {t('auth.forgotPassword')}
        </h2>
        <p className="text-center text-gray-600 text-sm mb-6">
          {t('auth.forgotPasswordDescription')}
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
          <div className="mb-6">
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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder={t('auth.emailPlaceholder')}
              aria-required="true"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-busy={isLoading}
          >
            {isLoading ? t('auth.sendingResetEmail') : t('auth.sendResetEmail')}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          {t('auth.rememberPassword')}{' '}
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
