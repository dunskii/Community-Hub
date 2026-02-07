import { isRTL as checkRTL } from './utils';

/**
 * RTL-specific utilities for layout and styling
 */

/**
 * Check if current document is in RTL mode
 */
export function isDocumentRTL(): boolean {
  return document.documentElement.getAttribute('dir') === 'rtl';
}

/**
 * Get appropriate margin/padding for inline-start
 * (left in LTR, right in RTL)
 */
export function getInlineStart(): 'left' | 'right' {
  return isDocumentRTL() ? 'right' : 'left';
}

/**
 * Get appropriate margin/padding for inline-end
 * (right in LTR, left in RTL)
 */
export function getInlineEnd(): 'left' | 'right' {
  return isDocumentRTL() ? 'left' : 'right';
}

/**
 * Mirror transform for directional icons
 * Returns CSS transform value
 */
export function mirrorIcon(): string {
  return isDocumentRTL() ? 'scaleX(-1)' : 'none';
}
