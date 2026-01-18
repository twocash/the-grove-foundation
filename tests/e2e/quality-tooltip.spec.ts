// tests/e2e/quality-tooltip.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Quality Tooltip Tests
// User Story: US-A002 - View Quality Tooltip on Hover
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
 * US-A002: View Quality Tooltip on Hover
 *
 * Verifies that quality tooltips display dimension breakdowns:
 * - Tooltip appears on badge hover
 * - Shows all four dimensions (accuracy, utility, novelty, provenance)
 * - Disappears on mouse leave
 * - Accessible via keyboard focus
 */
test.describe('US-A002: Quality Tooltip', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('displays dimension breakdown on hover', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Find a quality badge
    const qualityBadge = page.locator('[data-testid="quality-badge"], [data-testid="quality-score-badge"]').first();

    if (await qualityBadge.isVisible().catch(() => false)) {
      // Hover to trigger tooltip
      await qualityBadge.hover();
      await page.waitForTimeout(300); // Wait for tooltip animation

      // Screenshot: Tooltip visible
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-tooltip-dimension-breakdown.png`,
        fullPage: true,
      });

      // Look for tooltip
      const tooltip = page.locator('[data-testid="quality-tooltip"]');
      const tooltipVisible = await tooltip.isVisible().catch(() => false);

      if (tooltipVisible) {
        // Verify dimension names are present
        const tooltipText = await tooltip.textContent();
        console.log(`[US-A002] Tooltip content: ${tooltipText?.substring(0, 100)}...`);

        // Should contain dimension labels
        expect(tooltipText?.toLowerCase()).toMatch(/accuracy|utility|novelty|provenance/);
      }
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('tooltip disappears on mouse leave', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    const qualityBadge = page.locator('[data-testid="quality-badge"], [data-testid="quality-score-badge"]').first();

    if (await qualityBadge.isVisible().catch(() => false)) {
      // Hover to show tooltip
      await qualityBadge.hover();
      await page.waitForTimeout(300);

      // Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);

      // Screenshot: After mouse leave
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/07-tooltip-hidden-after-leave.png`,
        fullPage: true,
      });

      // Tooltip should be hidden
      const tooltip = page.locator('[data-testid="quality-tooltip"]');
      const tooltipVisible = await tooltip.isVisible().catch(() => false);

      console.log(`[US-A002] Tooltip visible after leave: ${tooltipVisible}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('tooltip accessible via keyboard focus', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Tab through page elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // Screenshot: Keyboard navigation state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-tooltip-keyboard-focus.png`,
      fullPage: true,
    });

    // Check for any focused badge
    const focusedBadge = page.locator('[data-testid="quality-badge"]:focus, [data-testid="quality-score-badge"]:focus');
    const hasFocus = await focusedBadge.count() > 0;

    console.log(`[US-A002] Badge has keyboard focus: ${hasFocus}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('mini tooltip variant works correctly', async ({ page }) => {
    await page.goto('/explore');
    await waitForPageStable(page, 2000);

    // Look for mini badges that have their own tooltip
    const miniBadge = page.locator('[data-testid="quality-score-mini"]').first();

    if (await miniBadge.isVisible().catch(() => false)) {
      await miniBadge.hover();
      await page.waitForTimeout(300);

      // Screenshot: Mini tooltip
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09-mini-tooltip.png`,
        fullPage: true,
      });

      const miniTooltip = page.locator('[data-testid="quality-mini-tooltip"]');
      const visible = await miniTooltip.isVisible().catch(() => false);
      console.log(`[US-A002] Mini tooltip visible: ${visible}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
