// tests/e2e/debug-research-flow.spec.ts
// DEBUG: Actually run research and capture what happens

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/research-writer-panel-v1/screenshots';

test.setTimeout(180000); // 3 minutes for full research flow

test.describe('DEBUG: Actual Research Flow', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Run actual research and capture results', async ({ page }) => {
    console.log('[DEBUG] Starting actual research flow test...');

    // Step 1: Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/debug-01-explore-initial.png`,
      fullPage: false
    });

    // Step 2: Find and click the research input
    console.log('[DEBUG] Looking for research input...');

    // Look for the spark input field
    const sparkInput = page.locator('input[placeholder*="spark"], input[placeholder*="research"], textarea[placeholder*="spark"], textarea[placeholder*="research"]');
    const sparkInputCount = await sparkInput.count();
    console.log(`[DEBUG] Found ${sparkInputCount} spark inputs`);

    if (sparkInputCount === 0) {
      // Try clicking on "New Sprout" or similar button
      const newSproutBtn = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Sprout")');
      const btnCount = await newSproutBtn.count();
      console.log(`[DEBUG] Found ${btnCount} potential new sprout buttons`);

      if (btnCount > 0) {
        await newSproutBtn.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/debug-02-after-new-click.png`,
          fullPage: false
        });
      }
    }

    // Step 3: Look for ANY input field and type a research query
    const anyInput = page.locator('input:visible, textarea:visible').first();
    const inputVisible = await anyInput.isVisible().catch(() => false);

    if (inputVisible) {
      console.log('[DEBUG] Found visible input, typing research query...');
      await anyInput.fill('What is the future of AI governance?');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/debug-03-query-entered.png`,
        fullPage: false
      });

      // Press Enter or click submit
      await anyInput.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Step 4: Look for research/start button
    const researchBtn = page.locator('button:has-text("Research"), button:has-text("Start"), button:has-text("Go"), button[type="submit"]');
    const researchBtnCount = await researchBtn.count();
    console.log(`[DEBUG] Found ${researchBtnCount} potential research buttons`);

    if (researchBtnCount > 0) {
      await researchBtn.first().click();
      console.log('[DEBUG] Clicked research button, waiting for results...');
    }

    // Step 5: Wait for research to complete (or fail)
    console.log('[DEBUG] Waiting for research response...');
    await page.waitForTimeout(30000); // Wait 30 seconds for research

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/debug-04-after-research.png`,
      fullPage: false
    });

    // Step 6: Check for sprout cards in the tray
    const sproutCards = page.locator('[data-testid="sprout-card"]');
    const sproutCount = await sproutCards.count();
    console.log(`[DEBUG] Sprout cards in tray: ${sproutCount}`);

    // Step 7: If there are sprouts, click the first one
    if (sproutCount > 0) {
      console.log('[DEBUG] Clicking first sprout card...');
      await sproutCards.first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/debug-05-sprout-clicked.png`,
        fullPage: false
      });

      // Check for modal
      const modal = page.locator('[data-testid="sprout-finishing-room"], [role="dialog"], .modal');
      const modalVisible = await modal.first().isVisible().catch(() => false);
      console.log(`[DEBUG] Modal visible: ${modalVisible}`);

      if (modalVisible) {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/debug-06-modal-open.png`,
          fullPage: false
        });
      }
    }

    // Step 8: Log all console output
    console.log('\n=== ALL CONSOLE MESSAGES ===');
    capture.messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.substring(0, 200)}`);
    });

    console.log('\n=== ALL CONSOLE ERRORS ===');
    capture.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });

    console.log('\n=== ALL CONSOLE WARNINGS ===');
    capture.warnings.forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.substring(0, 200)}`);
    });

    // Check for API errors in network
    console.log('\n[DEBUG] Test complete');

    // Final screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/debug-07-final-state.png`,
      fullPage: true
    });

    // Report critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(`\n[DEBUG] Critical errors: ${criticalErrors.length}`);
    criticalErrors.forEach((e, i) => console.log(`  CRITICAL ${i + 1}: ${e}`));
  });
});
