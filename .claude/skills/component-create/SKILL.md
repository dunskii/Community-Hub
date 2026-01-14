---
name: component-create
description: Creates accessible, mobile-first UI components following the Community Hub design system. Use when building new components with proper styling, RTL support, WCAG 2.1 AA compliance, and responsive design.
---

# Component Creation Skill

You are a UI component expert for the Community Hub platform. Your role is to help create consistent, accessible, and responsive components following the platform's design system.

## Design System Foundation

### Colour Palette (from config)

Components should use CSS custom properties, not hardcoded colours:

```css
/* Primary colours - set from platform.json */
--color-primary: #2C5F7C;      /* Teal - primary actions, links */
--color-secondary: #E67E22;    /* Orange - secondary actions, highlights */
--color-accent: #F39C12;       /* Gold - accents, stars, badges */

/* Semantic colours */
--color-success: #27AE60;
--color-error: #E74C3C;
--color-warning: #F39C12;
--color-info: #3498DB;

/* Alert colours (emergency system) */
--color-alert-critical: #DC2626;   /* Red */
--color-alert-warning: #F97316;    /* Orange */
--color-alert-advisory: #EAB308;   /* Yellow */
--color-alert-info: #3B82F6;       /* Blue */

/* Neutral colours */
--color-background: #FFFFFF;
--color-surface: #F8F9FA;
--color-border: #E5E7EB;
--color-text-primary: #1F2937;
--color-text-secondary: #6B7280;
--color-text-muted: #9CA3AF;
```

### Typography

```css
/* Font families */
--font-heading: 'Montserrat', sans-serif;
--font-body: 'Open Sans', sans-serif;

/* Font sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Breakpoints (Mobile-First)

```css
/* Mobile: default (< 768px) */
/* Tablet: @media (min-width: 768px) */
/* Desktop: @media (min-width: 1200px) */

--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1200px;
```

## Component Structure

### React Component Template

```tsx
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          // Variant styles
          {
            'bg-primary text-white hover:bg-primary-dark focus:ring-primary': variant === 'primary',
            'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary': variant === 'secondary',
            'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary': variant === 'tertiary',
          },
          // Size styles
          {
            'px-3 py-1.5 text-sm min-h-[36px]': size === 'sm',
            'px-4 py-2 text-base min-h-[44px]': size === 'md',  // 44px touch target
            'px-6 py-3 text-lg min-h-[52px]': size === 'lg',
          },
          // State styles
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="sr-only">Loading</span>
            <LoadingSpinner className="w-4 h-4 me-2" />
          </>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

## Accessibility Requirements (WCAG 2.1 AA)

### Required for ALL Components

1. **Keyboard Navigation**
   - All interactive elements must be focusable
   - Logical tab order (use `tabIndex` sparingly)
   - Visible focus indicators (2px solid ring)

2. **Screen Reader Support**
   - Semantic HTML elements (`button`, `nav`, `main`, etc.)
   - ARIA labels where semantic HTML isn't sufficient
   - `aria-live` regions for dynamic content

3. **Colour Contrast**
   - Text: minimum 4.5:1 ratio
   - Large text (18px+ or 14px+ bold): minimum 3:1 ratio
   - UI components: minimum 3:1 ratio

4. **Touch Targets**
   - Minimum 44x44px for all interactive elements
   - Adequate spacing between touch targets

5. **Form Accessibility**
   - Labels associated with inputs (`htmlFor`/`id`)
   - Error messages linked to fields (`aria-describedby`)
   - Required fields indicated (`aria-required`)

### Focus Styles

```css
/* Global focus styles */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: white;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## RTL Support

The platform supports Arabic and Urdu (RTL languages). All components must work in both directions.

### RTL-Safe Patterns

```tsx
// Use logical properties instead of physical
// BAD
padding-left: 16px;
margin-right: 8px;
text-align: left;
border-left: 1px solid;

// GOOD
padding-inline-start: 16px;
margin-inline-end: 8px;
text-align: start;
border-inline-start: 1px solid;

// For Tailwind CSS, use directional utilities
// BAD
<div className="pl-4 mr-2 text-left">

// GOOD
<div className="ps-4 me-2 text-start">
```

### RTL-Aware Icons

```tsx
// Icons that indicate direction should flip
<ChevronIcon className="rtl:rotate-180" />

// Use CSS logical properties for transforms
.icon-directional {
  transform: scaleX(1);
}

[dir="rtl"] .icon-directional {
  transform: scaleX(-1);
}
```

## Common Component Patterns

### Card Component

```tsx
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Card({ children, variant = 'default', padding = 'md', className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white',
        {
          'shadow-sm': variant === 'default',
          'shadow-md hover:shadow-lg transition-shadow': variant === 'elevated',
          'border border-border': variant === 'outlined',
        },
        {
          'p-0': padding === 'none',
          'p-3': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        className
      )}
    >
      {children}
    </div>
  );
}
```

### Input Component

```tsx
interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id || useId();
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
          {props.required && <span className="text-error ms-1" aria-hidden="true">*</span>}
        </label>

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'px-3 py-2 rounded-lg border transition-colors min-h-[44px]',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error ? 'border-error' : 'border-border hover:border-gray-400',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(error && errorId, hint && hintId) || undefined}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-sm text-text-muted">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

### Modal Component

```tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@radix-ui/react-dialog';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'bg-white rounded-lg shadow-xl p-6 w-full max-w-md',
          'focus:outline-none'
        )}
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <DialogTitle id="modal-title" className="text-xl font-semibold mb-2">
          {title}
        </DialogTitle>

        {description && (
          <DialogDescription id="modal-description" className="text-text-secondary mb-4">
            {description}
          </DialogDescription>
        )}

        {children}
      </DialogContent>
    </Dialog>
  );
}
```

## Responsive Design

### Mobile-First Approach

```tsx
// Start with mobile styles, add breakpoints for larger screens
<div className={cn(
  // Mobile (default)
  'flex flex-col gap-4 p-4',
  // Tablet
  'md:flex-row md:gap-6 md:p-6',
  // Desktop
  'xl:gap-8 xl:p-8'
)}>
```

### Touch-Friendly Mobile Navigation

```tsx
// Bottom navigation for mobile
<nav className="fixed bottom-0 inset-x-0 bg-white border-t md:hidden">
  <ul className="flex justify-around py-2">
    <li>
      <a href="/" className="flex flex-col items-center p-2 min-h-[44px] min-w-[44px]">
        <HomeIcon className="w-6 h-6" />
        <span className="text-xs mt-1">Home</span>
      </a>
    </li>
    {/* ... more items */}
  </ul>
</nav>
```

## Testing Checklist

Before completing a component:

- [ ] Works with keyboard only (Tab, Enter, Escape)
- [ ] Screen reader announces correctly
- [ ] Visible focus indicators
- [ ] 44px minimum touch targets
- [ ] Colour contrast passes (use browser dev tools)
- [ ] RTL layout correct (`dir="rtl"` on html)
- [ ] Responsive at all breakpoints
- [ ] No hardcoded colours (uses CSS variables)
- [ ] No hardcoded text (uses i18n keys)
- [ ] Loading and error states handled
