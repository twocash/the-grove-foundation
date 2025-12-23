import { test, expect } from '@playwright/test'

/**
 * Terminal Lens Flow E2E Tests
 * Sprint: Terminal Architecture Refactor v1.0 - Epic 6
 *
 * Tests the lens-aware terminal welcome functionality:
 * - URL lens parameter initialization
 * - Lens-specific welcome messages
 * - Terminal shell interactions
 */

test.describe('Terminal Lens Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset terminal state before each test
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('terminal opens via FAB button', async ({ page }) => {
    // Find the FAB button (either open or close state)
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')
    const fabButtonClose = page.locator('button[aria-label="Close terminal"]')

    // If terminal is already open, close it first
    if (await fabButtonClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fabButtonClose.click()
      await page.waitForTimeout(500)
    }

    // Now open terminal
    await expect(fabButtonOpen).toBeVisible({ timeout: 5000 })
    await fabButtonOpen.click()

    // Verify terminal drawer is visible
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
  })

  test('terminal closes via close button', async ({ page }) => {
    // Ensure terminal is open
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    if (!await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      // Terminal not open, open it
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
      }
    }

    // Wait for terminal to open
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })

    // Find and click the close button inside terminal
    const closeButton = page.locator('button[aria-label="Close"]').first()
    await closeButton.click()

    // Verify terminal drawer is hidden (translated off-screen)
    await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
  })

  test('URL lens parameter initializes academic lens', async ({ page }) => {
    // Navigate with lens parameter
    await page.goto('/?lens=academic')
    await page.waitForLoadState('networkidle')

    // Ensure terminal is open
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')

    if (!await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      if (await fabButtonOpen.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fabButtonOpen.click()
      }
    }

    // Wait for terminal to be visible
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 10000 })

    // Academic lens welcome should contain "Research Interface" or academic-specific content
    const terminalContent = await terminalDrawer.textContent()
    expect(terminalContent).toBeTruthy()

    // Look for academic-specific welcome indicators
    // The academic lens has heading "Research Interface." and mentions peer-reviewed sources
    const hasAcademicContent = terminalContent?.includes('Research Interface') ||
                               terminalContent?.includes('peer-reviewed') ||
                               terminalContent?.includes('Academic') ||
                               terminalContent?.includes('epistemic')

    // Log content for debugging if assertion fails
    if (!hasAcademicContent) {
      console.log('Terminal content:', terminalContent?.substring(0, 500))
    }

    expect(hasAcademicContent).toBeTruthy()
  })

  test('URL lens parameter initializes engineer lens', async ({ page }) => {
    await page.goto('/?lens=engineer')
    await page.waitForLoadState('networkidle')

    // Ensure terminal is open
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

    // Engineer lens has heading "Technical Documentation."
    const hasEngineerContent = terminalContent?.includes('Technical Documentation') ||
                              terminalContent?.includes('cognitive router') ||
                              terminalContent?.includes('API design') ||
                              terminalContent?.includes('architecture')

    expect(hasEngineerContent).toBeTruthy()
  })

  test('default terminal shows generic welcome without lens', async ({ page }) => {
    // Ensure terminal is open
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

    // Default welcome has "The Terminal." heading
    expect(terminalContent).toContain('The Terminal')
  })
})

test.describe('Terminal Shell Chrome', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset terminal state before each test
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

    // Get current state
    const isOpen = await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)

    if (isOpen) {
      // Terminal is open, should see close button with X
      await expect(fabButtonClose).toBeVisible({ timeout: 5000 })
      // Click to close
      await fabButtonClose.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
    } else {
      // Terminal is closed, should see open button with ">_"
      await expect(fabButtonOpen).toBeVisible({ timeout: 5000 })
      const fabContent = await fabButtonOpen.textContent()
      expect(fabContent).toContain('>_')
      // Click to open
      await fabButtonOpen.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
    }
  })

  test('terminal drawer animation classes are correct', async ({ page }) => {
    const terminalDrawer = page.locator('[aria-label="Grove Terminal"]')
    const fabButtonOpen = page.locator('button[aria-label="Open terminal"]')
    const fabButtonClose = page.locator('button[aria-label="Close terminal"]')

    // Ensure terminal is closed first
    if (await terminalDrawer.evaluate(el => el.classList.contains('translate-x-0')).catch(() => false)) {
      await fabButtonClose.click()
      await expect(terminalDrawer).toHaveClass(/translate-x-full/, { timeout: 5000 })
    }

    // Drawer should have translate-x-full class when closed
    await expect(terminalDrawer).toHaveClass(/translate-x-full/)

    // Open terminal
    await fabButtonOpen.click()

    // After opening, drawer should have translate-x-0 class
    await expect(terminalDrawer).toHaveClass(/translate-x-0/, { timeout: 5000 })
  })
})
