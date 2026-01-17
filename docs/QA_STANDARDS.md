# QA Standards - Systematic Testing Protocol

**Purpose:** Standardized QA approach to catch crashes, console errors, and regressions before production

---

## The Problem with Screenshot-Only QA

**Risks:**
- ❌ Misses JavaScript console errors
- ❌ Misses network request failures
- ❌ Misses React error boundaries
- ❌ Misses performance regressions
- ❌ Misses state management bugs
- ❌ Misses accessibility violations
- ❌ False confidence from visual-only testing

**Solution:** Multi-layered QA with automated validation + systematic manual testing

---

## QA Gate System

### Gate 1: Pre-Development (Baseline)
**When:** Before starting any sprint/epic
**Duration:** 15 minutes
**Actions:**
```bash
# 1. Run existing test suite
npm test && npx playwright test

# 2. Check console for existing errors
# Open browser DevTools → Console
# Document any existing errors/warnings

# 3. Verify baseline screenshots
ls tests/e2e/*-baseline.spec.ts-snapshots/
```

**Output:** QA Baseline Report
- [ ] All tests pass
- [ ] Zero console errors
- [ ] Baseline screenshots verified
- [ ] Performance baseline recorded

---

### Gate 2: Mid-Sprint (Daily)
**When:** Before ending each development session
**Duration:** 10 minutes
**Actions:**
```bash
# 1. Run focused tests for changed components
npm test -- --testNamePattern="changed-component"
npx playwright test tests/e2e/focused-flow.spec.ts

# 2. Manual browser testing
# - Open page in Chrome
# - Check Console tab (zero errors allowed)
# - Check Network tab (no failed requests)
# - Test core user journey
```

**Output:** Daily QA Log
- [ ] Changed components tested
- [ ] Console clean (no errors)
- [ ] Network requests successful
- [ ] User journey verified

---

### Gate 3: Pre-Merge (Epic Complete)
**When:** Before merging epic to sprint branch
**Duration:** 20 minutes
**Actions:**
```bash
# 1. Full test suite
npm run build && npm test && npx playwright test

# 2. Console error audit
# - Reload page 3x, check console each time
# - Test with DevTools open
# - Verify no red errors

# 3. Error boundary testing
# - Trigger component errors
# - Verify graceful degradation
# - Check error boundary UI

# 4. Network resilience
# - Disable network in DevTools
# - Test offline behavior
# - Verify loading states

# 5. User journey end-to-end
# - Complete core workflow
# - Test all buttons/links
# - Verify state persistence
```

**Output:** Epic QA Report
- [ ] All tests green
- [ ] Zero console errors/warnings
- [ ] Error boundaries tested
- [ ] Offline behavior verified
- [ ] Full user journey passes
- [ ] Performance within thresholds

---

### Gate 4: Pre-Sprint Complete
**When:** Before marking sprint complete
**Duration:** 30 minutes
**Actions:**
```bash
# 1. Regression testing
npx playwright test --update-snapshots
# Compare against previous sprint baseline

# 2. Cross-browser check
# - Chrome (primary)
# - Firefox (if accessible)
# - Mobile viewport (DevTools)

# 3. Accessibility audit
# - Run axe DevTools extension
# - Check keyboard navigation
# - Verify screen reader labels

# 4. Performance check
# - Check Lighthouse scores
# - Monitor bundle size
# - Verify load times

# 5. Integration testing
# - Test all API endpoints
# - Verify data persistence
# - Check cross-component state

# 6. Stress test
# - Rapid user actions
# - Multiple browser tabs
# - Memory usage monitoring
```

**Output:** Sprint QA Report
- [ ] Visual regression tests pass
- [ ] Cross-browser compatibility
- [ ] Accessibility AA compliant
- [ ] Performance targets met
- [ ] Integration tests pass
- [ ] Stress test successful
- [ ] Memory leaks checked

---

## Console Error Standards

### Zero Tolerance Policy

**Definition:** Any console error, warning, or log message indicates a QA failure.

**Categories:**

#### 🔴 Critical (Fail immediately)
- `Error:` - JavaScript runtime errors
- `TypeError:` - Type mismatches
- `ReferenceError:` - Undefined variables
- `Network request failed` - API failures
- `Warning: ReactDOM.render` - React errors
- `Warning: Cannot update during render` - State issues

#### 🟡 Warning (Fail if new)
- `Warning:` - React warnings
- `DeprecationWarning:` - Deprecated APIs
- `Performance warning` - Slow operations

#### ℹ️ Info (Allow, but document)
- `console.log` - Intentional debug logs
- `console.info` - Informational messages

### Console Audit Procedure

**Every QA Gate:**

1. **Open DevTools Console**
2. **Clear existing logs**
3. **Perform user actions**
4. **Check for ANY red errors**
5. **Screenshot console if errors found**
6. **Document source file and line number**

**Example:**
```
❌ FAIL - QA Gate 3
Console Errors Found:
1. TypeError: Cannot read property 'id' of undefined
   at UserProfile.tsx:45
   Trigger: Clicking "Edit Profile" button

Action: Fix null check in UserProfile component
```

---

## Automated Testing Standards

### Unit Tests
**Coverage Target:** 80% minimum
**Location:** `tests/unit/`
**Pattern:** Component and function tests

```typescript
// Example: Test with console monitoring
test('UserProfile renders without console errors', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<UserProfile user={mockUser} />);
  expect(consoleSpy).not.toHaveBeenCalled();
  consoleSpy.mockRestore();
});
```

### E2E Tests
**Coverage:** Core user journeys
**Location:** `tests/e2e/`
**Pattern:** Playwright with console monitoring

```typescript
// Example: E2E with console monitoring
test('Complete user onboarding flow', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      throw new Error(`Console error: ${msg.text()}`);
    }
  });

  await page.goto('/onboarding');
  await page.click('[data-testid="start-button"]');
  await page.fill('[data-testid="name-input"]', 'Test User');
  await page.click('[data-testid="continue-button"]');

  // Verify no console errors occurred
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  expect(errors).toHaveLength(0);
});
```

### Visual Regression Tests
**Tool:** Playwright + Screenshot comparison
**Purpose:** Catch visual changes/regressions

```typescript
test('matches baseline screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-baseline.png');
});
```

---

## Manual Testing Checklist

### Daily Testing (10 minutes)
- [ ] Open DevTools Console tab
- [ ] Navigate to changed feature
- [ ] Perform primary user action
- [ ] Verify ZERO console errors
- [ ] Check Network tab (no red requests)
- [ ] Take screenshot if issues found

### Epic Testing (20 minutes)
- [ ] Complete full user journey
- [ ] Test with console open throughout
- [ ] Verify all buttons/links work
- [ ] Check form submissions
- [ ] Test error states
- [ ] Verify loading states
- [ ] Check state persistence (refresh page)

### Sprint Testing (30 minutes)
- [ ] All Epic Testing checks
- [ ] Cross-browser verification (Chrome primary)
- [ ] Mobile viewport test (DevTools)
- [ ] Accessibility keyboard navigation
- [ ] Performance check (Lighthouse)
- [ ] Memory usage (Performance tab)
- [ ] Regression: Compare to previous sprint

---

## Error Boundary Testing

### Purpose
Catch React component crashes before production.

### Procedure
```bash
# 1. Identify error boundaries
grep -r "componentDidCatch\|getDerivedStateFromError" src/

# 2. Test each boundary
# - Force error in component
# - Verify boundary catches it
# - Check fallback UI displays
# - Verify error logged (not crashed)

# 3. Example test
test('Error boundary catches render error', () => {
  const ThrowError = () => { throw new Error('Test error'); };
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
});
```

---

## Network Monitoring Standards

### Failed Requests
**Definition:** Any HTTP 4xx/5xx response
**Action:** Immediate QA failure

### Slow Requests
**Warning Threshold:** > 2 seconds
**Critical Threshold:** > 5 seconds
**Action:** Performance optimization required

### Procedure
```bash
# 1. Open DevTools Network tab
# 2. Clear existing requests
# 3. Perform user actions
# 4. Check for red requests
# 5. Verify all requests < 2s
# 6. Document slow requests
```

---

## Performance Standards

### Load Time Targets
- **Initial Page Load:** < 3 seconds
- **Route Navigation:** < 1 second
- **API Response:** < 2 seconds
- **User Interaction:** < 100ms

### Monitoring
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle size
npm run build
ls -lh dist/assets/*.js
```

---

## Developer QA Workflow

### Before Writing Code
1. Review QA Standards
2. Check existing test patterns
3. Identify user journey to test

### During Development
1. Test changes immediately after implementing
2. Keep DevTools Console open
3. Fix console errors before proceeding
4. Write tests for new functionality

### Before Committing
1. Run full test suite
2. Complete Epic Testing checklist
3. Verify console clean
4. Update snapshots if needed

### Before Merging
1. Complete Pre-Merge Gate
2. Update QA log
3. Get code review
4. Ensure QA sign-off

### Before Sprint Complete
1. Complete Sprint Testing
2. Generate QA report
3. Archive test artifacts
4. Document any technical debt

---

## QA Reporting Template

### Epic QA Report
```markdown
## Epic: {Name}

**Date:** {ISO date}
**Developer:** {Name}
**Duration:** {Time spent}

### Test Results
- [ ] Unit tests: PASS/FAIL
- [ ] E2E tests: PASS/FAIL
- [ ] Console audit: CLEAN/ISSUES
- [ ] Error boundaries: TESTED
- [ ] Network monitoring: PASS/FAIL
- [ ] User journey: PASS/FAIL

### Issues Found
1. {Issue 1}
   - Severity: Critical/High/Medium/Low
   - Console Error: Yes/No
   - Action Taken: {Description}

2. {Issue 2}
   - ...

### Performance
- Load Time: {Seconds}
- Bundle Size: {MB}
- Lighthouse Score: {Number}

### QA Sign-off
✅ APPROVED - Ready for merge
❌ FAILED - Issues must be resolved
```

---

## Tools Required

### Automated
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **Lighthouse CI** - Performance
- **Bundle Analyzer** - Size monitoring

### Manual
- **Chrome DevTools** - Console, Network, Performance
- **Firefox DevTools** - Cross-browser testing
- **axe DevTools** - Accessibility
- **React DevTools** - Component inspection

### Extensions
- **axe DevTools** - Automated a11y testing
- **React DevTools** - Component debugging
- **Redux DevTools** - State debugging
- **Lighthouse** - Performance audit

---

## Quick Reference: QA Commands

```bash
# Full test suite
npm run build && npm test && npx playwright test

# Focused testing
npm test -- --testNamePattern="UserProfile"
npx playwright test tests/e2e/onboarding.spec.ts

# Update snapshots
npx playwright test --update-snapshots

# Performance audit
npx lighthouse http://localhost:3000 --output=json

# Bundle analysis
npm run build && npx vite-bundle-analyzer
```

---

## Summary

**This QA system ensures:**
1. ✅ Zero console errors tolerated
2. ✅ Every epic systematically tested
3. ✅ User journeys validated end-to-end
4. ✅ Performance regressions caught
5. ✅ Accessibility maintained
6. ✅ Error boundaries verified
7. ✅ Network issues detected

**Result:** Production-ready code with systematic validation, not just screenshots!

---

**Document Owner:** Developer
**Review Frequency:** Every sprint
**Enforcement:** Mandatory for all sprints

**Remember:** If you see it in production, it should have been caught in QA gates.
