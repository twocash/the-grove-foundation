// tests/e2e/debug-research-timeout.spec.ts
// DEBUG: Investigate writing timeout issue with proper sprout: prefix

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/research-writer-panel-v1/screenshots';

test.setTimeout(180000); // 3 min for full research

test('DEBUG: Research flow with sprout: prefix', async ({ page }) => {
  const capture = setupConsoleCapture(page);

  // Navigate to explore
  await page.goto('/explore');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: `${SCREENSHOT_DIR}/timeout-01-initial.png`,
    fullPage: false
  });
  console.log('[DEBUG] Initial page loaded');

  // Type a PROPER research query with sprout: prefix
  const query = 'sprout: What are the benefits of local AI?';

  // Find the input area
  const inputArea = page.locator('[contenteditable="true"], textarea, input[type="text"]').first();

  if (await inputArea.isVisible().catch(() => false)) {
    console.log('[DEBUG] Typing query with sprout: prefix...');
    await inputArea.click();
    await inputArea.fill(query);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/timeout-02-query-with-prefix.png`,
      fullPage: false
    });

    // Press Enter to submit
    await inputArea.press('Enter');
    console.log('[DEBUG] Query submitted, waiting for GardenInspector confirmation dialog...');
  }

  // Wait for GardenInspector confirmation dialog
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: `${SCREENSHOT_DIR}/timeout-03-confirmation-dialog.png`,
    fullPage: false
  });

  // Look for confirmation button in the dialog
  const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Start Research"), button:has-text("Create Sprout")').first();
  const confirmVisible = await confirmButton.isVisible().catch(() => false);
  console.log(`[DEBUG] Confirm button visible: ${confirmVisible}`);

  if (confirmVisible) {
    console.log('[DEBUG] Clicking confirm button...');
    await confirmButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/timeout-04-research-starting.png`,
      fullPage: false
    });
  } else {
    console.log('[DEBUG] No confirm button found, checking for auto-start...');
  }

  // Wait and monitor progress
  console.log('[DEBUG] Monitoring research progress (up to 120s)...');

  for (let i = 1; i <= 12; i++) {
    await page.waitForTimeout(10000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/timeout-05-progress-${String(i).padStart(2, '0')}.png`,
      fullPage: false
    });

    // Log pipeline messages
    const pipelineMessages = capture.messages.filter(m =>
      m.includes('[Pipeline]') ||
      m.includes('[WriterAgent]') ||
      m.includes('[ExploreShell]')
    );
    console.log(`\n[DEBUG] After ${i * 10}s:`);
    console.log(`  Pipeline messages: ${pipelineMessages.length}`);
    pipelineMessages.slice(-5).forEach(m => console.log(`    ${m.substring(0, 150)}`));

    // Check for timeout
    const timeoutMsg = capture.messages.find(m => m.includes('timed out'));
    if (timeoutMsg) {
      console.log(`[DEBUG] TIMEOUT DETECTED: ${timeoutMsg}`);
      break;
    }

    // Check for completion
    const completeMsg = capture.messages.find(m =>
      m.includes('Research completed') ||
      m.includes('Pipeline complete')
    );
    if (completeMsg) {
      console.log(`[DEBUG] COMPLETION DETECTED: ${completeMsg}`);
      break;
    }
  }

  // Final screenshot
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/timeout-06-final-state.png`,
    fullPage: false
  });

  // Check GardenTray for sprout status
  const gardenTray = page.locator('[data-testid="garden-tray"]');
  if (await gardenTray.isVisible().catch(() => false)) {
    console.log('[DEBUG] Garden tray visible, checking sprout statuses...');

    // Expand the tray to see sprout details
    const trayContent = await gardenTray.textContent().catch(() => '');
    console.log('[DEBUG] Garden tray content preview:', trayContent?.substring(0, 200));
  }

  // Log all errors
  console.log('\n=== ALL CONSOLE ERRORS ===');
  capture.errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err.substring(0, 250)}`);
  });

  // Log critical pipeline messages
  console.log('\n=== PIPELINE FLOW ===');
  capture.messages
    .filter(m =>
      m.includes('[Pipeline]') ||
      m.includes('[WriterAgent]') ||
      m.includes('[ExploreShell]') ||
      m.includes('Research') ||
      m.includes('error')
    )
    .forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.substring(0, 250)}`);
    });
});
