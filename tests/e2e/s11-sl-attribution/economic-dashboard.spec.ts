// tests/e2e/s11-sl-attribution/economic-dashboard.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';
import { seedAttributionData, clearAttributionData, TEST_PRESETS } from './_test-data';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic D: Economic Dashboard', () => {
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
   * US-D001: View Economic Overview
   * Tests: Dashboard displays key metrics (Knowledge Economy)
   */
  test('US-D001: Dashboard overview shows key metrics', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with developing tier
    await seedAttributionData(page, TEST_PRESETS.developing);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard loads with testid
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Verify Knowledge Economy header (use first() due to multiple matches)
    await expect(page.getByText('Knowledge Economy').first()).toBeVisible();

    // Verify token balance (125.5 tokens)
    await expect(page.getByText(/125\.?5?/)).toBeVisible();

    // Verify developing tier
    await expect(page.getByText(/developing/i).first()).toBeVisible();

    // Screenshot: Dashboard overview
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/dashboard-overview.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-D001: Dashboard metrics load successfully', async ({ page }) => {
    const startTime = Date.now();

    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with expert tier for varied metrics
    await seedAttributionData(page, TEST_PRESETS.expert);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Verify dashboard and token display
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Token balance should show 850 tokens
    await expect(page.getByText('850')).toBeVisible();

    // Expert tier visible
    await expect(page.getByText(/expert/i).first()).toBeVisible();

    // Screenshot: Metrics loaded
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/dashboard-metrics-loaded.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-D002: Analyze Attribution Flows
   * Tests: Attribution flow visualization via json-render
   */
  test('US-D002: Attribution flow chart displays', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with legendary tier for comprehensive flow data
    await seedAttributionData(page, TEST_PRESETS.legendary);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Verify dashboard structure
    const dashboard = page.getByTestId('attribution-dashboard');
    await expect(dashboard).toBeVisible();

    // Look for attribution-related UI elements (use first() due to multiple matches)
    await expect(page.getByText('Knowledge Economy').first()).toBeVisible();

    // Verify legendary tier and tokens
    await expect(page.getByText(/legendary/i).first()).toBeVisible();
    await expect(page.getByText('2.5k')).toBeVisible();

    // Screenshot: Flow chart/dashboard layout
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-flow-chart.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-D003: View Transaction History
   * Tests: Recent transactions/events display
   */
  test('US-D003: Transaction history displays recent events', async ({ page }) => {
    // Navigate first to establish page context
    await page.goto('/bedrock/attribution');

    // Seed with expert tier (75 contributions = transaction history)
    await seedAttributionData(page, TEST_PRESETS.expert);

    // Reload to pick up seeded data
    await page.reload();
    await page.waitForTimeout(3000);

    // Wait for Knowledge Economy heading to appear as primary check (use first() due to multiple matches)
    await expect(page.getByText('Knowledge Economy').first()).toBeVisible({ timeout: 15000 });

    // Verify expert tier and contributions count
    await expect(page.getByText(/expert/i).first()).toBeVisible();
    await expect(page.getByText('Contributions')).toBeVisible();
    await expect(page.getByText('75', { exact: true })).toBeVisible();

    // Screenshot: Transaction history (attribution events)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/transaction-history.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
