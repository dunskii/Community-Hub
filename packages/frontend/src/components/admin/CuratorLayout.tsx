/**
 * CuratorLayout
 *
 * Sidebar navigation layout for curator pages.
 * Same as AdminLayout but without Analytics.
 * Spec §23: Administration & Moderation
 */

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  UsersIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/curator', icon: HomeIcon, labelKey: 'curator.nav.dashboard', end: true },
  { to: '/curator/businesses', icon: BuildingStorefrontIcon, labelKey: 'curator.nav.businesses', end: false },
  { to: '/curator/events', icon: CalendarIcon, labelKey: 'curator.nav.events', end: false },
  { to: '/curator/users', icon: UsersIcon, labelKey: 'curator.nav.users', end: false },
  { to: '/curator/moderation', icon: ShieldCheckIcon, labelKey: 'curator.nav.moderation', end: false },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        {t('curator.nav.curation')}
      </h2>
      <ul className="space-y-1" role="list">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CuratorLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        className="fixed top-16 left-2 z-50 md:hidden rounded-md bg-white dark:bg-gray-800 p-2 shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={t('curator.nav.toggleMenu')}
      >
        {sidebarOpen ? (
          <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile sidebar - fixed overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <nav
            role="navigation"
            aria-label={t('curator.nav.curatorNavigation')}
            className="fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-y-auto md:hidden"
          >
            <SidebarContent onNavClick={() => setSidebarOpen(false)} />
          </nav>
        </>
      )}

      {/* Desktop sidebar - static flex child, always visible */}
      <nav
        role="navigation"
        aria-label={t('curator.nav.curatorNavigation')}
        className="hidden md:block w-60 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
      >
        <div className="sticky top-14 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          <SidebarContent />
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
