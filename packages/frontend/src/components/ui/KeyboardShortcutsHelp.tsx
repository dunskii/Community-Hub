/**
 * KeyboardShortcutsHelp Component
 *
 * [UI/UX Spec v2.2 §3 - Keyboard Shortcuts]
 *
 * Modal displaying all available keyboard shortcuts grouped by category.
 * Triggered by pressing '?' key.
 *
 * @example
 * ```tsx
 * <KeyboardShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
 * ```
 */

import { useTranslation } from 'react-i18next';
import { Modal } from '../display/Modal';

interface KeyboardShortcutsHelpProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  descriptionKey: string;
}

interface ShortcutGroup {
  titleKey: string;
  shortcuts: ShortcutItem[];
}

/**
 * All available keyboard shortcuts grouped by category
 */
const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'shortcuts.groups.navigation',
    shortcuts: [
      { keys: ['G', 'then', 'H'], descriptionKey: 'shortcuts.goHome' },
      { keys: ['G', 'then', 'B'], descriptionKey: 'shortcuts.goBusinesses' },
      { keys: ['G', 'then', 'E'], descriptionKey: 'shortcuts.goEvents' },
    ],
  },
  {
    titleKey: 'shortcuts.groups.actions',
    shortcuts: [
      { keys: ['/'], descriptionKey: 'shortcuts.search' },
      { keys: ['Escape'], descriptionKey: 'shortcuts.close' },
      { keys: ['?'], descriptionKey: 'shortcuts.help' },
    ],
  },
];

/**
 * Keyboard key badge component
 */
function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-neutral-light dark:bg-border text-sm font-mono font-medium text-primary-content dark:text-text-primary rounded border border-border dark:border-neutral-medium shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Render shortcut keys with proper styling
 */
function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => {
        if (key === 'then') {
          return (
            <span key={index} className="text-sm text-secondary-content dark:text-text-secondary px-1">
              then
            </span>
          );
        }
        return <KeyBadge key={index}>{key}</KeyBadge>;
      })}
    </div>
  );
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('shortcuts.title')}
      size="md"
    >
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        {SHORTCUT_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-sm font-semibold text-secondary-content dark:text-text-secondary uppercase tracking-wider mb-3">
              {t(group.titleKey)}
            </h3>
            <ul className="space-y-2" role="list">
              {group.shortcuts.map((shortcut, shortcutIndex) => (
                <li
                  key={shortcutIndex}
                  className="flex items-center justify-between py-2 border-b border-border dark:border-neutral-medium last:border-0"
                >
                  <span className="text-primary-content dark:text-text-primary">
                    {t(shortcut.descriptionKey)}
                  </span>
                  <ShortcutKeys keys={shortcut.keys} />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-4 border-t border-border dark:border-neutral-medium">
          <p className="text-sm text-secondary-content dark:text-text-secondary">
            {t('shortcuts.hint')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
