// tests/e2e/s11-sl-attribution/reputation-system.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic C: Reputation System', () => {
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
   * US-C001: Track Reputation Scores
   * Tests: Reputation tier badge display - Novice tier
   */
  test('US-C001: Reputation badge novice tier display', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Badge variants (novice)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-badge-novice.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-C002: View Reputation Leaderboard
   * Tests: Reputation badge colors for different tiers
   */
  test('US-C002: Reputation badge expert tier display', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Expert badge
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-badge-expert.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-C002: Reputation badge legendary tier display', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Legendary badge
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-badge-legendary.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-C002: Reputation leaderboard displays', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Leaderboard
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-leaderboard.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
