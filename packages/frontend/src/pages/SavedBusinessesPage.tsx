/**
 * SavedBusinessesPage
 * Page for viewing and managing saved businesses
 * WCAG 2.1 AA compliant
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer';
import { Tabs } from '../components/display/Tabs';
import { EmptyState } from '../components/display/EmptyState';
import { Skeleton } from '../components/display/Skeleton';
import { Modal } from '../components/display/Modal';
import { Input } from '../components/form/Input';
import { Alert } from '../components/display/Alert';
import { savedService, type SavedBusiness, type SavedList } from '../services/saved-service';
import { useAuth } from '../hooks/useAuth';
import { DigestPreferencesPanel } from '../components/DigestPreferencesPanel';
import './SavedBusinessesPage.css';

export function SavedBusinessesPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [savedBusinesses, setSavedBusinesses] = useState<SavedBusiness[]>([]);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [createListError, setCreateListError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedBusinesses();
    }
  }, [isAuthenticated, activeList]);

  const fetchSavedBusinesses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await savedService.getSavedBusinesses({
        listId: activeList || undefined,
      });
      setSavedBusinesses(response.data.saved);
      setLists(response.data.lists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (businessId: string) => {
    try {
      await savedService.unsaveBusiness(businessId);
      await fetchSavedBusinesses();
    } catch {
      // Error handled silently - UI state unchanged indicates failure
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setCreateListError(t('saved.listNameRequired'));
      return;
    }

    setIsCreatingList(true);
    setCreateListError(null);

    try {
      await savedService.createList(newListName.trim());
      setNewListName('');
      setShowCreateList(false);
      await fetchSavedBusinesses();
    } catch (err) {
      setCreateListError(err instanceof Error ? err.message : 'Failed to create list');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm(t('saved.deleteListConfirm'))) return;

    try {
      await savedService.deleteList(listId);
      if (activeList === listId) {
        setActiveList(null);
      }
      await fetchSavedBusinesses();
    } catch {
      // Error handled silently - UI state unchanged indicates failure
    }
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState
          title={t('saved.loginRequired')}
          description={t('saved.loginRequiredDescription')}
          icon="🔒"
          action={
            <a href="/login">{t('auth.login')}</a>
          }
        />
      </PageContainer>
    );
  }

  const renderBusinessCard = (saved: SavedBusiness) => (
    <article key={saved.id} className="saved-business-card">
      <Link to={`/businesses/${saved.business.slug}`} className="saved-business-card__link">
        {saved.business.photos && saved.business.photos.length > 0 && (
          <img
            src={saved.business.photos[0]}
            alt={saved.business.name}
            className="saved-business-card__image"
            loading="lazy"
          />
        )}
        <div className="saved-business-card__content">
          <h3 className="saved-business-card__title">{saved.business.name}</h3>
          <p className="saved-business-card__category">{saved.business.categoryPrimary}</p>
          {saved.business.rating && (
            <div className="saved-business-card__rating">
              ⭐ {saved.business.rating.toFixed(1)}
            </div>
          )}
          {saved.notes && (
            <p className="saved-business-card__notes">{saved.notes}</p>
          )}
        </div>
      </Link>
      <button
        type="button"
        className="saved-business-card__remove"
        onClick={(e) => {
          e.preventDefault();
          handleUnsave(saved.businessId);
        }}
        aria-label={t('saved.remove')}
      >
        ❌
      </button>
    </article>
  );

  const renderListTab = (list: SavedList | null) => {
    const filteredBusinesses = list
      ? savedBusinesses.filter((s) => s.listId === list.id)
      : savedBusinesses.filter((s) => s.listId === null);

    if (isLoading) {
      return (
        <div className="saved-businesses-page__grid">
          {[...Array(6)].map((_, index) => (
            <Skeleton key={index} width="100%" height={200} />
          ))}
        </div>
      );
    }

    if (filteredBusinesses.length === 0) {
      return (
        <EmptyState
          title={t('saved.noBusinesses')}
          description={t('saved.noBusinessesDescription')}
          icon="💾"
        />
      );
    }

    return (
      <div className="saved-businesses-page__grid">
        {filteredBusinesses.map(renderBusinessCard)}
      </div>
    );
  };

  const tabs = [
    {
      id: 'all',
      label: `${t('saved.allSaved')} (${savedBusinesses.filter((s) => s.listId === null).length})`,
      content: renderListTab(null),
    },
    ...lists.map((list) => ({
      id: list.id,
      label: `${list.name} (${list.businessCount})`,
      content: (
        <>
          <div className="saved-businesses-page__list-actions">
            <button
              type="button"
              className="saved-businesses-page__delete-list"
              onClick={() => handleDeleteList(list.id)}
              aria-label={t('saved.deleteList')}
            >
              🗑️
            </button>
          </div>
          {renderListTab(list)}
        </>
      ),
    })),
  ];

  return (
    <>
      <Helmet>
        <title>{t('saved.pageTitle')}</title>
        <meta name="description" content={t('saved.pageDescription')} />
      </Helmet>

      <PageContainer>
        <div className="saved-businesses-page">
          <header className="saved-businesses-page__header">
            <h1 className="saved-businesses-page__title">{t('saved.pageTitle')}</h1>
            <button
              type="button"
              className="saved-businesses-page__create-list"
              onClick={() => setShowCreateList(true)}
            >
              {t('saved.createList')}
            </button>
          </header>

          <DigestPreferencesPanel />

          {error && <Alert type="critical" message={error} />}

          <Tabs tabs={tabs} onTabChange={(tabId) => setActiveList(tabId === 'all' ? null : tabId)} />
        </div>

        {/* Create List Modal */}
        <Modal
          isOpen={showCreateList}
          onClose={() => {
            setShowCreateList(false);
            setNewListName('');
            setCreateListError(null);
          }}
          title={t('saved.createNewList')}
        >
          <div className="saved-businesses-page__create-list-form">
            {createListError && <Alert type="critical" message={createListError} />}
            <Input
              id="list-name"
              label={t('saved.listName')}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder={t('saved.listNamePlaceholder')}
              required
              disabled={isCreatingList}
            />
            <div className="saved-businesses-page__create-list-actions">
              <button
                type="button"
                className="saved-businesses-page__button saved-businesses-page__button--secondary"
                onClick={() => {
                  setShowCreateList(false);
                  setNewListName('');
                  setCreateListError(null);
                }}
                disabled={isCreatingList}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="saved-businesses-page__button saved-businesses-page__button--primary"
                onClick={handleCreateList}
                disabled={isCreatingList || !newListName.trim()}
              >
                {isCreatingList ? t('common.creating') : t('common.create')}
              </button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </>
  );
}
