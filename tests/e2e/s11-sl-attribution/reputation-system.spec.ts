// tests/e2e/s11-sl-attribution/reputation-system.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';
import { seedAttributionData, clearAttributionData, TEST_PRESETS } from './_test-data';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic C: Reputation System', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async ({ page }) => {
    await clearAttributionData(page);
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(`Critical errors: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      criticalErrors.forEach(e => console.error(e));
    }
  });

  /**
   * US-C001: Track Reputation Scores
   * Tests: Reputation tier badge display - novice tier
   */
  test('US-C001: Reputation badge novice tier display', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with novice tier
    await seedAttributionData(page, TEST_PRESETS.novice);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard loads
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Look for novice tier text
    await expect(page.getByText(/novice/i).first()).toBeVisible();

    // Verify token count (15 tokens)
    await expect(page.getByText('15')).toBeVisible();

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
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with expert tier
    await seedAttributionData(page, TEST_PRESETS.expert);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard is visible
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Knowledge Economy header should be visible (use first() due to multiple matches)
    await expect(page.getByText('Knowledge Economy').first()).toBeVisible();

    // Look for expert tier text
    await expect(page.getByText(/expert/i).first()).toBeVisible();

    // Verify token count (850 tokens)
    await expect(page.getByText('850')).toBeVisible();

    // Screenshot: Expert badge
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-badge-expert.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-C002: Reputation badge legendary tier display', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with legendary tier
    await seedAttributionData(page, TEST_PRESETS.legendary);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard structure
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Look for legendary tier text
    await expect(page.getByText(/legendary/i).first()).toBeVisible();

    // Verify token count (2500 tokens)
    await expect(page.getByText('2.5k')).toBeVisible();

    // Screenshot: Legendary badge
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-badge-legendary.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-C002: Reputation leaderboard displays', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with developing tier (3 badges)
    await seedAttributionData(page, TEST_PRESETS.developing);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify main elements
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Verify developing tier
    await expect(page.getByText(/developing/i).first()).toBeVisible();

    // Verify contribution count (12 contributions)
    await expect(page.getByText('Contributions')).toBeVisible();
    await expect(page.getByText('12', { exact: true })).toBeVisible();

    // Screenshot: Leaderboard/badges section
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/reputation-leaderboard.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
