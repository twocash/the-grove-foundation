---
name: grove-foundation-loop
description: Sprint planning methodology implementing the Trellis Architecture's DEX (Declarative Exploration) standard. Use when the user wants to plan a sprint, refactor code, add features, or execute any multi-phase development work. Triggers on phrases like "let's plan a sprint", "Foundation Loop", "Trellis", "DEX", "refactor", "add feature", "create sprint", "start a sprint", or when development work requires structured planning with documentation, testing, and execution handoff.
---

# Grove Foundation Loop — Sprint Methodology

A structured approach to software development implementing the **Trellis Architecture** and **DEX (Declarative Exploration)** standard. Produces 9 planning artifacts, embeds automated testing as continuous process, enables clean handoff to execution agents, and includes session continuity for multi-sprint initiatives.

## Core Principles

### 1. Trellis Architecture Alignment

The Foundation Loop implements the four DEX Stack Standards:

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Domain logic in config (JSON/YAML), not code |
| **Capability Agnosticism** | Structure provides validity, not the model |
| **Provenance as Infrastructure** | Attribution chains on all artifacts |
| **Organic Scalability** | Structure precedes growth but doesn't inhibit it |

**The First Order Directive:** *Separation of Exploration Logic from Execution Capability.*
- Build the engine that reads the map; do not build the map into the engine.
- If you're hardcoding domain behavior, you're violating the architecture.

### 2. Testing as Process (Not Phase)

Testing is not a phase at the end—it's a continuous process integrated throughout:

```
Code Change → Tests Run → Report to Health → Unified Dashboard
                                                    ↓
                                          Pass ✅ Ship / Fail 🚫 Block
```

**Key insight:** E2E tests verify behavior; Health system tracks data integrity. Both feed into a unified view of system health.

### 3. Grove Architecture Rules

**CRITICAL:** When working on Grove codebase, enforce these rules:

| Rule | Violation | Correct Approach |
|------|-----------|------------------|
| No new handlers | Adding `handleFoo()` callback | Declarative config triggers action |
| No hardcoded behavior | `if (lens === 'engineer')` | Config defines lens-specific behavior |
| Behavior tests | Testing `toHaveClass('translate-x-0')` | Testing `toBeVisible()` |
| State machines | Imperative state updates | XState declarative transitions |

See `references/grove-architecture-rules.md` for full guidance.

---

## Phase 0: Pattern Check (MANDATORY)

**This phase gates all other work. Do not proceed to Phase 1 without completing it.**

### The Philosophical Grounding

> **Models are seeds. Architecture is soil. We build the Trellis.**

Grove is not just a product—it is the **Reference Implementation** of a new discipline. Every sprint either advances or undermines that mission. The Pattern Check ensures we extend proven patterns rather than creating parallel systems that fragment the architecture.

### The Check Process

Before creating ANY sprint artifacts:

#### Step 1: Read PROJECT_PATTERNS.md

```bash
# For Grove Foundation
cat C:\GitHub\the-grove-foundation\PROJECT_PATTERNS.md

# Or via view tool
view PROJECT_PATTERNS.md
```

This document contains:
- The DEX philosophy and four pillars
- Pattern catalog (existing systems to extend)
- Anti-patterns (violations to avoid)
- Decision framework

#### Step 2: Map Requirements to Existing Patterns

For each requirement in the sprint:

| Requirement | Existing Pattern? | Extension Approach |
|-------------|-------------------|-------------------|
| [Describe need] | [Pattern name or "None"] | [How to extend, or why new] |

**Key question:** Does an existing pattern already handle this need?

- **Yes** → Plan to EXTEND that pattern (add fields, not files)
- **No** → Document why existing patterns are insufficient

#### Step 3: Check for Warning Signs

If your plan involves ANY of these, STOP and reconsider:

- ❌ Creating a new React Context or Provider
- ❌ Creating a new JSON config file system
- ❌ Creating a new `use*` hook that duplicates existing data loading
- ❌ Writing `if (type === 'foo')` conditionals for domain logic
- ❌ Building infrastructure parallel to something that exists

#### Step 4: Document in SPEC.md

Every SPEC.md MUST include a "Patterns Extended" section:

```markdown
## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Lens-reactive CTAs | Quantum Interface | Add `navigation` field to LensReality type |
| Nav label customization | Quantum Interface | Add `foundation.sectionLabels` to LensReality |

## New Patterns Proposed

None required. All needs met by extending existing Quantum Interface pattern.

*— OR —*

### Proposed: [New Pattern Name]

**Why existing patterns are insufficient:**
[Detailed explanation]

**DEX compliance:**
- Declarative Sovereignty: [How domain experts can modify]
- Capability Agnosticism: [How it works regardless of model]
- Provenance: [How attribution is tracked]
- Organic Scalability: [How it grows without restructuring]

**Approval required before proceeding.**
```

### Why This Matters

The drift from "extend existing pattern" to "create parallel system" is the most common architectural violation. It happens because:

1. **Unfamiliarity** — The agent doesn't know the pattern exists
2. **Scope creep** — The new thing seems "simpler" than learning the old thing
3. **Context loss** — Previous decisions aren't visible in current session

Phase 0 forces explicit acknowledgment of existing patterns before any planning begins. This single checkpoint prevents the majority of architectural drift.

---

## Phase 0.5: Canonical Source Audit (MANDATORY)

**This phase catches duplication before it starts. Complete after Phase 0, before Phase 1.**

### The Principle

> **A feature without a canonical home is a weed. It will spread.**

Features should have **canonical homes**. Other surfaces **invoke** them, not **recreate** them. Every time we copy instead of invoke, we create:
- Two places to update when behavior changes
- Two places to style when theme changes
- Two places to test
- Two places that will drift apart

### The Problem This Solves

Common scenario: "Terminal needs a lens picker."

**Wrong approach:** Copy LensPicker into `components/Terminal/LensGrid.tsx`
**Right approach:** Terminal invokes canonical `LensPicker` with `variant="contextual"`

This audit catches the wrong approach before code is written.

### The Audit Process

Before writing SPEC.md, complete this table:

```markdown
## Canonical Source Audit

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| [What we need] | [Where it lives or "None"] | [Existing duplication?] | [PORT/EXTEND/CREATE] |
```

### Decision Framework

| Situation | Action | What It Means |
|-----------|--------|---------------|
| Canonical exists, we're duplicating | **PORT** | Delete duplicate, invoke canonical |
| Canonical exists, needs variant | **EXTEND** | Add variant prop to canonical |
| Canonical exists elsewhere, not reusable | **REFACTOR** | Make canonical reusable first |
| No canonical exists | **CREATE** | Build it right, in the right place |
| Tactical fix requested | **PAUSE** | Is this masking a pattern violation? |

### Contextual Rendering Pattern

When a canonical component needs to appear in different contexts:

```
┌─────────────────────────────────────────────────────────────────┐
│                CONTEXTUAL RENDERING PATTERN                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Action: /lens command in Terminal                          │
│       ↓                                                          │
│  Terminal emits: actions.showView('lenses')                      │
│       ↓                                                          │
│  Workspace/Shell intercepts                                      │
│       ↓                                                          │
│  Renders <LensesView variant="contextual" />                     │
│       ├── In Terminal: Sheet above input bar                     │
│       ├── In Foundation: Inspector panel                         │
│       └── Standalone: Full page                                  │
│       ↓                                                          │
│  User selects → State updates → View closes                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Standard variants:**
- `variant="full"` → Standalone page
- `variant="inspector"` → Panel in workspace
- `variant="contextual"` → Sheet/overlay in calling surface
- `variant="embedded"` → Inline within parent component

### Example Audit

Sprint request: "Fix lens selection in Terminal"

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Browse lenses | `src/explore/LensPicker.tsx` | Duplicate `LensGrid.tsx` in Terminal | **PORT** |
| Filter lenses | Lenses view | Not implemented | **EXTEND** canonical |
| Create custom lens | `src/explore/CustomLensWizard` | Duplicate in Terminal | **PORT** |
| Select lens | Engagement machine | ✅ Unified | Keep |

**Recommendation:** Don't fix LensGrid. Delete it. Add `variant="contextual"` to canonical LensPicker.

### Common Excuses (And Rebuttals)

| Excuse | Rebuttal |
|--------|----------|
| "It's in a different route" | Make it render contextually |
| "It needs different styling" | Add variant prop, not duplicate |
| "It has different state" | Lift state up or use shared context |
| "It was faster to copy" | Technical debt compounds; fix it now |
| "It's just a small component" | Small duplicates become big drift |

### Document in SPEC.md

Every SPEC.md MUST include the Canonical Source Audit:

```markdown
## Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| ... | ... | ... | ... |

### Porting Plan (if PORT recommended)

1. [Component] → Delete from [location], invoke from [canonical]
2. Add `variant` prop to [canonical] if needed
3. Update [surface] to use invocation pattern

### No Duplication Certification

I confirm this sprint does not create parallel implementations of existing capabilities.
```

### Why This Matters

The drift from "invoke canonical" to "embed duplicate" is the second most common architectural violation (after "create parallel pattern"). It happens because:

1. **Convenience** — Copying feels faster than understanding
2. **Isolation** — "My surface is special"
3. **Context loss** — Agent doesn't know canonical exists
4. **Scope creep** — "Just this once" becomes permanent

Phase 0.5 forces explicit acknowledgment of canonical sources before any duplication begins.

---

## Sprint Artifact Location

**CRITICAL**: All Foundation Loop artifacts MUST be written directly to the project repository.

### Directory Structure
```
{project-root}/docs/sprints/
├── ROADMAP.md                    ← Multi-sprint master plan
├── CONTINUATION_PROMPT.md        ← Initiative-level session handoff
└── {sprint-name}/
    ├── INDEX.md                  ← Sprint navigation
    ├── REPO_AUDIT.md
    ├── SPEC.md
    ├── ARCHITECTURE.md
    ├── MIGRATION_MAP.md
    ├── DECISIONS.md
    ├── SPRINTS.md
    ├── EXECUTION_PROMPT.md
    ├── DEVLOG.md
    └── CONTINUATION_PROMPT.md    ← Sprint-level handoff (for complex sprints)
```

### For Grove Foundation Project
```
C:\GitHub\the-grove-foundation\docs\sprints\{sprint-name}\
```

### Why This Matters

1. **Version Control**: Artifacts in the repo are tracked by git
2. **Team Access**: Other collaborators can see sprint documentation
3. **Claude Code Handoff**: CLI can read files from the project directory
4. **Continuity**: Future sessions can reference past sprint artifacts
5. **Audit Trail**: Sprint history becomes part of project history

### Anti-Pattern (DO NOT DO)
```
❌ /home/claude/sprints/...
❌ /mnt/user-data/outputs/...
❌ Holding artifacts in conversation memory only
```

### Correct Pattern
```
✅ C:\GitHub\the-grove-foundation\docs\sprints\{sprint-name}\...
✅ Write files as they are created, not at the end
✅ Confirm file creation with directory listing
```

---

## Foundation Loop as Systemic Memory

The Foundation Loop isn't just a sprint planning methodology—it's a memory system that preserves institutional knowledge across sessions, contributors, and time.

### Memory Layers
```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEMIC MEMORY STACK                        │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 4: Visual Baselines                                      │
│  └── Screenshots capture actual rendered state                  │
│  └── Location: tests/e2e/*-snapshots/                          │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: Sprint Artifacts                                      │
│  └── ADRs, specs, migration maps preserve decisions            │
│  └── Location: docs/sprints/{sprint-name}/                     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: Code Comments & Types                                 │
│  └── Inline documentation, TypeScript interfaces               │
│  └── Location: src/**/*.ts                                     │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: Declarative Configuration                             │
│  └── JSON schemas define behavior (DEX standard)               │
│  └── Location: data/**/*.json                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How Memory Flows

1. **Pre-Sprint**: Capture visual baselines → Layer 4 updated
2. **Planning**: Create sprint artifacts → Layer 3 created
3. **Execution**: Write code with comments → Layer 2 updated
4. **Configuration**: Update JSON schemas → Layer 1 updated
5. **Post-Sprint**: Run regression tests → Layer 4 validated

### Cross-Session Continuity

When starting a new session:

1. **Read Layer 3**: Check `docs/sprints/` for recent sprint artifacts
2. **Read Layer 4**: Check visual baselines for current UI state
3. **Read Layer 1**: Check JSON schemas for current configuration
4. **Context Reconstruction**: Combine layers to understand project state

### The DEVLOG as Session Memory

The DEVLOG.md file serves as session-level memory:

- Record what was attempted (even if it failed)
- Document blockers and their resolutions
- Track build gate results
- Note decisions made during execution

Future sessions can read the DEVLOG to understand what happened, not just what was planned.

### The CONTINUATION_PROMPT for Session Handoff

**Problem:** LLM context windows are finite. Long development sessions accumulate context until:
- UI becomes unstable (Claude Desktop)
- Response quality degrades
- Context gets silently truncated

**Solution:** The CONTINUATION_PROMPT.md artifact explicitly captures everything needed to resume work in a fresh context window.

**When to Create:**
1. After planning phase (once other artifacts exist)
2. Before context window fills (proactive, not reactive)
3. At natural breakpoints (between epics, after major decisions)
4. Before ending a session

**Contents:**
- Project location (absolute path)
- What was accomplished (summary)
- Key decisions made (critical context)
- Sprint status (done vs. pending)
- Next actions (clear instructions)
- Files to read first (ordered list)
- Questions to ask (for clarifying state)

**Usage:**
```
1. Ensure CONTINUATION_PROMPT.md is current
2. Open fresh Claude context window
3. Paste: "Read {path}/CONTINUATION_PROMPT.md and follow instructions"
4. New session reconstructs context from artifacts
5. Work continues without loss
```

**Multi-Sprint Initiatives:**
For work spanning multiple sprints, maintain both:
- `docs/sprints/CONTINUATION_PROMPT.md` — Initiative-level handoff
- `docs/sprints/{sprint}/CONTINUATION_PROMPT.md` — Sprint-specific handoff

---

## Visual Regression Testing as Pre-Sprint Standard

Visual regression tests serve as both **sprint protection** and **systemic memory**.

### As Sprint Protection

- Capture baseline screenshots BEFORE any sprint begins
- Automatically detect unintended visual changes during development
- Provide binary pass/fail gates for protected surfaces (like Genesis)

### As Systemic Memory

Visual regression tests become part of the project's institutional memory:

- **State Documentation**: Screenshots capture the actual rendered state at specific points in time, complementing written documentation
- **Change Archaeology**: When reviewing past sprints, baseline images show exactly what the UI looked like before changes
- **Drift Detection**: Over time, small changes accumulate; periodic baseline comparisons reveal gradual drift
- **Cross-Sprint Continuity**: When returning to a project after weeks/months, baselines show the last known-good state
- **Onboarding**: New contributors can see visual history of how surfaces evolved

### Implementation Pattern

Create a standard test template that sprints should use:

```typescript
// tests/e2e/{surface}-baseline.spec.ts
import { test, expect } from '@playwright/test';

test.describe('{Surface} Visual Regression', () => {
  test('{surface} initial state baseline', async ({ page }) => {
    await page.goto('/{route}');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('{surface}-initial-baseline.png', {
      maxDiffPixelRatio: 0.001, // 0.1% tolerance
    });
  });

  // Additional states as needed (expanded, modal open, etc.)
});
```

### Pre-Sprint Checklist

- [ ] **Visual Regression Baselines Captured**
  - Identify all surfaces this sprint could affect
  - Create/update baseline tests for each surface
  - Run with `--update-snapshots` to capture current state
  - Commit baselines to repo before starting implementation

```bash
npx playwright test tests/e2e/*-baseline.spec.ts --update-snapshots
git add tests/e2e/*.spec.ts tests/e2e/*-snapshots/
git commit -m "chore: capture visual baselines for {sprint-name}"
```

### Protected Surfaces Registry

Establish a registry of surfaces that MUST have visual regression protection:

| Surface | Route | Baseline Test | Tolerance |
|---------|-------|---------------|-----------|
| Genesis | `/` | genesis-baseline.spec.ts | 0.1% |
| Surface Marketing | `/surface/*` | surface-baseline.spec.ts | 0.1% |
| Terminal Workspace | `/terminal/*` | terminal-baseline.spec.ts | 0.5% |
| Foundation Console | `/foundation/*` | foundation-baseline.spec.ts | 1.0% |

Sprints that could affect protected surfaces MUST:
1. Capture baselines before starting
2. Run regression tests after each epic
3. Document any intentional visual changes in DEVLOG.md

---

## When to Use

**Use for:**
- Refactoring work
- New feature development
- Infrastructure changes
- Bug fixes touching multiple files
- Any work benefiting from planning

**Skip for:** Trivial changes (typo fixes, single-line config tweaks)

## The 9 Artifacts

Every sprint produces these in `docs/sprints/{sprint-name}/`:

| Artifact | Purpose | DEX Layer |
|----------|---------|-----------|
| `REPO_AUDIT.md` | Current state analysis | Corpus assessment |
| `SPEC.md` | Goals, non-goals, acceptance criteria | Configuration intent |
| `ARCHITECTURE.md` | Target state, schemas, data flows | Engine + Config design |
| `MIGRATION_MAP.md` | File-by-file change plan | Execution plan |
| `DECISIONS.md` | ADRs explaining "why" | Provenance |
| `SPRINTS.md` | Epic/story breakdown **with tests** | Execution plan |
| `EXECUTION_PROMPT.md` | Self-contained handoff | Execution capability |
| `DEVLOG.md` | Execution tracking | Attribution chain |
| `CONTINUATION_PROMPT.md` | Session handoff for fresh context | Session continuity |

The first 8 artifacts capture *what* to build and *how*. The 9th captures *how to resume* when context windows fill up or sessions end.
| `ARCHITECTURE.md` | Target state, schemas, data flows | Engine + Config design |
## Sprint Phases

### Phase 0: Pattern Check (MANDATORY)
Read PROJECT_PATTERNS.md, map requirements to existing patterns.

**DEX Check:** Does an existing pattern handle this need?

→ Documented in: `SPEC.md` (Patterns Extended section)

### Phase 0.5: Canonical Source Audit (MANDATORY)
Identify canonical homes for all capabilities, flag duplication.

**DEX Check:** Are we invoking or duplicating?

→ Documented in: `SPEC.md` (Canonical Source Audit section)

### Phase 1: Repository Audit
Analyze current state: files, architecture, patterns, technical debt.

**DEX Check:** Identify what's hardcoded that should be declarative.
**Test Check:** Identify existing test coverage and gaps.

→ Output: `REPO_AUDIT.md`

### Phase 2: Specification
Define goals, non-goals, acceptance criteria (including test requirements).

**DEX Check:** Can acceptance be verified without code changes?
**Test Check:** Are acceptance criteria testable? Include specific test commands.

→ Output: `SPEC.md`

### Phase 3: Architecture
Design target state: data structures, file organization, API contracts.

**DEX Check:** Is domain logic in configuration? Is the engine corpus-agnostic?
**Test Check:** What behaviors need E2E tests? What contracts need integration tests?

→ Output: `ARCHITECTURE.md`

### Phase 4: Migration Planning
Plan path: files to create/modify/delete, execution order, rollback plan.

**Test Check:** Which tests verify each migration step?

→ Output: `MIGRATION_MAP.md`

### Phase 5: Decisions
Document choices using ADR format with rejected alternatives.

**DEX Check:** Do decisions preserve capability agnosticism?
**Test Check:** Document testing strategy decisions (ADR for test approach).

→ Output: `DECISIONS.md`

### Phase 6: Story Breakdown
Create executable plan: epics, stories, commit sequence, build gates.

**MANDATORY:** Every epic MUST include test tasks. Every story should specify:
- What tests to write or verify
- Build gate commands
- Health check expectations

→ Output: `SPRINTS.md`

### Phase 7: Execution Prompt
Create self-contained handoff with context, code samples, verification commands.

**Include:** Test commands, expected results, troubleshooting for test failures.

→ Output: `EXECUTION_PROMPT.md`

### Phase 8: Execution
Hand off `EXECUTION_PROMPT.md`, track progress in `DEVLOG.md`.

**Verify:** Tests pass after each epic. Health check passes. No regressions.

---

## Execution Prompt Requirements

Every `EXECUTION_PROMPT.md` MUST include visual regression verification steps.

### Pre-Execution Verification

```bash
# 1. Verify baselines exist
ls tests/e2e/*-baseline.spec.ts-snapshots/

# 2. Run regression tests (should pass before starting)
npx playwright test tests/e2e/*-baseline.spec.ts

# 3. If tests fail, baselines may be stale - update them:
npx playwright test tests/e2e/*-baseline.spec.ts --update-snapshots
```

### Post-Epic Verification

After each epic, run:
```bash
# Verify no unintended visual changes
npx playwright test tests/e2e/*-baseline.spec.ts

# If intentional changes, update baselines and document in DEVLOG
```

### Final Sprint Verification

```bash
# All tests must pass
npm test
npx playwright test

# Visual regression specifically
npx playwright test tests/e2e/*-baseline.spec.ts

# If baselines changed intentionally, commit new snapshots
git add tests/e2e/*-snapshots/
git commit -m "chore: update visual baselines after {sprint-name}"
```

---

## Testing Integration Requirements

### Every SPRINTS.md Must Include

```markdown
## Epic N: {Feature}

### Story N.1: Implement {feature}
**Task:** ...
**Tests:**
- Unit: `tests/unit/{feature}.test.ts`
- E2E: Update `tests/e2e/{flow}.spec.ts` with behavior test

### Story N.2: Add tests for {feature}
**Task:** Write behavior-focused tests
**Tests:**
- [ ] Test user-visible behavior, not implementation
- [ ] Use `toBeVisible()` not `toHaveClass()`
- [ ] Tests report to Health system (if configured)

### Build Gate
```bash
npm test                    # Unit + integration
npx playwright test         # E2E behaviors
npm run health              # Health checks pass
```
```

### Test Philosophy: Behavior Over Implementation

**WRONG:**
```typescript
// Testing implementation details
expect(element).toHaveClass('translate-x-0');
expect(state.isOpen).toBe(true);
```

**RIGHT:**
```typescript
// Testing user-visible behavior
await expect(terminal).toBeVisible();
await expect(page.getByText('Welcome')).toBeVisible();
```

**Why:** Implementation changes (CSS classes, state shape) shouldn't break tests. User behavior (seeing content, clicking buttons) is what matters.

### Health Integration

For Grove projects, tests should report to the Health system:

```
Playwright Test → Health Reporter → POST /api/health/report → Health Log
                                                                    ↓
                            engagement check ← e2e-behavior type ← Health Config
```

This creates unified health monitoring where behavioral tests inform declarative health checks.

## DEX Compliance Checklist

Before finalizing any sprint, verify:

- [ ] **Pattern Check (Phase 0):** PROJECT_PATTERNS.md read, extensions documented
- [ ] **Canonical Source Audit (Phase 0.5):** No component duplication, invocations over copies
- [ ] **Declarative Sovereignty:** Domain behavior defined in config files, not hardcoded
- [ ] **Capability Agnosticism:** System works regardless of model capability
- [ ] **Provenance:** All artifacts include attribution (who, when, why)
- [ ] **Organic Scalability:** Works with minimal config, improves with more
- [ ] **Tests as Process:** Tests run automatically, report to Health
- [ ] **Behavior Focus:** Tests verify what users see, not implementation
- [ ] **Visual Baselines:** Protected surfaces have regression tests captured

**The Test:** Can a non-technical domain expert alter behavior by editing a schema file, without recompiling the application? If no, the feature is incomplete.

## Quick Reference

**Sprint naming:** `{domain}-{feature}-v{version}` (e.g., `health-dashboard-v1`)

**Commit format:** `{type}: {description}` where type is feat|fix|refactor|test|docs|chore|ci

**Build gates after each epic:**
```bash
npm run build    # Compiles
npm test         # Unit tests pass
npx playwright test  # E2E tests pass
npm run health   # Health check passes
```

**Visual regression gates:**
```bash
npx playwright test tests/e2e/*-baseline.spec.ts  # Visual baselines pass
```

## Templates and References

- **PROJECT_PATTERNS.md:** The canonical pattern catalog (lives in each project repository root)
- **Project patterns reference:** See `references/project-patterns.md`
- **Artifact templates:** See `references/templates.md`
- **Testing requirements:** See `references/testing-requirements.md`
- **Health report system:** See `references/health-report.md`
- **Grove architecture rules:** See `references/grove-architecture-rules.md`
- **Example sprints:** See `references/examples.md`

## Key Principles

1. **Pattern Check First** — Read PROJECT_PATTERNS.md before planning ANY work
2. **Canonical Source Audit** — Features have homes; other surfaces invoke, not recreate
3. **Extend, Don't Duplicate** — Existing patterns grow; parallel systems fragment
4. **Trellis First** — Structure precedes growth; build the frame before the vine
5. **Declarative Sovereignty** — Domain logic in config, engine logic in code
6. **Provenance as Infrastructure** — A fact without a root is a weed
7. **Testing as Process** — Tests run continuously, report to Health
8. **Behavior Over Implementation** — Test what users see, not internal state
9. **Sprints are Replayable** — EXECUTION_PROMPT is self-contained
10. **Visual Baselines as Memory** — Screenshots preserve UI state across time
11. **Artifacts in Repo** — All sprint files written directly to project, not memory
12. **Session Continuity** — CONTINUATION_PROMPT enables fresh context windows to resume work

## Terminology

| Term | Definition |
|------|------------|
| **Trellis** | The structural framework (architecture) supporting the DEX stack |
| **DEX** | Declarative Exploration — methodology separating intent from inference |
| **Sprout** | Atomic unit of captured, validated insight with provenance |
| **Grove** | Accumulated, refined knowledge base |
| **Vine** | Execution capability (LLM, RAG) — interchangeable and ephemeral |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
| **Superposition Collapse** | Human attention transforming probabilistic AI outputs into validated facts |
| **Quantum Interface** | Pattern where content exists in superposition until lens selection collapses it |
| **Engagement Machine** | XState machine defining valid user journey states |
| **Health** | Unified system monitoring (data integrity + behavioral tests) |
| **Behavior Test** | Test verifying user-visible outcomes, not implementation details |
| **Visual Baseline** | Screenshot capturing rendered UI state for regression testing |
| **Systemic Memory** | Layered system preserving institutional knowledge across sessions |
| **Protected Surface** | UI component requiring mandatory visual regression protection |
| **Session Continuity** | Mechanism for resuming work across context window boundaries |
| **Continuation Prompt** | Self-contained artifact enabling fresh sessions to resume with full context |
| **Pattern Check** | Mandatory Phase 0 that verifies work extends existing patterns |
| **Canonical Source Audit** | Mandatory Phase 0.5 that prevents component duplication |
| **Canonical Home** | The single authoritative location for a feature/component |
| **Contextual Rendering** | Pattern where canonical components render differently based on variant prop |
