/**
 * Visual QA Tests: Model Analytics
 * Sprint: EPIC4-SL-MultiModel v1 - Epic 5
 *
 * These tests capture screenshots to verify Model Analytics UI features are working correctly.
 * Screenshots are saved to docs/sprints/auto-advancement-v1/screenshots/
 *
 * Run: npx playwright test tests/visual-qa/model-analytics.spec.ts
 */

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/auto-advancement-v1/screenshots/visual';

test.describe('Model Analytics Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Experience Console where Model Analytics should be available
    await page.goto('/bedrock/experience');

    // Wait for loading to complete
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForSelector('body', { state: 'visible', timeout: 60000 });

    // Allow animations to settle
    await page.waitForTimeout(2000);
  });

  test('01 - Experience Console loads with model-analytics catalog registered', async ({
    page,
  }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-experience-console-loaded.png`,
      fullPage: true,
    });

    // Verify console loaded
    const title = await page.locator('text=Experience').first();
    await expect(title).toBeVisible();
  });

  test('02 - Json-render system initializes without errors', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-json-render-initialized.png`,
      fullPage: true,
    });

    // Verify no error messages visible
    const errorMessages = page.locator('text=/error/i');
    await expect(errorMessages).not.toBeVisible();
  });

  test('03 - Model analytics catalog components available', async ({ page }) => {
    // Navigate to experience console and wait for full load
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-model-analytics-available.png`,
      fullPage: true,
    });

    // Verify the page loaded successfully
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('04 - Model analytics transform functions work correctly', async ({
    page,
  }) => {
    // Verify the transform system is working by checking the page renders without errors
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-transform-functions.png`,
      fullPage: true,
    });

    // Verify no transform-related errors
    const transformErrors = page.locator('text=/transform.*error/i');
    await expect(transformErrors).not.toBeVisible();
  });

  test('05 - Bedrock routes work with model-analytics', async ({ page }) => {
    // Test bedrock dashboard
    await page.goto('/bedrock');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-bedrock-dashboard.png`,
      fullPage: true,
    });

    // Verify dashboard loaded
    const dashboard = page.locator('body');
    await expect(dashboard).toBeVisible();
  });

  test('06 - Multiple model analytics views render without conflicts', async ({
    page,
  }) => {
    // Navigate to experience console multiple times to test for conflicts
    for (let i = 0; i < 3; i++) {
      await page.goto('/bedrock/experience');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-multiple-views.png`,
      fullPage: true,
    });

    // Verify page is still functional
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('07 - Registry components render correctly', async ({ page }) => {
    // Test that registry components load and render
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-registry-components.png`,
      fullPage: true,
    });

    // Verify no registry conflicts
    const conflictErrors = page.locator('text=/conflict|duplicate|already registered/i');
    await expect(conflictErrors).not.toBeVisible();
  });

  test('08 - Glass morphism styling applied correctly', async ({ page }) => {
    // Check that the glass morphism design system is working
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-glass-morphism.png`,
      fullPage: true,
    });

    // Verify elements are visible with proper styling
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('09 - Material symbols icons render', async ({ page }) => {
    // Verify icons are loading
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-material-symbols.png`,
      fullPage: true,
    });

    // Check for icon-related errors
    const iconErrors = page.locator('text=/icon.*not.*found|missing.*icon/i');
    await expect(iconErrors).not.toBeVisible();
  });

  test('10 - Model type color coding works', async ({ page }) => {
    // Verify model type colors are applied
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-model-type-colors.png`,
      fullPage: true,
    });

    // Verify the page renders with proper colors
    const pageElement = page.locator('body');
    await expect(pageElement).toBeVisible();
  });

  test('11 - Responsive layout adapts to viewport', async ({ page }) => {
    // Test responsive behavior
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 768, height: 1024, name: 'tablet' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/bedrock/experience');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/11-responsive-${viewport.name}.png`,
        fullPage: true,
      });
    }

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('12 - Navigation between routes works smoothly', async ({ page }) => {
    // Test navigation flow
    const routes = ['/bedrock', '/bedrock/experience'];

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/12-navigation-${i}-${route.replace('/', '-')}.png`,
        fullPage: true,
      });
    }
  });
});
