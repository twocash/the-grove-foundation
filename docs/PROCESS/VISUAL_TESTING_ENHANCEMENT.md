# Enhancement to Grove Execution Protocol v1.5
## Constraint 11b: Comprehensive Visual Testing Standard

**Date:** 2026-01-16
**Version:** v1.5.1
**Purpose:** Enhance Constraint 11 with comprehensive user story-driven visual testing
**Based on:** EPIC4-SL-MultiModel best practices

---

## Overview

The EPIC4-SL-MultiModel sprint demonstrated exceptional visual testing hygiene with:
- User story-driven test scripts
- Full lifecycle documentation with screenshots
- Interactive review documents
- Comprehensive console verification

**This becomes mandatory for all Sprint-tier and Initiative-tier executions.**

---

## Enhancement to Constraint 11: E2E Console Monitoring Gate

### Current Constraint 11 Requirements (Existing)
```markdown
1. E2E test file exists for the feature
2. Console monitoring enabled
3. Zero critical errors
4. Screenshot evidence at interactions
5. Full lifecycle coverage
```

### NEW Enhanced Requirements (v1.5.1)
```markdown
1. User story-driven E2E test file(s)
2. Full lifecycle visual documentation (50+ screenshots)
3. Interactive REVIEW.html with all evidence
4. Console monitoring with error analysis
5. State transition verification
6. Visual verification checklist
```

---

## Constraint 11b: Comprehensive Visual Testing Gate

### Mandatory for Sprint & Initiative Tiers

**Every Sprint-tier or Initiative-tier execution MUST include:**

#### 1. User Story Test Suite
```
tests/e2e/{sprint-name}/
├── lifecycle.spec.ts          # Core user journey tests
├── features.spec.ts           # Feature-specific tests
└── analytics.spec.ts         # Data/analytics tests

Each test follows the pattern:
- Test name: 'US-{ID}: {User Story Description}'
- Step-by-step interactions
- Screenshot at each critical step
- Console error capture and analysis
```

#### 2. Visual Documentation Requirements

**Minimum Screenshot Counts:**
- **Feature Tier:** 20+ screenshots
- **Sprint Tier:** 50+ screenshots
- **Initiative Tier:** 100+ screenshots

**Screenshot Naming Convention:**
```
docs/sprints/{sprint}/screenshots/{test-suite}/
├── 01-{description}.png
├── 02-{description}.png
└── ...

Example:
docs/sprints/epic4-multimodel/screenshots/lifecycle/
├── 01-experience-console-landing.png
├── 02-create-model-button.png
└── 03-model-template-selection.png
```

#### 3. Interactive Review Document (Mandatory)

**File:** `docs/sprints/{sprint}/REVIEW.html`

**Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>{Sprint Name}: Visual Test Results</title>
  <style>
    .screenshot { width: 100%; max-width: 1200px; }
    .step { margin: 2em 0; padding: 1em; border: 1px solid #ddd; }
    .pass { color: green; font-weight: bold; }
    .fail { color: red; font-weight: bold; }
    .console-log { background: #f5f5f5; padding: 1em; font-family: monospace; }
  </style>
</head>
<body>
  <h1>{Sprint Name}: Complete Visual Review</h1>

  <section id="summary">
    <h2>Executive Summary</h2>
    <p><strong>Tests Run:</strong> X/Y tests passed</p>
    <p><strong>Screenshots:</strong> Z captured</p>
    <p><strong>Console Errors:</strong> N critical errors</p>
    <p><strong>Status:</strong> <span class="pass">✅ READY FOR ACCEPTANCE</span></p>
  </section>

  <section id="us-001">
    <h2>US-001: {User Story Title}</h2>

    <div class="step">
      <h3>Step 1: {Action}</h3>
      <img src="screenshots/{suite}/01-{action}.png" class="screenshot">
      <p><strong>Verification:</strong> <span class="pass">✓ Element visible</span></p>
      <div class="console-log">
        <strong>Console:</strong> No errors
      </div>
    </div>

    <div class="step">
      <h3>Step 2: {Action}</h3>
      <img src="screenshots/{suite}/02-{action}.png" class="screenshot">
      <p><strong>Verification:</strong> <span class="pass">✓ State changed correctly</span></p>
      <div class="console-log">
        <strong>Console:</strong> No errors
      </div>
    </div>
  </section>

  <nav class="navigation">
    <a href="#us-001">US-001</a> |
    <a href="#us-002">US-002</a>
  </nav>
</body>
</html>
```

#### 4. Visual Verification Checklist

**Each screenshot must be verified for:**
- [ ] Image loads without error (HTTP 200, not 400/500)
- [ ] Expected UI elements are visible
- [ ] Text is readable
- [ ] No error dialogs or messages
- [ ] Data displayed is accurate
- [ ] State is correct for this step

#### 5. Console Verification Protocol

**For each test suite:**
1. **Capture all console output** (errors, warnings, logs)
2. **Filter critical errors:**
   - Component not found
   - TypeError
   - ReferenceError
   - Failed to fetch
   - Network errors
   - Uncaught exceptions
3. **Log non-critical warnings** (acceptable)
4. **Zero critical errors required** for sprint completion

**Console Error Analysis Template:**
```markdown
## Console Verification Report

### Test Suite: {name}

**Total Messages:** N
**Critical Errors:** 0 ✅
**Warnings:** M (acceptable)
**Status:** PASS

### Error Breakdown:
- Error Type: Count
- Warning Type: Count

### Critical Error List:
(None)

### Non-Critical Warnings:
- Warning: {description} (Count: N)
```

---

## Sprint Completion Gate Checklist

### Before Marking Sprint Complete

**Epic 6 (Testing, Documentation & Visual Review) must include:**

- [ ] **Test Files Created**
  - [ ] User story test suite implemented
  - [ ] Following pattern from EPIC4-SL-MultiModel
  - [ ] Screenshot capture at each step

- [ ] **Screenshots Captured**
  - [ ] Minimum count met (Feature: 20+, Sprint: 50+)
  - [ ] All images saved to project
  - [ ] Naming convention followed
  - [ ] All images verified (load, visible, correct)

- [ ] **Console Verification**
  - [ ] Zero critical errors
  - [ ] Console logs captured
  - [ ] Error analysis documented
  - [ ] Non-critical warnings acceptable

- [ ] **Interactive Review Document**
  - [ ] REVIEW.html created
  - [ ] All screenshots embedded
  - [ ] Verification notes included
  - [ ] Navigation between stories
  - [ ] Summary metrics present

- [ ] **Build Gates Passed**
  - [ ] `npm test` passes
  - [ ] `npx playwright test` passes
  - [ ] All user stories verified
  - [ ] Visual evidence complete

---

## Template Artifacts

### 1. Test Script Template

**Location:** `tests/e2e/{sprint}-{suite}.spec.ts`

```typescript
import { test, expect, type ConsoleMessage } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  type ConsoleCapture,
} from './_test-utils';

const SCREENSHOT_DIR = 'docs/sprints/{sprint}/screenshots/{suite}';

test.setTimeout(300000); // 5 minutes

test.describe('{Feature}: User Story Tests', () => {
  let capture: ConsoleCapture;
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
    consoleErrors = [];

    page.on('console', (msg: ConsoleMessage) => {
      const text = msg.text();
      consoleErrors.push(`[${msg.type()}] ${text}`);
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`[UNCAUGHT] ${error.message}`);
    });
  });

  test('US-001: {User Story Description}', async ({ page }) => {
    console.log('\n=== STARTING US-001: {TITLE} ===\n');

    // Step 1: Navigate
    await page.goto('/{route}', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-{action}.png`,
      fullPage: true,
    });

    // Verify
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Final check
    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });
});
```

### 2. Test Runner Script

**Location:** `scripts/run-{sprint}-tests.sh`

```bash
#!/bin/bash
# Run comprehensive visual tests for {sprint}

SCREENSHOT_DIR="docs/sprints/{sprint}/screenshots"

echo "=== Creating Screenshot Directories ==="
mkdir -p $SCREENSHOT_DIR/{suite1}
mkdir -p $SCREENSHOT_DIR/{suite2}

echo "=== Running Visual Tests ==="
npx playwright test tests/e2e/{sprint}*.spec.ts -- headed

echo "=== Verifying Screenshots ==="
count=$(find $SCREENSHOT_DIR -name "*.png" 2>/dev/null | wc -l)
echo "Screenshots captured: $count"

echo "=== Checking Console Errors ==="
if grep -q "CRITICAL ERROR" test-results/*/console.txt 2>/dev/null; then
  echo "❌ CRITICAL ERRORS FOUND"
  grep -r "CRITICAL ERROR" test-results/
  exit 1
else
  echo "✅ No critical console errors"
fi

echo "=== Generating Review HTML ==="
# TODO: Auto-generate REVIEW.html from screenshots

echo "=== Tests Complete ==="
```

---

## Integration with Foundation Loop

### Phase 6: Story Breakdown (Updated)

**In SPRINTS.md template, add:**

```markdown
## Epic 6: Testing, Documentation & Visual Review

### Stories:
- [ ] US-001: {User story} (with screenshots)
- [ ] US-002: {User story} (with screenshots)
- [ ] Interactive review document

### Deliverables:
- [ ] User story test scripts
- [ ] 50+ full-page screenshots
- [ ] Console error verification
- [ ] REVIEW.html with all evidence
- [ ] Visual verification report

### Build Gate:
```bash
npx playwright test tests/e2e/{sprint}*.spec.ts -- headed
# Verify zero critical errors
# Verify all screenshots captured
```

### Success Criteria:
- [ ] All user stories tested and documented
- [ ] All screenshots verified (load, visible, correct)
- [ ] Zero critical console errors
- [ ] Interactive REVIEW.html complete
```

### Phase 7: Execution Prompt (Updated)

**In EXECUTION_PROMPT.md, add:**

```markdown
## Visual Testing Requirements (Constraint 11b)

Epic 6 must include comprehensive visual testing:

### Required Files:
1. Test suites following EPIC4 pattern:
   - tests/e2e/{sprint}-lifecycle.spec.ts
   - tests/e2e/{sprint}-features.spec.ts
   - tests/e2e/{sprint}-analytics.spec.ts

2. Screenshot directories:
   - docs/sprints/{sprint}/screenshots/lifecycle/
   - docs/sprints/{sprint}/screenshots/features/
   - docs/sprints/{sprint}/screenshots/analytics/

3. Interactive review:
   - docs/sprints/{sprint}/REVIEW.html

### Reference Implementation:
- Full example: docs/sprints/epic4-multimodel-v1/
- Test plan: docs/sprints/epic4-multimodel-v1/COMPREHENSIVE_TEST_PLAN.md
- Instructions: docs/sprints/epic4-multimodel-v1/TEST_EXECUTION_INSTRUCTIONS.md

### Success Criteria:
- 50+ screenshots (minimum for Sprint tier)
- Zero critical console errors
- All user stories visually verified
- REVIEW.html complete with navigation
```

---

## Automation Opportunities

### 1. Test Runner
Create `scripts/run-all-visual-tests.sh` that:
- Creates screenshot directories
- Runs all test suites
- Verifies screenshot count
- Checks console errors
- Generates REVIEW.html

### 2. Verification Script
Create `scripts/verify-visual-tests.sh` that:
- Checks minimum screenshot count
- Verifies REVIEW.html exists
- Counts critical console errors
- Reports pass/fail

### 3. CI/CD Integration
Add to build pipeline:
```yaml
- name: Visual Tests
  run: |
    npx playwright test tests/e2e/*.spec.ts
    ./scripts/verify-visual-tests.sh ${{ github.event.repository.name }}
```

---

## Migration Plan

### Phase 1: Templates (Immediate)
- [ ] Create test script templates
- [ ] Create REVIEW.html template
- [ ] Update Foundation Loop templates

### Phase 2: Protocol Update (This Sprint)
- [ ] Add Constraint 11b to grove-execution-protocol
- [ ] Update Sprint templates
- [ ] Train developers

### Phase 3: Enforcement (Next Sprint)
- [ ] Make mandatory for Sprint/Initiative tiers
- [ ] Add to sprintmaster checklist
- [ ] Measure compliance

### Phase 4: Automation (Future)
- [ ] Create automation scripts
- [ ] Integrate with CI/CD
- [ ] Auto-generate REVIEW.html

---

## Benefits

### For Developers
- Clear requirements (no ambiguity)
- Templates to follow (faster to implement)
- Automated verification (easier to check)
- Better documentation (traceability)

### For Product Owners
- Visual proof of functionality
- Interactive review experience
- Clear acceptance criteria
- Complete traceability

### For Quality
- Systematic testing approach
- Visual verification standard
- Error tracking protocol
- Documentation requirements

### For the Process
- Consistent sprint quality
- Reduced QA cycles
- Faster user acceptance
- Better knowledge transfer

---

## Questions for Discussion

1. **Should this be mandatory or recommended?**
   - Recommendation: Mandatory for Sprint+ tiers

2. **Minimum screenshot thresholds?**
   - Feature: 20+
   - Sprint: 50+
   - Initiative: 100+

3. **Who creates REVIEW.html?**
   - Developer creates
   - Product Owner reviews

4. **Template enforcement?**
   - Strongly recommended with examples

5. **Integration with existing sprints?**
   - Start with new sprints
   - Optional for in-progress sprints

---

## Conclusion

This enhancement elevates visual testing from "good practice" to "required standard." The EPIC4-SL-MultiModel sprint proved this approach delivers:
- Higher quality
- Better documentation
- Faster acceptance
- Clearer requirements

**Let's make this the new normal.**

---

**Next Steps:**
1. Review and approve this enhancement
2. Update grove-execution-protocol skill
3. Create templates
4. Train team
5. Pilot in next sprint
6. Make mandatory for Sprint+ tiers
