# Developer Unstuck Protocol

**Version:** 1.0
**Owner:** Randy (Chief of Staff)
**Context:** S3||SFR-Actions Sprint - E2E tests skipping due to "timing issues"

---

## Core Principle

**Software that doesn't run isn't complete.**

"Skip gracefully" is not a passing test. "Manual verification can confirm" is not automated verification. If tests don't pass, the feature isn't done.

---

## Diagnostic Sequence

### Step 1: Understand the ACTUAL failure

```bash
# Run the test in debug mode
npm run test:e2e -- --debug

# Run specific test file
npx playwright test tests/e2e/sprout-finishing-room.spec.ts --headed

# Get verbose output
npx playwright test tests/e2e/sprout-finishing-room.spec.ts --reporter=line
```

**Questions to answer:**
- What is the test TRYING to do?
- What is the ACTUAL error message (not "timing issue" - the real stack trace)?
- Does the test skip intentionally (test.skip) or crash?
- What event is being waited for that never fires?

### Step 2: Isolate the timing issue

**Common E2E timing problems:**

1. **Event never fires**
   - Check: Does the component actually dispatch the custom event?
   - Fix: Add console.log or debugger before dispatchEvent() call
   - Verify: Browser DevTools → Console shows event firing

2. **Event fires too early**
   - Check: Is the test waiting for DOM before listening?
   - Fix: Use `await page.waitForSelector()` before event listener
   - Verify: Selector exists before test proceeds

3. **Event fires on wrong element**
   - Check: Is `window.dispatchEvent()` or `element.dispatchEvent()`?
   - Fix: Ensure event bubbles or listen on correct target
   - Verify: Event listener attached to correct element

4. **Race condition**
   - Check: Are multiple async operations racing?
   - Fix: Use `Promise.all()` or explicit await ordering
   - Verify: Deterministic execution order

### Step 3: Read the test file

**Before fixing anything:**

```bash
cat tests/e2e/sprout-finishing-room.spec.ts
```

**Answer these questions:**
- What does the test expect to happen?
- What is it waiting for?
- Is there a `.skip()` or `.fixme()` in the test?
- What was the LAST working version of this test (git blame)?

### Step 4: Check component integration

```typescript
// In RootLayout.tsx - verify FinishingRoomGlobal is rendering
console.log('FinishingRoomGlobal mounted');

// In SproutFinishingRoom.tsx - verify modal opens
useEffect(() => {
  console.log('SproutFinishingRoom mounted', { isOpen });
}, [isOpen]);

// In ActionPanel.tsx - verify events dispatch
const handleRevise = () => {
  console.log('Dispatching revise event');
  window.dispatchEvent(new CustomEvent('sprout:revise', { detail: sprout }));
};
```

**Run the app:**
```bash
npm run dev
```

**Open browser console → Does the component actually work?**
- If NO: Fix the component first
- If YES: Fix the test to match component behavior

### Step 5: Playwright-specific debugging

```bash
# Generate trace
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace trace.zip

# Screenshot on failure
npx playwright test --screenshot=on --video=on
```

**Inspect:**
- What is the DOM state when test fails?
- What network requests are pending?
- Are there console errors in the browser?

### Step 6: Fix patterns (not workarounds)

**❌ Bad fixes:**
```typescript
// Arbitrary sleep
await page.waitForTimeout(5000);

// Skipping the test
test.skip('Action panel works', ...);

// Commenting out assertions
// expect(button).toBeVisible();
```

**✅ Good fixes:**
```typescript
// Wait for specific condition
await page.waitForSelector('[data-testid="action-panel"]', { state: 'visible' });

// Wait for event
await page.evaluate(() => {
  return new Promise(resolve => {
    window.addEventListener('sprout:ready', resolve, { once: true });
  });
});

// Wait for network idle
await page.waitForLoadState('networkidle');
```

### Step 7: Verify in CI conditions

```bash
# Run headless (like CI)
npx playwright test --headed=false

# Run in container (like Cloud Build)
docker run -it mcr.microsoft.com/playwright:v1.40.0-jammy /bin/bash
# Inside container: npm install && npm run test:e2e
```

**If tests pass locally but fail in CI:**
- Timing is tighter in CI (no GPU acceleration)
- Network may be slower
- Need explicit waits, not implicit timing

---

## Exhaustion Checklist

Before declaring "stuck", developer must complete:

- [ ] Read actual error message (not summary)
- [ ] Run test in headed mode, watched it fail
- [ ] Added console.logs to component + test
- [ ] Verified component works in `npm run dev`
- [ ] Checked if event actually dispatches
- [ ] Used Playwright trace viewer
- [ ] Tried explicit waits instead of arbitrary timeouts
- [ ] Searched Playwright docs for similar issues
- [ ] Checked git history for when test last passed
- [ ] Asked: "What changed between working and broken?"

**Only after ALL boxes checked:** Escalate to Randy with:
1. Exact error message
2. Trace file
3. Screenshot of failure
4. What you tried (with code snippets)

---

## Escalation Template

```markdown
## S3||SFR-Actions - Test Debug Escalation

**Test file:** tests/e2e/sprout-finishing-room.spec.ts
**Test name:** [exact test name]
**Error:** [full stack trace]
**Expected:** [what should happen]
**Actual:** [what happens instead]

**Tried:**
1. [specific fix attempt + result]
2. [specific fix attempt + result]
3. [specific fix attempt + result]

**Attached:**
- trace.zip
- screenshot.png
- console.log output

**Question:** [specific question, not "it doesn't work"]
```

---

## Success Criteria

**Complete means:**
- ✅ `npm run build` - no errors
- ✅ `npm run test:e2e` - all tests PASS (not skip)
- ✅ No `.skip()` or `.fixme()` in test file
- ✅ Tests pass in headless mode
- ✅ Tests pass 3 times in a row (no flake)

**Until ALL criteria met, sprint status = IN_PROGRESS.**

---

*Randy - Chief of Staff v1.2*
*"Ship working software or don't ship."*
