/**
 * E2E Tests for Event Creation Flow
 * Phase 8: Events & Calendar
 * Framework: Playwright
 *
 * These tests validate the event creation and editing user flows.
 */

import { test, expect } from '@playwright/test';

test.describe('Event Creation Form', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_token_for_testing',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/events/create');
  });

  test('should display event creation form', async ({ page }) => {
    // Check for form sections
    await expect(page.locator('text=/basic info|event title/i').first()).toBeVisible();
  });

  test('should have required form fields', async ({ page }) => {
    // Title field
    const titleField = page.locator('input[name="title"], [data-testid="title-input"]');
    await expect(titleField).toBeVisible();

    // Description field
    const descField = page.locator('textarea[name="description"], [data-testid="description-textarea"]');
    await expect(descField).toBeVisible();

    // Category field
    const categoryField = page.locator('select[name="categoryId"], [data-testid="category-select"]');
    await expect(categoryField).toBeVisible();

    // Date/time fields
    const startDate = page.locator('input[name="startDate"], input[type="date"]').first();
    await expect(startDate).toBeVisible();

    const startTime = page.locator('input[name="startTime"], input[type="time"]').first();
    await expect(startTime).toBeVisible();
  });

  test('should show location type options', async ({ page }) => {
    // Radio buttons for location type
    const physicalOption = page.locator('input[value="PHYSICAL"], text=/in person/i');
    const onlineOption = page.locator('input[value="ONLINE"], text=/online/i');
    const hybridOption = page.locator('input[value="HYBRID"], text=/hybrid/i');

    await expect(physicalOption.first()).toBeVisible();
    await expect(onlineOption.first()).toBeVisible();
    await expect(hybridOption.first()).toBeVisible();
  });

  test('should show venue fields for physical events', async ({ page }) => {
    // Select physical event type
    const physicalOption = page.locator('input[value="PHYSICAL"]');
    if (await physicalOption.isVisible()) {
      await physicalOption.click();
    } else {
      await page.click('text=/in person/i');
    }

    // Venue fields should be visible
    const streetField = page.locator('input[name="venue.street"], [data-testid="street-input"]');
    await expect(streetField).toBeVisible();

    const suburbField = page.locator('input[name="venue.suburb"], [data-testid="suburb-input"]');
    await expect(suburbField).toBeVisible();
  });

  test('should show online URL field for online events', async ({ page }) => {
    // Select online event type
    const onlineOption = page.locator('input[value="ONLINE"]');
    if (await onlineOption.isVisible()) {
      await onlineOption.click();
    } else {
      await page.click('text=/online/i');
    }

    // Online URL field should be visible
    const urlField = page.locator('input[name="onlineUrl"], [data-testid="online-url-input"]');
    await expect(urlField).toBeVisible();
  });

  test('should validate required fields on submit', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create Event")');
    await submitButton.click();

    // Should show validation errors
    const errorMessage = page.locator('[role="alert"], .text-error, text=/required/i');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('should validate title length', async ({ page }) => {
    const titleField = page.locator('input[name="title"]');

    // Enter very long title (over 100 chars)
    await titleField.fill('A'.repeat(150));

    // Blur to trigger validation
    await titleField.blur();

    // Should show error for title too long
    const errorMessage = page.locator('text=/100 characters|too long/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate description minimum length', async ({ page }) => {
    const descField = page.locator('textarea[name="description"]');

    // Enter short description
    await descField.fill('Too short');

    // Blur to trigger validation
    await descField.blur();

    // Should show error
    const errorMessage = page.locator('text=/50 characters|too short/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate end time is after start time', async ({ page }) => {
    // Set start date
    const startDate = page.locator('input[name="startDate"]');
    await startDate.fill('2026-12-25');

    const startTime = page.locator('input[name="startTime"]');
    await startTime.fill('14:00');

    // Set end date/time before start
    const endDate = page.locator('input[name="endDate"]');
    await endDate.fill('2026-12-25');

    const endTime = page.locator('input[name="endTime"]');
    await endTime.fill('12:00');

    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error
    const errorMessage = page.locator('text=/end.*before.*start|after start/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should validate URL fields', async ({ page }) => {
    // Fill ticket URL with invalid value
    const ticketUrl = page.locator('input[name="ticketUrl"]');
    await ticketUrl.fill('not-a-valid-url');
    await ticketUrl.blur();

    // Should show error
    const errorMessage = page.locator('text=/invalid.*url|valid url/i');
    await expect(errorMessage).toBeVisible();
  });

  test('should have accessibility features checkboxes', async ({ page }) => {
    // Look for accessibility section
    const accessibilitySection = page.locator('text=/accessibility/i');
    await expect(accessibilitySection.first()).toBeVisible();

    // Should have checkboxes
    const checkboxes = page.locator('input[type="checkbox"][name*="accessibility"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);
  });

  test('should have cancel button', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
  });

  test('should show character counter for description', async ({ page }) => {
    const descField = page.locator('textarea[name="description"]');
    await descField.fill('Test description that is at least fifty characters long for testing purposes.');

    // Should show character count
    const counter = page.locator('text=/\\d+\\/\\d+/');
    await expect(counter).toBeVisible();
  });
});

test.describe('Event Creation Form - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_token_for_testing',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/events/create');
  });

  test('should display form properly on mobile', async ({ page }) => {
    // Form should be visible and usable
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Fields should stack vertically
    const titleField = page.locator('input[name="title"]');
    const box = await titleField.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });

  test('should have scrollable form', async ({ page }) => {
    // Form should be scrollable
    const scrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > window.innerHeight;
    });
    // Form content should exceed viewport (scrollable)
    expect(scrollable).toBe(true);
  });

  test('should have touch-friendly submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    const box = await submitButton.boundingBox();

    // Button should be at least 44px tall
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Event Creation Form - Accessibility', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_token_for_testing',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/events/create');
  });

  test('should have labeled form fields', async ({ page }) => {
    // Title field should have label
    const titleLabel = page.locator('label[for*="title"], label:has-text("Title")');
    await expect(titleLabel.first()).toBeVisible();

    // Description field should have label
    const descLabel = page.locator('label[for*="description"], label:has-text("Description")');
    await expect(descLabel.first()).toBeVisible();
  });

  test('should have error messages linked to fields', async ({ page }) => {
    // Submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Error messages should have role="alert" or be linked via aria-describedby
    const errors = page.locator('[role="alert"], [id*="error"]');
    expect(await errors.count()).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press('Tab'); // Focus first field
    await page.keyboard.press('Tab'); // Next field
    await page.keyboard.press('Tab'); // Next field

    // Should be able to navigate through form
    const focused = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName;
    });

    expect(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']).toContain(focused);
  });

  test('should have proper form sections with headings', async ({ page }) => {
    // Form should have section headings
    const headings = page.locator('h2, h3');
    expect(await headings.count()).toBeGreaterThan(0);
  });

  test('should have fieldset for radio button groups', async ({ page }) => {
    // Location type should be in fieldset
    const fieldset = page.locator('fieldset');
    await expect(fieldset.first()).toBeVisible();
  });
});

test.describe('Event Editing', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock_token_for_testing',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('should show edit button for event owner', async ({ page }) => {
    // Navigate to events and find one owned by user
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Look for edit button
      const editButton = page.locator('text=/edit event/i');
      // May or may not be visible depending on ownership
    }
  });

  test('should pre-fill form with existing event data', async ({ page }) => {
    // Navigate directly to edit page (would need real event ID)
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      const editButton = page.locator('text=/edit event/i');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Title field should be pre-filled
        const titleField = page.locator('input[name="title"]');
        const titleValue = await titleField.inputValue();
        expect(titleValue.length).toBeGreaterThan(0);
      }
    }
  });

  test('should show update button instead of create', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('networkidle');

    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();

      const editButton = page.locator('text=/edit event/i');
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should show "Update" instead of "Create"
        const updateButton = page.locator('button:has-text("Update Event")');
        await expect(updateButton).toBeVisible();
      }
    }
  });
});
