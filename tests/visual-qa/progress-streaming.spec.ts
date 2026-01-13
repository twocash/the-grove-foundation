// tests/visual-qa/progress-streaming.spec.ts
// Visual QA tests for Progress Streaming UI
// Sprint: progress-streaming-ui-v1

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/progress-streaming-ui-v1/screenshots';

test.describe('Progress Streaming UI Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
  });

  test('01 - Progress panel research phase', async ({ page }) => {
    // Note: This requires an active sprout - may need mock data
    // For manual testing: trigger a research sprout execution first
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-progress-research-phase.png`,
      fullPage: false,
    });
  });

  test('02 - Progress panel with search query', async ({ page }) => {
    // Captures the search query display when a search is active
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-progress-search-query.png`,
    });
  });

  test('03 - Progress panel with sources', async ({ page }) => {
    // Captures the source list with discovered URLs
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-progress-sources.png`,
    });
  });

  test('04 - Progress panel writing phase', async ({ page }) => {
    // Captures the writing phase state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-progress-writing-phase.png`,
    });
  });

  test('05 - Progress panel completion', async ({ page }) => {
    // Captures the completion state with success indicator
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-progress-complete.png`,
    });
  });

  test('06 - Progress panel error state', async ({ page }) => {
    // Captures the error state with retry option
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-progress-error.png`,
    });
  });
});
