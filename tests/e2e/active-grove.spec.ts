import { test, expect } from '@playwright/test'

/**
 * Active Grove E2E Tests
 * Sprint: active-grove-v1 - Epic 6
 *
 * Tests the split layout interaction flow:
 * - Tree click triggers split
 * - Terminal panel visibility
 * - Lens selection flow
 * - Navigation gating
 */

test.describe('Active Grove Split Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset state
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('page loads in hero mode by default', async ({ page }) => {
    // Hero section should be visible
    const heroSection = page.locator('section.hero-container').first()
    await expect(heroSection).toBeVisible({ timeout: 5000 })

    // Terminal panel should be hidden initially
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).not.toHaveClass(/visible/)
  })

  test('content rail has proper structure', async ({ page }) => {
    // Content rail should exist
    const contentRail = page.locator('.content-rail')
    await expect(contentRail).toBeVisible({ timeout: 5000 })

    // Should NOT have split class initially
    await expect(contentRail).not.toHaveClass(/split/)
  })

  test('ActiveTree is visible in hero section', async ({ page }) => {
    // Look for the tree button (seedling emoji)
    const activeTree = page.locator('button:has-text("🌱")').first()
    await expect(activeTree).toBeVisible({ timeout: 5000 })
  })

  test('ActiveTree has pulsing mode initially', async ({ page }) => {
    // Find the active tree button
    const activeTree = page.locator('button:has-text("🌱")').first()
    await expect(activeTree).toBeVisible({ timeout: 5000 })

    // Should have pulsing class
    await expect(activeTree).toHaveClass(/active-tree-pulsing/)
  })
})

test.describe('Active Grove Tree Click Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('clicking tree triggers split layout', async ({ page }) => {
    // Find and click the tree
    const activeTree = page.locator('button:has-text("🌱")').first()
    await expect(activeTree).toBeVisible({ timeout: 5000 })
    await activeTree.click()

    // Content rail should have split class
    const contentRail = page.locator('.content-rail')
    await expect(contentRail).toHaveClass(/split/, { timeout: 5000 })

    // Terminal panel should be visible
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })
  })

  test('terminal panel has ARIA attributes', async ({ page }) => {
    // Click tree to open terminal
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Check terminal panel ARIA attributes
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveAttribute('role', 'complementary')
    await expect(terminalPanel).toHaveAttribute('aria-label', 'Grove Terminal')
    await expect(terminalPanel).toHaveAttribute('aria-expanded', 'true')
  })
})

test.describe('Active Grove Lens Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('terminal shows lens picker after tree click', async ({ page }) => {
    // Click tree
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Wait for terminal panel
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })

    // Should see lens picker options
    const lensPickerContent = await terminalPanel.textContent()
    expect(lensPickerContent).toBeTruthy()
  })
})

test.describe('Active Grove Responsive Behavior', () => {
  test('desktop shows 50/50 split', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')

    // Click tree
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Terminal panel should be visible
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })

    // Check width is approximately 50%
    const panelBox = await terminalPanel.boundingBox()
    expect(panelBox).toBeTruthy()
    if (panelBox) {
      expect(panelBox.width).toBeGreaterThan(550)
      expect(panelBox.width).toBeLessThan(650)
    }
  })

  test('tablet shows 40% terminal width', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 900, height: 800 })
    await page.goto('/')

    // Click tree
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Terminal panel should be visible
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })

    // Check width is approximately 40%
    const panelBox = await terminalPanel.boundingBox()
    expect(panelBox).toBeTruthy()
    if (panelBox) {
      expect(panelBox.width).toBeGreaterThan(320)
      expect(panelBox.width).toBeLessThan(400)
    }
  })

  test('mobile shows bottom sheet', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Click tree
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Terminal panel should be visible and be a mobile sheet
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })
    await expect(terminalPanel).toHaveClass(/mobile-sheet/)
  })
})

test.describe('Active Grove Accessibility', () => {
  test('ActiveTree has proper ARIA labels', async ({ page }) => {
    await page.goto('/')

    // Check initial ARIA label
    const activeTree = page.locator('button:has-text("🌱")').first()
    await expect(activeTree).toHaveAttribute('aria-label', 'Open the Terminal')
  })

  test('content rail hides terminal when not visible', async ({ page }) => {
    await page.goto('/')

    // Terminal should be aria-hidden initially
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveAttribute('aria-hidden', 'true')

    // Click tree
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Terminal should no longer be aria-hidden
    await expect(terminalPanel).toHaveAttribute('aria-hidden', 'false')
  })
})
