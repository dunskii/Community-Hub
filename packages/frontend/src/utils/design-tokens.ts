/**
 * Design Tokens Utility
 *
 * Loads platform colours from config/platform.json and injects CSS custom properties
 * at runtime. This enables location-agnostic branding - no hardcoded colours.
 *
 * @module design-tokens
 */

interface PlatformColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  neutralLight: string;
  neutralMedium: string;
  textDark: string;
  textLight: string;
}

/**
 * Converts hex colour to RGB values
 * @param hex - Hex colour string (e.g., "#2C5F7C")
 * @returns RGB object { r, g, b }
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex colour: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Generates tint (lighter) or shade (darker) of a colour
 * @param hex - Base hex colour
 * @param percent - Percentage (0-100). Positive = tint (lighter), Negative = shade (darker)
 * @returns Hex colour string
 */
function generateTintShade(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;

  const adjust = (channel: number) => {
    if (factor > 0) {
      // Tint: mix with white (255)
      return Math.round(channel + (255 - channel) * factor);
    } else {
      // Shade: mix with black (0)
      return Math.round(channel * (1 + factor));
    }
  };

  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);

  return `#${[newR, newG, newB].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Injects CSS custom properties from platform configuration
 * @param colors - Platform colours from config/platform.json
 */
export function injectDesignTokens(colors: PlatformColors): void {
  const root = document.documentElement;

  // Base colours
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-info', colors.info);
  root.style.setProperty('--color-neutral-light', colors.neutralLight);
  root.style.setProperty('--color-neutral-medium', colors.neutralMedium);
  root.style.setProperty('--color-text-dark', colors.textDark);
  root.style.setProperty('--color-text-light', colors.textLight);

  // Generate tints and shades for primary, secondary, accent
  const tintShadePercentages = [10, 20, 30, 50, 70, 90];

  ['primary', 'secondary', 'accent'].forEach((colorName) => {
    const baseColor =
      colors[colorName as keyof Pick<PlatformColors, 'primary' | 'secondary' | 'accent'>];

    tintShadePercentages.forEach((percent) => {
      // Tints (lighter)
      const tint = generateTintShade(baseColor, percent);
      root.style.setProperty(`--color-${colorName}-tint-${percent}`, tint);

      // Shades (darker)
      const shade = generateTintShade(baseColor, -percent);
      root.style.setProperty(`--color-${colorName}-shade-${percent}`, shade);
    });
  });

  // RGB values (for rgba() usage)
  Object.entries(colors).forEach(([name, hex]) => {
    const { r, g, b } = hexToRgb(hex);
    const kebabName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--color-${kebabName}-rgb`, `${r}, ${g}, ${b}`);
  });
}

/**
 * Loads platform configuration and injects design tokens
 */
export async function loadAndInjectDesignTokens(): Promise<void> {
  try {
    const response = await fetch('/api/v1/config');
    if (!response.ok) throw new Error('Failed to load platform config');

    const config = await response.json();
    const colors: PlatformColors = {
      primary: config.branding.colors.primary,
      secondary: config.branding.colors.secondary,
      accent: config.branding.colors.accent,
      success: config.branding.colors.success || '#27AE60',
      error: config.branding.colors.error || '#E74C3C',
      warning: config.branding.colors.warning || '#E67E22',
      info: config.branding.colors.info || '#3498DB',
      neutralLight: config.branding.colors.neutralLight || '#F5F5F5',
      neutralMedium: config.branding.colors.neutralMedium || '#CCCCCC',
      textDark: config.branding.colors.textDark || '#2C3E50',
      textLight: config.branding.colors.textLight || '#7F8C8D',
    };

    injectDesignTokens(colors);
  } catch (error) {
    console.error('Failed to load design tokens:', error);
    // Fallback to Guildford South default colours
    injectDesignTokens({
      primary: '#2C5F7C',
      secondary: '#E67E22',
      accent: '#F39C12',
      success: '#27AE60',
      error: '#E74C3C',
      warning: '#E67E22',
      info: '#3498DB',
      neutralLight: '#F5F5F5',
      neutralMedium: '#CCCCCC',
      textDark: '#2C3E50',
      textLight: '#7F8C8D',
    });
  }
}
