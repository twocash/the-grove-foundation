// tests/e2e/debug-failed-sprout.spec.ts
// DEBUG: Click on failed sprout to see error

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/research-writer-panel-v1/screenshots';

test.setTimeout(60000);

test('DEBUG: Click failed sprout to see error', async ({ page }) => {
  const capture = setupConsoleCapture(page);

  // Go to explore
  await page.goto('/explore');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Screenshot the tray
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/debug-sprout-01-tray.png`,
    fullPage: false
  });

  // Look for sprouts in tray - they have data-testid or are in a specific area
  // The tray appears to be on the right side
  const sproutTray = page.locator('[data-testid="garden-tray"], .garden-tray');
  const trayVisible = await sproutTray.first().isVisible().catch(() => false);
  console.log(`[DEBUG] Sprout tray visible: ${trayVisible}`);

  // Find all clickable sprout items - look for elements with X icon or blocked status
  const allSprouts = page.locator('[data-testid="sprout-card"], [data-sprout-id], .sprout-card, .sprout-item');
  const sproutCount = await allSprouts.count();
  console.log(`[DEBUG] Found ${sproutCount} sprouts with standard selectors`);

  // Try to find sprouts in the right panel area
  const rightPanelSprouts = page.locator('.fixed.right-0 button, .absolute.right-0 button');
  const rightCount = await rightPanelSprouts.count();
  console.log(`[DEBUG] Found ${rightCount} buttons in right panel`);

  // Click the FIRST sprout in the tray (the one with X)
  const firstButton = rightPanelSprouts.first();
  if (await firstButton.isVisible().catch(() => false)) {
    console.log('[DEBUG] Clicking first right panel button...');
    await firstButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/debug-sprout-02-clicked.png`,
      fullPage: false
    });
  }

  // Look for any modal or dialog that opens
  const modal = page.locator('[data-testid="sprout-finishing-room"], [role="dialog"], .modal, [class*="modal"]');
  const modalVisible = await modal.first().isVisible().catch(() => false);
  console.log(`[DEBUG] Modal visible: ${modalVisible}`);

  if (modalVisible) {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/debug-sprout-03-modal.png`,
      fullPage: false
    });

    // Look for error message in modal
    const errorText = page.locator('text=/error|failed|blocked/i');
    const errorCount = await errorText.count();
    console.log(`[DEBUG] Error text elements: ${errorCount}`);

    // Get the modal content
    const modalContent = await modal.first().textContent().catch(() => '');
    console.log(`[DEBUG] Modal content preview: ${modalContent?.substring(0, 500)}`);
  }

  // Also try clicking on items with red X specifically
  const redX = page.locator('svg[class*="text-red"], .text-red-500, [class*="blocked"], [class*="failed"]');
  const xCount = await redX.count();
  console.log(`[DEBUG] Found ${xCount} red X / blocked indicators`);

  // Log all console errors
  console.log('\n=== CONSOLE ERRORS ===');
  capture.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });

  console.log('\n=== RELEVANT CONSOLE LOGS ===');
  capture.messages
    .filter(m => m.toLowerCase().includes('error') ||
                m.toLowerCase().includes('fail') ||
                m.toLowerCase().includes('research') ||
                m.toLowerCase().includes('pipeline') ||
                m.toLowerCase().includes('writer') ||
                m.toLowerCase().includes('sprout'))
    .forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.substring(0, 300)}`);
    });
});
