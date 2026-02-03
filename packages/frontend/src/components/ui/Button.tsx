import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Spinner } from './Spinner.js';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-secondary text-white hover:brightness-90 active:brightness-85 active:scale-[0.98]',
  secondary:
    'bg-white text-primary border border-primary hover:bg-primary hover:text-white active:scale-[0.98]',
  tertiary:
    'bg-transparent text-primary hover:bg-primary/10 active:scale-[0.98]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-[2.75rem] px-4 text-body',
  lg: 'min-h-12 px-6 text-body',
};

/**
 * Base button component [Spec §6.3, §7.1].
 *
 * - 4 variants: primary, secondary, tertiary, disabled (via disabled prop)
 * - 6 states: default, hover, active, focus, disabled, loading
 * - 44px minimum touch target on md size [Spec §3.4]
 * - Accessible focus ring [Spec §3.6]
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    className = '',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-sm font-body font-semibold',
        'transition-all duration-150 ease-in-out',
        'focus-visible:focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isDisabled
          ? 'bg-neutral-medium text-text-light cursor-not-allowed'
          : VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
