/**
 * Email Verification Page Component
 *
 * Handles email verification when users click the link from their email.
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { verifyEmail } from '../../services/auth-api';
import { HttpError } from '../../services/api-client';

export const VerifyEmailPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsVerifying(false);
        setError(t('auth.errors.tokenMissing'));
        return;
      }

      try {
        await verifyEmail(token);
        setIsSuccess(true);
      } catch (err) {
        if (err instanceof HttpError) {
          setError(err.message);
        } else {
          setError(t('auth.errors.verificationFailed'));
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verify();
  }, [token, t]);

  if (isVerifying) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-teal-500 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('auth.verifyingEmail')}
            </h2>
            <p className="text-gray-600">
              {t('auth.verifyingEmailDescription')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
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
              {t('auth.emailVerified')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('auth.emailVerifiedDescription')}
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

  // Error state
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
            {t('auth.verificationFailed')}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || t('auth.errors.verificationFailed')}
          </p>
          <div className="space-y-3">
            <Link
              to="/register"
              className="block bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700"
            >
              {t('auth.registerAgain')}
            </Link>
            <Link
              to="/login"
              className="block text-teal-600 hover:text-teal-800 font-semibold"
            >
              {t('auth.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
