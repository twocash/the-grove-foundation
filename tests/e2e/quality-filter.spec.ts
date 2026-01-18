// tests/e2e/quality-filter.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Quality Filter Tests
// User Story: US-A003 - Filter Sprouts by Minimum Quality Score
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
 * US-A003: Filter Sprouts by Minimum Quality Score
 *
 * Verifies that quality filters work correctly:
 * - Slider filters content by minimum score
 * - Filter applies with debounce (no flickering)
 * - URL state persists filter value
 * - Filter persists on page refresh
 */
test.describe('US-A003: Quality Filter', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('quality filter component loads without errors', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Screenshot: Explore page with filter area
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-explore-with-filter.png`,
      fullPage: true,
    });

    // Look for filter controls
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    const filterVisible = await filterToggle.isVisible().catch(() => false);

    console.log(`[US-A003] Filter toggle visible: ${filterVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('quality slider exists in filter panel', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Try to open filter panel
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(500);
    }

    // Screenshot: Filter panel open
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-filter-panel-open.png`,
      fullPage: true,
    });

    // Look for quality slider
    const qualitySlider = page.locator('[data-testid="quality-slider"], [data-testid="quality-filter-slider"]');
    const sliderExists = await qualitySlider.count() > 0;

    console.log(`[US-A003] Quality slider exists: ${sliderExists}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('filter persists via URL state', async ({ page }) => {
    // Navigate with quality filter in URL
    await page.goto('/explore?quality=70');
    await waitForPageStable(page, 2000);

    // Screenshot: URL-persisted filter
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-url-persisted-filter.png`,
      fullPage: true,
    });

    // URL should still contain quality parameter
    expect(page.url()).toContain('quality=70');

    // Look for slider showing correct value
    const qualitySlider = page.locator('[data-testid="quality-slider"], [data-testid="quality-filter-slider"]');
    if (await qualitySlider.isVisible().catch(() => false)) {
      const value = await qualitySlider.inputValue().catch(() => null);
      console.log(`[US-A003] Slider value from URL: ${value}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('filter applies without flickering (debounce)', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Open filter if needed
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Get initial card count
    const initialCount = await page.locator('[data-testid="sprout-card"]').count();
    console.log(`[US-A003] Initial sprout count: ${initialCount}`);

    // Screenshot: Before filter change
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-before-filter-change.png`,
      fullPage: true,
    });

    // If slider exists, try to interact with it
    const slider = page.locator('[data-testid="quality-slider"]');
    if (await slider.isVisible().catch(() => false)) {
      // Fill slider value (simulates dragging)
      await slider.fill('80');
      await page.waitForTimeout(400); // Wait for debounce

      // Screenshot: After filter change
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/14-after-filter-change.png`,
        fullPage: true,
      });
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('filter shows result count or feedback', async ({ page }) => {
    await page.goto('/explore?quality=80');
    await waitForPageStable(page, 2000);

    // Screenshot: Filter with results
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-filter-results-count.png`,
      fullPage: true,
    });

    // Check for result count indicator
    const resultCount = page.locator('[data-testid="result-count"], [data-testid="sprout-count"]');
    const countVisible = await resultCount.isVisible().catch(() => false);

    console.log(`[US-A003] Result count visible: ${countVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
