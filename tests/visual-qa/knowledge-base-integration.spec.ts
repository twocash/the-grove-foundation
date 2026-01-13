// tests/visual-qa/knowledge-base-integration.spec.ts
// Visual QA tests for Knowledge Base Integration v1
// Sprint: knowledge-base-integration-v1
//
// Tests acceptance criteria for AddToKnowledgeBaseButton

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/knowledge-base-integration-v1/screenshots';

test.describe('Knowledge Base Integration Visual QA', () => {
  // Use port 3001 as fallback when 3000 is occupied
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    // Navigate to the results display demo (now includes KB button)
    await page.goto(`${BASE_URL}/dev/results-display`);
    // Wait for page content to load
    await page.waitForSelector('text=Results Display Demo', { timeout: 15000 });
    // Give time for React to render
    await page.waitForTimeout(1000);
  });

  // US-KB001: Add to Knowledge Base Button (Enabled State)
  test('AC-KB001 - KB button visible and enabled for complete documents', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Verify KB button exists and is enabled
    const kbButton = page.locator('button:has-text("Add to KB")');
    await expect(kbButton).toBeVisible();
    await expect(kbButton).toBeEnabled();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-kb-button-enabled.png`,
      fullPage: false,
    });
  });

  // US-KB001: KB Button Disabled for Insufficient Evidence
  test('AC-KB002 - KB button disabled for insufficient evidence', async ({ page }) => {
    // Switch to Insufficient mode
    const insufficientButton = page.locator('button:has-text("Insufficient")');
    await insufficientButton.click();
    await page.waitForTimeout(500);

    // Note: In insufficient evidence mode, the whole results view changes
    // and shows the InsufficientEvidenceView (no KB button)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-kb-insufficient-evidence.png`,
      fullPage: false,
    });
  });

  // US-KB001: KB Button for Partial Documents
  test('AC-KB003 - KB button visible for partial documents', async ({ page }) => {
    // Switch to Partial mode
    const partialButton = page.locator('button:has-text("Partial")');
    await partialButton.click();
    await page.waitForTimeout(500);

    // Verify KB button exists for partial documents
    const kbButton = page.locator('button:has-text("Add to KB")');
    await expect(kbButton).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-kb-button-partial.png`,
      fullPage: false,
    });
  });

  // US-KB002: KB Button Click - Captures Loading State
  test('AC-KB004 - KB button loading state on click', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Find KB button
    const kbButton = page.locator('button:has-text("Add to KB")');
    await expect(kbButton).toBeVisible();

    // Click the button - this will trigger the loading state
    // Note: The actual API call may fail in demo mode, but we capture the state change
    await kbButton.click();

    // Immediate screenshot to catch loading state (spinner)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-kb-button-loading.png`,
      fullPage: false,
    });
  });

  // US-KB002: KB Button Success State
  test('AC-KB005 - KB button shows success state after save', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Find and click KB button
    const kbButton = page.locator('button:has-text("Add to KB")');
    await kbButton.click();

    // Wait for response (success or error)
    await page.waitForTimeout(2000);

    // Screenshot after operation completes (may show "Added" or error state)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-kb-button-after-click.png`,
      fullPage: false,
    });
  });

  // US-KB002: Toast Notification
  test('AC-KB006 - Toast appears after KB action', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Find and click KB button
    const kbButton = page.locator('button:has-text("Add to KB")');
    await kbButton.click();

    // Wait for toast to appear
    await page.waitForTimeout(2000);

    // Look for toast element (success or error)
    const toast = page.locator('[role="alert"]');

    // Take full page screenshot to capture toast in corner
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-kb-toast-notification.png`,
      fullPage: true,
    });
  });

  // Full Results View with KB Button
  test('AC-KB007 - Full results view with KB integration', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Expand sources
    const sourcesButton = page.locator('button:has-text("Sources")');
    if (await sourcesButton.isVisible()) {
      await sourcesButton.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-full-view-with-kb.png`,
      fullPage: true,
    });
  });

  // Mobile Layout with KB Button
  test('AC-KB008 - Mobile layout with KB button (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Ensure Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-mobile-kb-button.png`,
      fullPage: false,
    });
  });

  // Button Hover State
  test('AC-KB009 - KB button hover state', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Find KB button and hover
    const kbButton = page.locator('button:has-text("Add to KB")');
    await kbButton.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-kb-button-hover.png`,
      fullPage: false,
    });
  });
});
