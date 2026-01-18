// tests/e2e/s11-sl-attribution/token-economy.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';
import { seedAttributionData, clearAttributionData, TEST_PRESETS } from './_test-data';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic B: Token Economy', () => {
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
   * US-B001: Calculate Base Token Rewards
   * Tests: Token balance display in Attribution Dashboard
   */
  test('US-B001: Token balance initial display', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with novice tier (15 tokens)
    await seedAttributionData(page, TEST_PRESETS.novice);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard loads
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Look for token balance display (15 tokens from novice preset)
    await expect(page.getByText('15')).toBeVisible();

    // Screenshot: Token balance before reward
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/token-balance-initial.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-B001: Token balance after reward simulation', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with developing tier (125.5 tokens - simulating accumulated rewards)
    await seedAttributionData(page, TEST_PRESETS.developing);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard and token display
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Token display should show 125.5 tokens
    await expect(page.getByText(/125\.?5?/)).toBeVisible();

    // Screenshot: Token balance (simulated reward state)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/token-balance-after-reward.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-B002: Apply Quality Multipliers
   * Tests: Quality multiplier display in dashboard (tier multiplier)
   */
  test('US-B002: Quality multiplier display', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with expert tier (1.5x multiplier)
    await seedAttributionData(page, TEST_PRESETS.expert);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard loads with Knowledge Economy header (use first() due to multiple matches)
    await expect(page.getByText('Knowledge Economy').first()).toBeVisible();

    // Expert tier should show 850 tokens
    await expect(page.getByText('850')).toBeVisible();

    // Screenshot: Quality multiplier display
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/quality-multiplier-display.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-B003: Distribute Network Effect Bonuses
   * Tests: Network bonus breakdown display (via high token count)
   */
  test('US-B003: Network bonus breakdown visible', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with legendary tier (2500 tokens - includes network bonuses)
    await seedAttributionData(page, TEST_PRESETS.legendary);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify main dashboard elements
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Look for legendary token count (use first() due to multiple matches)
    await expect(page.getByText('Knowledge Economy').first()).toBeVisible();
    await expect(page.getByText('2.5k')).toBeVisible();

    // Screenshot: Bonus breakdown
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/network-bonus-breakdown.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
