// tests/e2e/garden-content-viewer.spec.ts
// Sprint: S25-SFR garden-content-viewer-v1
// Protocol: Grove Execution Protocol v1.5 — Constraint 11
// Verifies DocumentContentModal renders Garden document content
// via portable DocumentCatalog (json-render)

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  type ConsoleCapture,
} from './_test-utils';

const SCREENSHOTS_DIR = 'docs/sprints/garden-content-viewer-v1/screenshots/e2e';

test.describe('Garden Content Viewer — DocumentContentModal', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Garden Console loads without critical errors', async ({ page }) => {
    await page.goto('/bedrock/garden');
    await waitForPageStable(page);

    // Screenshot: Garden Console loaded
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/01-garden-console-loaded.png`,
      fullPage: false,
    });

    // Verify no critical console errors during load
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('Document inspector shows View Content button when content exists', async ({ page }) => {
    await page.goto('/bedrock/garden');
    await waitForPageStable(page);

    // Look for document cards/rows in the grid
    const cards = page.locator('[data-testid="object-card"], [data-testid="grove-card"]');
    const cardCount = await cards.count();

    // Screenshot: Grid state
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/02-document-grid.png`,
      fullPage: false,
    });

    if (cardCount === 0) {
      // No documents — verify empty state is rendered gracefully
      console.log('No documents in Garden Console — skipping content viewer test');
      return;
    }

    // Click first document to open inspector
    await cards.first().click();
    await page.waitForTimeout(500);

    // Screenshot: Inspector open
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/03-document-inspector.png`,
      fullPage: false,
    });

    // Check for "View Content" button (appears when document has content)
    const viewContentButton = page.getByRole('button', { name: /View Content/i });
    const hasContent = await viewContentButton.isVisible().catch(() => false);

    if (!hasContent) {
      console.log('Selected document has no content — View Content button not shown (expected)');
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/03b-no-content-graceful.png`,
        fullPage: false,
      });
      // Verify no errors even without content
      expect(getCriticalErrors(capture.errors)).toHaveLength(0);
      return;
    }

    // Screenshot: View Content button visible
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/04-view-content-button.png`,
      fullPage: false,
    });

    // Click View Content to open DocumentContentModal
    await viewContentButton.click();
    await page.waitForTimeout(500);

    // Verify modal is open (role="dialog" with aria-modal)
    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();

    // Screenshot: Modal open with rendered content
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/05-content-modal-open.png`,
      fullPage: false,
    });

    // Verify modal has expected structure
    // Header: title text
    const modalTitle = modal.locator('h2');
    await expect(modalTitle).toBeVisible();

    // Body: rendered document content (via Renderer + DocumentRegistry)
    const modalBody = modal.locator('.flex-1.overflow-y-auto');
    await expect(modalBody).toBeVisible();

    // Footer: word count and action buttons
    const copyButton = modal.getByRole('button', { name: /Copy/i });
    await expect(copyButton).toBeVisible();
    const closeButton = modal.getByRole('button', { name: /Close/i });
    await expect(closeButton).toBeVisible();

    // Screenshot: Modal footer with actions
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/06-modal-footer.png`,
      fullPage: false,
    });

    // Close modal via Close button
    await closeButton.click();
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();

    // Screenshot: After modal close
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/07-after-modal-close.png`,
      fullPage: false,
    });

    // Final check: zero critical errors during entire flow
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('DocumentContentModal closes on Escape key', async ({ page }) => {
    await page.goto('/bedrock/garden');
    await waitForPageStable(page);

    // Click first document card
    const cards = page.locator('[data-testid="object-card"], [data-testid="grove-card"]');
    if ((await cards.count()) === 0) return;

    await cards.first().click();
    await page.waitForTimeout(500);

    // Check for View Content button
    const viewContentButton = page.getByRole('button', { name: /View Content/i });
    if (!(await viewContentButton.isVisible().catch(() => false))) return;

    // Open modal
    await viewContentButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();

    // Screenshot: Escape key closes modal
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/08-escape-closes-modal.png`,
      fullPage: false,
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });

  test('DocumentContentModal closes on backdrop click', async ({ page }) => {
    await page.goto('/bedrock/garden');
    await waitForPageStable(page);

    const cards = page.locator('[data-testid="object-card"], [data-testid="grove-card"]');
    if ((await cards.count()) === 0) return;

    await cards.first().click();
    await page.waitForTimeout(500);

    const viewContentButton = page.getByRole('button', { name: /View Content/i });
    if (!(await viewContentButton.isVisible().catch(() => false))) return;

    await viewContentButton.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();

    // Click backdrop (the fixed overlay, outside the dialog)
    const backdrop = page.locator('.fixed.inset-0.z-50');
    await backdrop.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // Verify modal is closed
    await expect(modal).not.toBeVisible();

    // Screenshot: Backdrop click closes modal
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/09-backdrop-closes-modal.png`,
      fullPage: false,
    });

    expect(getCriticalErrors(capture.errors)).toHaveLength(0);
  });
});
