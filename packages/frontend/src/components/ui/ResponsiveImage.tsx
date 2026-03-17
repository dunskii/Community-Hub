/**
 * ResponsiveImage Component
 *
 * [UI/UX Spec v2.2 §13.5 - Responsive Images]
 *
 * Optimized image component with:
 * - Automatic srcset generation for responsive loading
 * - WebP with JPEG/PNG fallback via picture element
 * - Lazy loading by default
 * - Priority loading for above-the-fold images
 * - Blur or skeleton placeholder during load
 * - Dark mode brightness filter for decorative images
 * - Aspect ratio support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ResponsiveImage src="/images/hero.jpg" alt="Hero image" />
 *
 * // With aspect ratio and priority loading
 * <ResponsiveImage
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   aspectRatio="16:9"
 *   priority
 * />
 *
 * // Decorative image with dark mode filter
 * <ResponsiveImage
 *   src="/images/pattern.jpg"
 *   alt=""
 *   decorative
 * />
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Skeleton } from '../display/Skeleton';

export type AspectRatio = '1:1' | '16:9' | '4:3' | '3:2' | '2:1' | 'auto';
export type PlaceholderType = 'blur' | 'skeleton' | 'none';

export interface ResponsiveImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility (empty string for decorative images) */
  alt: string;
  /** Aspect ratio constraint */
  aspectRatio?: AspectRatio;
  /**
   * Sizes attribute for responsive images.
   * Defaults to responsive sizes based on common breakpoints.
   */
  sizes?: string;
  /** Load with high priority (above-the-fold images) */
  priority?: boolean;
  /** Placeholder type while loading */
  placeholder?: PlaceholderType;
  /** Low-quality image URL for blur placeholder */
  blurDataUrl?: string;
  /** Mark as decorative (applies dark mode brightness filter) */
  decorative?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Image width (for layout) */
  width?: number | string;
  /** Image height (for layout) */
  height?: number | string;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Object position style */
  objectPosition?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback on load error */
  onError?: () => void;
}

/** Standard responsive image widths for srcset */
const SRCSET_WIDTHS = [320, 480, 640, 800, 1200, 1920];

/** Default sizes attribute */
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

/** Aspect ratio CSS classes */
const ASPECT_RATIO_CLASSES: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '4:3': 'aspect-4-3',
  '3:2': 'aspect-[3/2]',
  '2:1': 'aspect-[2/1]',
  'auto': '',
};

/**
 * Generate srcset string from base URL
 * Assumes backend provides resized images at /w{width}/ path
 */
function generateSrcset(src: string, widths: number[]): string {
  // Check if src already contains query params
  const hasQuery = src.includes('?');

  return widths
    .map((width) => {
      // If the URL supports width parameters, add them
      // This works with image CDNs like Cloudinary, imgix, etc.
      const separator = hasQuery ? '&' : '?';
      const resizedUrl = `${src}${separator}w=${width}`;
      return `${resizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Check if URL is a WebP image
 */
function isWebP(src: string): boolean {
  return src.toLowerCase().includes('.webp');
}

/**
 * Get WebP version of URL (for CDNs that support format conversion)
 */
function getWebPUrl(src: string): string {
  const hasQuery = src.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${src}${separator}fm=webp`;
}

/**
 * Get fallback (JPEG) version of URL
 */
function getFallbackUrl(src: string): string {
  const hasQuery = src.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${src}${separator}fm=jpg`;
}

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'auto',
  sizes = DEFAULT_SIZES,
  priority = false,
  placeholder = 'skeleton',
  blurDataUrl,
  decorative = false,
  className = '',
  width,
  height,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate srcset
  const srcset = useMemo(() => generateSrcset(src, SRCSET_WIDTHS), [src]);

  // Determine if we should use picture element for format fallback
  const usePictureElement = !isWebP(src);

  // Build class names
  const containerClasses = [
    'responsive-image',
    'relative',
    'overflow-hidden',
    ASPECT_RATIO_CLASSES[aspectRatio],
    className,
  ].filter(Boolean).join(' ');

  const imageClasses = [
    'w-full',
    'h-full',
    `object-${objectFit}`,
    // Dark mode filter for decorative images
    decorative ? 'dark:brightness-90' : '',
    // Transition for smooth load
    'transition-opacity duration-300',
    isLoaded ? 'opacity-100' : 'opacity-0',
  ].filter(Boolean).join(' ');

  // Container styles
  const containerStyles: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  // Image styles
  const imageStyles: React.CSSProperties = {
    objectPosition,
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (isLoaded || hasError) return null;

    if (placeholder === 'blur' && blurDataUrl) {
      return (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
        />
      );
    }

    if (placeholder === 'skeleton') {
      return (
        <div className="absolute inset-0">
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            animation="shimmer"
            aria-hidden="true"
          />
        </div>
      );
    }

    return null;
  };

  // Render error state
  if (hasError) {
    return (
      <div
        className={`${containerClasses} bg-neutral-light dark:bg-border flex items-center justify-center`}
        style={containerStyles}
        role="img"
        aria-label={alt || 'Image failed to load'}
      >
        <svg
          className="w-12 h-12 text-secondary-content dark:text-text-secondary opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Common image props
  const imageProps = {
    alt: decorative ? '' : alt,
    className: imageClasses,
    style: imageStyles,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: priority ? ('sync' as const) : ('async' as const),
    onLoad: handleLoad,
    onError: handleError,
    ...(priority && { fetchPriority: 'high' as const }),
    ...(decorative && { 'aria-hidden': true as const }),
  };

  return (
    <div className={containerClasses} style={containerStyles}>
      {/* Placeholder */}
      {renderPlaceholder()}

      {/* Image with optional picture element for format fallback */}
      {usePictureElement ? (
        <picture>
          {/* WebP source */}
          <source
            type="image/webp"
            srcSet={generateSrcset(getWebPUrl(src), SRCSET_WIDTHS)}
            sizes={sizes}
          />
          {/* Fallback source (JPEG) */}
          <source
            type="image/jpeg"
            srcSet={generateSrcset(getFallbackUrl(src), SRCSET_WIDTHS)}
            sizes={sizes}
          />
          {/* Fallback img */}
          <img
            src={src}
            srcSet={srcset}
            sizes={sizes}
            {...imageProps}
          />
        </picture>
      ) : (
        <img
          src={src}
          srcSet={srcset}
          sizes={sizes}
          {...imageProps}
        />
      )}
    </div>
  );
}

/**
 * Simple image component without responsive features
 * For cases where srcset isn't needed (icons, avatars, etc.)
 */
export function SimpleImage({
  src,
  alt,
  className = '',
  decorative = false,
  ...props
}: Omit<ResponsiveImageProps, 'aspectRatio' | 'sizes' | 'placeholder' | 'blurDataUrl'> &
  React.ImgHTMLAttributes<HTMLImageElement>) {
  const imageClasses = [
    className,
    decorative ? 'dark:brightness-90' : '',
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      className={imageClasses}
      loading="lazy"
      decoding="async"
      {...(decorative && { 'aria-hidden': true })}
      {...props}
    />
  );
}
