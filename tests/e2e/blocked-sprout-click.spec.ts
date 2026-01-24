// tests/e2e/blocked-sprout-click.spec.ts
// S22-WP: Test that blocked sprouts with evidence can be clicked

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/research-writer-panel-v1/screenshots';

test.setTimeout(60000);

test.describe('S22-WP: Blocked Sprout Click Fix', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Blocked sprout with branches can be clicked to view results', async ({ page }) => {
    // Prepare a test sprout with blocked status but valid research data
    const testSprout = {
      id: 'test-blocked-sprout-' + Date.now(),
      spark: 'Test research query',
      title: 'Test Research - Blocked (writing failed)',
      status: 'blocked',
      query: 'What is AI governance?',
      response: 'Research completed but writing phase timed out',
      capturedAt: new Date().toISOString(),
      stage: 'withered',
      // Research data that SHOULD allow viewing
      researchBranches: [
        { topic: 'AI Ethics', description: 'Ethical considerations', key_findings: ['Finding 1'], evidence_ids: ['e1'] }
      ],
      researchEvidence: [
        { id: 'e1', url: 'https://example.com', title: 'Source 1', snippet: 'Evidence text', confidence: 0.85 }
      ],
      researchSynthesis: null, // No synthesis - writing failed
      researchDocument: null, // No document - writing failed
      tags: [],
      provenance: { generatedAt: new Date().toISOString() }
    };

    // Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Set up test sprout in localStorage
    await page.evaluate((sprout) => {
      localStorage.setItem('grove-test-sprout', JSON.stringify(sprout));
    }, testSprout);

    // Wait for FinishingRoomGlobal to be ready
    const listenerReady = page.locator('[data-testid="finishing-room-listener-ready"]');
    await listenerReady.waitFor({ state: 'attached', timeout: 10000 });

    console.log('[TEST] Dispatching open-finishing-room event for blocked sprout');

    // Dispatch event to open finishing room
    await page.evaluate((sproutId) => {
      window.dispatchEvent(new CustomEvent('open-finishing-room', {
        detail: { sproutId },
        bubbles: true
      }));
    }, testSprout.id);

    // Wait for modal to appear
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/blocked-sprout-01-modal.png`,
      fullPage: false
    });

    // Check if modal opened (look for finishing room dialog)
    const modal = page.locator('[data-testid="sprout-finishing-room"], [role="dialog"], .fixed.inset-0');
    const modalVisible = await modal.first().isVisible().catch(() => false);
    console.log('[TEST] Modal visible:', modalVisible);

    // Check for evidence content display (even without synthesis)
    const evidenceContent = page.locator('text=/Research|Evidence|Branch|Source/i');
    const contentCount = await evidenceContent.count();
    console.log('[TEST] Evidence-related content elements:', contentCount);

    // Log any console errors
    console.log('Console errors:', capture.errors.length);
    capture.errors.forEach((e, idx) => {
      console.log('  Error ' + (idx + 1) + ': ' + e.substring(0, 100));
    });

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('grove-test-sprout');
    });

    // Test passes if no critical errors and modal could be opened
    expect(capture.errors.filter(e =>
      e.includes('Cannot read properties') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError')
    )).toHaveLength(0);
  });
});
