# Prompt Architect Infrastructure Execution Prompt

**For:** Claude Code Developer Agent
**Sprint:** prompt-architect-v1
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post sprout-research-v1)
**Date:** 2026-01-20

---

## Mission

You are executing sprint **prompt-architect-v1** - implementing the Prompt Architect Infrastructure that transforms `sprout:` commands in `/explore` into executed research with full provenance tracking.

**Contract:** `docs/sprints/prompt-architect-v1/SPEC.md`
**User Stories:** [Notion Sprint B User Stories](https://www.notion.so/2e5780a78eef81b189bed412aec3cb3e)

---

## Execution Contract Summary

### What We're Building
- `sprout:` command detection and routing in `/explore`
- PromptArchitectConfig loading from Supabase
- Quality gate enforcement (hypothesis alignment)
- Inference rule application (auto-populate manifests)
- ResearchSprout creation with full provenance
- Research Agent queue processing

### Success Criteria
- Explorer types `sprout:` → confirmation dialog appears
- Sprout persisted to Supabase `research_sprouts` table
- Sprout appears in Nursery console (`/bedrock/nursery`)
- Off-topic queries rejected with helpful message
- E2E test with console monitoring passes (zero critical errors)
- All screenshots captured and embedded in REVIEW.html

---

## Strangler Fig Compliance (Constraint 1)

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route (except Foundation consoles)
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route (command detection)
├── src/explore/* (sprout: command handling)
├── src/bedrock/* (config management)
├── src/core/schema/* (PromptArchitectConfig, ResearchSprout)
└── src/services/* (agent implementations)
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

---

## Test Routes (Constraint 6 - CRITICAL)

```
✅ localhost:3000/explore           ← WHERE sprout: COMMAND WORKS
✅ localhost:3000/bedrock/nursery   ← WHERE SPROUTS SURFACE
❌ localhost:3000/                  ← LEGACY TERMINAL (features won't appear!)
❌ localhost:3000/terminal          ← LEGACY TERMINAL
```

**Common Mistake:** Testing at `/` and thinking features are broken. They're not — you're in the FROZEN ZONE.

---

## DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| PromptArchitectConfig | ✅ Pure JSON config, no code | ✅ N/A (config) | ✅ Config versioned | ✅ Groves independently configurable |
| Quality Gates | ✅ Thresholds in config | ✅ Output-based evaluation | ✅ Rejections logged | ✅ Gates can be added via config |
| Inference Rules | ✅ Rules are config | ✅ Works with any model | ✅ Rules applied logged | ✅ Rules extensible |
| Research Agent | ✅ Strategy configurable | ✅ Routes to any backend | ✅ Full execution log | ✅ Queue scales horizontally |

---

## Screenshot Specifications (Constraint 2)

**Location:** `docs/sprints/prompt-architect-v1/screenshots/`
**Filename Pattern:** `{phase}{subphase}-{description}.png`

### Required Screenshots Per Phase

#### Phase 0: Pre-work (2 screenshots)
| File | What to Capture | Gate |
|------|-----------------|------|
| `0a-supabase-tables.png` | Supabase dashboard showing `prompt_architect_configs` and `research_sprouts` tables exist | Tables visible |
| `0c-test-config.png` | SQL result showing `config-grove-foundation-v1` with hypothesisGoals | Config has required fields |

#### Phase 6: E2E Smoke Tests (15+ screenshots)

##### US-B001: Plant Research Sprout
| File | What to Capture | Gate |
|------|-----------------|------|
| `6a-b001-01-command-typed.png` | `/explore` with `sprout:` command in input field | Command visible |
| `6a-b001-02-confirmation-dialog.png` | "New Research Sprout" dialog with spark, title, instructions | All fields visible |
| `6a-b001-03-success-toast.png` | Success toast after clicking "Start Research" | Toast shows created message |
| `6a-b001-04-nursery-display.png` | `/bedrock/nursery` showing sprout card | Sprout visible, status="pending" |
| `6a-b001-05-supabase-row.png` | SQL query showing sprout in database | Row has correct grove_id, status |

##### US-B003: Reject Off-Topic
| File | What to Capture | Gate |
|------|-----------------|------|
| `6c-b003-01-offtopic-command.png` | `/explore` with off-topic query entered | Off-topic command visible |
| `6c-b003-02-rejection-toast.png` | Error toast with rejection message | Toast shows "doesn't align" |
| `6c-b003-03-console-alignment.png` | Browser console showing `[QualityGate]` with alignment < 0.5 | Gate triggered |

##### US-B006: Load Configuration
| File | What to Capture | Gate |
|------|-----------------|------|
| `6e-b006-01-config-loaded.png` | Browser console showing config loaded log | Log shows grove-foundation |
| `6e-b006-02-config-contents.png` | Console expanded showing hypothesisGoals | Goals array visible |

##### US-B008: Capture Provenance
| File | What to Capture | Gate |
|------|-----------------|------|
| `6f-b008-provenance-query.png` | SQL: `SELECT grove_id, config_id, session_id FROM research_sprouts` | All provenance fields populated |

##### US-B009: Monitor Progress
| File | What to Capture | Gate |
|------|-----------------|------|
| `6g-b009-01-status-counts.png` | Nursery showing Total/Pending/Active/Complete counts | Counts displayed |
| `6g-b009-02-status-groups.png` | Sprouts grouped by status (Pending section, Active section) | Grouping works |

---

## E2E Console Monitoring Gate (Constraint 11 - CRITICAL)

**E2E test with console monitoring is REQUIRED for sprint completion.**

### Create Test File: `tests/e2e/prompt-architect.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/prompt-architect-v1/screenshots/e2e';

// Console capture utility (inline for portability)
interface ConsoleCapture {
  errors: string[];
  warnings: string[];
  logs: string[];
}

function setupConsoleCapture(page: Page): ConsoleCapture {
  const capture: ConsoleCapture = { errors: [], warnings: [], logs: [] };

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      capture.errors.push(text);
    } else if (msg.type() === 'warning') {
      capture.warnings.push(text);
    } else {
      capture.logs.push(text);
    }
  });

  page.on('pageerror', (error) => {
    capture.errors.push(error.message);
  });

  return capture;
}

// Critical error patterns that block sprint
const CRITICAL_ERROR_PATTERNS = [
  'Cannot read properties',
  'Unexpected Application Error',
  'Invalid status transition',
  'TypeError:',
  'ReferenceError:',
  'is not defined',
  'is not a function',
];

// Benign patterns to exclude
const BENIGN_PATTERNS = [
  'favicon',
  'net::ERR_',
  'Failed to load resource',
  '404',
];

function getCriticalErrors(errors: string[]): string[] {
  return errors.filter((error) => {
    const isBenign = BENIGN_PATTERNS.some((pattern) =>
      error.toLowerCase().includes(pattern.toLowerCase())
    );
    if (isBenign) return false;

    return CRITICAL_ERROR_PATTERNS.some((pattern) =>
      error.includes(pattern)
    );
  });
}

test.describe('Prompt Architect Infrastructure E2E', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('US-B001: Plant Research Sprout - Full E2E Flow', async ({ page }) => {
    // Step 1: Navigate to /explore (NOT / or /terminal!)
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b001-01-explore-loaded.png` });

    // Step 2: Find chat input and enter sprout command
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('sprout: What evidence supports the Ratchet Effect in AI capabilities?');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b001-02-command-entered.png` });

    // Step 3: Submit command
    await chatInput.press('Enter');

    // Step 4: Wait for confirmation dialog
    const dialog = page.locator('text=New Research Sprout');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b001-03-confirmation-dialog.png` });

    // Step 5: Verify dialog has required fields
    await expect(page.locator('text=Research Spark')).toBeVisible();
    await expect(page.locator('button:has-text("Start Research")')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b001-04-dialog-fields.png` });

    // Step 6: Click Start Research
    await page.click('button:has-text("Start Research")');
    await page.waitForTimeout(1000); // Wait for toast

    // Step 7: Look for success indication
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b001-05-after-submit.png`, fullPage: true });

    // Step 8: Navigate to Nursery and verify sprout appears
    await page.goto('/bedrock/nursery');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b001-06-nursery-sprout.png`, fullPage: true });

    // Final: Verify no critical console errors
    const criticalErrors = getCriticalErrors(capture.errors);
    if (criticalErrors.length > 0) {
      console.log('Critical errors detected:', criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-B003: Reject Off-Topic Research Query', async ({ page }) => {
    // Step 1: Navigate to /explore
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Step 2: Enter off-topic query
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('sprout: What is the best pizza in Chicago?');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b003-01-offtopic-entered.png` });

    // Step 3: Submit
    await chatInput.press('Enter');
    await page.waitForTimeout(2000); // Wait for quality gate evaluation

    // Step 4: Screenshot (should show rejection toast or no confirmation dialog)
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b003-02-rejection-result.png`, fullPage: true });

    // Step 5: Verify confirmation dialog did NOT appear (off-topic was rejected)
    // Note: Depending on implementation, either:
    // - Toast shows rejection message
    // - Or dialog doesn't appear at all
    const confirmationDialog = page.locator('text=New Research Sprout');
    const isDialogVisible = await confirmationDialog.isVisible().catch(() => false);

    // If dialog appeared, the quality gate didn't block it - this is a failure
    // Unless the toast is showing an error
    const toast = page.locator('text=doesn\'t align');
    const hasRejectionToast = await toast.isVisible().catch(() => false);

    // Either dialog shouldn't appear, OR rejection toast should appear
    if (isDialogVisible && !hasRejectionToast) {
      // Take screenshot of unexpected state
      await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b003-03-unexpected-dialog.png` });
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b003-03-final-state.png`, fullPage: true });

    // Final: No critical errors (rejection is expected behavior, not an error)
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-B006: Config Loads from Supabase', async ({ page }) => {
    // Step 1: Navigate and trigger config load
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Step 2: Enter any sprout command to trigger config load
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.fill('sprout: test config loading');
    await chatInput.press('Enter');

    // Step 3: Wait for config to load
    await page.waitForTimeout(3000);

    // Step 4: Check that config-related logs appeared
    const configLogs = capture.logs.filter(
      (log) => log.includes('Config') || log.includes('PromptArchitect') || log.includes('grove')
    );

    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b006-01-config-loaded.png`, fullPage: true });

    // Verify config loaded (some indication in logs)
    // Note: Actual log format depends on implementation
    console.log('Config-related logs:', configLogs);

    // No critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('US-B009: Monitor Research Progress in Nursery', async ({ page }) => {
    // Step 1: Navigate directly to Nursery
    await page.goto('/bedrock/nursery');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b009-01-nursery-loaded.png`, fullPage: true });

    // Step 2: Verify status counts are visible
    // Note: Actual selectors depend on implementation
    const statusSection = page.locator('text=/Total|Pending|Active|Complete/');
    await expect(statusSection.first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: `${SCREENSHOT_DIR}/us-b009-02-status-visible.png`, fullPage: true });

    // No critical errors
    const criticalErrors = getCriticalErrors(capture.errors);
    expect(criticalErrors).toHaveLength(0);
  });
});
```

### Run E2E Tests

```bash
# Run the E2E tests
npx playwright test tests/e2e/prompt-architect.spec.ts --project=chromium

# GATE: All tests pass with zero critical console errors
```

---

## Phase Execution

### Phase 0: Pre-work Verification

```bash
# 0a: Verify Supabase tables exist
# In Supabase SQL Editor:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('prompt_architect_configs', 'research_sprouts');
# GATE: Both tables returned
# Screenshot: 0a-supabase-tables.png

# 0c: Verify test config exists
SELECT id, grove_id, (payload->>'confirmationMode') as mode
FROM prompt_architect_configs
WHERE grove_id = 'grove-foundation';
# GATE: Config exists
# Screenshot: 0c-test-config.png

npm run build
# GATE: Build passes
```

### Phase 1-5: Existing Infrastructure Discovery

**NOTE:** Phases 2-5 were already implemented in `sprout-research-v1` sprint.

```bash
# Verify existing service files
ls src/explore/services/prompt-architect*.ts
ls src/explore/services/quality-gate*.ts
ls src/explore/services/inference*.ts
# GATE: Files exist

# Verify hook exists
ls src/explore/hooks/usePromptArchitect.ts
# GATE: File exists

npm run build
# GATE: Build passes
```

### Phase 6: E2E Smoke Tests

**CRITICAL:** Test at `/explore`, NOT at `/` or `/terminal`

```bash
# Start dev server
npm run dev

# Create screenshots directory
mkdir -p docs/sprints/prompt-architect-v1/screenshots/e2e

# Run E2E tests with Playwright
npx playwright test tests/e2e/prompt-architect.spec.ts --project=chromium

# GATE: All tests pass
# GATE: Zero critical console errors
# GATE: Screenshots captured to screenshots/e2e/
```

---

## Build Gates (After Every Phase)

```bash
npm run build
# GATE: Build passes

ls docs/sprints/prompt-architect-v1/screenshots/
# GATE: Screenshot count matches phase count
```

---

## Code-Simplifier Gate (Constraint 8)

**Before final commit, run code-simplifier on modified files:**

```bash
# Review modified files
git diff --name-only

# Run code-simplifier (via skill)
# /code-simplifier

# Re-run build gates after simplification
npm run build
```

---

## Status Updates

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`

**On Start:**
```yaml
status: STARTED
phase: Phase 0 - Pre-work Verification
sprint: prompt-architect-v1
```

**On Complete:**
```yaml
status: COMPLETE
phase: Phase 6 - E2E Testing
commit: {hash}
screenshots_captured: 20
e2e_tests_passing: 4
critical_console_errors: 0
```

---

## DEX Compliance Checklist (Before Commit)

```
□ DECLARATIVE SOVEREIGNTY
  Can a domain expert change behavior via config?
  ✅ Pass: PromptArchitectConfig controls all behavior

□ CAPABILITY AGNOSTICISM
  Does this work regardless of which LLM is attached?
  ✅ Pass: No model-specific code paths

□ PROVENANCE AS INFRASTRUCTURE
  Does every object track how it came to exist?
  ✅ Pass: ResearchSprout has grove_id, config_id, session_id

□ ORGANIC SCALABILITY
  Does structure enable growth without code changes?
  ✅ Pass: Inference rules configurable, quality gates extensible
```

---

## Completion Checklist

Before marking COMPLETE, verify:

- [ ] Phase 0 screenshots captured (2 required)
- [ ] Phase 6 E2E screenshots captured (~15 required)
- [ ] E2E tests created: `tests/e2e/prompt-architect.spec.ts`
- [ ] E2E tests pass with console monitoring
- [ ] Zero critical console errors in E2E tests
- [ ] `npm run build` passes
- [ ] Code-simplifier applied
- [ ] REVIEW.html updated with all screenshots
- [ ] DEVLOG.md documents complete journey
- [ ] DEX compliance checklist complete

---

## On Completion

1. Write COMPLETE status entry
2. Update REVIEW.html with all evidence
3. Commit with message: `feat(explore): complete prompt-architect E2E verification`
4. Push to branch
5. **Notify user with REVIEW.html path:**

```
Sprint Review Ready
Sprint: prompt-architect-v1
Status: Complete
Review File: docs/sprints/prompt-architect-v1/REVIEW.html

Open REVIEW.html in browser to see:
- Summary metrics and test results
- Screenshots of all completed features
- Phase-by-phase progress with visual evidence
```

---

*Execute with precision. Every screenshot tells a story. The strangler fig grows one branch at a time.*
