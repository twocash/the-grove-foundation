// tests/e2e/research-lifecycle-e2e.spec.ts
// End-to-end research lifecycle verification
// Sprint: polish-demo-prep-v1 - Race condition fix verification
//
// This test creates a research sprout and monitors for console errors
// throughout the entire lifecycle: pending → active → completed

import { test, expect, type ConsoleMessage } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/polish-demo-prep-v1/screenshots/e2e';

// Increase timeout for full research flow
test.setTimeout(180000);

test.describe('Research Lifecycle E2E - Race Condition Fix Verification', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let consoleMessages: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset console capture
    consoleErrors = [];
    consoleWarnings = [];
    consoleMessages = [];

    // Capture ALL console output
    page.on('console', (msg: ConsoleMessage) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      consoleErrors.push(`[UNCAUGHT] ${error.message}`);
    });
  });

  test('Full research lifecycle: create → research → complete → view results', async ({ page }) => {
    console.log('=== STARTING RESEARCH LIFECYCLE E2E TEST ===');

    // Step 1: Navigate to explore
    console.log('\n--- Step 1: Navigate to /explore ---');
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-explore-loaded.png`,
      fullPage: false,
    });

    console.log(`Console errors so far: ${consoleErrors.length}`);
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    // Step 2: Find input and enter research query
    console.log('\n--- Step 2: Enter research query ---');
    const input = page.locator('textarea, input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });

    // Use a simple research query for testing
    const testQuery = 'sprout: What is local AI hardware ownership?';
    await input.fill(testQuery);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-query-entered.png`,
      fullPage: false,
    });

    // Step 3: Submit the query
    console.log('\n--- Step 3: Submit research query ---');
    await input.press('Enter');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-query-submitted.png`,
      fullPage: false,
    });

    // Step 3b: Wait for and click confirmation dialog
    console.log('\n--- Step 3b: Handle confirmation dialog ---');
    const startResearchButton = page.locator('button:has-text("Start Research")');

    // Wait for confirmation dialog to appear
    await expect(startResearchButton).toBeVisible({ timeout: 15000 });
    console.log('Confirmation dialog appeared, clicking Start Research...');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03b-confirmation-dialog.png`,
      fullPage: false,
    });

    await startResearchButton.click();
    console.log('Start Research clicked!');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03c-research-started.png`,
      fullPage: false,
    });

    // Check for any early errors (like "Sprout not found")
    const criticalErrors = consoleErrors.filter(e =>
      e.includes('Sprout not found') ||
      e.includes('Invalid status transition') ||
      e.includes('Cannot read properties')
    );

    if (criticalErrors.length > 0) {
      console.log('\n!!! CRITICAL ERRORS DETECTED !!!');
      criticalErrors.forEach(e => console.log(`  - ${e}`));
    }

    // Step 4: Wait for research to start (look for GardenTray or progress indicators)
    console.log('\n--- Step 4: Wait for research to start ---');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-research-starting.png`,
      fullPage: false,
    });

    // Look for GardenTray showing active sprout
    const gardenTray = page.locator('[class*="garden"], [class*="sprout"], [class*="tray"]');
    const gardenVisible = await gardenTray.count() > 0;
    console.log(`Garden/Sprout UI visible: ${gardenVisible}`);

    // Step 5: Monitor research progress (up to 90 seconds)
    console.log('\n--- Step 5: Monitoring research progress ---');

    for (let i = 0; i < 9; i++) {
      await page.waitForTimeout(10000);
      console.log(`  Progress check ${i + 1}/9 (${(i + 1) * 10}s elapsed)`);
      console.log(`  Console errors: ${consoleErrors.length}, warnings: ${consoleWarnings.length}`);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-progress-${String(i + 1).padStart(2, '0')}.png`,
        fullPage: false,
      });

      // Check for completion or error indicators
      const completedIndicator = page.locator('text=/complete|finished|done/i');
      const errorIndicator = page.locator('text=/error|failed/i');

      if (await completedIndicator.count() > 0) {
        console.log('  Research appears complete!');
        break;
      }
      if (await errorIndicator.count() > 0) {
        console.log('  Research appears to have failed (UI shows error)');
        break;
      }

      // Check for critical console errors
      const newCriticalErrors = consoleErrors.filter(e =>
        e.includes('Sprout not found') ||
        e.includes('Invalid status transition') ||
        e.includes('Cannot read properties')
      );

      if (newCriticalErrors.length > 0) {
        console.log('\n!!! CRITICAL ERROR DURING RESEARCH !!!');
        newCriticalErrors.forEach(e => console.log(`  - ${e}`));
        break;
      }
    }

    // Step 6: Final state capture
    console.log('\n--- Step 6: Final state capture ---');
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-final-state.png`,
      fullPage: false,
    });

    // Step 7: Hover over GardenTray to expand and test SproutRow
    console.log('\n--- Step 7: Test GardenTray and SproutRow interaction ---');

    // GardenTray uses data-testid="garden-tray" and expands on hover
    const gardenTrayElement = page.locator('[data-testid="garden-tray"]');
    const trayCount = await gardenTrayElement.count();
    console.log(`Found ${trayCount} GardenTray elements`);

    if (trayCount > 0) {
      // Hover to expand the tray
      await gardenTrayElement.first().hover();
      await page.waitForTimeout(1500); // Wait for expansion animation
      console.log('Hovering over GardenTray to expand');

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/07-garden-tray-expanded.png`,
        fullPage: false,
      });

      // Look for completed sprout row (🌻 emoji in a span, not in option/select)
      // The SproutRow component has a span with role="img" containing the emoji
      const completedSproutRow = gardenTrayElement.locator('span[role="img"]:has-text("🌻")').first();
      const completedCount = await completedSproutRow.count();
      console.log(`Found ${completedCount} completed sprout row indicators`);

      if (completedCount > 0) {
        console.log('Clicking on completed sprout row to expand results...');
        // Click the parent row div, not just the emoji
        await completedSproutRow.locator('..').click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/07b-sprout-results-expanded.png`,
          fullPage: false,
        });

        // Check for SproutRow expansion errors
        const expansionErrors = consoleErrors.filter(e =>
          e.includes('Cannot read properties') ||
          e.includes("reading 'length'")
        );

        if (expansionErrors.length > 0) {
          console.log('!!! SPROUTROW EXPANSION ERRORS !!!');
          expansionErrors.forEach(e => console.log(`  - ${e}`));
        } else {
          console.log('SproutRow expansion worked without errors');
        }
      } else {
        console.log('No completed sprout (🌻) visible in tray');
      }
    } else {
      console.log('GardenTray not found');
    }

    // Final error report
    console.log('\n=== CONSOLE ERROR SUMMARY ===');
    console.log(`Total errors: ${consoleErrors.length}`);
    console.log(`Total warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nErrors:');
      consoleErrors.forEach(e => console.log(`  - ${e}`));
    }

    // Test assertions
    const criticalErrorsFinal = consoleErrors.filter(e =>
      e.includes('Sprout not found') ||
      e.includes('Invalid status transition') ||
      e.includes('Cannot read properties') ||
      e.includes('Unexpected Application Error')
    );

    console.log(`\nCritical errors found: ${criticalErrorsFinal.length}`);

    // This test passes if no critical errors occurred
    expect(criticalErrorsFinal).toHaveLength(0);
  });

  test('SproutRow expansion: verify synthesis field safety', async ({ page }) => {
    console.log('=== TESTING SPROUTROW EXPANSION SAFETY ===');

    // Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for any existing sprouts in the GardenTray
    const tray = page.locator('[class*="garden"], [class*="tray"]');
    const trayVisible = await tray.count() > 0;

    console.log(`Garden tray visible: ${trayVisible}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-sproutrow-test-initial.png`,
      fullPage: false,
    });

    // If tray is visible, try to expand it and click on sprouts
    if (trayVisible) {
      // Try clicking on expand buttons or sprout rows
      const expandButtons = page.locator('button, [role="button"]').filter({ hasText: /▶|▼|expand/i });
      const expandCount = await expandButtons.count();
      console.log(`Found ${expandCount} potential expand buttons`);

      if (expandCount > 0) {
        await expandButtons.first().click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/09-sproutrow-expanded.png`,
          fullPage: false,
        });
      }
    }

    // Check for errors
    const rowErrors = consoleErrors.filter(e =>
      e.includes('Cannot read properties') ||
      e.includes('undefined')
    );

    console.log(`SproutRow-related errors: ${rowErrors.length}`);
    expect(rowErrors).toHaveLength(0);
  });
});
