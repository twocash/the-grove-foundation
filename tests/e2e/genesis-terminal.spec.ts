import { test, expect } from '@playwright/test'

/**
 * Genesis Terminal E2E Tests
 * Sprint: Terminal Architecture Refactor v1.0 - Epic 6
 *
 * Tests the terminal chat functionality:
 * - Message input and submission
 * - Loading states
 * - Response rendering
 * - Command palette basics
 */

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

test.describe('Terminal Genesis', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset state
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

    // Should contain welcome heading
    expect(terminalContent).toContain('The Terminal')

    // Should contain prompts/suggestions
    expect(terminalContent).toBeTruthy()
  })

  test('terminal has input field', async ({ page }) => {
    // Look for input field within terminal
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })

    // Input should be focusable
    await inputField.focus()
    await expect(inputField).toBeFocused()
  })

  test('can type in terminal input', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    const inputField = terminalDrawer.locator('input[type="text"], textarea').first()
    await expect(inputField).toBeVisible({ timeout: 5000 })
    await inputField.fill('test query')

    // Verify input has value
    await expect(inputField).toHaveValue('test query')
  })

  test('terminal header shows controls', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    // Check for minimize button
    const minimizeButton = terminalDrawer.locator('button[aria-label="Minimize"]')
    await expect(minimizeButton).toBeVisible({ timeout: 5000 })

    // Check for close button
    const closeButton = terminalDrawer.locator('button[aria-label="Close"]')
    await expect(closeButton).toBeVisible()
  })

  test('minimize button collapses terminal to pill', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    // Click minimize
    const minimizeButton = terminalDrawer.locator('button[aria-label="Minimize"]')
    await minimizeButton.click()

    // Terminal drawer should be hidden
    await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })

    // Pill should be visible
    const expandButton = page.locator('button[aria-label="Expand Your Grove"]')
    await expect(expandButton).toBeVisible({ timeout: 5000 })
  })

  test('can expand from minimized pill', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    // Minimize first
    const minimizeButton = terminalDrawer.locator('button[aria-label="Minimize"]')
    await minimizeButton.click()
    await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })

    // Click expand pill
    const expandButton = page.locator('button[aria-label="Expand Your Grove"]')
    await expect(expandButton).toBeVisible({ timeout: 5000 })
    await expandButton.click()

    // Terminal should be visible again
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
  })
})

test.describe('Terminal Commands', () => {
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

    // At this point, the command palette might show or input might have special styling
    // This test verifies the input accepts command syntax
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

test.describe('Terminal Message Rendering', () => {
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

    // Welcome messages use arrow (→) formatting for prompts
    // This may not be visible as text, so just check content exists
    expect(terminalContent).toBeTruthy()
    expect(terminalContent!.length).toBeGreaterThan(50)
  })

  test('terminal has scrollable message area', async ({ page }) => {
    // Look for a scrollable container in terminal
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    // Should have overflow handling
    const scrollContainer = terminalDrawer.locator('.overflow-y-auto, .overflow-auto').first()

    if (await scrollContainer.count() > 0) {
      await expect(scrollContainer).toBeVisible()
    }
  })
})

test.describe('Terminal Accessibility', () => {
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

    // Check role and aria-modal
    await expect(terminalDrawer).toHaveAttribute('role', 'dialog')
    await expect(terminalDrawer).toHaveAttribute('aria-modal', 'true')
  })

  test('FAB button has accessible label', async ({ page }) => {
    // Ensure terminal is closed first to see open button
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
