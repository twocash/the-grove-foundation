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
 * - Separate minimize/expand pill states
 *
 * The Active Grove architecture (v0.16+) replaced this with:
 * - Tree click (🌱) to trigger split layout
 * - CSS class `.terminal-panel.visible` for panel state
 * - No FAB, no minimize pill - Terminal is always visible in split mode
 *
 * ============================================================================
 * WHAT TO DO WITH THESE TESTS
 * ============================================================================
 *
 * The BEHAVIOR these tests validated is still valid:
 * - Terminal shows welcome message ✓
 * - Input field is present and focusable ✓
 * - Commands can be typed ✓
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
 * - [x] Terminal visibility after tree click
 * - [x] Input field presence and functionality
 * - [x] Lens picker flow
 * - [x] URL lens parameter handling
 *
 * Behaviors intentionally NOT migrated (obsolete features):
 * - [ ] FAB button toggle
 * - [ ] Minimize pill / expand flow
 * - [ ] translate-x animation classes
 *
 * ============================================================================
 */

import { test, expect } from '@playwright/test'

test.describe.skip('DEPRECATED: Terminal Genesis', () => {
  // Original tests preserved below for reference
  // All tests are skipped via test.describe.skip()

  // Helper to ensure terminal is open
  async function ensureTerminalOpen(page: import('@playwright/test').Page) {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    const isOpen = await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)

    if (!isOpen) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
        await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
      }
    }

    return terminalDrawer
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await ensureTerminalOpen(page)
  })

  test('terminal shows initial welcome message', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const terminalContent = await terminalDrawer.textContent()
    expect(terminalContent).toContain('The Terminal')
    expect(terminalContent).toBeTruthy()
  })

  test('terminal has input field', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })
    await inputField.focus()
    await expect(inputField).toBeFocused()
  })

  test('can type in terminal input', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })
    await inputField.fill('test query')
    await expect(inputField).toHaveValue('test query')
  })

  test('terminal header shows controls', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const minimizeButton = terminalDrawer.locator('button[aria-label="Minimize"]')
    await expect(minimizeButton).toBeVisible({ timeout: 5000 })

    const closeButton = terminalDrawer.locator('button[aria-label="Close"]')
    await expect(closeButton).toBeVisible()
  })

  test('minimize button collapses terminal to pill', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const minimizeButton = terminalDrawer.locator('button[aria-label="Minimize"]')
    await minimizeButton.click()
    await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })

    const expandButton = page.locator('button[aria-label="Expand Your Grove"]')
    await expect(expandButton).toBeVisible({ timeout: 5000 })
  })

  test('can expand from minimized pill', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const minimizeButton = terminalDrawer.locator('button[aria-label="Minimize"]')
    await minimizeButton.click()
    await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })

    const expandButton = page.locator('button[aria-label="Expand Your Grove"]')
    await expect(expandButton).toBeVisible({ timeout: 5000 })
    await expandButton.click()

    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
  })
})

test.describe.skip('DEPRECATED: Terminal Commands', () => {
  async function ensureTerminalOpen(page: import('@playwright/test').Page) {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    const isOpen = await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)

    if (!isOpen) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
        await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
      }
    }

    return terminalDrawer
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await ensureTerminalOpen(page)
  })

  test('typing slash shows command detection', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })
    await inputField.fill('/')
    await expect(inputField).toHaveValue('/')
  })

  test('/help command recognized', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })
    await inputField.fill('/help')
    await expect(inputField).toHaveValue('/help')
  })

  test('/stats command recognized', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })
    await inputField.fill('/stats')
    await expect(inputField).toHaveValue('/stats')
  })
})

test.describe.skip('DEPRECATED: Terminal Message Rendering', () => {
  async function ensureTerminalOpen(page: import('@playwright/test').Page) {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    const isOpen = await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)

    if (!isOpen) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
        await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
      }
    }

    return terminalDrawer
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await ensureTerminalOpen(page)
  })

  test('welcome message uses arrow formatting for prompts', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const terminalContent = await terminalDrawer.textContent()
    expect(terminalContent).toBeTruthy()
    expect(terminalContent!.length).toBeGreaterThan(50)
  })

  test('terminal has scrollable message area', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const scrollContainer = terminalDrawer.locator('.overflow-y-auto, .overflow-auto').first()

    if (await scrollContainer.count() > 0) {
      await expect(scrollContainer).toBeVisible()
    }
  })
})

test.describe.skip('DEPRECATED: Terminal Accessibility', () => {
  async function ensureTerminalOpen(page: import('@playwright/test').Page) {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    const isOpen = await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)

    if (!isOpen) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
        await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
      }
    }

    return terminalDrawer
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('terminal drawer has correct ARIA attributes', async ({ page }) => {
    await ensureTerminalOpen(page)

    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    await expect(terminalDrawer).toHaveAttribute('role', 'dialog')
    await expect(terminalDrawer).toHaveAttribute('aria-modal', 'true')
  })

  test('FAB button has accessible label', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonClose = page.locator('button[aria-label="Close terminal"]')

    if (await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      await fabButtonClose.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
    }

    const fabButton = page.locator('button[aria-label="Open terminal"]')
    await expect(fabButton).toBeVisible({ timeout: 5000 })
    await expect(fabButton).toHaveAttribute('aria-label', 'Open terminal')
  })

  test('close button has accessible label', async ({ page }) => {
    await ensureTerminalOpen(page)

    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const closeButton = terminalDrawer.locator('button[aria-label="Close"]').first()
    await expect(closeButton).toBeVisible({ timeout: 5000 })
    await expect(closeButton).toHaveAttribute('aria-label', 'Close')
  })
})
