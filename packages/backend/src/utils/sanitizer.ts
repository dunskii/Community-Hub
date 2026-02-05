import DOMPurify from 'isomorphic-dompurify';

// Spec Section 4.9: Allowed HTML tags for rich text fields
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTR = ['href', 'target'];

/**
 * Sanitize rich text input. Allows a safe subset of HTML tags per Spec Section 4.9.
 * Ensures all anchor tags have rel="nofollow noopener".
 */
export function sanitizeRichText(dirty: string): string {
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  // Ensure all <a> tags have rel="nofollow noopener" (Spec Section 4.9)
  return clean.replace(/<a\s/g, '<a rel="nofollow noopener" ');
}

/**
 * Strip all HTML tags from input. Use for plain text fields.
 * Spec Section 4.9: Plain text fields strip all HTML tags.
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Validate and sanitize a URL. Blocks javascript:, data:, and vbscript: schemes.
 * Spec Section 4.9: URL fields must validate format and block dangerous schemes.
 * Returns the sanitized URL string, or null if invalid/dangerous.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    // URL constructor normalises protocol to lowercase, so mixed-case
    // bypass attempts like "JaVaScRiPt:" are handled automatically.
    const parsed = new URL(url);
    if (['javascript:', 'data:', 'vbscript:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
