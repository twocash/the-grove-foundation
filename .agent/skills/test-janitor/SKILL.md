# Test Janitor Skill

> Automated triage and repair of failing e2e tests with strict guardrails

## Invocation

```
/test-janitor                    # Run full triage
/test-janitor --dry-run          # Report only, no fixes
/test-janitor --file=smoke.spec  # Target specific file
/test-janitor --category=timing  # Fix only timing issues
```

## Agent Role Declaration

| Property | Value |
|----------|-------|
| **Role** | Test Janitor |
| **Mode** | Maintenance (read-heavy, surgical writes) |
| **Scope** | `tests/` directory only |
| **Report** | `docs/test-janitor-report.md` |

---

## GUARDRAILS (BINDING)

### PROHIBITED Actions

```
YOU MUST NEVER:

1. DELETE any test file or test case
   - Exception: Only with explicit user approval in chat

2. MODIFY production code (src/*)
   - Test files only: tests/**/*.spec.ts, tests/**/*.test.ts

3. Use .skip() or .only() as a "fix"
   - This hides problems, doesn't solve them

4. Change assertions to match broken behavior
   - If test expects "Submit" but finds "Send", the UI changed - flag for human

5. Make more than 3 fix attempts per test
   - After 3 failures, mark @fixme and move on

6. Run without reporting
   - Every run must produce a report
```

### ALLOWED Actions

```
YOU MAY:

1. Update CSS/data-testid selectors
   - When DOM structure changed but functionality is same

2. Add waitFor() / waitForSelector()
   - For race conditions and timing issues

3. Adjust timeout values (within reason: 5s-30s)
   - For slow CI environments

4. Fix import paths
   - After file moves/renames

5. Add @fixme annotation with explanation
   - When fix requires human judgment

6. Update test data
   - When expected values changed legitimately
```

---

## WORKFLOW

### Phase 1: DISCOVER

```bash
# Run tests and capture output
npx playwright test --reporter=json --output=test-results/janitor-run.json

# Or for specific project
npx playwright test --project=e2e --reporter=json
```

Parse output and categorize failures:

| Category | Pattern | Auto-fixable |
|----------|---------|--------------|
| `selector` | "locator not found", "element not visible" | YES |
| `timing` | "timeout", "waiting for", "timed out" | YES |
| `import` | "cannot find module", "is not exported" | YES |
| `assertion` | "expected X to equal Y" | MAYBE |
| `network` | "net::ERR", "fetch failed" | NO |
| `unknown` | Everything else | NO |

### Phase 2: TRIAGE

For each failure, create a triage entry:

```typescript
interface TriageEntry {
  testFile: string;
  testName: string;
  category: 'selector' | 'timing' | 'import' | 'assertion' | 'network' | 'unknown';
  error: string;
  difficulty: 'easy' | 'medium' | 'needs-human';
  proposedFix?: string;
  confidence: number; // 0-100
}
```

**Difficulty Classification:**

- `easy`: Single-line fix, high confidence (>80%)
- `medium`: Multi-line fix, moderate confidence (50-80%)
- `needs-human`: Logic change required, low confidence (<50%)

### Phase 3: FIX (Easy Only)

For each `easy` fix:

1. Read the test file
2. Apply the proposed fix
3. Run ONLY that single test: `npx playwright test <file> -g "<test name>"`
4. If PASS → Stage the change
5. If FAIL → Revert, add @fixme annotation

**Fix Templates:**

```typescript
// Selector fix
- await page.click('button.old-class');
+ await page.click('[data-testid="submit-button"]');

// Timing fix
- await page.click('#dynamic-element');
+ await page.waitForSelector('#dynamic-element', { state: 'visible' });
+ await page.click('#dynamic-element');

// Import fix
- import { OldName } from '../components';
+ import { NewName } from '../components';
```

### Phase 4: REPORT

Generate `docs/test-janitor-report.md`:

```markdown
# Test Janitor Report

**Run Date:** {ISO timestamp}
**Total Tests:** {count}
**Failures Found:** {count}

## Summary

| Status | Count |
|--------|-------|
| Fixed | X |
| Marked @fixme | X |
| Needs Human | X |
| Skipped (network) | X |

## Fixed Tests

| Test | File | Category | Fix Applied |
|------|------|----------|-------------|
| ... | ... | ... | ... |

## Needs Human Attention

| Test | File | Error | Reason |
|------|------|-------|--------|
| ... | ... | ... | ... |

## @fixme Annotations Added

| Test | File | Annotation |
|------|------|------------|
| ... | ... | ... |
```

---

## CONFIGURATION

Load from `tests/janitor.config.json`:

```json
{
  "targets": [
    "tests/e2e/**/*.spec.ts",
    "tests/visual-qa/**/*.spec.ts"
  ],
  "exclude": [
    "tests/e2e/deprecated/**"
  ],
  "maxFixAttemptsPerTest": 3,
  "maxTotalFixes": 20,
  "autoFixCategories": ["selector", "timing", "import"],
  "dryRun": false,
  "reportPath": "docs/test-janitor-report.md"
}
```

---

## EXECUTION CHECKLIST

Before starting:
- [ ] Read `tests/janitor.config.json` if exists
- [ ] Verify on correct branch (not main unless approved)
- [ ] Check git status is clean

During execution:
- [ ] Log each action taken
- [ ] Verify fix before moving to next
- [ ] Stop after maxTotalFixes reached

After completion:
- [ ] Generate report
- [ ] Summarize for user
- [ ] Do NOT auto-commit (let user review)

---

## EXAMPLE SESSION

```
User: /test-janitor

Agent: Starting Test Janitor run...

[DISCOVER] Running playwright tests...
Found 47 tests, 8 failures

[TRIAGE]
- 3 selector issues (easy)
- 2 timing issues (easy)
- 1 assertion issue (needs-human)
- 2 network issues (skip)

[FIX] Attempting 5 easy fixes...

✓ smoke.spec.ts: "homepage loads" - Updated selector
✓ theme-loading.spec.ts: "dark mode toggle" - Added waitFor
✓ engagement.spec.ts: "track click" - Updated selector
✗ surface-theming.spec.ts: "gradient renders" - Failed after 3 attempts, marked @fixme
✓ genesis-baseline.spec.ts: "metrics display" - Fixed import path

[REPORT] Generated docs/test-janitor-report.md

Summary:
- Fixed: 4
- Marked @fixme: 1
- Needs Human: 1
- Skipped: 2

Changes staged but NOT committed. Please review with:
  git diff --staged
```

---

## SAFETY NOTES

1. **Never run on main branch** without explicit approval
2. **Always create report** even if no fixes applied
3. **Preserve test intent** - if unsure, mark for human
4. **Network failures are environmental** - never "fix" them
5. **Assertion failures often indicate real bugs** - don't mask them
