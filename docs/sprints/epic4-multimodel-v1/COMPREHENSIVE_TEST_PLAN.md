# Comprehensive Test Plan: EPIC4-SL-MultiModel
## User Story-Driven E2E Testing with Visual Documentation

**Sprint:** EPIC4-SL-MultiModel (S8-SL-MultiModel [EPIC Phase 4])
**Test Strategy:** User stories with full lifecycle documentation
**Deliverable:** Interactive Epic review document with screenshots
**Date:** 2026-01-16

---

## Test Objectives

Create and execute comprehensive end-to-end tests that:
1. Follow real user stories through the entire sprout lifecycle
2. Document every step with full-page screenshots
3. Verify visual elements match expectations
4. Check console for errors, race conditions, and warnings
5. Test state transitions and object changes
6. Provide interactive review document for user acceptance

---

## Test Environment Setup

### Pre-Test Requirements
```bash
# Start development server
npm run dev

# Verify routes accessible
curl http://localhost:3000/bedrock/experience
curl http://localhost:3000/explore
```

### Screenshot Directory Structure
```bash
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e/
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/model-analytics/
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/console-verification/
```

---

## User Story Test Suite 1: Multi-Model Lifecycle

### US-ML-001: Create New Lifecycle Model
**Story:** As an operator, I want to create a new lifecycle model via ExperienceConsole

**Test Steps:**
1. Navigate to `/bedrock/experience`
2. Click "Create New Model" or find Model creation button
3. Select model template (Academic, Research, Creative, or Botanical)
4. Fill in model details:
   - Name: "Academic Model v2"
   - Description: "Research hypothesis to publication workflow"
   - Tier definitions (min 3, max 7 tiers)
5. Save the model
6. Verify model appears in ModelCard grid
7. Open model in ModelEditor

**Screenshots:**
- `01-experience-console-landing.png` - Initial experience console
- `02-create-model-button.png` - Location of create button
- `03-model-template-selection.png` - Template selection screen
- `04-model-editor-filled.png` - Completed model editor form
- `05-model-saved-grid-view.png` - Model card in grid
- `06-model-editor-opened.png` - Opened model editor

**Console Checks:**
- No "Component not found" errors
- No "Type registration failed" warnings
- No race conditions during model creation
- GroveObject pattern properly extended

**Expected Results:**
- Model created successfully
- Model appears in grid view
- Editor opens without errors
- Console clean (no critical errors)

---

### US-ML-002: Assign Sprout to Model
**Story:** As a user, I want my sprout to use a specific lifecycle model

**Test Steps:**
1. Navigate to `/explore`
2. Create new sprout with research query
3. Verify sprout created in GardenTray
4. Open sprout details/refinement modal
5. Verify model assignment interface exists
6. Select specific model (e.g., "Academic Model v2")
7. Save model assignment
8. Verify state change reflected in UI

**Screenshots:**
- `07-explore-landing.png` - Initial explore page
- `08-create-sprout-modal.png` - Sprout creation interface
- `09-sprout-in-tray.png` - GardenTray with sprout
- `10-refinement-modal.png` - Sprout refinement modal
- `11-model-selection.png` - Model assignment interface
- `12-model-assigned.png` - Assignment confirmed

**Console Checks:**
- No "Sprout not found" errors
- No "Invalid status transition" errors
- State changes properly tracked
- Database updates successful

**Expected Results:**
- Sprout created successfully
- GardenTray displays sprout
- Refinement modal opens
- Model assignment works
- State persists

---

### US-ML-003: Track Tier Advancement
**Story:** As a sprout progresses through lifecycle, I want to see tier advancement

**Test Steps:**
1. Continue from US-ML-002 with assigned sprout
2. Advance sprout through tier states:
   - Tier 1 → Tier 2
   - Tier 2 → Tier 3
3. Verify visual indicators update
4. Check tier badge changes
5. Verify advancement recorded in database
6. Open model analytics to see progress

**Screenshots:**
- `13-tier-1-initial.png` - Initial tier state
- `14-tier-2-advancing.png` - Advancing to tier 2
- `15-tier-2-complete.png` - Tier 2 complete
- `16-tier-3-advancing.png` - Advancing to tier 3
- `17-tier-3-complete.png` - Tier 3 complete
- `18-analytics-tiers.png` - Analytics view of advancement

**Console Checks:**
- No "Cannot read properties" errors
- Tier state transitions clean
- Advancement events recorded
- Analytics data updated

**Expected Results:**
- Tiers advance smoothly
- Visual indicators update correctly
- State tracked in database
- Analytics reflects progression

---

## User Story Test Suite 2: A/B Testing Framework

### US-AB-001: Create Model Variant
**Story:** As an operator, I want to create A/B test variants of my model

**Test Steps:**
1. Navigate to `/bedrock/experience`
2. Select existing model
3. Open ModelEditor
4. Find "A/B Testing Configuration" section
5. Create variant:
   - Variant name: "Academic Model - Fast Track"
   - Traffic allocation: 50%
   - Model config changes
6. Create second variant with remaining 50%
7. Enable deterministic assignment
8. Set assignment seed
9. Save configuration

**Screenshots:**
- `19-model-editor-ab-section.png` - A/B testing section
- `20-variant-creation-1.png` - Creating first variant
- `21-variant-creation-2.png` - Creating second variant
- `22-ab-config-complete.png` - Complete A/B configuration
- `23-variant-indicators.png` - Visual indicators on cards

**Console Checks:**
- No "Validation failed" errors
- Traffic allocation sums to 100%
- Deterministic assignment works
- Variant IDs unique

**Expected Results:**
- Variants created successfully
- Traffic allocation correct
- Visual indicators appear
- Configuration saves

---

### US-AB-002: Monitor Variant Performance
**Story:** As an operator, I want to see performance metrics for each variant

**Test Steps:**
1. From US-AB-001 with configured variants
2. Navigate to Model Analytics dashboard
3. Find variant performance section
4. Verify metrics displayed:
   - Impressions
   - Conversions
   - Conversion rate
   - Average engagement time
5. Check if metrics updating (simulate or wait)
6. Compare variants side-by-side

**Screenshots:**
- `24-analytics-dashboard.png` - Analytics dashboard landing
- `25-variant-metrics.png` - Variant performance metrics
- `26-comparison-view.png` - Side-by-side comparison
- `27-metrics-detail.png` - Detailed metrics view

**Console Checks:**
- No analytics loading errors
- Metrics data structure correct
- Comparison calculations accurate
- Export function available

**Expected Results:**
- Analytics dashboard loads
- Metrics visible and correct
- Comparison tool works
- Export functionality present

---

### US-AB-003: Test Variant Assignment
**Story:** As a user, I want to see consistent variant assignment

**Test Steps:**
1. With A/B test configured
2. Create multiple sprouts from `/explore`
3. Assign to A/B tested model
4. Verify variant assignment:
   - Check which variant each sprout gets
   - Verify assignment matches traffic allocation
   - If deterministic, same user gets same variant
5. Check assignment consistency

**Screenshots:**
- `28-user-view-variant-a.png` - User sees variant A
- `29-user-view-variant-b.png` - User sees variant B
- `30-assignment-consistency.png` - Assignment tracking
- `31-variant-distribution.png` - Distribution check

**Console Checks:**
- Assignment logic working
- Traffic splitting correct
- Deterministic assignment stable
- No assignment race conditions

**Expected Results:**
- Variants assigned correctly
- Traffic split matches configuration
- Deterministic assignment stable
- Distribution approximates allocation

---

## User Story Test Suite 3: Model Analytics & Dashboard

### US-MA-001: View Model Performance Dashboard
**Story:** As an operator, I want to see comprehensive model analytics

**Test Steps:**
1. Navigate to `/bedrock/experience`
2. Find "Model Analytics" or analytics tab
3. View dashboard with:
   - Model comparison charts
   - Tier advancement rates
   - Time-series performance data
4. Test dashboard filters:
   - Date range
   - Model type
   - Specific metrics
5. Verify all 10 analytics components render

**Screenshots:**
- `32-analytics-dashboard-full.png` - Full analytics dashboard
- `33-model-comparison.png` - Model comparison view
- `34-tier-advancement-rates.png` - Tier advancement metrics
- `35-time-series-data.png` - Time-series charts
- `36-dashboard-filters.png` - Filter interface

**Console Checks:**
- All 10 components render without errors
- No "Component not registered" warnings
- Data loading clean
- Chart rendering successful

**Expected Results:**
- Dashboard fully functional
- All components visible
- Filters work correctly
- Charts display data

---

### US-MA-002: Export Analytics Data
**Story:** As an operator, I want to export analytics data

**Test Steps:**
1. From US-MA-001 with analytics displayed
2. Find export button/function
3. Select export format (CSV, JSON, PDF)
4. Choose data scope:
   - All models
   - Specific model
   - Date range
5. Trigger export
6. Verify file downloaded
7. Check data completeness

**Screenshots:**
- `37-export-interface.png` - Export options
- `38-export-progress.png` - Export in progress
- `39-export-complete.png` - Export completion
- `40-data-verification.png` - Exported data check

**Console Checks:**
- Export function executes
- File generation successful
- No memory leaks during export
- Data integrity maintained

**Expected Results:**
- Export works for all formats
- File downloads successfully
- Data complete and accurate
- No errors during process

---

### US-MA-003: Cross-Model Comparison
**Story:** As an operator, I want to compare multiple models side-by-side

**Test Steps:**
1. With multiple models configured
2. Open Model Analytics
3. Select comparison mode
4. Choose 2-4 models to compare
5. View comparison metrics:
   - Performance metrics
   - Tier advancement rates
   - User engagement
6. Identify best performing model

**Screenshots:**
- `41-comparison-selection.png` - Model selection for comparison
- `42-comparison-results.png` - Side-by-side comparison
- `43-performance-comparison.png` - Performance metrics comparison
- `44-recommendations.png` - System recommendations

**Console Checks:**
- Comparison calculations correct
- Multiple models loaded
- No data mixing between models
- Performance metrics accurate

**Expected Results:**
- Comparison renders correctly
- Metrics accurate for each model
- Recommendations based on data
- Export comparison data works

---

## User Story Test Suite 4: Experience Console Integration

### US-EC-001: Navigate Experience Console
**Story:** As an operator, I want easy navigation through ExperienceConsole

**Test Steps:**
1. Navigate to `/bedrock/experience`
2. Verify console loads without errors
3. Test navigation between sections:
   - Models grid
   - Analytics dashboard
   - Model Editor
4. Verify breadcrumbs work
5. Check responsive layout
6. Test back/forward browser buttons

**Screenshots:**
- `45-experience-console-home.png` - Console home
- `46-models-grid.png` - Models grid view
- `47-analytics-tab.png` - Analytics tab
- `48-model-editor-tab.png` - Model editor
- `49-breadcrumb-navigation.png` - Breadcrumb navigation

**Console Checks:**
- No route errors
- Navigation state correct
- No memory leaks
- Browser history maintained

**Expected Results:**
- All routes accessible
- Navigation smooth
- State maintained
- No console errors

---

### US-EC-002: CRUD Operations via Console
**Story:** As an operator, I want full CRUD operations on models

**Test Steps:**
1. Create model (US-ML-001)
2. Read/View model details
3. Update model configuration:
   - Change name
   - Modify tiers
   - Update description
4. Delete model
5. Verify all operations persist

**Screenshots:**
- `50-create-operation.png` - Model creation
- `51-read-operation.png` - Model viewing
- `52-update-operation.png` - Model editing
- `53-delete-operation.png` - Model deletion
- `54-crud-verification.png` - All operations verified

**Console Checks:**
- Create operations succeed
- Read returns correct data
- Update persists changes
- Delete removes from database

**Expected Results:**
- All CRUD operations work
- Database updates reflect changes
- No orphaned data
- Concurrency handled

---

## User Story Test Suite 5: State Management & Object Transitions

### US-SM-001: Verify Object State Transitions
**Story:** As a system, I want to track object state changes accurately

**Test Steps:**
1. Create sprout with specific model
2. Advance through tier states
3. Monitor state transitions:
   - Initial → Tier 1
   - Tier 1 → Tier 2
   - Tier 2 → Tier 3
4. Verify state recorded in:
   - Frontend UI
   - Database
   - Analytics
5. Test concurrent updates
6. Verify state consistency

**Screenshots:**
- `55-state-transition-1.png` - State 1 to 2
- `56-state-transition-2.png` - State 2 to 3
- `57-state-database.png` - Database state check
- `58-state-analytics.png` - Analytics state tracking
- `59-concurrent-update.png` - Concurrent updates test

**Console Checks:**
- State transitions atomic
- No race conditions
- Database consistency
- UI state sync

**Expected Results:**
- All states transition correctly
- Database reflects current state
- Analytics track changes
- No data corruption

---

### US-SM-002: Test Model Switching
**Story:** As a user, I want to change my sprout's model mid-lifecycle

**Test Steps:**
1. Create sprout with Model A
2. Advance to Tier 2
3. Switch to Model B
4. Verify:
   - Tier state maintained or reset
   - Visual indicators update
   - Analytics reflect switch
   - No data loss

**Screenshots:**
- `60-sprout-with-model-a.png` - Before switch
- `61-switch-model-dialog.png` - Model switch interface
- `62-sprout-with-model-b.png` - After switch
- `63-switch-verification.png` - Verification of switch

**Console Checks:**
- Model switch process clean
- Tier state handled correctly
- Analytics updated
- No errors during switch

**Expected Results:**
- Switch completes successfully
- State handled appropriately
- Analytics updated
- No data loss

---

## Test Execution Instructions

### For Developer: Test Implementation

#### Step 1: Set Up Test Environment
```bash
# 1. Start development server
npm run dev

# 2. Verify all routes
curl -I http://localhost:3000/bedrock/experience
curl -I http://localhost:3000/explore

# 3. Create screenshot directories
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/lifecycle-e2e
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/model-analytics
mkdir -p docs/sprints/epic4-multimodel-v1/screenshots/console-verification
```

#### Step 2: Implement Test Files

Create the following test files:

**File 1:** `tests/e2e/multimodel-lifecycle.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { setupConsoleCapture } from './_test-utils';

test.describe('EPIC4-SL-MultiModel: Full Lifecycle Tests', () => {
  // Implement all user story tests here
  // Reference: This document for step-by-step instructions
});
```

**File 2:** `tests/e2e/ab-testing.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { setupConsoleCapture } from './_test-utils';

test.describe('EPIC4-SL-MultiModel: A/B Testing Tests', () => {
  // Implement A/B testing tests
});
```

**File 3:** `tests/e2e/analytics-dashboard.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { setupConsoleCapture } from './_test-utils';

test.describe('EPIC4-SL-MultiModel: Analytics Dashboard Tests', () => {
  // Implement analytics tests
});
```

#### Step 3: Run Tests with Screenshots

For each test:
```bash
# Run single test with video
npx playwright test tests/e2e/multimodel-lifecycle.spec.ts -- headed

# Screenshots auto-captured at each step
# Verify screenshots in: docs/sprints/epic4-multimodel-v1/screenshots/
```

#### Step 4: Console Verification

After each test run:
```bash
# Check for errors
grep -r "ERROR" test-results/
grep -r "WARNING" test-results/

# Check console logs
cat test-results/*/test-finished-1.png.png
```

### Visual Verification Checklist

For each screenshot, verify:
- [ ] Image loads without error 400/500
- [ ] Expected elements visible
- [ ] Text readable
- [ ] UI state correct
- [ ] No error messages displayed
- [ ] Data displayed accurately

### Console Verification Checklist

For each test, verify:
- [ ] No critical errors (unhandled exceptions)
- [ ] No "Component not found" warnings
- [ ] No type registration failures
- [ ] No race conditions detected
- [ ] State transitions atomic
- [ ] Database operations successful
- [ ] Memory usage stable

---

## Test Data Requirements

### Required Test Models
1. **Botanical Model** (existing/default)
   - Seed → Sprout → Sapling → Tree → Grove

2. **Academic Model** (new)
   - Hypothesis → Tested → Published → Canonical

3. **Research Model** (new)
   - Question → Hypothesis → Experiment → Analysis → Results → Theory

4. **Creative Model** (new)
   - Idea → Draft → Revision → Refinement → Masterpiece

### Required Test Sprouts
- 5-10 sprouts across different models
- Various tier states (1, 2, 3, complete)
- Some with A/B variant assignments
- Mix of recent and older sprouts

### Required Analytics Data
- 2-4 weeks of synthetic analytics data
- Multiple models with different performance
- A/B test variants with distinct metrics
- Time-series data for trends

---

## Deliverable: Interactive Review Document

After all tests pass:

### Create: `docs/sprints/epic4-multimodel-v1/EPIC_REVIEW.html`

**Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>EPIC4-SL-MultiModel: Interactive Review</title>
  <style>
    /* Full-page screenshot viewer */
    .screenshot-viewer { }
    .screenshot-full { width: 100%; height: auto; }
    .step-navigation { }
  </style>
</head>
<body>
  <h1>EPIC4-SL-MultiModel: Complete Lifecycle Review</h1>

  <!-- Executive Summary -->
  <section id="summary">
    <h2>Executive Summary</h2>
    <p>Test Results: X/Y tests passed</p>
    <p>Console Errors: N critical errors</p>
    <p>Performance: All benchmarks met</p>
  </section>

  <!-- User Story 1 -->
  <section id="us-ml-001">
    <h2>US-ML-001: Create New Lifecycle Model</h2>
    <div class="step">
      <h3>Step 1: Navigate to Experience Console</h3>
      <img src="screenshots/lifecycle-e2e/01-experience-console-landing.png" class="screenshot-full">
      <p>Verification: Console loads without errors, Model cards visible</p>
      <div class="console-log">
        Console Output: No errors detected
      </div>
    </div>
    <!-- Additional steps... -->
  </section>

  <!-- Navigation between stories -->
  <nav class="story-navigation">
    <a href="#us-ml-001">US-ML-001</a>
    <a href="#us-ml-002">US-ML-002</a>
    <!-- ... -->
  </nav>
</body>
</html>
```

**Features:**
- Full-page screenshots for each step
- Console output verification
- Navigation between user stories
- Pass/fail indicators for each step
- Interactive elements (expand/collapse sections)
- Download links for test artifacts

---

## Success Criteria

### Test Coverage
- [ ] All 10 user stories implemented
- [ ] All screenshots captured (60+ images)
- [ ] All console checks documented
- [ ] Interactive review HTML created

### Quality Gates
- [ ] Zero critical console errors
- [ ] All UI states visually verified
- [ ] All state transitions documented
- [ ] All CRUD operations tested
- [ ] A/B testing fully functional
- [ ] Analytics dashboard complete
- [ ] Performance benchmarks met

### Documentation
- [ ] Screenshots organized by user story
- [ ] Console logs captured and analyzed
- [ ] Interactive review document complete
- [ ] Test results summary provided

---

## Next Steps

1. **Developer implements test files** (this document as guide)
2. **Run all tests** with screenshot capture
3. **Verify visual evidence** for each screenshot
4. **Fix any failures** until all pass
5. **Create interactive review HTML**
6. **User reviews and accepts** or requests changes

---

**Created:** 2026-01-16
**Status:** Ready for developer implementation
**Reviewer:** User (final acceptance)
