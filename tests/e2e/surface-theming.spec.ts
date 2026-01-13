// tests/e2e/surface-theming.spec.ts
// Tests for surface detection and theme switching

import { test, expect } from '@playwright/test';

test.describe('Surface Theming', () => {
  test('Genesis route uses genesis surface', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Genesis should use paper aesthetic colors
    // Check that Foundation's dark theme is NOT applied
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should not be Foundation's obsidian dark (#0D0D0D = rgb(13, 13, 13))
    expect(bgColor).not.toBe('rgb(13, 13, 13)');
  });

  test('Foundation route uses foundation surface', async ({ page }) => {
    await page.goto('/foundation');
    await page.waitForLoadState('networkidle');

    // Foundation header should be visible
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Check that theme accent color is applied via CSS variable
    const accentColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-accent-primary')
        .trim();
    });

    // Foundation quantum theme uses emerald accent (#10B981)
    expect(accentColor).toBeTruthy();
  });

  test('Theme switches when navigating between surfaces', async ({ page }) => {
    // Start at genesis
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const genesisThemeBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-bg-primary')
        .trim();
    });

    // Navigate to foundation
    await page.goto('/foundation');
    await page.waitForLoadState('networkidle');

    const foundationThemeBg = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-bg-primary')
        .trim();
    });

    // The theme backgrounds should be different between surfaces
    // Genesis uses paper cream, Foundation uses dark obsidian
    expect(genesisThemeBg).not.toBe(foundationThemeBg);
  });

  test('Foundation has dark mode class applied', async ({ page }) => {
    await page.goto('/foundation');
    await page.waitForLoadState('networkidle');

    // Check for dark class on html element (Foundation defaults to dark)
    const hasDarkClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    // Foundation should have dark mode by default
    expect(hasDarkClass).toBe(true);
  });

  test('Theme tokens are applied to Foundation components', async ({ page }) => {
    await page.goto('/foundation');
    await page.waitForLoadState('networkidle');

    // Check that Foundation layout uses theme tokens
    // Look for the nav sidebar
    const nav = page.locator('nav').first();

    if (await nav.isVisible()) {
      // Should use theme-bg-secondary for sidebar
      const navClasses = await nav.getAttribute('class');
      expect(navClasses).toContain('bg-theme-bg-secondary');
    }
  });

  // @fixme: Theme not loaded as network request - themes may be bundled at build time
  test.skip('Terminal route loads correct theme', async ({ page }) => {
    const themeRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('.theme.json')) {
        themeRequests.push(request.url());
      }
    });

    await page.goto('/terminal');
    await page.waitForLoadState('networkidle');

    // Should request terminal.theme.json
    const terminalThemeLoaded = themeRequests.some(url =>
      url.includes('terminal.theme.json')
    );
    expect(terminalThemeLoaded).toBe(true);
  });

  // @fixme: Theme not loaded as network request - themes may be bundled at build time
  test.skip('Marketing routes use surface theme', async ({ page }) => {
    const themeRequests: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('.theme.json')) {
        themeRequests.push(request.url());
      }
    });

    // Navigate to a non-existent route (should fallback to marketing surface)
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    // Should use surface theme (catches redirect to /)
    const surfaceThemeLoaded = themeRequests.some(url =>
      url.includes('surface.theme.json')
    );
    expect(surfaceThemeLoaded).toBe(true);
  });
});
