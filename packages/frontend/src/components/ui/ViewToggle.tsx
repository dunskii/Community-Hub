/**
 * ViewToggle Component
 * Toggle between grid and list view layouts
 * WCAG 2.1 AA compliant with keyboard navigation
 */

import { useTranslation } from 'react-i18next';
import { Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  /** Current view mode */
  view: ViewMode;
  /** Callback when view changes */
  onChange: (view: ViewMode) => void;
  /** Optional additional classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

export function ViewToggle({
  view,
  onChange,
  className = '',
  size = 'md',
}: ViewToggleProps) {
  const { t } = useTranslation();

  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}
      role="group"
      aria-label={t('common.viewToggle', 'Toggle view mode')}
    >
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`${buttonSize} rounded-l-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
          view === 'grid'
            ? 'bg-primary text-white'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        aria-label={t('common.gridView', 'Grid view')}
        aria-pressed={view === 'grid'}
      >
        <Squares2X2Icon className={iconSize} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`${buttonSize} rounded-r-lg border-l border-gray-200 dark:border-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
          view === 'list'
            ? 'bg-primary text-white'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        aria-label={t('common.listView', 'List view')}
        aria-pressed={view === 'list'}
      >
        <ListBulletIcon className={iconSize} aria-hidden="true" />
      </button>
    </div>
  );
}
