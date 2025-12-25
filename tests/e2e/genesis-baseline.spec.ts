import { test, expect } from '@playwright/test';

/**
 * Genesis Visual Regression Test
 * 
 * Captures baseline screenshots to ensure paper aesthetic remains unchanged
 * after theme system implementation.
 * 
 * Run with --update-snapshots to capture new baseline:
 *   npx playwright test tests/e2e/genesis-baseline.spec.ts --update-snapshots
 */

test.describe('Genesis Visual Regression', () => {
  
  test('genesis initial state baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Capture initial state with pulsing sprout
    await expect(page).toHaveScreenshot('genesis-initial-baseline.png', {
      maxDiffPixelRatio: 0.001,
    });
  });

  test('genesis expanded page baseline', async ({ page }) => {
    test.setTimeout(120000);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Click the sprout (ActiveTree button) to open Terminal and expand page
    // The button has aria-label "Open the Terminal" when in pulsing mode
    const sproutButton = page.getByRole('button', { name: 'Open the Terminal' });
    await sproutButton.click();
    
    // Wait for split layout and Terminal to appear
    await page.waitForTimeout(2000);
    
    // Select a lens in the Terminal to unlock navigation (two-click pattern)
    // Step 1: Click lens card to preview
    const lensCard = page.locator('.terminal-panel').locator('div').filter({
      hasText: /academic|engineer|citizen|investor/i
    }).first();

    try {
      await lensCard.click({ timeout: 5000 });
      await page.waitForTimeout(300);

      // Step 2: Click "Select" button to activate
      const selectButton = page.locator('.terminal-panel').locator('button:has-text("Select")').first();
      if (await selectButton.isVisible({ timeout: 2000 })) {
        await selectButton.click();
      }
    } catch {
      // If no lens picker visible, the page may auto-unlock
      console.log('No lens picker found - page may be in unlocked state');
    }
    
    // Wait for WaveformCollapse animation and page unlock
    await page.waitForTimeout(4000);
    
    // Capture expanded page with all sections visible
    await expect(page).toHaveScreenshot('genesis-expanded-baseline.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // 1% tolerance for full page with animations
      timeout: 60000,
    });
  });

  test('genesis split layout baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click sprout to trigger split layout
    const sproutButton = page.getByRole('button', { name: 'Open the Terminal' });
    await sproutButton.click();
    
    // Wait for split animation
    await page.waitForTimeout(1500);
    
    // Capture split layout state (Terminal visible on right)
    await expect(page).toHaveScreenshot('genesis-split-baseline.png', {
      maxDiffPixelRatio: 0.005,
    });
  });

});
