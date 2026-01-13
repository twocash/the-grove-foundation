// tests/demo/research-lifecycle-demo.spec.ts
// Playwright video demo for Research Lifecycle v1.0
// Sprint: polish-demo-prep-v1
//
// Purpose: Generate video evidence of the complete research lifecycle.
// Note: These tests require the dev server and may take 60-120 seconds.

import { test, expect } from '@playwright/test';

test.describe('Research Lifecycle v1.0 Demo', () => {
  // Demo tests use video recording configured in playwright.config.ts

  test('Complete lifecycle: sprout to document @demo', async ({ page }) => {
    // Scene 1: Navigate to explore
    await page.goto('/explore');

    // Wait for the explore shell to load
    await expect(page.locator('.min-h-screen')).toBeVisible({ timeout: 10000 });

    // Pause for demo narration points
    await page.waitForTimeout(2000);

    // Scene 2: Find the command input and create research sprout
    const queryInput = page.locator('input[placeholder*="Ask anything"], textarea[placeholder*="Ask anything"]');

    // Wait for input to be visible and enabled
    await expect(queryInput).toBeVisible({ timeout: 10000 });

    // Type the research query with sprout: prefix
    await queryInput.fill('sprout: What are the economic implications of local AI hardware ownership?');
    await page.waitForTimeout(1500); // Show query before submit

    // Take screenshot of query entered
    await page.screenshot({
      path: 'docs/sprints/polish-demo-prep-v1/screenshots/01-query-entered.png',
      fullPage: false
    });

    // Submit the query
    await page.keyboard.press('Enter');

    // Scene 3: Wait for prompt architect / confirmation view
    // The Garden Inspector should appear with confirmation UI
    await page.waitForTimeout(5000);

    // Look for confirmation elements or research progress
    const confirmOrProgress = page.locator('text=/confirm|research|branch|searching/i');
    await expect(confirmOrProgress.first()).toBeVisible({ timeout: 30000 });

    // Take screenshot of confirmation/progress
    await page.screenshot({
      path: 'docs/sprints/polish-demo-prep-v1/screenshots/02-confirmation-or-progress.png',
      fullPage: false
    });

    // Scene 4: If confirmation dialog appears, click Start Research
    const startButton = page.locator('button:has-text("Start Research")');
    if (await startButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Scene 5: Watch research progress
    // Look for progress indicators
    await page.waitForTimeout(10000);

    // Screenshot during research phase
    await page.screenshot({
      path: 'docs/sprints/polish-demo-prep-v1/screenshots/03-research-in-progress.png',
      fullPage: false
    });

    // Wait longer for research to complete (up to 90 seconds)
    await page.waitForTimeout(30000);

    // Screenshot after more progress
    await page.screenshot({
      path: 'docs/sprints/polish-demo-prep-v1/screenshots/04-research-progress-later.png',
      fullPage: false
    });

    // Scene 6: Look for completion or results
    // This might show results, complete status, or still be in progress
    await page.waitForTimeout(20000);

    // Final screenshot
    await page.screenshot({
      path: 'docs/sprints/polish-demo-prep-v1/screenshots/05-final-state.png',
      fullPage: false
    });
  });

  test('UI Components: Error handling display @demo', async ({ page }) => {
    // This test captures screenshots of error handling components
    // We'll navigate to the results display demo page if available

    await page.goto('/explore');
    await expect(page.locator('.min-h-screen')).toBeVisible({ timeout: 10000 });

    // Wait for page load
    await page.waitForTimeout(2000);

    // Screenshot the initial state
    await page.screenshot({
      path: 'docs/sprints/polish-demo-prep-v1/screenshots/06-explore-initial.png',
      fullPage: false
    });
  });

  test('UI Components: Garden Inspector view @demo', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('.min-h-screen')).toBeVisible({ timeout: 10000 });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Look for Garden Tray or Inspector elements
    const gardenElements = page.locator('[data-testid="garden-tray"], .garden-inspector, text=/garden|sprout/i');

    if (await gardenElements.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.screenshot({
        path: 'docs/sprints/polish-demo-prep-v1/screenshots/07-garden-view.png',
        fullPage: false
      });
    }
  });
});

test.describe('Component Showcase @demo', () => {
  // These tests can be run against the ResultsDisplayDemo page if available

  test('Results display demo page', async ({ page }) => {
    // Try to access the demo page for component showcase
    await page.goto('/foundation/explore-demo').catch(() => {});

    // If demo page exists, capture it
    if (page.url().includes('explore-demo')) {
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: 'docs/sprints/polish-demo-prep-v1/screenshots/08-results-demo.png',
        fullPage: true
      });
    }
  });
});
