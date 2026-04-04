/**
 * EditBusinessPage
 *
 * Business owner page for editing business profile details.
 * Spec §13.2: Business Owner Dashboard - Profile Management
 */

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { PageContainer } from '../../components/layout/PageContainer';
import { Skeleton } from '../../components/display/Skeleton';
import { Alert } from '../../components/display/Alert';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  PhoneIcon,
  GlobeAltIcon,
  TagIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import {
  useEditBusinessForm,
  useBusinessDeals,
  BasicInfoTab,
  ContactLocationTab,
  OperatingHoursTab,
  DetailsTab,
  SocialMediaTab,
  PromotionsTab,
} from './edit-business';
import type { TabId } from './edit-business';

const VALID_TABS = ['basic', 'contact', 'hours', 'details', 'social', 'promotions'] as const;

export function EditBusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAdminContext = location.pathname.startsWith('/admin');
  const isCuratorContext = location.pathname.startsWith('/curator');
  const isManagementContext = isAdminContext || isCuratorContext;
  const managementBasePath = isCuratorContext ? '/curator' : '/admin';

  const initialTab = VALID_TABS.includes(searchParams.get('tab') as TabId)
    ? (searchParams.get('tab') as TabId)
    : 'basic';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const form = useEditBusinessForm(businessId);
  const dealsHook = useBusinessDeals(businessId, activeTab);

  // Scroll to top on mount and tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const tabs = [
    { id: 'basic' as const, label: t('editBusiness.tabs.basic', 'Basic Info'), icon: BuildingStorefrontIcon },
    { id: 'contact' as const, label: t('editBusiness.tabs.contact', 'Contact & Location'), icon: PhoneIcon },
    { id: 'hours' as const, label: t('editBusiness.tabs.hours', 'Operating Hours'), icon: ClockIcon },
    { id: 'details' as const, label: t('editBusiness.tabs.details', 'Details & Features'), icon: GlobeAltIcon },
    { id: 'social' as const, label: t('editBusiness.tabs.social', 'Social Media'), icon: ShareIcon },
    { id: 'promotions' as const, label: t('editBusiness.tabs.promotions', 'Promotions'), icon: TagIcon },
  ];

  if (form.loading) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton variant="text" width="200px" height="32px" />
          <Skeleton variant="rectangular" width="100%" height="400px" />
        </div>
      </PageContainer>
    );
  }

  if ((form.error && !form.business) || !form.business) {
    return (
      <PageContainer>
        <div className="max-w-6xl mx-auto text-center py-12">
          <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {form.error ? 'Error Loading Business' : 'Business Not Found'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {form.error || "The business you're looking for doesn't exist or you don't have permission to edit it."}
          </p>
          <Link
            to={isManagementContext ? `${managementBasePath}/businesses` : '/business/dashboard'}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {isManagementContext ? t('admin.businesses.backToBusinesses', 'Back to Businesses') : t('editBusiness.backToDashboard', 'Back to Dashboard')}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('editBusiness.title', 'Edit Business')} - {form.business.name} | Community Hub</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={isManagementContext ? `${managementBasePath}/businesses` : '/business/dashboard'}
              className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-4"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              {isManagementContext
                ? t('admin.businesses.backToBusinesses', 'Back to Businesses')
                : t('editBusiness.backToDashboard', 'Back to Dashboard')}
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t('editBusiness.title', 'Edit Business')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {form.business.name}
            </p>
          </div>

          {/* Success Message */}
          {form.success && (
            <div className="mb-6">
              <Alert type="info" message={t('editBusiness.success', 'Business profile updated successfully!')} />
            </div>
          )}

          {/* Save Error Message */}
          {form.saveError && (
            <div className="mb-6">
              <Alert type="warning" message={form.saveError} />
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex gap-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={(e) => form.handleSubmit(e, activeTab)}>
            {activeTab === 'basic' && (
              <BasicInfoTab
                formData={form.formData}
                handleInputChange={form.handleInputChange}
                t={t}
                categories={form.categories}
                onSecondaryCategoryToggle={form.handleSecondaryCategoryToggle}
              />
            )}

            {activeTab === 'contact' && (
              <ContactLocationTab
                formData={form.formData}
                handleInputChange={form.handleInputChange}
                t={t}
                businessId={businessId}
                onGoogleFieldsApplied={form.handleGbpFieldsApplied}
              />
            )}

            {activeTab === 'hours' && (
              <OperatingHoursTab
                formData={form.formData}
                handleInputChange={form.handleInputChange}
                t={t}
                quickSetOpen={form.quickSetOpen}
                quickSetClose={form.quickSetClose}
                setQuickSetOpen={form.setQuickSetOpen}
                setQuickSetClose={form.setQuickSetClose}
                handleHoursChange={form.handleHoursChange}
                applyHoursToAll={form.applyHoursToAll}
              />
            )}

            {activeTab === 'details' && (
              <DetailsTab
                formData={form.formData}
                handleInputChange={form.handleInputChange}
                handleCheckboxChange={form.handleCheckboxChange}
                t={t}
              />
            )}

            {activeTab === 'social' && (
              <SocialMediaTab
                formData={form.formData}
                handleInputChange={form.handleInputChange}
                handleSocialChange={form.handleSocialChange}
                handleGbpFieldsApplied={form.handleGbpFieldsApplied}
                businessId={businessId}
                t={t}
              />
            )}

            {activeTab === 'promotions' && (
              <PromotionsTab
                t={t}
                deals={dealsHook.deals}
                dealsLoading={dealsHook.dealsLoading}
                activeDealsCount={dealsHook.activeDealsCount}
                maxDeals={dealsHook.maxDeals}
                showDealForm={dealsHook.showDealForm}
                setShowDealForm={dealsHook.setShowDealForm}
                editingDeal={dealsHook.editingDeal}
                setEditingDeal={dealsHook.setEditingDeal}
                dealFormLoading={dealsHook.dealFormLoading}
                handleCreateDeal={dealsHook.handleCreateDeal}
                handleUpdateDeal={dealsHook.handleUpdateDeal}
                handleDeleteDeal={dealsHook.handleDeleteDeal}
              />
            )}

            {/* Submit Buttons - hidden on promotions tab (deals have their own save) */}
            {activeTab !== 'promotions' && (
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={form.saving}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {form.saving ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
                </button>
                <Link
                  to={isManagementContext ? `${managementBasePath}/businesses` : '/business/dashboard'}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </Link>
              </div>
            )}
          </form>
        </div>
      </PageContainer>
    </>
  );
}
