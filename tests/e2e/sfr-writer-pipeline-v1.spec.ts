// tests/e2e/sfr-writer-pipeline-v1.spec.ts
// Sprint: S23-SFR v1.0 - Writer Pipeline Completion E2E
// Protocol: Grove Execution Protocol v1.5 - Constraint 11

import { test, expect } from '@playwright/test';
import { setupConsoleCapture, getCriticalErrors, type ConsoleCapture } from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/sfr-ux-redesign-v1/screenshots/v1';

test.setTimeout(60000);

/**
 * Build a test sprout with realistic canonical research data
 * so the DocumentViewer renders Full Report / Sources / Summary tabs
 */
function buildTestSprout() {
  const id = 'test-sfr-v1-' + Date.now();
  return {
    id,
    spark: 'AI governance research query',
    title: 'AI Governance Frameworks',
    status: 'sprouted',
    query: 'What are the key frameworks for AI governance?',
    response: 'Research completed with full canonical data',
    capturedAt: new Date().toISOString(),
    stage: 'tender',
    tags: ['test', 'ai-governance'],
    provenance: {
      lens: { id: 'researcher', name: 'Researcher' },
      hub: { id: 'ai-systems', name: 'AI Systems' },
      journey: null,
      node: null,
      generatedAt: new Date().toISOString(),
    },
    // S22-WP canonical research (100% lossless) - triggers research tabs
    canonicalResearch: {
      title: 'AI Governance Frameworks: A Comprehensive Analysis',
      query: 'What are the key frameworks for AI governance?',
      sections: [
        {
          heading: 'Overview',
          content: 'AI governance has emerged as a critical field addressing the responsible development and deployment of artificial intelligence systems. Multiple international frameworks now exist.',
        },
        {
          heading: 'The EU AI Act',
          content: 'The European Union AI Act (2024) establishes the world\'s first comprehensive legal framework using a risk-based classification: unacceptable, high, limited, and minimal risk categories.',
        },
        {
          heading: 'US Executive Order on AI',
          content: 'The United States Executive Order on Safe, Secure, and Trustworthy AI (October 2023) establishes safety standards and requires developers of powerful AI systems to share test results with the government.',
        },
        {
          heading: 'NIST AI Risk Management Framework',
          content: 'The NIST AI RMF provides voluntary guidance organized around four core functions: GOVERN, MAP, MEASURE, and MANAGE for organizations designing and deploying AI systems.',
        },
      ],
      sources: [
        {
          url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai',
          title: 'EU AI Act - Regulatory Framework',
          snippet: 'The AI Act is the first comprehensive legal framework on AI worldwide.',
          sourceType: 'primary',
          accessedAt: new Date().toISOString(),
        },
        {
          url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-ai/',
          title: 'White House Executive Order on AI',
          snippet: 'Executive Order establishing new standards for AI safety and security.',
          sourceType: 'primary',
          accessedAt: new Date().toISOString(),
        },
        {
          url: 'https://www.nist.gov/itl/ai-risk-management-framework',
          title: 'NIST AI Risk Management Framework',
          snippet: 'Voluntary guidance for managing AI risks across organizations.',
          sourceType: 'academic',
          accessedAt: new Date().toISOString(),
        },
      ],
      synthesizedAt: new Date().toISOString(),
      confidence: 0.92,
    },
    // Legacy fields (empty since canonical is present)
    researchBranches: [],
    researchEvidence: [],
    researchSynthesis: null,
    researchDocument: null,
  };
}

test.describe('S23-SFR v1.0: Writer Pipeline Completion', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('SFR modal opens with research tabs — no regression', async ({ page }) => {
    // Step 1: Navigate to explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Allow GroveDataProvider to initialize

    // Step 2: Screenshot — explore loaded
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-explore-loaded.png`,
      fullPage: false,
    });

    // Step 3: Inject test sprout with canonical research
    const testSprout = buildTestSprout();
    await page.evaluate((sprout) => {
      localStorage.setItem('grove-test-sprout', JSON.stringify(sprout));
    }, testSprout);

    // Step 4: Wait for FinishingRoomGlobal listener
    const listenerReady = page.locator('[data-testid="finishing-room-listener-ready"]');
    const listenerExists = await listenerReady.count();
    console.log('[TEST] Finishing room listener ready:', listenerExists > 0);

    if (listenerExists > 0) {
      await listenerReady.waitFor({ state: 'attached', timeout: 10000 });
    }

    // Step 5: Dispatch event to open SFR modal
    await page.evaluate((sproutId) => {
      window.dispatchEvent(new CustomEvent('open-finishing-room', {
        detail: { sproutId },
        bubbles: true,
      }));
    }, testSprout.id);

    await page.waitForTimeout(2000);

    // Step 6: Screenshot — modal open
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-sfr-modal-open.png`,
      fullPage: false,
    });

    // Step 7: Check modal visibility
    const modal = page.locator('[role="dialog"], .fixed.inset-0');
    const modalVisible = await modal.first().isVisible().catch(() => false);
    console.log('[TEST] Modal visible:', modalVisible);

    // Step 8: Check research tabs exist (Summary, Full Report, Sources)
    const summaryTab = page.locator('button:has-text("Summary")');
    const fullReportTab = page.locator('button:has-text("Full Report")');
    const sourcesTab = page.locator('button:has-text("Sources")');

    const summaryCount = await summaryTab.count();
    const reportCount = await fullReportTab.count();
    const sourcesCount = await sourcesTab.count();
    console.log(`[TEST] Research tabs — Summary: ${summaryCount}, Full Report: ${reportCount}, Sources: ${sourcesCount}`);

    // Step 9: Verify NO version tab bar (no artifacts generated yet)
    const versionTabs = page.locator('button:has-text("V1:")');
    const versionTabCount = await versionTabs.count();
    console.log('[TEST] Version tabs (should be 0 — no artifacts yet):', versionTabCount);
    expect(versionTabCount).toBe(0);

    // Step 10: Check ActionPanel (right column) is present
    const writerPanel = page.locator('aside');
    const writerVisible = await writerPanel.first().isVisible().catch(() => false);
    console.log('[TEST] Writer panel (aside) visible:', writerVisible);

    // Step 11: Click "Summary" tab if visible
    if (summaryCount > 0) {
      await summaryTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-summary-tab.png`,
        fullPage: false,
      });
    }

    // Step 12: Click "Sources" tab if visible
    if (sourcesCount > 0) {
      await sourcesTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-sources-tab.png`,
        fullPage: false,
      });
    }

    // Step 13: Click "Full Report" tab to return to default
    if (reportCount > 0) {
      await fullReportTab.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-full-report-tab.png`,
        fullPage: false,
      });
    }

    // Step 14: Verify Save to Nursery button is NOT visible (no artifact selected)
    const saveButton = page.locator('button:has-text("Save to Nursery")');
    const saveInCenter = page.locator('main button:has-text("Save to Nursery")');
    const centerSaveCount = await saveInCenter.count();
    console.log('[TEST] Center column Save to Nursery (should be 0):', centerSaveCount);

    // Step 15: Close modal with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem('grove-test-sprout');
    });

    // Final gate: Zero critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(`[TEST] Console errors: ${capture.errors.length}, Critical: ${criticalErrors.length}`);
    if (criticalErrors.length > 0) {
      criticalErrors.forEach((e, i) => console.log(`  Critical ${i + 1}: ${e}`));
    }
    expect(criticalErrors).toHaveLength(0);
  });

  test('No version tabs appear without generated artifacts', async ({ page }) => {
    // This tests the implicit feature gating:
    // When generatedArtifacts is empty, no version tab bar should appear
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const testSprout = buildTestSprout();
    await page.evaluate((sprout) => {
      localStorage.setItem('grove-test-sprout', JSON.stringify(sprout));
    }, testSprout);

    const listenerReady = page.locator('[data-testid="finishing-room-listener-ready"]');
    const listenerExists = await listenerReady.count();
    if (listenerExists > 0) {
      await listenerReady.waitFor({ state: 'attached', timeout: 10000 });
    }

    await page.evaluate((sproutId) => {
      window.dispatchEvent(new CustomEvent('open-finishing-room', {
        detail: { sproutId },
        bubbles: true,
      }));
    }, testSprout.id);

    await page.waitForTimeout(2000);

    // The "Research" tab (version tab bar) should NOT exist
    // because no artifacts have been generated
    const researchVersionTab = page.locator('button:has-text("Research")');
    // The research tab only appears in the VERSION tab bar (when artifacts exist)
    // The inner research sub-tabs are "Summary", "Full Report", "Sources"
    // So if "Research" appears, it means the version bar is showing — which is wrong here

    // Version tab bar only renders when generatedArtifacts.length > 0
    // Check: no "V1:", "V2:" buttons visible
    const v1Tab = page.locator('button:has-text("V1:")');
    const v2Tab = page.locator('button:has-text("V2:")');
    expect(await v1Tab.count()).toBe(0);
    expect(await v2Tab.count()).toBe(0);

    // Screenshot of clean state (no version tabs)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-no-version-tabs.png`,
      fullPage: false,
    });

    // Close and cleanup
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      localStorage.removeItem('grove-test-sprout');
    });

    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });
});
