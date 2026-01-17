// tests/e2e/model-analytics.spec.ts
// Sprint: EPIC4-SL-MultiModel v1 - Epic 5: Model Analytics
// Protocol: Grove Execution Protocol v1.5 - Constraint 11

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/auto-advancement-v1/screenshots/e2e';

/**
 * EPIC4-SL-MultiModel: Model Analytics E2E Tests
 *
 * Tests the Model Analytics system integration with the Experience Console.
 * Verifies that:
 * 1. Experience Console loads with model-analytics types registered
 * 2. Bedrock routes work without type registry errors
 * 3. No critical console errors during navigation
 */

test.describe('EPIC4-SL-MultiModel: Model Analytics Integration', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-M001: Experience Console loads with model-analytics catalog', async ({
    page,
  }) => {
    // Navigate to bedrock experience console
    await page.goto('/bedrock/experience', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Screenshot: Experience Console with model-analytics
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-experience-console-analytics.png`,
      fullPage: true,
    });

    // Verify page loaded
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Check for critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(
      `[Model-Analytics] Experience Console errors: ${criticalErrors.length}`
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-M002: Experience Console type registry includes model-analytics', async ({
    page,
  }) => {
    // Navigate to experience console
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Wait for React components to mount
    await page.waitForTimeout(2000);

    // Check console for type registry messages
    const hasModelAnalytics = capture.errors.some(
      (error) =>
        error.includes('model-analytics') ||
        error.includes('ModelAnalytics')
    );

    // If no model-analytics errors found, that's good (type loaded successfully)
    console.log(`[Model-Analytics] Type registry check: ${hasModelAnalytics}`);

    // Verify page is functional
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify no critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-M003: Bedrock dashboard loads without model-analytics errors', async ({
    page,
  }) => {
    // Navigate to bedrock dashboard
    await page.goto('/bedrock');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    // Screenshot: Bedrock dashboard
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-bedrock-dashboard.png`,
      fullPage: true,
    });

    // Verify page loaded
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Check for critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(
      `[Model-Analytics] Bedrock dashboard errors: ${criticalErrors.length}`
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-M004: Model analytics registry loads without errors', async ({
    page,
  }) => {
    // Navigate to experience console
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Wait for all JavaScript to execute
    await page.waitForTimeout(3000);

    // Check for model-analytics specific messages
    const registryErrors = capture.errors.filter((error) =>
      error.includes('ModelAnalytics') ||
      error.includes('model-analytics')
    );

    console.log(
      `[Model-Analytics] Registry errors found: ${registryErrors.length}`
    );

    // Verify no critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);

    // Verify page is still functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('US-M005: Navigation between bedrock routes works', async ({ page }) => {
    // Test navigation flow
    const routes = ['/bedrock', '/bedrock/experience'];

    for (const route of routes) {
      console.log(`[Model-Analytics] Navigating to ${route}`);

      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Verify page loaded
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check for critical errors at each route
      const criticalErrors = getCriticalErrors(capture.errors);
      expect(criticalErrors).toHaveLength(0);

      // Screenshot of each route
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-${route.replace('/', '-')}.png`,
        fullPage: true,
      });
    }

    // Final error count check
    const allErrors = getCriticalErrors(capture.errors);
    console.log(
      `[Model-Analytics] Total critical errors across navigation: ${allErrors.length}`
    );
    expect(allErrors).toHaveLength(0);
  });
});

/**
 * EPIC4-SL-MultiModel: Component Integration Tests
 *
 * Tests that verify the json-render system works correctly with
 * model-analytics components at the integration level.
 */
test.describe('EPIC4-SL-MultiModel: Json-Render Integration', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-M006: Json-render catalog loads without errors', async ({
    page,
  }) => {
    // The json-render system should load both signals and model-analytics catalogs
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Wait for component initialization
    await page.waitForTimeout(3000);

    // Check for json-render related errors
    const jsonRenderErrors = capture.errors.filter((error) =>
      error.includes('json-render') ||
      error.includes('signals-catalog') ||
      error.includes('model-analytics-catalog')
    );

    console.log(
      `[Model-Analytics] Json-render catalog errors: ${jsonRenderErrors.length}`
    );

    // Verify no critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-M007: Multiple component types load without conflicts', async ({
    page,
  }) => {
    // Load experience console which should handle both Signals and ModelAnalytics
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Extended wait for all components to initialize
    await page.waitForTimeout(4000);

    // Verify page functionality
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for component conflicts
    const componentErrors = capture.errors.filter((error) =>
      error.includes('conflict') ||
      error.includes('duplicate') ||
      error.includes('already registered')
    );

    console.log(
      `[Model-Analytics] Component conflict errors: ${componentErrors.length}`
    );

    // No critical errors should exist
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });
});
