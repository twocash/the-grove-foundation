# Visual Testing Standard: Process Integration

**Date:** 2026-01-16
**Purpose:** Standardize comprehensive visual testing for all sprints
**Status:** Draft for process integration

---

## Overview

The EPIC4-SL-MultiModel sprint demonstrated the value of comprehensive visual testing with:
- User story-driven test scripts
- Full visual documentation at each step
- Interactive review documents
- Console verification
- State transition tracking

**This should become standard practice for all sprints.**

---

## Where It Fits in Foundation Loop

### Current Flow (Epic 6)
```
Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6 (Testing & Polish)
```

### Recommended Flow (Epic 6 with Visual Testing)
```
Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6 (Testing, Documentation & Visual Review)
```

**Epic 6 now includes:**
- Unit/integration/E2E tests
- Visual documentation
- Interactive review
- User acceptance

---

## Required Artifacts for Every Sprint

### Sprint Planning Phase (Phase 6: Story Breakdown)

**Add to SPRINTS.md:**

```markdown
## Epic 6: Testing, Documentation & Visual Review

### Stories:
- [ ] US-XXX: Test story with screenshots
- [ ] Visual verification
- [ ] Interactive review document

### Deliverables:
- [ ] Test scripts following user stories
- [ ] Full-page screenshots for each step
- [ ] Console error verification
- [ ] Interactive review HTML
- [ ] Visual verification report

### Build Gate:
```bash
npm test && npx playwright test -- headed
```

### Visual Evidence Requirements:
- [ ] All user stories documented with screenshots
- [ ] Console errors monitored and verified
- [ ] State transitions captured
- [ ] Interactive review HTML created
```

---

## Template Artifacts

### 1. Test Plan Template
**Location:** `docs/sprints/{sprint-name}/TEST_PLAN.md`

```markdown
# Test Plan: {Sprint Name}

## User Stories
- [ ] US-001: {Description}
- [ ] US-002: {Description}

## Test Files
- tests/e2e/{sprint}-lifecycle.spec.ts
- tests/e2e/{sprint}-features.spec.ts

## Screenshots Directory
screenshots/{sprint-name}/

## Visual Verification Checklist
- [ ] All screenshots captured
- [ ] No error 400/500 on images
- [ ] Expected elements visible
- [ ] Console errors zero
```

### 2. Interactive Review Template
**Location:** `docs/sprints/{sprint-name}/REVIEW.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>{Sprint Name}: Interactive Review</title>
  <style>
    .screenshot { width: 100%; max-width: 1200px; }
    .step { margin-bottom: 2em; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h1>{Sprint Name}: Visual Test Results</h1>

  <section id="summary">
    <h2>Executive Summary</h2>
    <p>Tests: X/Y passed</p>
    <p>Screenshots: Z captured</p>
    <p>Console Errors: N critical</p>
  </section>

  <!-- User Story 1 -->
  <section id="us-001">
    <h2>US-001: {Story Name}</h2>
    <div class="step">
      <h3>Step 1: {Description}</h3>
      <img src="screenshots/step-1.png" class="screenshot">
      <p class="pass">✓ Verification: {Criteria}</p>
    </div>
    <!-- More steps... -->
  </section>
</body>
</html>
```

---

## Process Integration

### Phase 6: Story Breakdown (Updated)

**In SPRINTS.md, add requirements:**

```markdown
## Epic 6: Testing, Documentation & Visual Review

### Standard Requirements:
1. **User Story Tests** - Follow format from EPIC4-SL-MultiModel
2. **Visual Documentation** - Full-page screenshots for each step
3. **Console Verification** - Monitor for errors throughout
4. **Interactive Review** - HTML document with all evidence

### Test Structure:
- User story-driven test scripts
- Screenshot capture at each critical step
- Console error monitoring
- State transition verification

### Deliverables:
- Test execution report
- Screenshot collection (60+ for complex features)
- Console error analysis
- Interactive review HTML
- Visual verification summary

### Success Criteria:
- Zero critical console errors
- All user stories visually verified
- All screenshots captured and verified
- Interactive review complete
```

### Phase 7: Execution Prompt (Updated)

**Add to EXECUTION_PROMPT.md:**

```markdown
## Visual Testing Requirements

Epic 6 must include:
1. Create test scripts following user stories
2. Capture full-page screenshots at each step
3. Verify console for errors throughout
4. Create interactive review HTML

Reference: `docs/sprints/epic4-multimodel-v1/TEST_EXECUTION_INSTRUCTIONS.md`

Templates available:
- Test script template
- Screenshot directory structure
- Interactive review HTML
```

---

## Test Automation

### Test Runner Script
**Create:** `scripts/run-visual-tests.sh`

```bash
#!/bin/bash
# Run comprehensive visual tests

echo "=== Running Visual Tests ==="

# Create screenshot directories
mkdir -p docs/sprints/${1}/screenshots/lifecycle
mkdir -p docs/sprints/${1}/screenshots/features

# Run tests with screenshots
npx playwright test tests/e2e/${1}*.spec.ts -- headed

# Verify screenshots
echo "=== Screenshot Verification ==="
find docs/sprints/${1}/screenshots -name "*.png" | wc -l

# Generate review HTML
echo "=== Generating Review Document ==="
# TODO: Auto-generate from screenshots

echo "=== Tests Complete ==="
```

### Verification Script
**Create:** `scripts/verify-visual-tests.sh`

```bash
#!/bin/bash
# Verify visual test requirements

SCREENSHOT_DIR="docs/sprints/$1/screenshots"
MIN_SCREENSHOTS=20

# Check screenshot count
count=$(find $SCREENSHOT_DIR -name "*.png" 2>/dev/null | wc -l)

if [ $count -ge $MIN_SCREENSHOTS ]; then
  echo "✓ Screenshots: $count (minimum $MIN_SCREENSHOTS)"
else
  echo "✗ Screenshots: $count (minimum $MIN_SCREENSHOTS) - FAIL"
  exit 1
fi

# Check for review HTML
if [ -f "docs/sprints/$1/REVIEW.html" ]; then
  echo "✓ Review HTML exists"
else
  echo "✗ Review HTML missing - FAIL"
  exit 1
fi

# Check console errors
if grep -q "CRITICAL ERROR" test-results/*/console.txt 2>/dev/null; then
  echo "⚠ Console errors found - review required"
else
  echo "✓ No critical console errors"
fi

echo "=== Visual Test Verification Complete ==="
```

---

## Sprintmaster Checklist (Updated)

### Pre-Dispatch Checklist

Before sending sprint to developer, verify:
- [ ] Epic 6 includes visual testing requirements
- [ ] Test plan template provided
- [ ] Review HTML template ready
- [ ] Screenshot directories defined
- [ ] Success criteria clear

### Pre-Completion Checklist

Before marking sprint complete:
- [ ] All tests pass
- [ ] All screenshots captured
- [ ] Console errors verified
- [ ] Interactive review HTML created
- [ ] Visual verification complete

---

## Implementation Timeline

### Phase 1: Template Creation (Immediate)
- [ ] Create test script templates
- [ ] Create review HTML template
- [ ] Create test runner scripts
- [ ] Update DEVLOG template

### Phase 2: Process Update (This Sprint)
- [ ] Update SPRINTS.md template
- [ ] Update EXECUTION_PROMPT.md template
- [ ] Add to Sprintmaster checklist
- [ ] Train team on process

### Phase 3: Tooling (Next Sprint)
- [ ] Create automation scripts
- [ ] Integrate into CI/CD
- [ ] Add screenshot verification
- [ ] Auto-generate review docs

### Phase 4: Standard Practice (Ongoing)
- [ ] Use in all future sprints
- [ ] Refine templates based on feedback
- [ ] Measure quality improvements
- [ ] Document best practices

---

## Benefits

### For Developers
- Clear test requirements
- Template to follow
- Automated verification
- Standard process

### for Product Owners
- Visual evidence of functionality
- Interactive review documents
- Clear acceptance criteria
- Traceability to user stories

### for Quality
- Systematic testing
- Visual verification
- Error tracking
- Documentation standards

---

## Success Metrics

### Sprint Quality
- [ ] 100% of sprints include visual testing
- [ ] Average 50+ screenshots per sprint
- [ ] Zero critical console errors
- [ ] Interactive review for 100% of sprints

### Developer Experience
- [ ] Templates used in 90% of sprints
- [ ] Reduced time to write tests
- [ ] Clear success criteria
- [ ] Better documentation

---

## Next Steps

1. **Review this standard** with team
2. **Update Foundation Loop** templates
3. **Train developers** on process
4. **Pilot in next sprint**
5. **Refine based on feedback**

---

## Questions for Discussion

1. **Should this be mandatory for all sprints?**
   - Recommendation: Yes, for Feature tier and above

2. **Minimum screenshot count?**
   - Recommendation: 20+ for Feature, 50+ for Sprint

3. **Who creates the review HTML?**
   - Recommendation: Developer creates, Product Owner reviews

4. **Integration with CI/CD?**
   - Recommendation: Yes, automate verification

5. **Template customization?**
   - Recommendation: Base templates, allow customization per sprint

---

**This is excellent hygiene. Let's make it standard practice.**
