# Phase 3: Design System & Core Components - Implementation Plan

**Plan Date:** 2026-02-07
**Phase Status:** Not Started (Can run parallel to Phase 2)
**Total Tasks:** 40 tasks
**Estimated Effort:** 80-100 hours (2-3 weeks for 1 developer)
**Specification References:** §6 (Design), §7 (UI States), §3.6 (Accessibility)

---

## Table of Contents

1. [Overview](#overview)
2. [Success Criteria](#success-criteria)
3. [Dependencies & Blockers](#dependencies--blockers)
4. [Implementation Phases](#implementation-phases)
5. [Detailed Task Breakdown](#detailed-task-breakdown)
6. [Location-Agnostic Configuration](#location-agnostic-configuration)
7. [Accessibility Requirements](#accessibility-requirements)
8. [Testing Strategy](#testing-strategy)
9. [Risk Assessment](#risk-assessment)
10. [Integration Points](#integration-points)

---

## Overview

### Purpose

Phase 3 establishes the visual foundation and reusable component library for the entire Community Hub platform. It creates a comprehensive design system and 30+ accessible React components that will be used across all feature phases (4-19).

### Scope

**3.1 Design System (12 tasks)**
- Colour system with CSS custom properties from `config/platform.json`
- Typography system (Montserrat + Open Sans)
- Component visual specifications

**3.2 Core UI Components (24 tasks)**
- Layout components: Header, Footer, PageContainer, BottomNav, Sidebar, Grid
- Form components: Button, Input, Textarea, Select, Checkbox, Radio, Toggle, DatePicker, TimePicker, FileUpload
- Display components: Card, Modal, Toast, Alert, Badge, Avatar, Icon, Spinner, Skeleton, EmptyState, Pagination, Tabs, Accordion, Carousel

**3.3 Accessibility (9 tasks)**
- WCAG 2.1 AA compliance across all components
- Keyboard navigation, screen reader support, focus indicators, colour contrast, touch targets

### Key Principles

1. **Location-Agnostic:** All colours, logos, branding from `config/platform.json` - never hardcoded
2. **Mobile-First:** Responsive design with touch targets ≥ 44px
3. **Accessible:** WCAG 2.1 AA compliant, keyboard navigable, screen reader tested
4. **Multilingual:** RTL support for Arabic/Urdu, translation-ready
5. **Reusable:** Components designed for reuse across all phases

---

## Success Criteria

Phase 3 is complete when:

1. ✅ All 40 tasks completed (12 design + 24 components + 9 accessibility)
2. ✅ Component library published/documented
3. ✅ 100% keyboard navigable across all components
4. ✅ WCAG 2.1 AA compliance verified (zero axe violations)
5. ✅ Accessibility tests passing (jest-axe on all components)
6. ✅ Responsive design verified (mobile, tablet, desktop)
7. ✅ Touch targets ≥ 44px on all interactive elements
8. ✅ Colour contrast ≥ 4.5:1 verified on all text
9. ✅ Screen reader tested (NVDA/JAWS/VoiceOver)
10. ✅ Zero console errors in browser DevTools

### Quality Metrics

- **Test Coverage:** > 80% (all components)
- **Accessibility Score:** 100% on Lighthouse
- **Performance:** < 100ms component render time
- **Bundle Size:** < 150KB gzipped (component library)

---

## Dependencies & Blockers

### Prerequisites (COMPLETE ✅)

1. **Phase 1.4 (Frontend Infrastructure)**
   - Tailwind CSS 4 configured
   - Design tokens system scaffolding
   - 5 base components: Button, Card, FormField, SkipLink, Spinner
   - PWA manifest, service worker

2. **Phase 1.8 (i18n Foundation)**
   - Translation infrastructure (i18next)
   - RTL support scaffolding
   - Language switching hook
   - 10 languages configured

### What Phase 3 Blocks

1. **Phase 4 (Business Directory Core)** - Cannot start until Phase 3 complete
2. **Phase 5+ (All feature phases)** - Will use Phase 3 components

### Can Run in Parallel

- **Phase 2 (Authentication & User System)** - Can use temporary components initially, migrate to Phase 3 components when ready

---

## Implementation Phases

### Phase 1: Design System Foundation (15-20 hours)

**Goal:** Establish colour system, typography, and component specifications

**Tasks:** 3.1.1 - 3.1.3 (12 tasks)

**Deliverables:**
- CSS custom properties from platform.json
- Colour tints/shades system
- Typography system (fonts loaded, responsive sizing)
- Component visual specifications documented

---

### Phase 2: Layout Components (12 hours)

**Goal:** Create structural layout components

**Tasks:** 3.2.1 (6 tasks)

**Deliverables:**
- Header, Footer, PageContainer, BottomNavigation, Sidebar, Grid components
- Responsive layouts (mobile, tablet, desktop)
- Sticky positioning, collapsible navigation

---

### Phase 3: Form Components (20 hours)

**Goal:** Create form input components with validation states

**Tasks:** 3.2.2 (10 tasks)

**Deliverables:**
- Button (enhanced), Input, Textarea, Select, Checkbox, Radio, Toggle, DatePicker, TimePicker, FileUpload
- All validation states (default, hover, focus, error, disabled)
- Mobile-aware (native inputs on touch devices)

---

### Phase 4: Display Components Part 1 (15 hours)

**Goal:** Create core display components

**Tasks:** 3.2.3 (7 tasks - Modal, Toast, Alert, Badge, Avatar, Icon, Skeleton)

**Deliverables:**
- Card (enhanced), Modal, Toast, Alert, Badge, Avatar, Icon components
- Focus traps, animations, stacking behavior

---

### Phase 5: Display Components Part 2 (10 hours)

**Goal:** Create advanced display components

**Tasks:** 3.2.3 (7 tasks - EmptyState, Pagination, Tabs, Accordion, Carousel)

**Deliverables:**
- Spinner (enhanced), EmptyState, Pagination, Tabs, Accordion, Carousel components
- Keyboard navigation, ARIA attributes

---

### Phase 6: Accessibility Implementation (8 hours)

**Goal:** Ensure WCAG 2.1 AA compliance across all components

**Tasks:** 3.3 (9 tasks)

**Deliverables:**
- Focus indicators on all interactive elements
- ARIA live regions, labels, descriptions
- Keyboard navigation (no traps)
- Alt text enforcement
- Touch target sizing ≥ 44px

---

### Phase 7: Testing & Quality Assurance (10 hours)

**Goal:** Verify accessibility, responsiveness, and functionality

**Deliverables:**
- jest-axe tests for all components (zero violations)
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Responsive testing (3 breakpoints)
- Colour contrast verification (all text ≥ 4.5:1)
- Device testing (mobile touch, tablet, desktop keyboard)

---

### Phase 8: Documentation & Integration (5 hours)

**Goal:** Document components and prepare for Phase 4 integration

**Deliverables:**
- Component documentation (props, usage examples)
- Accessibility guidelines for component usage
- Integration examples for Phase 4

---

## Detailed Task Breakdown

### Phase 1: Design System Foundation

---

#### Task 3.1.1.1: Implement CSS Custom Properties System

**Description:** Create utility to load colours from `config/platform.json` and inject CSS custom properties at runtime.

**Files to Create:**
- `packages/frontend/src/utils/design-tokens.ts`
- `packages/frontend/src/hooks/useDesignTokens.ts`

**Files to Modify:**
- `packages/frontend/src/main.tsx` (call design token injection on app load)

**Implementation Steps:**

1. Create `design-tokens.ts`:
```typescript
// packages/frontend/src/utils/design-tokens.ts

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

  return `#${[newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('')}`;
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

  ['primary', 'secondary', 'accent'].forEach(colorName => {
    const baseColor = colors[colorName as keyof Pick<PlatformColors, 'primary' | 'secondary' | 'accent'>];

    tintShadePercentages.forEach(percent => {
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
```

2. Create `useDesignTokens.ts` hook:
```typescript
// packages/frontend/src/hooks/useDesignTokens.ts

import { useEffect, useState } from 'react';

export function useDesignTokens() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Design tokens should already be injected by main.tsx
    // This hook just provides a way to check if they're ready
    const root = document.documentElement;
    const primaryColor = getComputedStyle(root).getPropertyValue('--color-primary');

    if (primaryColor) {
      setLoaded(true);
    }
  }, []);

  return { loaded };
}
```

3. Modify `main.tsx` to inject tokens on app load:
```typescript
// packages/frontend/src/main.tsx (add at top, before ReactDOM.render)

import { loadAndInjectDesignTokens } from './utils/design-tokens';

// Load design tokens before rendering
loadAndInjectDesignTokens().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

**Acceptance Criteria:**
- ✅ CSS custom properties injected on app load
- ✅ Colours loaded from platform.json (or fallback to Guildford defaults)
- ✅ Tints/shades generated for primary, secondary, accent (10%, 20%, 30%, 50%, 70%, 90%)
- ✅ RGB values available for rgba() usage
- ✅ No hardcoded colours in components (all use CSS vars)

**Testing:**
- Open browser DevTools → Inspect `<html>` element → Computed styles
- Verify `--color-primary`, `--color-primary-tint-10`, `--color-primary-shade-50`, etc. exist

**Dependencies:** None

---

#### Task 3.1.1.2: Create Primary Colour Palette

**Description:** Generate primary colour tints/shades and document usage guidelines.

**Files to Create:**
- `packages/frontend/src/styles/colours.css`

**Implementation:**

```css
/* packages/frontend/src/styles/colours.css */

/**
 * Colour System
 *
 * All colours are loaded from config/platform.json at runtime.
 * Use CSS custom properties (--color-*) in all components.
 *
 * NEVER hardcode hex values in components.
 */

:root {
  /* Base colours (injected by design-tokens.ts) */
  /* --color-primary: #2C5F7C (Guildford South default) */
  /* --color-secondary: #E67E22 */
  /* --color-accent: #F39C12 */

  /* Primary tints (lighter) */
  /* --color-primary-tint-10: calculated */
  /* --color-primary-tint-20: calculated */
  /* --color-primary-tint-30: calculated */
  /* --color-primary-tint-50: calculated */
  /* --color-primary-tint-70: calculated */
  /* --color-primary-tint-90: calculated */

  /* Primary shades (darker) */
  /* --color-primary-shade-10: calculated */
  /* --color-primary-shade-20: calculated */
  /* --color-primary-shade-30: calculated */
  /* --color-primary-shade-50: calculated */
  /* --color-primary-shade-70: calculated */
  /* --color-primary-shade-90: calculated */

  /* Semantic colours */
  /* --color-success: #27AE60 */
  /* --color-error: #E74C3C */
  /* --color-warning: #E67E22 */
  /* --color-info: #3498DB */

  /* Neutral colours */
  /* --color-neutral-light: #F5F5F5 */
  /* --color-neutral-medium: #CCCCCC */

  /* Text colours */
  /* --color-text-dark: #2C3E50 */
  /* --color-text-light: #7F8C8D */

  /* RGB values (for rgba() usage) */
  /* --color-primary-rgb: 44, 95, 124 */
}

/* Utility classes for text colours */
.text-primary { color: var(--color-primary); }
.text-secondary { color: var(--color-secondary); }
.text-accent { color: var(--color-accent); }
.text-success { color: var(--color-success); }
.text-error { color: var(--color-error); }
.text-warning { color: var(--color-warning); }
.text-info { color: var(--color-info); }
.text-dark { color: var(--color-text-dark); }
.text-light { color: var(--color-text-light); }

/* Utility classes for background colours */
.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-accent { background-color: var(--color-accent); }
.bg-success { background-color: var(--color-success); }
.bg-error { background-color: var(--color-error); }
.bg-warning { background-color: var(--color-warning); }
.bg-info { background-color: var(--color-info); }
.bg-neutral-light { background-color: var(--color-neutral-light); }
.bg-neutral-medium { background-color: var(--color-neutral-medium); }

/* Utility classes for border colours */
.border-primary { border-color: var(--color-primary); }
.border-secondary { border-color: var(--color-secondary); }
.border-accent { border-color: var(--color-accent); }
.border-neutral-medium { border-color: var(--color-neutral-medium); }

/* Opacity utilities for hover/disabled states */
.hover-darken:hover {
  filter: brightness(0.9);
}

.disabled-opacity {
  opacity: 0.5;
}
```

**Acceptance Criteria:**
- ✅ Colour utility classes created
- ✅ Usage guidelines documented
- ✅ No hardcoded hex values

**Dependencies:** Task 3.1.1.1

---

#### Task 3.1.1.3: Create Secondary & Accent Colour Variants

**Description:** Same as primary colour system for secondary/accent.

**Implementation:**
Already handled by Task 3.1.1.1 (tints/shades generated for all three colours).

**Acceptance Criteria:**
- ✅ Secondary tints/shades available (`--color-secondary-tint-10`, etc.)
- ✅ Accent tints/shades available (`--color-accent-tint-10`, etc.)

**Dependencies:** Task 3.1.1.1

---

#### Task 3.1.1.4: Implement Semantic Colours

**Description:** Define success, error, warning, info colours with configurable overrides.

**Implementation:**
Already handled by Task 3.1.1.1 (semantic colours loaded from config with fallbacks).

**Acceptance Criteria:**
- ✅ Success green (#27AE60 default, configurable)
- ✅ Error red (#E74C3C default, configurable)
- ✅ Warning orange (#E67E22 default, configurable)
- ✅ Info blue (#3498DB default, configurable)

**Dependencies:** Task 3.1.1.1

---

#### Task 3.1.2.1: Load Montserrat Font

**Description:** Load Montserrat font (headings) via Google Fonts with `font-display: swap`.

**Files to Modify:**
- `packages/frontend/index.html` (add font link to `<head>`)

**Implementation:**

```html
<!-- packages/frontend/index.html -->
<head>
  <!-- ... existing tags ... -->

  <!-- Google Fonts: Montserrat (headings) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
</head>
```

**Acceptance Criteria:**
- ✅ Montserrat font loaded (weights: 600 semi-bold, 700 bold)
- ✅ `font-display: swap` prevents FOUT (Flash of Unstyled Text)
- ✅ Preconnect to Google Fonts for faster loading

**Dependencies:** None

---

#### Task 3.1.2.2: Load Open Sans Font

**Description:** Load Open Sans font (body) via Google Fonts with `font-display: swap`.

**Files to Modify:**
- `packages/frontend/index.html` (add font link to `<head>`)

**Implementation:**

```html
<!-- packages/frontend/index.html -->
<head>
  <!-- ... existing tags ... -->

  <!-- Google Fonts: Open Sans (body) -->
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
</head>
```

**Acceptance Criteria:**
- ✅ Open Sans font loaded (weights: 400 regular, 600 semi-bold)
- ✅ `font-display: swap` prevents FOUT

**Dependencies:** None

---

#### Task 3.1.2.3: Implement H1-H6 Heading Scale

**Description:** Create heading styles with responsive sizing (90% on mobile).

**Files to Create:**
- `packages/frontend/src/styles/typography.css`

**Implementation:**

```css
/* packages/frontend/src/styles/typography.css */

/**
 * Typography System
 *
 * Font Stack:
 * - Headings: Montserrat (Google Fonts)
 * - Body: Open Sans (Google Fonts)
 * - Fallback: system-ui, -apple-system, sans-serif
 *
 * Responsive Sizing:
 * - Mobile (< 768px): 90% of desktop size
 * - Tablet (768-1199px): 95% of desktop size
 * - Desktop (≥ 1200px): Full size
 */

:root {
  /* Font families */
  --font-heading: 'Montserrat', system-ui, -apple-system, sans-serif;
  --font-body: 'Open Sans', system-ui, -apple-system, sans-serif;

  /* Font weights */
  --font-regular: 400;
  --font-semibold: 600;
  --font-bold: 700;

  /* Desktop font sizes */
  --font-size-h1: 32px;
  --font-size-h2: 26px;
  --font-size-h3: 22px;
  --font-size-h4: 18px;
  --font-size-h5: 16px;
  --font-size-h6: 14px;
  --font-size-body: 16px;
  --font-size-small: 14px;
  --font-size-caption: 12px;

  /* Line heights */
  --line-height-h1: 1.2;
  --line-height-h2: 1.3;
  --line-height-h3: 1.3;
  --line-height-h4: 1.4;
  --line-height-h5: 1.4;
  --line-height-h6: 1.5;
  --line-height-body: 1.5;
  --line-height-small: 1.5;
  --line-height-caption: 1.6;
}

/* Headings */
h1, .h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h1);
  font-weight: var(--font-bold);
  line-height: var(--line-height-h1);
  margin-bottom: 0.5em;
}

h2, .h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  font-weight: var(--font-bold);
  line-height: var(--line-height-h2);
  margin-bottom: 0.5em;
}

h3, .h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: var(--font-semibold);
  line-height: var(--line-height-h3);
  margin-bottom: 0.5em;
}

h4, .h4 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h4);
  font-weight: var(--font-semibold);
  line-height: var(--line-height-h4);
  margin-bottom: 0.5em;
}

h5, .h5 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h5);
  font-weight: var(--font-semibold);
  line-height: var(--line-height-h5);
  margin-bottom: 0.5em;
}

h6, .h6 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h6);
  font-weight: var(--font-semibold);
  line-height: var(--line-height-h6);
  margin-bottom: 0.5em;
}

/* Body text */
body {
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  font-weight: var(--font-regular);
  line-height: var(--line-height-body);
  color: var(--color-text-dark);
}

/* Text utilities */
.text-small {
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
}

.text-caption {
  font-size: var(--font-size-caption);
  line-height: var(--line-height-caption);
}

.font-regular { font-weight: var(--font-regular); }
.font-semibold { font-weight: var(--font-semibold); }
.font-bold { font-weight: var(--font-bold); }

/* Responsive typography */
@media (max-width: 767px) {
  /* Mobile: 90% of desktop size */
  h1, .h1 { font-size: calc(var(--font-size-h1) * 0.9); }
  h2, .h2 { font-size: calc(var(--font-size-h2) * 0.9); }
  h3, .h3 { font-size: calc(var(--font-size-h3) * 0.9); }
  h4, .h4 { font-size: calc(var(--font-size-h4) * 0.9); }
  h5, .h5 { font-size: calc(var(--font-size-h5) * 0.9); }
  h6, .h6 { font-size: calc(var(--font-size-h6) * 0.9); }
}

@media (min-width: 768px) and (max-width: 1199px) {
  /* Tablet: 95% of desktop size */
  h1, .h1 { font-size: calc(var(--font-size-h1) * 0.95); }
  h2, .h2 { font-size: calc(var(--font-size-h2) * 0.95); }
  h3, .h3 { font-size: calc(var(--font-size-h3) * 0.95); }
  h4, .h4 { font-size: calc(var(--font-size-h4) * 0.95); }
  h5, .h5 { font-size: calc(var(--font-size-h5) * 0.95); }
  h6, .h6 { font-size: calc(var(--font-size-h6) * 0.95); }
}
```

**Acceptance Criteria:**
- ✅ H1-H6 heading styles defined
- ✅ Responsive sizing (90% mobile, 95% tablet, 100% desktop)
- ✅ Montserrat font for headings
- ✅ Utility classes (.h1, .h2, etc.) for non-heading elements

**Dependencies:** Tasks 3.1.2.1, 3.1.2.2

---

#### Task 3.1.2.4: Create Body Text Styles

**Description:** Define body, small, caption text styles with line-height utilities.

**Implementation:**
Already handled by Task 3.1.2.3 (typography.css includes body, small, caption).

**Acceptance Criteria:**
- ✅ Body: 16px, regular (400), 1.5 line-height
- ✅ Small: 14px, regular (400), 1.5 line-height
- ✅ Caption: 12px, regular (400), 1.6 line-height

**Dependencies:** Task 3.1.2.3

---

#### Task 3.1.2.5: Implement Font-Weight Utility Classes

**Description:** Create utility classes for font weights (regular, semi-bold, bold).

**Implementation:**
Already handled by Task 3.1.2.3 (.font-regular, .font-semibold, .font-bold).

**Acceptance Criteria:**
- ✅ .font-regular (400)
- ✅ .font-semibold (600)
- ✅ .font-bold (700)

**Dependencies:** Task 3.1.2.3

---

#### Task 3.1.2.6: Implement Responsive Typography

**Description:** Adjust font sizes for mobile/tablet/desktop breakpoints.

**Implementation:**
Already handled by Task 3.1.2.3 (responsive media queries).

**Acceptance Criteria:**
- ✅ Mobile (< 768px): 90% scaling
- ✅ Tablet (768-1199px): 95% scaling
- ✅ Desktop (≥ 1200px): 100% (full size)

**Dependencies:** Task 3.1.2.3

---

#### Task 3.1.3.1: Document Component Visual Specifications

**Description:** Create comprehensive document outlining button, card, form field specifications.

**Files to Create:**
- `packages/frontend/src/styles/component-specs.md`

**Implementation:**

```markdown
# Component Visual Specifications

This document defines the visual specifications for all UI components in the Community Hub platform.

## Button Specifications

### Types

| Type | Background | Text | Border | Border-Radius | Hover | Active |
|------|------------|------|--------|---------------|-------|--------|
| Primary | var(--color-secondary) | White | None | 4px | 10% darker | 15% darker, scale(0.98) |
| Secondary | White | var(--color-primary) | 1px var(--color-primary) | 4px | #F5F5F5 bg | #EEEEEE bg |
| Tertiary | Transparent | var(--color-primary) | None | 4px | #F5F5F5 bg | #EEEEEE bg |
| Disabled | var(--color-neutral-medium) | var(--color-text-light) | None | 4px | No hover | No active |

### States
- **Default:** Base styling
- **Hover:** 10% darkening (primary), background change (secondary/tertiary)
- **Active:** 15% darkening + scale(0.98) transform
- **Focus:** 2px outline var(--color-primary), 2px offset
- **Disabled:** 50% opacity, no hover/active
- **Loading:** Spinner + "Loading..." text

### Sizing
- **Small:** 32px height, 12px 16px padding
- **Medium:** 40px height, 12px 24px padding (default)
- **Large:** 48px height, 16px 32px padding
- **Touch target:** Minimum 44px height/width on mobile

## Card Specifications

### Default
- Background: White
- Border-radius: 8px
- Box-shadow: 0 2px 4px rgba(0,0,0,0.1)
- Padding: 16px

### Hover
- Box-shadow: 0 4px 8px rgba(0,0,0,0.15)
- Transform: translateY(-2px)
- Transition: 200ms ease

### States
- **Default:** Base styling
- **Hover:** Elevated shadow + lift
- **Active/Selected:** Border 2px var(--color-primary)
- **Loading:** Skeleton overlay
- **Disabled:** 50% opacity, no hover

### Variants
- **Elevated:** More shadow (0 4px 8px by default)
- **Flat:** No shadow
- **Outlined:** Border 1px var(--color-neutral-medium), no shadow

## Form Field Specifications

### Input/Textarea
- Border: 1px solid var(--color-neutral-medium) (default)
- Border (hover): 1px solid #999999
- Border (focus): 2px solid var(--color-primary)
- Border (error): 2px solid var(--color-error)
- Border-radius: 4px
- Padding: 12px 16px
- Background (disabled): var(--color-neutral-light), 50% opacity
- Background (read-only): var(--color-neutral-light)

### Select/Dropdown
- Trigger: Same as input field
- Container: White, 4px radius, shadow 0 4px 8px rgba(0,0,0,0.15)
- Item height: 40px
- Item padding: 12px 16px
- Item hover: var(--color-neutral-light) background
- Item selected: var(--color-primary) background (10% opacity) + var(--color-primary) text
- Dividers: 1px var(--color-neutral-light)
- Max height: 300px with scroll

### Checkbox/Radio
- Size: 18px × 18px
- Touch target: 44px × 44px (padding)
- Unchecked: 1px border var(--color-neutral-medium)
- Checked: var(--color-primary) fill + white checkmark/dot
- Disabled: 50% opacity
- Focus: 2px outline var(--color-primary), 2px offset

### Toggle/Switch
- Track: 44px × 24px (accessible touch target)
- Knob: 20px diameter, white
- Background (off): var(--color-neutral-medium)
- Background (on): var(--color-primary)
- Transition: 200ms smooth
- Disabled: 50% opacity

## Modal/Dialog Specifications

### Overlay
- Background: rgba(0,0,0,0.5)
- Click outside to close (optional)

### Container
- Background: White
- Border-radius: 8px
- Box-shadow: 0 8px 16px rgba(0,0,0,0.2)
- Padding: 24px
- Sizes: 480px (small), 640px (medium), 800px (large)

### Animation
- Open: Fade in overlay (200ms) + scale up modal (0.95 → 1, 300ms)
- Close: Reverse animation

### Responsive
- Mobile (< 480px): Full screen (100vw × 100vh)
- Tablet/Desktop: Fixed width, vertically centered

## Toast/Notification Specifications

### Layout
- Position: Bottom center (mobile), bottom right (desktop)
- Width: Auto, max 400px
- Padding: 12px 16px
- Border-radius: 4px
- Duration: 4 seconds (auto-dismiss)

### Types
- **Info:** Dark (#333) background, white text
- **Success:** var(--color-success) background, white text
- **Error:** var(--color-error) background, white text
- **Warning:** var(--color-warning) background, white text

### Animation
- Enter: Slide up + fade in (300ms)
- Exit: Fade out (300ms)

### Stacking
- Max 3 visible toasts
- Newest on top

## Alert/Banner Specifications

### Types
- **Critical (Red):** Urgent, requires immediate attention
- **Warning (Orange):** Important, action recommended
- **Advisory (Yellow):** Informational, no action required
- **Info (Blue):** General information

### Layout
- Full-width or container-width (configurable)
- Padding: 16px
- Border-left: 4px solid (alert colour)
- Icon: Alert type icon on left
- Text: Heading (bold) + body text
- Close button: X icon on right (optional)

## Accessibility Requirements

All components must meet:
- WCAG 2.1 AA compliance
- Keyboard navigable (Tab, arrows, Enter, Space, Escape)
- Focus indicators visible (2px outline, 2px offset, 4.5:1 contrast)
- Colour contrast ≥ 4.5:1 on text (3:1 on UI elements)
- Touch targets ≥ 44px on mobile
- Screen reader compatible (ARIA labels/descriptions)
- No reliance on colour alone (use icons + text)
```

**Acceptance Criteria:**
- ✅ Component specs documented for buttons, cards, forms, modals, toasts, alerts
- ✅ All states defined (default, hover, focus, active, disabled, loading)
- ✅ Accessibility requirements included

**Dependencies:** None

---

#### Task 3.1.3.2: Create Reusable Component Style Configuration

**Description:** Create shared CSS utilities for component styling.

**Files to Create:**
- `packages/frontend/src/styles/utilities.css`

**Implementation:**

```css
/* packages/frontend/src/styles/utilities.css */

/**
 * Utility Classes
 *
 * Reusable CSS classes for common styling patterns.
 */

/* Spacing utilities */
.p-0 { padding: 0; }
.p-1 { padding: 4px; }
.p-2 { padding: 8px; }
.p-3 { padding: 12px; }
.p-4 { padding: 16px; }
.p-5 { padding: 20px; }
.p-6 { padding: 24px; }

.m-0 { margin: 0; }
.m-1 { margin: 4px; }
.m-2 { margin: 8px; }
.m-3 { margin: 12px; }
.m-4 { margin: 16px; }
.m-5 { margin: 20px; }
.m-6 { margin: 24px; }

/* Border radius */
.rounded-none { border-radius: 0; }
.rounded-sm { border-radius: 2px; }
.rounded { border-radius: 4px; }
.rounded-md { border-radius: 6px; }
.rounded-lg { border-radius: 8px; }
.rounded-full { border-radius: 9999px; }

/* Shadows */
.shadow-none { box-shadow: none; }
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.shadow-md { box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
.shadow-lg { box-shadow: 0 8px 16px rgba(0,0,0,0.2); }

/* Transitions */
.transition-all { transition: all 200ms ease; }
.transition-colors { transition: color 200ms ease, background-color 200ms ease, border-color 200ms ease; }
.transition-transform { transition: transform 200ms ease; }
.transition-shadow { transition: box-shadow 200ms ease; }

/* Display */
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }

/* Flexbox */
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }

/* Width/Height */
.w-full { width: 100%; }
.h-full { height: 100%; }
.w-auto { width: auto; }
.h-auto { height: auto; }

/* Cursor */
.cursor-pointer { cursor: pointer; }
.cursor-not-allowed { cursor: not-allowed; }

/* Overflow */
.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.overflow-scroll { overflow: scroll; }

/* Position */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Text alignment */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-start { text-align: start; } /* RTL-aware */
.text-end { text-align: end; } /* RTL-aware */

/* Truncate text */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Screen reader only (accessible but visually hidden) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible (keyboard focus only) */
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**Acceptance Criteria:**
- ✅ Utility classes created for spacing, borders, shadows, transitions, layout
- ✅ RTL-aware classes (text-start, text-end)
- ✅ Accessibility utilities (.sr-only, .focus-visible)

**Dependencies:** None

---

### Phase 2: Layout Components

---

#### Task 3.2.1.1: Create Header Component

**Description:** Create responsive header with logo, nav, language selector, CTA, user menu.

**Files to Create:**
- `packages/frontend/src/components/layout/Header.tsx`
- `packages/frontend/src/components/layout/__tests__/Header.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/layout/Header.tsx

import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface HeaderProps {
  /** Platform logo URL from config */
  logoUrl?: string;
  /** Platform name from config */
  platformName?: string;
  /** Show "List Your Business" CTA */
  showListBusinessCTA?: boolean;
  /** User authentication state */
  isAuthenticated?: boolean;
  /** User display name */
  userName?: string;
  /** User avatar URL */
  userAvatar?: string;
}

export function Header({
  logoUrl = '/logo.svg',
  platformName = 'Community Hub',
  showListBusinessCTA = true,
  isAuthenticated = false,
  userName,
  userAvatar,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 bg-white shadow-sm"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center">
              <img
                src={logoUrl}
                alt={`${platformName} logo`}
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-bold text-primary hidden sm:block">
                {platformName}
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center space-x-8"
          >
            <a href="/" className="text-dark hover:text-primary transition-colors">
              Home
            </a>
            <a href="/businesses" className="text-dark hover:text-primary transition-colors">
              Businesses
            </a>
            <a href="/events" className="text-dark hover:text-primary transition-colors">
              Events
            </a>
            <a href="/community" className="text-dark hover:text-primary transition-colors">
              Community
            </a>
            <a href="/deals" className="text-dark hover:text-primary transition-colors">
              Deals
            </a>
          </nav>

          {/* Right Side: Language Selector + CTA + User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                aria-label="Change language"
                className="flex items-center text-dark hover:text-primary transition-colors"
              >
                <span className="material-icons">language</span>
                <span className="ml-1 text-sm">{currentLanguage}</span>
              </button>
              {/* Language dropdown (implement with Modal or Dropdown component) */}
            </div>

            {/* List Your Business CTA */}
            {showListBusinessCTA && !isAuthenticated && (
              <a
                href="/list-business"
                className="btn btn-primary"
              >
                List Your Business
              </a>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center">
                <img
                  src={userAvatar || '/default-avatar.png'}
                  alt={userName || 'User'}
                  className="h-8 w-8 rounded-full"
                />
                <span className="ml-2 text-sm text-dark">{userName}</span>
                {/* User dropdown menu (implement with Modal or Dropdown) */}
              </div>
            ) : (
              <a href="/login" className="btn btn-secondary">
                Log In
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="text-dark hover:text-primary transition-colors p-2"
            >
              <span className="material-icons">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden bg-white border-t border-neutral-medium"
        >
          <div className="px-4 py-4 space-y-2">
            <a href="/" className="block py-2 text-dark hover:text-primary transition-colors">
              Home
            </a>
            <a href="/businesses" className="block py-2 text-dark hover:text-primary transition-colors">
              Businesses
            </a>
            <a href="/events" className="block py-2 text-dark hover:text-primary transition-colors">
              Events
            </a>
            <a href="/community" className="block py-2 text-dark hover:text-primary transition-colors">
              Community
            </a>
            <a href="/deals" className="block py-2 text-dark hover:text-primary transition-colors">
              Deals
            </a>
            {!isAuthenticated && (
              <>
                <a href="/list-business" className="block py-2 text-secondary hover:text-secondary-shade-20 transition-colors font-semibold">
                  List Your Business
                </a>
                <a href="/login" className="block py-2 text-primary hover:text-primary-shade-20 transition-colors">
                  Log In
                </a>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
```

**Test file:**

```typescript
// packages/frontend/src/components/layout/__tests__/Header.test.tsx

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Header } from '../Header';

expect.extend(toHaveNoViolations);

describe('Header', () => {
  it('renders logo and platform name', () => {
    render(<Header platformName="Guildford South Hub" />);
    expect(screen.getByAltText('Guildford South Hub logo')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Businesses' })).toBeInTheDocument();
  });

  it('shows List Your Business CTA when not authenticated', () => {
    render(<Header isAuthenticated={false} showListBusinessCTA={true} />);
    expect(screen.getByRole('link', { name: 'List Your Business' })).toBeInTheDocument();
  });

  it('shows user info when authenticated', () => {
    render(<Header isAuthenticated={true} userName="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Header />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Acceptance Criteria:**
- ✅ Responsive (sticky on desktop, hamburger menu on mobile)
- ✅ Logo, navigation links, language selector, CTA, user menu
- ✅ Keyboard navigable (Tab order correct)
- ✅ ARIA: role="banner", aria-label on navigation
- ✅ jest-axe test passing (zero violations)

**Accessibility:**
- Skip to main content link (already exists from Phase 1.4)
- Keyboard navigation: Tab through all links
- Mobile menu: aria-expanded on toggle button

**Dependencies:** Task 3.1.2.3 (typography), Task 3.1.1.1 (colours)

---

#### Task 3.2.1.2: Create Footer Component

**Description:** Create responsive footer with links, social media, partners, newsletter signup.

**Files to Create:**
- `packages/frontend/src/components/layout/Footer.tsx`
- `packages/frontend/src/components/layout/__tests__/Footer.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/layout/Footer.tsx

import React from 'react';

interface FooterProps {
  /** Platform name from config */
  platformName?: string;
  /** Partner logos from config */
  partnerLogos?: { name: string; url: string; altText: string }[];
  /** Social media links */
  socialLinks?: { platform: string; url: string }[];
}

export function Footer({
  platformName = 'Community Hub',
  partnerLogos = [],
  socialLinks = [],
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="bg-gray-900 text-white py-12"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
              <li><a href="/businesses" className="text-gray-300 hover:text-white transition-colors">Businesses</a></li>
              <li><a href="/events" className="text-gray-300 hover:text-white transition-colors">Events</a></li>
              <li><a href="/community" className="text-gray-300 hover:text-white transition-colors">Community</a></li>
              <li><a href="/deals" className="text-gray-300 hover:text-white transition-colors">Deals</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About</a></li>
              <li><a href="/faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/cookies" className="text-gray-300 hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Partners & Newsletter */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Stay Connected</h3>

            {/* Newsletter Signup */}
            <form className="mb-6">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                type="email"
                id="newsletter-email"
                placeholder="Your email"
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="w-full mt-2 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-shade-10 transition-colors"
              >
                Subscribe
              </button>
            </form>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex space-x-4 mb-6">
                {socialLinks.map(link => (
                  <a
                    key={link.platform}
                    href={link.url}
                    aria-label={`Follow us on ${link.platform}`}
                    className="text-gray-300 hover:text-white transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="material-icons">{link.platform.toLowerCase()}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Partner Logos */}
            {partnerLogos.length > 0 && (
              <div className="space-y-2">
                {partnerLogos.map(partner => (
                  <img
                    key={partner.name}
                    src={partner.url}
                    alt={partner.altText}
                    className="h-8 w-auto"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} {platformName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

**Acceptance Criteria:**
- ✅ Responsive (4 columns desktop, stacked mobile)
- ✅ Links, social media, partners, newsletter signup
- ✅ ARIA: role="contentinfo"
- ✅ External links: target="_blank" rel="noopener noreferrer"
- ✅ jest-axe test passing

**Dependencies:** Task 3.1.2.3 (typography), Task 3.1.1.1 (colours)

---

#### Task 3.2.1.3: Create PageContainer Component

**Description:** Create responsive page container with max-width and padding.

**Files to Create:**
- `packages/frontend/src/components/layout/PageContainer.tsx`
- `packages/frontend/src/components/layout/__tests__/PageContainer.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/layout/PageContainer.tsx

import React from 'react';

interface PageContainerProps {
  /** Content to wrap */
  children: React.ReactNode;
  /** Max width variant */
  maxWidth?: 'narrow' | 'normal' | 'wide' | 'full';
  /** Additional CSS classes */
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = 'normal',
  className = '',
}: PageContainerProps) {
  const maxWidthClass = {
    narrow: 'max-w-3xl',    // 800px
    normal: 'max-w-7xl',    // 1200px
    wide: 'max-w-screen-2xl', // 1536px
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Responsive padding (16px mobile, 24px tablet, 32px desktop)
- ✅ Max-width variants (narrow 800px, normal 1200px, wide 1536px, full 100%)
- ✅ Centered horizontally

**Dependencies:** None

---

#### Task 3.2.1.4: Create BottomNavigation Component

**Description:** Create fixed bottom navigation for mobile only (Home, Explore, Messages, Profile, Menu).

**Files to Create:**
- `packages/frontend/src/components/layout/BottomNavigation.tsx`
- `packages/frontend/src/components/layout/__tests__/BottomNavigation.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/layout/BottomNavigation.tsx

import React from 'react';
import { useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'Explore', icon: 'explore', path: '/businesses' },
  { label: 'Messages', icon: 'chat_bubble', path: '/messages' },
  { label: 'Profile', icon: 'person', path: '/profile' },
  { label: 'Menu', icon: 'menu', path: '/menu' },
];

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-medium md:hidden z-50"
    >
      <div className="flex justify-around items-center h-14">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center flex-1 py-2 transition-colors ${
                isActive ? 'text-primary' : 'text-light'
              } hover:text-primary`}
              style={{ minHeight: '44px', minWidth: '44px' }} // Touch target
            >
              <span className={`material-icons text-xl ${isActive ? 'material-icons-filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
```

**Acceptance Criteria:**
- ✅ Fixed at bottom on mobile only (< 768px)
- ✅ 5 navigation items (Home, Explore, Messages, Profile, Menu)
- ✅ Active indicator (filled icon + primary colour text)
- ✅ Touch targets ≥ 44px
- ✅ ARIA: aria-label, aria-current="page"

**Dependencies:** None

---

#### Task 3.2.1.5: Create Sidebar Component

**Description:** Create collapsible sidebar for contact info, hours, promotions.

**Files to Create:**
- `packages/frontend/src/components/layout/Sidebar.tsx`
- `packages/frontend/src/components/layout/__tests__/Sidebar.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/layout/Sidebar.tsx

import React, { useState } from 'react';

interface SidebarProps {
  /** Sidebar content */
  children: React.ReactNode;
  /** Position (left or right) */
  position?: 'left' | 'right';
  /** Initially open on desktop */
  defaultOpen?: boolean;
}

export function Sidebar({
  children,
  position = 'right',
  defaultOpen = true,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      {/* Mobile: Off-canvas sidebar */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle sidebar"
          className="fixed top-20 right-4 z-40 bg-primary text-white p-2 rounded-full shadow-lg"
        >
          <span className="material-icons">{isOpen ? 'close' : 'menu'}</span>
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
              className={`fixed top-0 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'} w-80 bg-white shadow-lg z-40 overflow-y-auto`}
            >
              <div className="p-6">{children}</div>
            </aside>
          </>
        )}
      </div>

      {/* Desktop: Sticky sidebar */}
      <aside className="hidden md:block w-full lg:w-80 sticky top-20">
        <div className="bg-white rounded-lg shadow p-6">
          {children}
        </div>
      </aside>
    </>
  );
}
```

**Acceptance Criteria:**
- ✅ Desktop: Fixed 30% width (or 320px), sticky positioning
- ✅ Mobile: Off-canvas (slide in from left/right)
- ✅ Collapsible on mobile (toggle button)
- ✅ ARIA: aria-expanded on toggle

**Dependencies:** None

---

#### Task 3.2.1.6: Create Grid System Component

**Description:** Create 12-column responsive grid system.

**Files to Create:**
- `packages/frontend/src/components/layout/Grid.tsx`
- `packages/frontend/src/components/layout/__tests__/Grid.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/layout/Grid.tsx

import React from 'react';

interface GridProps {
  /** Grid children (GridItem components) */
  children: React.ReactNode;
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg';
  /** Number of columns on mobile */
  colsMobile?: number;
  /** Number of columns on tablet */
  colsTablet?: number;
  /** Number of columns on desktop */
  colsDesktop?: number;
  /** Additional CSS classes */
  className?: string;
}

export function Grid({
  children,
  gap = 'md',
  colsMobile = 1,
  colsTablet = 2,
  colsDesktop = 3,
  className = '',
}: GridProps) {
  const gapClass = {
    sm: 'gap-4',  // 16px
    md: 'gap-6',  // 24px
    lg: 'gap-8',  // 32px
  }[gap];

  const gridCols = `grid-cols-${colsMobile} sm:grid-cols-${colsTablet} lg:grid-cols-${colsDesktop}`;

  return (
    <div className={`grid ${gridCols} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

interface GridItemProps {
  /** Grid item content */
  children: React.ReactNode;
  /** Column span on mobile */
  colSpanMobile?: number;
  /** Column span on tablet */
  colSpanTablet?: number;
  /** Column span on desktop */
  colSpanDesktop?: number;
  /** Additional CSS classes */
  className?: string;
}

export function GridItem({
  children,
  colSpanMobile = 1,
  colSpanTablet,
  colSpanDesktop,
  className = '',
}: GridItemProps) {
  const colSpan = `col-span-${colSpanMobile} ${colSpanTablet ? `sm:col-span-${colSpanTablet}` : ''} ${colSpanDesktop ? `lg:col-span-${colSpanDesktop}` : ''}`;

  return (
    <div className={`${colSpan} ${className}`}>
      {children}
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ 12-column grid system
- ✅ Responsive columns (1 mobile, 2-3 tablet, 3-4 desktop)
- ✅ Configurable gap (16px, 24px, 32px)
- ✅ GridItem component for column spanning

**Dependencies:** None

---

### Phase 3: Form Components

---

#### Task 3.2.2.1: Enhance Button Component

**Description:** Add all states (hover, active, focus, disabled, loading) and variants to existing Button component.

**Files to Modify:**
- `packages/frontend/src/components/ui/Button.tsx`
- `packages/frontend/src/components/ui/__tests__/Button.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/ui/Button.tsx (enhanced)

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Icon (left side) */
  iconLeft?: React.ReactNode;
  /** Icon (right side) */
  iconRight?: React.ReactNode;
  /** Children */
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-secondary text-white hover:brightness-90 active:brightness-85 active:scale-98',
    secondary: 'bg-white text-primary border border-primary hover:bg-neutral-light active:bg-gray-200',
    tertiary: 'bg-transparent text-primary hover:bg-neutral-light active:bg-gray-200',
  }[variant];

  const sizeStyles = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-10 px-6 text-base',
    lg: 'h-12 px-8 text-lg',
  }[size];

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="material-icons animate-spin mr-2">refresh</span>
          Loading...
        </>
      ) : (
        <>
          {iconLeft && <span className="mr-2">{iconLeft}</span>}
          {children}
          {iconRight && <span className="ml-2">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
```

**Acceptance Criteria:**
- ✅ Variants: primary, secondary, tertiary
- ✅ Sizes: small (32px), medium (40px), large (48px)
- ✅ States: default, hover, active, focus, disabled, loading
- ✅ Focus: 2px outline primary colour, 2px offset
- ✅ Loading: Spinner + "Loading..." text
- ✅ Icon support (left/right)
- ✅ Full-width variant
- ✅ Touch target ≥ 44px on mobile
- ✅ jest-axe test passing

**Dependencies:** Task 3.1.1.1 (colours)

---

#### Task 3.2.2.2: Create Input Component

**Description:** Create input field component with all validation states.

**Files to Create:**
- `packages/frontend/src/components/form/Input.tsx`
- `packages/frontend/src/components/form/__tests__/Input.test.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/form/Input.tsx

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Icon (left side) */
  iconLeft?: React.ReactNode;
  /** Icon (right side) */
  iconRight?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      iconLeft,
      iconRight,
      fullWidth = false,
      disabled,
      readOnly,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const baseStyles = 'px-4 py-3 border rounded transition-colors focus:outline-none';
    const stateStyles = error
      ? 'border-error focus:border-error'
      : 'border-neutral-medium hover:border-gray-400 focus:border-primary focus:border-2';
    const disabledStyles = disabled ? 'bg-neutral-light opacity-50 cursor-not-allowed' : '';
    const readOnlyStyles = readOnly ? 'bg-neutral-light' : '';
    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-dark mb-2"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {iconLeft && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light">
              {iconLeft}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim()}
            aria-required={required}
            disabled={disabled}
            readOnly={readOnly}
            className={`${baseStyles} ${stateStyles} ${disabledStyles} ${readOnlyStyles} ${widthStyle} ${iconLeft ? 'pl-10' : ''} ${iconRight ? 'pr-10' : ''} ${className}`}
            {...props}
          />

          {iconRight && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light">
              {iconRight}
            </div>
          )}
        </div>

        {/* Hint Text */}
        {hint && !error && (
          <p id={hintId} className="mt-2 text-sm text-light">
            {hint}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-sm text-error flex items-center"
          >
            <span className="material-icons text-sm mr-1">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**Acceptance Criteria:**
- ✅ States: default, hover, focus, error, disabled, read-only
- ✅ Label association (htmlFor + id)
- ✅ Error message: aria-describedby, role="alert", error icon
- ✅ Required indicator (*)
- ✅ Hint text
- ✅ Icon support (left/right)
- ✅ Focus: 2px border primary colour
- ✅ jest-axe test passing

**Dependencies:** Task 3.1.1.1 (colours)

---

#### Task 3.2.2.3-3.2.2.10: Create Remaining Form Components

**Description:** Create Textarea, Select, Checkbox, Radio, Toggle, DatePicker, TimePicker, FileUpload components.

**Implementation:** Similar pattern to Input component, following specifications from study document.

**Note:** Due to length constraints, detailed implementations for tasks 3.2.2.3-3.2.2.10 follow the same pattern as Input:
- Label association
- Error/hint messages with aria-describedby
- All validation states
- Keyboard navigation
- Touch targets ≥ 44px
- jest-axe tests

**Acceptance Criteria (All Form Components):**
- ✅ All validation states (default, hover, focus, error, disabled)
- ✅ Label + aria-describedby associations
- ✅ Keyboard navigable
- ✅ Touch targets ≥ 44px
- ✅ jest-axe tests passing

**Dependencies:** Task 3.1.1.1 (colours), Task 3.1.2.3 (typography)

---

### Phase 4-5: Display Components

**Note:** Tasks 3.2.3.1-3.2.3.14 create Modal, Toast, Alert, Badge, Avatar, Icon, Skeleton, EmptyState, Pagination, Tabs, Accordion, Carousel components.

Similar implementation pattern:
- Follow specifications from study document
- ARIA attributes (role, aria-label, aria-describedby)
- Keyboard navigation (Tab, arrows, Enter, Escape)
- Focus traps (Modal)
- Animations (Toast slide-in, Modal scale-up)
- Touch targets ≥ 44px
- jest-axe tests

**Key Components:**

**Modal (Task 3.2.3.2):**
- Focus trap: Tab cycles within modal
- Escape key to close
- Overlay click to close (optional)
- ARIA: role="dialog", aria-modal="true", aria-labelledby
- Return focus to trigger on close

**Toast (Task 3.2.3.3):**
- ARIA: role="alert" or role="status"
- aria-live="assertive" (errors) or aria-live="polite" (info)
- Auto-dismiss after 4 seconds
- Stacking: Max 3 visible

**Tabs (Task 3.2.3.12):**
- ARIA: role="tablist", role="tab", role="tabpanel"
- Keyboard: Arrow keys to navigate, Enter to activate
- Active tab: aria-selected="true", tabindex="0"
- Inactive tabs: aria-selected="false", tabindex="-1"

**Dependencies:** All display components depend on Task 3.1.1.1 (colours) and Task 3.1.2.3 (typography).

---

### Phase 6: Accessibility Implementation

---

#### Task 3.3.1: Implement Skip to Main Content Link

**Status:** ✅ ALREADY COMPLETE (Phase 1.4)

**File:** `packages/frontend/src/components/ui/SkipLink.tsx`

**Verification:** Ensure SkipLink is included in Header or App root.

---

#### Task 3.3.2: Ensure Visible Focus Indicators

**Description:** Add focus-visible pseudo-class to all interactive elements.

**Files to Create:**
- `packages/frontend/src/styles/accessibility.css`

**Implementation:**

```css
/* packages/frontend/src/styles/accessibility.css */

/**
 * Accessibility Styles
 *
 * WCAG 2.1 AA compliance styles for focus indicators, screen reader utilities, etc.
 */

/* Focus indicators for all interactive elements */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Ensure focus visible on buttons, links, inputs */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible,
[role="tab"]:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove default browser outline (replaced by above) */
*:focus {
  outline: none;
}

/* Re-enable for :focus-visible */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip to main content link (visible on focus) */
.skip-link {
  position: absolute;
  top: -9999px;
  left: -9999px;
  z-index: 999;
  padding: 1rem 1.5rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  top: 1rem;
  left: 1rem;
}

/* Screen reader only utility (accessible but visually hidden) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Keyboard navigation: show focus on keyboard users only */
.js-focus-visible :focus:not(.focus-visible) {
  outline: none;
}

/* Touch target sizing: minimum 44px × 44px */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* High contrast mode support (Windows) */
@media (prefers-contrast: high) {
  *:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Acceptance Criteria:**
- ✅ Focus indicators visible on all interactive elements
- ✅ Minimum 2px outline, 2px offset
- ✅ Primary colour (4.5:1 contrast)
- ✅ Works with keyboard navigation (Tab)

**Testing:**
- Tab through all interactive elements
- Verify focus outline visible on each

**Dependencies:** Task 3.1.1.1 (colours)

---

#### Task 3.3.3: Add Screen Reader Announcements (ARIA-Live)

**Description:** Add ARIA live regions for dynamic content updates.

**Files to Create:**
- `packages/frontend/src/components/a11y/LiveRegion.tsx`

**Implementation:**

```typescript
// packages/frontend/src/components/a11y/LiveRegion.tsx

import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
  /** Clear message after timeout (ms) */
  clearAfter?: number;
}

export function LiveRegion({
  message,
  politeness = 'polite',
  clearAfter = 5000,
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && clearAfter) {
      const timer = setTimeout(() => {
        if (regionRef.current) {
          regionRef.current.textContent = '';
        }
      }, clearAfter);
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={regionRef}
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
  const [message, setMessage] = React.useState('');

  const announce = (text: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setMessage(''); // Clear first to ensure re-announcement
    setTimeout(() => setMessage(text), 100);
  };

  return { message, announce };
}
```

**Usage Example:**
```typescript
// In a search component
const { message, announce } = useAnnounce();

function handleSearch() {
  const results = performSearch();
  announce(`${results.length} businesses found`, 'polite');
}

return (
  <>
    <SearchForm onSearch={handleSearch} />
    <LiveRegion message={message} politeness="polite" />
  </>
);
```

**Acceptance Criteria:**
- ✅ ARIA: role="alert" (assertive) or role="status" (polite)
- ✅ aria-live="polite" or aria-live="assertive"
- ✅ Visually hidden (.sr-only)
- ✅ Used for: search results, form errors, toast notifications

**Dependencies:** None

---

#### Task 3.3.4: Verify Full Keyboard Navigation

**Description:** Test and ensure all interactive elements keyboard navigable.

**Testing Checklist:**

1. **Header:**
   - Tab through logo, nav links, language selector, CTA, user menu
   - Mobile: Tab to hamburger, Enter to open, arrows to navigate

2. **Forms:**
   - Tab through all form fields
   - Arrow keys in dropdowns, radios, date pickers
   - Space to toggle checkboxes, toggles
   - Enter to submit forms

3. **Modals:**
   - Tab cycles within modal (focus trap)
   - Escape to close
   - Focus returns to trigger on close

4. **Tabs:**
   - Arrow keys to navigate tabs
   - Enter to activate tab

5. **Carousels:**
   - Arrow keys to navigate slides

6. **No Keyboard Traps:**
   - Every focusable element can be navigated away from with Tab/Shift+Tab

**Acceptance Criteria:**
- ✅ All interactive elements keyboard navigable
- ✅ Logical tab order (left-to-right, top-to-bottom)
- ✅ No keyboard traps
- ✅ Custom controls: arrow keys, Enter, Space, Escape work as expected

**Dependencies:** All components (3.2.1-3.2.3)

---

#### Task 3.3.5: Test and Fix Colour Contrast Issues

**Description:** Verify all text and UI elements meet 4.5:1 contrast ratio.

**Testing Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools Accessibility panel
- axe DevTools browser extension

**Testing Process:**

1. **Identify all colour combinations:**
   - Primary text (#2C3E50) on white (#FFFFFF)
   - Secondary text (#7F8C8D) on white (#FFFFFF)
   - Primary button (#E67E22 text on white)
   - Secondary button (#2C5F7C text on white)
   - Error text (#E74C3C) on white
   - Success text (#27AE60) on white

2. **Test each combination:**
   - Use WebAIM Contrast Checker
   - Verify ≥ 4.5:1 for normal text
   - Verify ≥ 3:1 for large text (≥ 18px or ≥ 14px bold)

3. **Fix failing combinations:**
   - Darken light text
   - Lighten dark backgrounds
   - Adjust colour values in `config/platform.json`

**Common Failures & Fixes:**
- Light grey text (#7F8C8D) on white (#FFFFFF) = 4.4:1 **FAIL** → Darken to #6C757D = 4.6:1 **PASS**
- Yellow accent (#F39C12) on white = 2.4:1 **FAIL** → Darken to #D68910 = 4.5:1 **PASS**

**Acceptance Criteria:**
- ✅ All text ≥ 4.5:1 contrast (normal text)
- ✅ All large text ≥ 3:1 contrast
- ✅ UI elements ≥ 3:1 contrast (borders, icons, focus indicators)
- ✅ Verified with WebAIM Contrast Checker

**Dependencies:** Task 3.1.1.1 (colours)

---

#### Task 3.3.6: Enforce Alt Text on All Images

**Description:** Ensure all images have alt text (or alt="" for decorative).

**Files to Create:**
- `packages/frontend/src/components/a11y/Image.tsx` (wrapper component)

**Implementation:**

```typescript
// packages/frontend/src/components/a11y/Image.tsx

import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source */
  src: string;
  /** Alt text (required) */
  alt: string;
  /** Is decorative (use alt="") */
  decorative?: boolean;
}

export function Image({
  src,
  alt,
  decorative = false,
  ...props
}: ImageProps) {
  if (!alt && !decorative) {
    console.warn('Image component requires alt text or decorative={true}');
  }

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      {...props}
    />
  );
}
```

**Usage:**
```typescript
// Logo (functional)
<Image src="/logo.png" alt="Community Hub logo" />

// Decorative pattern
<Image src="/pattern.svg" decorative />

// Business photo
<Image src="/business.jpg" alt="Storefront of ABC Bakery" />
```

**Acceptance Criteria:**
- ✅ All images have alt attribute
- ✅ Functional images: Descriptive alt text
- ✅ Decorative images: alt="" (empty string)
- ✅ Complex images: Detailed description in alt or aria-describedby

**Testing:**
- Screen reader: NVDA, JAWS, VoiceOver
- Verify alt text read aloud for all images

**Dependencies:** None

---

#### Task 3.3.7: Ensure Form Label Associations

**Description:** Verify all form fields have labels with correct associations.

**Already Implemented:** Input component (Task 3.2.2.2) includes label associations.

**Verification Checklist:**
- ✅ Every form field has `<label for="fieldId">` matching `<input id="fieldId">`
- ✅ No placeholder-only labels
- ✅ Required fields: aria-required="true" or * in label
- ✅ Error messages: aria-describedby="errorId"

**Acceptance Criteria:**
- ✅ All form fields have associated labels
- ✅ Label click focuses input
- ✅ Screen reader announces label when focusing input

**Dependencies:** Tasks 3.2.2.1-3.2.2.10 (form components)

---

#### Task 3.3.8: Implement Accessible Error Messages

**Description:** Ensure error messages clearly associated with fields.

**Already Implemented:** Input component (Task 3.2.2.2) includes error message associations.

**Verification Checklist:**
- ✅ Error messages use aria-describedby to link to field
- ✅ Error messages have role="alert"
- ✅ Error icon + text (not colour alone)
- ✅ Clear, specific guidance ("Password must be at least 8 characters", not just "Invalid")

**Form-Level Error Summary:**
```typescript
// Form component with error summary
function FormWithErrorSummary() {
  const [errors, setErrors] = useState<string[]>([]);

  return (
    <form>
      {errors.length > 0 && (
        <div role="alert" aria-live="assertive" className="mb-4 p-4 bg-error-light border border-error rounded">
          <h2 className="font-semibold text-error mb-2">Please fix the following errors:</h2>
          <ul className="list-disc list-inside">
            {errors.map((error, i) => (
              <li key={i}>
                <a href={`#${error.fieldId}`} className="text-error underline">
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

**Acceptance Criteria:**
- ✅ Error messages aria-describedby linked to fields
- ✅ Error messages have role="alert"
- ✅ Form-level error summary at top (if multiple errors)
- ✅ Icons + text (not colour alone)

**Dependencies:** Tasks 3.2.2.1-3.2.2.10 (form components)

---

#### Task 3.3.9: Verify Touch Target Sizing

**Description:** Ensure all interactive elements ≥ 44px × 44px on mobile.

**Testing:**
1. Open DevTools → Toggle device toolbar (mobile view)
2. Inspect each interactive element
3. Measure width/height (including padding)
4. Verify ≥ 44px × 44px

**Common Issues & Fixes:**

**Checkbox (18px visual):**
```css
/* Visual size 18px, touch target 44px */
.checkbox {
  width: 18px;
  height: 18px;
  padding: 13px; /* (44 - 18) / 2 = 13 */
}
```

**Small icon button (24px visual):**
```css
/* Visual size 24px, touch target 44px */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 10px; /* (44 - 24) / 2 = 10 */
}
```

**Acceptance Criteria:**
- ✅ All buttons ≥ 44px height
- ✅ All links (standalone) ≥ 44px touch target
- ✅ All form fields ≥ 44px height
- ✅ All custom controls ≥ 44px × 44px
- ✅ Minimum 8px spacing between touch targets

**Testing:**
- Real device testing (iOS, Android)
- Chrome DevTools mobile emulation

**Dependencies:** Tasks 3.2.1-3.2.3 (all components)

---

### Phase 7: Testing & Quality Assurance

---

#### Task 3.4.1: Add jest-axe Tests to All Components

**Description:** Add accessibility tests using jest-axe to all component test files.

**Example:**

```typescript
// packages/frontend/src/components/form/__tests__/Input.test.tsx

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../Input';

expect.extend(toHaveNoViolations);

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Input label="Email" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with error', async () => {
    const { container } = render(<Input label="Email" error="Invalid email" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Acceptance Criteria:**
- ✅ All components have jest-axe tests
- ✅ Tests cover all states (default, error, disabled, loading)
- ✅ Zero axe violations across all tests

**Dependencies:** Tasks 3.2.1-3.2.3 (all components)

---

#### Task 3.4.2: Screen Reader Testing

**Description:** Manually test all components with screen readers.

**Screen Readers:**
- **Windows:** NVDA (free), JAWS (paid)
- **Mac:** VoiceOver (built-in)
- **iOS:** VoiceOver (built-in)
- **Android:** TalkBack (built-in)

**Testing Process:**

1. **Enable screen reader**
2. **Navigate with keyboard only** (Tab, arrows, Enter, Space)
3. **Verify announcements:**
   - Labels announced when focusing inputs
   - Error messages announced
   - Button purposes announced
   - Dynamic content changes announced (ARIA live regions)
4. **Test all components:**
   - Header (navigation, logo, user menu)
   - Forms (labels, errors, hints)
   - Modals (title, body, close button)
   - Toasts (announcements)
   - Tabs (tab list, selected tab, panel)

**Acceptance Criteria:**
- ✅ All labels announced correctly
- ✅ All errors announced
- ✅ All buttons have clear purposes
- ✅ Dynamic content changes announced (live regions)
- ✅ No confusion or missing information

**Dependencies:** All components (3.2.1-3.2.3)

---

#### Task 3.4.3: Responsive Testing

**Description:** Test all components at mobile (< 768px), tablet (768-1199px), desktop (≥ 1200px).

**Testing:**
1. Open Chrome DevTools → Toggle device toolbar
2. Test at breakpoints: 375px (mobile), 768px (tablet), 1200px (desktop)
3. Verify:
   - Layout adjusts correctly
   - Touch targets ≥ 44px on mobile
   - Text readable (not too small)
   - No horizontal scrolling
   - Images scale appropriately

**Acceptance Criteria:**
- ✅ All components responsive at 3 breakpoints
- ✅ Mobile: Touch targets ≥ 44px, readable text
- ✅ Tablet: Optimized layout
- ✅ Desktop: Full features visible

**Dependencies:** All components (3.2.1-3.2.3)

---

#### Task 3.4.4: Colour Contrast Verification

**Description:** Verify all text and UI elements meet contrast requirements.

**Already Covered:** Task 3.3.5 (Test and Fix Colour Contrast Issues)

---

#### Task 3.4.5: Device Testing

**Description:** Test on real devices (iOS, Android, desktop).

**Testing:**
1. **iOS:** iPhone (Safari)
2. **Android:** Pixel/Samsung (Chrome)
3. **Desktop:** Mac (Chrome, Safari), Windows (Chrome, Edge)

**Verify:**
- Touch targets work correctly
- Fonts load correctly
- Colours display correctly
- Screen reader works (VoiceOver, TalkBack)
- No layout issues

**Acceptance Criteria:**
- ✅ Tested on iOS, Android, desktop
- ✅ No layout, font, colour issues
- ✅ Touch targets work correctly
- ✅ Screen readers work correctly

**Dependencies:** All components (3.2.1-3.2.3)

---

### Phase 8: Documentation & Integration

---

#### Task 3.5.1: Create Component Documentation

**Description:** Document all components with props, usage examples, accessibility notes.

**Files to Create:**
- `packages/frontend/src/components/README.md`
- Individual component documentation (or Storybook)

**Example:**

```markdown
# Button Component

## Usage

```tsx
import { Button } from '@/components/form/Button';

function Example() {
  return (
    <Button variant="primary" size="md" onClick={handleClick}>
      Click Me
    </Button>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'tertiary' | 'primary' | Button style variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| loading | boolean | false | Show loading spinner |
| disabled | boolean | false | Disable button |
| fullWidth | boolean | false | Full width button |
| iconLeft | ReactNode | - | Icon on left side |
| iconRight | ReactNode | - | Icon on right side |

## Accessibility

- Keyboard: Enter/Space to activate
- Focus: Visible 2px outline
- Screen reader: Button text announced
- Touch target: ≥ 44px on mobile

## Examples

### Primary Button
```tsx
<Button variant="primary">Save</Button>
```

### Secondary Button with Icon
```tsx
<Button variant="secondary" iconLeft={<PlusIcon />}>
  Add Item
</Button>
```

### Loading State
```tsx
<Button loading>Saving...</Button>
```
```

**Acceptance Criteria:**
- ✅ All components documented
- ✅ Props table with types, defaults, descriptions
- ✅ Usage examples
- ✅ Accessibility notes

**Dependencies:** All components (3.2.1-3.2.3)

---

#### Task 3.5.2: Create Accessibility Guidelines

**Description:** Document accessibility best practices for using components.

**Files to Create:**
- `packages/frontend/ACCESSIBILITY.md`

**Content:**
- WCAG 2.1 AA requirements overview
- Keyboard navigation patterns
- ARIA usage guidelines
- Screen reader testing tips
- Colour contrast requirements
- Touch target sizing
- Component-specific accessibility notes

**Acceptance Criteria:**
- ✅ Accessibility guidelines documented
- ✅ Best practices for each component type
- ✅ Testing instructions

**Dependencies:** None

---

#### Task 3.5.3: Create Integration Examples

**Description:** Provide examples of using components together (e.g., Header + PageContainer + Footer).

**Files to Create:**
- `packages/frontend/src/examples/` (example pages)

**Examples:**
- Page layout (Header + PageContainer + Footer)
- Form layout (Input + Textarea + Button)
- Modal with form
- Data table with pagination
- Card grid with empty state

**Acceptance Criteria:**
- ✅ Integration examples created
- ✅ Examples demonstrate real-world usage
- ✅ Ready for Phase 4 developers to reference

**Dependencies:** All components (3.2.1-3.2.3)

---

## Location-Agnostic Configuration

### Loading Colours from platform.json

All colours, logos, and branding must come from `config/platform.json` (or API endpoint `/api/v1/config`).

**Example platform.json:**

```json
{
  "location": {
    "name": "Guildford South",
    "suburb": "Guildford",
    "state": "NSW",
    "country": "Australia",
    "coordinates": { "lat": -33.8523, "lng": 150.9896 }
  },
  "branding": {
    "colors": {
      "primary": "#2C5F7C",
      "secondary": "#E67E22",
      "accent": "#F39C12",
      "success": "#27AE60",
      "error": "#E74C3C",
      "warning": "#E67E22",
      "info": "#3498DB",
      "neutralLight": "#F5F5F5",
      "neutralMedium": "#CCCCCC",
      "textDark": "#2C3E50",
      "textLight": "#7F8C8D"
    },
    "logos": {
      "header": "/assets/logos/guildford-header.svg",
      "footer": "/assets/logos/guildford-footer-dark.svg",
      "favicon": "/assets/logos/guildford-favicon.ico"
    },
    "socialHashtags": ["#GuildfordLocal", "#ShopGuildford"]
  },
  "features": {
    "enableBusinessClaiming": true,
    "enableEvents": true,
    "enableDeals": true,
    "enableReviews": true
  }
}
```

### Runtime CSS Variable Injection

**Flow:**
1. App loads → `main.tsx` calls `loadAndInjectDesignTokens()`
2. Fetch `GET /api/v1/config`
3. Extract `branding.colors`
4. Inject CSS custom properties into `:root`
5. Generate tints/shades for primary, secondary, accent
6. Components use CSS variables (`var(--color-primary)`)

**Benefits:**
- No code changes needed for new deployments
- Easy colour customization per suburb
- Consistent branding across platform

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

All components must meet:

1. **Perceivable:**
   - Text alternatives (alt text)
   - Colour contrast ≥ 4.5:1 (normal text), ≥ 3:1 (large text, UI elements)
   - Resizable text (200% zoom without loss of functionality)

2. **Operable:**
   - Keyboard accessible (Tab, arrows, Enter, Space, Escape)
   - No keyboard traps
   - Touch targets ≥ 44px × 44px on mobile
   - Sufficient time to read/interact

3. **Understandable:**
   - Clear labels and instructions
   - Error identification and suggestions
   - Consistent navigation and identification

4. **Robust:**
   - Valid HTML
   - ARIA attributes used correctly
   - Compatible with assistive technologies

### Component-Level Accessibility Checklist

For **ALL components**, verify:
- [ ] Keyboard navigable (Tab, arrows, Enter, Space, Escape)
- [ ] Focus indicators visible (2px outline, 2px offset, 4.5:1 contrast)
- [ ] ARIA labels/descriptions where needed
- [ ] Tested with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Colour contrast ≥ 4.5:1 on text (3:1 on UI elements)
- [ ] Touch targets ≥ 44px for mobile
- [ ] No reliance on colour alone (use icons + text)
- [ ] Error messages associated with fields (aria-describedby)
- [ ] Responsive at 200% zoom
- [ ] Automated tests with jest-axe passing

---

## Testing Strategy

### Automated Testing

**Unit Tests:**
- All components have test files in `__tests__/` directory
- Test props, states, user interactions
- jest-axe for accessibility testing

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click Me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Tools:**
- Vitest (test runner)
- React Testing Library (@testing-library/react)
- jest-axe (accessibility testing)

---

### Manual Testing

**Keyboard Testing:**
1. Unplug mouse
2. Navigate entire site with keyboard only
3. Verify all actions possible (open modals, submit forms, navigate menus)
4. Verify tab order logical (left-to-right, top-to-bottom)
5. Verify no keyboard traps

**Screen Reader Testing:**
1. Enable screen reader (NVDA, JAWS, VoiceOver, TalkBack)
2. Navigate with keyboard
3. Verify all labels, errors, buttons announced correctly
4. Verify dynamic content changes announced (live regions)

**Colour Contrast Testing:**
1. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Test all colour combinations
3. Verify ≥ 4.5:1 for normal text, ≥ 3:1 for large text/UI elements

**Responsive Testing:**
1. Chrome DevTools → Toggle device toolbar
2. Test at breakpoints: 375px (mobile), 768px (tablet), 1200px (desktop)
3. Verify layout, touch targets, text readability

**Device Testing:**
1. iOS (iPhone, Safari)
2. Android (Pixel/Samsung, Chrome)
3. Desktop (Mac Chrome/Safari, Windows Chrome/Edge)

---

## Risk Assessment

### Component Complexity

**High Complexity:**
- Modal (focus trap, body scroll lock, escape handling)
- Dropdown/Select (keyboard navigation, positioning, mobile native)
- Date/Time Picker (calendar logic, keyboard navigation, mobile native)
- Carousel (touch gestures, auto-play, keyboard navigation)

**Medium Complexity:**
- Tabs (keyboard navigation, ARIA attributes)
- Accordion (expand/collapse logic, ARIA attributes)
- Toggle/Switch (custom styling, keyboard/touch interaction)

**Low Complexity:**
- Button, Input, Textarea, Badge, Avatar, Icon, Spinner

### Browser Compatibility

**Supported Browsers:**
- Chrome 90+ (desktop, Android)
- Safari 14+ (desktop, iOS)
- Firefox 88+ (desktop)
- Edge 90+ (desktop)

**Potential Issues:**
- CSS custom properties: Supported in all modern browsers
- :focus-visible: Supported in Chrome 86+, Safari 15.4+, Firefox 85+
- CSS Grid: Supported in all modern browsers

### Accessibility Compliance Challenges

**Common Challenges:**
- Focus traps in modals (must return focus to trigger)
- Keyboard navigation in custom controls (dropdowns, date pickers)
- Screen reader announcements (live regions timing)
- Colour contrast on hover states
- Touch target sizing on small icons

**Mitigation:**
- Comprehensive testing with screen readers
- jest-axe automated testing
- Manual keyboard testing
- Real device testing

### Performance Considerations

**Bundle Size:**
- Target: < 150KB gzipped (component library)
- Use tree-shaking (ES modules)
- Lazy load large components (Carousel, Modal)

**Render Performance:**
- Target: < 100ms component render time
- Use React.memo for expensive components
- Avoid unnecessary re-renders

**Font Loading:**
- Use `font-display: swap` to prevent FOUT
- Preconnect to Google Fonts
- Consider self-hosting fonts for better performance

---

## Integration Points

### Phase 2 (Authentication & User System)

**Components Used:**
- Input, Button, Checkbox, Toggle (auth forms)
- Modal (password reset, email verification)
- Toast (success/error messages)
- Avatar (user profile)

**Integration:**
- Auth forms use Input + Button components
- Error messages use aria-describedby
- Success messages use Toast component
- User menu uses Avatar + Dropdown

---

### Phase 4 (Business Directory Core)

**Components Used:**
- Card (business cards)
- Grid (business listings)
- Pagination (search results)
- Tabs (business profile sections)
- Modal (business details, photo lightbox)
- Badge (business status: open, closed, featured)
- EmptyState (no search results)
- Skeleton (loading states)

**Integration:**
- Business listings use Grid + Card components
- Search results use Pagination
- Business profiles use Tabs for sections (Overview, Reviews, Events)
- Photo galleries use Carousel + Modal (lightbox)

---

### Phase 5+ (All Feature Phases)

All subsequent phases will use Phase 3 components:
- Forms (events, deals, reviews, messages)
- Display (cards, modals, toasts, alerts)
- Layout (headers, footers, grids, containers)

**Consistency:**
- All forms use same Input, Button, Select components
- All success/error messages use Toast/Alert components
- All data displays use Card, Grid, Pagination components

---

## Timeline Summary

**Total Effort:** 80-100 hours (2-3 weeks for 1 developer)

### Breakdown:

| Phase | Tasks | Effort | Duration |
|-------|-------|--------|----------|
| 1. Design System | 12 | 15-20h | 2-3 days |
| 2. Layout Components | 6 | 12h | 1-2 days |
| 3. Form Components | 10 | 20h | 2-3 days |
| 4. Display Components (Part 1) | 7 | 15h | 2 days |
| 5. Display Components (Part 2) | 7 | 10h | 1-2 days |
| 6. Accessibility Implementation | 9 | 8h | 1 day |
| 7. Testing & QA | - | 10h | 1-2 days |
| 8. Documentation & Integration | - | 5h | 1 day |

**Total:** 95 hours (~12 working days)

**Parallel Work Opportunity:**
- Can run in parallel with Phase 2 (Authentication)
- Multiple developers can work on different components simultaneously
- Layout, form, and display components can be developed in parallel

---

## Next Steps

After Phase 3 completion:

1. **Phase 4 (Business Directory Core):**
   - Use Phase 3 components for business cards, listings, filters
   - Build on Grid, Card, Pagination, Modal components

2. **Component Refinement:**
   - Gather feedback from Phase 4 developers
   - Iterate on components based on real-world usage
   - Add variants/props as needed

3. **Design System Expansion:**
   - Add more colour variants if needed
   - Add animation utilities
   - Add more spacing utilities

4. **Performance Optimization:**
   - Measure bundle size
   - Lazy load large components
   - Optimize font loading

---

## Conclusion

Phase 3 establishes the visual foundation for the entire Community Hub platform. By creating a comprehensive design system and reusable component library with full WCAG 2.1 AA compliance, we ensure consistency, accessibility, and maintainability across all future phases.

**Key Takeaways:**
- Location-agnostic design (colours from config)
- Mobile-first responsive design
- WCAG 2.1 AA compliant (keyboard, screen reader, contrast, touch targets)
- Reusable components for all phases
- Comprehensive testing strategy (jest-axe, manual, device)

**Ready for Development:** This plan provides step-by-step guidance for implementing all 40 tasks in Phase 3. Follow the task breakdown, verify acceptance criteria, and ensure all tests pass before moving to Phase 4.
