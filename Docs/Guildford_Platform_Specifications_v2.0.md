# Community Hub Platform

## UI/UX Design Reference Guide

**Version 2.2** - Location-Agnostic Design Specifications

> **Note:** This document serves as a UI/UX reference guide for designers and developers. For technical specifications, data models, and API definitions, refer to `Community_Hub_Specification_v2.md`.

---

## 1. Design Philosophy & Strategic Overview

### Platform Vision

The Community Hub Platform serves as a welcoming, culturally-aware digital hub that bridges residents with local businesses and community events. The design reflects each deployment location's diverse, multicultural character while maintaining accessibility and clarity for users of all technical abilities and ages.

### Location-Agnostic Design

All UI text, imagery, and content references should use configuration values rather than hardcoded location names. This enables the platform to be deployed to any suburb or community with configuration-only changes.

**Design placeholders used in this document:**
- `{location.name}` - The deployment location (e.g., "Guildford South")
- `{platform.name}` - The platform name (e.g., "Community Hub")
- `{tagline}` - Location-specific tagline from configuration

### Key Design Principles

1. **Inclusivity First**
   - Multilingual support (10 languages)
   - RTL layout support for Arabic and Urdu
   - Culturally relevant, configurable imagery

2. **Clarity Over Features**
   - Essential user flows prioritised
   - Progressive disclosure of advanced features
   - Clean, uncluttered interfaces

3. **Community Trust**
   - Visual hierarchy emphasises verified businesses
   - Authentic reviews with clear moderation
   - Transparent practices and clear policies

4. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation support
   - Screen reader compatibility
   - High contrast text (4.5:1 minimum)

5. **Mobile-First Approach**
   - Designed for touch interactions
   - 44px minimum touch targets
   - Enhanced progressively for larger screens

6. **Performance-Conscious**
   - Skeleton loading states
   - Optimised images (WebP with fallbacks)
   - Progressive enhancement for slow connections

7. **Offline-Ready**
   - Graceful degradation when offline
   - Cached content remains accessible
   - Clear sync status indicators

### Color System

Colors are loaded from platform configuration and can be customised per deployment.

| Token | Default | Usage |
|-------|---------|-------|
| `--color-primary` | #2C5F7C | Headings, navigation, trusted elements |
| `--color-secondary` | #E67E22 | Accent CTAs, highlights |
| `--color-accent` | #F39C12 | Celebrations, badges, special features |
| `--color-success` | #27AE60 | Confirmations, positive states |
| `--color-error` | #E74C3C | Errors, destructive actions |
| `--color-warning` | #F39C12 | Warnings, caution states |

### Typography

Typography is configurable via platform settings. Default recommendations:

- **Headings:** Modern sans-serif (bold weight), friendly and approachable
- **Body:** Clean sans-serif, highly readable
- **Minimum sizes:** 16px body text on mobile, 14px on desktop
- **Font requirement:** Must support all 10 platform languages including Arabic, Urdu, Chinese, and Polish characters

### Spacing System

All spacing uses a consistent 4px base unit. Use these tokens for margins, padding, and gaps:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icon gaps |
| `--space-2` | 8px | Default element spacing |
| `--space-3` | 12px | Related element groups |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-5` | 24px | Component separation |
| `--space-6` | 32px | Section padding |
| `--space-8` | 48px | Major section breaks |
| `--space-10` | 64px | Page section separation |

**Grid System:**
- 12-column grid on desktop (1200px container)
- 8-column grid on tablet (768px-1199px)
- 4-column grid on mobile (<768px)
- Gutter: 24px (desktop), 16px (tablet/mobile)

### Dark Mode

Dark mode is supported and respects system preferences via `prefers-color-scheme`.

**Dark Mode Colour Tokens:**

| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `--color-background` | #FFFFFF | #1A1A2E |
| `--color-surface` | #F8F9FA | #252538 |
| `--color-text-primary` | #1A1A2E | #F8F9FA |
| `--color-text-secondary` | #6C757D | #A0A0B0 |
| `--color-border` | #DEE2E6 | #3A3A4E |

**Implementation:**
- Toggle in user settings (System/Light/Dark)
- Smooth transition: 200ms ease
- Images: Use `filter: brightness(0.9)` for decorative images in dark mode
- Maps: Use dark map style variant

---

## 2. Key UX Recommendations

This section summarises 10 critical UX recommendations integrated throughout this guide.

### Recommendation 1: Simplified Navigation

- **Problem:** Complex navigation with nested dropdowns challenges mobile users
- **Solution:** Reduce primary nav to 4 core items: Discover, Events, Messages, Services
- **Rationale:** Reduced cognitive load, easier mobile scanning, faster navigation

### Recommendation 2: Robust Discovery Experience

- **Problem:** Discovery limited to featured carousel
- **Solution:** Dedicated Business Directory with faceted search and filters
- **Rationale:** Supports multiple discovery user journeys

### Recommendation 3: Community Feed as Secondary Feature

- **Problem:** UGC feed may be sparse at launch
- **Solution:** Launch with curated "Community Highlights"; introduce UGC when moderation is ready
- **Rationale:** Reduces risk, maintains quality

### Recommendation 4: Explicit Empty States

- **Problem:** No guidance for missing data
- **Solution:** Design empty states with clear CTAs for every content type
- **Rationale:** Improves perceived quality and user confidence

### Recommendation 5: Business Profile CTA Prioritisation

- **Problem:** Multiple CTAs create unclear primary goal
- **Solution:** Define primary CTA by business type (see Section 5)
- **Rationale:** Reduces friction, increases conversions

### Recommendation 6: Business Verification Flow

- **Problem:** Claim process not designed
- **Solution:** Multi-step verification with email, SMS, or document options
- **Rationale:** Protects data integrity, builds trust

### Recommendation 7: Review Management

- **Problem:** No review response capability for businesses
- **Solution:** Business Owner Dashboard with review management
- **Rationale:** Turns reviews into engagement tool

### Recommendation 8: Multilingual & RTL Strategy

- **Problem:** RTL not fully considered
- **Solution:** Full RTL support with smooth language switching
- **Rationale:** Critical for diverse communities

### Recommendation 9: Content Moderation

- **Problem:** UGC with no moderation plan
- **Solution:** Clear guidelines, flagging, appeals process
- **Rationale:** Enables safe, trustworthy platform

### Recommendation 10: Design System Consistency

- **Problem:** Layouts described but no reusable patterns
- **Solution:** Component library with defined states
- **Rationale:** Enables faster iteration, visual consistency

---

## 3. Landing Page Design

### 3.1 Navigation Architecture

**Top Bar (40px height)**
- Left: Platform logo + tagline (from configuration)
- Right: Language selector (globe icon), Contact, For Businesses

**Primary Navigation Bar (60px, sticky on scroll)**

Core items (left-aligned, 4 items maximum):
- Discover Businesses
- Events Calendar
- Messages
- Local Services

Right-aligned:
- Search icon (opens overlay search)
- "List Your Business" button (accent color)

**Mobile Navigation (below 768px)**
- Hamburger menu triggers full-screen slide-out
- Slide-out includes all nav items + Language selector + Contact
- Logo and search icon remain visible

**Keyboard Shortcuts (desktop):**
| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Escape` | Close overlays/modals |
| `?` | Show keyboard shortcuts help |
| `g` then `h` | Go to home |
| `g` then `b` | Go to business directory |
| `g` then `e` | Go to events |

### 3.2 Hero Section

**Layout**
- Full-width configurable image (local community imagery)
- Gradient overlay: Dark at bottom for text readability
- Height: 100vh on desktop, 60vh on mobile

**Content (centered)**
- Headline: Configurable from platform settings
- Translation line: Same headline shown in 2 community languages (18px, 70% opacity)
- Subheading: Configurable tagline

**Search Bar**
- Prominent placement (500px desktop, 90% width mobile)
- Placeholder: "Search for businesses, services, events..."
- Category dropdown with icons
- Quick filter chips below (configurable categories)

**Stats Strip (desktop only)**
- Semi-transparent cards showing dynamic counts
- Examples: "150+ Local Businesses", "10 Languages", "Weekly Events"
- Values pulled from live data

### 3.3 Value Proposition Section

Three-column layout (desktop), stacked (mobile):

| Card | Icon | Purpose |
|------|------|---------|
| Support Your Neighbors | Handshake | Community economic benefit |
| Personal Service | Heart | Local business advantage |
| Cultural Diversity | Globe | Multicultural celebration |

Each card: Light background tint, subtle border, shadow on hover

### 3.4 Featured Businesses Carousel

- Horizontal scroll with snap points
- Card shows: Image, name, category, rating, verified badge
- Navigation arrows (desktop), swipe (mobile)
- "View All" link to directory

### 3.5 Upcoming Events Section

- Grid of 6 upcoming events (configurable)
- Each card: Event image, title, date/time, location, RSVP count
- "View Calendar" link to full events page
- Filter chips for event categories

### 3.6 Community Highlights

Curated content section (replaces UGC feed at launch):
- Recent business openings
- Upcoming community events
- Special promotions and deals
- 3-column grid (desktop), 2-column (tablet), single (mobile)

### 3.7 Call-to-Action Sections

Two-column layout (stacked on mobile):
- Left: "Join the Community" (secondary color)
- Right: "List Your Business Free" (accent color)

### 3.8 Footer

- Navigation links organised by category
- Language selector (prominent placement)
- Social media links
- Contact information
- Legal links (Privacy, Terms, Accessibility)

---

## 4. Business Directory & Search

### 4.1 User Journeys Supported

- "I want restaurants within 1km" → Filter: Category + Distance
- "I want halal-certified restaurants" → Filter: Category + Certification
- "Show me services that speak Arabic" → Filter: Language + Open Now
- "Where can I get good coffee?" → Search + Filter by Rating

### 4.2 Layout

**Desktop (3-column)**
- Left (25%): Sticky filter panel
- Center (50%): Search bar + Results list
- Right (25%): Map view

**Tablet (2-column)**
- Filters in collapsible header
- Results + Map side by side

**Mobile (single column)**
- Filters in slide-out panel
- Results list full width
- Map toggle button

### 4.3 Search Bar

- Sticky at top of results
- Auto-complete suggestions (business names, categories)
- Live result updates as user types
- Result count display: "Showing 34 results"

### 4.4 Filter Panel

**Facets (collapsible sections):**
- Category (from configuration)
- Distance (0-1km, 1-3km, 3km+) - requires location permission
- Hours Status (Open Now, Closed, 24hr)
- Rating (5 stars, 4+, 3+)
- Languages Spoken (configurable list)
- Certifications (Halal, Vegan, Wheelchair Accessible, etc.)
- Delivery/Takeaway Available

**Mobile behaviour:**
- "Filter" button triggers slide-out panel
- Active filter count shown on button
- "Clear All" option

### 4.5 Search Result Cards

**Card layout:**
- Thumbnail image (left, 120x120px)
- Business name (bold)
- Category tags + Language indicators
- Star rating with review count
- One-line description (truncated)
- Distance indicator
- Status badge: "Open until 9:00 PM" (green) or "Closed" (red)

**Interaction states:**
- Hover: Background shift, increased shadow
- Focus: Visible outline for keyboard navigation
- Active: Slight scale reduction

**Sorting options:**
- Recommended (default)
- Distance (closest first)
- Rating (highest first)
- Newest

### 4.6 Map View

- Pins coloured by category
- Clicking pin highlights corresponding result
- Cluster markers for dense areas
- Current location indicator
- Zoom controls

### 4.7 Empty & Error States

**No results:**
- Illustration: Empty search
- Headline: "No businesses found matching your criteria"
- Suggestions: "Try broadening your filters or searching a different term"
- Action: "Clear Filters" button

**Network error:**
- Icon: Offline/warning
- Message: "Unable to load results. Check your connection."
- Action: "Retry" button

**Loading:**
- Skeleton cards with shimmer animation
- Maintains layout structure

---

## 5. Business Profile Page

### 5.1 CTA Prioritisation by Business Type

| Business Type | Primary CTA | Secondary CTA |
|---------------|-------------|---------------|
| Restaurant | Get Directions | Call |
| Retail | Get Directions | Visit Website |
| Services | Call | Visit Website |
| Professional | Visit Website | Send Message |

**Desktop behaviour:**
- Primary CTA: Large, accent-coloured button in header
- Secondary CTA: Outline button beside primary
- Tertiary: Icon buttons (share, save, report)

**Mobile behaviour:**
- Primary CTA: Sticky button at screen bottom
- Appears after hero scrolls out of view
- Auto-hides when hero visible
- Secondary CTA: In expandable menu

### 5.2 Profile Sections

**Header**
- Business name and verified badge
- Category and subcategory
- Rating summary with review count
- Cover photo or photo carousel
- CTA buttons

**About**
- Business description
- "What Makes Us Special" highlights (fallback: auto-generated from certifications and services if not provided)
- Languages spoken
- Certifications and badges

**Photo Gallery**
- Grid layout with lightbox
- Categories: Interior, Food, Menu, Staff, Events
- User-contributed photos (moderated)

**Location & Hours**
- Interactive map with directions button
- Address with copy functionality
- Hours table with current status indicator
- Special hours for holidays

**Reviews**
- 3-5 featured reviews sorted by helpfulness
- Filter by rating
- "Read all reviews" link
- Write review CTA

**Events & Deals**
- Upcoming events hosted by business
- Active deals and promotions
- "See All" links to filtered views

**Contact**
- Phone (tap to call)
- Email
- Website
- Social media links
- Message button (to business inbox)

### 5.3 Empty States

**No reviews:**
- Icon + "Be the first to review!"
- CTA: "Write a Review" button

**No photos:**
- Placeholder + "No photos yet"
- Owner prompt: "Add photos to help customers"

**No hours:**
- "Hours not listed"
- CTA: "Contact business for hours"

**No events:**
- "No upcoming events"
- Suggestion: "Check back soon"

### 5.4 Review Display

- Reviewer name and avatar
- Star rating
- Review date
- Review text (expandable if long)
- Helpful count with voting buttons
- Business response (if any)
- Flag button for inappropriate content

---

## 6. Events & Calendar

### 6.1 Events Listing Page

**Layout:**
- Filter bar at top
- Grid of event cards
- Calendar view toggle

**Filters:**
- Date range picker
- Category (Community, Business, Cultural, Sports, etc.)
- Location type (Physical, Online, Hybrid)
- Free/Paid toggle

**Event Card:**
- Event image
- Title and host name
- Date/time with timezone
- Location or "Online Event"
- RSVP count: "25 going, 10 interested"
- Price indicator or "Free"
- RSVP button

### 6.2 Calendar Views

**Month View:**
- Traditional calendar grid
- Event dots on days with events
- Click day to see event list
- Navigation: Previous/Next month

**Week View:**
- 7-day horizontal layout
- Time slots with event blocks
- Current time indicator
- Scroll for full day
- Week start day: Configurable by locale (Sunday for en-US, Monday for en-GB and most European locales)

**Day View:**
- Single day timeline
- Detailed event blocks
- Hour-by-hour layout

**Accessibility:**
- Full keyboard navigation
- Screen reader announcements for navigation
- RTL support for calendar layout

### 6.3 Event Detail Page

**Header:**
- Large event image
- Title and host
- Date/time with "Add to Calendar" option
- Location with map (or video link for online)
- RSVP status and button

**Details Section:**
- Full description
- Organiser information
- Category tags

**RSVP Section:**
- Going/Interested/Not Going options
- Guest count input (if applicable)
- RSVP list (going, interested)
- Capacity indicator if limited

**Share Section:**
- Social sharing buttons
- Copy link button
- QR code option

### 6.4 Create Event Flow (Business Owners)

**Step 1: Basic Information**
- Event title
- Description
- Category selection
- Cover image upload

**Step 2: Date & Time**
- Start date/time
- End date/time
- Timezone selector
- Recurrence options

**Step 3: Location**
- Location type (Physical/Online/Hybrid)
- Address with autocomplete (physical)
- Video platform link (online)
- Both options (hybrid)

**Step 4: Settings**
- Capacity limit (optional)
- RSVP deadline
- Ticket price (or free)
- Visibility (public/followers only)

**Step 5: Review & Publish**
- Summary of all details
- Preview card
- Publish or Save Draft

---

## 7. Messaging System

### 7.1 User Inbox

**Layout:**
- Conversation list (left)
- Active conversation (right)
- New message button

**Conversation List:**
- Business logo/avatar
- Business name
- Last message preview (truncated)
- Timestamp
- Unread indicator
- Archive option

**Conversation View:**
- Message bubbles (sent/received styling)
- Timestamps
- Read receipts
- Attachment support (images)
- Message input with send button

**Mobile Layout:**
- Full-screen conversation list
- Tap to open conversation
- Back button to return to list

### 7.2 Business Inbox

**Dashboard Overview:**
- Unread message count
- Response time metrics
- Quick actions

**Inbox Features:**
- Filter: All, Unread, Archived
- Sort: Newest, Oldest
- Search conversations
- Bulk actions

**Quick Reply Templates:**
- Saved responses
- One-click insert
- Customise before sending

**Conversation Actions:**
- Archive
- Block (with report)
- Mark as unread

### 7.3 New Conversation Flow

**From Business Profile:**
- "Send Message" button
- Subject category selection (Inquiry, Booking, Feedback, Other)
- Message input
- Optional attachment

**Confirmation:**
- "Message sent" toast
- Link to view conversation

### 7.4 Message States

**Sending:** Spinner indicator
**Sent:** Single checkmark (message stored on server)
**Read:** Filled double checkmark (recipient opened conversation)
**Failed:** Error icon with retry option

> **Note:** "Delivered" state is not used since server-to-recipient delivery cannot be confirmed in this architecture. Messages go from "Sent" directly to "Read" when the recipient views the conversation.

### 7.5 Messaging Error States

**Send failure:**
- Error icon replaces send button
- Message: "Failed to send. Tap to retry."
- Retry action available
- Option to copy message text

**Connection lost during conversation:**
- Banner: "You're offline. Messages will send when reconnected."
- Queued messages shown with pending indicator
- Auto-retry when connection restored

**Rate limit reached:**
- Modal: "You've reached the daily message limit"
- Message: "To prevent spam, users can start 10 new conversations per day."
- CTA: "Continue existing conversations" or dismiss

---

## 8. Business Owner Dashboard

### 8.1 Overview Tab

**Key Metrics Cards:**
- Profile views (7 days, 30 days)
- Actions (calls, directions, website clicks)
- Current rating
- Total reviews
- Unread messages

**Quick Actions:**
- Edit Profile
- Upload Photos
- View Public Profile
- Manage Reviews
- View Messages

**Activity Feed:**
- Recent reviews
- New messages
- Profile updates
- System alerts

### 8.2 Analytics Tab

**Charts:**
- Profile views over time (line chart)
- Actions breakdown (bar chart)
- Peak viewing times (heatmap)

**Metrics Table:**
- Daily/weekly/monthly comparisons
- Trend indicators

**Export:**
- CSV download option
- Date range selection

### 8.3 Reviews Tab

**Review List:**
- All reviews with full details
- Filter by rating, date
- Sort options

**Review Actions:**
- Respond to review
- Flag as inappropriate
- View reviewer profile

**Response Guidelines:**
- Character limit indicator
- Professional tone suggestions
- Preview before posting

### 8.4 Photos Tab

**Upload:**
- Drag-and-drop zone
- File picker alternative
- Batch upload support

**Upload Error States:**
- File too large: "Image exceeds 10MB limit. Please compress or resize."
- Invalid format: "Please upload JPEG, PNG, or WebP images."
- Upload failed: "Upload failed. Check your connection and try again." with retry button
- Partial batch failure: "3 of 5 photos uploaded. Tap to retry failed uploads."

**Organisation:**
- Drag to reorder
- Category assignment
- Bulk delete

**Categories:**
- Interior, Food, Menu, Staff, Events
- Custom categories (future)

### 8.5 Messages Tab

- Full inbox view (see Section 7.2)
- Quick reply templates management
- Response time tracking

### 8.6 Settings Tab

**Profile Settings:**
- Business information
- Hours management
- Services and certifications

**Account Settings:**
- Owner email
- Password change
- Notification preferences

**Privacy:**
- Data visibility options
- Analytics opt-out

**Danger Zone:**
- Transfer ownership
- Delete profile (with confirmation)

---

## 9. Business Onboarding & Verification

### 9.1 Onboarding Goals

- Quick listing (target: 5-10 minutes)
- Fraud prevention through verification
- Essential data collection
- Relationship establishment

### 9.2 Step-by-Step Flow

**Step 1: Business Type**
- Radio selection: Restaurant, Retail, Services, Other
- Determines subsequent form fields

**Step 2: Business Information**
- Business name (required)
- Category/subcategory (required)
- Address with autocomplete (required)
- Phone number (required)
- Website URL (optional)
- Description (optional, 500 char max)

**Step 3: Business Hours**
- Day-by-day selector
- Quick actions: "Copy to all days", "24 hours", "Closed"
- Special hours option

**Step 4: Additional Information**
- Languages spoken (multi-select)
- Certifications (multi-select)
- Services (delivery, takeaway, etc.)
- Payment methods

**Step 5: Verification**
- Email verification (primary)
- Alternative: SMS PIN, business document upload
- Link expiry: 24 hours

**Step 6: Review & Confirm**
- Summary of all information
- Edit option for each section
- "Create My Profile" button

### 9.2.1 Onboarding Error Recovery

**Network failure during step:**
- Auto-save draft locally after each field change
- Banner: "Connection lost. Your progress is saved."
- Auto-retry submission when reconnected
- Manual "Retry" button available

**Session timeout:**
- Draft preserved in local storage (7-day retention)
- On return: "Welcome back! Continue where you left off?"
- Resume or Start Over options

**Validation errors on submit:**
- Scroll to first error field
- Error summary at top of form
- Individual field errors shown inline
- "Fix errors" CTA that navigates to first error

**Verification email not received:**
- "Didn't receive the email?" link after 60 seconds
- Resend option (rate limited: 3 per hour)
- Alternative: Switch to SMS verification
- Check spam folder reminder

### 9.3 Profile States

**Unverified:**
- Visible in search with "Unverified" badge
- Limited dashboard access
- Reminder emails to complete verification

**Verified:**
- Verified badge displayed
- Full dashboard access
- Can respond to reviews
- Can send/receive messages

**Claimed (existing listing):**
- Business existed, owner claimed it
- Verification required before full access
- Previous data preserved

### 9.4 Onboarding Messaging

**Landing CTA:**
- "List Your Business Free - Get found by local customers"

**Progress indicators:**
- Step counter (Step 2 of 6)
- Progress bar
- Estimated time remaining

**Confirmation:**
- "Your profile is live! Check your email to verify."
- Link to view public profile
- Next steps checklist

---

## 10. Multilingual & RTL Support

### 10.1 Supported Languages

| Language | Code | Direction | Status |
|----------|------|-----------|--------|
| English | en | LTR | Default |
| Arabic | ar | RTL | Supported |
| Urdu | ur | RTL | Supported |
| Chinese (Simplified) | zh | LTR | Supported |
| Vietnamese | vi | LTR | Supported |
| Korean | ko | LTR | Supported |
| Hindi | hi | LTR | Supported |
| Spanish | es | LTR | Supported |
| Polish | pl | LTR | Supported |
| Bengali | bn | LTR | Supported |

### 10.2 Language Switching

**Trigger:**
- Globe icon in header/footer
- Current language displayed

**Selector:**
- Language name in native script
- Flag icon optional (configurable)
- Dropdown or modal on mobile

**Behaviour:**
- Page updates without full reload
- Scroll position preserved
- Selection saved to user preferences

### 10.3 RTL Layout Considerations

**Automatic mirroring:**
- Navigation alignment
- Text alignment
- Icon positions
- Margin/padding directions

**Manual considerations:**
- Directional icons (arrows, chevrons)
- Progress indicators
- Number formatting
- Image compositions with text

### 10.4 Content Translation

**UI strings:**
- All labels, buttons, headings translated
- Maintained in translation files
- Fallback to English if missing

**User content:**
- Business descriptions can have multiple language versions
- Reviews tagged with language
- Language preference matching in search

### 10.5 Typography for Languages

**Requirements:**
- Font must support all character sets
- Adequate line height for scripts (Arabic, Hindi)
- Number rendering (Arabic numerals vs Hindi numerals)

---

## 11. Design System Components

### 11.1 Buttons

**Variants:**
- Primary: Filled with primary colour
- Secondary: Outline with primary colour
- Tertiary: Text only
- Destructive: Red for dangerous actions

**States:**
| State | Visual Treatment |
|-------|-----------------|
| Default | Standard appearance |
| Hover | Slight darkening, shadow increase |
| Active | Darker shade, inset shadow |
| Focus | Visible focus ring (2px) |
| Disabled | Greyed out, 50% opacity |
| Loading | Spinner replaces text |

**Sizes:**
- Small: 32px height
- Medium: 40px height (default)
- Large: 48px height

### 11.2 Form Inputs

**Text Input:**
- Border: 1px light grey
- Focus: 2px primary colour border, subtle shadow
- Error: Red border, error message below
- Disabled: Grey background

**Select/Dropdown:**
- Chevron right-aligned (LTR) or left (RTL)
- Menu below input, max 5 visible items
- Search option for long lists

**Checkbox/Radio:**
- 44px minimum touch target
- Checked: Primary colour fill
- Indeterminate state for checkboxes

**Text Area:**
- Resizable (vertical only)
- Character count option
- Auto-grow option

### 11.3 Cards

**Standard Card:**
- White background
- Subtle shadow: 0 2px 8px rgba(0,0,0,0.1)
- Rounded corners: 8px
- Padding: 16px

**Interactive Card:**
- Hover: Shadow increases, slight lift
- Focus: Visible outline
- Active: Slight depression

### 11.4 Modals

**Overlay:**
- Semi-transparent dark (rgba(0,0,0,0.5))
- Click outside to close (optional)

**Modal:**
- Centered, white background
- Max-width: 600px (desktop), 90vw (mobile)
- Close button: X in top-right
- Actions: Bottom-aligned buttons

**Accessibility:**
- Focus trapped within modal
- ESC to close
- Return focus on close

### 11.5 Toast Notifications

**Position:**
- Desktop: Bottom-right
- Mobile: Bottom-center, full width

**Variants:**
- Success: Green background, checkmark
- Error: Red background, alert icon
- Warning: Yellow background, warning icon
- Info: Blue background, info icon

**Behaviour:**
- Auto-dismiss timing by type:
  - Success/Info: 4 seconds
  - Warning: 6 seconds
  - Error: 8 seconds (or persistent if action required)
- Manual dismiss: X button
- Stacking: Newest on top, max 3 visible
- Action toasts: Include inline action button (e.g., "Undo", "Retry")

### 11.6 Badges

**Style:**
- Small pill shape
- Background colour + white text
- Padding: 4px 8px
- Font size: 12px

**Types:**
- Verified (primary colour)
- New (accent colour)
- Certification badges (category-specific colours)

### 11.7 Loading States

**Skeleton:**
- Grey placeholder shapes
- Shimmer animation (1.5s duration, ease-in-out)
- Match actual content layout

**Spinner:**
- Circular, primary colour
- 1-second rotation
- Centred in container

**Progress Bar:**
- Horizontal bar
- Determinate or indeterminate
- Percentage label optional

### 11.8 Animation & Motion

All animations respect `prefers-reduced-motion`. When reduced motion is preferred, transitions are instant or use opacity-only fades.

**Timing Functions:**
| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | General transitions |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Elements entering view |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Elements exiting view |
| `--ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Playful interactions |

**Duration Scale:**
| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Micro-interactions (hover, focus) |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Modal/overlay transitions |
| `--duration-slower` | 500ms | Page transitions, complex animations |

**Standard Animations:**
- **Fade in:** Opacity 0→1, 200ms, ease-out
- **Slide up:** TranslateY 16px→0, opacity 0→1, 300ms, ease-out
- **Scale in:** Scale 0.95→1, opacity 0→1, 200ms, ease-out
- **Skeleton shimmer:** Linear gradient sweep, 1.5s, infinite, ease-in-out

**Micro-interactions:**
- Button hover: Background darken, 100ms
- Button press: Scale 0.98, 50ms
- Card hover: Translate Y -2px, shadow increase, 150ms
- Toggle switch: 200ms spring animation
- Checkbox check: Scale bounce, 200ms

### 11.9 Empty States

**Structure:**
- Illustration (optional)
- Headline explaining the state
- Description with guidance
- Action button (if applicable)

**Examples:**
- No search results
- Empty inbox
- No reviews yet
- No saved businesses

---

## 12. Content Moderation UX

### 12.1 Community Guidelines Display

**Accessibility:**
- Link in footer
- Shown during review/post creation
- Referenced in moderation notifications

**Content:**
- Clear language, no jargon
- Available in all supported languages
- Examples of acceptable/unacceptable content

### 12.2 Reporting Flow

**Trigger:**
- Flag icon on reportable content
- "Report" in overflow menu

**Steps:**
1. Select reason (dropdown)
2. Optional: Additional details (text)
3. Submit confirmation
4. Thank you message

**Reasons:**
- Spam or advertising
- Harassment or hate speech
- False information
- Inappropriate content
- Other (with text field)

### 12.3 Moderation Notifications

**Content removed:**
- Clear explanation of reason
- Reference to guidelines
- Appeal option

**Appeal submitted:**
- Confirmation message
- Expected response time
- Tracking reference

### 12.4 Appeal Flow

**Trigger:**
- Link in removal notification
- "Appeal" button in account settings

**Steps:**
1. View removal reason
2. Provide appeal justification
3. Submit
4. Await response (notification)

---

## 13. Mobile Interaction Patterns

### 13.1 Touch Targets

- Minimum size: 44x44px
- Spacing: 8px between adjacent targets
- Primary actions: Full-width on mobile

### 13.2 Gestures

| Gesture | Action |
|---------|--------|
| Swipe left/right | Carousel navigation |
| Swipe down | Close modal/overlay |
| Long press | Context menu (share, save, report) |
| Pull to refresh | Reload content |
| Pinch | Zoom images/map |

### 13.3 Sticky Elements

**Header:**
- Compact on scroll
- Essential actions remain visible

**Primary CTA:**
- Fixed at bottom
- Full-width, 56px height
- Hides when near relevant content

**Bottom Navigation:**
- Fixed navigation bar
- 5 items maximum
- Active state indicator

### 13.4 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column |
| Tablet | 768px - 1199px | 2-column |
| Desktop | >= 1200px | 3-column with sidebar |

### 13.5 Responsive Images

**Format Strategy:**
- Primary: WebP (80% quality)
- Fallback: JPEG for older browsers
- Use `<picture>` element with `srcset`

**Breakpoint Sizes:**
| Breakpoint | Card Thumbnail | Hero Image | Gallery Image |
|------------|---------------|------------|---------------|
| Mobile | 320w | 768w | 640w |
| Tablet | 480w | 1200w | 800w |
| Desktop | 640w | 1920w | 1200w |

**srcset Example:**
```html
<picture>
  <source
    type="image/webp"
    srcset="image-320.webp 320w, image-640.webp 640w, image-1200.webp 1200w"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
  <img src="image-640.jpg" alt="..." loading="lazy" />
</picture>
```

**Loading Behaviour:**
- Above-the-fold images: `loading="eager"`, `fetchpriority="high"`
- Below-the-fold: `loading="lazy"`
- Placeholder: Blurred low-resolution version (20x20px, scaled up with CSS blur)
- Skeleton: Grey rectangle with shimmer until placeholder loads

**Aspect Ratios:**
| Image Type | Aspect Ratio |
|------------|--------------|
| Business card thumbnail | 1:1 |
| Business cover photo | 16:9 |
| Event card | 16:9 |
| User avatar | 1:1 |
| Gallery grid | 4:3 |

---

## 14. Accessibility Checklist

### 14.1 Visual

- [ ] Colour contrast ratio 4.5:1 (normal text)
- [ ] Colour contrast ratio 3:1 (large text)
- [ ] Information not conveyed by colour alone
- [ ] Focus indicators visible
- [ ] Text resizable to 200%

### 14.2 Keyboard

- [ ] All interactive elements focusable
- [ ] Logical tab order
- [ ] No keyboard traps
- [ ] Skip links provided
- [ ] Shortcuts documented

### 14.3 Screen Reader

- [ ] Semantic HTML structure
- [ ] ARIA labels for custom components
- [ ] Alt text for images
- [ ] Form labels associated
- [ ] Live regions for dynamic content

### 14.4 Motion

- [ ] Respect prefers-reduced-motion
- [ ] Animations < 5 seconds
- [ ] No flashing content

### 14.5 Forms

- [ ] Labels visible and associated
- [ ] Error messages clear and specific
- [ ] Required fields indicated
- [ ] Autocomplete attributes used

---

## 15. Offline Behaviour & Resilience

### 15.1 Service Worker Strategy

**Caching Approach:**
- App shell: Cache-first (HTML, CSS, JS, fonts)
- API responses: Network-first with cache fallback
- Images: Cache-first with network update
- User data: IndexedDB for offline persistence

**Cache Priorities:**
| Content Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Static assets | Cache-first | Until new deploy |
| Business listings | Stale-while-revalidate | 1 hour |
| Search results | Network-first | 5 minutes |
| User's saved businesses | Cache-first + sync | Persistent |
| Messages | Network-first | No cache |

### 15.2 Offline UI States

**Global offline indicator:**
- Banner at top of page: "You're offline. Some features may be limited."
- Dismissible, reappears on navigation
- Accent colour background with offline icon

**Feature-specific states:**

| Feature | Offline Behaviour |
|---------|-------------------|
| Business directory | Show cached results, disable search |
| Business profile | Show if previously viewed |
| Saved businesses | Full access (synced locally) |
| Events calendar | Show cached events |
| Messaging | Show history, queue new messages |
| Reviews | Read cached, queue new submissions |
| Search | Disabled with explanation |

### 15.3 Sync Behaviour

**Queued actions:**
- Displayed with "pending" indicator (clock icon)
- Tooltip: "Will sync when online"
- Queued in order, processed FIFO on reconnect

**Conflict resolution:**
- Last-write-wins for user preferences
- Server-authoritative for business data
- Manual resolution prompt for message conflicts

**Sync status indicators:**
- Syncing: Rotating arrows icon
- Synced: Checkmark (fades after 2s)
- Sync failed: Warning icon with retry option

### 15.4 Connection Recovery

**On reconnect:**
1. Process queued actions in background
2. Refresh stale cached data
3. Toast: "Back online. Syncing your changes..."
4. Toast on completion: "All changes synced" or "X items failed to sync"

**Background sync:**
- Use Background Sync API where supported
- Fallback: Retry on next app open

---

## 16. Appendix: Design Decision Rationale

### 16.1 Why Different CTAs per Business Type?

- Goal: Reduce friction for the most common user action
- Restaurant visitors want directions and phone number
- Service seekers want to call or visit website
- Prioritising the primary action improves conversion rates

### 16.2 Why Defer UGC Feed?

- Early UGC may be sparse, damaging perceived activity
- Moderation requires processes and resources
- Curated highlights maintain quality at launch
- UGC introduced when community is established

### 16.3 Why 4 Navigation Items Maximum?

- Mobile screens have limited space
- Cognitive load increases with choices
- 4 items fit comfortably with logo and CTA
- Secondary items accessible in menu/footer

### 16.4 Why Sticky CTAs on Mobile?

- Thumb zone accessibility
- Always visible call-to-action
- Reduces scrolling to find action
- Auto-hide prevents obstruction

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Original | Initial design specification |
| 2.1 | March 2026 | Made location-agnostic, removed technical specs, added Events/Messaging sections, aligned breakpoints, added accessibility checklist |
| 2.2 | March 2026 | Added: spacing system, dark mode, keyboard shortcuts, animation/motion specs, responsive image strategy, offline behaviour, error recovery flows. Updated: toast timing by type, message states clarification, calendar week start locale config, "What Makes Us Special" fallback |

---

**Related Documents:**
- `Community_Hub_Specification_v2.md` - Technical specification (data models, APIs)
- `PROGRESS.md` - Implementation status
- `TODO.md` - Task tracking
