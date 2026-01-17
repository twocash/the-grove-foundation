# QA Checklist - Developer Quick Reference

**Print this out or keep open during development**

---

## Daily QA (10 min) - Before Ending Session

### ✅ Automated
```bash
npm test
npx playwright test tests/e2e/focused.spec.ts
```

### ✅ Manual
- [ ] Open DevTools Console (clear logs)
- [ ] Navigate to your feature
- [ ] Perform primary action
- [ ] **VERIFY: Zero red console errors**
- [ ] Check Network tab (no red requests)
- [ ] Screenshot if issues found

### ✅ Result
If ANY console errors → Fix before stopping for the day

---

## Epic QA (20 min) - Before Merging Code

### ✅ Automated
```bash
npm run build && npm test && npx playwright test
```

### ✅ Console Audit
- [ ] Open Console tab
- [ ] Reload page 3x
- [ ] Check for ANY errors/warnings
- [ ] Screenshot console if issues

### ✅ User Journey
- [ ] Complete full workflow
- [ ] Test all buttons/links
- [ ] Try error states
- [ ] Verify loading states
- [ ] Test state persistence (refresh)

### ✅ Network
- [ ] Network tab clean (no red)
- [ ] No failed API requests
- [ ] Response times < 2s

### ✅ Result
Zero console errors + full user journey passes = Ready to merge

---

## Sprint QA (30 min) - Before Marking Complete

### ✅ All Epic QA checks (above)

### ✅ Cross-Browser
- [ ] Chrome (primary)
- [ ] Mobile viewport (DevTools)

### ✅ Accessibility
- [ ] Tab through interface
- [ ] Verify keyboard navigation
- [ ] Check screen reader labels

### ✅ Performance
```bash
npx lighthouse http://localhost:3000
# Check: Performance > 90, Load time < 3s
```

### ✅ Result
Everything passes + performance good = Sprint complete

---

## Console Errors - Immediate Fix Required

### 🔴 Critical (Stop and fix now)
- `Error:`
- `TypeError:`
- `ReferenceError:`
- `Network request failed`
- `Cannot read property of undefined`

### 🟡 Warning (Fix before merge)
- `Warning:` (React warnings)
- `DeprecationWarning:`

### ℹ️ Info (Document if needed)
- `console.log` (debug)

---

## Quick Commands

```bash
# Full QA
npm run build && npm test && npx playwright test

# Quick test
npm test -- --testNamePattern="YourComponent"

# Update screenshots
npx playwright test --update-snapshots

# Performance check
npx lighthouse http://localhost:3000 --quiet
```

---

## When You Find an Issue

### 1. Document
```markdown- Message: {error text}
- File: {component
Console Error:
.tsx:line}
- Trigger: {what you clicked}
- Screenshot: {console screenshot}
```

### 2. Fix
- Fix the root cause
- Verify console clean
- Add test to prevent regression

### 3. Re-test
- Run full test suite
- Complete user journey
- Verify no new errors

---

## Error Boundary Test

```bash
# 1. Find error boundaries
grep -r "componentDidCatch" src/

# 2. Test each boundary
# - Force error in component
# - Verify boundary catches it
# - Check fallback UI displays
# - Verify app doesn't crash
```

---

## Network Issues

### Failed Request (4xx/5xx)
- [ ] Check API endpoint
- [ ] Verify request format
- [ ] Check server logs
- [ ] Fix backend issue

### Slow Request (>2s)
- [ ] Check database query
- [ ] Verify index usage
- [ ] Optimize if needed
- [ ] Add loading state

---

## Performance Red Flags

- [ ] Page load > 3 seconds
- [ ] Button click > 100ms
- [ ] Bundle size increased
- [ ] Memory usage growing
- [ ] Lighthouse score < 90

**Action:** Optimize before merging

---

## Before Each Commit

1. [ ] Tests pass
2. [ ] Console clean
3. [ ] User journey works
4. [ ] No console.log left
5. [ ] Performance acceptable

---

## Common Mistakes to Avoid

❌ **DON'T:** Ignore console warnings
✅ **DO:** Fix all console errors/warnings

❌ **DON'T:** Test only happy path
✅ **DO:** Test error states and edge cases

❌ **DON'T:** Commit console.log statements
✅ **DO:** Remove all debug logs

❌ **DON'T:** Skip QA when rushing
✅ **DO:** Always complete QA gates

❌ **DON'T:** Assume screenshots = QA
✅ **DO:** Verify console clean + user journey

---

## QA Sign-Off

### Epic Complete
```
QA Status: ✅ PASS / ❌ FAIL
Console Errors: 0
User Journey: Verified
Tests: Passing
Ready to Merge: Yes/No
Developer: {Name}
Date: {Date}
```

### Sprint Complete
```
QA Status: ✅ PASS / ❌ FAIL
Epic QA: Complete
Cross-browser: Tested
Accessibility: Verified
Performance: Acceptable
Ready for Production: Yes/No
Developer: {Name}
Date: {Date}
```

---

## Emergency: Console Full of Errors

**STOP. Don't proceed.**

1. Close browser
2. Review recent changes
3. Identify first error
4. Fix systematically
5. Re-test from top

**Remember:** Production errors start as console warnings in development.

---

## Remember

> **Zero console errors = Quality code**
>
> **Every QA gate = Production confidence**
>
> **If you see it in prod, it should have been caught in QA**

---

**Location:** Keep this file open during development
**Enforcement:** Mandatory for all sprints
**Questions:** See docs/QA_STANDARDS.md for details
