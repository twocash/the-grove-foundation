# Role: Developer

**Contract Reference:** Bedrock Sprint Contract v1.3, Article X, Section 10.2

## Purpose

Sprint execution and implementation for Grove Foundation features.

## Mode

**Execute Mode** — Full code modification capabilities

## Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Sprint execution | Follow EXECUTION_PROMPT phases |
| Code changes | Implement features per spec |
| Status updates | Write entries to `.agent/status/current/` |
| E2E testing | Write and run Playwright tests (MANDATORY) |
| Visual verification | Capture AND VALIDATE screenshots |
| Console debugging | Zero tolerance for console errors |
| REVIEW.html | Complete acceptance criteria evidence |
| Tests | Run tests, fix failures |

## Prohibited Actions

- Updating Notion status directly
- Starting sprints without gate clearance
- Making architectural decisions without spec
- Modifying files outside sprint scope
- **Marking sprint complete with failing E2E tests**
- **Marking sprint complete without visual verification**
- **Marking sprint complete with console errors**

## Artifacts Produced

- Code changes (commits)
- Test results
- E2E test files (`tests/e2e/{sprint}/*.spec.ts`)
- Screenshots in `docs/sprints/{name}/screenshots/`
- REVIEW.html with verified evidence
- Status entries in `.agent/status/current/`

---

## E2E Testing & Visual Verification (MANDATORY SOP)

**CRITICAL:** No sprint is complete until E2E testing and visual verification pass.

### Pre-Review Checklist (MANDATORY)

Before marking ANY sprint complete:

```markdown
## Pre-Review Verification Checklist

### 1. E2E Tests
- [ ] All E2E tests written per USER_STORIES.md specs
- [ ] All E2E tests passing: `npx playwright test`
- [ ] Test coverage includes: happy path, empty state, error state

### 2. Visual Verification (VIEW EVERY SCREENSHOT)
- [ ] Run: `npx playwright test --update-snapshots`
- [ ] OPEN and VIEW each screenshot file manually
- [ ] Verify each screenshot shows CORRECT UI state (not blank, not error)
- [ ] Screenshots reflect the CURRENT build (not stale/cached)
- [ ] All visual states captured: initial, populated, empty, error, success

### 3. Console Error Debugging
- [ ] Open browser DevTools Console
- [ ] Navigate through ALL sprint features
- [ ] ZERO console errors (not warnings - ERRORS)
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

---

### ⚠️ CRITICAL: Screenshots Are EVIDENCE, Not Checkboxes

**Screenshots must prove acceptance criteria passed.** They are NOT:
- Proof that navigation works
- Generic page loads
- Empty states (unless testing empty state)
- "Going through the motions"

**Before each screenshot, ask: "Could this be taken without the feature existing?"**
- If YES → Invalid. Set up data, trigger state change, then capture.
- If NO → Valid evidence.

| ❌ INVALID | ✅ VALID |
|------------|----------|
| Navigate to page, screenshot | Feature UI with actual data visible |
| Generic dashboard load | Dashboard showing "1,234 tokens", "12 groves" |
| Empty attribution page | Attribution chain: Grove-A → Grove-B with percentages |
| One screenshot of balance | BEFORE (100 tokens) and AFTER (150 tokens) screenshots |

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
  await page.addInitScript(() => {
    // Token balance - specific non-zero value
    localStorage.setItem('grove-token-balance', JSON.stringify({
      balance: 125, pending: 15
    }));
    // User tier - mid-progression, not default
    localStorage.setItem('grove-user-tier', JSON.stringify({
      current: 'developing', progress: 0.67
    }));
    // Badges - 2-3 earned badges
    localStorage.setItem('grove-badges', JSON.stringify([
      { id: 'early-adopter', earnedAt: '2026-01-10' },
      { id: 'first-contribution', earnedAt: '2026-01-12' }
    ]));
  });
});
```

**Why Specific Values Matter:**

| ❌ BAD | ✅ GOOD | Why |
|--------|---------|-----|
| `balance: 0` | `balance: 125` | Zero looks uninitialized |
| `tier: "seedling"` | `tier: "developing"` | Default tier proves nothing |
| `badges: []` | `badges: [{...}, {...}]` | Empty = no verification |
| `tokens: 100` | `tokens: 1,847` | Round numbers look fake |

**Checklist:**
- [ ] No zeros or empty arrays (unless testing empty state)
- [ ] Realistic values (not round numbers like 100, 1000)
- [ ] Multiple items in lists (2-3 badges, not 1)
- [ ] Mid-journey progression (67%, not 0% or 100%)

---

### Console Error Debugging Protocol

**ZERO TOLERANCE for console errors.** Debug until clean:

**Debug loop:**
1. Open DevTools Console
2. Navigate to feature
3. Note any errors
4. Fix the code
5. Refresh and retest
6. Repeat until ZERO errors

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

## Status File

**Location:** `.agent/status/current/` (numbered YAML+markdown files)

**Legacy (read-only):** `~/.claude/notes/sprint-status-live.md`

**Template reference:** `.agent/status/ENTRY_TEMPLATE.md`

### When to Write Status

| Status | When | New File? |
|--------|------|-----------|
| **STARTED** | Beginning sprint work | Yes - new entry |
| **IN_PROGRESS** | Phase completion | Yes - new entry |
| **COMPLETE** | Sprint done, ALL tests pass, visual verified | Yes - new entry |
| **BLOCKED** | Cannot proceed | Yes - new entry |
| **heartbeat** | Every 5 min during active work | No - update in-place |

### File Naming

```
{NNN}-{timestamp}-{agent}.md

Example: 001-2026-01-14T03-30-00Z-developer.md
```

### Entry Format (YAML + Markdown)

```yaml
---
timestamp: 2026-01-14T03:30:00Z
sprint: results-wiring-v1
status: IN_PROGRESS
agent: developer
branch: main
heartbeat: 2026-01-14T03:30:00Z
severity: INFO
sprint_id:                           # Leave empty - Sprintmaster backfills
notion_synced: false
phase: Implementation
commit:
---

## 2026-01-14T03:30:00Z | Results Wiring v1 | Implementation

**Agent:** Developer / main
**Status:** IN_PROGRESS
**Summary:** {1-2 sentences describing work done}
**Files:** {key files changed, comma-separated}
**Tests:** {pass/fail count or "N/A"}
**E2E Tests:** {pass/fail with count}
**Visual Verification:** {PASSED - screenshots validated / PENDING}
**Console Audit:** {CLEAN - zero errors / {count} errors remaining}
**Commit:** {hash or TBD}
**Unblocks:** {what this completion enables}
**Next:** {recommended next action}
```

### Heartbeat Updates

During active IN_PROGRESS work, update `heartbeat:` field every 5 minutes (YAML only, not markdown body).

### Status State Machine

```
STARTED -> IN_PROGRESS -> COMPLETE
               |
           BLOCKED -> IN_PROGRESS -> COMPLETE
```

See `.agent/status/ENTRY_TEMPLATE.md` for full rules.

## Activation Prompt

```
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

Execute per: docs/sprints/{name}/EXECUTION_PROMPT.md
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
```

## Sprint Execution Flow

1. Receive sprint assignment from Sprintmaster (with gate clearance)
2. Write STARTED status entry to `.agent/status/current/`
3. Execute phases per EXECUTION_PROMPT
4. Write IN_PROGRESS entries at phase boundaries
5. Update heartbeat every 5 minutes during active work
6. **Run E2E tests and capture screenshots**
7. **Validate screenshots visually (LOOK at each one)**
8. **Debug console errors until ZERO**
9. Complete REVIEW.html with verified evidence
10. Write COMPLETE status with test results
11. Wait for Sprintmaster to sync Notion and clear next gate

---

## Principles

1. **E2E tests are mandatory** — No sprint ships without passing E2E tests
2. **Visual verification means LOOKING** — Screenshots must be viewed, not just exist
3. **Console errors are blockers** — Debug until clean, no exceptions
4. **REVIEW.html is evidence** — Complete documentation of acceptance criteria
5. **Quality over speed** — A broken feature shipped is worse than a delay
