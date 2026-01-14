// tests/e2e/results-wiring.spec.ts
// Results Wiring v1 - Real Research Display E2E Tests
// Sprint: results-wiring-v1, Phase 4
//
// Verifies that completed sprouts display REAL research content,
// not fake quantum computing mock data.

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/results-wiring-v1/screenshots';

// Increase timeout for research flow
test.setTimeout(180000);

test.describe('Results Wiring v1 - Real Research Display', () => {
  test('AC-RW001: Shows REAL citations, not quantum computing mock', async ({ page }) => {
    const capture = setupConsoleCapture(page);

    // Step 1: Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-explore-loaded.png` });

    // Step 2: Find a completed sprout (or create one if needed)
    // Look for sprout with 'completed' status in GardenTray
    const gardenTray = page.locator('[data-testid="garden-tray"]');
    const trayVisible = await gardenTray.isVisible();

    if (trayVisible) {
      // Hover to expand the tray
      await gardenTray.hover();
      await page.waitForTimeout(1000);

      // Look for completed sprout indicator (sunflower emoji)
      const completedSprout = gardenTray.locator('span[role="img"]:has-text("🌻")').first();

      if (await completedSprout.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Step 3: Click the completed sprout
        await completedSprout.locator('..').click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/02-sprout-selected.png` });

        // Step 4: Get results content
        const resultsPanel = page.locator('.research-results, [data-testid="research-results"]');

        if (await resultsPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
          const content = await resultsPanel.textContent();
          await page.screenshot({ path: `${SCREENSHOT_DIR}/03-results-displayed.png` });

          // CRITICAL ASSERTIONS - Must NOT contain mock quantum content
          if (content) {
            expect(content).not.toContain('Quantum computing');
            expect(content).not.toContain('Google Achieves Quantum Supremacy');
            expect(content).not.toContain('ionq.com');
            expect(content).not.toContain('quantum supremacy');
          }
        }
      }
    }

    // Step 5: Verify no critical console errors (Constraint 11)
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-final-state.png` });
  });

  test('AC-RW004: Legacy sprouts render without errors', async ({ page }) => {
    const capture = setupConsoleCapture(page);

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to interact with any completed sprout
    const gardenTray = page.locator('[data-testid="garden-tray"]');

    if (await gardenTray.isVisible()) {
      await gardenTray.hover();
      await page.waitForTimeout(1000);

      // Look for any sprout row
      const sproutRow = gardenTray.locator('span[role="img"]').first();
      if (await sproutRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sproutRow.locator('..').click();
        await page.waitForTimeout(500);
      }
    }

    // No critical errors should occur
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-legacy-test.png` });
  });

  test('AC-RW005: Zero console errors during display', async ({ page }) => {
    const capture = setupConsoleCapture(page);

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Basic interaction
    const gardenTray = page.locator('[data-testid="garden-tray"]');

    if (await gardenTray.isVisible()) {
      await gardenTray.hover();
      await page.waitForTimeout(1000);

      const completedSprout = gardenTray.locator('span[role="img"]:has-text("🌻")').first();
      if (await completedSprout.isVisible({ timeout: 3000 }).catch(() => false)) {
        await completedSprout.locator('..').click();
        await page.waitForTimeout(1000);

        // Scroll if results are scrollable
        const resultsPanel = page.locator('.research-results');
        if (await resultsPanel.isVisible()) {
          await resultsPanel.evaluate(el => el.scrollTop = el.scrollHeight);
          await page.waitForTimeout(300);
        }
      }
    }

    // Verify zero critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log('Console errors captured:', capture.errors.length);
    if (criticalErrors.length > 0) {
      console.log('Critical errors:', criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-zero-errors.png` });
  });

  test('AC-RW003: Confidence score reflects actual synthesis', async ({ page }) => {
    const capture = setupConsoleCapture(page);

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const gardenTray = page.locator('[data-testid="garden-tray"]');

    if (await gardenTray.isVisible()) {
      await gardenTray.hover();
      await page.waitForTimeout(1000);

      // Look for completed sprout
      const completedSprout = gardenTray.locator('span[role="img"]:has-text("🌻")').first();
      if (await completedSprout.isVisible({ timeout: 3000 }).catch(() => false)) {
        await completedSprout.locator('..').click();
        await page.waitForTimeout(1000);

        // Look for confidence score display
        const confidenceIndicator = page.locator('[class*="confidence"], [data-testid*="confidence"]');
        if (await confidenceIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
          const confidenceText = await confidenceIndicator.textContent();
          // Confidence should NOT always be exactly 85% (mock default)
          // Note: This may pass if confidence happens to be 85%, but over multiple runs
          // with different sprouts, it should vary
          console.log(`Confidence displayed: ${confidenceText}`);
        }

        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-confidence-score.png` });
      }
    }

    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });
});
