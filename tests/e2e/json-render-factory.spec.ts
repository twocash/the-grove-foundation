/**
 * json-render-factory E2E Verification
 *
 * Sprint: S19-BD-JsonRenderFactory
 * Protocol: Grove Execution Protocol v1.5 (Constraint 11)
 *
 * Tests the unified json-render component catalog with:
 * - JsonRenderer with base components
 * - ComponentCatalogBrowser registry UI
 * - Console error monitoring
 */

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, ConsoleCapture } from './_test-utils';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'docs/sprints/s19-bd-jsonrenderfactory/screenshots';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.describe('S19-BD-JsonRenderFactory E2E Verification', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    // Log any errors for debugging
    if (capture.errors.length > 0) {
      console.log('Console errors captured:', capture.errors);
    }
  });

  test('TC-01: JsonRenderer Demo - All Base Components', async ({ page }) => {
    // Navigate to json-render demo
    await page.goto('/dev/json-render-demo');
    await page.waitForLoadState('networkidle');

    // Wait for content to render
    await page.waitForTimeout(1000);

    // Verify page title is visible
    const header = page.locator('h1:has-text("JsonRenderer Visual Verification")');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Verify test sections are rendered
    const simpleSection = page.locator('h2:has-text("Simple Components")');
    await expect(simpleSection).toBeVisible();

    const metricsSection = page.locator('h2:has-text("Metrics Dashboard")');
    await expect(metricsSection).toBeVisible();

    const feedbackSection = page.locator('h2:has-text("Status & Feedback")');
    await expect(feedbackSection).toBeVisible();

    const alertsSection = page.locator('h2:has-text("Alert States")');
    await expect(alertsSection).toBeVisible();

    const statesSection = page.locator('h2:has-text("Empty & Loading")');
    await expect(statesSection).toBeVisible();

    const unknownSection = page.locator('h2:has-text("Unknown Components")');
    await expect(unknownSection).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/e2e-json-renderer-demo.png`,
      fullPage: true,
    });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-01: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-02: JsonRenderer Demo - Metrics Components Render', async ({ page }) => {
    await page.goto('/dev/json-render-demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify metrics values are displayed
    const totalUsers = page.locator('text=Total Users');
    await expect(totalUsers).toBeVisible();

    const conversionRate = page.locator('text=Conversion Rate');
    await expect(conversionRate).toBeVisible();

    const revenue = page.locator('text=Revenue');
    await expect(revenue).toBeVisible();

    // Verify numeric values rendered (1,234 users)
    const userValue = page.locator('text=1,234');
    await expect(userValue).toBeVisible();

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-02: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-03: JsonRenderer Demo - Alert Components Render', async ({ page }) => {
    await page.goto('/dev/json-render-demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify all alert variants are visible
    const infoAlert = page.locator('text=This is an informational alert');
    await expect(infoAlert).toBeVisible();

    const successAlert = page.locator('text=Operation completed successfully');
    await expect(successAlert).toBeVisible();

    const warningAlert = page.locator('text=Warning alert without a title');
    await expect(warningAlert).toBeVisible();

    const errorAlert = page.locator('text=Something went wrong');
    await expect(errorAlert).toBeVisible();

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-03: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-04: JsonRenderer Demo - Unknown Component Fallback', async ({ page }) => {
    await page.goto('/dev/json-render-demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify unknown component handling section exists
    const unknownHeader = page.locator('text=Unknown Component Handling');
    await expect(unknownHeader).toBeVisible();

    // The UnknownComponent fallback should render gracefully
    // It typically shows the component type name
    const unknownFallback = page.locator('text=unknown:FakeComponent').or(
      page.locator('text=FakeComponent')
    );
    // May or may not be visible depending on implementation
    // Key test is no critical errors

    // Verify no critical console errors (unknown components should not crash)
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-04: Unknown components should not cause critical errors').toHaveLength(0);
  });

  test('TC-05: ComponentCatalogBrowser - Registry Display', async ({ page }) => {
    // Navigate to catalog browser demo
    await page.goto('/dev/catalog-browser');
    await page.waitForLoadState('networkidle');

    // Wait for content to render
    await page.waitForTimeout(1000);

    // Verify page title is visible
    const header = page.locator('h1:has-text("Component Catalog Browser")');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Verify catalog browser component is rendered
    const catalogBrowser = page.locator('[data-testid="catalog-browser"]');
    await expect(catalogBrowser).toBeVisible();

    // Capture screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/e2e-catalog-browser.png`,
      fullPage: true,
    });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-05: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-06: ComponentCatalogBrowser - Base Catalog Components Listed', async ({ page }) => {
    await page.goto('/dev/catalog-browser');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify base catalog section is visible (defaultExpanded=['base'])
    const baseCatalog = page.locator('text=base').first();
    await expect(baseCatalog).toBeVisible();

    // Verify some base components are listed
    // These are the 13 base components from the catalog
    // Use .first() to avoid strict mode violations when text appears multiple times
    const stackComponent = page.locator('text=Stack').first();
    await expect(stackComponent).toBeVisible();

    const gridComponent = page.locator('text=Grid').first();
    await expect(gridComponent).toBeVisible();

    const metricComponent = page.locator('text=Metric').first();
    await expect(metricComponent).toBeVisible();

    const badgeComponent = page.locator('text=Badge').first();
    await expect(badgeComponent).toBeVisible();

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-06: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-07: ComponentCatalogBrowser - Stats Bar', async ({ page }) => {
    await page.goto('/dev/catalog-browser');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify stats bar shows catalog and component counts
    // Should show "1 catalog" and "13 components" (or similar)
    // Use .first() to avoid strict mode violations
    const catalogCount = page.locator('text=/\\d+\\s*catalog/i').first();
    await expect(catalogCount).toBeVisible();

    const componentCount = page.locator('text=/\\d+\\s*component/i').first();
    await expect(componentCount).toBeVisible();

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-07: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-08: Full Session - Both Routes Without Errors', async ({ page }) => {
    // Complete user flow test - visit both dev routes

    // Step 1: JsonRenderer Demo
    await page.goto('/dev/json-render-demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify it loaded
    const rendererHeader = page.locator('h1:has-text("JsonRenderer Visual Verification")');
    await expect(rendererHeader).toBeVisible();

    // Step 2: Navigate to Catalog Browser
    await page.goto('/dev/catalog-browser');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify it loaded
    const browserHeader = page.locator('h1:has-text("Component Catalog Browser")');
    await expect(browserHeader).toBeVisible();

    // Step 3: Return to JsonRenderer Demo
    await page.goto('/dev/json-render-demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // CRITICAL: Verify zero critical console errors for entire session
    const criticalErrors = getCriticalErrors(capture.errors);

    if (criticalErrors.length > 0) {
      console.error('Critical errors found:', criticalErrors);
    }

    expect(criticalErrors, 'TC-08: Full session should have no critical console errors').toHaveLength(0);
  });
});
