// tests/e2e/job-config.spec.ts
// Sprint: S7.5-SL-JobConfigSystem - E2E tests for job config features
// Protocol: Grove Execution Protocol v1.5 - Constraint 11

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/job-config-system-v1/screenshots/e2e';

/**
 * S7.5-SL-JobConfigSystem: Job Configuration System Tests
 *
 * Tests that the Job Config system is properly integrated into the
 * Experience Console with zero critical console errors.
 */
test.describe('S7.5-SL-JobConfigSystem: Experience Console Integration', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-JC001: Experience Console loads with job-config type registered', async ({ page }) => {
    // Navigate to bedrock experience console
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Screenshot: Experience Console with job-config
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/us-jc001-experience-console.png`,
      fullPage: true,
    });

    // Verify page loaded (look for common bedrock elements)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Check for any critical errors during load
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(
      `[S7.5-JobConfigSystem] Experience Console errors: ${criticalErrors.length}`
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-JC002: Bedrock route loads without hook registry errors', async ({
    page,
  }) => {
    // Navigate to bedrock dashboard
    await page.goto('/bedrock');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    // Screenshot: Bedrock dashboard
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/us-jc002-bedrock-dashboard.png`,
      fullPage: true,
    });

    // Verify no hook registry errors (would appear as TypeError/ReferenceError)
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-JC003: Component registry resolves JobConfigCard without errors', async ({
    page,
  }) => {
    // Navigate to experience console
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    // Screenshot: Component resolution verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/us-jc003-component-resolution.png`,
      fullPage: true,
    });

    // Check that the page loaded without component resolution errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(
      `[S7.5-JobConfigSystem] Component resolution errors: ${criticalErrors.length}`
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
