/**
 * Australian phone number validator
 * Supports formats: +61299999999, 0299999999, 02 9999 9999
 */

// Australian phone number regex
// Matches: +61 or 0, followed by 2-9 (area code), then 8 digits
const AUSTRALIAN_PHONE_REGEX = /^(\+61|0)[2-9]\d{8}$/;

/**
 * Validates an Australian phone number
 * @param phone - Phone number to validate
 * @returns true if valid Australian phone format
 */
export function validateAustralianPhone(phone: string): boolean {
  if (!phone) {
    return false;
  }

  // Remove spaces, hyphens, and parentheses for validation
  const cleaned = phone.replace(/[\s\-()]/g, '');

  return AUSTRALIAN_PHONE_REGEX.test(cleaned);
}

/**
 * Formats an Australian phone number to standardized format
 * @param phone - Phone number to format
 * @returns Formatted phone number (e.g., "02 9999 9999") or original if invalid
 */
export function formatAustralianPhone(phone: string): string {
  if (!phone) {
    return phone;
  }

  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Convert +61 to 0
  const normalized = cleaned.startsWith('+61') ? '0' + cleaned.slice(3) : cleaned;

  // Validate before formatting
  if (!AUSTRALIAN_PHONE_REGEX.test(normalized)) {
    return phone; // Return original if invalid
  }

  // Format as: 02 9999 9999 or 04XX XXX XXX
  if (normalized.startsWith('04')) {
    // Mobile: 04XX XXX XXX
    return normalized.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  } else {
    // Landline: 0X XXXX XXXX
    return normalized.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
  }
}
