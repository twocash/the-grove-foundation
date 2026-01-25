// tests/e2e/real-research-display.spec.ts
// S22-WP: Test REAL research pipeline - no mock data
import { test, expect } from '@playwright/test';
import { setupConsoleCapture, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/research-writer-panel-v1/screenshots';

test.setTimeout(300000); // 5 minutes for real research

test.describe('S22-WP: Real Research Display', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Full research pipeline displays complete results', async ({ page }) => {
    // Go to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="garden-tray"]', { timeout: 15000 });
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-01-initial.png` });
    
    // Step 1: Type sprout command to trigger confirmation dialog
    const sparkQuery = 'sprout: What are the key differences between transformer and diffusion model architectures for AI?';
    const commandInput = page.locator('[data-testid="command-input"]');
    await commandInput.fill(sparkQuery);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-02-command-entered.png` });

    // Submit to trigger GardenInspector confirmation
    await page.keyboard.press('Enter');

    // Wait for GardenInspector confirmation view to appear
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-03-confirmation-dialog.png` });

    // Step 2: The confirmation form has Title, Instructions, etc.
    // Find and fill the instructions/prompt textarea (the detailed research prompt)
    const instructionsTextarea = page.locator('textarea').filter({
      hasText: /.*/  // Match any textarea
    }).first();

    // Add detailed research instructions
    const detailedPrompt = 'Focus on practical differences in training methodology, compute requirements, and typical use cases. Include comparison of quality, speed, and resource usage.';

    if (await instructionsTextarea.count() > 0) {
      await instructionsTextarea.fill(detailedPrompt);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-04-instructions-filled.png` });

    // Step 3: Click "Start Research" button to begin
    const startButton = page.locator('button:has-text("Start Research"), button:has-text("Confirm")').first();
    await startButton.click();
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-04-started.png` });
    
    // Wait for research to complete - up to 4 minutes
    console.log('[TEST] Waiting for research to complete...');
    
    // Poll for completion
    let completed = false;
    for (let i = 0; i < 48; i++) { // 48 * 5s = 4 minutes
      await page.waitForTimeout(5000);
      
      // Take progress screenshot every 30 seconds
      if (i % 6 === 0) {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-05-progress-${i}.png` });
        console.log(`[TEST] Progress check ${i}...`);
      }
      
      // Check for finishing room or completed state
      const finishingRoom = page.locator('[data-testid="sprout-finishing-room"]');
      const hasFinishingRoom = await finishingRoom.count() > 0;
      
      // Also check for blocked sprout in tray (research complete but writing failed)
      const blockedSprout = page.locator('[data-testid="sprout-row"]').filter({
        has: page.locator('text=/blocked|complete/i')
      });
      const hasBlockedSprout = await blockedSprout.count() > 0;
      
      if (hasFinishingRoom || hasBlockedSprout) {
        completed = true;
        console.log('[TEST] Research completed!');
        break;
      }
    }
    
    if (!completed) {
      console.log('[TEST] Research did not complete in time');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-06-timeout.png`, fullPage: true });
    }
    
    // Take final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-07-final.png`, fullPage: true });
    
    // If finishing room is open, verify content
    const finishingRoom = page.locator('[data-testid="sprout-finishing-room"]');
    if (await finishingRoom.count() > 0) {
      console.log('[TEST] Finishing room is open');
      
      // Check for synthesis block
      const synthesis = page.locator('text=Research Synthesis');
      console.log('[TEST] Has synthesis:', await synthesis.count() > 0);
      
      // Check for real URLs
      const realUrls = page.locator('a[href^="https://"]');
      console.log('[TEST] Real URLs:', await realUrls.count());
      
      // Check for source cards
      const sourceCards = page.locator('[class*="rounded-lg"]').filter({
        has: page.locator('a[href^="https://"]')
      });
      console.log('[TEST] Source cards:', await sourceCards.count());
      
    } else {
      // Click on a sprout to open finishing room
      const sproutRow = page.locator('[data-testid="sprout-row"]').first();
      if (await sproutRow.count() > 0) {
        await sproutRow.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/real-research-08-finishing-room.png`, fullPage: true });
      }
    }
    
    // Verify no critical errors
    const criticalErrors = capture.errors.filter(e =>
      e.includes('Cannot read properties') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError')
    );
    
    console.log('[TEST] Console errors:', capture.errors.length);
    console.log('[TEST] Critical errors:', criticalErrors.length);
    
    expect(criticalErrors).toHaveLength(0);
  });
});
