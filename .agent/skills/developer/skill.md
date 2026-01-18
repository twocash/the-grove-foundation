---
name: developer
description: Sprint execution agent for Grove Foundation. Triggers on "developer", "dev", "execute sprint", "start coding". Accepts sprint name as argument. Outputs activation prompt with execution contract.
version: 2.0
---

# Developer Skill v2.0

> Sprint execution agent for Grove Foundation codebase.
> Implements features per EXECUTION_PROMPT specifications.
> Follows Bedrock Sprint Contract with mandatory E2E testing and visual verification.

---

## Invocation

```
/developer {sprint-name}
/dev {sprint-name}
```

**Examples:**
- `/developer s1-sfr-shell`
- `/dev results-wiring-v1`

---

## When Invoked

### Step 1: Validate Sprint

Check that the sprint has an execution prompt:
```
docs/sprints/{sprint-name}/EXECUTION_PROMPT.md
  OR
docs/sprints/{sprint-name}/S1-EXECUTION_PROMPT.md (for multi-phase sprints)
  OR
docs/sprints/{sprint-name}/{SPRINT}-EXECUTION_PROMPT.md
```

If no execution prompt found, report error and list available sprints.

### Step 2: Check for Active Sessions

Scan `.agent/status/current/*.md` for entries where:
- Sprint matches the requested sprint
- Status is `STARTED` or `IN_PROGRESS`

If found, display warning:
```
WARNING: ACTIVE SESSION DETECTED
Sprint: {sprint-name}
Agent: {agent from entry}
Last heartbeat: {timestamp}

[Continue Anyway]  [Cancel]
```

### Step 3: Output Activation Prompt

Generate and display the activation prompt:

```
===================================================================
  DEVELOPER ACTIVATION - {sprint-name}
===================================================================

You are acting as DEVELOPER for sprint: {sprint-name}.

Your responsibilities:
- Execute sprint phases per EXECUTION_PROMPT
- Write code following established patterns
- Run tests and fix failures
- Write status entries to .agent/status/current/
- Complete E2E tests with visual verification (MANDATORY)
- Validate screenshots visually (not just existence)
- Debug console errors until all clear
- Complete REVIEW.html with verified evidence

Execute per: docs/sprints/{path}/EXECUTION_PROMPT.md
Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Reference: .agent/roles/developer.md
Template: .agent/status/ENTRY_TEMPLATE.md

CRITICAL: Before marking sprint complete:
1. All E2E tests must pass
2. All screenshots must be visually verified
3. Console must be error-free
4. REVIEW.html must have verified evidence

On completion: Write COMPLETE entry with test results.
You do NOT update Notion directly - Sprintmaster handles that.

===================================================================
```

### Step 4: Show Quick Reference

After the activation prompt, show:

```
QUICK REFERENCE
---------------
Sprint artifacts:  docs/sprints/{sprint-name}/
Status template:   .agent/status/ENTRY_TEMPLATE.md
Role definition:   .agent/roles/developer.md

FIRST ACTIONS
-------------
1. Read the EXECUTION_PROMPT.md completely
2. Create feature branch: git checkout -b feat/{sprint-name}
3. Write STARTED status entry
4. Begin Phase 1
```

---

## E2E Testing & Visual Verification (MANDATORY SOP)

**CRITICAL:** No sprint is complete until E2E testing and visual verification pass.

### Pre-Review Checklist (MANDATORY)

Before considering ANY sprint ready for final review:

```markdown
## Pre-Review Verification Checklist

### 1. E2E Tests
- [ ] All E2E tests written per USER_STORIES.md specs
- [ ] All E2E tests passing: `npx playwright test`
- [ ] Test coverage includes: happy path, empty state, error state

### 2. Visual Verification (VIEW EVERY SCREENSHOT)
- [ ] Run: `npx playwright test --update-snapshots` (if baselines needed)
- [ ] OPEN and VIEW each screenshot file manually
- [ ] Verify each screenshot shows CORRECT UI state (not blank, not error)
- [ ] Screenshots reflect the CURRENT build (not stale/cached)
- [ ] All visual states captured: initial, populated, empty, error, success

### 3. Console Error Debugging
- [ ] Open browser DevTools Console
- [ ] Navigate through ALL sprint features
- [ ] ZERO console errors (not just warnings - ERRORS)
- [ ] ZERO network failures
- [ ] ZERO React/rendering errors
- [ ] If errors found: DEBUG AND FIX before proceeding

### 4. REVIEW.html Completion
- [ ] Open REVIEW.html in browser
- [ ] Verify all acceptance criteria have evidence
- [ ] Screenshots embedded and visible
- [ ] Test results documented
- [ ] Console audit results documented
```

### Screenshot Validation Process

**DO NOT just check that files exist.** You MUST:

1. **Open each screenshot** in an image viewer
2. **Verify the content** shows the correct UI state
3. **Compare against requirements** - does it match what was specified?
4. **Check for issues:**
   - Blank or partially rendered screens
   - Error messages or stack traces visible
   - Wrong data or placeholder content
   - Missing components or broken layouts
   - Stale UI from previous build

### ⚠️ CRITICAL: Screenshots Are EVIDENCE, Not Checkboxes

**Screenshots must prove acceptance criteria passed.** They are NOT:
- Proof that navigation works
- Generic page loads
- Empty states (unless testing empty state)
- "Going through the motions"

**Valid screenshots show THE FEATURE WORKING:**

| ❌ INVALID | ✅ VALID |
|------------|----------|
| Navigate to page, screenshot | Feature UI with actual data visible |
| Generic dashboard load | Dashboard showing "1,234 tokens", "12 groves" |
| Empty attribution page | Attribution chain: Grove-A → Grove-B with percentages |
| One screenshot of balance | BEFORE (100 tokens) and AFTER (150 tokens) screenshots |

**Before each screenshot, ask: "Could this be taken without the feature existing?"**
- If YES → Invalid. Set up data, trigger state change, then capture.
- If NO → Valid evidence.

---

### 🔧 Test Data Setup (MANDATORY)

**CRITICAL:** Seed localStorage with realistic, non-zero values BEFORE navigating to features.

Tests should NOT rely on empty/default state. Before each test:

1. **Seed localStorage** with realistic data
2. **Use specific, non-zero values** (not placeholders or zeros)
3. **Include variety** (multiple items, different states, progression data)

**Standard Test Data Values:**

| Data Type | Example Values | localStorage Key |
|-----------|----------------|------------------|
| Tokens | `125`, `1,847`, `50` | `grove-token-balance` |
| Tier | `"developing"`, `"flourishing"` | `grove-user-tier` |
| Badges | `["early-adopter", "contributor"]` | `grove-badges` |
| Streak | `{ current: 7, longest: 14 }` | `grove-streak-data` |
| Metrics | `{ exchanges: 42, reveals: 8 }` | `grove-engagement-state` |

**Seed Pattern (Playwright):**
```typescript
test.beforeEach(async ({ page }) => {
  // Seed localStorage BEFORE navigating
  await page.addInitScript(() => {
    // Token balance - use specific non-zero value
    localStorage.setItem('grove-token-balance', JSON.stringify({
      balance: 125,
      pending: 15,
      lastUpdated: new Date().toISOString()
    }));

    // User tier - use mid-progression tier, not default
    localStorage.setItem('grove-user-tier', JSON.stringify({
      current: 'developing',
      progress: 0.67,
      nextTier: 'flourishing'
    }));

    // Badges - include 2-3 earned badges
    localStorage.setItem('grove-badges', JSON.stringify([
      { id: 'early-adopter', earnedAt: '2026-01-10' },
      { id: 'first-contribution', earnedAt: '2026-01-12' },
      { id: 'streak-7', earnedAt: '2026-01-15' }
    ]));

    // Engagement metrics - realistic activity counts
    localStorage.setItem('grove-engagement-state', JSON.stringify({
      exchanges: 42,
      reveals: 8,
      domainsExplored: ['sovereignty', 'provenance'],
      streakDays: 7
    }));
  });
});
```

**Why Specific Values Matter:**

| ❌ BAD | ✅ GOOD | Why |
|--------|---------|-----|
| `balance: 0` | `balance: 125` | Zero looks like uninitialized state |
| `tier: "seedling"` | `tier: "developing"` | Default tier proves nothing |
| `badges: []` | `badges: [{...}, {...}]` | Empty array = no feature verification |
| `tokens: 100` | `tokens: 1,847` | Round numbers look fake/placeholder |

**Checklist for test data:**
- [ ] No zeros or empty arrays (unless testing empty state specifically)
- [ ] Values look realistic (not round numbers like 100, 1000)
- [ ] Multiple items where lists are expected (2-3 badges, not 1)
- [ ] Progression data shows mid-journey (67% progress, not 0% or 100%)
- [ ] Timestamps are recent but varied (not all the same date)

---

**Test Pattern (Complete):**
```typescript
// 1. Seed localStorage with realistic data (in beforeEach or test setup)
await page.addInitScript(() => {
  localStorage.setItem('grove-token-balance', JSON.stringify({ balance: 125 }));
  localStorage.setItem('grove-user-tier', JSON.stringify({ current: 'developing' }));
});

// 2. Navigate to FEATURE (not generic page)
await page.goto('/bedrock/attribution');

// 3. Wait for data to render
await page.waitForSelector('[data-testid="token-display"]');

// 4. VERIFY SPECIFIC VALUES visible before screenshot
const tokenText = await page.locator('[data-testid="token-display"]').textContent();
expect(tokenText).toContain('125');

// 5. SCREENSHOT THE POPULATED STATE
await page.screenshot({ path: 'token-balance-populated.png' });
```

```bash
# Generate screenshots
npx playwright test --update-snapshots

# View screenshots (open the directory and inspect each file)
# Windows: explorer docs\sprints\{sprint}\screenshots\e2e
# Mac/Linux: open docs/sprints/{sprint}/screenshots/e2e

# ACTUALLY LOOK AT EACH IMAGE - Does it prove the feature works?
```

### Console Error Debugging Protocol

**ZERO TOLERANCE for console errors.** Debug until clean:

```javascript
// In browser DevTools Console, check for:
// - Red errors (any kind)
// - Network request failures
// - React component errors
// - TypeScript/JavaScript runtime errors
// - Unhandled promise rejections

// Common issues and fixes:
// 1. "Cannot read property of undefined" → Check data loading/null handling
// 2. "Network request failed" → Check API endpoints, mock data
// 3. "React key warning" → Add unique keys to list items
// 4. "Invalid hook call" → Check component structure
```

**Debug loop:**
1. Open DevTools Console
2. Navigate to feature
3. Note any errors
4. Fix the code
5. Refresh and retest
6. Repeat until ZERO errors

---

## Sprint Discovery

If invoked without a sprint name (`/developer`), list available sprints:

1. Query Notion for sprints with Status = "ready" or "in-progress"
2. Check `docs/sprints/*/EXECUTION_PROMPT.md` for local artifacts
3. Display list:

```
AVAILABLE SPRINTS
-----------------
[ready]
  - s1-sfr-shell (docs/sprints/sprout-finishing-room-v1/S1-EXECUTION_PROMPT.md)

[in-progress]
  - (none)

Usage: /developer {sprint-name}
```

---

## Status Entry Format

When developer writes status, use this template:

```yaml
---
timestamp: {ISO-8601}
sprint: {sprint-name}
status: {STARTED|IN_PROGRESS|COMPLETE|BLOCKED}
agent: developer
branch: {git-branch}
heartbeat: {ISO-8601}
severity: INFO
sprint_id:
notion_synced: false
phase: {current phase}
commit: {hash or TBD}
---

## {timestamp} | {sprint} | {phase}

**Agent:** Developer / {branch}
**Status:** {status}
**Summary:** {1-2 sentences}
**Files:** {key files changed}
**Tests:** {pass/fail or N/A}
**E2E Tests:** {pass/fail with count}
**Visual Verification:** {PASSED - screenshots validated}
**Console Audit:** {CLEAN - zero errors}
**Commit:** {hash}
**Unblocks:** {what this enables}
**Next:** {recommended action}
```

---

## Sprint Completion Protocol

**A sprint is NOT complete until ALL of these pass:**

| Gate | Requirement | How to Verify |
|------|-------------|---------------|
| **Build** | `npm run build` succeeds | Zero errors |
| **Unit Tests** | `npm test` passes | All green |
| **E2E Tests** | `npx playwright test` passes | All green |
| **Visual Verification** | Screenshots validated | Manually viewed each |
| **Console Audit** | Zero errors in browser | DevTools checked |
| **REVIEW.html** | Complete with evidence | All criteria documented |

### Final Review Sequence (SOP)

```bash
# 1. Build check
npm run build

# 2. Unit tests
npm test

# 3. E2E tests with fresh screenshots
npx playwright test --update-snapshots

# 4. View and validate screenshots
# OPEN THE DIRECTORY AND LOOK AT EACH IMAGE
explorer docs\sprints\{sprint}\screenshots\e2e

# 5. Console audit
# Open http://localhost:3000 in browser
# Open DevTools (F12) > Console
# Navigate through all features
# Verify ZERO red errors

# 6. Complete REVIEW.html
# Open in browser, verify all evidence attached

# 7. Write COMPLETE status entry
```

---

## Integration with Sprintmaster

The developer skill is a direct-invoke alternative to `spawn developer` from Sprintmaster.

| Command | Source | Use Case |
|---------|--------|----------|
| `/developer {sprint}` | This skill | Direct invocation |
| `spawn developer {sprint}` | Sprintmaster | Multi-window workflow |

Both produce the same activation prompt.

---

## Error Handling

### No Sprint Specified
```
Usage: /developer {sprint-name}

Run /developer without arguments to see available sprints.
```

### Sprint Not Found
```
ERROR: Sprint not found: {sprint-name}

No EXECUTION_PROMPT.md found at:
  - docs/sprints/{sprint-name}/EXECUTION_PROMPT.md
  - docs/sprints/{sprint-name}/S1-EXECUTION_PROMPT.md

Available sprints:
  - {list from discovery}
```

### Missing Execution Prompt
```
ERROR: Sprint "{sprint-name}" exists but has no EXECUTION_PROMPT.md

Sprint status: {status from Notion}
Location: docs/sprints/{sprint-name}/

This sprint may not be ready for execution yet.
Check with Sprintmaster: /sprintmaster
```

---

## Reference Files

- `.agent/roles/developer.md` — Full role definition
- `.agent/status/ENTRY_TEMPLATE.md` — Status entry format
- `docs/BEDROCK_SPRINT_CONTRACT.md` — Sprint contract rules
- `docs/JSON_RENDER_PATTERN_GUIDE.md` — UI patterns
- `docs/SPRINT_WORKFLOW.md` — Full workflow with QA gates

---

## Principles

1. **E2E tests are mandatory** — No sprint ships without passing E2E tests
2. **Visual verification means LOOKING** — Screenshots must be viewed, not just exist
3. **Console errors are blockers** — Debug until clean, no exceptions
4. **REVIEW.html is evidence** — Complete documentation of acceptance criteria
5. **Quality over speed** — A broken feature shipped is worse than a delay

---

*Developer Skill v2.0 — With mandatory E2E testing and visual verification SOP*
