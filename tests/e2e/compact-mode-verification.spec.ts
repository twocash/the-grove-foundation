// tests/e2e/compact-mode-verification.spec.ts
// Sprint: bedrock-ui-compact-v1 - Visual verification of metrics toggle
import { test, expect } from '@playwright/test';

const SCREENSHOTS_DIR = 'docs/sprints/bedrock-ui-compact-v1/screenshots';

test.describe('Bedrock Compact Mode - US-BUC001', () => {
  test('Toggle metrics bar visibility', async ({ page }) => {
    // Navigate to Experience Console
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Verify metrics bar is visible by default
    const metricsRow = page.locator('.px-6.py-4').first();

    // Screenshot: Metrics visible (default state)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/03-toggle-visible-state.png`,
      fullPage: false
    });

    // Find and click the Hide Stats toggle
    const toggleButton = page.getByRole('button', { name: /hide stats/i });
    await expect(toggleButton).toBeVisible();

    // Screenshot: Highlight toggle location
    await toggleButton.hover();
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/04-toggle-hover.png`,
      fullPage: false
    });

    // Click to hide metrics
    await toggleButton.click();

    // Wait for the change to take effect
    await page.waitForTimeout(300);

    // Screenshot: Metrics hidden
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/05-metrics-hidden.png`,
      fullPage: false
    });

    // Verify toggle now shows "Show Stats"
    const showButton = page.getByRole('button', { name: /show stats/i });
    await expect(showButton).toBeVisible();

    // Click to restore metrics
    await showButton.click();
    await page.waitForTimeout(300);

    // Screenshot: Metrics restored
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/06-metrics-restored.png`,
      fullPage: false
    });

    // Verify localStorage persistence
    const storageValue = await page.evaluate(() => {
      return localStorage.getItem('bedrock-metrics-bar-visible');
    });
    expect(storageValue).toBe('true');
  });

  test('Preference persists across page refresh', async ({ page }) => {
    // Navigate and hide metrics
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    const toggleButton = page.getByRole('button', { name: /hide stats/i });
    await toggleButton.click();
    await page.waitForTimeout(300);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify metrics are still hidden
    const showButton = page.getByRole('button', { name: /show stats/i });
    await expect(showButton).toBeVisible();

    // Screenshot: After refresh, still hidden
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/07-persistence-after-refresh.png`,
      fullPage: false
    });
  });
});
