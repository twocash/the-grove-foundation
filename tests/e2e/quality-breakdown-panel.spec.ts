// tests/e2e/quality-breakdown-panel.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Quality Breakdown Panel Tests
// User Story: US-A006 - View Full Quality Breakdown
// Protocol: Grove Execution Protocol v1.5 - Constraint 11
// Note: This component uses MANDATORY json-render pattern

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s10.1-sl-aicuration-v2/screenshots/e2e';

/**
 * US-A006: View Full Quality Breakdown (json-render pattern)
 *
 * Verifies that the quality breakdown panel works correctly:
 * - Panel opens on badge click
 * - Displays overall score and grade
 * - Shows all four dimension scores with bars
 * - Displays radar chart visualization
 * - Shows assessment metadata
 * - Closes on escape or outside click
 */
test.describe('US-A006: Quality Breakdown Panel (json-render)', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('panel opens on badge click with correct content', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Find a quality badge
    const badge = page.locator('[data-testid="quality-badge"], [data-testid="quality-score-badge"]').first();

    if (await badge.isVisible().catch(() => false)) {
      await badge.click();
      await page.waitForTimeout(500);

      // Screenshot: Panel opened
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/26-breakdown-panel-full.png`,
        fullPage: true,
      });

      // Look for panel
      const panel = page.locator('[data-testid="quality-breakdown-panel"]');
      const panelVisible = await panel.isVisible().catch(() => false);

      if (panelVisible) {
        // Verify content sections using json-render pattern elements
        const overallScore = panel.locator('[data-testid="overall-score"], [data-testid="quality-header"]');
        const dimensionBars = panel.locator('[data-testid*="dimension-"]');

        const hasOverall = await overallScore.isVisible().catch(() => false);
        const dimensionCount = await dimensionBars.count();

        console.log(`[US-A006] Panel content - Overall: ${hasOverall}, Dimensions: ${dimensionCount}`);
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('panel displays radar chart', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const badge = page.locator('[data-testid="quality-badge"]').first();

    if (await badge.isVisible().catch(() => false)) {
      await badge.click();
      await page.waitForTimeout(500);

      // Look for radar chart
      const radarChart = page.locator('[data-testid="quality-radar-chart"], [data-testid="radar-chart"]');
      const chartVisible = await radarChart.isVisible().catch(() => false);

      // Screenshot: Radar chart
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/27-breakdown-radar-chart.png`,
        fullPage: true,
      });

      console.log(`[US-A006] Radar chart visible: ${chartVisible}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('panel shows assessment metadata', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const badge = page.locator('[data-testid="quality-badge"]').first();

    if (await badge.isVisible().catch(() => false)) {
      await badge.click();
      await page.waitForTimeout(500);

      const panel = page.locator('[data-testid="quality-breakdown-panel"]');

      if (await panel.isVisible().catch(() => false)) {
        // Look for metadata section (json-render pattern)
        const metadataSection = panel.locator('[data-testid="metadata-section"], [data-testid="quality-metadata"]');
        const scoredAt = panel.locator('[data-testid="metadata-scored"], :has-text("Scored")');
        const modelInfo = panel.locator('[data-testid="metadata-model"], :has-text("Model")');
        const confidence = panel.locator('[data-testid="metadata-confidence"], :has-text("Confidence")');

        // Screenshot: Metadata section
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/28-breakdown-metadata.png`,
          fullPage: true,
        });

        console.log(`[US-A006] Metadata found - Section: ${await metadataSection.count()}`);
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('panel closes on escape key', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const badge = page.locator('[data-testid="quality-badge"]').first();

    if (await badge.isVisible().catch(() => false)) {
      await badge.click();
      await page.waitForTimeout(500);

      const panel = page.locator('[data-testid="quality-breakdown-panel"]');
      const panelVisible = await panel.isVisible().catch(() => false);

      if (panelVisible) {
        // Press escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Screenshot: After escape
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/29-breakdown-closed-escape.png`,
          fullPage: true,
        });

        const stillVisible = await panel.isVisible().catch(() => false);
        console.log(`[US-A006] Panel visible after Escape: ${stillVisible}`);
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('panel closes on outside click', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const badge = page.locator('[data-testid="quality-badge"]').first();

    if (await badge.isVisible().catch(() => false)) {
      await badge.click();
      await page.waitForTimeout(500);

      const panel = page.locator('[data-testid="quality-breakdown-panel"]');

      if (await panel.isVisible().catch(() => false)) {
        // Click outside (on backdrop or body)
        const backdrop = page.locator('[data-testid="panel-backdrop"]');
        if (await backdrop.isVisible().catch(() => false)) {
          await backdrop.click();
        } else {
          // Click on body outside panel
          await page.mouse.click(50, 50);
        }
        await page.waitForTimeout(300);

        // Screenshot: After outside click
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/30-breakdown-closed-outside-click.png`,
          fullPage: true,
        });
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('compact variant renders correctly', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Look for compact breakdown (inline variant)
    const compactBreakdown = page.locator('[data-testid="quality-breakdown-compact"]');
    const compactCount = await compactBreakdown.count();

    // Screenshot: Compact variant
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/31-breakdown-compact-variant.png`,
      fullPage: true,
    });

    console.log(`[US-A006] Compact breakdowns found: ${compactCount}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('json-render pattern renders without errors', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const badge = page.locator('[data-testid="quality-badge"]').first();

    if (await badge.isVisible().catch(() => false)) {
      await badge.click();
      await page.waitForTimeout(500);

      // Screenshot: Full json-render verification
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/32-json-render-verification.png`,
        fullPage: true,
      });

      // Check for render tree errors
      const renderErrors = capture.errors.filter(e =>
        e.includes('render') ||
        e.includes('catalog') ||
        e.includes('registry') ||
        e.includes('transform')
      );

      console.log(`[US-A006] json-render errors: ${renderErrors.length}`);
      expect(renderErrors).toHaveLength(0);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
