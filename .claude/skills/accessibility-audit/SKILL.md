---
name: accessibility-audit
description: Audits components and pages for WCAG 2.1 AA compliance. Use when reviewing UI work to ensure keyboard navigation, screen reader support, colour contrast ratios, focus indicators, and touch targets meet accessibility standards.
---

# Accessibility Audit Skill

You are an accessibility expert for the Community Hub platform. Your role is to ensure all user interfaces meet WCAG 2.1 AA compliance standards, which is a hard requirement for this platform.

## WCAG 2.1 AA Requirements

The Web Content Accessibility Guidelines (WCAG) 2.1 Level AA requires compliance with all Level A and AA success criteria.

### Key Principles (POUR)

1. **Perceivable** - Information must be presentable to users
2. **Operable** - Interface components must be operable
3. **Understandable** - Information and operation must be understandable
4. **Robust** - Content must be robust enough for assistive technologies

## Critical Requirements

### 1. Keyboard Navigation (2.1.1, 2.1.2)

**All functionality must be accessible via keyboard alone.**

```tsx
// BAD - Click-only interaction
<div onClick={handleAction}>Click me</div>

// GOOD - Keyboard accessible
<button onClick={handleAction}>Click me</button>

// If you must use a div, add keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
>
  Click me
</div>
```

**Tab Order (2.4.3)**
- Must follow logical reading order
- Use `tabIndex="0"` to add to natural flow
- Use `tabIndex="-1"` for programmatic focus only
- Avoid positive `tabIndex` values

```tsx
// BAD - Breaks natural tab order
<input tabIndex={3} />
<input tabIndex={1} />
<input tabIndex={2} />

// GOOD - Natural DOM order
<input /> {/* tabIndex 0 by default */}
<input />
<input />
```

### 2. Focus Indicators (2.4.7)

**All focusable elements must have visible focus indicators.**

```css
/* Platform requirement: 2px solid ring */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Never remove focus outline without replacement */
/* BAD */
*:focus {
  outline: none;
}

/* GOOD - Replace with custom style */
button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary);
}
```

### 3. Colour Contrast (1.4.3, 1.4.11)

**Text Contrast Requirements:**
- Normal text (< 18px): minimum 4.5:1 ratio
- Large text (≥ 18px or ≥ 14px bold): minimum 3:1 ratio
- UI components and graphical objects: minimum 3:1 ratio

```css
/* Platform colours - verify contrast */
--color-primary: #2C5F7C;    /* Verify against white/black backgrounds */
--color-secondary: #E67E22;  /* Verify against white/black backgrounds */
--color-text-primary: #1F2937;
--color-text-secondary: #6B7280;

/* Error colour - must contrast against background */
--color-error: #DC2626;  /* Red on white = good contrast */
```

**Tools to Check:**
- Browser DevTools (Lighthouse, Accessibility panel)
- WebAIM Contrast Checker
- Colour Contrast Analyzer

### 4. Touch Targets (2.5.5 - Level AAA, but platform requirement)

**Minimum 44x44 pixels for all interactive elements.**

```css
/* Ensure minimum touch target size */
button, a, input, select, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* For small visual elements, use padding */
.icon-button {
  padding: 12px; /* 24px icon + 24px padding = 48px total */
}
```

### 5. Form Labels (1.3.1, 3.3.2)

**All form inputs must have associated labels.**

```tsx
// BAD - No label association
<label>Email</label>
<input type="email" />

// GOOD - Explicit association
<label htmlFor="email-input">Email</label>
<input id="email-input" type="email" />

// GOOD - Implicit association (less robust)
<label>
  Email
  <input type="email" />
</label>

// For hidden labels (icons only)
<label htmlFor="search" className="sr-only">Search</label>
<input id="search" type="search" />
<button aria-label="Submit search">
  <SearchIcon />
</button>
```

### 6. Error Identification (3.3.1, 3.3.3)

**Errors must be clearly identified and described.**

```tsx
// BAD - Error not associated with input
<input type="email" />
<span className="error">Invalid email</span>

// GOOD - Error linked to input
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert" className="error">
    Invalid email format. Please enter a valid email address.
  </span>
)}
```

### 7. Headings Structure (1.3.1, 2.4.6)

**Use proper heading hierarchy.**

```tsx
// BAD - Skipped heading level
<h1>Page Title</h1>
<h3>Section Title</h3>  {/* Skipped h2! */}

// GOOD - Proper hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

// Visual styling should not dictate heading level
<h2 className="text-lg">Small but still h2</h2>
```

### 8. Images and Alt Text (1.1.1)

**All images must have appropriate alt text.**

```tsx
// Informative image
<img src="storefront.jpg" alt="Coffee shop entrance with outdoor seating" />

// Decorative image
<img src="divider.png" alt="" role="presentation" />

// Image with text
<img src="logo.png" alt="Community Hub" />

// Complex image (chart, diagram)
<figure>
  <img src="chart.png" alt="Sales chart" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    Sales increased by 25% from January to March 2026.
  </figcaption>
</figure>
```

### 9. Link Purpose (2.4.4)

**Link text must describe the destination.**

```tsx
// BAD - Unclear link purpose
<a href="/details">Click here</a>
<a href="/business/123">Read more</a>

// GOOD - Descriptive link text
<a href="/details">View business details</a>
<a href="/business/123">Read more about Joe's Coffee Shop</a>

// If context provides meaning, use aria-label for clarity
<article>
  <h2>Joe's Coffee Shop</h2>
  <p>Great coffee and pastries...</p>
  <a href="/business/123" aria-label="Read more about Joe's Coffee Shop">
    Read more
  </a>
</article>
```

### 10. Language (3.1.1, 3.1.2)

**Page language must be programmatically determined.**

```html
<!-- Set page language -->
<html lang="en">

<!-- Mark language changes within content -->
<p>The French word for hello is <span lang="fr">bonjour</span>.</p>
```

### 11. Skip Links (2.4.1)

**Provide mechanism to skip repeated content.**

```tsx
// At top of page
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// Main content area
<main id="main-content" tabIndex={-1}>
  {/* Page content */}
</main>

// CSS
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### 12. Time Limits (2.2.1)

**If content times out, users must be warned and able to extend.**

```tsx
// Session timeout warning
function SessionWarning() {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes warning

  return (
    <div role="alertdialog" aria-labelledby="timeout-title">
      <h2 id="timeout-title">Session Expiring</h2>
      <p>Your session will expire in {formatTime(timeLeft)}.</p>
      <button onClick={extendSession}>Extend Session</button>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```

## Screen Reader Testing

### ARIA Roles and Properties

```tsx
// Navigation landmark
<nav aria-label="Main navigation">
  <ul>...</ul>
</nav>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Alert for important messages
<div role="alert">
  Your changes have been saved.
</div>

// Loading states
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</button>

// Expandable content
<button
  aria-expanded={isOpen}
  aria-controls="dropdown-menu"
>
  Menu
</button>
<ul id="dropdown-menu" hidden={!isOpen}>...</ul>
```

### Screen Reader Only Text

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```tsx
// Usage
<button>
  <HeartIcon />
  <span className="sr-only">Save to favourites</span>
</button>
```

## RTL Accessibility

For Arabic and Urdu users, ensure RTL layout doesn't break accessibility:

```tsx
// Directional icons should flip
<ChevronRightIcon className="rtl:rotate-180" />

// Reading order in flex containers
<div className="flex" dir="rtl">
  {/* Items will flow right-to-left */}
</div>

// Ensure focus order matches visual order
// Test by tabbing through in RTL mode
```

## Audit Checklist

### Automated Testing
- [ ] Run Lighthouse accessibility audit (target: 100)
- [ ] Run axe-core on all pages
- [ ] Validate HTML (no duplicate IDs, proper nesting)

### Keyboard Testing
- [ ] Tab through entire page - logical order?
- [ ] All interactive elements focusable?
- [ ] Focus visible on all elements?
- [ ] Can escape from modals/dropdowns?
- [ ] Skip link works?

### Screen Reader Testing
- [ ] Page title announced correctly?
- [ ] Headings structure makes sense?
- [ ] Images have appropriate alt text?
- [ ] Forms announce labels and errors?
- [ ] Live regions announce updates?
- [ ] Test with NVDA/VoiceOver/JAWS

### Visual Testing
- [ ] Colour contrast passes (4.5:1 text, 3:1 UI)
- [ ] Touch targets ≥ 44px?
- [ ] Text scales to 200% without breaking?
- [ ] Focus indicators visible?
- [ ] No colour-only information?

### Content Testing
- [ ] Link text is descriptive?
- [ ] Error messages are helpful?
- [ ] Instructions don't rely on sensory characteristics?
- [ ] Language is set correctly?

## Report Format

```markdown
## Accessibility Audit Report

**Page/Component:** [Name]
**Date:** [Date]
**Auditor:** Claude

### Summary
- **Pass:** X criteria
- **Fail:** X criteria
- **Needs Review:** X criteria

### Critical Issues (Must Fix)

#### Issue 1: [WCAG Criterion]
- **Element:** [Selector or description]
- **Problem:** [Description]
- **Impact:** [Who is affected and how]
- **Fix:** [Specific remediation]

### Warnings (Should Fix)

#### Warning 1: [WCAG Criterion]
- **Element:** [Selector or description]
- **Problem:** [Description]
- **Recommendation:** [Suggested improvement]

### Recommendations

- [General improvements]

### Testing Notes

- Tested with: [Tools/browsers/assistive tech]
- [Any edge cases or limitations]
```
