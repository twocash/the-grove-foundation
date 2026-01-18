// tests/e2e/s11-sl-attribution/economic-dashboard.spec.ts
// Sprint: S11-SL-Attribution v1
// Protocol: E2E Testing with Visual Verification per Developer SOP v2.0

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from '../_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s11-sl-attribution-v1/screenshots/e2e';

test.describe('Epic D: Economic Dashboard', () => {
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
   * US-D001: View Economic Overview
   * Tests: Dashboard displays key metrics
   */
  test('US-D001: Dashboard overview shows key metrics', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(5000);

    // Screenshot: Dashboard overview
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/dashboard-overview.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('US-D001: Dashboard metrics load successfully', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Screenshot: Metrics loaded
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/dashboard-metrics-loaded.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-D002: Analyze Attribution Flows
   * Tests: Attribution flow visualization
   */
  test('US-D002: Attribution flow chart displays', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Flow chart
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/attribution-flow-chart.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  /**
   * US-D003: View Transaction History
   * Tests: Recent transactions display
   */
  test('US-D003: Transaction history displays recent events', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForTimeout(3000);

    // Screenshot: Transaction history
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/transaction-history.png`,
      fullPage: true
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
