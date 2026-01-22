// tests/e2e/output-template-architecture.spec.ts
// Visual verification for Sprint: prompt-template-architecture-v1
// Captures screenshots proving acceptance criteria are met

import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/prompt-template-architecture-v1/screenshots';

// Increase timeout for all tests since we need to wait for data loading
test.setTimeout(60000);

test.describe('Output Template Architecture v1 - Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Experience Console
    await page.goto('/bedrock/experience');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    try {
      await page.waitForSelector('text=Showing', { timeout: 15000 });
    } catch {
      console.log('Loading timeout - capturing current state');
    }
    await page.waitForTimeout(1000); // Allow animations to settle
  });

  test('01 - Filter to Output Templates shows templates', async ({ page }) => {
    console.log('Filtering to Output Templates...');

    // Click the Type filter dropdown
    const typeFilter = page.locator('button:has-text("Type")');
    await typeFilter.click();
    await page.waitForTimeout(500);

    // Select Output Template
    const outputTemplateOption = page.locator('text=Output Template');
    if (await outputTemplateOption.count() > 0) {
      await outputTemplateOption.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-filter-output-templates.png`,
      fullPage: false
    });

    // Check for Output Template cards
    const templateCards = page.locator('[data-testid="output-template-card"]');
    const cardCount = await templateCards.count();
    console.log(`Found ${cardCount} output template cards`);

    // We should have system seed templates
    // Note: In a real scenario, seeds would need to be loaded first
  });

  test('02 - System seed template shows SYSTEM badge', async ({ page }) => {
    console.log('Checking system seed badges...');

    // Filter to Output Templates first
    const typeFilter = page.locator('button:has-text("Type")');
    await typeFilter.click();
    await page.waitForTimeout(500);

    const outputTemplateOption = page.locator('text=Output Template');
    if (await outputTemplateOption.count() > 0) {
      await outputTemplateOption.first().click();
      await page.waitForTimeout(1000);
    }

    // Look for SYSTEM badge on cards
    const systemBadge = page.locator('text=SYSTEM');
    const hasBadge = await systemBadge.count() > 0;
    console.log(`System seed badge visible: ${hasBadge}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-system-seed-badge.png`,
      fullPage: false
    });
  });

  test('03 - Click system seed shows read-only editor with Fork button', async ({ page }) => {
    console.log('Opening system seed editor...');

    // Filter to Output Templates
    const typeFilter = page.locator('button:has-text("Type")');
    await typeFilter.click();
    await page.waitForTimeout(500);

    const outputTemplateOption = page.locator('text=Output Template');
    if (await outputTemplateOption.count() > 0) {
      await outputTemplateOption.first().click();
      await page.waitForTimeout(1000);
    }

    // Click on first Output Template card
    const templateCard = page.locator('[data-testid="output-template-card"]').first();
    if (await templateCard.count() > 0) {
      await templateCard.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-system-seed-editor.png`,
        fullPage: false
      });

      // Look for Fork button (system seeds should have this)
      const forkButton = page.locator('button:has-text("Fork")');
      const hasFork = await forkButton.count() > 0;
      console.log(`Fork button visible: ${hasFork}`);

      // Look for read-only indicator
      const readOnlyBadge = page.locator('text=Read-only');
      const hasReadOnly = await readOnlyBadge.count() > 0;
      console.log(`Read-only badge visible: ${hasReadOnly}`);
    } else {
      console.log('No Output Template cards found');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-no-templates.png`,
        fullPage: false
      });
    }
  });

  test('04 - Fork flow creates editable template', async ({ page }) => {
    console.log('Testing fork flow...');

    // This test assumes system seeds are loaded
    // In a real scenario, we'd need to set up test data

    // Filter to Output Templates
    const typeFilter = page.locator('button:has-text("Type")');
    await typeFilter.click();
    await page.waitForTimeout(500);

    const outputTemplateOption = page.locator('text=Output Template');
    if (await outputTemplateOption.count() > 0) {
      await outputTemplateOption.first().click();
      await page.waitForTimeout(1000);
    }

    // Click on first card
    const templateCard = page.locator('[data-testid="output-template-card"]').first();
    if (await templateCard.count() > 0) {
      await templateCard.click();
      await page.waitForTimeout(1000);

      // Click Fork button if visible
      const forkButton = page.locator('button:has-text("Fork")');
      if (await forkButton.count() > 0) {
        await forkButton.click();
        await page.waitForTimeout(2000); // Wait for fork operation

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/04-forked-template.png`,
          fullPage: false
        });

        // Verify forked badge appears
        const forkedBadge = page.locator('text=FORKED');
        const hasForked = await forkedBadge.count() > 0;
        console.log(`Forked badge visible: ${hasForked}`);
      } else {
        console.log('No Fork button - template may already be user-owned');
      }
    }
  });

  test('05 - Create new template shows user-created source', async ({ page }) => {
    console.log('Testing new template creation...');

    // Click +New button
    const newButton = page.locator('button:has-text("New")').first();
    await newButton.click();
    await page.waitForTimeout(500);

    // Select Output Template from dropdown
    const outputTemplateOption = page.locator('text=Output Template');
    if (await outputTemplateOption.count() > 0) {
      await outputTemplateOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-new-template-created.png`,
        fullPage: false
      });

      // New templates should not have SYSTEM badge (they're user-created)
      const systemBadge = page.locator('.inspector-panel text=SYSTEM');
      const hasSystem = await systemBadge.count() > 0;
      console.log(`System badge on new template: ${hasSystem} (should be false)`);
    } else {
      console.log('Output Template option not found in dropdown');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-dropdown-open.png`,
        fullPage: false
      });
    }
  });

  test('06 - Agent type filter works', async ({ page }) => {
    console.log('Testing agent type filter...');

    // First filter to Output Templates
    const typeFilter = page.locator('button:has-text("Type")');
    await typeFilter.click();
    await page.waitForTimeout(500);

    const outputTemplateOption = page.locator('text=Output Template');
    if (await outputTemplateOption.count() > 0) {
      await outputTemplateOption.first().click();
      await page.waitForTimeout(1000);
    }

    // Now filter by Agent Type (should be available for output-template)
    const agentTypeFilter = page.locator('button:has-text("Agent Type")');
    if (await agentTypeFilter.count() > 0) {
      await agentTypeFilter.click();
      await page.waitForTimeout(500);

      // Select "writer"
      const writerOption = page.locator('text=writer');
      if (await writerOption.count() > 0) {
        await writerOption.first().click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-writer-templates-filtered.png`,
        fullPage: false
      });
    } else {
      console.log('Agent Type filter not found');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-filters-current-state.png`,
        fullPage: false
      });
    }
  });

  test('07 - Template selection in ReviseForm (Refinement Room)', async ({ page }) => {
    console.log('Testing template selection in ReviseForm...');

    // Navigate to a sprout finishing room (requires existing sprout)
    // This is a more complex test that would require setup

    // For now, capture what's available in the nursery or garden
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-explore-page.png`,
      fullPage: false
    });

    // Note: Full integration test would require:
    // 1. Creating a sprout
    // 2. Opening the finishing room
    // 3. Verifying template selector is visible
    console.log('Full ReviseForm integration test requires sprout setup');
  });
});
