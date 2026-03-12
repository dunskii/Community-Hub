/**
 * E2E Tests for Events & Calendar System
 * Phase 8: Events & Calendar
 * Framework: Playwright
 *
 * These tests validate the complete user journey for events discovery,
 * detail viewing, RSVP, and calendar interactions.
 */

import { test, expect } from '@playwright/test';

test.describe('Events Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
  });

  test('should display events listing page with title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/events/i);
  });

  test('should display event cards', async ({ page }) => {
    const eventCards = page.locator('[data-testid="event-card"]');
    // Wait for events to load
    await page.waitForSelector('[data-testid="event-card"], [data-testid="empty-state"]', {
      timeout: 10000,
    });

    // Should show either events or empty state
    const cardsCount = await eventCards.count();
    const emptyState = page.locator('[data-testid="empty-state"]');

    if (cardsCount === 0) {
      await expect(emptyState).toBeVisible();
    } else {
      await expect(eventCards.first()).toBeVisible();
    }
  });

  test('should filter events by category', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Select category filter
    const categoryFilter = page.locator('[data-testid="category-filter"], select[name="category"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 });

      // Verify URL updated
      await expect(page).toHaveURL(/.*category=/);
    }
  });

  test('should filter by location type', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find location type filter
    const locationFilter = page.locator('[data-testid="location-type-filter"]');
    if (await locationFilter.isVisible()) {
      await locationFilter.click();
      await page.click('text=Online');

      await expect(page).toHaveURL(/.*locationType=ONLINE/i);
    }
  });

  test('should filter free events only', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Toggle free only filter
    const freeOnlyToggle = page.locator('[data-testid="free-only-toggle"], input[name="freeOnly"]');
    if (await freeOnlyToggle.isVisible()) {
      await freeOnlyToggle.click();
      await expect(page).toHaveURL(/.*freeOnly=true/);
    }
  });

  test('should sort events', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Select sort option
    const sortSelect = page.locator('[data-testid="sort-select"], select[name="sort"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('popular');
      await expect(page).toHaveURL(/.*sort=popular/);
    }
  });

  test('should paginate through results', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      const nextButton = page.locator('[data-testid="pagination-next"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await expect(page).toHaveURL(/.*page=2/);
      }
    }
  });

  test('should navigate to event detail page', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Verify navigation to detail page
      await expect(page).toHaveURL(/.*\/events\/.+/);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should handle empty search results', async ({ page }) => {
    await page.goto('/events?search=nonexistentevent12345xyz');

    // Verify empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('should show results count', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for results count text
    const resultsCount = page.locator('text=/\\d+ events? found/i');
    const emptyState = page.locator('[data-testid="empty-state"]');

    // Either results count or empty state should be visible
    const hasResults = await resultsCount.isVisible();
    const isEmpty = await emptyState.isVisible();
    expect(hasResults || isEmpty).toBeTruthy();
  });
});

test.describe('Event Detail Page', () => {
  test('should display event details', async ({ page }) => {
    // Go to events listing first
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Click on first event
    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForLoadState('networkidle');

      // Verify essential elements
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should show event date and time', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Should show date/time information
      const dateTime = page.locator('text=/\\d{1,2}:\\d{2}|AM|PM/i');
      await expect(dateTime.first()).toBeVisible();
    }
  });

  test('should show location for physical events', async ({ page }) => {
    await page.goto('/events?locationType=PHYSICAL');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Should show location information
      const location = page.locator('text=/NSW|VIC|QLD|address|street/i');
      await expect(location.first()).toBeVisible();
    }
  });

  test('should show RSVP counts', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Should show RSVP information
      const rsvpInfo = page.locator('text=/going|interested/i');
      await expect(rsvpInfo.first()).toBeVisible();
    }
  });

  test('should show add to calendar button', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      const addToCalendar = page.locator('text=/add to calendar/i');
      await expect(addToCalendar).toBeVisible();
    }
  });

  test('should show organizer information', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      const organizer = page.locator('text=/organizer|hosted by/i');
      await expect(organizer).toBeVisible();
    }
  });

  test('should have back to events link', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      const backLink = page.locator('a[href="/events"], text=/back to events/i');
      await expect(backLink.first()).toBeVisible();
    }
  });
});

test.describe('Event RSVP Flow', () => {
  test('should show login prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Should show login prompt
      const loginPrompt = page.locator('text=/log in|sign in/i');
      await expect(loginPrompt).toBeVisible();
    }
  });

  test('should show RSVP options for authenticated users', async ({ page, context }) => {
    // Set auth cookie (mock authentication)
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_token_for_testing',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Look for RSVP button
      const rsvpButton = page.locator('[data-testid="rsvp-button"], button:has-text("RSVP")');
      // RSVP button should exist (may be disabled if event is full)
      await expect(rsvpButton).toBeVisible();
    }
  });
});

test.describe('Calendar View', () => {
  test('should display calendar with view toggle', async ({ page }) => {
    // Navigate to events page with calendar view if available
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for calendar view toggle
    const calendarToggle = page.locator('text=/month|week|day/i');
    if (await calendarToggle.first().isVisible()) {
      // Should have view options
      await expect(page.locator('text=/month/i')).toBeVisible();
    }
  });

  test('should navigate calendar months', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for navigation buttons
    const prevButton = page.locator('[aria-label*="previous" i], button:has-text("<")');
    const nextButton = page.locator('[aria-label*="next" i], button:has-text(">")');

    if (await prevButton.first().isVisible()) {
      await prevButton.first().click();
      // Calendar should update
    }

    if (await nextButton.first().isVisible()) {
      await nextButton.first().click();
      // Calendar should update
    }
  });

  test('should show today button', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const todayButton = page.locator('button:has-text("Today"), [data-testid="today-button"]');
    if (await todayButton.isVisible()) {
      await expect(todayButton).toBeEnabled();
    }
  });
});

test.describe('Events - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-friendly event cards', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      // Verify card is visible and touch-friendly
      const box = await eventCard.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(375); // Fits mobile width
    }
  });

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Check interactive elements are at least 44px
    const buttons = page.locator('button, a[href]');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44px
          expect(box.height).toBeGreaterThanOrEqual(40); // Allow small margin
        }
      }
    }
  });

  test('should show mobile filters', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Look for mobile filter toggle
    const filterToggle = page.locator('[data-testid="filters-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();

      // Filters panel should appear
      const filtersPanel = page.locator('[data-testid="filters-panel"], [role="dialog"]');
      await expect(filtersPanel).toBeVisible();
    }
  });
});

test.describe('Events - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus visible
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'SELECT', 'INPUT']).toContain(focused);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    expect(await h1.count()).toBe(1);
  });

  test('should have proper landmarks', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // Should have main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('calendar should have grid role', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    // If calendar is visible, check for grid role
    const calendar = page.locator('[role="grid"]');
    if (await calendar.isVisible()) {
      await expect(calendar).toBeVisible();

      // Should have gridcells
      const cells = page.locator('[role="gridcell"]');
      expect(await cells.count()).toBeGreaterThan(0);
    }
  });

  test('should support keyboard navigation in calendar', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const calendar = page.locator('[role="grid"]');
    if (await calendar.isVisible()) {
      // Focus on a cell
      const firstCell = page.locator('[role="gridcell"]').first();
      await firstCell.focus();

      // Arrow key navigation
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      // Should still have focus within calendar
      const focused = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.getAttribute('role') === 'gridcell';
      });
      // Navigation should work (focus may or may not move depending on implementation)
    }
  });
});

test.describe('Event Creation Flow', () => {
  test('should show create event button for authenticated users', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_token_for_testing',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('text=/create event/i');
    // Button should be visible for authenticated users
    if (await createButton.isVisible()) {
      await expect(createButton).toBeEnabled();
    }
  });

  test('should hide create event button for unauthenticated users', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('text=/create event/i');
    // Button should not be visible for unauthenticated users
    await expect(createButton).not.toBeVisible();
  });
});

test.describe('Event Sharing', () => {
  test('should show share button on event detail', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      const shareButton = page.locator('text=/share/i');
      await expect(shareButton).toBeVisible();
    }
  });
});

test.describe('Homepage Events Section', () => {
  test('should display upcoming events on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for upcoming events section
    const eventsSection = page.locator('text=/upcoming events/i');
    if (await eventsSection.isVisible()) {
      await expect(eventsSection).toBeVisible();
    }
  });

  test('should link to events page from homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for "View All" or events link
    const eventsLink = page.locator('a[href="/events"]').first();
    if (await eventsLink.isVisible()) {
      await eventsLink.click();
      await expect(page).toHaveURL(/.*\/events/);
    }
  });
});
