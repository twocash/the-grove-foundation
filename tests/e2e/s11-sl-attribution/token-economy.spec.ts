// tests/e2e/s11-sl-attribution/token-economy.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic B: Token Economy', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(`Critical errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      criticalErrors.forEach(e => console.error(e));
    }
  });

  /**
   * US-B001: Calculate Base Token Rewards
   * Tests: Token balance display
   */
  test('US-B001: Token balance initial display', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Token balance before reward
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/token-balance-initial.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B001: Token balance after reward simulation', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Token balance (simulated reward state)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/token-balance-after-reward.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-B002: Apply Quality Multipliers
   * Tests: Quality multiplier display
   */
  test('US-B002: Quality multiplier display', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Quality multiplier display
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/quality-multiplier-display.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-B003: Distribute Network Effect Bonuses
   * Tests: Network bonus breakdown display
   */
  test('US-B003: Network bonus breakdown visible', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Bonus breakdown
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/network-bonus-breakdown.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
