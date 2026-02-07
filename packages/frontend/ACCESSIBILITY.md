# Accessibility Guidelines

Community Hub is committed to WCAG 2.1 AA compliance. This document outlines accessibility requirements for all components and features.

## Core Principles

1. **Perceivable**: Information must be presentable to users in ways they can perceive
2. **Operable**: UI components must be operable by all users
3. **Understandable**: Information and operation must be understandable
4. **Robust**: Content must be robust enough to work with assistive technologies

## Keyboard Navigation

### Required Keyboard Support

All interactive elements must be keyboard accessible:

- **Tab**: Navigate forward through interactive elements
- **Shift+Tab**: Navigate backward through interactive elements
- **Enter**: Activate buttons, links, and submit forms
- **Space**: Activate buttons, toggle checkboxes/toggles
- **Escape**: Close modals, dropdowns, and cancel operations
- **Arrow Keys**: Navigate within lists, tabs, carousels, and dropdowns
- **Home/End**: Jump to first/last item in lists and tabs

### Focus Indicators

All focusable elements must have visible focus indicators:

```css
.focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

- **Minimum**: 2px solid outline
- **Offset**: 2px from element
- **Color**: High contrast (primary color or black/white)
- **Never**: `outline: none` without a replacement indicator

### Focus Traps

Modals and dialogs must trap focus:

```tsx
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  return <div ref={modalRef}>...</div>;
}
```

## ARIA Attributes

### Landmark Roles

Use semantic HTML and ARIA landmarks:

```tsx
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
```

### Interactive Elements

#### Buttons

```tsx
<button
  aria-label="Close modal"
  aria-pressed={isPressed}  // For toggle buttons
  aria-expanded={isExpanded}  // For accordions/dropdowns
>
  Close
</button>
```

#### Links

```tsx
<a
  href="/businesses"
  aria-current={isCurrentPage ? 'page' : undefined}
>
  Businesses
</a>
```

#### Form Inputs

```tsx
<input
  id="email"
  type="email"
  aria-label="Email address"
  aria-describedby="email-helper email-error"
  aria-invalid={hasError ? 'true' : 'false'}
  aria-required="true"
/>
<span id="email-helper">We'll never share your email</span>
<span id="email-error" role="alert">Email is required</span>
```

#### Modals

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description</p>
</div>
```

#### Tabs

```tsx
<div role="tablist">
  <button
    role="tab"
    aria-selected={isActive}
    aria-controls="panel-1"
    id="tab-1"
  >
    Tab 1
  </button>
</div>
<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
>
  Panel content
</div>
```

### Live Regions

Use for dynamic content updates:

```tsx
import { LiveRegion } from '@/components/a11y';
import { useAnnounce } from '@/hooks/useAnnounce';

function SearchResults() {
  const { message, politeness, announce } = useAnnounce();

  const handleSearch = () => {
    // ... perform search
    announce(`${results.length} results found`, { politeness: 'polite' });
  };

  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <LiveRegion message={message} politeness={politeness} />
    </>
  );
}
```

## Color Contrast

### Text Contrast

- **Normal text** (< 18pt): ≥ 4.5:1
- **Large text** (≥ 18pt or 14pt bold): ≥ 3:1
- **UI components**: ≥ 3:1

### Testing Contrast

Use browser DevTools or online tools:
- Chrome DevTools (Inspect > Accessibility)
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

### Color Not Sole Indicator

Never rely on color alone to convey information:

**Bad:**
```tsx
<span style={{ color: 'red' }}>Error</span>
```

**Good:**
```tsx
<span className="text-error">
  <svg aria-hidden="true">!</svg>
  <span>Error: Invalid input</span>
</span>
```

## Touch Targets

### Minimum Size

All interactive elements must be ≥ 44px × 44px:

```tsx
<button
  className="px-4 py-2"
  style={{ minWidth: '44px', minHeight: '44px' }}
>
  Click me
</button>
```

### Spacing

Maintain ≥ 8px spacing between touch targets to prevent accidental activation.

## Images and Media

### Alt Text

All images must have descriptive alt text:

```tsx
// Informative images
<img src="/logo.png" alt="Guildford South Hub logo" />

// Decorative images (use empty alt)
<img src="/decoration.png" alt="" aria-hidden="true" />

// Complex images (use aria-describedby)
<img
  src="/chart.png"
  alt="Sales chart"
  aria-describedby="chart-description"
/>
<div id="chart-description" className="sr-only">
  Detailed description of the sales chart data...
</div>
```

### Video/Audio

Provide captions, transcripts, and audio descriptions:

```tsx
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track kind="captions" src="/captions.vtt" label="English" />
</video>
```

## Forms

### Labels

All form inputs must have associated labels:

```tsx
// Explicit label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Implicit label
<label>
  Email
  <input type="email" />
</label>

// aria-label (when visible label not possible)
<input type="search" aria-label="Search businesses" />
```

### Error Messages

Errors must be announced to screen readers:

```tsx
<input
  aria-invalid={hasError ? 'true' : 'false'}
  aria-describedby="email-error"
/>
{hasError && (
  <span id="email-error" role="alert">
    Email is required
  </span>
)}
```

### Required Fields

Indicate required fields:

```tsx
<label htmlFor="email">
  Email <span aria-label="required">*</span>
</label>
<input id="email" type="email" required aria-required="true" />
```

## Screen Reader Support

### Screen Reader Only Content

Use `.sr-only` class for content visible only to screen readers:

```css
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
```

```tsx
<button>
  <svg aria-hidden="true">...</svg>
  <span className="sr-only">Close menu</span>
</button>
```

### Skip Links

Provide skip links at the start of the page:

```tsx
import { SkipLink } from '@/components/ui';

function App() {
  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <Header />
      <main id="main-content">...</main>
    </>
  );
}
```

## Testing

### Automated Testing

```bash
# Run accessibility tests
pnpm test

# Jest-axe tests in component tests
import { axe, toHaveNoViolations } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

1. **Keyboard Navigation**: Navigate entire site using only keyboard
2. **Screen Reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
3. **Zoom**: Test at 200% browser zoom
4. **Color Contrast**: Use DevTools or WebAIM Contrast Checker
5. **Lighthouse**: Run Lighthouse accessibility audit (target: 100%)

### Screen Reader Testing Checklist

- [ ] All interactive elements announced correctly
- [ ] Form labels and errors announced
- [ ] Dynamic content changes announced (use LiveRegion)
- [ ] Image alt text descriptive and meaningful
- [ ] Headings create logical document outline
- [ ] Links have descriptive text (avoid "click here")
- [ ] Modals trap focus and announce title
- [ ] Loading states announced

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Common Violations to Avoid

1. ❌ Missing alt text on images
2. ❌ Form inputs without labels
3. ❌ Insufficient color contrast
4. ❌ Missing focus indicators
5. ❌ Non-keyboard-accessible interactive elements
6. ❌ Missing ARIA labels on icon-only buttons
7. ❌ Incorrect heading hierarchy (skip levels)
8. ❌ Empty links or buttons
9. ❌ Missing error announcements
10. ❌ Modal focus not trapped

## Getting Help

If you have questions about accessibility:

1. Check WCAG 2.1 guidelines
2. Use browser DevTools accessibility panel
3. Run automated tests with jest-axe
4. Test with real screen readers
5. Consult the A11y Project or WebAIM
