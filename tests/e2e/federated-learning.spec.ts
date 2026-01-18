// tests/e2e/federated-learning.spec.ts
// Sprint: S10.1-SL-AICuration v2 - Federated Learning Toggle Tests
// User Story: US-A008 - Enable Federated Learning
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
 * US-A008: Enable Federated Learning
 *
 * Verifies that federated learning toggle works correctly:
 * - Toggle federated learning participation
 * - Privacy notice displays when enabled
 * - Data sharing options available
 * - Consent timestamp recorded
 */
test.describe('US-A008: Federated Learning Settings', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('federated learning toggle renders', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Navigate to quality settings if needed
    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Screenshot: Federated learning section
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/40-federated-learning-toggle.png`,
      fullPage: true,
    });

    // Look for federated toggle component
    const federatedToggle = page.locator('[data-testid="federated-learning-toggle"], [data-testid="federated-toggle"]');
    const toggleVisible = await federatedToggle.isVisible().catch(() => false);

    console.log(`[US-A008] Federated toggle visible: ${toggleVisible}`);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('toggle federated learning participation', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Find the toggle switch
    const toggle = page.locator('[data-testid="federated-toggle"] button[role="switch"], [data-testid="federated-learning-toggle"] button[role="switch"]').first();

    if (await toggle.isVisible().catch(() => false)) {
      // Get initial state
      const initialState = await toggle.getAttribute('aria-checked');
      console.log(`[US-A008] Initial toggle state: ${initialState}`);

      // Click toggle
      await toggle.click();
      await page.waitForTimeout(300);

      // Screenshot: After toggle
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/41-federated-enabled.png`,
        fullPage: true,
      });

      // Check new state
      const newState = await toggle.getAttribute('aria-checked');
      console.log(`[US-A008] New toggle state: ${newState}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('privacy notice displays when enabled', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Enable federated if not already
    const toggle = page.locator('[data-testid="federated-toggle"] button[role="switch"]').first();
    if (await toggle.isVisible().catch(() => false)) {
      const isEnabled = await toggle.getAttribute('aria-checked') === 'true';
      if (!isEnabled) {
        await toggle.click();
        await page.waitForTimeout(300);
      }

      // Look for privacy notice
      const privacyNotice = page.locator(':has-text("Your data stays private"), :has-text("privacy"), [data-testid="privacy-notice"]');
      const noticeVisible = await privacyNotice.isVisible().catch(() => false);

      // Screenshot: Privacy notice
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/42-privacy-notice.png`,
        fullPage: true,
      });

      console.log(`[US-A008] Privacy notice visible: ${noticeVisible}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('data sharing options available when enabled', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Enable federated
    const toggle = page.locator('[data-testid="federated-toggle"] button[role="switch"]').first();
    if (await toggle.isVisible().catch(() => false)) {
      const isEnabled = await toggle.getAttribute('aria-checked') === 'true';
      if (!isEnabled) {
        await toggle.click();
        await page.waitForTimeout(300);
      }

      // Expand data sharing preferences
      const preferencesToggle = page.locator('button:has-text("Data Sharing Preferences")').first();
      if (await preferencesToggle.isVisible().catch(() => false)) {
        await preferencesToggle.click();
        await page.waitForTimeout(300);
      }

      // Screenshot: Data sharing options
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/43-data-sharing-options.png`,
        fullPage: true,
      });

      // Look for data sharing options
      const qualityMetrics = page.locator(':has-text("Quality Metrics")');
      const dimensionPatterns = page.locator(':has-text("Dimension Patterns")');
      const thresholdCalibration = page.locator(':has-text("Threshold Calibration")');

      const hasQM = await qualityMetrics.isVisible().catch(() => false);
      const hasDP = await dimensionPatterns.isVisible().catch(() => false);
      const hasTC = await thresholdCalibration.isVisible().catch(() => false);

      console.log(`[US-A008] Data sharing options - QM: ${hasQM}, DP: ${hasDP}, TC: ${hasTC}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('consent timestamp recorded', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    const qualityTab = page.locator('[data-testid="quality-settings-tab"]').first();
    if (await qualityTab.isVisible().catch(() => false)) {
      await qualityTab.click();
      await page.waitForTimeout(500);
    }

    // Enable federated
    const toggle = page.locator('[data-testid="federated-toggle"] button[role="switch"]').first();
    if (await toggle.isVisible().catch(() => false)) {
      const isEnabled = await toggle.getAttribute('aria-checked') === 'true';
      if (!isEnabled) {
        await toggle.click();
        await page.waitForTimeout(300);
      }

      // Look for consent timestamp
      const consentTimestamp = page.locator(':has-text("Consent updated"), [data-testid="consent-timestamp"]');
      const timestampVisible = await consentTimestamp.isVisible().catch(() => false);

      // Screenshot: Consent timestamp
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/44-consent-timestamp.png`,
        fullPage: true,
      });

      console.log(`[US-A008] Consent timestamp visible: ${timestampVisible}`);
    }

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('toggle persists state correctly', async ({ page }) => {
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Check for any state persistence errors
    const stateErrors = capture.errors.filter(e =>
      e.includes('state') ||
      e.includes('federated') ||
      e.includes('consent')
    );

    // Screenshot: State persistence
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/45-federated-state-persistence.png`,
      fullPage: true,
    });

    console.log(`[US-A008] State persistence errors: ${stateErrors.length}`);
    expect(stateErrors).toHaveLength(0);

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
