import { describe, it, expect } from 'vitest';

import { formatZodErrors } from '../config/format-zod-errors.js';

describe('formatZodErrors', () => {
  it('should format a single issue', () => {
    const result = formatZodErrors([
      { path: ['location', 'timezone'], message: 'Invalid timezone' },
    ]);
    expect(result).toBe('  - location.timezone: Invalid timezone');
  });

  it('should format multiple issues', () => {
    const result = formatZodErrors([
      { path: ['location', 'latitude'], message: 'Too large' },
      { path: ['branding', 'colors', 'primary'], message: 'Invalid hex' },
    ]);
    expect(result).toBe(
      '  - location.latitude: Too large\n  - branding.colors.primary: Invalid hex',
    );
  });

  it('should handle empty path', () => {
    const result = formatZodErrors([{ path: [], message: 'Root error' }]);
    expect(result).toBe('  - (root): Root error');
  });

  it('should handle numeric path segments (array indices)', () => {
    const result = formatZodErrors([
      { path: ['supportedLanguages', 0, 'code'], message: 'Invalid code' },
    ]);
    expect(result).toBe('  - supportedLanguages.0.code: Invalid code');
  });

  it('should return empty string for empty issues array', () => {
    const result = formatZodErrors([]);
    expect(result).toBe('');
  });
});
