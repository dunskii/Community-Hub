# Phase 1.4: Frontend Infrastructure - Implementation Plan

**Created:** 3 February 2026
**Phase:** 1.4 of 19
**Spec Sections:** 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 6.1-6.3, 7.1, 8.4
**Tasks:** 7 (0 complete)
**Prerequisites:** Phases 1.1-1.3 (all complete)

---

## Scope

This phase builds the frontend foundation: Tailwind CSS with config-driven design tokens, responsive breakpoints, base UI components, PWA manifest, service worker skeleton, and build optimisation. Everything is mobile-first, WCAG 2.1 AA, RTL-ready, and location-agnostic.

### In Scope
- Install and configure Tailwind CSS 4
- Configure responsive breakpoints (mobile-first)
- CSS custom properties from `platform.json` colours
- Font loading (Montserrat headings, Open Sans body)
- Typography scale
- Base UI components: Button, Card, FormField, SkipLink
- PWA manifest with config-driven theme/icons
- Service worker skeleton with caching strategies
- Vite build optimisation (code splitting, tree shaking, chunking)
- RTL support infrastructure (Tailwind `rtl:` variant)
- Update `index.html` (font preloads, manifest link, skip link)
- Tests for all new code

### Out of Scope (later phases)
- React Router and page routing (Phase 3)
- Full design system with all components (Phase 3)
- i18n translation files and language switching UI (Phase 1.8)
- Authentication UI (Phase 2)
- Push notifications / Firebase (Phase 17)
- Full offline data sync with IndexedDB (Phase 17)
- Backend `/api/config` endpoint (created in Phase 1.4 as minimal bridge)

---

## Step 1: Install Dependencies

**Files modified:** `packages/frontend/package.json`

Install Tailwind CSS 4 (the latest version uses a Vite plugin instead of PostCSS), plus the PWA plugin:

```bash
cd packages/frontend
pnpm add tailwindcss @tailwindcss/vite
pnpm add -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies
```

**Why these versions:**
- `tailwindcss` + `@tailwindcss/vite` -- Tailwind CSS 4 uses a Vite plugin (no PostCSS config needed). CSS-first configuration instead of JS config file.
- `vite-plugin-pwa` -- generates manifest.json and registers service worker via Workbox
- `workbox-*` -- typed service worker authoring

**Not installing:**
- React Router (Phase 3 handles routing)
- State management library (premature; React context sufficient for now)
- CSS-in-JS (using Tailwind utility classes instead)

---

## Step 2: Configure Tailwind CSS 4

**Files created:**
- `packages/frontend/src/styles/app.css`

**Files modified:**
- `packages/frontend/vite.config.ts` (add Tailwind plugin)
- `packages/frontend/src/main.tsx` (import CSS)

Tailwind CSS 4 uses CSS-first configuration via `@theme` blocks instead of a `tailwind.config.ts` file. The Vite plugin handles everything.

### `packages/frontend/vite.config.ts`
```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 4002,
  },
});
```

### `packages/frontend/src/styles/app.css`

This is the main CSS file. It uses Tailwind's `@theme` to define design tokens that map to CSS custom properties. The custom properties are set at runtime from `platform.json`, but Tailwind needs static defaults for its JIT engine.

```css
@import "tailwindcss";

/*
 * Design tokens from Community Hub specification [Spec §6.1-6.2].
 * Runtime values injected from platform.json via CSS custom properties on :root.
 * Tailwind @theme defaults match the Guildford config for JIT compilation.
 */

@theme {
  /* Colours [Spec §6.1] - defaults from platform.json Guildford config */
  --color-primary: var(--ch-color-primary, #2C5F7C);
  --color-secondary: var(--ch-color-secondary, #E67E22);
  --color-accent: var(--ch-color-accent, #F39C12);
  --color-success: var(--ch-color-success, #27AE60);
  --color-error: var(--ch-color-error, #E74C3C);
  --color-warning: var(--ch-color-warning, #F39C12);
  --color-info: var(--ch-color-info, #3498DB);
  --color-neutral-light: #F5F5F5;
  --color-neutral-medium: #CCCCCC;
  --color-text-dark: #2C3E50;
  --color-text-light: #7F8C8D;

  /* Typography [Spec §6.2] */
  --font-heading: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Open Sans', ui-sans-serif, system-ui, sans-serif;

  /* Font sizes with line heights */
  --text-h1: 2rem;       /* 32px */
  --text-h2: 1.625rem;   /* 26px */
  --text-h3: 1.375rem;   /* 22px */
  --text-body: 1rem;      /* 16px */
  --text-sm: 0.875rem;    /* 14px */
  --text-caption: 0.75rem; /* 12px */

  /* Breakpoints [Spec §3.4] - mobile-first */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1200px;  /* Desktop */

  /* Spacing */
  --spacing-touch: 2.75rem; /* 44px minimum touch target [Spec §3.4] */

  /* Border radius */
  --radius-sm: 0.25rem;  /* 4px - form fields */
  --radius-md: 0.5rem;   /* 8px - cards */
  --radius-lg: 0.75rem;  /* 12px - modals */
  --radius-full: 9999px; /* pills, avatars */

  /* Shadows [Spec §6.3] */
  --shadow-card: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-card-hover: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Focus visible ring - accessibility [Spec §3.6] */
@utility focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### `packages/frontend/src/main.tsx`
Add CSS import at the top:
```ts
import './styles/app.css';
```

---

## Step 3: Runtime Design Token Injection

**Files created:**
- `packages/frontend/src/utils/inject-design-tokens.ts`

This function reads `platform.json` branding.colors and sets CSS custom properties on `:root` so the Tailwind theme picks them up at runtime. Called once during app init after config loads.

```ts
import type { BrandingConfig } from '@community-hub/shared';

/**
 * Inject branding colours from platform config as CSS custom properties.
 * These override the static defaults in app.css @theme block.
 */
export function injectDesignTokens(branding: BrandingConfig): void {
  const root = document.documentElement;
  const { colors } = branding;

  root.style.setProperty('--ch-color-primary', colors.primary);
  root.style.setProperty('--ch-color-secondary', colors.secondary);
  root.style.setProperty('--ch-color-accent', colors.accent);
  root.style.setProperty('--ch-color-success', colors.success);
  root.style.setProperty('--ch-color-error', colors.error);
  root.style.setProperty('--ch-color-warning', colors.warning);
  root.style.setProperty('--ch-color-info', colors.info);
}
```

---

## Step 4: Font Loading

**Files modified:**
- `packages/frontend/index.html` (preload links)
- `packages/frontend/src/styles/app.css` (@font-face declarations)

### Approach: Google Fonts via `<link>` with preconnect

Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;600&display=swap"
/>
```

Use `display=swap` to avoid FOIT (Flash of Invisible Text). Only load the weights we need: Montserrat 600+700 (semi-bold, bold) and Open Sans 400+600 (regular, semi-bold).

---

## Step 5: Update index.html

**Files modified:** `packages/frontend/index.html`

Full updated `index.html`:
```html
<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Community Hub - Local business discovery and community engagement" />
    <meta name="theme-color" content="#2C5F7C" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;600&display=swap" />
    <title>Community Hub</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Key changes:
- Add `dir="ltr"` attribute (RTL support will toggle this)
- Add `<link rel="manifest">` for PWA
- Add `<link rel="apple-touch-icon">` for iOS
- Add font preconnect + stylesheet
- Remove the TODO comment (resolved)

---

## Step 6: Base UI Components

**Files created:**
- `packages/frontend/src/components/ui/Button.tsx`
- `packages/frontend/src/components/ui/Card.tsx`
- `packages/frontend/src/components/ui/FormField.tsx`
- `packages/frontend/src/components/ui/SkipLink.tsx`
- `packages/frontend/src/components/ui/Spinner.tsx`
- `packages/frontend/src/components/ui/index.ts` (barrel export)

These are foundational primitives. The full design system (Phase 3) will build on these.

### Button [Spec 6.3, 7.1]

4 variants: `primary`, `secondary`, `tertiary`, `disabled`
6 states: default, hover, active, focus, disabled, loading

Props:
```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}
```

Implementation notes:
- Use Tailwind utility classes for all styling
- `min-h-[2.75rem]` for 44px touch target (mobile)
- Focus state: `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`
- Loading state: swap text for Spinner component, set `aria-busy="true"` and `disabled`
- Hover: darken background 10% using Tailwind `hover:brightness-90`
- Active: darken 15% + scale `active:scale-[0.98] active:brightness-85`

### Card [Spec 6.3]

```ts
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  as?: React.ElementType;
}
```

Implementation: `bg-white rounded-md shadow-card p-4`, hoverable adds `hover:shadow-card-hover transition-shadow`.

### FormField [Spec 6.3, 7.1]

```ts
interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode; // The actual input/select/textarea
}
```

This is a wrapper that handles label association, error display, and required indicator. The actual input element is passed as `children` so it remains flexible.

### SkipLink [Spec 3.6]

Skip to main content link for keyboard accessibility. Visually hidden until focused.

```tsx
export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-sm focus-ring"
    >
      Skip to main content
    </a>
  );
}
```

### Spinner

Simple loading indicator used by Button's loading state.

---

## Step 7: App Shell with Skip Link

**Files modified:**
- `packages/frontend/src/main.tsx`

Update `main.tsx` to include the SkipLink and a basic app shell with `id="main-content"`:

```tsx
import './styles/app.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SkipLink } from './components/ui/index.js';

function App() {
  return (
    <>
      <SkipLink />
      <main id="main-content">
        <div>Community Hub</div>
      </main>
    </>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in document');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Note: Config loading (`loadPlatformConfig` + `injectDesignTokens`) will be wired up when the `/api/config` endpoint exists. For now, the CSS defaults in `app.css` are sufficient.

---

## Step 8: PWA Manifest via vite-plugin-pwa

**Files modified:**
- `packages/frontend/vite.config.ts`

Add PWA configuration to Vite config using `vite-plugin-pwa`. The manifest values use the Guildford defaults but will be overridden at build time or via the service worker when config is dynamic.

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Community Hub',
        short_name: 'Hub',
        description: 'Local business discovery and community engagement',
        theme_color: '#2C5F7C',
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Precache generated assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching strategies [Spec §3.7]
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 4002,
  },
});
```

**Icon placeholder files** -- create placeholder SVG icons in `packages/frontend/public/icons/`. Actual branded icons will be created later, but the PWA manifest needs valid paths. Create a minimal set:

**Files created:**
- `packages/frontend/public/icons/` directory with placeholder PNGs (can be simple coloured squares generated via a script or just empty files initially -- the important thing is the manifest structure is correct)
- `packages/frontend/public/apple-touch-icon.png` (placeholder)

---

## Step 9: Service Worker Skeleton

The `vite-plugin-pwa` with workbox configuration in Step 8 handles the service worker generation automatically. The `workbox` config defines caching strategies:

- **Static assets** (JS, CSS, HTML, fonts): Precached by Workbox during build
- **Google Fonts**: CacheFirst (immutable resources)
- **API responses** (`/api/v1/*`): NetworkFirst with 10s timeout, fallback to cache
- **Images**: StaleWhileRevalidate (serve cached, update in background)

For Phase 1.4, this is sufficient. Phase 17 will expand with:
- IndexedDB for offline user data
- Background sync for queued actions
- Push notification handling (Firebase)

---

## Step 10: Build Optimisation

**Files modified:**
- `packages/frontend/vite.config.ts` (add build config)

Add build optimisation to the Vite config:

```ts
export default defineConfig({
  // ...plugins from Step 8...
  server: {
    port: 4002,
  },
  build: {
    // Target modern browsers [Spec §30.2]
    target: 'es2022',
    // Chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    // Report compressed sizes
    reportCompressedSize: true,
    // Inline small assets
    assetsInlineLimit: 4096,
  },
});
```

Key optimisations:
- **Code splitting**: React vendor chunk separated (cached independently)
- **Tree shaking**: Vite/Rollup handles this automatically with ES modules
- **Target ES2022**: No unnecessary transpilation for modern browsers
- **Asset inlining**: Small assets (< 4KB) inlined as data URIs
- **Route-based splitting**: Will be added in Phase 3 when React Router is installed (dynamic `import()`)

---

## Step 11: Backend Config Endpoint (Minimal Bridge)

**Files created:**
- `packages/backend/src/routes/config.ts`

**Files modified:**
- `packages/backend/src/routes/index.ts` (register config route)

The frontend `platform-loader.ts` already expects `GET /api/config` (or `/api/v1/config`). Create a minimal endpoint that serves the platform config (non-sensitive fields only):

```ts
// packages/backend/src/routes/config.ts
import { Router } from 'express';

const router = Router();

router.get('/config', (_req, res) => {
  // getPlatformConfig() already exists in backend config module
  // Strip any sensitive fields before sending to client
  const config = getPlatformConfig();
  res.json(config);
});

export default router;
```

Register in `routes/index.ts`:
```ts
v1.use('/', configRouter);
```

This ensures `platform-loader.ts` on the frontend can actually fetch config. Update the frontend loader URL to `/api/v1/config` to match the API prefix.

---

## Step 12: Folder Structure

**Directories created:**
```
packages/frontend/src/
  components/
    ui/           # Base primitives (Button, Card, FormField, SkipLink, Spinner)
  styles/         # app.css (Tailwind + design tokens)
  utils/          # inject-design-tokens.ts
  public/
    icons/        # PWA icon placeholders
```

Directories NOT created yet (later phases):
- `components/layout/` (Phase 3)
- `pages/` (Phase 3)
- `layouts/` (Phase 3)

---

## Step 13: Tests

**Files created:**
- `packages/frontend/src/__tests__/components/Button.test.tsx`
- `packages/frontend/src/__tests__/components/Card.test.tsx`
- `packages/frontend/src/__tests__/components/FormField.test.tsx`
- `packages/frontend/src/__tests__/components/SkipLink.test.tsx`
- `packages/frontend/src/__tests__/utils/inject-design-tokens.test.ts`

### Test Coverage Plan

**Button tests:**
- Renders with correct variant classes (primary, secondary, tertiary)
- Renders disabled state (opacity, cursor, aria-disabled)
- Renders loading state (spinner visible, aria-busy, disabled)
- Calls onClick handler
- Does not call onClick when disabled or loading
- Has minimum 44px touch target height
- Has focus-visible outline
- Forwards refs and extra props

**Card tests:**
- Renders children
- Applies hover shadow when `hoverable`
- Renders as custom element via `as` prop
- Has correct border radius and shadow

**FormField tests:**
- Associates label with input via `id`
- Shows error message with `aria-describedby`
- Shows required indicator
- Shows hint text

**SkipLink tests:**
- Hidden by default (sr-only)
- Visible on focus
- Links to correct target ID

**inject-design-tokens tests:**
- Sets CSS custom properties on document root
- Sets all 7 colour properties
- Handles missing colours gracefully

---

## Step 14: Verify and Validate

Run the full verification suite:

```bash
# From monorepo root
pnpm lint          # All packages pass lint
pnpm typecheck     # All packages pass TypeScript
pnpm test          # All tests pass (existing + new)
pnpm build         # Build succeeds with no errors
```

Check the build output:
- Verify chunk splitting (react-vendor separate)
- Verify manifest.webmanifest generated
- Verify service worker generated
- Check bundle sizes are reasonable

---

## Implementation Order

```
Step 1: Install dependencies
  |
Step 2: Configure Tailwind CSS 4 (app.css + vite plugin)
  |
Step 3: Runtime design token injection utility
  |
Step 4: Font loading (index.html preconnect/stylesheet)
  |
Step 5: Update index.html (manifest, apple-touch-icon, dir attribute)
  |
Step 6: Base UI components (Button, Card, FormField, SkipLink, Spinner)
  |
Step 7: Update main.tsx (import CSS, add SkipLink + main landmark)
  |
Step 8: PWA manifest via vite-plugin-pwa
  |
Step 9: Service worker (handled by Step 8 workbox config)
  |
Step 10: Build optimisation (vite.config.ts build options)
  |
Step 11: Backend config endpoint (minimal GET /api/v1/config)
  |
Step 12: Folder structure (directories)
  |
Step 13: Tests
  |
Step 14: Verify (lint, typecheck, test, build)
```

Steps 1-5 are sequential. Steps 6-7 depend on 2. Steps 8-10 modify the same vite.config.ts and should be done together. Step 11 is independent. Step 13 depends on 6.

---

## Task-to-Step Mapping

| TODO Task | Steps |
|---|---|
| 1. Initialize React frontend with TypeScript | 1, 2, 5, 12 |
| 2. Configure responsive design system | 2 (breakpoints in @theme) |
| 3. Implement design tokens from config | 2, 3, 4 |
| 4. Set up component library foundation | 6, 7 |
| 5. Configure PWA manifest | 5, 8 |
| 6. Set up service worker skeleton | 8, 9 |
| 7. Configure build optimisation | 10 |

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Tailwind CSS 4 is relatively new | The CSS-first `@theme` approach is stable and documented. Fallback: use Tailwind 3 with JS config if issues arise. |
| Google Fonts external dependency | `display=swap` prevents FOIT. Fonts cached by service worker for offline use. |
| PWA icons don't exist yet | Use placeholder files. Actual branded icons are a design task, not blocking infrastructure. |
| No `/api/config` endpoint yet | Create minimal endpoint in Step 11. Design token defaults in CSS cover the gap. |
| Build size regression | `reportCompressedSize: true` and manual chunks keep bundle monitored. |

---

## Files Summary

### New Files (12)
```
packages/frontend/src/styles/app.css
packages/frontend/src/utils/inject-design-tokens.ts
packages/frontend/src/components/ui/Button.tsx
packages/frontend/src/components/ui/Card.tsx
packages/frontend/src/components/ui/FormField.tsx
packages/frontend/src/components/ui/SkipLink.tsx
packages/frontend/src/components/ui/Spinner.tsx
packages/frontend/src/components/ui/index.ts
packages/frontend/src/__tests__/components/Button.test.tsx
packages/frontend/src/__tests__/components/Card.test.tsx
packages/frontend/src/__tests__/components/FormField.test.tsx
packages/frontend/src/__tests__/components/SkipLink.test.tsx
packages/frontend/src/__tests__/utils/inject-design-tokens.test.ts
```

### Modified Files (4)
```
packages/frontend/package.json (new dependencies)
packages/frontend/vite.config.ts (Tailwind, PWA, build config)
packages/frontend/index.html (fonts, manifest, dir, skip link)
packages/frontend/src/main.tsx (import CSS, SkipLink, main landmark)
```

### Backend Files (2)
```
packages/backend/src/routes/config.ts (new - minimal config endpoint)
packages/backend/src/routes/index.ts (modified - register config route)
```

### Placeholder Files
```
packages/frontend/public/icons/icon-*.png (8 placeholder icons)
packages/frontend/public/apple-touch-icon.png
```
