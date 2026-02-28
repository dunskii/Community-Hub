/**
 * Australian postcode validator
 * Australian postcodes are 4 digits, range from 0200 to 9999
 */

/**
 * Validates an Australian postcode
 * @param postcode - Postcode to validate (string or number)
 * @param allowedRange - Optional array of allowed postcodes (from platform.json)
 * @returns true if valid Australian postcode format
 */
export function validateAustralianPostcode(
  postcode: string | number,
  allowedRange?: string[]
): boolean {
  if (!postcode) {
    return false;
  }

  const postcodeStr = String(postcode);

  // Must be exactly 4 digits
  if (!/^\d{4}$/.test(postcodeStr)) {
    return false;
  }

  const postcodeNum = Number(postcodeStr);

  // Australian postcodes range from 0200 to 9999
  // (0000-0199 are not used, 0200-0299 are used for Australian Capital Territory)
  if (postcodeNum < 200 || postcodeNum > 9999) {
    return false;
  }

  // If allowed range is provided, check if postcode is in range
  if (allowedRange && allowedRange.length > 0) {
    return allowedRange.includes(postcodeStr);
  }

  return true;
}

/**
 * Formats a postcode to 4-digit string
 * @param postcode - Postcode to format
 * @returns Formatted postcode with leading zeros if needed
 */
export function formatAustralianPostcode(postcode: string | number): string {
  if (!postcode) {
    return '';
  }

  const postcodeStr = String(postcode);

  // Pad with leading zeros if needed
  return postcodeStr.padStart(4, '0');
}
