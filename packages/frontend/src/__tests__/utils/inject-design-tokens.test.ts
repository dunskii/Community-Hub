import { describe, it, expect, beforeEach } from 'vitest';

import { injectDesignTokens } from '../../utils/inject-design-tokens.js';

const TEST_BRANDING = {
  platformName: 'Test Hub',
  platformNameShort: 'Test',
  tagline: 'Testing',
  description: 'A test hub',
  legalEntityName: 'Test Entity',
  copyrightHolder: 'Test Holder',
  colors: {
    primary: '#111111',
    secondary: '#222222',
    accent: '#333333',
    success: '#444444',
    error: '#555555',
    warning: '#666666',
    info: '#777777',
  },
  logos: {
    primary: '/logo.svg',
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png',
  },
  socialHashtags: {
    primary: '#TestHub',
    secondary: ['#Test'],
  },
};

describe('injectDesignTokens', () => {
  beforeEach(() => {
    // Reset any inline styles on documentElement
    document.documentElement.removeAttribute('style');
  });

  it('sets all 7 colour custom properties on :root', () => {
    injectDesignTokens(TEST_BRANDING);

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--ch-color-primary')).toBe('#111111');
    expect(root.style.getPropertyValue('--ch-color-secondary')).toBe('#222222');
    expect(root.style.getPropertyValue('--ch-color-accent')).toBe('#333333');
    expect(root.style.getPropertyValue('--ch-color-success')).toBe('#444444');
    expect(root.style.getPropertyValue('--ch-color-error')).toBe('#555555');
    expect(root.style.getPropertyValue('--ch-color-warning')).toBe('#666666');
    expect(root.style.getPropertyValue('--ch-color-info')).toBe('#777777');
  });

  it('overwrites previously set properties', () => {
    injectDesignTokens(TEST_BRANDING);
    expect(document.documentElement.style.getPropertyValue('--ch-color-primary')).toBe('#111111');

    injectDesignTokens({
      ...TEST_BRANDING,
      colors: { ...TEST_BRANDING.colors, primary: '#AAAAAA' },
    });
    expect(document.documentElement.style.getPropertyValue('--ch-color-primary')).toBe('#AAAAAA');
  });
});
