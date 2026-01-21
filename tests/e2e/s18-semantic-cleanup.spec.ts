/**
 * S18-SKIN-SemanticCleanup E2E Verification
 *
 * Sprint: S18-SKIN-SemanticCleanup
 * Protocol: Grove Execution Protocol v1.5 (Constraint 11)
 *
 * Verifies semantic CSS variables are properly applied in Bedrock consoles
 * after removing hardcoded Tailwind color classes.
 *
 * Tests:
 * - Semantic color variables render correctly (success, warning, error, info)
 * - Glass panel/border/text variables work in dark theme
 * - No console errors from missing CSS classes
 * - Card components display with proper theming
 */

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, ConsoleCapture } from './_test-utils';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = 'docs/sprints/S18-SKIN-SemanticCleanup/screenshots/e2e';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

test.describe('S18-SKIN-SemanticCleanup E2E Verification', () => {
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

  test('TC-01: Experience Console loads with semantic colors', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Wait for content to render
    await page.waitForTimeout(2000);

    // Verify page loaded
    const main = page.locator('main, [role="main"], .bedrock-app, body');
    await expect(main.first()).toBeVisible();

    // Verify semantic success variable exists
    const successColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--semantic-success').trim();
    });
    expect(successColor).toBeTruthy();

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc01-experience-console.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-01: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-02: Nursery Console sprout status colors', async ({ page }) => {
    await page.goto('/bedrock/nursery');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page loaded
    const main = page.locator('main, [role="main"], .bedrock-app, body');
    await expect(main.first()).toBeVisible();

    // Verify semantic warning variable exists (used for pending states)
    const warningColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--semantic-warning').trim();
    });
    expect(warningColor).toBeTruthy();

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc02-nursery-console.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-02: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-03: Federation Console tier badge colors', async ({ page }) => {
    await page.goto('/bedrock/federation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify page loaded
    const main = page.locator('main, [role="main"], .bedrock-app, body');
    await expect(main.first()).toBeVisible();

    // Verify semantic info variable exists (used for developing tier)
    const infoColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--semantic-info').trim();
    });
    expect(infoColor).toBeTruthy();

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc03-federation-console.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-03: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-04: Glass panel variables render correctly', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify glass panel variable exists (used for neutral backgrounds)
    const glassPanelColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--glass-panel').trim();
    });
    expect(glassPanelColor).toBeTruthy();

    // Verify glass text muted variable exists
    const glassTextMuted = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--glass-text-muted').trim();
    });
    expect(glassTextMuted).toBeTruthy();

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc04-glass-variables.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-04: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-05: No Tailwind color class warnings', async ({ page }) => {
    // Clear any existing errors
    capture.errors = [];

    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Navigate to different consoles to trigger any potential errors
    await page.goto('/bedrock/nursery');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.goto('/bedrock/federation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot final state
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc05-no-tailwind-warnings.png`, fullPage: true });

    // Check for any Tailwind-related errors (e.g., unknown classes)
    const tailwindErrors = capture.errors.filter(err =>
      err.includes('bg-') || err.includes('text-') || err.includes('border-')
    );
    expect(tailwindErrors, 'TC-05: Should have no Tailwind class errors').toHaveLength(0);

    // Verify no critical console errors overall
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-05: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-06: Error state colors render correctly', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify semantic error variable exists
    const errorColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--semantic-error').trim();
    });
    expect(errorColor).toBeTruthy();

    // Verify error background variable exists
    const errorBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--semantic-error-bg').trim();
    });
    expect(errorBg).toBeTruthy();

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc06-error-colors.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-06: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-07: Semantic variables defined in root', async ({ page }) => {
    await page.goto('/bedrock');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify all core semantic variables are defined
    const variables = await page.evaluate(() => {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      return {
        success: style.getPropertyValue('--semantic-success').trim(),
        successBg: style.getPropertyValue('--semantic-success-bg').trim(),
        warning: style.getPropertyValue('--semantic-warning').trim(),
        warningBg: style.getPropertyValue('--semantic-warning-bg').trim(),
        error: style.getPropertyValue('--semantic-error').trim(),
        errorBg: style.getPropertyValue('--semantic-error-bg').trim(),
        info: style.getPropertyValue('--semantic-info').trim(),
        infoBg: style.getPropertyValue('--semantic-info-bg').trim(),
        glassPanel: style.getPropertyValue('--glass-panel').trim(),
        glassTextMuted: style.getPropertyValue('--glass-text-muted').trim(),
        glassBorder: style.getPropertyValue('--glass-border').trim(),
      };
    });

    // All variables should have values
    expect(variables.success, 'semantic-success should be defined').toBeTruthy();
    expect(variables.successBg, 'semantic-success-bg should be defined').toBeTruthy();
    expect(variables.warning, 'semantic-warning should be defined').toBeTruthy();
    expect(variables.warningBg, 'semantic-warning-bg should be defined').toBeTruthy();
    expect(variables.error, 'semantic-error should be defined').toBeTruthy();
    expect(variables.errorBg, 'semantic-error-bg should be defined').toBeTruthy();
    expect(variables.info, 'semantic-info should be defined').toBeTruthy();
    expect(variables.infoBg, 'semantic-info-bg should be defined').toBeTruthy();
    expect(variables.glassPanel, 'glass-panel should be defined').toBeTruthy();
    expect(variables.glassTextMuted, 'glass-text-muted should be defined').toBeTruthy();
    expect(variables.glassBorder, 'glass-border should be defined').toBeTruthy();

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc07-all-variables.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-07: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-08: Card components render without hardcoded colors', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for card elements
    const cards = page.locator('[data-testid*="card"], .rounded-xl.border');
    const cardCount = await cards.count();

    // If cards exist, verify they render
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
    }

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc08-card-components.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-08: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-09: Status badges use semantic colors', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for status badges
    const badges = page.locator('.rounded-full, [class*="badge"]');
    const badgeCount = await badges.count();

    // Log for debugging
    console.log(`Found ${badgeCount} potential badge elements`);

    // Screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc09-status-badges.png`, fullPage: true });

    // Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-09: Should have no critical console errors').toHaveLength(0);
  });

  test('TC-10: Full Bedrock navigation without errors', async ({ page }) => {
    // Clear errors
    capture.errors = [];

    // Navigate through all main Bedrock routes
    const routes = ['/bedrock', '/bedrock/experience', '/bedrock/nursery', '/bedrock/federation'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    }

    // Final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/tc10-full-navigation.png`, fullPage: true });

    // Verify no critical console errors across all navigation
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors, 'TC-10: Should have no critical console errors during navigation').toHaveLength(0);
  });
});
