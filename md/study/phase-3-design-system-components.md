# Phase 3: Design System & Core Components - Study Document

**Study Date:** 2026-02-07
**Phase Status:** Not Started (Can run parallel to Phase 2)
**Task Count:** 40 tasks total (0/40 completed - 0%)
**Specification References:** §6 (Design Specifications), §7 (UI States & Components), §3.6 (Accessibility)

---

## Table of Contents

1. [Phase 3 Overview](#phase-3-overview)
2. [Phase 3 Structure](#phase-3-structure)
3. [Subsection 3.1: Design System](#subsection-31-design-system)
4. [Subsection 3.2: Core UI Components](#subsection-32-core-ui-components)
5. [Subsection 3.3: Accessibility](#subsection-33-accessibility)
6. [Dependencies & Blockers](#dependencies--blockers)
7. [Data Models & API Endpoints](#data-models--api-endpoints)
8. [Files to Create](#files-to-create)
9. [Success Criteria](#success-criteria)
10. [Timeline Estimate](#timeline-estimate)
11. [Key Specification Sections](#key-specification-sections)

---

## Phase 3 Overview

**Purpose:** Phase 3 establishes the visual foundation and reusable component library for the entire Community Hub platform. It bridges Phase 1 (Infrastructure) and Phase 2 (Authentication) with visual design, making the platform ready for user-facing features in Phase 4+.

**Critical Dependencies:**
- **Requires:** Phase 1 frontend infrastructure (Tailwind CSS 4, PWA manifest, design token system) ✅ COMPLETE
- **Can run parallel to:** Phase 2 (Authentication & User System)
- **Blocks:** Phase 4 (Business Directory Core) and all downstream phases

**Location-Agnostic Principle:**
All colours, logos, and branding must come from `config/platform.json` - never hardcoded. This allows the platform to be deployed to different suburbs/communities with configuration-only changes.

---

## Phase 3 Structure

Phase 3 consists of 3 subsections totaling 40 tasks:

### 3.1 Design System [Spec §6] - 12 Tasks
Building the foundational design language from configuration

### 3.2 Core UI Components [Spec §7] - 24 Tasks
Creating reusable component library following specification

### 3.3 Accessibility [Spec §3.6] - 9 Tasks
Ensuring WCAG 2.1 AA compliance across all components

---

## Subsection 3.1: Design System

**Specification Reference:** Section 6 (Design Specifications)

### 3.1.1 Colour System (4 tasks)

**Reference:** Section 6.1 - Colour Palette (Lines 968-981)

All colours must be loaded from `config/platform.json` (location-agnostic configuration):

| Colour Token | Hex Code (Guildford South) | Usage | CSS Variable |
|-------------|----------|-------|--------|
| Primary Teal | #2C5F7C | Headers, primary buttons, links | `--color-primary` |
| Secondary Orange | #E67E22 | Accents, highlights, CTAs | `--color-secondary` |
| Accent Gold | #F39C12 | Featured items, stars, badges | `--color-accent` |
| Success Green | #27AE60 | Success messages, open status | `--color-success` |
| Error Red | #E74C3C | Error messages, alerts | `--color-error` |
| Neutral Light | #F5F5F5 | Backgrounds, cards | `--color-neutral-light` |
| Neutral Medium | #CCCCCC | Borders, dividers | `--color-neutral-medium` |
| Text Dark | #2C3E50 | Primary text | `--color-text-dark` |
| Text Light | #7F8C8D | Secondary text | `--color-text-light` |

**Tasks:**
1. Implement CSS custom properties (`:root { --color-primary: var from platform.json) }`)
2. Create primary colour (#2C5F7C) palette with tints/shades (10%, 20%, 30%, 50%, 70%, 90%)
3. Create secondary/accent colour variants (same tint/shade system)
4. Implement semantic colours (success, error, warning, info) with configurable overrides

**Already Completed (Phase 1.4):**
- Tailwind CSS 4 with `@theme` block from `platform.json`
- Runtime CSS variable injection
- Design token system scaffolding

**Implementation Guidance:**
```css
/* Load colours from platform.json at runtime */
:root {
  --color-primary: /* from config */;
  --color-primary-10: /* calculated tint */;
  --color-primary-90: /* calculated shade */;
  /* etc. */
}
```

---

### 3.1.2 Typography System (6 tasks)

**Reference:** Section 6.2 - Typography (Lines 982-993)

**Font Stack:**
- **Headings:** Montserrat (Google Fonts) - Bold, Semi-bold
- **Body:** Open Sans (Google Fonts) - Regular, Semi-bold
- **Font Display:** `swap` (prevent FOUT)

**Typography Scale:**

| Element | Font | Size (Desktop) | Size (Mobile) | Weight | Line-Height |
|---------|------|------|------|--------|-------------|
| H1 | Montserrat | 32px | 28.8px (90%) | Bold (700) | 1.2 |
| H2 | Montserrat | 26px | 23.4px (90%) | Bold (700) | 1.3 |
| H3 | Montserrat | 22px | 19.8px (90%) | Semi-bold (600) | 1.3 |
| H4 | Montserrat | 18px | 16.2px (90%) | Semi-bold (600) | 1.4 |
| H5 | Montserrat | 16px | 14.4px (90%) | Semi-bold (600) | 1.4 |
| H6 | Montserrat | 14px | 12.6px (90%) | Semi-bold (600) | 1.5 |
| Body | Open Sans | 16px | 16px | Regular (400) | 1.5 |
| Small | Open Sans | 14px | 14px | Regular (400) | 1.5 |
| Caption | Open Sans | 12px | 12px | Regular (400) | 1.6 |
| Button | Open Sans | 16px | 16px | Semi-bold (600) | 1.5 |

**Responsive Breakpoints:**
- **Mobile (< 768px):** Scale down 90% for headings
- **Tablet (768-1199px):** Scale down 95%
- **Desktop (≥ 1200px):** Full scale

**Tasks:**
1. Load Montserrat font (headings) via Google Fonts with `font-display: swap`
2. Load Open Sans font (body) via Google Fonts with `font-display: swap`
3. Implement H1-H6 heading scale with responsive sizing
4. Create body text styles with line-height utilities
5. Implement font-weight utility classes (regular, semi-bold, bold)
6. Implement responsive typography (adjust sizes for mobile/tablet/desktop)

**Implementation Guidance:**
- Use `@font-face` or Google Fonts CDN
- Preload font files for critical fonts
- Fallback fonts: `system-ui, -apple-system, sans-serif`

---

### 3.1.3 Component Specifications (2 tasks)

**Reference:** Section 6.3 - Component Specifications (Lines 994-1024)

**Button Specifications:**

| Type | Background | Text | Border | Border-Radius | Hover | Active |
|------|------------|------|--------|---------------|-------|--------|
| Primary | #E67E22 (Secondary) | White | None | 4px | 10% darker | 15% darker, 0.98 scale |
| Secondary | White | #2C5F7C (Primary) | 1px #2C5F7C | 4px | #F5F5F5 bg | #EEEEEE bg |
| Tertiary | Transparent | #2C5F7C (Primary) | None | 4px | #F5F5F5 bg | #EEEEEE bg |
| Disabled | #CCCCCC | #7F8C8D | None | 4px | No hover | No active |

**Button States:**
- Default, Hover, Active, Focus, Disabled, Loading
- Focus: 2px outline in primary colour, offset 2px
- Loading: Spinner + "Loading..." text

**Card Specifications:**
- Background: White
- Border-radius: 8px
- Shadow (default): `0 2px 4px rgba(0,0,0,0.1)`
- Shadow (hover): `0 4px 8px rgba(0,0,0,0.15)`
- Padding: 16px
- Hover effect: Lift (`transform: translateY(-2px)`)

**Form Field Specifications:**
- Border: 1px solid #CCCCCC (default)
- Border (hover): 1px solid #999999
- Border (focus): 2px solid #2C5F7C (primary)
- Border (error): 2px solid #E74C3C
- Border-radius: 4px
- Padding: 12px 16px
- Background (disabled): #F5F5F5, 50% opacity
- Background (read-only): #F5F5F5

**Tasks:**
1. Document component visual specifications (buttons, cards, forms)
2. Create reusable component style configuration file

---

## Subsection 3.2: Core UI Components

**Specification Reference:** Section 7 (UI States & Components), Section 7.1-7.5

### 3.2.1 Layout Components (6 tasks)

**Reference:** Section 6.4 - Page Layouts (Lines 1025-1086), Section 7

#### Header Component

**Layout:**
- **Sticky positioning** (remains at top on scroll)
- **Logo/branding** on left (from `config/platform.json`)
- **Language selector** (globe icon + current language code)
- **Navigation menu** (horizontal on desktop)
  - Links: Home, Businesses, Events, Community, Deals, About
- **"List Your Business" CTA button** (primary button style)
- **User menu** (avatar/login button) on right

**Responsive Behavior:**
- **Desktop (≥ 1200px):** Full horizontal layout
- **Tablet (768-1199px):** Condensed nav, hamburger optional
- **Mobile (< 768px):** Hamburger menu (3-line icon), logo center, CTA hidden or in menu

**Accessibility:**
- Skip to main content link (hidden, visible on focus)
- Keyboard navigation (Tab order)
- ARIA landmark: `<header>` with `role="banner"`

---

#### Footer Component

**Layout:**
- **Dark background** (#2C3E50 or similar)
- **4 columns on desktop**, stack vertically on mobile:
  1. **Platform Links:** Home, Businesses, Events, Community, Deals
  2. **Resources:** About, FAQ, Blog, Contact
  3. **Legal:** Terms of Service, Privacy Policy, Cookie Consent
  4. **Partners:** Council logo, Chamber logo + copyright text
- **Social media links** (icons: Facebook, Instagram, Twitter)
- **Newsletter signup form** (email input + submit button)

**Responsive Behavior:**
- **Desktop:** 4 columns side-by-side
- **Tablet:** 2 columns, 2 rows
- **Mobile:** Stacked (1 column)

**Accessibility:**
- ARIA landmark: `<footer>` with `role="contentinfo"`
- External links: `aria-label` or `sr-only` text

---

#### Page Container Component

**Layout:**
- **Max width:** 1200px on desktop
- **Centered horizontally** (`margin: 0 auto`)
- **Responsive padding:**
  - Mobile: 16px left/right
  - Tablet: 24px left/right
  - Desktop: 32px left/right

**Variants:**
- Full-width (no max-width)
- Narrow (800px max-width for article pages)

---

#### Bottom Navigation Component (Mobile Only)

**Layout:**
- **Fixed at bottom** on mobile only (< 768px)
- **4-5 main navigation items:**
  - Home (house icon)
  - Explore (compass icon)
  - Messages (chat icon)
  - Profile (user icon)
  - Menu (more icon)
- **Active indicator:** Filled icon + primary colour text
- **Height:** 56px (minimum touch target)

**Accessibility:**
- Each item ≥44px touch target
- ARIA labels on icons
- Active state: `aria-current="page"`

---

#### Sidebar Component

**Layout:**
- **Width:** 30% on desktop, full-width on mobile
- **Collapsible** on mobile (hamburger toggle)
- **Sticky positioning** (optional, scrolls with content)
- **Content:** Contact info, business hours, promotions, related links

**Responsive Behavior:**
- **Desktop:** Fixed 30% width, right or left side
- **Tablet:** 40% width or full-width toggle
- **Mobile:** Off-canvas (slide in from left/right)

---

#### Grid System Component

**Layout:**
- **12-column grid** (CSS Grid or Tailwind utilities)
- **Responsive columns:**
  - Mobile: 1 column (full-width)
  - Tablet: 2-3 columns
  - Desktop: 3-4 columns (up to 12)
- **Gutters:**
  - Mobile: 16px
  - Tablet/Desktop: 24px

**Variants:**
- Equal-width columns
- Asymmetric columns (e.g., 2/3 + 1/3)
- Auto-fit (fill available space)

---

**Tasks:**
1. Create Header component (logo, nav, language selector, CTA)
2. Create Footer component (links, socials, partners, copyright)
3. Create Page Container with responsive max-width
4. Create Bottom Navigation component (mobile-only)
5. Create Sidebar component (collapsible)
6. Create 12-column Grid system

---

### 3.2.2 Form Components (10 tasks)

**Reference:** Section 7.1.2 (Form Field States), Section 7.5.1+

#### Button Component

**Already Implemented:** Basic button in Phase 1.4 (`packages/frontend/src/components/ui/Button.tsx`)

**Enhancements Needed:**
- All states: Default, Hover, Active, Focus, Disabled, Loading
- Loading state: Replace text with spinner + "Loading..." text
- Icon support (left/right icon)
- Full-width variant

---

#### Input Field Component

**States:**
- **Default:** 1px border #CCCCCC
- **Hover:** 1px border #999999
- **Focus:** 2px border primary colour, remove outline
- **Error:** 2px border #E74C3C + red error message below
- **Disabled:** #F5F5F5 background, 50% opacity
- **Read-only:** #F5F5F5 background, no border

**Features:**
- Floating label (optional)
- Placeholder text
- Required indicator (*)
- Character counter (optional)
- Error message display
- Icon support (left/right)

**Validation:**
- Required, email, URL, pattern matching
- Real-time validation (on blur or on change)
- Error message association (`aria-describedby`)

---

#### Textarea Component

**States:** Same as Input Field

**Features:**
- Auto-expanding height (grows as content increases)
- Character counter
- Max character limit enforcement
- Minimum 3 rows on mobile
- Resize: vertical only

---

#### Select/Dropdown Component

**States:**
- **Closed:** Default button appearance
- **Open:** Dropdown panel below (or above if space)
- **Hover (item):** #F5F5F5 background
- **Selected:** Primary colour background (10% opacity) + primary text
- **Focus:** Visible outline on trigger button

**Layout:**
- **Trigger:** Click to open
- **Container:** White, 4px radius, shadow `0 4px 8px rgba(0,0,0,0.15)`
- **Item height:** 40px
- **Item padding:** 12px 16px
- **Dividers:** 1px #EEEEEE between items
- **Max height:** 300px with scroll

**Responsive:**
- **Mobile:** Native `<select>` on touch devices for better UX
- **Desktop:** Custom styled dropdown

**Accessibility:**
- Keyboard navigation: Arrow keys, Enter, Escape
- ARIA: `role="combobox"`, `aria-expanded`, `aria-controls`

---

#### Checkbox Component

**States:**
- **Unchecked:** 1px border #CCCCCC
- **Checked:** Primary colour fill + white checkmark (✓)
- **Indeterminate:** Primary colour fill + white dash (–)
- **Disabled:** 50% opacity
- **Focus:** Visible outline (2px primary colour)

**Size:**
- **Box:** 18px × 18px
- **Touch target:** 44px × 44px (padding around box)

**Accessibility:**
- ARIA: `role="checkbox"`, `aria-checked="true|false|mixed"`
- Keyboard: Space to toggle

---

#### Radio Button Component

**States:**
- **Unchecked:** 1px border #CCCCCC (circle)
- **Checked:** Primary colour ring + filled circle inside
- **Disabled:** 50% opacity
- **Focus:** Visible outline (2px primary colour)

**Size:**
- **Circle:** 18px × 18px
- **Touch target:** 44px × 44px (padding around circle)

**Accessibility:**
- ARIA: `role="radio"`, `aria-checked="true|false"`
- Keyboard: Arrow keys to navigate group, Space to select

---

#### Toggle/Switch Component

**States:**
- **Off:** Background #CCCCCC, knob on left
- **On:** Background primary colour, knob on right
- **Disabled:** 50% opacity

**Size:**
- **Track:** 44px × 24px (accessible touch target)
- **Knob:** 20px diameter, white

**Animation:**
- Transition: 200ms smooth (knob movement + background colour)

**Accessibility:**
- ARIA: `role="switch"`, `aria-checked="true|false"`
- Keyboard: Space to toggle

---

#### Date Picker Component

**Layout:**
- **Calendar view:** Month grid (7 columns × ~5 rows)
- **Header:** Month/year + navigation arrows (previous/next month)
- **Today:** Highlighted with border or background
- **Selected date:** Primary colour background + white text
- **Range selection:** Two calendars side-by-side for date ranges

**Responsive:**
- **Mobile:** Native `<input type="date">` on touch devices
- **Desktop:** Custom calendar component

**Accessibility:**
- Keyboard navigation: Arrow keys (day), Page Up/Down (month), Home/End (week)
- ARIA: `role="dialog"`, `aria-label="Choose date"`

---

#### Time Picker Component

**Layout:**
- **Dropdowns:** Hour, Minute (15-minute increments)
- **Optional:** Seconds dropdown
- **Meridiem:** AM/PM selector (12-hour format)

**Responsive:**
- **Mobile:** Native `<input type="time">` on touch devices
- **Desktop:** Custom dropdowns

**Accessibility:**
- Keyboard navigation: Arrow keys, Tab
- ARIA: `role="combobox"` on each dropdown

---

#### File Upload Component

**States:**
- **Default:** Dashed border box, "Drag files or click to upload" text + upload icon
- **Drag over:** Highlighted border (primary colour), "Drop files here" text
- **Uploading:** Progress bar, filename, cancel button
- **Complete:** Thumbnail (images), file icon (docs), filename, remove button
- **Error:** Red border + error message

**Features:**
- Multiple file support
- File type validation (accept attribute)
- File size validation (max size)
- Preview for images
- Remove uploaded file

**Accessibility:**
- Hidden `<input type="file">` with accessible label
- Keyboard: Tab to button, Enter to open file picker
- ARIA: `aria-label="Upload file"`

---

**Tasks:**
1. Create Button component (all states) - ENHANCE EXISTING
2. Create Input field component (validation states)
3. Create Textarea component (auto-expanding)
4. Create Select/Dropdown component (mobile-aware)
5. Create Checkbox component (all states)
6. Create Radio button component
7. Create Toggle/Switch component
8. Create Date picker component
9. Create Time picker component
10. Create File upload component

---

### 3.2.3 Display Components (14 tasks)

**Reference:** Section 7.2-7.5

#### Card Component

**Already Implemented:** Basic card in Phase 1.4 (`packages/frontend/src/components/ui/Card.tsx`)

**Enhancements Needed:**
- **States:** Default, Hover, Active/Selected, Loading, Disabled
- **Hover effect:** Shadow increase + lift (`transform: translateY(-2px)`)
- **Loading state:** Skeleton loader overlay
- **Disabled state:** 50% opacity, no hover
- **Variants:** Elevated (more shadow), Flat (no shadow), Outlined (border instead of shadow)

**Specifications:**
- Border-radius: 8px
- Default shadow: `0 2px 4px rgba(0,0,0,0.1)`
- Hover shadow: `0 4px 8px rgba(0,0,0,0.15)`
- Padding: 16px
- Background: White

---

#### Modal/Dialog Component

**Layout:**
- **Overlay:** `rgba(0,0,0,0.5)`, click outside to close (optional)
- **Container:** White, 8px radius, shadow `0 8px 16px rgba(0,0,0,0.2)`
- **Sizes:** 480px (small), 640px (medium), 800px (large)
- **Padding:** 24px
- **Header:** Title (H3) + close button (X icon, top-right)
- **Body:** Scrollable content area
- **Footer:** Action buttons (Cancel, Confirm), right-aligned

**Animation:**
- **Open:** Fade in overlay (200ms) + scale up modal (0.95 → 1, 300ms)
- **Close:** Reverse animation

**Responsive:**
- **Mobile (< 480px):** Full screen modal (100vw × 100vh)
- **Tablet/Desktop:** Fixed width, vertically centered

**Accessibility:**
- Focus trap (Tab cycles within modal)
- Escape key to close
- ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="title"`
- Focus on first focusable element when opened
- Return focus to trigger element when closed

---

#### Toast/Notification Component

**Layout:**
- **Position:** Bottom center (mobile), bottom right (desktop)
- **Width:** Auto, max 400px
- **Padding:** 12px 16px
- **Border-radius:** 4px
- **Background:**
  - Info: Dark (#333)
  - Success: Green (#27AE60)
  - Error: Red (#E74C3C)
  - Warning: Orange (#E67E22)
- **Text:** White, 14px
- **Duration:** 4 seconds (auto-dismiss), closeable

**Animation:**
- **Enter:** Slide up + fade in (300ms)
- **Exit:** Fade out (300ms)

**Stacking:**
- Max 3 visible toasts
- Newest on top
- Older toasts dismissed automatically

**Accessibility:**
- ARIA: `role="alert"` or `role="status"` (depends on urgency)
- `aria-live="assertive"` (errors) or `aria-live="polite"` (info)

---

#### Alert/Banner Component

**Types:**
- **Critical (Red):** Urgent, requires immediate attention
- **Warning (Orange):** Important, action recommended
- **Advisory (Yellow):** Informational, no action required
- **Info (Blue):** General information

**Layout:**
- **Full-width** or **container-width** (configurable)
- **Padding:** 16px
- **Border-left:** 4px solid (alert colour)
- **Icon:** Alert type icon on left (error, warning, info, check)
- **Text:** Heading (bold) + body text
- **Close button:** X icon on right (optional)
- **Action button:** Optional CTA button

**Accessibility:**
- ARIA: `role="alert"` (critical/warning), `role="status"` (info)
- `aria-live="assertive"` or `aria-live="polite"`

---

#### Badge Component

**Types:**
1. **Count Badge:** Circle, 18px min diameter, red background, white text (e.g., "3")
2. **Status Badge:** Pill shape, 24px height, semantic colour (e.g., "Open", "Closed")
3. **Tag Badge:** Rounded rect, 28px height, neutral colour (e.g., category tags)

**Sizes:**
- Small: 18px height
- Medium: 24px height
- Large: 32px height

**Colours:**
- **Count:** Red background
- **Status:** Semantic colours (green=open, red=closed, orange=busy)
- **Tag:** Neutral (#EEEEEE background, dark text)

---

#### Avatar Component

**Layout:**
- **Shape:** Circular or square (configurable)
- **Size options:** 24px, 32px, 48px, 64px, 128px
- **Photo:** User uploaded image
- **Initials fallback:** User's first + last initial (e.g., "JD")
- **Default placeholder:** Generic user icon
- **Active/offline indicator:** Small dot (green=online, grey=offline) in bottom-right

**Accessibility:**
- `alt` text: User's full name
- ARIA: `role="img"`, `aria-label="User avatar"`

---

#### Icon System

**Icon Library:**
- Consistent icon library: Material Design, Font Awesome, Heroicons, or custom SVG
- Icon format: SVG (scalable, accessible)

**Sizes:**
- 16px (small, inline with text)
- 24px (default, buttons, navigation)
- 32px (large, feature icons)
- 48px (hero icons)

**Colours:**
- Inherit from context (currentColor) by default
- Semantic colours (error, success, warning, info)

**RTL Support:**
- Directional icons (arrows, back/forward) must mirror in RTL languages
- Use CSS `transform: scaleX(-1)` or separate RTL icons

**Accessibility:**
- Decorative icons: `aria-hidden="true"`
- Functional icons: `aria-label` or adjacent screen-reader-only text

---

#### Loading Spinner

**Already Implemented:** Basic spinner in Phase 1.4 (`packages/frontend/src/components/ui/Spinner.tsx`)

**Enhancements Needed:**
- **Sizes:** Small (16px), Medium (24px), Large (32px)
- **Colours:** Primary colour (default), white (on dark backgrounds)
- **Animation:** Smooth rotation (1s linear infinite)
- **Text:** Optional "Loading..." text below spinner

**Accessibility:**
- ARIA: `role="status"`, `aria-label="Loading"`
- Screen reader announcement when loading starts

---

#### Skeleton Loaders

**Purpose:** Placeholder animations while content loads

**Types:**
1. **Business Card Skeleton:**
   - Grey rect for image (150px × 150px)
   - 3 text lines (varying widths: 80%, 60%, 40%)
2. **Profile Skeleton:**
   - Header block (avatar + name line)
   - Content blocks (3-4 lines)
3. **List Item Skeleton:**
   - Single line with avatar/icon on left

**Animation:**
- **Shimmer effect:** Gradient moving left-to-right (or pulse)
- **CSS:** `@keyframes shimmer { 0% { background-position: -100%; } 100% { background-position: 100%; } }`
- **Duration:** 1.5s linear infinite

**Colours:**
- Base: #EEEEEE
- Shimmer: Linear gradient (transparent → white → transparent)

---

#### Empty State Component

**Layout:**
- **Illustration:** 120px × 120px (optional, SVG or image)
- **Headline:** H3, center-aligned (e.g., "No businesses found")
- **Subtext:** Body text, muted colour, center-aligned (e.g., "Try adjusting your filters")
- **Primary action button:** (e.g., "Clear Filters", "Add Business")
- **Secondary text link:** (optional, e.g., "Learn more")

**Examples:**
- "No saved businesses yet"
- "No upcoming events"
- "No messages"
- "Search returned no results"

**Accessibility:**
- Clear, helpful messaging
- Actionable next steps

---

#### Pagination Component

**Layout:**
- **Previous/Next buttons:** Arrows, disabled on first/last page
- **Page numbers:** Show 5 adjacent pages (e.g., 1 ... 8 9 [10] 11 12 ... 20)
- **Current page:** Primary colour background, white text
- **Inactive pages:** Clickable, neutral colour
- **Jump to page input:** (optional) Small input field + "Go" button
- **Results per page selector:** Dropdown (10, 25, 50, 100)

**Responsive:**
- **Mobile:** Show Previous/Next + current page only
- **Tablet/Desktop:** Full page number list

**Accessibility:**
- ARIA: `role="navigation"`, `aria-label="Pagination"`
- Current page: `aria-current="page"`
- Disabled buttons: `aria-disabled="true"` + no click handler

---

#### Tabs Component

**Layout:**
- **Container:** Border-bottom 1px #EEEEEE
- **Tab button:** Height 48px, padding 0 16px
- **Active tab:** Primary colour text + 2px bottom border (primary colour)
- **Inactive tab:** Muted text (#7F8C8D)
- **Hover:** Slight background highlight (#F5F5F5)

**Responsive:**
- **Mobile:** Scrollable horizontal tabs if many tabs (horizontal scroll, no wrap)
- **Desktop:** Full-width tabs or centered

**Accessibility:**
- ARIA: `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Keyboard: Arrow keys to navigate tabs, Enter to activate
- Active tab: `aria-selected="true"`, `tabindex="0"`
- Inactive tabs: `aria-selected="false"`, `tabindex="-1"`

---

#### Accordion/Collapsible Component

**Layout:**
- **Header:** Height 48px minimum, padding 16px, clickable area
- **Icon:** Chevron (right when collapsed, down when expanded) on left or right
- **Content:** Padding 16px, smooth height transition (200ms)
- **Borders:** 1px #EEEEEE between items

**States:**
- **Collapsed:** Content hidden, chevron right
- **Expanded:** Content visible, chevron down

**Variants:**
- Single expand (only one item open at a time)
- Multiple expand (multiple items open simultaneously)

**Accessibility:**
- ARIA: `role="button"` on header, `aria-expanded="true|false"`, `aria-controls="content-id"`
- Keyboard: Enter/Space to toggle
- Focus visible on header

---

#### Carousel/Slider Component

**Layout:**
- **Horizontal scroll:** Images/cards displayed in row
- **Thumbnail navigation dots:** Below carousel, one dot per slide
- **Previous/Next arrows:** On hover (desktop), always visible (mobile)
- **Auto-play:** (optional) Auto-advance every 5 seconds
- **Swipe gesture:** Swipe left/right on touch devices

**Responsive:**
- **Mobile:** 1 item visible, swipe to navigate
- **Tablet:** 2-3 items visible
- **Desktop:** 3-4 items visible

**Accessibility:**
- Keyboard: Arrow keys to navigate slides
- ARIA: `role="region"`, `aria-label="Carousel"`, `aria-live="polite"` (auto-play)
- Pause button for auto-play (accessibility requirement)

---

#### Image Gallery Component

**Layout:**
- **Grid layout:** Responsive columns (1 on mobile, 3-4 on desktop)
- **Lightbox/fullscreen view:** Click image to open fullscreen
- **Lightbox controls:** Previous/Next arrows, close button, zoom controls
- **Photo captions:** (optional) Display below image in lightbox
- **Category filtering:** (optional) Filter by category tags

**Navigation:**
- **Keyboard:** Arrow keys to navigate images in lightbox
- **Touch:** Swipe left/right on mobile
- **Close:** Escape key or click outside

**Accessibility:**
- ARIA: `role="dialog"` on lightbox, `aria-modal="true"`
- Focus trap in lightbox
- Return focus to thumbnail when closed

---

**Tasks:**
1. Create Card component - ENHANCE EXISTING
2. Create Modal/Dialog component
3. Create Toast/Notification component
4. Create Alert/Banner component
5. Create Badge component
6. Create Avatar component
7. Create Icon system
8. Create Loading Spinner - ENHANCE EXISTING
9. Create Skeleton loaders
10. Create Empty state component
11. Create Pagination component
12. Create Tabs component
13. Create Accordion/Collapsible component
14. Create Carousel/Image gallery components

---

## Subsection 3.3: Accessibility

**Specification Reference:** Section 3.6 (Accessibility), Section 30.1 (Accessibility Testing)

**Goal:** Ensure WCAG 2.1 AA compliance across all components

### WCAG 2.1 AA Requirements (9 tasks)

#### 1. Skip to Main Content Link

**Purpose:** Allow keyboard users to skip repetitive navigation

**Implementation:**
- Anchor link at very beginning of page: `<a href="#main-content">Skip to main content</a>`
- Hidden by default: `position: absolute; left: -9999px;`
- Visible on focus: `position: static; left: 0;`
- Links to main content: `<main id="main-content">`
- Clear text: "Skip to main content" or "Skip navigation"

**Already Implemented:** Phase 1.4 (`packages/frontend/src/components/ui/SkipLink.tsx`)

---

#### 2. Visible Focus Indicators

**Purpose:** Show keyboard users where focus is

**Requirements:**
- All interactive elements have visible focus outline
- Minimum 2px solid outline in primary colour
- Offset: 2px from element (not flush with border)
- High contrast against background (4.5:1 minimum)
- Applies to: Buttons, links, form fields, tabs, custom controls

**Implementation:**
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**Testing:**
- Tab through all interactive elements
- Verify focus visible on every element

---

#### 3. Screen Reader Announcements (ARIA-Live)

**Purpose:** Announce dynamic content updates to screen reader users

**ARIA Live Regions:**
- `aria-live="polite"` - Announce when user is idle (most updates)
- `aria-live="assertive"` - Announce immediately (errors, urgent alerts)

**Where to Use:**
- Search results loaded: `<div aria-live="polite">50 businesses found</div>`
- Form validation errors: `<div role="alert">Please enter a valid email</div>`
- Toast notifications: `<div role="status" aria-live="polite">...</div>`
- Dynamic content updates (messages, notifications)

**Landmark Regions:**
- `<header>` with `role="banner"`
- `<nav>` with `role="navigation"`, `aria-label="Main"`
- `<main>` with `role="main"`
- `<aside>` with `role="complementary"`
- `<footer>` with `role="contentinfo"`

**ARIA Labels:**
- `aria-label` - Direct label text
- `aria-labelledby` - Reference to element ID with label
- `aria-describedby` - Reference to element ID with description (errors, hints)

---

#### 4. Full Keyboard Navigation

**Purpose:** Ensure all functionality accessible without mouse

**Requirements:**
- **Tab order:** Logical and predictable (left-to-right, top-to-bottom)
- **No keyboard traps:** Every focusable element can be navigated away from
- **Custom controls:** Implement arrow keys, Enter, Space, Escape where expected
- **Keyboard shortcuts:** (optional) Documented and accessible

**Common Patterns:**
- **Dropdowns:** Arrow keys to navigate options, Enter to select, Escape to close
- **Tabs:** Arrow keys to navigate tabs, Enter to activate
- **Modals:** Tab cycles within modal, Escape to close
- **Carousels:** Arrow keys to navigate slides

**Testing:**
- Unplug mouse
- Navigate entire site with keyboard only
- Verify all actions possible (open modals, submit forms, navigate menus)

---

#### 5. Colour Contrast Verification

**Purpose:** Ensure text and UI elements readable for users with low vision

**WCAG 2.1 AA Requirements:**
- **Normal text (< 18px or < 14px bold):** 4.5:1 contrast ratio minimum
- **Large text (≥ 18px or ≥ 14px bold):** 3:1 contrast ratio minimum
- **UI components and graphical elements:** 3:1 contrast ratio minimum
  - Includes: Form borders, icons, focus indicators

**Testing Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element → Accessibility panel
- axe DevTools: Browser extension

**Testing Process:**
1. Identify all colour combinations in design system
2. Test each combination with contrast checker
3. Fix failing combinations (darken text or lighten background)
4. Re-test

**Common Failures:**
- Light grey text on white background (7F8C8D on FFFFFF = 4.4:1 FAIL)
- Yellow text on white background
- Disabled state text (may need exception if truly disabled)

---

#### 6. Alt Text Enforcement

**Purpose:** Provide text alternatives for images

**Requirements:**
- **All images require alt text** (`alt=""` for decorative)
- **Decorative images:** `alt=""` (empty string, screen reader skips)
- **Functional images:** Describe purpose (e.g., "Community Hub logo", "Search button")
- **Complex images:** Detailed description (graphs, charts, maps)
- **Icons in buttons:** Icon + alt text or `aria-label`

**Examples:**
```html
<!-- Logo -->
<img src="logo.png" alt="Community Hub logo" />

<!-- Decorative -->
<img src="pattern.png" alt="" />

<!-- Functional -->
<button>
  <img src="search-icon.svg" alt="Search" />
</button>

<!-- Complex -->
<img src="chart.png" alt="Bar chart showing business growth: 2023: 50, 2024: 75, 2025: 100" />
```

**Testing:**
- Screen reader: NVDA, JAWS, VoiceOver
- Verify alt text read aloud for all images

---

#### 7. Form Label Associations

**Purpose:** Ensure all form fields have accessible labels

**Requirements:**
- Every form field has `<label>` tag
- `<label for="fieldId">` matches `<input id="fieldId">`
- No placeholder-only labels (placeholder is a hint, not a label)
- Required field indicator: `aria-required="true"` or `*` in label
- Error messages associated with field: `aria-describedby="errorId"`

**Examples:**
```html
<!-- Correct -->
<label for="email">Email address *</label>
<input type="email" id="email" aria-required="true" aria-describedby="email-error" />
<div id="email-error" role="alert">Please enter a valid email</div>

<!-- Incorrect -->
<input type="email" placeholder="Email address" />
```

**Already Implemented:** Phase 1.4 FormField component has label association

---

#### 8. Error Message Accessibility

**Purpose:** Ensure users understand form errors and how to fix them

**Requirements:**
- Error messages clearly associated with field (`aria-describedby`)
- Error list at top of form (if multiple errors)
- Icons: Use colour + icon (not colour alone)
- Text: Clear, specific guidance on fixing (not just "Invalid")
- Focus: Move focus to first error on submit

**Examples:**
```html
<!-- Field-level error -->
<label for="password">Password</label>
<input type="password" id="password" aria-describedby="password-error" aria-invalid="true" />
<div id="password-error" role="alert">Password must be at least 8 characters</div>

<!-- Form-level error summary -->
<div role="alert" aria-live="assertive">
  <h2>Please fix the following errors:</h2>
  <ul>
    <li><a href="#email">Email address is required</a></li>
    <li><a href="#password">Password must be at least 8 characters</a></li>
  </ul>
</div>
```

---

#### 9. Touch Target Sizing

**Purpose:** Ensure touch targets large enough for mobile users

**WCAG 2.1 AA Requirement:**
- Minimum **44px × 44px** touch target (WCAG 2.5.5 Level AAA, but recommended for mobile-first design)
- Minimum **8px spacing** between touch targets

**Applies to:**
- Buttons
- Links (standalone, not inline)
- Form fields (tap to focus)
- Custom controls (checkboxes, radio buttons, toggles, dropdowns)
- Navigation items

**Implementation:**
- Use padding to increase touch target size (visual size can be smaller)
- Test on real mobile devices (not just emulators)

**Example:**
```css
/* Visual size 18px, touch target 44px */
.checkbox {
  width: 18px;
  height: 18px;
  padding: 13px; /* (44 - 18) / 2 = 13 */
}
```

---

### Accessibility Testing Strategy

**Automated Testing:**
- **jest-axe:** Unit/component tests (add to all component tests)
- **axe DevTools:** Chrome extension (scan pages manually)
- **WAVE:** Browser plugin (visual feedback)
- **Lighthouse:** Accessibility audit (CI/CD integration)

**Manual Testing:**
- **Keyboard-only navigation:** Unplug mouse, navigate site
- **Screen reader testing:**
  - NVDA (Windows, free)
  - JAWS (Windows, paid)
  - VoiceOver (Mac/iOS, built-in)
  - TalkBack (Android, built-in)
- **Colour contrast verification:** WebAIM Contrast Checker
- **Focus indicator visibility:** Tab through all elements
- **Zoom testing:** 200% magnification (WCAG 1.4.4)

**Device Testing:**
- Mobile touch devices (iOS, Android)
- Tablets
- Desktop with keyboard
- Screen readers on iOS/Android/Mac

---

### Component-Level Accessibility Checklist

For **ALL components**, verify:
- [ ] Keyboard navigable (Tab, arrows, Enter, Space, Escape)
- [ ] Focus indicators visible (2px outline, 2px offset, 4.5:1 contrast)
- [ ] ARIA labels/descriptions where needed
- [ ] Tested with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Colour contrast ≥ 4.5:1 on text (3:1 on UI elements)
- [ ] Touch targets ≥ 44px for mobile
- [ ] No reliance on colour alone (use icons + text)
- [ ] Error messages associated with fields (`aria-describedby`)
- [ ] Responsive at 200% zoom (WCAG 1.4.4)
- [ ] Automated tests with jest-axe passing

---

**Tasks:**
1. Implement Skip to main content link - ALREADY DONE (Phase 1.4)
2. Ensure visible focus indicators on all interactive elements
3. Add screen reader announcements (ARIA-live regions)
4. Verify full keyboard navigation (no keyboard traps)
5. Test and fix colour contrast issues (4.5:1 minimum)
6. Enforce alt text on all images
7. Ensure form label associations (label + aria-describedby)
8. Implement accessible error messages
9. Verify touch target sizing (44px minimum)

---

## Dependencies & Blockers

### What Phase 3 Depends On

1. **Phase 1.4 (Frontend Infrastructure)** ✅ COMPLETE
   - Tailwind CSS 4 configured
   - Design tokens system ready (`packages/frontend/src/styles/design-tokens.css`)
   - PWA manifest, service worker
   - Build optimization in place
   - 5 base components: Button, Card, FormField, SkipLink, Spinner

2. **Phase 1.8 (i18n Foundation)** ✅ COMPLETE
   - Translation infrastructure ready (i18next)
   - RTL support scaffolding
   - Language switching hook (`useLanguage`)
   - 10 languages configured

### What Depends on Phase 3

1. **Phase 4 (Business Directory Core)** - BLOCKED until Phase 3 complete
   - Needs business cards, grids, filters, maps, modals
2. **Phase 5+ (All feature phases)** - Use Phase 3 components
   - Events, messaging, deals, reviews, admin, etc.
3. **Frontend development** - Cannot build UI without component library

### Can Run in Parallel

- **Phase 2 (Authentication & User System)** - Can run parallel to Phase 3
  - Phase 2 uses Phase 3 components once available
  - Auth forms can use temporary/basic components initially

---

## Data Models & API Endpoints

### Data Models (from Appendix A)

Phase 3 is primarily frontend/design focused and has **NO database models**. However, it uses configuration data:

**From `config/platform.json`:**
- `branding.colors` - RGB/hex values for all colour tokens
- `branding.logos` - SVG/PNG paths for branding (header, footer, favicon)
- `branding.socialHashtags` - Community social media hashtags
- `location.name` - Community name (e.g., "Guildford South")
- `location.coordinates` - Latitude/longitude for map center

---

### API Endpoints (from Appendix B)

Phase 3 has **NO new API endpoints**. It uses existing endpoints from earlier phases:

- `GET /api/v1/config` (Phase 1.3) - Returns platform configuration including colours, logos, branding

---

## Files to Create

### Component Files (Frontend)

```
packages/frontend/src/components/
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PageContainer.tsx
│   ├── BottomNavigation.tsx
│   ├── Sidebar.tsx
│   └── Grid.tsx
├── form/
│   ├── Button.tsx (ENHANCE EXISTING)
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── RadioButton.tsx
│   ├── Toggle.tsx
│   ├── DatePicker.tsx
│   ├── TimePicker.tsx
│   └── FileUpload.tsx
├── display/
│   ├── Card.tsx (ENHANCE EXISTING)
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Alert.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Icon.tsx
│   ├── Spinner.tsx (ENHANCE EXISTING)
│   ├── Skeleton.tsx
│   ├── EmptyState.tsx
│   ├── Pagination.tsx
│   ├── Tabs.tsx
│   ├── Accordion.tsx
│   └── Carousel.tsx
├── styles/
│   ├── animations.css
│   ├── transitions.css
│   └── utilities.css
└── __tests__/
    ├── layout/
    ├── form/
    ├── display/
    └── [component tests with jest-axe]
```

### Styles/Theme Files

```
packages/frontend/src/styles/
├── design-system.css (colour system, typography system)
├── typography.css (H1-H6, body, font loading)
├── colours.css (CSS custom properties)
├── spacing.css (margin, padding utilities)
├── shadows.css (box-shadow utilities)
├── animations.css (keyframe animations)
└── accessibility.css (focus indicators, skip links)
```

### Test Files

```
packages/frontend/src/__tests__/
├── layout/
│   ├── Header.test.tsx
│   ├── Footer.test.tsx
│   ├── PageContainer.test.tsx
│   ├── BottomNavigation.test.tsx
│   ├── Sidebar.test.tsx
│   └── Grid.test.tsx
├── form/
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── Textarea.test.tsx
│   ├── Select.test.tsx
│   ├── Checkbox.test.tsx
│   ├── RadioButton.test.tsx
│   ├── Toggle.test.tsx
│   ├── DatePicker.test.tsx
│   ├── TimePicker.test.tsx
│   └── FileUpload.test.tsx
└── display/
    ├── Card.test.tsx
    ├── Modal.test.tsx
    ├── Toast.test.tsx
    ├── Alert.test.tsx
    ├── Badge.test.tsx
    ├── Avatar.test.tsx
    ├── Icon.test.tsx
    ├── Spinner.test.tsx
    ├── Skeleton.test.tsx
    ├── EmptyState.test.tsx
    ├── Pagination.test.tsx
    ├── Tabs.test.tsx
    ├── Accordion.test.tsx
    └── Carousel.test.tsx
```

---

## Success Criteria

Phase 3 is considered complete when:

1. ✅ **All 40 tasks completed** (12 design system + 24 components + 9 accessibility)
2. ✅ **Component library published** (Storybook or documentation site)
3. ✅ **100% keyboard navigable** across all components
4. ✅ **WCAG 2.1 AA compliance** verified with axe-core (zero violations)
5. ✅ **Accessibility tests passing** (jest-axe on all components)
6. ✅ **Responsive design** verified at mobile (< 768px), tablet (768-1199px), desktop (≥ 1200px)
7. ✅ **Touch targets ≥ 44px** on all interactive elements
8. ✅ **Colour contrast ≥ 4.5:1** verified on all text (3:1 on UI elements)
9. ✅ **Screen reader tested** with NVDA/JAWS/VoiceOver
10. ✅ **Zero console errors** in browser DevTools

### Quality Metrics

- **Test Coverage:** > 80% (all components)
- **Accessibility Score:** 100% on Lighthouse
- **Performance:** < 100ms component render time
- **Bundle Size:** < 150KB gzipped (component library)

---

## Timeline Estimate

**Total Effort:** 80-100 hours (2-3 weeks for 1 developer)

### Breakdown:
- **Design System (3.1):** 15-20 hours
  - Colour system: 5 hours
  - Typography: 6 hours
  - Component specs: 4 hours
- **UI Components (3.2):** 50-70 hours
  - Layout components: 12 hours
  - Form components: 20 hours
  - Display components: 25 hours
- **Accessibility (3.3):** 15-20 hours
  - Implement features: 8 hours
  - Testing & remediation: 10 hours

**Parallel Work Opportunity:**
Phase 3 can run in parallel with Phase 2 (Authentication), which would reduce total calendar time.

---

## Key Specification Sections

| Section | Content | Reference (Line Numbers) |
|---------|---------|-----------|
| **§3.6** | Accessibility (WCAG 2.1 AA) | Lines 639-651 |
| **§6** | Design Specifications | Lines 966-1095 |
| **§6.1** | Colour Palette | Lines 968-981 |
| **§6.2** | Typography | Lines 982-993 |
| **§6.3** | Component Specifications | Lines 994-1024 |
| **§6.4** | Page Layouts | Lines 1025-1086 |
| **§6.5** | Alert Colours | Lines 1087-1095 |
| **§7** | UI States & Components | Lines 1098-1411 |
| **§7.1** | Component States | Lines 1100-1134 |
| **§7.2** | Loading States | Lines 1135-1176 |
| **§7.3** | Empty States | Lines 1177-1220 |
| **§7.4** | Error States | Lines 1221-1253 |
| **§7.5** | Additional Components | Lines 1254-1378 |
| **§7.6** | Animation & Transitions | Lines 1379-1410 |
| **§30.1** | Accessibility Testing | Lines 3537-3559 |

---

## Additional Context

### Already Implemented from Phase 1.4

The following foundational work is already complete:

- ✅ 5 base components:
  - `Button.tsx` - Basic button (needs enhancements)
  - `Card.tsx` - Basic card (needs enhancements)
  - `FormField.tsx` - Label + input wrapper with aria-describedby
  - `SkipLink.tsx` - Skip to main content link (accessibility)
  - `Spinner.tsx` - Basic loading spinner (needs enhancements)
- ✅ Tailwind CSS 4 with design tokens
- ✅ PWA manifest
- ✅ Service worker
- ✅ Responsive breakpoints (mobile, tablet, desktop)
- ✅ Mobile-first approach
- ✅ Base accessibility features

**Files:**
- `packages/frontend/src/components/ui/Button.tsx`
- `packages/frontend/src/components/ui/Card.tsx`
- `packages/frontend/src/components/ui/FormField.tsx`
- `packages/frontend/src/components/ui/SkipLink.tsx`
- `packages/frontend/src/components/ui/Spinner.tsx`
- `packages/frontend/src/styles/design-tokens.css`

---

### Deferred from Phase 1.4 (Now Phase 3 Tasks)

These tasks were originally planned for Phase 1.4 but deferred to Phase 3:

- [ ] Build full component library (Storybook documentation deferred)
- [ ] Create language selector UI component (hook done, UI needed)
- [ ] Comprehensive accessibility testing suite

---

### Location-Agnostic Configuration

**CRITICAL:** All colours, logos, and branding must come from `config/platform.json`.

**Example `config/platform.json`:**
```json
{
  "location": {
    "name": "Guildford South",
    "coordinates": { "lat": -33.8523, "lng": 150.9896 }
  },
  "branding": {
    "colors": {
      "primary": "#2C5F7C",
      "secondary": "#E67E22",
      "accent": "#F39C12"
    },
    "logos": {
      "header": "/assets/logo-guildford.svg",
      "footer": "/assets/logo-guildford-dark.svg",
      "favicon": "/assets/favicon-guildford.ico"
    },
    "socialHashtags": ["#GuildfordLocal", "#ShopGuildford"]
  }
}
```

**Implementation:**
- Load configuration via `GET /api/v1/config`
- Inject CSS variables at runtime
- Use CSS variables in all components (not hardcoded hex codes)

---

### Multilingual Support

**Languages:** 10 languages supported (Phase 1.8 complete)
- English (en)
- Arabic (ar) - RTL
- Chinese Simplified (zh-Hans)
- Chinese Traditional (zh-Hant)
- Hindi (hi)
- Urdu (ur) - RTL
- Vietnamese (vi)
- Greek (el)
- Italian (it)
- Korean (ko)

**RTL Considerations:**
- Directional icons (arrows, back/forward) must mirror in RTL
- Text alignment: `text-align: start` (not `left`)
- Margin/padding: Use logical properties (`margin-inline-start`, not `margin-left`)
- Test all components in RTL mode

---

### Testing Requirements (from §30.1)

**Automated Testing:**
- **jest-axe:** Add to all component tests
- **axe DevTools:** Chrome extension for manual scanning
- **WAVE:** Browser plugin for visual feedback
- **Lighthouse:** CI/CD integration for accessibility audits

**Manual Testing:**
- **Keyboard-only navigation:** Unplug mouse, navigate entire site
- **Screen reader testing:** NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS), TalkBack (Android)
- **Colour contrast verification:** WebAIM Contrast Checker
- **Focus indicator visibility:** Tab through all elements
- **Zoom testing:** 200% magnification (WCAG 1.4.4)

**Device Testing:**
- Mobile touch devices (iOS, Android)
- Tablets
- Desktop with keyboard
- Screen readers on iOS/Android/Mac

---

### Implementation Strategy

**Recommended Order:**
1. **Design System (3.1)** - Colour, typography, component specs
2. **Layout Components (3.2.1)** - Header, Footer, Page Container, Grid
3. **Form Components (3.2.2)** - Buttons, inputs, dropdowns, checkboxes
4. **Display Components (3.2.3)** - Cards, modals, toasts, badges, etc.
5. **Accessibility (3.3)** - Test and remediate all components

**Parallel Work:**
- Component development can happen in parallel across multiple developers
- Each component can be developed, tested, and merged independently
- Accessibility testing should happen continuously, not just at the end

---

## Summary

Phase 3 is the **visual foundation** of the Community Hub platform. It establishes:

1. **Design System:** Colours, typography, component specifications from configuration
2. **Component Library:** 30+ reusable React components (layout, form, display)
3. **Accessibility:** WCAG 2.1 AA compliance across all components

**Key Principles:**
- **Location-agnostic:** All branding from `config/platform.json`
- **Mobile-first:** Responsive design, touch targets ≥ 44px
- **Accessible:** WCAG 2.1 AA, keyboard navigable, screen reader tested
- **Multilingual:** RTL support, translation-ready

**Blockers:** Phase 4 (Business Directory Core) cannot start until Phase 3 is complete.

**Opportunity:** Phase 3 can run in parallel with Phase 2 (Authentication).

---

**Study Complete:** You now have a comprehensive understanding of Phase 3: Design System & Core Components.
