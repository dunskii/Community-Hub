/**
 * AssignOwnerModal
 *
 * Modal for assigning a user as business owner.
 * Supports searching existing users or creating a new user inline.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import {
  searchUsers,
  createAdminUser,
  assignBusinessOwner,
  type UserSearchResult,
} from '../../services/admin-api';

interface AssignOwnerModalProps {
  businessId: string;
  businessName: string;
  currentOwner: string | null;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignOwnerModal({
  businessId,
  businessName,
  currentOwner,
  onClose,
  onAssigned,
}: AssignOwnerModalProps) {
  const { t } = useTranslation();
  const searchRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create user form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'BUSINESS_OWNER',
  });

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAssign = async (userId: string) => {
    setError(null);
    setLoading(true);
    try {
      await assignBusinessOwner(businessId, userId);
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign owner');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setError(null);
    setLoading(true);
    try {
      await assignBusinessOwner(businessId, null);
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove owner');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newUser.email || !newUser.password || !newUser.displayName) {
      setError(t('admin.assignOwner.allFieldsRequired', 'All fields are required'));
      return;
    }

    setLoading(true);
    try {
      const user = await createAdminUser(newUser);
      await assignBusinessOwner(businessId, user.id);
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-owner-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 id="assign-owner-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('admin.assignOwner.title', 'Assign Owner')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t('common.close', 'Close')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Current owner - unassign option */}
        {currentOwner && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {t('admin.assignOwner.currentOwner', 'Current Owner')}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{currentOwner}</p>
            </div>
            <button
              onClick={handleUnassign}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50"
            >
              <UserMinusIcon className="h-4 w-4" />
              {t('admin.assignOwner.remove', 'Remove')}
            </button>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mx-5 mt-4">
          <button
            onClick={() => setMode('search')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'search'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('admin.assignOwner.searchExisting', 'Search Existing User')}
          </button>
          <button
            onClick={() => setMode('create')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              mode === 'create'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlusIcon className="h-4 w-4 inline mr-1" />
            {t('admin.assignOwner.createNew', 'Create New User')}
          </button>
        </div>

        <div className="p-5">
          {mode === 'search' ? (
            <>
              {/* Search input */}
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.assignOwner.searchPlaceholder', 'Search by name or email...')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  aria-label={t('admin.assignOwner.searchPlaceholder', 'Search by name or email...')}
                />
              </div>

              {/* Results */}
              {searching && (
                <p className="text-sm text-gray-500 text-center py-4">{t('common.searching', 'Searching...')}</p>
              )}

              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t('admin.assignOwner.noResults', 'No users found. Try a different search or create a new user.')}
                </p>
              )}

              {searchResults.length > 0 && (
                <ul className="space-y-2" role="list">
                  {searchResults.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email} &middot; {user.role}</p>
                      </div>
                      <button
                        onClick={() => handleAssign(user.id)}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                      >
                        {t('admin.assignOwner.assign', 'Assign')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            /* Create new user form */
            <form onSubmit={handleCreateAndAssign} className="space-y-4">
              <div>
                <label htmlFor="newUserDisplayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.assignOwner.displayName', 'Display Name')} *
                </label>
                <input
                  id="newUserDisplayName"
                  type="text"
                  required
                  value={newUser.displayName}
                  onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.assignOwner.email', 'Email')} *
                </label>
                <input
                  id="newUserEmail"
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.assignOwner.password', 'Password')} *
                </label>
                <input
                  id="newUserPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder={t('admin.assignOwner.passwordHint', 'Min 8 characters')}
                />
              </div>
              <div>
                <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.assignOwner.role', 'Role')}
                </label>
                <select
                  id="newUserRole"
                  value={newUser.role}
                  onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="BUSINESS_OWNER">BUSINESS_OWNER</option>
                  <option value="COMMUNITY">COMMUNITY</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading
                  ? t('admin.assignOwner.creating', 'Creating & Assigning...')
                  : t('admin.assignOwner.createAndAssign', 'Create User & Assign as Owner')
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
