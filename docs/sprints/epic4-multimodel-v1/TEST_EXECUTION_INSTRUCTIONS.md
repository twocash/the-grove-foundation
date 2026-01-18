# Test Execution Instructions: EPIC4-SL-MultiModel

## Overview

You have been provided with comprehensive test suites that verify the complete lifecycle of the EPIC4-SL-MultiModel sprint. These tests follow user stories from sprout creation through analytics, with full visual documentation.

**Reference Document:** `COMPREHENSIVE_TEST_PLAN.md`

---

## Test Files Created

### 1. `tests/e2e/multimodel-lifecycle.spec.ts`
**User Stories Tested:**
- US-ML-001: Create new lifecycle model
- US-ML-002: Assign sprout to model
- US-ML-003: Track tier advancement

**Screenshots:** `docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e/`

### 2. `tests/e2e/ab-testing.spec.ts`
**User Stories Tested:**
- US-AB-001: Create A/B test model variants
- US-AB-002: Monitor variant performance
- US-AB-003: Verify variant assignment

**Screenshots:** `docs/sprints/epic4-multimodel-v1/screenshots/ab-testing/`

### 3. `tests/e2e/model-analytics-dashboard.spec.ts`
**User Stories Tested:**
- US-MA-001: View comprehensive model performance dashboard
- US-MA-002: Export analytics data
- US-MA-003: Compare multiple models

**Screenshots:** `docs/sprints/epic4-multimodel-v1/screenshots/analytics-dashboard/`

---

## Pre-Execution Checklist

### 1. Verify Development Server
```bash
# Start the development server
npm run dev

# In another terminal, verify routes are accessible
curl -I http://localhost:3000/bedrock/experience
curl -I http://localhost:3000/explore

# Expected: HTTP/1.1 200 OK
```

### 2. Create Screenshot Directories
```bash
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/ab-testing
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/analytics-dashboard
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/console-verification
```

### 3. Verify Dependencies
```bash
# Ensure Playwright is installed
npx playwright --version

# If not installed:
npm install @playwright/test
npx playwright install
```

---

## Test Execution Commands

### Run All Tests (Recommended)
```bash
# Run all EPIC4 tests
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts tests/e2e/ab-testing.spec.ts tests/e2e/model-analytics-dashboard.spec.ts -- headed

# With video recording
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts tests/e2e/ab-testing.spec.ts tests/e2e/model-analytics-dashboard.spec.ts -- headed --video on
```

### Run Individual Test Suites
```bash
# Lifecycle tests only
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts -- headed

# A/B testing tests only
npx playwright test tests/e2e/ab-testing.spec.ts -- headed

# Analytics dashboard tests only
npx playwright test tests/e2e/model-analytics-dashboard.spec.ts -- headed
```

### Run Single Test
```bash
# Example: Run only the "Create new lifecycle model" test
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts -g "US-ML-001" -- headed
```

### Run with Debug Mode
```bash
# Run with Playwright debugger
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts -- headed --debug
```

---

## Visual Verification Process

### During Test Execution

As each test runs, **screenshots are automatically captured** at key steps. The test file contains explicit screenshot commands at each step.

**What to Look For:**

1. **Image Loading:** Verify each screenshot loads without error 400/500
2. **Expected Elements:** Confirm expected UI elements are visible
3. **Data Accuracy:** Verify data displayed is correct
4. **No Error Messages:** Check for error dialogs or messages

### Screenshot Naming Convention

Screenshots follow this pattern:
```
{screenshot-directory}/{step-number}-{description}.png
```

**Example:**
```
docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e/01-experience-console-landing.png
```

### Manual Screenshot Verification

If a screenshot appears corrupted or unclear, manually capture:

```bash
# In a new terminal, while tests are running
# Navigate to http://localhost:3000/bedrock/experience
# Take screenshot manually
# Save to: docs/sprints/epic4-multimodel-v1/screenshots/manual/{description}.png
```

---

## Console Verification

### Automated Console Capture

All tests automatically capture console output:
- Console errors
- Console warnings
- Page errors (uncaught exceptions)

**Console patterns to watch for:**

#### ✅ Good (Not Errors)
```
[info] Component registered
[data] Fetched model data
[log] State updated
```

#### ⚠️ Warnings (Acceptable)
```
[warning] Slow network request
[warning] Deprecated API usage
```

#### ❌ Critical Errors (Must Fix)
```
[error] Component not found
[error] Cannot read properties of undefined
[error] Failed to fetch
[error] TypeError: undefined is not a function
[error] ReferenceError: x is not defined
```

### View Console Logs

After test run:
```bash
# Check test results
cat test-results/*/test-finished-1.png.png

# Check for errors
grep -r "ERROR" test-results/
grep -r "UNCAUGHT" test-results/

# View console output
cat test-results/*/playwright-report/console.txt
```

---

## Troubleshooting Common Issues

### Issue 1: Tests Time Out
**Symptoms:** Tests timeout before completing
**Solutions:**
```bash
# Increase timeout
# Edit test file: test.setTimeout(600000); // 10 minutes

# Run with more retries
npx playwright test --retries 2

# Run headless (faster)
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts
```

### Issue 2: Elements Not Found
**Symptoms:** `element not found` errors
**Solutions:**
- Check if development server is running
- Verify routes are accessible
- Increase wait time before selectors
- Update selectors if UI has changed

### Issue 3: Screenshots Not Captured
**Symptoms:** Screenshot directories empty
**Solutions:**
- Verify write permissions to docs/ directory
- Check path is correct (relative to test file location)
- Ensure `fullPage: true` is set

### Issue 4: Console Errors
**Symptoms:** Many console errors
**Solutions:**
1. Check if they're actual errors or just warnings
2. Fix critical errors immediately
3. Warnings may be acceptable (deprecated APIs, etc.)
4. Review test output for context

---

## Expected Test Results

### Passing Tests
```
✓ Experience Console loaded
✓ Model created successfully
✓ Variant created
✓ Analytics dashboard functional
✓ No critical errors
```

### Failing Tests (Fix Before Proceeding)
```
✗ Component not found
✗ Cannot read properties
✗ Failed to fetch
✗ TypeError
✗ ReferenceError
```

### Acceptable Warnings
```
⚠ Slow network request
⚠ Deprecated API
⚠ Console warning (non-critical)
```

---

## Test Data Requirements

### Before Running Tests

Ensure you have:

1. **At least 1 lifecycle model** (can be default botanical)
2. **Test data loaded** (or tests will create it)
3. **Database accessible** (Supabase connection)
4. **Routes functional** (bedrock, explore)

### If Tests Need Test Data

The tests are designed to create their own data where possible. If you need to seed data:

```bash
# Check if there's a seed script
npm run seed

# Or create data manually via ExperienceConsole
# Navigate to /bedrock/experience
# Create test models manually
```

---

## Visual Evidence Collection

### What Screenshots Show

Each test captures screenshots at critical steps:

#### Lifecycle Tests (19 screenshots)
- Console landing
- Model creation
- Sprout creation
- Tier advancement
- State transitions

#### A/B Testing Tests (19 screenshots)
- Variant creation
- Traffic allocation
- Performance metrics
- Assignment tracking

#### Analytics Tests (21 screenshots)
- Dashboard full view
- Model comparison
- Charts and graphs
- Export process

### Screenshot Quality Checklist

For each screenshot, verify:
- [ ] Image loads (not error 400/500)
- [ ] Expected elements visible
- [ ] Text readable
- [ ] UI state correct
- [ ] No error dialogs
- [ ] Data accurate

---

## Interactive Review Document Creation

### After All Tests Pass

1. **Verify All Screenshots Exist**
```bash
ls -la docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e/
ls -la docs/sprints/epic4-multimodel-v1/screenshots/ab-testing/
ls -la docs/sprints/epic4-multimodel-v1/screenshots/analytics-dashboard/
```

Expected: 60+ screenshots total

2. **Create Interactive HTML Review**
```bash
# Use the template in COMPREHENSIVE_TEST_PLAN.md
# Create: docs/sprints/epic4-multimodel-v1/EPIC_REVIEW.html
```

3. **Populate with Screenshots**
- Add each screenshot with description
- Include console verification notes
- Add navigation between user stories
- Mark pass/fail for each step

---

## Test Execution Checklist

### Before Running
- [ ] Development server running on port 3000
- [ ] All routes accessible (/bedrock/experience, /explore)
- [ ] Screenshot directories created
- [ ] Playwright installed

### During Execution
- [ ] Tests start without errors
- [ ] Screenshots being captured
- [ ] Console errors monitored
- [ ] No critical failures

### After Execution
- [ ] All tests passed
- [ ] All screenshots captured
- [ ] Console errors analyzed
- [ ] Review document created

### Quality Gates
- [ ] Zero critical console errors
- [ ] All UI states verified
- [ ] All user stories tested
- [ ] Visual evidence complete

---

## Developer Deliverables

### 1. Test Execution
Run all tests and ensure they pass:
```bash
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts tests/e2e/ab-testing.spec.ts tests/e2e/model-analytics-dashboard.spec.ts -- headed
```

### 2. Screenshot Verification
Verify all screenshots captured:
```bash
ls docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e/ | wc -l  # Should be ~19
ls docs/sprints/epic4-multimodel-v1/screenshots/ab-testing/ | wc -l     # Should be ~19
ls docs/sprints/epic4-multimodel-v1/screenshots/analytics-dashboard/ | wc -l # Should be ~21
```

### 3. Console Report
Provide console error summary:
```bash
grep -r "CRITICAL ERROR\|UNCAUGHT" test-results/ > console-report.txt
cat console-report.txt
```

### 4. Test Results Summary
Create a summary document:
```markdown
# Test Execution Summary

## Tests Run
- multimodel-lifecycle.spec.ts: X/Y tests passed
- ab-testing.spec.ts: X/Y tests passed
- model-analytics-dashboard.spec.ts: X/Y tests passed

## Screenshots Captured
- lifecycle-e2e: X screenshots
- ab-testing: X screenshots
- analytics-dashboard: X screenshots

## Console Errors
- Critical errors: X
- Warnings: X
- Status: PASS/FAIL

## Issues Found
- List any issues or failures

## Recommendations
- Next steps for user acceptance
```

---

## Questions or Issues?

If you encounter issues during test execution:

1. **Check the troubleshooting section** above
2. **Review console output** for error details
3. **Verify environment setup** (server, routes, dependencies)
4. **Contact the team** with specific error messages

---

## Success Criteria

### Tests Pass When:
- [ ] All 3 test suites complete without failures
- [ ] No critical console errors
- [ ] All 60+ screenshots captured
- [ ] UI states verified visually

### Ready for User Review When:
- [ ] All tests pass
- [ ] All screenshots verified
- [ ] Interactive review HTML created
- [ ] Summary document provided

---

**Good luck! This is the final verification step before user acceptance. Take your time and ensure everything works perfectly.**
