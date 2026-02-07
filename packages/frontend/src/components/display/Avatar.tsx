import React from 'react';

interface AvatarProps {
  /** User name for initials fallback */
  name: string;
  /** Avatar image URL */
  src?: string;
  /** Avatar size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Alt text for image */
  alt?: string;
}

export function Avatar({
  name,
  src,
  size = 'md',
  alt,
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Generate initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate background color from name (consistent color for same name)
  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor(name)} rounded-full flex items-center justify-center text-white font-semibold`}
      aria-label={`${name}'s avatar`}
    >
      {getInitials(name)}
    </div>
  );
}
