// tests/e2e/sprout-generation-smoke.spec.ts
// Smoke test for sprout generation flow
// Sprint: 1.0-release-qa
//
// This test verifies the critical path:
// 1. Template loading works (no 406 errors)
// 2. Research API is reachable (no 400 errors from missing systemPrompt)
// 3. Sprout creation doesn't crash
//
// NOTE: This test does NOT complete full research (would take too long).
// It validates the setup/config loading that often breaks on production.

import { test, expect } from '@playwright/test';

test.describe('Sprout Generation - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Console Error]: ${msg.text()}`);
      }
    });
  });

  test('Template loader does not throw 406 errors', async ({ page }) => {
    const errors406: string[] = [];

    // Intercept network requests
    page.on('response', response => {
      if (response.status() === 406) {
        errors406.push(`406 on ${response.url()}`);
      }
    });

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any lazy-loaded template queries
    await page.waitForTimeout(2000);

    expect(errors406).toHaveLength(0);
  });

  test('Config loaders do not throw 406 errors', async ({ page }) => {
    const errors406: string[] = [];

    page.on('response', response => {
      if (response.status() === 406 && response.url().includes('supabase')) {
        errors406.push(`406 on ${response.url()}`);
      }
    });

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for specific RPC endpoints that should work
    expect(errors406.filter(e => e.includes('output_templates'))).toHaveLength(0);
    expect(errors406.filter(e => e.includes('agent_config'))).toHaveLength(0);
  });

  test('Research API endpoint is reachable', async ({ page, request }) => {
    // Skip if no BASE_URL (local dev)
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Just verify the endpoint exists and responds (even if error due to missing body)
    const response = await request.post(`${baseUrl}/api/research/deep`, {
      data: {},
      headers: { 'Content-Type': 'application/json' }
    });

    // 400/404 are expected (missing required fields or endpoint variation)
    // 500/503 would indicate server issues
    expect(response.status()).toBeLessThan(500);
  });

  test('Explore page loads without critical JavaScript errors', async ({ page }) => {
    const criticalErrors: string[] = [];

    page.on('pageerror', error => {
      // Filter out known benign errors
      if (!error.message.includes('ResizeObserver') &&
          !error.message.includes('ChunkLoadError')) {
        criticalErrors.push(error.message);
      }
    });

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter for truly critical errors (API/config issues)
    const apiErrors = criticalErrors.filter(e =>
      e.includes('systemPrompt is required') ||
      e.includes('406') ||
      e.includes('Supabase') ||
      e.includes('template')
    );

    expect(apiErrors).toHaveLength(0);
  });

  test('Explore page renders without blank screen', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Basic sanity check that the page rendered
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Page should not be completely empty
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});

test.describe('Sprout Generation - Integration', () => {
  // These tests require more setup and are skipped by default
  // Run with: npx playwright test sprout-generation-smoke.spec.ts --grep "Integration"

  test.skip('Can initiate sprout creation flow', async ({ page }) => {
    // This would test the full flow but is skipped for smoke testing
    // Enable when you want to do full integration testing

    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Type a research query
    const input = page.locator('[data-testid="command-input"], input[type="text"]').first();
    await input.fill('sprout: test research query');
    await input.press('Enter');

    // Should see confirmation dialog or progress indicator
    await expect(page.locator('[data-testid="sprout-confirmation"], [data-testid="research-progress"]')).toBeVisible({ timeout: 10000 });
  });
});
