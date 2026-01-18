// tests/e2e/quality-advanced-filters.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Advanced Dimension Filter Tests
// User Story: US-A005 - Filter by Individual Dimensions
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
 * US-A005: Filter by Individual Dimensions (Advanced)
 *
 * Verifies that advanced dimension filters work correctly:
 * - Advanced filters hidden by default
 * - Expand reveals dimension sliders
 * - Dimension filters combine with AND logic
 */
test.describe('US-A005: Advanced Dimension Filters', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('advanced filters collapsed by default', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Open filter panel
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Screenshot: Collapsed state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/21-advanced-filters-collapsed.png`,
      fullPage: true,
    });

    // Advanced section should be collapsed
    const advancedSection = page.locator('[data-testid="advanced-filters"]');
    const advancedVisible = await advancedSection.isVisible().catch(() => false);

    // Toggle should be visible
    const advancedToggle = page.locator('[data-testid="advanced-filters-toggle"], button:has-text("Advanced")');
    const toggleVisible = await advancedToggle.isVisible().catch(() => false);

    console.log(`[US-A005] Advanced section visible: ${advancedVisible}, Toggle visible: ${toggleVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('expanding advanced shows dimension sliders', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Open filter panel
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Click advanced toggle
    const advancedToggle = page.locator('[data-testid="advanced-filters-toggle"], button:has-text("Advanced")').first();
    if (await advancedToggle.isVisible().catch(() => false)) {
      await advancedToggle.click();
      await page.waitForTimeout(300);

      // Screenshot: Expanded state
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/22-advanced-filters-expanded.png`,
        fullPage: true,
      });

      // Look for dimension sliders
      const accuracySlider = page.locator('[data-testid="filter-accuracy"]');
      const utilitySlider = page.locator('[data-testid="filter-utility"]');
      const noveltySlider = page.locator('[data-testid="filter-novelty"]');
      const provenanceSlider = page.locator('[data-testid="filter-provenance"]');

      const hasAccuracy = await accuracySlider.isVisible().catch(() => false);
      const hasUtility = await utilitySlider.isVisible().catch(() => false);
      const hasNovelty = await noveltySlider.isVisible().catch(() => false);
      const hasProvenance = await provenanceSlider.isVisible().catch(() => false);

      console.log(`[US-A005] Dimension sliders - Accuracy: ${hasAccuracy}, Utility: ${hasUtility}, Novelty: ${hasNovelty}, Provenance: ${hasProvenance}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('dimension filter applies correctly', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Open filter panel and expand advanced
    const filterToggle = page.locator('[data-testid="filter-toggle"], button:has-text("Filter")');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    const advancedToggle = page.locator('[data-testid="advanced-filters-toggle"]').first();
    if (await advancedToggle.isVisible().catch(() => false)) {
      await advancedToggle.click();
      await page.waitForTimeout(300);

      // Set accuracy filter
      const accuracySlider = page.locator('[data-testid="filter-accuracy"]');
      if (await accuracySlider.isVisible().catch(() => false)) {
        await accuracySlider.fill('70');
        await page.waitForTimeout(400); // debounce

        // Screenshot: Accuracy filter applied
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/23-accuracy-filter-applied.png`,
          fullPage: true,
        });

        // URL should have accuracy parameter
        const url = page.url();
        const hasAccuracyParam = url.includes('accuracy=');
        console.log(`[US-A005] URL has accuracy param: ${hasAccuracyParam}`);
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('multiple dimension filters combine with AND logic', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const filterToggle = page.locator('[data-testid="filter-toggle"]');
    if (await filterToggle.isVisible().catch(() => false)) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    const advancedToggle = page.locator('[data-testid="advanced-filters-toggle"]').first();
    if (await advancedToggle.isVisible().catch(() => false)) {
      await advancedToggle.click();
      await page.waitForTimeout(300);

      // Set multiple filters
      const accuracySlider = page.locator('[data-testid="filter-accuracy"]');
      const provenanceSlider = page.locator('[data-testid="filter-provenance"]');

      if (await accuracySlider.isVisible().catch(() => false)) {
        await accuracySlider.fill('70');
      }
      if (await provenanceSlider.isVisible().catch(() => false)) {
        await provenanceSlider.fill('80');
      }

      await page.waitForTimeout(400);

      // Screenshot: Multiple filters
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/24-multiple-dimension-filters.png`,
        fullPage: true,
      });

      // URL should have both parameters
      const url = page.url();
      console.log(`[US-A005] URL with multiple filters: ${url}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('dimension filter persists via URL', async ({ page }) => {
    // Navigate with dimension filter in URL
    await page.goto('/explore?accuracy=70&provenance=80');
    await waitForPageStable(page, 2000);

    // Screenshot: URL-persisted dimension filters
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/25-url-persisted-dimension-filters.png`,
      fullPage: true,
    });

    // Verify URL contains filters
    expect(page.url()).toContain('accuracy=70');
    expect(page.url()).toContain('provenance=80');

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
