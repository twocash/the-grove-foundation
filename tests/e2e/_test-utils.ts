// tests/e2e/_test-utils.ts
// Shared E2E test utilities for Grove Foundation
// Protocol: Grove Execution Protocol v1.5 - Constraint 11
//
// Usage:
//   import { setupConsoleCapture, getCriticalErrors, CRITICAL_ERROR_PATTERNS } from './_test-utils';
//
//   test.beforeEach(async ({ page }) => {
//     const capture = setupConsoleCapture(page);
//     // ... test code ...
//     expect(getCriticalErrors(capture.errors)).toHaveLength(0);
//   });

import { Page, ConsoleMessage } from '@playwright/test';

/**
 * Console capture state for E2E tests
 */
export interface ConsoleCapture {
  errors: string[];
  warnings: string[];
  messages: string[];
  /** Reset all captured data */
  reset: () => void;
}

/**
 * Critical error patterns that indicate bugs requiring immediate attention.
 * These patterns catch:
 * - Race conditions (e.g., "Sprout not found" when state hasn't propagated)
 * - State machine bugs (e.g., "Invalid status transition")
 * - Null safety bugs (e.g., "Cannot read properties of undefined")
 * - React error boundaries (e.g., "Unexpected Application Error")
 */
export const CRITICAL_ERROR_PATTERNS = [
  'Cannot read properties',
  'Unexpected Application Error',
  'Invalid status transition',
  'Sprout not found',
  'TypeError:',
  'ReferenceError:',
  'is not defined',
  'is not a function',
] as const;

/**
 * Error patterns to exclude from critical error detection.
 * These are typically benign or external issues.
 */
export const EXCLUDED_ERROR_PATTERNS = [
  'favicon',
  'net::ERR_',
  'Failed to load resource',
  '404',
] as const;

/**
 * Sets up console capture for a Playwright page.
 * Call this in test.beforeEach() to capture all console output during tests.
 *
 * @param page - Playwright page instance
 * @returns ConsoleCapture object with errors, warnings, messages arrays
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   capture = setupConsoleCapture(page);
 * });
 *
 * test('my test', async ({ page }) => {
 *   // ... test code ...
 *   expect(getCriticalErrors(capture.errors)).toHaveLength(0);
 * });
 * ```
 */
export function setupConsoleCapture(page: Page): ConsoleCapture {
  const capture: ConsoleCapture = {
    errors: [],
    warnings: [],
    messages: [],
    reset: () => {
      capture.errors = [];
      capture.warnings = [];
      capture.messages = [];
    },
  };

  // Capture ALL console output
  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text();
    capture.messages.push(`[${msg.type()}] ${text}`);

    if (msg.type() === 'error') {
      capture.errors.push(text);
    } else if (msg.type() === 'warning') {
      capture.warnings.push(text);
    }
  });

  // Capture uncaught exceptions (React errors, unhandled promises, etc.)
  page.on('pageerror', (error) => {
    capture.errors.push(`[UNCAUGHT] ${error.message}`);
  });

  return capture;
}

/**
 * Filters captured errors for critical patterns that indicate real bugs.
 * Excludes benign errors like favicon loading failures.
 *
 * @param errors - Array of error messages from ConsoleCapture
 * @param customPatterns - Additional patterns to check for (optional)
 * @returns Array of critical errors that need investigation
 *
 * @example
 * ```typescript
 * const criticalErrors = getCriticalErrors(capture.errors);
 * expect(criticalErrors).toHaveLength(0);
 * ```
 */
export function getCriticalErrors(
  errors: string[],
  customPatterns: string[] = []
): string[] {
  const patterns = [...CRITICAL_ERROR_PATTERNS, ...customPatterns];

  return errors.filter((error) => {
    // Check if error matches any critical pattern
    const isCritical = patterns.some((pattern) =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );

    // Exclude benign errors
    const isExcluded = EXCLUDED_ERROR_PATTERNS.some((pattern) =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );

    return isCritical && !isExcluded;
  });
}

/**
 * Logs a summary of console capture results.
 * Useful for debugging test failures.
 *
 * @param capture - ConsoleCapture object from setupConsoleCapture
 * @param testName - Name of the test for logging context
 */
export function logConsoleSummary(
  capture: ConsoleCapture,
  testName: string = 'Test'
): void {
  console.log(`\n=== ${testName} Console Summary ===`);
  console.log(`Total errors: ${capture.errors.length}`);
  console.log(`Total warnings: ${capture.warnings.length}`);
  console.log(`Total messages: ${capture.messages.length}`);

  const criticalErrors = getCriticalErrors(capture.errors);
  console.log(`Critical errors: ${criticalErrors.length}`);

  if (criticalErrors.length > 0) {
    console.log('\nCritical Errors:');
    criticalErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  if (capture.warnings.length > 0 && capture.warnings.length <= 5) {
    console.log('\nWarnings:');
    capture.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }
}

/**
 * Standard screenshot directory path generator.
 *
 * @param sprintName - Name of the current sprint
 * @returns Path to the screenshots directory for E2E tests
 */
export function getScreenshotDir(sprintName: string): string {
  return `docs/sprints/${sprintName}/screenshots/e2e`;
}

/**
 * Waits for page to be fully loaded and stable.
 * More reliable than just waitForLoadState('networkidle').
 *
 * @param page - Playwright page instance
 * @param timeout - Additional wait time in ms after networkidle (default: 2000)
 */
export async function waitForPageStable(
  page: Page,
  timeout: number = 2000
): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(timeout);
}
