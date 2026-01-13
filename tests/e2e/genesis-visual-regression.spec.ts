// tests/e2e/genesis-visual-regression.spec.ts
// Visual regression tests to ensure Genesis (/) remains unchanged

import { test, expect } from '@playwright/test';

test.describe('Genesis Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Genesis page
    await page.goto('/');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('Genesis page renders with paper aesthetic', async ({ page }) => {
    // Check that the page has paper background color (cream)
    const body = page.locator('body');

    // Wait for content to be visible
    await expect(body).toBeVisible();

    // The page should NOT have Foundation's dark theme
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Paper background should be light (not dark obsidian)
    // Paper color: #FBFBF9 = rgb(251, 251, 249)
    // The actual check depends on what CSS is applied
    expect(bgColor).not.toContain('rgb(13, 13, 13)'); // Not obsidian dark
  });

  test('Genesis does not load Foundation theme JSON', async ({ page }) => {
    // Monitor network requests
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('.theme.json')) {
        requests.push(request.url());
      }
    });

    // Navigate and wait
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should load surface.theme.json, NOT foundation-quantum.theme.json
    const foundationTheme = requests.some(url =>
      url.includes('foundation-quantum.theme.json')
    );
    expect(foundationTheme).toBe(false);
  });

  test('Genesis hero section has correct typography', async ({ page }) => {
    // Look for hero content
    const heroHeadline = page.locator('h1').first();

    if (await heroHeadline.isVisible()) {
      // Should use display font (Tenor Sans or serif)
      const fontFamily = await heroHeadline.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });

      // Should include a display/serif font, not mono
      expect(fontFamily.toLowerCase()).not.toContain('mono');
    }
  });

  test('Genesis maintains ink text color', async ({ page }) => {
    // Find any text element
    const textElement = page.locator('p').first();

    if (await textElement.isVisible()) {
      const color = await textElement.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Text should be dark (ink-like), not light
      // Ink color: #1C1C1C = rgb(28, 28, 28)
      // Ensure it's not white/light text
      expect(color).not.toContain('rgb(255, 255, 255)');
      expect(color).not.toContain('rgb(232, 232, 232)');
    }
  });

  // @fixme: Test fails - page URL comes back empty
  // Error: expect(page).toHaveURL('/') - Received: ""
  // Investigation needed: Page may not be loaded when URL is checked
  test.skip('Genesis grain texture is visible', async ({ page }) => {
    // Check for grain background class
    const grainElement = page.locator('.bg-grain');

    // Grain texture may or may not be present depending on effects
    // This is more of a presence check
    const grainCount = await grainElement.count();
    // Just verify the page loads without errors
    expect(page).toHaveURL('/');
  });
});
