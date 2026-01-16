// tests/e2e/observable-signals-v1.spec.ts
// Sprint: S6-SL-ObservableSignals v1
// Protocol: Grove Execution Protocol v1.5 - Constraint 11
// Visual verification and console monitoring for sprout signal instrumentation

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOTS_DIR = 'docs/sprints/observable-signals-v1/screenshots/e2e';

test.describe('Observable Signals v1 E2E Verification', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async ({}, testInfo) => {
    // Log critical errors if test failed
    const criticalErrors = getCriticalErrors(capture.errors);
    if (criticalErrors.length > 0) {
      console.log(`\n[${testInfo.title}] Critical console errors:`);
      criticalErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }
  });

  test('Epic 8: Nursery Console signals panel loads without errors', async ({ page }) => {
    // Step 1: Navigate to Bedrock Nursery Console
    console.log('Step 1: Navigating to Nursery Console...');
    await page.goto('http://localhost:3000/bedrock/nursery');
    await waitForPageStable(page);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/01-nursery-console.png`,
      fullPage: false,
    });
    console.log('Screenshot: Nursery Console captured');

    // Step 2: Click on a sprout card to open the editor (if any exist)
    const sproutCard = page.locator('[data-testid="sprout-card"]').first();
    const hasSprouts = (await sproutCard.count()) > 0;

    if (hasSprouts) {
      console.log('Step 2: Opening sprout editor...');
      await sproutCard.click();
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/02-sprout-editor.png`,
        fullPage: false,
      });
      console.log('Screenshot: Sprout Editor captured');

      // Step 3: Look for Usage Signals section
      const signalsSection = page.getByText('Usage Signals');
      const hasSignals = (await signalsSection.count()) > 0;

      if (hasSignals) {
        console.log('Step 3: Expanding Usage Signals section...');
        // Click to expand if collapsed
        await signalsSection.click();
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/03-signals-panel-expanded.png`,
          fullPage: false,
        });
        console.log('Screenshot: Signals panel expanded');
      } else {
        console.log('Usage Signals section not visible (may be collapsed by default)');
      }
    } else {
      console.log('No sprouts found - capturing empty console state');
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/02-nursery-empty.png`,
        fullPage: false,
      });
    }

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No critical console errors detected');
  });

  test('Epic 9: Finishing Room signals section loads without errors', async ({ page }) => {
    // Step 1: Navigate to explore route
    console.log('Step 1: Navigating to /explore...');
    await page.goto('http://localhost:3000/explore');
    await waitForPageStable(page);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/04-explore-page.png`,
      fullPage: false,
    });
    console.log('Screenshot: Explore page captured');

    // Step 2: Look for sprout cards in the garden tray or elsewhere
    const sproutCard = page.locator('[data-testid="sprout-card"]').first();
    const gardenTray = page.locator('[data-testid="garden-tray"]');
    const hasTray = (await gardenTray.count()) > 0;
    const hasSprouts = (await sproutCard.count()) > 0;

    if (hasTray) {
      console.log('Step 2: Garden tray found, checking for sprouts...');
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/05-garden-tray.png`,
        fullPage: false,
      });
    }

    if (hasSprouts) {
      console.log('Step 3: Clicking sprout card to open Finishing Room...');
      await sproutCard.click();
      await page.waitForTimeout(2000);

      // Look for the modal/finishing room
      const modal = page.locator('[data-testid="sprout-finishing-room"], .finishing-room-modal, [role="dialog"]').first();
      const hasModal = (await modal.count()) > 0;

      if (hasModal) {
        await page.screenshot({
          path: `${SCREENSHOTS_DIR}/06-finishing-room.png`,
          fullPage: false,
        });
        console.log('Screenshot: Finishing Room captured');

        // Look for Usage Signals collapsible section in provenance panel
        const signalsSection = page.getByText('Usage Signals');
        const hasSignals = (await signalsSection.count()) > 0;

        if (hasSignals) {
          console.log('Step 4: Found Usage Signals in Finishing Room');
          await signalsSection.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: `${SCREENSHOTS_DIR}/07-finishing-room-signals.png`,
            fullPage: false,
          });
          console.log('Screenshot: Finishing Room signals section captured');
        }
      }
    } else {
      console.log('No sprouts available for Finishing Room test');
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/05-no-sprouts.png`,
        fullPage: false,
      });
    }

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No critical console errors detected');
  });

  test('Signal emission hook loads without errors', async ({ page }) => {
    // Test that pages with signal emission don't throw errors
    console.log('Step 1: Loading explore page with signal instrumentation...');
    await page.goto('http://localhost:3000/explore');
    await waitForPageStable(page);

    // Navigate around to trigger any potential signal emission errors
    console.log('Step 2: Checking console for signal-related errors...');

    // Look for any sprout-related UI and interact
    const anyButton = page.locator('button').first();
    if ((await anyButton.count()) > 0) {
      await anyButton.hover();
    }

    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/08-signal-instrumentation.png`,
      fullPage: false,
    });
    console.log('Screenshot: Signal instrumentation page captured');

    // Verify no critical console errors from signal emission
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
    console.log('✅ No critical console errors during signal instrumentation');
  });
});
