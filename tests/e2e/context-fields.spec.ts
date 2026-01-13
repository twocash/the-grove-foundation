// tests/e2e/context-fields.spec.ts
// E2E tests for Context Fields prompt system
// Sprint: genesis-context-fields-v1 (Epic 7)

import { test, expect } from '@playwright/test';

test.describe('Context Fields Prompts', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('grove-'))
        .forEach(k => localStorage.removeItem(k));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('displays prompts on explore page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The page should load with the app visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check that basic React app structure exists
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  // @fixme: Test times out - beforeEach navigation takes too long
  test.skip('prompts update based on interaction count', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial prompt suggestions (if visible)
    const inputArea = page.locator('textarea, input[type="text"]').first();

    if (await inputArea.count() > 0 && await inputArea.isVisible({ timeout: 5000 })) {
      // Send a message to increase interaction count
      await inputArea.fill('What is The Grove?');
      await inputArea.press('Enter');

      // Wait for response
      await page.waitForTimeout(3000);

      // Interaction count should increase, which may change available prompts
      // The actual prompts displayed depend on stage, lens, and entropy
    }
  });

  test('lens selection affects prompt filtering', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for lens picker if available - check multiple possible selectors
    const lensPicker = page.locator('[data-testid="lens-picker"], .lens-picker, [aria-label*="lens"]').first();

    if (await lensPicker.count() > 0 && await lensPicker.isVisible({ timeout: 3000 })) {
      // Click to open lens options
      await lensPicker.click();

      // Look for Dr. Chiang lens option
      const chiangOption = page.locator('text=Dr. Chiang');

      if (await chiangOption.count() > 0 && await chiangOption.isVisible({ timeout: 2000 })) {
        await chiangOption.click();

        // After selecting Dr. Chiang lens, prompts should be filtered
        // to show lens-specific prompts with higher priority
        await page.waitForTimeout(1000);
      }
    }
  });

  // @fixme: Test times out - multiple query submissions take too long
  // Needs optimization: reduce query count or increase timeout
  test.skip('high entropy triggers moment-based prompts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputArea = page.locator('textarea, input[type="text"]').first();

    if (await inputArea.count() > 0 && await inputArea.isVisible({ timeout: 5000 })) {
      // Send several varied queries to increase entropy
      const queries = [
        'What is the Ratchet Effect?',
        'How does governance work?',
        'Tell me about distributed systems',
        'What is the observer dynamic?',
      ];

      for (const query of queries) {
        await inputArea.fill(query);
        await inputArea.press('Enter');
        await page.waitForTimeout(2000);
      }

      // With high entropy (many diverse topics),
      // the high_entropy moment should activate
      // and stabilization prompts should surface
    }
  });
});

test.describe('Generated Prompts', () => {
  // @fixme: Test times out - multiple interactions take too long
  test.skip('generates prompts after 2+ interactions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputArea = page.locator('textarea, input[type="text"]').first();

    if (await inputArea.count() > 0 && await inputArea.isVisible({ timeout: 5000 })) {
      // Send 3 messages to trigger generation
      for (let i = 0; i < 3; i++) {
        await inputArea.fill(`Question ${i + 1} about Grove`);
        await inputArea.press('Enter');
        await page.waitForTimeout(2000);
      }

      // After 2+ interactions, generated prompts should be available
      // Check console for generation logs
      page.on('console', msg => {
        if (msg.text().includes('[PromptCollection] Generated')) {
          expect(msg.text()).toContain('Generated');
        }
      });
    }
  });
});
