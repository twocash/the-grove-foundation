import { test, expect } from '@playwright/test'

/**
 * Active Grove E2E Tests
 * Sprint: active-grove-v1 → active-grove-v2
 *
 * Tests the complete lens-reactive content transformation flow:
 * - Tree click triggers split layout
 * - Terminal panel visibility
 * - Lens selection updates XState machine
 * - Quantum interface resolves lens-specific reality
 * - Content rail displays transformed content
 * - State persistence across reloads
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

// =============================================================================
// ACTIVE GROVE V2: Content Transformation Tests
// Sprint: active-grove-v2 - Tests the complete lens-reactive content flow
// =============================================================================

test.describe('Active Grove Content Transformation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to reset all state
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('AG-1.5: lens picker shows persona options after tree click', async ({ page }) => {
    // Click the seedling
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Wait for terminal to be visible
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })

    // Should see lens picker with archetype options
    // Look for lens option buttons (e.g., "Curious Observer", "Infrastructure Engineer")
    const lensOptions = terminalPanel.locator('button').filter({
      hasText: /(Observer|Engineer|Investor|Builder|Citizen)/i
    })

    // Should have at least one lens option visible
    await expect(lensOptions.first()).toBeVisible({ timeout: 5000 })
  })

  test('AG-1.6: selecting a lens updates engagement state', async ({ page }) => {
    // Click seedling to open terminal
    await page.locator('button:has-text("🌱")').first().click()
    await page.waitForTimeout(500)

    // Find and click a lens option (Infrastructure Engineer)
    const lensOption = page.locator('button').filter({
      hasText: /Engineer/i
    }).first()

    if (await lensOption.isVisible()) {
      await lensOption.click()
      await page.waitForTimeout(1000)

      // Check localStorage for engagement state update
      const engagementState = await page.evaluate(() => {
        return localStorage.getItem('grove-engagement-persist')
      })

      // Engagement state should exist and contain lens data
      expect(engagementState).toBeTruthy()
      if (engagementState) {
        const parsed = JSON.parse(engagementState)
        // The lens should be set in the persisted state
        expect(parsed.lens || parsed.activeLens).toBeTruthy()
      }
    }
  })

  test('AG-1.7: content rail shows hero section with dynamic content', async ({ page }) => {
    // Navigate with a lens parameter
    await page.goto('/?lens=infrastructure-engineer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Hero section should be visible
    const heroSection = page.locator('section').filter({
      has: page.locator('h1, h2, .text-3xl, .text-4xl')
    }).first()
    await expect(heroSection).toBeVisible({ timeout: 5000 })

    // Should have some headline text
    const headlineText = await heroSection.textContent()
    expect(headlineText).toBeTruthy()
    expect(headlineText!.length).toBeGreaterThan(10)
  })

  test('AG-1.9: lens persists across page reload', async ({ page }) => {
    // Click seedling to open terminal
    await page.locator('button:has-text("🌱")').first().click()
    await page.waitForTimeout(500)

    // Find and click a lens option
    const lensOption = page.locator('button').filter({
      hasText: /Engineer|Observer|Investor/i
    }).first()

    if (await lensOption.isVisible()) {
      const lensText = await lensOption.textContent()
      await lensOption.click()
      await page.waitForTimeout(1000)

      // Reload the page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Terminal should open directly (lens was saved)
      // OR content should be in unlocked state
      const contentRail = page.locator('.content-rail')

      // Either we're in split mode or we can see the persisted lens
      const engagementState = await page.evaluate(() => {
        return localStorage.getItem('grove-engagement-persist')
      })
      expect(engagementState).toBeTruthy()

      if (engagementState) {
        const parsed = JSON.parse(engagementState)
        expect(parsed.lens || parsed.activeLens).toBeTruthy()
      }
    }
  })
})

test.describe('Active Grove URL Hydration', () => {
  test('AG-2.3: URL lens parameter hydrates state', async ({ page }) => {
    // Navigate with lens parameter
    await page.goto('/?lens=infrastructure-engineer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check that engagement state was hydrated
    const engagementState = await page.evaluate(() => {
      return localStorage.getItem('grove-engagement-persist')
    })

    expect(engagementState).toBeTruthy()
    if (engagementState) {
      const parsed = JSON.parse(engagementState)
      // Should have the engineer lens
      expect(parsed.lens).toContain('engineer')
    }
  })

  test('AG-2.3b: URL lens skips lens picker', async ({ page }) => {
    // Navigate with lens parameter
    await page.goto('/?lens=infrastructure-engineer')
    await page.waitForLoadState('networkidle')

    // Click the seedling
    await page.locator('button:has-text("🌱")').first().click()
    await page.waitForTimeout(500)

    // Terminal should be visible
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })

    // Should NOT show lens picker (lens was already set)
    // Instead should show Terminal content ready for chat
    const lensPickerHeading = terminalPanel.locator('text=Choose your perspective')

    // Lens picker should be hidden since we already have a lens
    const isPickerVisible = await lensPickerHeading.isVisible({ timeout: 2000 }).catch(() => false)
    // This is expected to NOT show the picker
    expect(isPickerVisible).toBeFalsy()
  })

  test('AG-2.4: invalid URL lens falls back gracefully', async ({ page }) => {
    // Navigate with invalid lens parameter
    await page.goto('/?lens=invalid-lens-id-12345')
    await page.waitForLoadState('networkidle')

    // Page should not crash
    const heroSection = page.locator('section.hero-container').first()
    await expect(heroSection).toBeVisible({ timeout: 5000 })

    // No console errors about undefined lens
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text())
      }
    })

    // Click seedling - should show lens picker since invalid lens was rejected
    await page.locator('button:has-text("🌱")').first().click()
    await page.waitForTimeout(1000)

    // Should not have critical errors
    const criticalErrors = consoleLogs.filter(log =>
      log.includes('undefined') || log.includes('Cannot read properties')
    )
    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('Active Grove User Behaviors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('grove-')).forEach(k => localStorage.removeItem(k))
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
  })

  test('AG-2.5: multiple seedling clicks are idempotent', async ({ page }) => {
    const activeTree = page.locator('button:has-text("🌱")').first()

    // Click rapidly multiple times
    await activeTree.click()
    await activeTree.click()
    await activeTree.click()
    await page.waitForTimeout(500)

    // Terminal should be open once
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/)

    // Content rail should be split (not broken)
    const contentRail = page.locator('.content-rail')
    await expect(contentRail).toHaveClass(/split/)

    // No duplicate terminals
    const terminalPanels = page.locator('.terminal-panel')
    expect(await terminalPanels.count()).toBe(1)
  })

  test('AG-2.7: corrupted localStorage recovers gracefully', async ({ page }) => {
    // Corrupt the engagement state
    await page.evaluate(() => {
      localStorage.setItem('grove-engagement-persist', 'not-valid-json{{{')
    })

    // Reload - should not crash
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Page should be visible and functional
    const heroSection = page.locator('section.hero-container').first()
    await expect(heroSection).toBeVisible({ timeout: 5000 })

    // Seedling should still work
    const activeTree = page.locator('button:has-text("🌱")').first()
    await activeTree.click()

    // Terminal should open
    const terminalPanel = page.locator('.terminal-panel')
    await expect(terminalPanel).toHaveClass(/visible/, { timeout: 5000 })

    // State should be reset to valid JSON
    const newState = await page.evaluate(() => {
      return localStorage.getItem('grove-engagement-persist')
    })

    // Either null (reset) or valid JSON
    if (newState) {
      expect(() => JSON.parse(newState)).not.toThrow()
    }
  })
})
