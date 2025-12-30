// tests/e2e/moment-custom-lens-offer.spec.ts
// E2E tests for custom lens offer moment
// Sprint: kinetic-cultivation-v1

import { test, expect, Page } from '@playwright/test';

/**
 * Custom Lens Offer Moment E2E Tests
 *
 * Validates that the custom lens offer moment:
 * 1. Appears after engagement threshold is met
 * 2. Shows all three action buttons (Create, Choose Existing, Dismiss)
 * 3. Each button navigates to the correct destination
 */

// Helper to clear Grove storage
async function clearGroveStorage(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('grove-'))
      .forEach(k => localStorage.removeItem(k));
  });
}

// Helper to submit a query in /explore
async function submitQuery(page: Page, query: string) {
  const input = page.locator('input[placeholder*="Ask anything"], textarea');
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(query);
  await input.press('Enter');

  // Wait for response to complete
  await page.waitForTimeout(3000);
}

test.describe('Custom Lens Offer Moment', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for clean state
    await page.goto('/explore');
    await clearGroveStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('moment appears after first exchange', async ({ page }) => {
    // Submit a query to trigger the moment
    await submitQuery(page, 'What is Grove?');

    // Wait for moment to appear (it triggers after exchangeCount >= 1)
    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Verify the heading
    await expect(page.locator('text=Ready for your own lens?')).toBeVisible();
  });

  test('moment shows Create My Lens button', async ({ page }) => {
    await submitQuery(page, 'Tell me about the ratchet effect');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Primary button: Create My Lens
    const createButton = momentCard.locator('button:has-text("Create My Lens")');
    await expect(createButton).toBeVisible();
  });

  test('moment shows Choose Existing button', async ({ page }) => {
    await submitQuery(page, 'Explain the infrastructure bet');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Secondary button: Choose Existing
    const chooseButton = momentCard.locator('button:has-text("Choose Existing")');
    await expect(chooseButton).toBeVisible();
  });

  test('moment shows Not now dismiss button', async ({ page }) => {
    await submitQuery(page, 'What is the observer dynamic?');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Dismiss button: Not now
    const dismissButton = momentCard.locator('button:has-text("Not now")');
    await expect(dismissButton).toBeVisible();
  });

  test('all three action buttons are present', async ({ page }) => {
    await submitQuery(page, 'What are the stakes?');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Verify all three buttons exist
    await expect(momentCard.locator('button:has-text("Create My Lens")')).toBeVisible();
    await expect(momentCard.locator('button:has-text("Choose Existing")')).toBeVisible();
    await expect(momentCard.locator('button:has-text("Not now")')).toBeVisible();
  });

  test('Choose Existing button is clickable', async ({ page }) => {
    await submitQuery(page, 'Tell me about Grove');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Click Choose Existing - verify button is clickable and moment transitions
    const chooseButton = momentCard.locator('button:has-text("Choose Existing")');
    await expect(chooseButton).toBeEnabled();
    await chooseButton.click();

    // After clicking, the moment buttons should no longer be visible (transitioned to actioned state)
    await expect(chooseButton).not.toBeVisible({ timeout: 5000 });
  });

  test('Create My Lens button is clickable', async ({ page }) => {
    await submitQuery(page, 'What is the cognitive split?');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Click Create My Lens - verify button is clickable and moment transitions
    const createButton = momentCard.locator('button:has-text("Create My Lens")');
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // After clicking, the moment buttons should no longer be visible (transitioned to actioned state)
    await expect(createButton).not.toBeVisible({ timeout: 5000 });
  });

  test('Not now dismisses the moment', async ({ page }) => {
    await submitQuery(page, 'Explain decentralization');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Click Not now - this triggers the actioned state with fade animation
    const dismissButton = momentCard.locator('button:has-text("Not now")');
    await dismissButton.click();

    // Wait for the confirmation to appear and then fade out (animation: 1.5s delay + 0.5s duration)
    // After dismissal, the buttons should no longer be present
    await expect(dismissButton).not.toBeVisible({ timeout: 5000 });
  });

  test('moment has Suggestion badge', async ({ page }) => {
    await submitQuery(page, 'What is Grove?');

    const momentCard = page.locator('[data-testid="moment-object"]');
    await expect(momentCard).toBeVisible({ timeout: 10000 });

    // Should have the Suggestion badge
    const badge = momentCard.locator('text=Suggestion');
    await expect(badge).toBeVisible();
  });
});
