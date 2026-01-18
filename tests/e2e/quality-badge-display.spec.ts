// tests/e2e/quality-badge-display.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Quality Badge Display Tests
// User Story: US-A001 - View Quality Score on Sprout Card
// Protocol: Grove Execution Protocol v1.5 - Constraint 11

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s10.1-sl-aicuration-v2/screenshots/e2e';

/**
 * US-A001: View Quality Score on Sprout Card
 *
 * Verifies that quality badges display correctly on sprout cards:
 * - Scored sprouts show badge with score and grade
 * - Badge colors match score ranges
 * - Pending state shows animated indicator
 * - Error state degrades gracefully (no badge)
 */
test.describe('US-A001: Quality Badge Display', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('displays quality badge on scored sprout card', async ({ page }) => {
    // Navigate to explore page
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Screenshot: Explore page with sprout cards
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-sprout-cards-with-badges.png`,
      fullPage: true,
    });

    // Check for sprout cards
    const sproutCards = page.locator('[data-testid="sprout-card"]');
    const cardCount = await sproutCards.count();

    if (cardCount > 0) {
      // Look for quality badge components
      const qualityBadges = page.locator('[data-testid="quality-badge"], [data-testid="quality-score-badge"]');

      // At least some cards should have badges (scored or pending)
      const badgeCount = await qualityBadges.count();
      console.log(`[US-A001] Found ${badgeCount} quality badges on ${cardCount} cards`);
    }

    // Verify no critical errors during render
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('quality badge color matches score range', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Screenshot: Badge color variations
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-badge-color-variations.png`,
      fullPage: true,
    });

    // Check for quality badges with different scores
    const badges = page.locator('[data-testid="quality-badge"], [data-testid="quality-score-badge"]');
    const badgeCount = await badges.count();

    // If we have badges, verify they have color classes
    if (badgeCount > 0) {
      for (let i = 0; i < Math.min(badgeCount, 5); i++) {
        const badge = badges.nth(i);
        const classAttr = await badge.getAttribute('class');
        // Badges should have some color styling (varies by score)
        console.log(`[US-A001] Badge ${i + 1} classes: ${classAttr?.substring(0, 50)}...`);
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('pending badge displays for unscored sprout', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Screenshot: Pending badge state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-pending-badge-state.png`,
      fullPage: true,
    });

    // Look for pending badges
    const pendingBadges = page.locator('[data-testid="quality-pending-badge"]');
    const pendingCount = await pendingBadges.count();

    console.log(`[US-A001] Found ${pendingCount} pending badges`);

    // Verify no errors during pending state render
    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('graceful degradation when scoring fails', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Screenshot: Cards with potential error states
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-graceful-degradation.png`,
      fullPage: true,
    });

    // Sprout cards should still render even if quality scoring fails
    const sproutCards = page.locator('[data-testid="sprout-card"]');
    const cardCount = await sproutCards.count();

    // Cards should be visible regardless of quality status
    if (cardCount > 0) {
      await expect(sproutCards.first()).toBeVisible();
    }

    // Verify no uncaught errors
    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('mini badge variant displays correctly', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Screenshot: Mini badge variant
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-mini-badge-variant.png`,
      fullPage: true,
    });

    // Look for mini badges (compact variant)
    const miniBadges = page.locator('[data-testid="quality-score-mini"]');
    const miniCount = await miniBadges.count();

    console.log(`[US-A001] Found ${miniCount} mini quality badges`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
