import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../hooks/useTheme';

type ThemeToggleSize = 'sm' | 'md' | 'lg';
type ThemeToggleVariant = 'button' | 'dropdown' | 'segmented';

interface ThemeToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Size of the toggle */
  size?: ThemeToggleSize;
  /** Toggle variant */
  variant?: ThemeToggleVariant;
  /** Show label text */
  showLabel?: boolean;
  /** Only toggle between light/dark (no system option) */
  simpleToggle?: boolean;
}

const SIZE_CLASSES: Record<ThemeToggleSize, string> = {
  sm: 'min-h-8 min-w-8 p-1.5 text-sm',
  md: 'min-h-[2.75rem] min-w-[2.75rem] p-2 text-base',
  lg: 'min-h-12 min-w-12 p-2.5 text-lg',
};

const ICON_SIZE: Record<ThemeToggleSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Sun icon for light mode
 */
function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * System/Auto icon
 */
function SystemIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/**
 * Get the icon for a theme mode
 */
function getThemeIcon(theme: ThemeMode, size: number) {
  switch (theme) {
    case 'light':
      return <SunIcon size={size} />;
    case 'dark':
      return <MoonIcon size={size} />;
    case 'system':
      return <SystemIcon size={size} />;
  }
}

/**
 * Theme Toggle Component
 *
 * Provides a button to toggle between light, dark, and system themes.
 * WCAG 2.1 AA compliant with proper focus management and ARIA labels.
 *
 * [UI/UX Spec v2.2 §1 - Dark Mode]
 *
 * @example
 * ```tsx
 * // Simple toggle (light/dark only)
 * <ThemeToggle simpleToggle />
 *
 * // Full toggle with system option (cycles through modes)
 * <ThemeToggle />
 *
 * // With visible label
 * <ThemeToggle showLabel />
 *
 * // Segmented control (shows all options)
 * <ThemeToggle variant="segmented" />
 * ```
 */
export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  function ThemeToggle(
    {
      size = 'md',
      variant = 'button',
      showLabel = false,
      simpleToggle = false,
      className = '',
      ...props
    },
    ref
  ) {
    const { t } = useTranslation();
    const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeContext();

    const iconSize = ICON_SIZE[size];

    // Get localized label for current theme
    const getThemeLabel = (mode: ThemeMode): string => {
      switch (mode) {
        case 'light':
          return t('theme.light', 'Light');
        case 'dark':
          return t('theme.dark', 'Dark');
        case 'system':
          return t('theme.system', 'System');
      }
    };

    // Handle click - either simple toggle or cycle through modes
    const handleClick = () => {
      if (simpleToggle) {
        toggleTheme();
      } else {
        // Cycle: system -> light -> dark -> system
        const nextTheme: ThemeMode =
          theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
        setTheme(nextTheme);
      }
    };

    // Render segmented control variant
    if (variant === 'segmented') {
      const modes: ThemeMode[] = simpleToggle
        ? ['light', 'dark']
        : ['system', 'light', 'dark'];

      return (
        <div
          role="radiogroup"
          aria-label={t('theme.toggle', 'Theme')}
          className={[
            'inline-flex rounded-md overflow-hidden',
            'border border-default',
            'bg-surface',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={theme === mode}
              onClick={() => setTheme(mode)}
              className={[
                'inline-flex items-center justify-center gap-1.5',
                'px-3 py-1.5',
                'text-sm font-medium',
                'transition-colors duration-fast',
                'focus-visible:focus-ring focus-visible:z-10',
                theme === mode
                  ? 'bg-primary text-white'
                  : 'text-secondary-content hover:bg-hover',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {getThemeIcon(mode, 16)}
              <span>{getThemeLabel(mode)}</span>
            </button>
          ))}
        </div>
      );
    }

    // Default button variant
    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        aria-label={t('theme.toggleLabel', 'Toggle theme (currently {{theme}})', {
          theme: getThemeLabel(theme),
        })}
        className={[
          'inline-flex items-center justify-center gap-2',
          'rounded-md',
          'bg-surface text-secondary-content',
          'border border-default',
          'hover:bg-hover hover:text-primary-content',
          'transition-colors duration-fast',
          'focus-visible:focus-ring',
          SIZE_CLASSES[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {/* Show resolved theme icon (what's actually displayed) */}
        {resolvedTheme === 'dark' ? (
          <MoonIcon size={iconSize} />
        ) : (
          <SunIcon size={iconSize} />
        )}

        {showLabel && (
          <span className="text-sm font-medium">{getThemeLabel(theme)}</span>
        )}

        {/* Visually hidden text for screen readers */}
        <span className="sr-only">
          {t('theme.current', 'Current theme: {{theme}}', {
            theme: getThemeLabel(theme),
          })}
        </span>
      </button>
    );
  }
);

export default ThemeToggle;
export type { ThemeToggleProps, ThemeToggleSize, ThemeToggleVariant };
