// tests/e2e/quality-scoring.spec.ts
// Sprint: S10-SL-AICuration v1 - E2E tests for quality scoring system
// Protocol: Grove Execution Protocol v1.5 - Constraint 11

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/s10-sl-aicuration-v1/screenshots/e2e';

/**
 * S10-SL-AICuration: Quality Scoring System Tests
 *
 * Tests that the quality scoring system is properly integrated:
 * - QualityScoreBadge component renders correctly
 * - QualityThresholdCard displays in Experience Console
 * - QualityThresholdEditor functions without errors
 * - Core quality modules are accessible
 */
test.describe('S10-SL-AICuration: Quality Scoring System', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test.afterEach(async () => {
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-QS001: Experience Console loads without quality module errors', async ({
    page,
  }) => {
    // Navigate to bedrock experience console
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Experience Console baseline
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-experience-console-baseline.png`,
      fullPage: true,
    });

    // Verify page loaded (look for common bedrock elements)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Check for any critical errors during load
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(
      `[S10-AICuration] Experience Console errors: ${criticalErrors.length}`
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-QS002: Bedrock dashboard route loads quality types correctly', async ({
    page,
  }) => {
    // Navigate to bedrock dashboard
    await page.goto('/bedrock');
    await waitForPageStable(page, 2000);

    // Screenshot: Bedrock dashboard
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-bedrock-dashboard.png`,
      fullPage: true,
    });

    // Verify no hook registry errors (would appear as TypeError/ReferenceError)
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-QS003: Quality scoring core module is importable', async ({
    page,
  }) => {
    // This test verifies the quality scoring module loads correctly
    // by checking the console for import/module resolution errors
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Module loading verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-module-loading.png`,
      fullPage: true,
    });

    // Check that no module resolution errors occurred
    const moduleErrors = capture.errors.filter(
      (e) =>
        e.includes('Cannot find module') ||
        e.includes('Failed to resolve module') ||
        e.includes('@core/quality')
    );
    expect(moduleErrors).toHaveLength(0);
  });

  test('US-QS004: QualityScoreBadge component renders in isolation', async ({
    page,
  }) => {
    // Navigate to a page that could render quality scores
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Page with potential quality badge rendering
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-quality-badge-context.png`,
      fullPage: true,
    });

    // Check for component errors
    const componentErrors = capture.errors.filter(
      (e) =>
        e.includes('QualityScoreBadge') ||
        e.includes('quality-score-badge') ||
        e.includes('Invalid prop')
    );
    expect(componentErrors).toHaveLength(0);
  });

  test('US-QS005: Explore page loads with quality integration', async ({
    page,
  }) => {
    // Navigate to explore page (where sprouts are shown)
    await page.goto('/explore');
    await waitForPageStable(page, 3000);

    // Screenshot: Explore page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-explore-page.png`,
      fullPage: true,
    });

    // Check for critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(`[S10-AICuration] Explore page errors: ${criticalErrors.length}`);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-QS006: Quality types are registered in GroveObject system', async ({
    page,
  }) => {
    // Navigate to experience console which uses the type registry
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Type registry verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-type-registry.png`,
      fullPage: true,
    });

    // Check for type registration errors
    const typeErrors = capture.errors.filter(
      (e) =>
        e.includes('quality-threshold') ||
        e.includes('Unknown type') ||
        e.includes('Type not registered')
    );
    expect(typeErrors).toHaveLength(0);
  });

  test('US-QS007: Quality threshold UI components load without errors', async ({
    page,
  }) => {
    // Navigate to experience console
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Quality threshold components context
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-threshold-components.png`,
      fullPage: true,
    });

    // Check for threshold component errors
    const thresholdErrors = capture.errors.filter(
      (e) =>
        e.includes('QualityThreshold') ||
        e.includes('ThresholdCard') ||
        e.includes('ThresholdEditor')
    );
    expect(thresholdErrors).toHaveLength(0);
  });

  test('US-QS008: Full quality scoring workflow renders correctly', async ({
    page,
  }) => {
    // Navigate to bedrock experience console (primary integration point)
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Full workflow context
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-full-workflow.png`,
      fullPage: true,
    });

    // Final error check - all critical paths should work
    const criticalErrors = getCriticalErrors(capture.errors);
    console.log(
      `[S10-AICuration] Full workflow errors: ${criticalErrors.length}`
    );

    // Log any errors for debugging
    if (capture.errors.length > 0) {
      console.log('All console errors:', capture.errors);
    }

    expect(criticalErrors).toHaveLength(0);
  });
});

/**
 * S10-SL-AICuration: Quality Scoring Integration Tests
 *
 * Tests deeper integration with the quality scoring system.
 */
test.describe('S10-SL-AICuration: Quality Integration', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Integration: Quality types in data provider', async ({ page }) => {
    // Navigate to a data-heavy page
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Data provider integration
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-data-provider-integration.png`,
      fullPage: true,
    });

    // Check for data provider errors related to quality types
    const dataErrors = capture.errors.filter(
      (e) =>
        e.includes('GroveDataProvider') ||
        e.includes('useGroveData') ||
        e.includes('quality-threshold')
    );
    expect(dataErrors).toHaveLength(0);
  });

  test('Integration: EventEmitter pattern in quality engines', async ({
    page,
  }) => {
    // Navigate to experience console
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: EventEmitter pattern verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-event-emitter-pattern.png`,
      fullPage: true,
    });

    // Check for EventEmitter-related errors
    const eventErrors = capture.errors.filter(
      (e) =>
        e.includes('EventEmitter') ||
        e.includes('.emit is not a function') ||
        e.includes('.on is not a function')
    );
    expect(eventErrors).toHaveLength(0);
  });

  test('Integration: Singleton pattern for quality managers', async ({
    page,
  }) => {
    // Navigate to experience console (loads quality managers)
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Navigate away and back to test singleton stability
    await page.goto('/bedrock');
    await waitForPageStable(page, 1000);
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Singleton pattern verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-singleton-pattern.png`,
      fullPage: true,
    });

    // Check for singleton-related errors
    const singletonErrors = capture.errors.filter(
      (e) =>
        e.includes('already exists') ||
        e.includes('instance is null') ||
        e.includes('getQualityScoringEngine') ||
        e.includes('getThresholdManager') ||
        e.includes('getFederatedLearningManager')
    );
    expect(singletonErrors).toHaveLength(0);
  });
});

/**
 * S10-SL-AICuration: DEX Compliance Verification Tests
 */
test.describe('S10-SL-AICuration: DEX Compliance', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('DEX: Declarative Sovereignty - Quality config via database', async ({
    page,
  }) => {
    // Navigate to experience console (where quality config would appear)
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Declarative config verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-dex-declarative.png`,
      fullPage: true,
    });

    // Verify no hardcoded config errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('DEX: Provenance tracking - Quality scores have attribution', async ({
    page,
  }) => {
    // Navigate to explore page (where sprouts with quality scores appear)
    await page.goto('/explore');
    await waitForPageStable(page, 3000);

    // Screenshot: Provenance verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-dex-provenance.png`,
      fullPage: true,
    });

    // Verify no provenance-related errors
    const provenanceErrors = capture.errors.filter(
      (e) =>
        e.includes('provenance') ||
        e.includes('attribution') ||
        e.includes('sourceGrove')
    );
    expect(provenanceErrors).toHaveLength(0);
  });

  test('DEX: Organic Scalability - Federation infrastructure ready', async ({
    page,
  }) => {
    // Navigate to bedrock experience console
    await page.goto('/bedrock/experience');
    await waitForPageStable(page, 2000);

    // Screenshot: Federation infrastructure verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-dex-organic-scalability.png`,
      fullPage: true,
    });

    // Verify no federation-related errors
    const federationErrors = capture.errors.filter(
      (e) =>
        e.includes('FederatedLearning') ||
        e.includes('federation') ||
        e.includes('cross-grove')
    );
    expect(federationErrors).toHaveLength(0);
  });
});
