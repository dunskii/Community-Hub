/**
 * E2E Tests for Business Discovery Flow
 * Framework: Playwright (to be set up)
 *
 * These tests validate the complete user journey from homepage to business profile
 */

import { test, expect } from '@playwright/test';

test.describe('Business Discovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should allow user to search for businesses from homepage', async ({ page }) => {
    // Navigate to business directory
    await page.click('a[href*="/businesses"]');

    // Verify navigation
    await expect(page).toHaveURL(/.*businesses/);

    // Verify page title
    await expect(page.locator('h1')).toContainText('directoryTitle');
  });

  test('should filter businesses by category', async ({ page }) => {
    await page.goto('/businesses');

    // Select a category from dropdown
    await page.selectOption('[data-testid="category-filter"]', { label: 'Restaurants' });

    // Verify URL updated with category filter
    await expect(page).toHaveURL(/.*category=/);

    // Verify results filtered
    const businessCards = page.locator('[data-testid="business-card"]');
    await expect(businessCards.first()).toBeVisible();
  });

  test('should filter by open now', async ({ page }) => {
    await page.goto('/businesses');

    // Toggle "Open Now" filter
    await page.click('[data-testid="open-now-toggle"]');

    // Verify URL updated
    await expect(page).toHaveURL(/.*openNow=true/);
  });

  test('should sort businesses by name', async ({ page }) => {
    await page.goto('/businesses');

    // Select sort option
    await page.selectOption('[data-testid="sort-select"]', 'name');

    // Verify URL updated
    await expect(page).toHaveURL(/.*sort=name/);
  });

  test('should paginate through results', async ({ page }) => {
    await page.goto('/businesses');

    // Click next page
    await page.click('[data-testid="pagination-next"]');

    // Verify URL updated
    await expect(page).toHaveURL(/.*page=2/);

    // Verify scroll to top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });

  test('should navigate to business detail page', async ({ page }) => {
    await page.goto('/businesses');

    // Click on first business card
    await page.click('[data-testid="business-card"]:first-child a');

    // Verify navigation to detail page
    await expect(page).toHaveURL(/.*\/business\/.+/);

    // Verify business details loaded
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    await page.goto('/businesses?search=nonexistentbusiness12345');

    // Verify empty state message
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('should preserve filters across navigation', async ({ page }) => {
    await page.goto('/businesses?category=cat-1&openNow=true');

    // Navigate away and back
    await page.goto('/');
    await page.goBack();

    // Verify filters still applied
    await expect(page).toHaveURL(/.*category=cat-1/);
    await expect(page).toHaveURL(/.*openNow=true/);
  });
});

test.describe('Business Discovery - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-friendly business cards', async ({ page }) => {
    await page.goto('/businesses');

    // Verify mobile layout
    const businessCard = page.locator('[data-testid="business-card"]').first();
    await expect(businessCard).toBeVisible();

    // Verify touch-friendly tap targets (44px minimum)
    const cardLink = businessCard.locator('a');
    const box = await cardLink.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should show mobile filters', async ({ page }) => {
    await page.goto('/businesses');

    // Open filter drawer/modal on mobile
    await page.click('[data-testid="filters-toggle"]');

    // Verify filters visible
    await expect(page.locator('[data-testid="filters-panel"]')).toBeVisible();
  });
});

test.describe('Business Discovery - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/businesses');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus visible
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'SELECT', 'INPUT']).toContain(focused);
  });

  test('should announce filter changes to screen readers', async ({ page }) => {
    await page.goto('/businesses');

    // Apply filter
    await page.selectOption('[data-testid="category-filter"]', { index: 1 });

    // Verify ARIA live region updated
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toBeVisible();
  });
});
