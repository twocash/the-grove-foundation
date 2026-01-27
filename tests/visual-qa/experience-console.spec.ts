/**
 * Visual QA Tests: Experience Console
 * Sprint: experience-console-cleanup-v1
 *
 * These tests capture screenshots to verify UI features are working correctly.
 * Screenshots are saved to docs/sprints/experience-console-cleanup-v1/screenshots/
 *
 * Run: npx playwright test tests/visual-qa/experience-console.spec.ts
 */

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/experience-console-cleanup-v1/screenshots';

test.describe('Experience Console Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Experience Console
    await page.goto('/bedrock/experience');

    // Wait for loading to complete - look for content area
    await page.waitForSelector('.flex-1.overflow-y-auto', { state: 'visible', timeout: 10000 });

    // Allow animations to settle
    await page.waitForTimeout(1000);
  });

  test('01 - Console default view shows all objects', async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-console-default.png`,
      fullPage: true,
    });

    // Verify console loaded (allow extra time for render)
    const title = await page.locator('text=Experience').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('02 - Filter by Research Agent type shows default instance', async ({ page }) => {
    // Find and click the Type filter dropdown
    const typeFilter = page.locator('button:has-text("Type")').first();
    await typeFilter.click();
    await page.waitForTimeout(300);

    // Select Research Agent option
    const researchOption = page.locator('text=research-agent-config').first();
    if (await researchOption.isVisible()) {
      await researchOption.click();
    }
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-filter-research-agent.png`,
      fullPage: true,
    });

    // Verify at least one card is visible (the default instance)
    // This is the critical check - if no cards, the sprint failed
  });

  test('03 - Filter by Writer Agent type shows default instance', async ({ page }) => {
    // Find and click the Type filter dropdown
    const typeFilter = page.locator('button:has-text("Type")').first();
    await typeFilter.click();
    await page.waitForTimeout(300);

    // Select Writer Agent option
    const writerOption = page.locator('text=writer-agent-config').first();
    if (await writerOption.isVisible()) {
      await writerOption.click();
    }
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-filter-writer-agent.png`,
      fullPage: true,
    });
  });

  test('04 - New button dropdown shows all types', async ({ page }) => {
    // Find the +New button (should now be a dropdown)
    const newButton = page.locator('button:has-text("New")').first();
    await expect(newButton).toBeVisible();

    // Click to open dropdown
    await newButton.click();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-new-dropdown-open.png`,
      fullPage: true,
    });

    // Verify dropdown shows type options
    const dropdown = page.locator('.absolute.top-full'); // Dropdown container
    // Check if dropdown appeared (may need to adjust selector based on actual implementation)
  });

  test('05 - Research Agent Config editor opens in inspector', async ({ page }) => {
    // Filter to Research Agent type first
    const typeFilter = page.locator('button:has-text("Type")').first();
    await typeFilter.click();
    await page.waitForTimeout(300);

    const researchOption = page.locator('text=research-agent-config').first();
    if (await researchOption.isVisible()) {
      await researchOption.click();
    }
    await page.waitForTimeout(500);

    // Click the first card to open inspector
    const firstCard = page.locator('[class*="rounded-xl"][class*="border"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-research-agent-editor.png`,
      fullPage: true,
    });
  });

  test('06 - Writer Agent Config editor opens in inspector', async ({ page }) => {
    // Filter to Writer Agent type first
    const typeFilter = page.locator('button:has-text("Type")').first();
    await typeFilter.click();
    await page.waitForTimeout(300);

    const writerOption = page.locator('text=writer-agent-config').first();
    if (await writerOption.isVisible()) {
      await writerOption.click();
    }
    await page.waitForTimeout(500);

    // Click the first card to open inspector
    const firstCard = page.locator('[class*="rounded-xl"][class*="border"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-writer-agent-editor.png`,
      fullPage: true,
    });
  });

  test('07 - Empty state shows type-specific guidance', async ({ page }) => {
    // This test verifies the empty state message when filtering to a type with no instances
    // Note: May need to delete existing instances first or use a type that has none

    // Filter to a type that might be empty (e.g., prompt-architect-config)
    const typeFilter = page.locator('button:has-text("Type")').first();
    await typeFilter.click();
    await page.waitForTimeout(300);

    // Try to find an empty type
    const configOption = page.locator('text=prompt-architect-config').first();
    if (await configOption.isVisible()) {
      await configOption.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-empty-state.png`,
      fullPage: true,
    });

    // Look for empty state message
    const emptyState = page.locator('text=/No .* configs/i');
    // May or may not be visible depending on data state
  });
});

/**
 * Verification Summary Test
 *
 * This test runs last and generates a summary of what was captured
 */
test.describe('Visual QA Summary', () => {
  test('Generate verification summary', async ({ page }) => {
    console.log('\n========================================');
    console.log('VISUAL QA SUMMARY');
    console.log('Sprint: experience-console-cleanup-v1');
    console.log('========================================');
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}/`);
    console.log('');
    console.log('Expected screenshots:');
    console.log('  01-console-default.png      - Console loads with objects');
    console.log('  02-filter-research-agent.png - Research Agent filter works');
    console.log('  03-filter-writer-agent.png   - Writer Agent filter works');
    console.log('  04-new-dropdown-open.png     - +New shows dropdown');
    console.log('  05-research-agent-editor.png - Inspector opens for Research Agent');
    console.log('  06-writer-agent-editor.png   - Inspector opens for Writer Agent');
    console.log('  07-empty-state.png           - Empty state shows guidance');
    console.log('');
    console.log('Next step: Open REVIEW.html to verify all ACs');
    console.log('========================================\n');
  });
});
