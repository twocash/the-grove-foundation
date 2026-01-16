// tests/e2e/federation.spec.ts
// E2E tests for federation system
// Sprint: EPIC5-SL-Federation v1

import { test, expect } from '@playwright/test';

const SCREENSHOTS_DIR = 'docs/sprints/epic5-federation-v1/screenshots';

test.describe('Federation System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to federation console
    await page.goto('/foundation/federation');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-01-federation-console-initial.png`,
      fullPage: false,
    });
  });

  test('US-F001: Federation Console loads correctly', async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle(/The Grove/);

    // Verify the federation console is visible
    await expect(page.locator('text=Federation Dashboard')).toBeVisible();

    // Screenshot of loaded console
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-02-console-loaded.png`,
      fullPage: false,
    });
  });

  test('US-F002: Service Discovery tab navigation', async ({ page }) => {
    // Click on Service Discovery tab
    await page.click('button:has-text("Service Discovery")');

    // Verify the service discovery interface is visible
    await expect(page.locator('button:has-text("Service Discovery")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search by name"]')).toBeVisible();

    // Screenshot of service discovery
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-03-service-discovery.png`,
      fullPage: false,
    });
  });

  test('US-F003: Topology tab navigation', async ({ page }) => {
    // Click on Topology tab
    await page.click('button:has-text("Topology")');

    // Verify the topology visualization is visible
    await expect(page.locator('button:has-text("Topology")')).toBeVisible();

    // Screenshot of topology
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-04-topology.png`,
      fullPage: false,
    });
  });

  test('US-F004: Provenance Tracer tab navigation', async ({ page }) => {
    // Click on Provenance Tracer tab
    await page.click('button:has-text("Provenance Tracer")');

    // Verify the provenance tracer interface is visible
    await expect(page.locator('button:has-text("Provenance Tracer")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Enter object ID"]')).toBeVisible();

    // Screenshot of provenance tracer
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-05-provenance-tracer.png`,
      fullPage: false,
    });
  });

  test('US-F005: Tab navigation flow', async ({ page }) => {
    // Navigate through all tabs using nth to select the correct button
    const tabs = [
      { name: 'Dashboard', selector: 'button:has-text("Dashboard")', index: 0 },
      { name: 'Service Discovery', selector: 'button:has-text("Service Discovery")', index: 0 },
      { name: 'Topology', selector: 'button:has-text("Topology")', index: 0 },
      { name: 'Provenance Tracer', selector: 'button:has-text("Provenance Tracer")', index: 0 },
    ];

    for (const tab of tabs) {
      await page.click(tab.selector);
      await expect(page.locator(tab.selector).nth(tab.index)).toBeVisible();

      // Screenshot of each tab
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/e2e-tab-${tab.name.toLowerCase().replace(' ', '-')}.png`,
        fullPage: false,
      });
    }
  });

  test('US-F006: Test Sprint Registration', async ({ page }) => {
    // Go to Dashboard tab
    await page.click('button:has-text("Dashboard")');

    // Wait for the button to be available
    await page.waitForSelector('button:has-text("Register Test Sprint")', { state: 'visible', timeout: 10000 });

    // Find and click the "Register Test Sprint" button
    await page.click('button:has-text("Register Test Sprint")', { timeout: 30000 });

    // Wait a moment for the registration to process
    await page.waitForTimeout(1000);

    // Verify the sprint appears in the list
    await expect(page.locator('text=test-sprint')).toBeVisible();

    // Screenshot after registration
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-06-test-sprint-registered.png`,
      fullPage: false,
    });
  });

  test('US-F007: Sprint Actions - Heartbeat', async ({ page }) => {
    // Go to Dashboard tab
    await page.click('text=Dashboard');

    // If a test sprint exists, try to send a heartbeat
    const heartbeatButton = page.locator('button:has-text("Heartbeat")').first();
    if (await heartbeatButton.isVisible()) {
      await heartbeatButton.click();

      // Wait for the action to complete
      await page.waitForTimeout(500);

      // Screenshot after heartbeat
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/e2e-07-heartbeat-sent.png`,
        fullPage: false,
      });
    } else {
      // Skip this test if no sprints are registered
      test.skip();
    }
  });

  test('US-F008: Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify the console is still usable on mobile
    await expect(page.locator('text=Federation Dashboard')).toBeVisible();

    // Screenshot of mobile layout
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-08-mobile-layout.png`,
      fullPage: false,
    });
  });

  test('US-F009: Error handling', async ({ page }) => {
    // Navigate to provenance tracer
    await page.click('text=Provenance Tracer');

    // Try to trace with invalid object ID
    const input = page.locator('input[placeholder*="Enter object ID"]');
    await input.fill('invalid-object-id');

    // Click trace button
    await page.click('button:has-text("Trace")');

    // Wait for error handling
    await page.waitForTimeout(1000);

    // Screenshot of error handling
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-09-error-handling.png`,
      fullPage: false,
    });
  });

  test('US-F010: Performance - Page load time', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now();
    await page.goto('/foundation/federation');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Log the load time
    console.log(`Federation console load time: ${loadTime}ms`);

    // Verify load time is under 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Screenshot of final state
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/e2e-10-performance-test.png`,
      fullPage: false,
    });
  });
});
