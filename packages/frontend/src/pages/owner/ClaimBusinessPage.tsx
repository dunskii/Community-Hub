/**
 * ClaimBusinessPage
 *
 * Business claim verification flow.
 * Spec §13.1: Business Claim & Verification
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { EmptyState } from '../../components/display/EmptyState';
import { Alert } from '../../components/display/Alert';
import { useAuth } from '../../hooks/useAuth';
import { get } from '../../services/api-client';
import {
  getClaimStatus,
  initiateClaim,
  verifyPhonePIN,
  resendPIN,
  appealClaim,
  type VerificationMethod,
  type ClaimResult,
  type ClaimStatusResponse,
} from '../../services/claim-service';

type Step = 'method' | 'phone' | 'email' | 'document' | 'pending' | 'success' | 'rejected';

interface BusinessInfo {
  id: string;
  name: string;
  claimed: boolean;
  email: string | null;
  website: string | null;
}

export function ClaimBusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatusResponse | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [step, setStep] = useState<Step>('method');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [documentType, setDocumentType] = useState<'abn' | 'utility_bill' | 'business_registration'>('abn');
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [appealReason, setAppealReason] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/claim/${businessId}` } });
    }
  }, [isAuthenticated, navigate, businessId]);

  // Fetch business and claim status
  useEffect(() => {
    async function fetchData() {
      if (!businessId || !user) return;

      try {
        setLoading(true);

        // Fetch business info
        const businessResponse = await get<{ success: boolean; data: BusinessInfo }>(
          `/businesses/${businessId}`
        );
        setBusiness(businessResponse.data);

        // Fetch existing claim status
        const statusResponse = await getClaimStatus(businessId);
        setClaimStatus(statusResponse);

        // Determine initial step based on existing claim
        if (statusResponse.claim) {
          switch (statusResponse.claim.claimStatus) {
            case 'PENDING':
              if (statusResponse.claim.verificationMethod === 'PHONE') {
                setStep('phone');
              } else if (statusResponse.claim.verificationMethod === 'EMAIL') {
                setStep('email');
              } else if (statusResponse.claim.verificationMethod === 'DOCUMENT') {
                setStep('pending');
              }
              break;
            case 'APPROVED':
              setStep('success');
              break;
            case 'REJECTED':
              setStep('rejected');
              break;
            case 'APPEALED':
              setStep('pending');
              break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [businessId, user]);

  // Handle method selection
  const handleMethodSelect = async (method: VerificationMethod) => {
    setSelectedMethod(method);

    if (method === 'PHONE') {
      setStep('phone');
    } else if (method === 'EMAIL') {
      setStep('email');
    } else if (method === 'DOCUMENT') {
      setStep('document');
    } else if (method === 'GOOGLE_BUSINESS') {
      // Not implemented yet
      setError(t('claim.googleNotAvailable'));
    }
  };

  // Handle claim initiation
  const handleInitiateClaim = async () => {
    if (!businessId || !selectedMethod) return;

    try {
      setSubmitting(true);
      setError(null);

      const data: Parameters<typeof initiateClaim>[1] = {
        verificationMethod: selectedMethod,
      };

      if (selectedMethod === 'PHONE') {
        data.phoneNumber = phoneNumber;
      } else if (selectedMethod === 'EMAIL') {
        data.businessEmail = businessEmail;
      } else if (selectedMethod === 'DOCUMENT') {
        data.documentType = documentType;
        data.documentUrls = documentUrls;
      }

      const result = await initiateClaim(businessId, data);
      setClaimResult(result);

      if (selectedMethod === 'DOCUMENT') {
        setStep('pending');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate claim');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PIN verification
  const handleVerifyPIN = async () => {
    if (!claimResult?.claimRequestId && !claimStatus?.claim?.id) return;

    const claimId = claimResult?.claimRequestId || claimStatus?.claim?.id;
    if (!claimId) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await verifyPhonePIN(claimId, pin);

      if (result.claimStatus === 'APPROVED') {
        setStep('success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid PIN');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle resend PIN
  const handleResendPIN = async () => {
    const claimId = claimResult?.claimRequestId || claimStatus?.claim?.id;
    if (!claimId) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await resendPIN(claimId);
      setClaimResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend PIN');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle appeal
  const handleAppeal = async () => {
    const claimId = claimStatus?.claim?.id;
    if (!claimId || !appealReason.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      await appealClaim(claimId, appealReason);
      setStep('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <div className="claim-page">
          <Skeleton variant="text" width="60%" height="32px" />
          <Skeleton variant="rectangular" width="100%" height="200px" />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (!business) {
    return (
      <PageContainer>
        <EmptyState
          title={t('claim.businessNotFound')}
          description={t('claim.businessNotFoundDescription')}
          icon="🔍"
        />
      </PageContainer>
    );
  }

  // Already claimed by someone else
  if (business.claimed) {
    return (
      <PageContainer>
        <Helmet>
          <title>{t('claim.title')} - {business.name} | Community Hub</title>
        </Helmet>
        <EmptyState
          title={t('claim.alreadyClaimed')}
          description={t('claim.alreadyClaimedDescription')}
          icon="🔒"
        />
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('claim.title')} - {business.name} | Community Hub</title>
      </Helmet>

      <PageContainer>
        <div className="claim-page">
          <header className="claim-page__header">
            <h1>{t('claim.title')}</h1>
            <p className="claim-page__business">{business.name}</p>
          </header>

          {error && (
            <Alert
              type="critical"
              message={error}
              dismissible
              onClose={() => setError(null)}
            />
          )}

          {/* Method Selection */}
          {step === 'method' && (
            <section className="claim-page__methods">
              <h2>{t('claim.selectMethod')}</h2>
              <p className="claim-page__description">{t('claim.selectMethodDescription')}</p>

              <div className="claim-page__method-grid">
                <MethodCard
                  title={t('claim.methods.phone.title')}
                  description={t('claim.methods.phone.description')}
                  icon="📱"
                  onClick={() => handleMethodSelect('PHONE')}
                />
                <MethodCard
                  title={t('claim.methods.email.title')}
                  description={t('claim.methods.email.description')}
                  icon="📧"
                  onClick={() => handleMethodSelect('EMAIL')}
                />
                <MethodCard
                  title={t('claim.methods.document.title')}
                  description={t('claim.methods.document.description')}
                  icon="📄"
                  onClick={() => handleMethodSelect('DOCUMENT')}
                />
                <MethodCard
                  title={t('claim.methods.google.title')}
                  description={t('claim.methods.google.description')}
                  icon="🔗"
                  onClick={() => handleMethodSelect('GOOGLE_BUSINESS')}
                  disabled
                />
              </div>
            </section>
          )}

          {/* Phone Verification */}
          {step === 'phone' && (
            <section className="claim-page__form">
              {!claimResult ? (
                <>
                  <h2>{t('claim.phone.enterNumber')}</h2>
                  <p className="claim-page__description">{t('claim.phone.enterNumberDescription')}</p>

                  <div className="claim-page__field">
                    <label htmlFor="phoneNumber">{t('claim.phone.label')}</label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+61412345678"
                      className="claim-page__input"
                    />
                    <p className="claim-page__hint">{t('claim.phone.hint')}</p>
                  </div>

                  <button
                    onClick={handleInitiateClaim}
                    disabled={!phoneNumber || submitting}
                    className="btn btn--primary"
                  >
                    {submitting ? t('common.loading') : t('claim.phone.sendPIN')}
                  </button>
                </>
              ) : (
                <>
                  <h2>{t('claim.phone.enterPIN')}</h2>
                  <p className="claim-page__description">{claimResult.message}</p>

                  <div className="claim-page__field">
                    <label htmlFor="pin">{t('claim.phone.pinLabel')}</label>
                    <input
                      id="pin"
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="claim-page__input claim-page__input--pin"
                      autoComplete="one-time-code"
                    />
                  </div>

                  <div className="claim-page__actions">
                    <button
                      onClick={handleVerifyPIN}
                      disabled={pin.length !== 6 || submitting}
                      className="btn btn--primary"
                    >
                      {submitting ? t('common.loading') : t('claim.phone.verify')}
                    </button>
                    <button
                      onClick={handleResendPIN}
                      disabled={submitting}
                      className="btn btn--secondary"
                    >
                      {t('claim.phone.resend')}
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => { setStep('method'); setClaimResult(null); }}
                className="claim-page__back"
              >
                ← {t('claim.changeMethod')}
              </button>
            </section>
          )}

          {/* Email Verification */}
          {step === 'email' && (
            <section className="claim-page__form">
              {!claimResult ? (
                <>
                  <h2>{t('claim.email.enterEmail')}</h2>
                  <p className="claim-page__description">{t('claim.email.enterEmailDescription')}</p>

                  <div className="claim-page__field">
                    <label htmlFor="businessEmail">{t('claim.email.label')}</label>
                    <input
                      id="businessEmail"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="owner@business.com"
                      className="claim-page__input"
                    />
                    <p className="claim-page__hint">{t('claim.email.hint')}</p>
                  </div>

                  <button
                    onClick={handleInitiateClaim}
                    disabled={!businessEmail || submitting}
                    className="btn btn--primary"
                  >
                    {submitting ? t('common.loading') : t('claim.email.sendLink')}
                  </button>
                </>
              ) : (
                <Alert
                  type="info"
                  title={t('claim.email.sent')}
                  message={claimResult.message}
                />
              )}

              <button
                onClick={() => { setStep('method'); setClaimResult(null); }}
                className="claim-page__back"
              >
                ← {t('claim.changeMethod')}
              </button>
            </section>
          )}

          {/* Document Verification */}
          {step === 'document' && (
            <section className="claim-page__form">
              <h2>{t('claim.document.upload')}</h2>
              <p className="claim-page__description">{t('claim.document.uploadDescription')}</p>

              <div className="claim-page__field">
                <label htmlFor="documentType">{t('claim.document.typeLabel')}</label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
                  className="claim-page__select"
                >
                  <option value="abn">{t('claim.document.types.abn')}</option>
                  <option value="utility_bill">{t('claim.document.types.utilityBill')}</option>
                  <option value="business_registration">{t('claim.document.types.registration')}</option>
                </select>
              </div>

              <div className="claim-page__field">
                <label>{t('claim.document.filesLabel')}</label>
                <p className="claim-page__hint">{t('claim.document.filesHint')}</p>
                {/* File upload would go here - simplified for now */}
                <input
                  type="text"
                  placeholder={t('claim.document.urlPlaceholder')}
                  onChange={(e) => setDocumentUrls(e.target.value ? [e.target.value] : [])}
                  className="claim-page__input"
                />
              </div>

              <button
                onClick={handleInitiateClaim}
                disabled={documentUrls.length === 0 || submitting}
                className="btn btn--primary"
              >
                {submitting ? t('common.loading') : t('claim.document.submit')}
              </button>

              <button
                onClick={() => setStep('method')}
                className="claim-page__back"
              >
                ← {t('claim.changeMethod')}
              </button>
            </section>
          )}

          {/* Pending Review */}
          {step === 'pending' && (
            <section className="claim-page__status">
              <div className="claim-page__status-icon">⏳</div>
              <h2>{t('claim.pending.title')}</h2>
              <p>{claimResult?.message || t('claim.pending.description')}</p>
              {claimResult?.moderationEstimate && (
                <p className="claim-page__estimate">
                  {t('claim.pending.estimate')}: {claimResult.moderationEstimate}
                </p>
              )}
              <Link to="/business/dashboard" className="btn btn--primary">
                {t('claim.pending.goToDashboard')}
              </Link>
            </section>
          )}

          {/* Success */}
          {step === 'success' && (
            <section className="claim-page__status">
              <div className="claim-page__status-icon">✅</div>
              <h2>{t('claim.success.title')}</h2>
              <p>{t('claim.success.description', { businessName: business.name })}</p>
              <Link to="/business/dashboard" className="btn btn--primary">
                {t('claim.success.goToDashboard')}
              </Link>
            </section>
          )}

          {/* Rejected */}
          {step === 'rejected' && (
            <section className="claim-page__status">
              <div className="claim-page__status-icon">❌</div>
              <h2>{t('claim.rejected.title')}</h2>
              {claimStatus?.claim?.rejectionReason && (
                <p className="claim-page__reason">
                  {t('claim.rejected.reason')}: {claimStatus.claim.rejectionReason}
                </p>
              )}
              <p>{t('claim.rejected.description')}</p>

              <div className="claim-page__appeal">
                <h3>{t('claim.rejected.appealTitle')}</h3>
                <textarea
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder={t('claim.rejected.appealPlaceholder')}
                  className="claim-page__textarea"
                  rows={4}
                />
                <button
                  onClick={handleAppeal}
                  disabled={!appealReason.trim() || submitting}
                  className="btn btn--primary"
                >
                  {submitting ? t('common.loading') : t('claim.rejected.submitAppeal')}
                </button>
              </div>
            </section>
          )}
        </div>
      </PageContainer>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

interface MethodCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

function MethodCard({ title, description, icon, onClick, disabled }: MethodCardProps) {
  return (
    <button
      className={`method-card ${disabled ? 'method-card--disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="method-card__icon">{icon}</span>
      <span className="method-card__title">{title}</span>
      <span className="method-card__description">{description}</span>
      {disabled && <span className="method-card__badge">Coming Soon</span>}
    </button>
  );
}
