# Community Hub Component Library

This directory contains all reusable UI components for the Community Hub platform. All components are built with accessibility (WCAG 2.1 AA), responsive design, and internationalization in mind.

## Directory Structure

```
components/
├── layout/       # Layout components (Header, Footer, Grid, etc.)
├── form/         # Form components (Input, Select, Checkbox, etc.)
├── display/      # Display components (Modal, Toast, Alert, etc.)
├── a11y/         # Accessibility components (LiveRegion, etc.)
├── ui/           # Base UI components (Button, Card, Spinner, etc.)
├── auth/         # Authentication components
├── business/     # Business-specific components
└── maps/         # Map components
```

## Component Categories

### Layout Components

- **Header** - Responsive header with logo, navigation, language selector, and user menu
- **Footer** - Footer with links, social media, partners, and newsletter signup
- **PageContainer** - Page wrapper with consistent padding and max-width
- **BottomNavigation** - Fixed bottom navigation for mobile (44px touch targets)
- **Sidebar** - Collapsible sidebar for additional content
- **Grid** - 12-column responsive grid system

### Form Components

- **Input** - Text input with label, error states, icons
- **Textarea** - Multi-line text input with auto-expand and character counter
- **Select** - Dropdown select with custom styling
- **Checkbox** - Checkbox with indeterminate state support
- **RadioButton** - Radio button component
- **Toggle** - Switch component with smooth animation
- **DatePicker** - Date input with calendar icon
- **TimePicker** - Time input with clock icon
- **FileUpload** - File upload with drag-and-drop, preview, and progress

### Display Components

- **Modal** - Dialog with focus trap, escape handling, and backdrop
- **Toast** - Notification with auto-dismiss and stacking
- **Alert** - Banner for critical/warning/advisory/info messages
- **Badge** - Count/status/tag badges
- **Avatar** - User avatar with initials fallback
- **Skeleton** - Loading skeleton for loading states
- **EmptyState** - Empty state with illustration, headline, and CTA
- **Pagination** - Page navigation with keyboard support
- **Tabs** - Tab component with keyboard navigation (arrow keys, Home, End)
- **Accordion** - Collapsible accordion with single/multiple open support
- **Carousel** - Image carousel with swipe gestures and auto-advance

### Accessibility Components

- **LiveRegion** - ARIA live region for screen reader announcements
- **SkipLink** - Skip to main content link (already in ui/)

## Usage Examples

### Basic Form

```tsx
import { Input, Select, Checkbox, Button } from '@/components';

function MyForm() {
  return (
    <form>
      <Input
        label="Email"
        type="email"
        error={errors.email}
        required
      />

      <Select
        label="Country"
        options={[
          { value: 'au', label: 'Australia' },
          { value: 'nz', label: 'New Zealand' },
        ]}
      />

      <Checkbox
        label="I agree to the terms"
        required
      />

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Modal with Form

```tsx
import { Modal, Input, Button } from '@/components';

function EditProfileModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
    >
      <Input label="Name" />
      <Input label="Email" type="email" />
      <Button onClick={onClose}>Save</Button>
    </Modal>
  );
}
```

### Alert Notification

```tsx
import { Alert } from '@/components';

function EmergencyAlert() {
  return (
    <Alert
      type="critical"
      title="Emergency Alert"
      message="Major flooding in the area. Seek higher ground immediately."
      dismissible
      onClose={() => {}}
      actions={
        <Button size="sm">View Details</Button>
      }
    />
  );
}
```

### Tabs Component

```tsx
import { Tabs } from '@/components';

function BusinessProfile() {
  const tabs = [
    { id: 'about', label: 'About', content: <AboutTab /> },
    { id: 'reviews', label: 'Reviews', content: <ReviewsTab /> },
    { id: 'hours', label: 'Hours', content: <HoursTab /> },
  ];

  return <Tabs tabs={tabs} />;
}
```

### Responsive Grid

```tsx
import { Grid, GridItem } from '@/components';

function BusinessGrid() {
  return (
    <Grid gap="md">
      <GridItem spanMobile={12} spanTablet={6} spanDesktop={4}>
        <BusinessCard />
      </GridItem>
      <GridItem spanMobile={12} spanTablet={6} spanDesktop={4}>
        <BusinessCard />
      </GridItem>
      <GridItem spanMobile={12} spanTablet={6} spanDesktop={4}>
        <BusinessCard />
      </GridItem>
    </Grid>
  );
}
```

## Design System Integration

All components use CSS custom properties from `design-tokens.ts`:

- `var(--color-primary)` - Primary brand color (from config)
- `var(--color-secondary)` - Secondary brand color
- `var(--color-accent)` - Accent color
- `var(--color-success)` - Success state color
- `var(--color-error)` - Error state color
- `var(--color-warning)` - Warning state color
- `var(--color-info)` - Info state color

**Never hardcode colors** - always use CSS variables to support multi-tenancy.

## Accessibility Guidelines

All components follow WCAG 2.1 AA standards:

1. **Keyboard Navigation**: All interactive elements are keyboard accessible (Tab, Enter, Space, Arrow keys, Escape)
2. **Focus Indicators**: Visible 2px focus rings with 2px offset
3. **ARIA Attributes**: Proper roles, labels, and descriptions
4. **Color Contrast**: ≥ 4.5:1 for text, ≥ 3:1 for UI elements
5. **Touch Targets**: ≥ 44px on mobile devices
6. **Screen Readers**: Compatible with NVDA, JAWS, VoiceOver

See [ACCESSIBILITY.md](../ACCESSIBILITY.md) for detailed guidelines.

## Testing

All components have:
- Unit tests with React Testing Library
- Accessibility tests with jest-axe
- Keyboard navigation tests
- Responsive design tests

Run tests:
```bash
pnpm test
```

## Contributing

When creating new components:

1. Follow existing component patterns
2. Add TypeScript interfaces for props
3. Include accessibility attributes (ARIA labels, roles, etc.)
4. Create comprehensive test file with jest-axe
5. Use CSS custom properties for colors
6. Support responsive design (mobile-first)
7. Add to appropriate index.ts for exports
8. Update this README with usage examples
