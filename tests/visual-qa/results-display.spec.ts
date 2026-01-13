// tests/visual-qa/results-display.spec.ts
// Visual QA tests for Results Display v1
// Sprint: results-display-v1
//
// Tests acceptance criteria for ResearchDocument rendering

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/results-display-v1/screenshots';

test.describe('Results Display Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dedicated demo route with mock data
    await page.goto('/dev/results-display');
    // Wait for page content to load
    await page.waitForSelector('text=Results Display Demo', { timeout: 10000 });
    // Give time for React to render
    await page.waitForTimeout(1000);
  });

  // US-E001: Display Position Statement
  test('AC-E001 - Position statement prominently displayed', async ({ page }) => {
    // Verify position card exists with gradient background
    const positionCard = page.locator('[class*="bg-gradient-to-br"]').first();
    await expect(positionCard).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-position-statement.png`,
      fullPage: false,
    });
  });

  // US-E002: Render Markdown Analysis
  test('AC-E002 - Analysis renders as formatted markdown', async ({ page }) => {
    // Verify headings are rendered
    const heading = page.locator('h2:has-text("Overview")');
    await expect(heading).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-markdown-analysis.png`,
      fullPage: false,
    });
  });

  // US-E003: Show Clickable Citations
  test('AC-E003 - Citations are clickable and informative', async ({ page }) => {
    // Click Sources to expand
    const sourcesButton = page.locator('button:has-text("Sources")');
    if (await sourcesButton.isVisible()) {
      await sourcesButton.click();
      await page.waitForTimeout(500);
    }

    // Verify citations are visible
    const citationBlock = page.locator('[id^="citation-"]').first();
    await expect(citationBlock).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-citations-section.png`,
      fullPage: false,
    });
  });

  test('AC-E003b - Inline citation link visible', async ({ page }) => {
    // Find inline citation [1]
    const inlineCitation = page.locator('button:has-text("[1]")').first();
    await expect(inlineCitation).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-inline-citation.png`,
      fullPage: false,
    });
  });

  // US-E004: Copy Document to Clipboard
  test('AC-E004 - Copy to clipboard functionality', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);

    // Find copy button
    const copyButton = page.locator('button:has-text("Copy")').first();
    await expect(copyButton).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-copy-button.png`,
      fullPage: false,
    });

    // Click copy button
    await copyButton.click();
    await page.waitForTimeout(1000);

    // Screenshot after click (may show success state)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-copy-success.png`,
      fullPage: false,
    });
  });

  // US-E005: Handle Insufficient Evidence
  test('AC-E005 - Insufficient evidence state', async ({ page }) => {
    // Click "Insufficient" button to switch mode
    const insufficientButton = page.locator('button:has-text("Insufficient")');
    await insufficientButton.click();
    await page.waitForTimeout(500);

    // Verify insufficient evidence message
    const message = page.locator('text=Not Enough Evidence');
    await expect(message).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-insufficient-evidence.png`,
      fullPage: false,
    });
  });

  // US-E006: Display Confidence Indicator
  test('AC-E006 - Confidence score is visible', async ({ page }) => {
    // Ensure we're on Complete mode
    const completeButton = page.locator('button:has-text("Complete")');
    await completeButton.click();
    await page.waitForTimeout(500);

    // Verify confidence badge (use first() since there are 2 - header and position card)
    const confidenceBadge = page.locator('text=High Confidence').first();
    await expect(confidenceBadge).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-confidence-indicator.png`,
      fullPage: false,
    });
  });

  // US-E007: Mobile Responsive Layout
  test('AC-E007 - Mobile responsive layout (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-mobile-layout.png`,
      fullPage: true,
    });
  });

  test('AC-E007b - Tablet responsive layout (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-tablet-layout.png`,
      fullPage: true,
    });
  });

  // Additional Visual Tests
  test('Citations expand/collapse animation', async ({ page }) => {
    // Find citations header
    const sourcesButton = page.locator('button:has-text("Sources")');

    // Screenshot collapsed state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-citations-collapsed.png`,
      fullPage: false,
    });

    // Expand
    await sourcesButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-citations-expanded.png`,
      fullPage: false,
    });
  });

  test('Citation hover reveals full snippet', async ({ page }) => {
    // Expand sources first
    const sourcesButton = page.locator('button:has-text("Sources")');
    await sourcesButton.click();
    await page.waitForTimeout(500);

    // Hover on first citation
    const citationBlock = page.locator('[id^="citation-"]').first();
    await citationBlock.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-citation-hover.png`,
      fullPage: false,
    });
  });

  test('Partial status with limitations', async ({ page }) => {
    // Switch to Partial mode
    const partialButton = page.locator('button:has-text("Partial")');
    await partialButton.click();
    await page.waitForTimeout(500);

    // Verify limitations section (use heading role for specificity)
    const limitations = page.getByRole('heading', { name: 'Limitations' });
    await expect(limitations).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-partial-limitations.png`,
      fullPage: false,
    });
  });

  test('Full results view composition', async ({ page }) => {
    // Expand sources for complete view
    const sourcesButton = page.locator('button:has-text("Sources")');
    await sourcesButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-full-results-view.png`,
      fullPage: true,
    });
  });
});
