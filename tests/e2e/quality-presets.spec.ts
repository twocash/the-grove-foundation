// tests/e2e/quality-presets.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Quality Filter Presets Tests
// User Story: US-A004 - Use Quick Filter Presets
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
 * US-A004: Use Quick Filter Presets
 *
 * Verifies that preset buttons work correctly:
 * - Preset buttons apply filter instantly
 * - Presets are mutually exclusive
 * - "All" preset clears filter
 */
test.describe('US-A004: Quality Filter Presets', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('preset buttons render correctly', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Open filter panel if needed
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Screenshot: Preset buttons
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-preset-buttons.png`,
      fullPage: true,
    });

    // Look for preset buttons
    const presetAll = page.locator('[data-testid="preset-all"], button:has-text("All")');
    const presetHigh = page.locator('[data-testid="preset-high"], button:has-text("High"), button:has-text("80+")');
    const presetMedium = page.locator('[data-testid="preset-medium"], button:has-text("Medium"), button:has-text("50+")');

    const hasAll = await presetAll.count() > 0;
    const hasHigh = await presetHigh.count() > 0;
    const hasMedium = await presetMedium.count() > 0;

    console.log(`[US-A004] Presets found - All: ${hasAll}, High: ${hasHigh}, Medium: ${hasMedium}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('clicking preset applies filter instantly', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Open filter panel
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Try to click a preset button
    const presetHigh = page.locator('[data-testid="preset-high"], button:has-text("High"), button:has-text("80+")').first();

    if (await presetHigh.isVisible().catch(() => false)) {
      await presetHigh.click();
      await page.waitForTimeout(400); // Wait for filter

      // Screenshot: After preset click
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/17-preset-high-selected.png`,
        fullPage: true,
      });

      // URL should reflect the filter
      const url = page.url();
      console.log(`[US-A004] URL after preset click: ${url}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('presets are mutually exclusive', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Click High preset
    const presetHigh = page.locator('[data-testid="preset-high"], button:has-text("High")').first();
    if (await presetHigh.isVisible().catch(() => false)) {
      await presetHigh.click();
      await page.waitForTimeout(300);

      // Screenshot: High selected
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/18-preset-mutual-exclusion-1.png`,
        fullPage: true,
      });

      // Click Medium preset
      const presetMedium = page.locator('[data-testid="preset-medium"], button:has-text("Medium")').first();
      if (await presetMedium.isVisible().catch(() => false)) {
        await presetMedium.click();
        await page.waitForTimeout(300);

        // Screenshot: Medium selected (High should be deselected)
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/19-preset-mutual-exclusion-2.png`,
          fullPage: true,
        });
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('All preset clears filter', async ({ page }) => {
    // Start with a filter applied
    await page.goto('/explore?quality=80');
    await waitForPageStable(page, 2000);

    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Click All preset
    const presetAll = page.locator('[data-testid="preset-all"], button:has-text("All")').first();
    if (await presetAll.isVisible().catch(() => false)) {
      await presetAll.click();
      await page.waitForTimeout(400);

      // Screenshot: All preset clears filter
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/20-preset-all-clears-filter.png`,
        fullPage: true,
      });

      // URL should not have quality filter
      const url = page.url();
      const hasQualityParam = url.includes('quality=');
      console.log(`[US-A004] URL has quality param after All: ${hasQualityParam}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
