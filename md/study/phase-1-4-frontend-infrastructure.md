# Phase 1.4: Frontend Infrastructure - Study Notes

**Studied:** 3 February 2026
**Spec Sections:** 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 6.1-6.3, 7.1, 8.1-8.5
**Status:** Not started (0/7 tasks)
**Dependencies:** Phases 1.1-1.2 (complete)
**Blocked by:** Nothing (ready to start)

---

## Overview

Phase 1.4 sets up the frontend foundation that all subsequent UI work depends on. It covers React + TypeScript initialisation (partially done already), responsive design, design tokens from config, component library base, PWA manifest, service worker skeleton, and build optimisation.

---

## 7 Tasks

1. **Initialize React frontend with TypeScript** - Partially complete (React 19, Vite 6.1, TS already set up in `packages/frontend`). Remaining: install Tailwind CSS, React Router, and structure `src/` folders.
2. **Configure responsive design system (mobile-first)** - Tailwind config with breakpoints: mobile < 768px (primary), tablet 768-1199px, desktop >= 1200px. 44px min touch targets.
3. **Implement design tokens from config** - CSS custom properties loaded from `platform.json` branding.colors. Montserrat (headings) + Open Sans (body) font loading. Type scale (H1-caption).
4. **Set up component library foundation** - Base components: Button (4 types, 6 states), Card (white, 8px radius, shadow), Form Fields (6 states). All WCAG 2.1 AA compliant.
5. **Configure PWA manifest** - `manifest.json` with icons (72-512px), splash screens, theme colours from config.
6. **Set up service worker skeleton** - Caching strategies: cache-first (static assets), network-first (API), cache-first with background update (images). IndexedDB for user data with sync.
7. **Configure build optimisation** - Code splitting, tree shaking, lazy loading routes. Target: < 3s page load on 3G, Lighthouse > 80.

---

## What Already Exists

### `packages/frontend/`
- **React 19** + **Vite 6.1** + **TypeScript** (strict)
- `index.html` - minimal, has TODO for platform.json injection
- `src/main.tsx` - bare `<App>` with StrictMode
- `src/config/platform-loader.ts` - fetches and validates config from `/api/config`
- `src/hooks/useFeatureFlag.ts` - checks feature flags from config
- `vitest.config.ts` - jsdom, 80% coverage thresholds
- `eslint.config.js` - react, react-hooks, jsx-a11y plugins
- 3 existing test files in `src/__tests__/`
- Dependencies: `react`, `react-dom`, `@community-hub/shared`
- Dev deps: `@vitejs/plugin-react`, `@testing-library/*`, `jsdom`

### NOT yet installed
- Tailwind CSS
- React Router
- PWA plugin (vite-plugin-pwa / workbox)
- Any CSS framework or design tokens
- Service worker
- Manifest file

---

## Specification Requirements

### Responsive Breakpoints [Spec 3.4]

| Breakpoint | Width | Priority |
|---|---|---|
| Mobile | < 768px | Primary |
| Tablet | 768px - 1199px | Secondary |
| Desktop | >= 1200px | Secondary |

### Mobile Requirements [Spec 3.4]
- 44px minimum touch targets
- Swipe gestures (photo galleries, card navigation)
- Pull to refresh (content feeds)
- Bottom navigation (thumb-accessible)
- Click to call, click to navigate

### Performance Targets [Spec 3.2]

| Metric | Target |
|---|---|
| Page load | < 3s on 3G |
| Time to Interactive | < 5s |
| First Contentful Paint | < 1.5s |
| Lighthouse Performance | > 80 |
| API Response | < 200ms (p95) |

### Design Tokens [Spec 6.1-6.2]

**Colours** (from `platform.json` branding.colors):
| Token | Hex | Usage |
|---|---|---|
| primary | #2C5F7C | Headers, primary buttons, links |
| secondary | #E67E22 | Accents, highlights, CTAs |
| accent | #F39C12 | Featured items, stars, badges |
| success | #27AE60 | Success messages, open status |
| error | #E74C3C | Error messages, alerts |
| warning | #F39C12 | Warning messages |
| info | #3498DB | Info messages |
| neutral-light | #F5F5F5 | Backgrounds, cards |
| neutral-medium | #CCCCCC | Borders, dividers |
| text-dark | #2C3E50 | Primary text |
| text-light | #7F8C8D | Secondary text |

**Typography**:
| Element | Font | Size | Weight |
|---|---|---|---|
| H1 | Montserrat | 32px | Bold (700) |
| H2 | Montserrat | 26px | Bold (700) |
| H3 | Montserrat | 22px | Semi-bold (600) |
| Body | Open Sans | 16px | Regular (400) |
| Small | Open Sans | 14px | Regular (400) |
| Caption | Open Sans | 12px | Regular (400) |
| Button | Open Sans | 16px | Semi-bold (600) |

### Component Specs [Spec 6.3]

**Buttons:**
| Type | Background | Text | Border |
|---|---|---|---|
| Primary | #E67E22 | White | None |
| Secondary | White | #2C5F7C | 1px #2C5F7C |
| Tertiary | Transparent | #2C5F7C | None |
| Disabled | #CCCCCC | #7F8C8D | None |

**Button States [Spec 7.1]:**
- Default, Hover (10% darken), Active (15% darken + scale 0.98), Focus (2px outline primary + 2px offset), Disabled (50% opacity), Loading (spinner + "Loading...")

**Cards:**
- White background, 8px border-radius, shadow 0 2px 4px rgba(0,0,0,0.1), 16px padding, hover shadow 0 4px 8px rgba(0,0,0,0.15)

**Form Fields:**
- Border 1px solid #CCCCCC, 4px border-radius, padding 12px 16px, focus 2px solid #2C5F7C, error 2px solid #E74C3C

### PWA [Spec 3.7]
- Web App Manifest with full configuration
- Service Worker for caching and offline support
- Smart install prompts
- App icons: 72, 96, 128, 144, 152, 192, 384, 512px
- Branded splash screens
- Push notifications via Firebase Cloud Messaging (later phase)

**Caching Strategy:**
| Resource | Strategy |
|---|---|
| Static assets | Cache-first |
| API responses | Network-first with cache fallback |
| Images | Cache-first with background update |
| User data | IndexedDB with sync |

### Offline Capability [Spec 3.5]
- Homepage: cached version available
- Business profiles: recently viewed available offline
- Saved businesses: full offline access
- Search: limited to cached data
- Actions: queue for sync when online

### Accessibility [Spec 3.6]
- Colour contrast minimum 4.5:1
- Full keyboard navigation
- Screen reader accessible (ARIA)
- Alt text for all images
- Visible focus indicators (2px solid)
- Form labels associated with inputs
- Clear error messages
- Skip to main content link
- 44px minimum touch targets

### RTL Support [Spec 8.4]
- Layout mirroring for Arabic and Urdu
- Direction-aware icon mirroring
- Numbers LTR within RTL text
- Bidirectional text handling
- Tailwind's `rtl:` variant support

---

## Location-Agnostic Requirements

All of these must come from `config/platform.json`, never hardcoded:
- Platform name and tagline (`branding.platformName`, `branding.tagline`)
- Colour palette (`branding.colors.*`)
- Logo paths (`branding.logos.*`)
- SEO metadata (`seo.*`)
- Feature flags (`features.*`)
- Supported languages (`multilingual.*`)
- Contact emails (`contact.*`)

---

## Configuration Sources

### `config/platform.json` (design-relevant keys)
```
branding.colors.primary    = "#2C5F7C"
branding.colors.secondary  = "#E67E22"
branding.colors.accent     = "#F39C12"
branding.colors.success    = "#27AE60"
branding.colors.error      = "#E74C3C"
branding.colors.warning    = "#F39C12"
branding.colors.info       = "#3498DB"
branding.platformName      = "Guildford Community Hub"
branding.tagline           = "Connecting locals with local business"
branding.logos.favicon      = "/assets/branding/favicon.ico"
seo.defaultTitle           = "Guildford Community Hub - Local Business Directory"
seo.defaultDescription     = "Discover local businesses..."
multilingual.defaultLanguage = "en"
multilingual.supportedLanguages = [10 languages]
features.pwaInstallation   = true
```

### `.env.example` (frontend-relevant)
```
ALLOWED_ORIGINS=http://localhost:5173
CDN_URL=
CDN_ENABLED=false
```

---

## Recommended `src/` Folder Structure

```
src/
  assets/          # Static assets (fonts, images)
  components/      # Shared UI components
    ui/            # Base primitives (Button, Card, Input, etc.)
    layout/        # Layout components (Header, Footer, Navigation)
  config/          # Platform config loader (exists)
  hooks/           # Custom hooks (useFeatureFlag exists)
  layouts/         # Page layout wrappers
  pages/           # Route-level page components
  styles/          # Global CSS, Tailwind base, design tokens
  types/           # Frontend-specific TypeScript types
  utils/           # Helper functions
  App.tsx          # Root app component with router
  main.tsx         # Entry point (exists)
```

---

## Related Phases

| Phase | Relationship |
|---|---|
| 1.5 Security | Can run in parallel. CSP headers affect allowed resources. |
| 1.8 i18n | RTL support in Tailwind needed for this phase. Translation file structure. |
| 2 Auth | Depends on frontend being set up. Login/register UI. |
| 3 Design System | Builds on component library foundation from 1.4. |
| 17 PWA & Performance | Expands service worker and offline from skeleton in 1.4. |

---

## Key Files

| File | Purpose |
|---|---|
| `packages/frontend/package.json` | Dependencies (needs Tailwind, Router, PWA) |
| `packages/frontend/vite.config.ts` | Build config (needs PWA plugin, code splitting) |
| `packages/frontend/index.html` | HTML shell (needs manifest link, font preloads) |
| `packages/frontend/src/main.tsx` | App entry (needs router, config loading) |
| `packages/frontend/src/config/platform-loader.ts` | Config fetcher (exists) |
| `packages/frontend/tailwind.config.ts` | To create: breakpoints, colours, fonts |
| `packages/frontend/src/styles/` | To create: global CSS, tokens, Tailwind layers |
| `config/platform.json` | Source of design tokens |

---

## Browser Support [Spec 30.2]

Last 2 versions of: Chrome, Firefox, Safari, Edge, Chrome Mobile, Safari Mobile

## Device Testing Targets [Spec 30.3]

iPhone 12/13/14 (390px), iPhone SE (375px), Samsung Galaxy S21+ (384px), iPad (768px), Pixel 6 (393px)
