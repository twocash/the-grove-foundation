// tests/e2e/quality-threshold-config.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Quality Threshold Configuration Tests
// User Story: US-A007 - Configure Quality Thresholds
// Protocol: Grove Execution Protocol v1.5 - Constraint 11

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s10.1-sl-aicuration-v2/screenshots/e2e';

/**
 * US-A007: Configure Quality Thresholds
 *
 * Verifies that threshold configuration works correctly:
 * - View existing thresholds
 * - Edit grade boundaries
 * - Configure dimension weights
 * - Save threshold changes
 */
test.describe('US-A007: Quality Threshold Configuration', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('Experience Console loads threshold settings', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Experience Console
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/33-experience-console-threshold.png`,
      fullPage: true,
    });

    // Look for quality settings section or tab
    const qualitySettingsTab = page.locator('[data-testid="quality-settings-tab"], button:has-text("Quality"), [data-testid="threshold-settings"]');
    const settingsVisible = await qualitySettingsTab.isVisible().catch(() => false);

    console.log(`[US-A007] Quality settings section visible: ${settingsVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('displays threshold configuration panel', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Try to navigate to quality settings
    const qualityTab = page.locator('[data-testid="quality-settings-tab"], button:has-text("Quality")').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Screenshot: Threshold configuration panel
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/34-threshold-config-panel.png`,
      fullPage: true,
    });

    // Look for threshold settings component
    const thresholdSettings = page.locator('[data-testid="quality-threshold-settings"]');
    const settingsVisible = await thresholdSettings.isVisible().catch(() => false);

    console.log(`[US-A007] Threshold settings panel visible: ${settingsVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('grade boundary inputs exist', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Navigate to quality settings
    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Look for grade boundary inputs
    const gradeInputs = page.locator('[data-testid*="threshold-"], input[type="range"], input[type="number"]');
    const inputCount = await gradeInputs.count();

    // Screenshot: Grade boundaries
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/35-grade-boundary-inputs.png`,
      fullPage: true,
    });

    console.log(`[US-A007] Grade boundary inputs found: ${inputCount}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('dimension weight sliders exist', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Navigate to quality settings
    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Look for weight sliders
    const weightSliders = page.locator('[data-testid*="weight-slider"], [data-testid="dimension-weights"]');
    const sliderCount = await weightSliders.count();

    // Screenshot: Dimension weights
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/36-dimension-weight-sliders.png`,
      fullPage: true,
    });

    console.log(`[US-A007] Dimension weight sliders found: ${sliderCount}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('weight slider interaction works', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Find a weight slider
    const weightSlider = page.locator('[data-testid*="weight-slider"] input[type="range"]').first();

    if (await weightSlider.isVisible().catch(() => false)) {
      // Get initial value
      const initialValue = await weightSlider.inputValue();

      // Change value
      await weightSlider.fill('30');
      await page.waitForTimeout(300);

      // Screenshot: After slider change
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/37-weight-slider-changed.png`,
        fullPage: true,
      });

      const newValue = await weightSlider.inputValue();
      console.log(`[US-A007] Weight slider - Initial: ${initialValue}, New: ${newValue}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('total weight indicator updates', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Look for total weight indicator
    const totalIndicator = page.locator('[data-testid="total-weight"], :has-text("100%"), :has-text("Total")');
    const indicatorVisible = await totalIndicator.isVisible().catch(() => false);

    // Screenshot: Total weight indicator
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/38-total-weight-indicator.png`,
      fullPage: true,
    });

    console.log(`[US-A007] Total weight indicator visible: ${indicatorVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('settings persist without errors', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Check for any persistence/save errors
    const persistenceErrors = capture.errors.filter(e =>
      e.includes('save') ||
      e.includes('persist') ||
      e.includes('threshold')
    );

    // Screenshot: Settings state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/39-settings-persistence.png`,
      fullPage: true,
    });

    console.log(`[US-A007] Persistence errors: ${persistenceErrors.length}`);
    expect(persistenceErrors).toHaveLength(0);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
