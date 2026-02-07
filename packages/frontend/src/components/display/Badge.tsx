import React from 'react';

interface BadgeProps {
  /** Badge content (text or number) */
  children: React.ReactNode;
  /** Badge variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Dot badge (small indicator) */
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  if (dot) {
    return (
      <span className={`inline-block w-2 h-2 rounded-full ${variantStyles[variant]}`} />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}
