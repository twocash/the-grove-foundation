import { test, expect } from '@playwright/test';

test('Debug: Capture bedrock page', async ({ page }) => {
  await page.goto('/bedrock');
  await page.waitForLoadState('networkidle');
  
  // Full page screenshot
  await page.screenshot({
    path: 'docs/sprints/s10.2-sl-aicuration-v3/screenshots/e2e/DEBUG-bedrock-full.png',
    fullPage: true,
  });
  
  // Check for analytics section
  const section = page.locator('[data-testid="quality-analytics-section"]');
  const isVisible = await section.isVisible();
  console.log('Analytics section visible:', isVisible);
  
  if (isVisible) {
    // Screenshot of section
    await section.screenshot({
      path: 'docs/sprints/s10.2-sl-aicuration-v3/screenshots/e2e/DEBUG-analytics-section.png',
    });
    
    // Check for stat cards
    const cards = section.locator('[data-testid="stat-card"]');
    const cardCount = await cards.count();
    console.log('Stat cards found:', cardCount);
  }
  
  expect(true).toBe(true);
});
