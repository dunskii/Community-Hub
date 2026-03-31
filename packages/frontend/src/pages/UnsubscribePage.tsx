/**
 * UnsubscribePage
 *
 * Handles one-click email unsubscribe via token in URL.
 * No authentication required - uses token-based verification.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../components/layout/PageContainer';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

type UnsubscribeStatus = 'loading' | 'success' | 'error';

export function UnsubscribePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<UnsubscribeStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage(t('digest.invalidToken', 'Invalid or missing unsubscribe token.'));
      return;
    }

    const unsubscribe = async () => {
      try {
        // Use raw fetch since the unsubscribe endpoint returns HTML, not JSON
        const response = await fetch(`${API_BASE_URL}/unsubscribe?token=${encodeURIComponent(token)}`);
        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(t('digest.invalidToken', 'Invalid or expired unsubscribe token.'));
        }
      } catch {
        setStatus('error');
        setErrorMessage(t('digest.unsubscribeErrorDescription', 'Unable to process your unsubscribe request.'));
      }
    };

    unsubscribe();
  }, [token, t]);

  return (
    <>
      <Helmet>
        <title>{t('digest.unsubscribeTitle', 'Unsubscribe')}</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-md mx-auto py-16 text-center">
          {status === 'loading' && (
            <p className="text-slate-600 dark:text-slate-400">
              {t('common.loading', 'Loading...')}
            </p>
          )}

          {status === 'success' && (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t('digest.unsubscribed', 'You have been unsubscribed')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {t('digest.unsubscribedDescription', 'You will no longer receive weekly digest emails.')}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('digest.resubscribe', 'Changed your mind?')}{' '}
                <Link to="/saved" className="text-primary hover:underline">
                  {t('digest.managePreferences', 'Manage your preferences')}
                </Link>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t('digest.unsubscribeError', 'Something went wrong')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {errorMessage || t('digest.unsubscribeErrorDescription', 'Unable to process your unsubscribe request.')}
              </p>
              <Link
                to="/saved"
                className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('digest.managePreferences', 'Manage your preferences')}
              </Link>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
