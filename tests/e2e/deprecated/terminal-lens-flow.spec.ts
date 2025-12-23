/**
 * @deprecated DEPRECATED: 2024-12-23 - Active Grove Architecture Migration
 *
 * ============================================================================
 * WHY THESE TESTS ARE DEPRECATED
 * ============================================================================
 *
 * These tests were written for the pre-Active-Grove Terminal architecture which used:
 * - FAB (Floating Action Button) to open/close Terminal
 * - Tailwind `translate-x-0`/`translate-x-full` classes for drawer animation
 * - Direct URL lens → Terminal open flow
 *
 * The Active Grove architecture (v0.16+) replaced this with:
 * - Tree click (🌱) to trigger split layout
 * - CSS class `.terminal-panel.visible` for panel state
 * - URL lens → Tree click → Skip picker → Chat flow
 *
 * ============================================================================
 * WHAT TO DO WITH THESE TESTS
 * ============================================================================
 *
 * The BEHAVIOR these tests validated is still valid:
 * - URL lens parameter is recognized ✓
 * - Lens-specific welcome messages appear ✓
 * - Terminal can toggle open/closed ✓
 *
 * The IMPLEMENTATION has changed, so we created new behavior-focused tests in:
 * - tests/e2e/engagement-behaviors.spec.ts
 *
 * These tests are preserved for:
 * 1. Reference during migration
 * 2. Understanding original test intent
 * 3. Potential restoration if architecture reverts
 *
 * ============================================================================
 * MIGRATION STATUS
 * ============================================================================
 *
 * See: docs/testing/ENGAGEMENT_MIGRATION_TEST_STRATEGY.md
 *
 * Behaviors migrated to engagement-behaviors.spec.ts:
 * - [x] URL lens parameter handling (/?lens=engineer)
 * - [x] Lens-specific content verification
 * - [x] Terminal visibility state
 *
 * Behaviors intentionally NOT migrated (obsolete features):
 * - [ ] FAB button toggle
 * - [ ] translate-x animation classes
 * - [ ] Direct FAB → Terminal open flow
 *
 * ============================================================================
 */

import { test, expect } from '@playwright/test'

test.describe.skip('DEPRECATED: Terminal Lens Flow', () => {
  // Original tests preserved below for reference
  // All tests are skipped via test.describe.skip()

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('terminal opens via FAB button', async ({ page }) => {
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')
    const fabButtonClose = page.locator('button[aria-label="Close terminal"]')

    if (await fabButtonClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fabButtonClose.click()
      await page.waitForTimeout(500)
    }

    await expect(fabButtonOpen).toBeVisible({ timeout: 5000 })
    await fabButtonOpen.click()

    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
  })

  test('terminal closes via close button', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    if (!await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
      }
    }

    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const closeButton = page.locator('button[aria-label="Close"]').first()
    await closeButton.click()

    await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
  })

  test('URL lens parameter initializes academic lens', async ({ page }) => {
    await page.goto('/?lens=academic')
    await page.waitForLoadState('networkidle')

    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    if (!await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
      }
    }

    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 10000 })

    const terminalContent = await terminalDrawer.textContent()
    expect(terminalContent).toBeTruthy()

    const hasAcademicContent = terminalContent?.includes('Research Interface') ||
                               terminalContent?.includes('peer-reviewed') ||
                               terminalContent?.includes('Academic') ||
                               terminalContent?.includes('epistemic')

    expect(hasAcademicContent).toBeTruthy()
  })

  test('URL lens parameter initializes engineer lens', async ({ page }) => {
    await page.goto('/?lens=engineer')
    await page.waitForLoadState('networkidle')

    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    if (!await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
      }
    }

    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 10000 })

    const terminalContent = await terminalDrawer.textContent()
    expect(terminalContent).toBeTruthy()

    const hasEngineerContent = terminalContent?.includes('Technical Documentation') ||
                              terminalContent?.includes('cognitive router') ||
                              terminalContent?.includes('API design') ||
                              terminalContent?.includes('architecture')

    expect(hasEngineerContent).toBeTruthy()
  })

  test('default terminal shows generic welcome without lens', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    if (!await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
      }
    }

    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 10000 })

    const terminalContent = await terminalDrawer.textContent()
    expect(terminalContent).toBeTruthy()
    expect(terminalContent).toContain('The Terminal')
  })
})

test.describe.skip('DEPRECATED: Terminal Shell Chrome', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('FAB toggles terminal state', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')
    const fabButtonClose = page.locator('button[aria-label="Close terminal"]')

    const isOpen = await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)

    if (isOpen) {
      await expect(fabButtonClose).toBeVisible({ timeout: 5000 })
      await fabButtonClose.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
    } else {
      await expect(fabButtonOpen).toBeVisible({ timeout: 5000 })
      const fabContent = await fabButtonOpen.textContent()
      expect(fabContent).toContain('>_')
      await fabButtonOpen.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
    }
  })

  test('terminal drawer animation classes are correct', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')
    const fabButtonClose = page.locator('button[aria-label="Close terminal"]')

    if (await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      await fabButtonClose.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
    }

    await expect(terminalDrawer).toHaveClass(/translate-x-full/)

    await fabButtonOpen.click()

    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
  })
})
