---
name: grove-foundation-loop
description: Sprint planning methodology implementing the Trellis Architecture's DEX (Declarative Exploration) standard. Use when the user wants to plan a sprint, refactor code, add features, or execute any multi-phase development work. Triggers on phrases like "let's plan a sprint", "Foundation Loop", "Trellis", "DEX", "refactor", "add feature", "create sprint", "start a sprint", or when development work requires structured planning with documentation, testing, and execution handoff.
version: 2.0
---

# Grove Foundation Loop v2 — Sprint Methodology

A structured approach to software development implementing the **Trellis Architecture** and **DEX (Declarative Exploration)** standard. Produces planning artifacts scaled to task complexity, embeds automated testing as continuous process, enables clean handoff to execution agents, and includes attention anchoring for goal persistence across long tool-call chains.

**New in v2:**
- Tiered complexity (Quick Fix → Feature → Sprint → Initiative)
- Attention Anchoring protocol for goal persistence
- Live Status blocks for instant orientation
- Simplified artifact requirements for smaller tasks

---

## Tiered Complexity: Right-Size Your Process

Not every task needs 9 artifacts. Match methodology overhead to task complexity.

### Tier Selection Matrix

| Tier | Duration | Trigger Phrases | Required Artifacts |
|------|----------|-----------------|-------------------|
| **Quick Fix** | < 1 hour | "fix this bug", "quick change", "small tweak" | DEVLOG only |
| **Feature** | 1-4 hours | "add feature", "implement X", "build Y" | SPEC + DEVLOG |
| **Sprint** | 1-3 days | "refactor", "new system", "migrate" | Full 9 artifacts |
| **Initiative** | Multi-sprint | "redesign", "platform change", "major overhaul" | Full artifacts + ROADMAP + Initiative CONTINUATION_PROMPT |

### Quick Fix (< 1 hour)

**When:** Single-file changes, bug fixes, config tweaks, typo corrections.

**Process:**
```
1. Create DEVLOG.md entry with timestamp
2. Document: what, why, verification
3. Make change
4. Document: result, any surprises
```

**DEVLOG Template (Quick Fix):**
```markdown
## Quick Fix: {Description}

**Started:** {timestamp}
**Status:** 🟡 In Progress | ✅ Complete | 🔴 Blocked

### Intent
{One sentence: what and why}

### Change
- File: `{path}`
- Change: {description}

### Verification
- [ ] {How you'll verify it worked}

### Result
{What happened, any surprises, follow-up needed}
```

### Feature (1-4 hours)

**When:** Contained feature work, multi-file changes, additions to existing systems.

**Process:**
```
1. Pattern Check (abbreviated) — 5 min
2. Create SPEC.md with Live Status
3. Implement
4. Update DEVLOG.md
```

**Required Artifacts:** SPEC.md, DEVLOG.md

**SPEC.md Template (Feature):**
```markdown
# Feature: {Name}

## Live Status
**Current Phase:** {Planning | Implementing | Verifying | Complete}
**Blocking Issues:** {None | Description}
**Last Updated:** {ISO timestamp}
**Next Action:** {What to do next}

## Pattern Check (Abbreviated)
**Existing pattern to extend:** {Pattern name or "None — new capability"}
**Canonical home for this feature:** {Location or "Creating new"}

## Goal
{2-3 sentences: what we're building and why}

## Non-Goals
- {What we're explicitly NOT doing}

## Acceptance Criteria
- [ ] {Testable criterion 1}
- [ ] {Testable criterion 2}

## Implementation Notes
{Key decisions, gotchas, dependencies}
```

### Sprint (1-3 days)

**When:** Refactoring, new systems, migrations, complex features.

**Process:** Full Foundation Loop (Phase 0 through Phase 8)

**Required Artifacts:** All 9 (REPO_AUDIT, SPEC, ARCHITECTURE, MIGRATION_MAP, DECISIONS, SPRINTS, EXECUTION_PROMPT, DEVLOG, CONTINUATION_PROMPT)

### Initiative (Multi-Sprint)

**When:** Platform changes, major overhauls, work spanning multiple sprints.

**Additional Artifacts:**
- `docs/sprints/ROADMAP.md` — Multi-sprint master plan
- `docs/sprints/CONTINUATION_PROMPT.md` — Initiative-level session handoff

---

## Attention Anchoring Protocol

**The Problem:** After 50+ tool calls, original goals drift out of attention. Context windows fill with implementation details, and the agent forgets what success looks like.

**The Solution:** Explicit re-read checkpoints that keep goals in the attention window.

### Mandatory Re-Read Points

| Trigger | Action |
|---------|--------|
| Before any phase transition | Re-read SPEC.md (Live Status + Goals) |
| Before major implementation decision | Re-read SPEC.md (Acceptance Criteria) |
| After every 10 tool calls | Re-read SPEC.md (Live Status) |
| When feeling "lost" or uncertain | Re-read SPEC.md + last 3 DEVLOG entries |
| Before committing | Re-read SPEC.md (Acceptance Criteria) |

### Implementation

**For Claude Desktop/Web:**
```markdown
ATTENTION ANCHOR: Before proceeding, I will re-read the Live Status and Goals.

[Re-reads SPEC.md]

Current phase: {X}
Goal: {Y}
Next action: {Z}

Proceeding with: {description}
```

**For Claude Code CLI:**
```bash
# Built into execution prompts
cat docs/sprints/{sprint}/SPEC.md | head -30  # Live Status + Goals
```

### The Attention Anchor Block

Add this to every SPEC.md:

```markdown
## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** {One sentence}
- **Success looks like:** {Primary acceptance criterion}
- **We are NOT:** {Primary non-goal}
- **Current phase:** {Phase name}
- **Next action:** {Specific next step}
```

---

## Live Status Block

Every SPEC.md (Feature tier and above) MUST include a Live Status block at the top.

### Purpose

Provides instant orientation for:
- Fresh context windows resuming work
- Mid-session attention anchoring
- Progress tracking
- Blocker visibility

### Template

```markdown
## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | {Phase 0-8 or custom} |
| **Status** | 🟡 In Progress / ✅ Complete / 🔴 Blocked / ⏸️ Paused |
| **Blocking Issues** | {None or description} |
| **Last Updated** | {ISO 8601 timestamp} |
| **Next Action** | {Specific, actionable next step} |
| **Attention Anchor** | {Re-read before proceeding} |
```

### Update Requirements

Update Live Status:
- At every phase transition
- When blockers are identified or resolved
- Before ending any session
- After every epic completion (Sprint tier)

---

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

### 3. Grove Architecture Rules

**CRITICAL:** When working on Grove codebase, enforce these rules:

| Rule | Violation | Correct Approach |
|------|-----------|------------------|
| No new handlers | Adding `handleFoo()` callback | Declarative config triggers action |
| No hardcoded behavior | `if (lens === 'engineer')` | Config defines lens-specific behavior |
| Behavior tests | Testing `toHaveClass('translate-x-0')` | Testing `toBeVisible()` |
| State machines | Imperative state updates | XState declarative transitions |

---

## Domain-Specific Contracts

Some development domains have additional binding requirements beyond the base Foundation Loop methodology.

### When Domain Contracts Apply

Before starting any sprint, check if a domain contract applies:

| Branch/Domain | Contract Document | Additional Requirements |
|---------------|-------------------|------------------------|
| `bedrock` | `BEDROCK_SPRINT_CONTRACT.md` | Console pattern, Copilot mandate, GroveObject compliance |
| `network` | (future) | Distributed systems constraints |
| `agents` | (future) | Agent architecture constraints |

### Contract Hierarchy

```
Foundation Loop (base methodology)
       ↓
Domain Contract (additional constraints)
       ↓
Sprint Artifacts (must satisfy both)
```

---

## Phase 0: Pattern Check (MANDATORY — Sprint Tier+)

**This phase gates all other work. Do not proceed to Phase 1 without completing it.**

### Step 0: Check for Domain Contract

```bash
# Check current branch
git branch --show-current

# If bedrock → BEDROCK_SPRINT_CONTRACT.md applies
# If network → NETWORK_CONTRACT.md applies (future)
# If main/other → No additional contract
```

### Step 1: Read PROJECT_PATTERNS.md

```bash
cat PROJECT_PATTERNS.md
```

### Step 2: Map Requirements to Existing Patterns

| Requirement | Existing Pattern? | Extension Approach |
|-------------|-------------------|-------------------|
| [Describe need] | [Pattern name or "None"] | [How to extend, or why new] |

### Step 3: Check for Warning Signs

If your plan involves ANY of these, STOP and reconsider:

- ❌ Creating a new React Context or Provider
- ❌ Creating a new JSON config file system
- ❌ Creating a new `use*` hook that duplicates existing data loading
- ❌ Writing `if (type === 'foo')` conditionals for domain logic
- ❌ Building infrastructure parallel to something that exists

### Step 4: Document in SPEC.md

```markdown
## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| ... | ... | ... |

## New Patterns Proposed

None required. All needs met by extending existing patterns.

*— OR —*

### Proposed: [New Pattern Name]

**Why existing patterns are insufficient:** [Explanation]
**Approval required before proceeding.**
```

---

## Phase 0.5: Canonical Source Audit (MANDATORY — Sprint Tier+)

**This phase catches duplication before it starts.**

### The Principle

> **A feature without a canonical home is a weed. It will spread.**

### The Audit Process

```markdown
## Canonical Source Audit

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| [What we need] | [Where it lives or "None"] | [Existing duplication?] | [PORT/EXTEND/CREATE] |
```

### Decision Framework

| Situation | Action |
|-----------|--------|
| Canonical exists, we're duplicating | **PORT** — Delete duplicate, invoke canonical |
| Canonical exists, needs variant | **EXTEND** — Add variant prop to canonical |
| No canonical exists | **CREATE** — Build it right, in the right place |

---

## Sprint Artifact Location

**CRITICAL**: All Foundation Loop artifacts MUST be written directly to the project repository.

### Directory Structure

```
{project-root}/docs/sprints/
├── ROADMAP.md                    ← Multi-sprint master plan (Initiative tier)
├── CONTINUATION_PROMPT.md        ← Initiative-level session handoff
└── {sprint-name}/
    ├── INDEX.md                  ← Sprint navigation
    ├── REPO_AUDIT.md
    ├── SPEC.md                   ← INCLUDES Live Status + Attention Anchor
    ├── ARCHITECTURE.md
    ├── MIGRATION_MAP.md
    ├── DECISIONS.md
    ├── SPRINTS.md
    ├── EXECUTION_PROMPT.md
    ├── DEVLOG.md
    └── CONTINUATION_PROMPT.md    ← Sprint-level handoff
```

---

## The 9 Artifacts (Sprint Tier)

| Artifact | Purpose | Attention Anchor Role |
|----------|---------|----------------------|
| `REPO_AUDIT.md` | Current state analysis | Context grounding |
| `SPEC.md` | Goals, non-goals, acceptance criteria | **Primary anchor — re-read frequently** |
| `ARCHITECTURE.md` | Target state, schemas, data flows | Design reference |
| `MIGRATION_MAP.md` | File-by-file change plan | Execution tracking |
| `DECISIONS.md` | ADRs explaining "why" | Decision archaeology |
| `SPRINTS.md` | Epic/story breakdown with tests | Progress tracking |
| `EXECUTION_PROMPT.md` | Self-contained handoff | Fresh context entry point |
| `DEVLOG.md` | Execution tracking | **Secondary anchor — recent history** |
| `CONTINUATION_PROMPT.md` | Session handoff | Cross-session continuity |

---

## Sprint Phases (Full Loop)

### Phase 0: Pattern Check (MANDATORY)
Read PROJECT_PATTERNS.md, map requirements to existing patterns.

→ Documented in: `SPEC.md` (Patterns Extended section)

### Phase 0.5: Canonical Source Audit (MANDATORY)
Identify canonical homes for all capabilities, flag duplication.

→ Documented in: `SPEC.md` (Canonical Source Audit section)

### Phase 1: Repository Audit
Analyze current state: files, architecture, patterns, technical debt.

→ Output: `REPO_AUDIT.md`

### Phase 2: Specification
Define goals, non-goals, acceptance criteria.

**MUST INCLUDE:** Live Status block, Attention Anchor block.

→ Output: `SPEC.md`

### Phase 3: Architecture
Design target state: data structures, file organization, API contracts.

→ Output: `ARCHITECTURE.md`

### Phase 4: Migration Planning
Plan path: files to create/modify/delete, execution order, rollback plan.

→ Output: `MIGRATION_MAP.md`

### Phase 5: Decisions
Document choices using ADR format with rejected alternatives.

→ Output: `DECISIONS.md`

### Phase 6: Story Breakdown
Create executable plan: epics, stories, commit sequence, build gates.

**MANDATORY:** Every epic MUST include test tasks and attention anchor checkpoints.

→ Output: `SPRINTS.md`

### Phase 7: Execution Prompt
Create self-contained handoff with context, code samples, verification commands.

**MUST INCLUDE:** Attention anchoring instructions for the executing agent.

→ Output: `EXECUTION_PROMPT.md`

### Phase 8: Execution
Hand off `EXECUTION_PROMPT.md`, track progress in `DEVLOG.md`.

**Attention Protocol:** Re-read SPEC.md Live Status after every epic.

---

## Execution Prompt Requirements (v2)

Every `EXECUTION_PROMPT.md` MUST include:

### Attention Anchoring Section

```markdown
## Attention Anchoring Protocol

Before any major decision, re-read:
1. SPEC.md Live Status block
2. SPEC.md Attention Anchor block

After every 10 tool calls:
- Check: Am I still pursuing the stated goal?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

Before committing:
- Verify: Does this change satisfy Acceptance Criteria?
```

### Pre-Execution Verification

```bash
# 1. Verify baselines exist
ls tests/e2e/*-baseline.spec.ts-snapshots/

# 2. Run regression tests (should pass before starting)
npx playwright test tests/e2e/*-baseline.spec.ts
```

### Post-Epic Verification

```bash
# After each epic:
# 1. Run tests
npm test && npx playwright test

# 2. Update DEVLOG
echo "Epic N complete. Tests: PASS/FAIL" >> docs/sprints/{sprint}/DEVLOG.md

# 3. Update Live Status in SPEC.md
# Current Phase: {next phase}
# Last Updated: {timestamp}

# 4. ATTENTION ANCHOR: Re-read SPEC.md before next epic
```

---

## Testing Integration

### Every SPRINTS.md Must Include

```markdown
## Epic N: {Feature}

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows correct phase
- [ ] Previous epic tests pass
- [ ] Goal alignment confirmed

### Story N.1: Implement {feature}
**Task:** ...
**Tests:**
- Unit: `tests/unit/{feature}.test.ts`
- E2E: Update `tests/e2e/{flow}.spec.ts`

### Build Gate
```bash
npm test && npx playwright test
```
```

### Test Philosophy: Behavior Over Implementation

**WRONG:**
```typescript
expect(element).toHaveClass('translate-x-0');
```

**RIGHT:**
```typescript
await expect(terminal).toBeVisible();
```

---

## CONTINUATION_PROMPT for Session Handoff

**When to Create:**
- After planning phase (once artifacts exist)
- Before context window fills (proactive)
- At natural breakpoints (between epics)
- Before ending any session

**Template:**

```markdown
# Continuation Prompt: {Sprint Name}

## Instant Orientation

**Project:** {absolute path}
**Sprint:** {name}
**Current Phase:** {phase}
**Status:** {emoji + description}
**Next Action:** {specific next step}

## Context Reconstruction

### Read These First (In Order)
1. `SPEC.md` — Live Status + Attention Anchor + Goals
2. `DEVLOG.md` — Last 3 entries
3. `SPRINTS.md` — Current epic

### Key Decisions Made
- {Decision 1}
- {Decision 2}

### What's Done
- [x] {Completed item 1}
- [x] {Completed item 2}

### What's Pending
- [ ] {Pending item 1}
- [ ] {Pending item 2}

## Resume Instructions

1. Read files listed above
2. Run: `npm test` to verify current state
3. Continue with: {next action}

## Attention Anchor

**We are building:** {one sentence}
**Success looks like:** {primary criterion}
**We are NOT:** {primary non-goal}
```

---

## DEX Compliance Checklist

Before finalizing any sprint, verify:

- [ ] **Tier Selection:** Appropriate tier chosen for task complexity
- [ ] **Pattern Check (Phase 0):** PROJECT_PATTERNS.md read, extensions documented
- [ ] **Canonical Source Audit (Phase 0.5):** No component duplication
- [ ] **Live Status:** SPEC.md includes Live Status block
- [ ] **Attention Anchor:** SPEC.md includes Attention Anchor block
- [ ] **Domain Contract:** All contract requirements satisfied (if applicable)
- [ ] **Declarative Sovereignty:** Domain behavior in config, not hardcoded
- [ ] **Capability Agnosticism:** Works regardless of model capability
- [ ] **Provenance:** All artifacts include attribution
- [ ] **Testing as Process:** Tests run automatically, report to Health
- [ ] **Behavior Focus:** Tests verify user-visible outcomes

**The Test:** Can a non-technical domain expert alter behavior by editing a schema file, without recompiling? If no, the feature is incomplete.

---

## Quick Reference

### Tier Selection
- **< 1 hour:** Quick Fix (DEVLOG only)
- **1-4 hours:** Feature (SPEC + DEVLOG)
- **1-3 days:** Sprint (Full 9 artifacts)
- **Multi-sprint:** Initiative (Full + ROADMAP)

### Attention Anchoring
- Re-read SPEC.md before phase transitions
- Re-read after every 10 tool calls
- Re-read before committing
- Re-read when uncertain

### Sprint Naming
`{domain}-{feature}-v{version}` (e.g., `health-dashboard-v1`)

### Commit Format
`{type}: {description}` where type is feat|fix|refactor|test|docs|chore|ci

### Build Gates
```bash
npm run build && npm test && npx playwright test
```

---

## Key Principles

1. **Right-Size the Process** — Match artifact requirements to task complexity
2. **Attention Anchoring** — Re-read goals frequently to prevent drift
3. **Live Status** — Every SPEC has instant orientation block
4. **Pattern Check First** — Extend existing patterns, don't duplicate
5. **Canonical Source Audit** — Invoke, don't recreate
6. **Trellis First** — Structure precedes growth
7. **Declarative Sovereignty** — Domain logic in config, engine logic in code
8. **Provenance as Infrastructure** — A fact without a root is a weed
9. **Testing as Process** — Tests run continuously
10. **Sprints are Replayable** — EXECUTION_PROMPT is self-contained
11. **Session Continuity** — CONTINUATION_PROMPT enables fresh context windows

---

## Terminology

| Term | Definition |
|------|------------|
| **Attention Anchoring** | Protocol for re-reading goals to prevent drift across tool calls |
| **Live Status** | Block at top of SPEC.md providing instant orientation |
| **Tier** | Complexity classification determining required artifacts |
| **Trellis** | Structural framework supporting the DEX stack |
| **DEX** | Declarative Exploration — separating intent from inference |
| **Sprout** | Atomic unit of captured, validated insight |
| **Grove** | Accumulated, refined knowledge base |
| **Vine** | Execution capability (LLM, RAG) — interchangeable |
| **Gardener** | Human applying judgment to AI-generated possibilities |
| **Continuation Prompt** | Artifact enabling fresh sessions to resume with full context |
| **Pattern Check** | Mandatory phase verifying work extends existing patterns |
| **Canonical Source Audit** | Mandatory phase preventing component duplication |
