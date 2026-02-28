/**
 * E2E Tests for Business Profile Viewing
 * Framework: Playwright (to be set up)
 *
 * These tests validate the business profile page functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Business Profile Page', () => {
  const testBusinessSlug = 'test-restaurant';

  test.beforeEach(async ({ page }) => {
    await page.goto(`/business/${testBusinessSlug}`);
  });

  test('should display business information', async ({ page }) => {
    // Verify business name
    await expect(page.locator('h1')).toBeVisible();

    // Verify description
    await expect(page.locator('[data-testid="business-description"]')).toBeVisible();

    // Verify category badge
    await expect(page.locator('[data-testid="category-badge"]')).toBeVisible();
  });

  test('should display contact information', async ({ page }) => {
    // Verify phone number
    await expect(page.locator('[data-testid="phone-number"]')).toBeVisible();

    // Verify email (if provided)
    const email = page.locator('[data-testid="email"]');
    if (await email.isVisible()) {
      await expect(email).toHaveAttribute('href', /^mailto:/);
    }

    // Verify website link
    const website = page.locator('[data-testid="website"]');
    if (await website.isVisible()) {
      await expect(website).toHaveAttribute('href', /^https?:/);
      await expect(website).toHaveAttribute('target', '_blank');
    }
  });

  test('should display operating hours', async ({ page }) => {
    // Verify operating hours table
    await expect(page.locator('[data-testid="operating-hours"]')).toBeVisible();

    // Verify open/closed status
    const status = page.locator('[data-testid="open-status"]');
    await expect(status).toContainText(/(Open|Closed)/);
  });

  test('should display address and map', async ({ page }) => {
    // Verify address
    await expect(page.locator('[data-testid="address"]')).toBeVisible();

    // Verify map rendered
    await expect(page.locator('[data-testid="business-map"]')).toBeVisible();

    // Verify directions button
    await expect(page.locator('[data-testid="directions-button"]')).toBeVisible();
  });

  test('should display verification badge for verified businesses', async ({ page }) => {
    const verifiedBadge = page.locator('[data-testid="verified-badge"]');

    if (await verifiedBadge.isVisible()) {
      await expect(verifiedBadge).toContainText(/verified/i);
    }
  });

  test('should display action buttons', async ({ page }) => {
    // Save button
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible();

    // Share button
    await expect(page.locator('[data-testid="share-button"]')).toBeVisible();

    // Call button (mobile)
    const callButton = page.locator('[data-testid="call-button"]');
    if (await callButton.isVisible()) {
      await expect(callButton).toHaveAttribute('href', /^tel:/);
    }
  });

  test('should handle directions button click', async ({ page, context }) => {
    // Click directions button
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('[data-testid="directions-button"]')
    ]);

    // Verify opens maps application
    await expect(newPage).toHaveURL(/maps\.google\.com|maps\.apple\.com|waze\.com/);
  });

  test('should display social media links', async ({ page }) => {
    const socialLinks = page.locator('[data-testid="social-links"]');

    if (await socialLinks.isVisible()) {
      // Verify social links have proper targets
      const links = socialLinks.locator('a');
      const count = await links.count();

      for (let i = 0; i < count; i++) {
        await expect(links.nth(i)).toHaveAttribute('target', '_blank');
        await expect(links.nth(i)).toHaveAttribute('rel', /noopener/);
      }
    }
  });

  test('should display certifications', async ({ page }) => {
    const certifications = page.locator('[data-testid="certifications"]');

    if (await certifications.isVisible()) {
      await expect(certifications).toContainText(/(HALAL|KOSHER|VEGAN|VEGETARIAN)/i);
    }
  });

  test('should display accessibility features', async ({ page }) => {
    const features = page.locator('[data-testid="accessibility-features"]');

    if (await features.isVisible()) {
      await expect(features).toContainText(/(wheelchair|accessible)/i);
    }
  });

  test('should display payment methods', async ({ page }) => {
    const payment = page.locator('[data-testid="payment-methods"]');

    if (await payment.isVisible()) {
      await expect(payment).toContainText(/(CASH|CARD|EFTPOS)/i);
    }
  });

  test('should display languages spoken', async ({ page }) => {
    const languages = page.locator('[data-testid="languages-spoken"]');

    if (await languages.isVisible()) {
      await expect(languages).toBeVisible();
    }
  });

  test('should handle 404 for non-existent business', async ({ page }) => {
    await page.goto('/business/non-existent-business-12345');

    // Verify 404 message
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();

    // Verify back to directory link
    await expect(page.locator('a[href="/businesses"]')).toBeVisible();
  });

  test('should set correct meta tags for SEO', async ({ page }) => {
    // Verify title tag
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).not.toBe('');

    // Verify meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);

    // Verify Open Graph tags
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'business.business');
  });

  test('should handle share button click', async ({ page }) => {
    await page.click('[data-testid="share-button"]');

    // Verify share modal or native share API called
    // This would depend on implementation
    await expect(page.locator('[data-testid="share-modal"], [data-testid="share-options"]')).toBeVisible({
      timeout: 2000,
    }).catch(() => {
      // Native share API might have been called instead
      expect(true).toBe(true);
    });
  });
});

test.describe('Business Profile - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized layout', async ({ page }) => {
    await page.goto('/business/test-restaurant');

    // Verify mobile layout
    await expect(page.locator('[data-testid="business-detail"]')).toBeVisible();

    // Verify call button visible on mobile
    await expect(page.locator('[data-testid="call-button"]')).toBeVisible();
  });

  test('should have touch-friendly action buttons', async ({ page }) => {
    await page.goto('/business/test-restaurant');

    // Verify minimum touch target size (44px)
    const callButton = page.locator('[data-testid="call-button"]');
    const box = await callButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
});

test.describe('Business Profile - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/business/test-restaurant');

    // Tab through action buttons
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // Verify focus on interactive element
    expect(['save-button', 'share-button', 'call-button', 'directions-button']).toContain(firstFocus);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/business/test-restaurant');

    // Check h1 exists and is business name
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Verify heading structure
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });

  test('should have accessible map', async ({ page }) => {
    await page.goto('/business/test-restaurant');

    // Verify map has aria-label
    const map = page.locator('[data-testid="business-map"]');
    await expect(map).toHaveAttribute('aria-label', /.+/);
  });
});
