// tests/feature-flags-v1-screenshots.spec.ts
// Visual verification for Sprint D: feature-flags-v1

import { test, expect } from '@playwright/test';

test.describe('feature-flags-v1 Visual Verification', () => {
  test('capture screenshots for sprint review', async ({ page }) => {
    // Screenshot 1: Console View
    console.log('Navigating to Feature Flags Console...');
    await page.goto('http://localhost:3000/bedrock/feature-flags');

    // Wait for console to load - look for the console factory elements
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for React rendering

    await page.screenshot({
      path: 'docs/sprints/feature-flags-v1/screenshots/01-console-view.png',
      fullPage: false
    });
    console.log('Screenshot 1: Console View captured');

    // Screenshot 2: Flag Editor - click first flag card if present
    const flagCard = page.locator('[data-testid="feature-flag-card"]').first();
    const hasCards = await flagCard.count() > 0;

    if (hasCards) {
      await flagCard.click();
      await page.waitForTimeout(1000); // Wait for inspector to render

      await page.screenshot({
        path: 'docs/sprints/feature-flags-v1/screenshots/02-flag-editor.png',
        fullPage: false
      });
      console.log('Screenshot 2: Flag Editor captured');
    } else {
      // No flags exist - capture empty state instead
      console.log('No flags found - capturing empty console state');
      await page.screenshot({
        path: 'docs/sprints/feature-flags-v1/screenshots/02-empty-state.png',
        fullPage: false
      });
    }

    // Screenshot 3: Header Toggles in /explore
    console.log('Navigating to /explore for header toggles...');
    await page.goto('http://localhost:3000/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'docs/sprints/feature-flags-v1/screenshots/03-header-toggles.png',
      fullPage: false
    });
    console.log('Screenshot 3: Header Toggles captured');

    console.log('All screenshots captured successfully!');
  });
});
