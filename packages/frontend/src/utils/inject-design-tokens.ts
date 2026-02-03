import type { BrandingConfig } from '@community-hub/shared';

const COLOR_PROPERTIES: ReadonlyArray<{
  property: string;
  key: keyof BrandingConfig['colors'];
}> = [
  { property: '--ch-color-primary', key: 'primary' },
  { property: '--ch-color-secondary', key: 'secondary' },
  { property: '--ch-color-accent', key: 'accent' },
  { property: '--ch-color-success', key: 'success' },
  { property: '--ch-color-error', key: 'error' },
  { property: '--ch-color-warning', key: 'warning' },
  { property: '--ch-color-info', key: 'info' },
];

/**
 * Inject branding colours from platform config as CSS custom properties.
 * These override the static defaults in app.css @theme block.
 * Called once during app initialisation after config loads.
 */
export function injectDesignTokens(branding: BrandingConfig): void {
  const root = document.documentElement;
  const { colors } = branding;

  for (const { property, key } of COLOR_PROPERTIES) {
    const value = colors[key];
    if (value) {
      root.style.setProperty(property, value);
    }
  }
}
