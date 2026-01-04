// tests/e2e/explore-hybrid-toggle.spec.ts
// E2E tests for hybrid search toggle (Sprint: hybrid-search-toggle-v1)

import { test, expect } from '@playwright/test';

test.describe('Hybrid Search Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure consistent initial state
    await page.goto('/explore');
    await page.evaluate(() => localStorage.removeItem('grove-hybrid-search'));
    await page.reload();
  });

  test('toggle is visible in header', async ({ page }) => {
    await page.goto('/explore');
    const toggle = page.getByRole('button', { name: /RAG/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('OFF');
  });

  test('toggle changes state on click', async ({ page }) => {
    await page.goto('/explore');
    const toggle = page.getByRole('button', { name: /RAG/i });

    // Initially OFF
    await expect(toggle).toContainText('OFF');

    // Click to turn ON
    await toggle.click();
    await expect(toggle).toContainText('ON');

    // Click to turn OFF
    await toggle.click();
    await expect(toggle).toContainText('OFF');
  });

  test('toggle state persists after refresh', async ({ page }) => {
    await page.goto('/explore');
    const toggle = page.getByRole('button', { name: /RAG/i });

    // Turn ON
    await toggle.click();
    await expect(toggle).toContainText('ON');

    // Refresh
    await page.reload();

    // Should still be ON
    const toggleAfter = page.getByRole('button', { name: /RAG/i });
    await expect(toggleAfter).toContainText('ON');
  });
});
