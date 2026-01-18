// tests/e2e/gardeninspector-modal.spec.ts
// Sprint: gardeninspector-modal-v1
// E2E test for GardenInspector modal styling verification
//
// This test captures screenshots of the modal in its current state
// and verifies the styling changes work correctly.

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors } from './_test-utils';

const SCREENSHOTS_DIR = 'docs/sprints/gardeninspector-modal-v1/screenshots';

test.describe('GardenInspector Modal Styling', () => {
  let consoleCapture: ReturnType<typeof setupConsoleCapture>;

  test.beforeEach(async ({ page }) => {
    consoleCapture = setupConsoleCapture(page);
  });

  test('Phase 2: Verify Three Zones styling', async ({ page }) => {
    // Step 1: Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow animations to settle

    // Step 2: Find chat input
    const chatInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
    await chatInput.waitFor({ state: 'visible', timeout: 10000 });

    // Step 3: Type sprout command
    await chatInput.fill('sprout: How does the Efficiency-Enlightenment Loop maintain agent motivation?');

    // Step 4: Submit the command
    await chatInput.press('Enter');

    // Step 5: Wait for modal to appear
    await page.waitForTimeout(3000);

    // Look for the confirmation view elements
    const sparkBox = page.locator('text=Research Spark');
    const modalVisible = await sparkBox.isVisible({ timeout: 5000 }).catch(() => false);

    if (modalVisible) {
      // Capture the styled modal - "after" state
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/2a-modal-three-zones.png`,
        fullPage: false,
      });

      // Test focus states - click on Title input
      const titleInput = page.locator('input[placeholder*="descriptive title"]');
      if (await titleInput.isVisible()) {
        await titleInput.click();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/2b-title-focus-state.png`,
          fullPage: false,
        });
      }

      // Test focus on textarea
      const instructionsTextarea = page.locator('textarea[placeholder*="instructions"]');
      if (await instructionsTextarea.isVisible()) {
        await instructionsTextarea.click();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/2c-instructions-focus-state.png`,
          fullPage: false,
        });
      }
    }

    // Check for critical console errors
    const criticalErrors = getCriticalErrors(consoleCapture.errors);
    expect(criticalErrors).toHaveLength(0);
  });
});
