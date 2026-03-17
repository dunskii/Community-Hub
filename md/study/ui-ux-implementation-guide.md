# UI/UX Design Specification Implementation Guide

**Study Date:** March 2026
**Topic:** Best practices for implementing the UI/UX design specification (v2.2)
**Status:** Phase 9 Complete (MVP 4), 53% overall progress

---

## 1. UI/UX Design Specification Overview

### Location-Agnostic Design Philosophy
The platform is built on a foundation of **location-agnostic design** (v2.2 specification). Key principles:
- All UI text, imagery, and content references use configuration values, not hardcoded location names
- Design placeholders: `{location.name}`, `{platform.name}`, `{tagline}` - all sourced from configuration
- This enables deployment to any suburb with configuration-only changes

### Core Design Principles (Spec v2.2 Section 1)
1. **Inclusivity First** - 10 languages, RTL support (Arabic, Urdu)
2. **Clarity Over Features** - Essential flows prioritized, progressive disclosure
3. **Community Trust** - Verified businesses emphasized, transparent moderation
4. **Accessibility** - WCAG 2.1 AA mandatory, keyboard navigation, screen readers
5. **Mobile-First** - 44px touch targets, responsive from <768px
6. **Performance-Conscious** - Skeleton loaders, WebP images, progressive enhancement
7. **Offline-Ready** - Graceful degradation, cached content, sync status indicators

---

## 2. Design System Implementation

### Color System (Runtime-Driven)

**Configuration-Driven Colors:**
```css
--color-primary: #2C5F7C (default, from config)
--color-secondary: #E67E22
--color-accent: #F39C12
--color-success: #27AE60
--color-error: #E74C3C
--color-warning: #F39C12
--color-info: #3498DB
```

**Design Token Injection:**
- `packages/frontend/src/utils/design-tokens.ts` - Loads platform config at runtime
- `packages/frontend/src/utils/inject-design-tokens.ts` - Injects CSS custom properties
- Tints/shades auto-generated (10%, 20%, 30%, 50%, 70%, 90%)
- RGB variants generated for rgba() usage

**Implementation Pattern:**
```tsx
// In main.tsx, before React renders:
loadAndInjectDesignTokens().then(() => {
  createRoot(root).render(<App />);
});

// In styles, use CSS variables (never hardcode colors):
.button {
  background-color: var(--color-primary);
  color: var(--color-text-light);
}
```

### Typography System

**Font Stack:**
- **Headings:** Montserrat (bold, friendly, approachable)
- **Body:** Open Sans (clean, highly readable)
- **Fallback:** system-ui, -apple-system, sans-serif
- **Min Size:** 16px on mobile, 14px on desktop

**Font Sizes (from typography.css):**
- H1: 32px (desktop), 28.8px (mobile)
- H2: 26px (desktop), 23.4px (mobile)
- H3: 22px (desktop), 19.8px (mobile)
- Body: 16px
- Small: 14px
- Caption: 12px

### Spacing System (v2.2)

```css
--space-1: 4px   /* Tight spacing, icon gaps */
--space-2: 8px   /* Default element spacing */
--space-3: 12px  /* Related element groups */
--space-4: 16px  /* Card padding, section gaps */
--space-5: 24px  /* Component separation */
--space-6: 32px  /* Section padding */
--space-8: 48px  /* Major section breaks */
--space-10: 64px /* Page section separation */
```

### Breakpoints (Mobile-First)

| Breakpoint | Width | Grid Columns | Gutter |
|------------|-------|--------------|--------|
| Mobile | <768px | 4 | 16px |
| Tablet | 768-1199px | 8 | 24px |
| Desktop | ≥1200px | 12 | 24px |

### Dark Mode (v2.2 - Not Yet Implemented)

**Required Color Tokens:**
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--color-background` | #FFFFFF | #1A1A2E |
| `--color-surface` | #F8F9FA | #252538 |
| `--color-text-primary` | #1A1A2E | #F8F9FA |
| `--color-text-secondary` | #6C757D | #A0A0B0 |
| `--color-border` | #DEE2E6 | #3A3A4E |

---

## 3. Frontend Architecture & Tech Stack

### Current Stack
- **Framework:** React 18.3 + TypeScript (strict mode)
- **Build Tool:** Vite 6.0 with Tailwind CSS 4 integration
- **Styling:** Tailwind CSS 4 + Custom CSS modules + CSS custom properties
- **Testing:** Vitest 3.0 + React Testing Library + jest-axe
- **State Management:** React Context (AuthContext, i18n)
- **Routing:** React Router v6
- **i18n:** react-i18next v16.5.4 (10 languages, RTL)
- **PWA:** vite-plugin-pwa + Workbox

### Component Architecture

**31 Production Components (Phase 3 Complete):**

| Category | Components | Count |
|----------|-----------|-------|
| Layout | Header, Footer, PageContainer, BottomNavigation, Sidebar, Grid | 6 |
| Form | Input, Textarea, Select, Checkbox, RadioButton, Toggle, DatePicker, TimePicker, FileUpload | 9 |
| Display | Modal, Toast, Alert, Badge, Avatar, Skeleton, EmptyState, Pagination, Tabs, Accordion, Carousel | 11 |
| Accessibility | LiveRegion, SkipLink, useFocusTrap | 3 |
| UI Base | Button, Card, Spinner | 3 |

**Additional Components (Phases 4-9):**
- Business: BusinessCard, BusinessList, BusinessFilters, CategoryGrid, OperatingHoursDisplay
- Search: SearchBar, SearchResults, SearchFilters, FilterChips
- Reviews: ReviewCard, ReviewForm, ReviewList, StarRating, SaveButton, FollowButton
- Events: EventCard, RSVPButton, EventFilters, CalendarView, EventForm
- Messaging: ConversationList, ConversationView, MessageBubble, MessageInput, NewConversationForm

---

## 4. Styling Approach

### CSS Organization (5 Files in `/src/styles/`)

| File | Purpose |
|------|---------|
| `app.css` | Main entry, Tailwind @import, @theme block |
| `colours.css` | Color utilities, CSS custom properties |
| `typography.css` | Font families, sizes, line heights |
| `utilities.css` | Spacing, borders, shadows, display |
| `accessibility.css` | Focus indicators, screen reader utilities |

### Tailwind CSS 4 Integration

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
});
```

**Tailwind @theme block in app.css:**
```css
@theme {
  --color-primary: var(--ch-color-primary, #2C5F7C);
  --color-secondary: var(--ch-color-secondary, #E67E22);
  --breakpoint-md: 768px;
  --breakpoint-lg: 1200px;
}
```

---

## 5. Internationalization (i18n) Implementation

### Architecture

**Library:** react-i18next v16.5.4 with LanguageDetector

**10 Supported Languages:**
English, Arabic, Simplified Chinese, Traditional Chinese, Vietnamese, Hindi, Urdu, Korean, Greek, Italian

**Translation Namespaces:**
- `translation` (base)
- `business`, `category`, `reviews`, `owner`, `home`, `events`, `messaging`

### Language Detection (Priority Order)
1. URL query string: `?lang=ar`
2. localStorage: `community-hub-language` key
3. Browser navigator: System language preference
4. Fallback: English

### RTL Support

**RTL Languages:** Arabic, Urdu

**Implementation:**
```typescript
// Set document direction on language change
document.documentElement.setAttribute('lang', languageCode);
document.documentElement.setAttribute('dir', 'rtl' | 'ltr');

// RTL-aware CSS utilities
.text-start { text-align: start; }
.text-end { text-align: end; }
```

### useLanguage Hook
```typescript
const { currentLanguage, availableLanguages, changeLanguage, isRTL } = useLanguage();
```

---

## 6. Configuration-Driven Theming

### 3-Tier Configuration System

| Tier | Source | Purpose |
|------|--------|---------|
| 1 | `.env` | Sensitive credentials, API keys |
| 2 | `config/platform.json` | Location, branding, feature flags |
| 3 | Database | Runtime-editable settings |

### platform.json Structure
```json
{
  "location": { "name": "Guildford South", "coordinates": { "lat": -33.921, "lng": 150.955 } },
  "platform": { "name": "Community Hub" },
  "branding": {
    "colors": { "primary": "#2C5F7C", "secondary": "#E67E22", ... }
  },
  "multilingual": {
    "defaultLanguage": "en",
    "supportedLanguages": [
      { "code": "en", "enabled": true, "rtl": false },
      { "code": "ar", "enabled": true, "rtl": true }
    ]
  }
}
```

### Frontend Config Loading
```typescript
// Load and inject before React renders
await loadAndInjectDesignTokens();
```

---

## 7. Accessibility Implementation

### WCAG 2.1 AA Compliance

**Testing:** jest-axe integrated - zero violations across 2,315+ tests

### Keyboard Navigation Requirements
- **Tab/Shift+Tab:** Navigate forward/backward
- **Enter:** Activate buttons, submit forms
- **Space:** Toggle checkboxes, activate buttons
- **Escape:** Close modals, dropdowns
- **Arrow Keys:** Navigate lists, tabs, carousels

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Touch Targets
- **Minimum:** 44px × 44px for all interactive elements

### Screen Reader Support
```tsx
// Required ARIA attributes
<button aria-label="Close" onClick={onClose}>×</button>
<div role="dialog" aria-modal="true" aria-labelledby="title">
<div role="alert">{error}</div>
<div role="status" aria-live="polite">{dynamicContent}</div>
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Animation & Motion (v2.2)

### Timing Functions
| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | General transitions |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Elements entering |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Elements exiting |
| `--ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Playful interactions |

### Duration Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Micro-interactions |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Modal/overlay transitions |
| `--duration-slower` | 500ms | Complex animations |

### Standard Animations
- **Fade in:** Opacity 0→1, 200ms, ease-out
- **Slide up:** TranslateY 16px→0, 300ms, ease-out
- **Scale in:** Scale 0.95→1, 200ms, ease-out
- **Skeleton shimmer:** Linear gradient sweep, 1.5s, infinite

---

## 9. Responsive Images (v2.2)

### Format Strategy
- Primary: WebP (80% quality)
- Fallback: JPEG for older browsers
- Use `<picture>` element with `srcset`

### Breakpoint Sizes
| Breakpoint | Card Thumbnail | Hero Image | Gallery Image |
|------------|---------------|------------|---------------|
| Mobile | 320w | 768w | 640w |
| Tablet | 480w | 1200w | 800w |
| Desktop | 640w | 1920w | 1200w |

### Loading Behaviour
- Above-the-fold: `loading="eager"`, `fetchpriority="high"`
- Below-the-fold: `loading="lazy"`
- Placeholder: Blurred low-res (20x20px scaled with CSS blur)

### Aspect Ratios
| Image Type | Aspect Ratio |
|------------|--------------|
| Business card thumbnail | 1:1 |
| Business cover photo | 16:9 |
| Event card | 16:9 |
| User avatar | 1:1 |
| Gallery grid | 4:3 |

---

## 10. Offline Behaviour (v2.2)

### Service Worker Strategy

| Content Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Static assets | Cache-first | Until new deploy |
| Business listings | Stale-while-revalidate | 1 hour |
| Search results | Network-first | 5 minutes |
| Saved businesses | Cache-first + sync | Persistent |
| Messages | Network-first | No cache |

### Offline UI States

| Feature | Offline Behaviour |
|---------|-------------------|
| Business directory | Show cached results, disable search |
| Business profile | Show if previously viewed |
| Saved businesses | Full access (synced locally) |
| Events calendar | Show cached events |
| Messaging | Show history, queue new messages |

### Connection Recovery
1. Process queued actions in background
2. Refresh stale cached data
3. Toast: "Back online. Syncing your changes..."
4. Toast on completion: "All changes synced"

---

## 11. Implementation Best Practices

### Pattern 1: Configuration-Driven Colors
```typescript
// ✅ CORRECT: Use CSS variables
className="bg-primary text-white"

// ❌ WRONG: Never hardcode
className="bg-blue-600 text-white"
```

### Pattern 2: Responsive Design
```typescript
// ✅ CORRECT: Mobile-first with Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ WRONG: Desktop-first
<div className="grid grid-cols-3 sm:grid-cols-2 xs:grid-cols-1">
```

### Pattern 3: Accessibility
```typescript
// ✅ CORRECT: Semantic HTML + ARIA
<button aria-label="Close" onClick={onClose}>×</button>

// ❌ WRONG: Non-semantic
<div onClick={onClose} className="cursor-pointer">×</div>
```

### Pattern 4: i18n
```typescript
// ✅ CORRECT: Use translation keys
const { t } = useTranslation();
<h1>{t('home.hero.welcome')}</h1>

// ❌ WRONG: Hardcoded English
<h1>Welcome to Community Hub</h1>
```

### Pattern 5: Focus Management
```css
/* ✅ CORRECT: Visible focus indicator */
button:focus-visible { outline: 2px solid var(--color-primary); }

/* ❌ WRONG: No focus indicator */
button:focus { outline: none; }
```

---

## 12. Key Files Reference

### Configuration & Design Tokens
- `packages/frontend/src/utils/design-tokens.ts`
- `packages/frontend/src/utils/inject-design-tokens.ts`
- `packages/frontend/src/config/platform-loader.ts`
- `packages/frontend/src/styles/app.css`

### i18n
- `packages/frontend/src/i18n/config.ts`
- `packages/frontend/src/i18n/rtl.ts`
- `packages/frontend/src/hooks/useLanguage.ts`

### Styling
- `packages/frontend/src/styles/colours.css`
- `packages/frontend/src/styles/typography.css`
- `packages/frontend/src/styles/accessibility.css`
- `packages/frontend/src/styles/utilities.css`

### Components
- `packages/frontend/src/components/ui/Button.tsx`
- `packages/frontend/src/components/ui/Card.tsx`
- `packages/frontend/src/components/README.md`

### Accessibility
- `packages/frontend/ACCESSIBILITY.md`
- `packages/frontend/src/components/a11y/`

---

## 13. Gap Analysis

### Implemented ✅
- 31 production-ready components
- Complete CSS design system
- Runtime design token injection
- Full i18n support (10 languages, RTL)
- WCAG 2.1 AA compliance
- Responsive design (3 breakpoints)
- Tailwind CSS 4 integration
- PWA support

### Not Yet Implemented ❌
- Dark mode (v2.2 spec)
- Advanced skeleton loading with shimmer animation
- Component showcase/Storybook
- Enhanced empty states per content type
- Error boundaries with recovery flows
- Offline indicators and sync status UI

---

## 14. Recommended Next Steps

1. **Dark Mode Implementation** (~2-3 days)
   - Add dark mode tokens to platform.json
   - Implement `prefers-color-scheme` detection
   - Add toggle in user settings
   - Update all components for dark mode support

2. **Enhanced Loading States** (~1-2 days)
   - Add shimmer animation to Skeleton component
   - Implement progressive image loading with blur placeholders

3. **Offline UI** (~2-3 days)
   - Add global offline indicator banner
   - Implement sync status indicators
   - Add queued action pending states

4. **Component Showcase** (~1 day)
   - Create Storybook or static HTML component showcase
   - Document all component variants and states

---

## Document Info

- **Specification Version:** v2.2 (March 2026)
- **Technical Spec:** Community_Hub_Specification_v2.md
- **Current Phase:** Phase 9 Complete (MVP 4)
- **Overall Progress:** 339/644 tasks (53%)
- **Total Tests:** 2,315+ passing
