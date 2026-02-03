import type { ElementType, HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  hoverable?: boolean;
  as?: ElementType;
}

/**
 * Base card component [Spec §6.3].
 *
 * - White background, 8px border radius, subtle shadow
 * - Hover shadow on hoverable cards
 * - Renders as any HTML element via `as` prop
 */
export function Card({
  children,
  hoverable = false,
  as: Component = 'div',
  className = '',
  ...props
}: CardProps) {
  return (
    <Component
      className={[
        'bg-white rounded-md shadow-card p-4',
        hoverable
          ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Component>
  );
}
