# Bedrock Sprint Contract

**Version:** 1.3
**Status:** BINDING FOR ALL BEDROCK DEVELOPMENT
**Amended:** January 13, 2026 (Added agent coordination protocol)  
**Effective:** December 30, 2025  
**Branch:** `bedrock`

---

## Preamble

This contract governs all development work on the `bedrock` branch. It operates as a **binding overlay** to the Foundation Loop methodology. Every Bedrock sprint must satisfy both:

1. The Foundation Loop requirements (Phases 0-8)
2. This Bedrock Sprint Contract (additional constraints)

**Violation of this contract blocks merge to `bedrock` branch.**

---

## Article I: Constitutional Compliance

### Section 1.1: Document Hierarchy

Every Bedrock sprint acknowledges this document hierarchy:

| Document | Authority | Must Reference |
|----------|-----------|----------------|
| `The_Trellis_Architecture__First_Order_Directives.md` | Constitutional | Yes, in every SPEC.md |
| `Bedrock_Architecture_Specification.md` | Architectural | Yes, for pattern decisions |
| `Trellis_Architecture_Bedrock_Addendum.md` | Implementation | Yes, for compliance tests |
| `copilot-configurator-vision.md` | Feature spec | When implementing Copilot |
| `grove-object.ts` | Data model | When creating/modifying objects |

### Section 1.2: DEX Compliance Tests

Every feature in a Bedrock sprint MUST pass all four DEX tests. Document results in SPEC.md:

```markdown
## DEX Compliance Matrix

### Feature: [Feature Name]

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | [ ] | Can non-technical user modify via config? How? |
| Capability Agnosticism | [ ] | What happens if model hallucinates? |
| Provenance as Infrastructure | [ ] | Can every fact trace to source? |
| Organic Scalability | [ ] | Can new types use this without code changes? |

**Blocking issues:** [List any failures that must be resolved]
```

**A feature that fails any DEX test cannot ship.**

---

## Article II: The Canonical Console Pattern

### Section 2.1: Structure Mandate

Every Bedrock console MUST implement this exact structure:

```
┌──────────────────────────────────────────────────────────────┐
│ Console Header (title, description, actions)                 │
├──────────────────────────────────────────────────────────────┤
│ Metrics Row (4-6 key stats, always visible)                 │
├────────────┬─────────────────────────┬──────────────────────┤
│ Navigation │ Content Area            │ Inspector + Copilot  │
│ (240px)    │ (flex)                  │ (360px)              │
└────────────┴─────────────────────────┴──────────────────────┘
```

**No exceptions.** If a console cannot fit this pattern, escalate to architectural review before proceeding.

### Section 2.2: Required Components

Every console MUST use these shared components:

| Component | Location | Required For |
|-----------|----------|--------------|
| `BedrockLayout` | `src/bedrock/primitives/` | Console shell |
| `BedrockNav` | `src/bedrock/primitives/` | Navigation column |
| `BedrockInspector` | `src/bedrock/primitives/` | Inspector column |
| `BedrockCopilot` | `src/bedrock/primitives/` | Copilot panel |
| `StatCard` | `src/bedrock/components/` | Metrics display |
| `ObjectList` | `src/bedrock/components/` | Collection navigation |
| `ObjectGrid` | `src/bedrock/components/` | Content display |

**Creating new structural components requires architectural review.**

### Section 2.3: Console Checklist

Every console implementation MUST complete this checklist in SPEC.md:

```markdown
## Console Implementation Checklist

- [ ] Uses `BedrockLayout` as shell
- [ ] Header displays: title, description, primary action
- [ ] Metrics row shows 4-6 relevant stats
- [ ] Navigation column uses `ObjectList` or equivalent
- [ ] Content area uses `ObjectGrid` or appropriate view
- [ ] Inspector uses `BedrockInspector` shell
- [ ] Copilot panel integrated with console context
- [ ] Navigation declaratively configured in `navigation.ts`
- [ ] All object types use `GroveObject` schema
```

---

## Article III: Copilot Integration

### Section 3.1: Copilot Mandate

Every Bedrock console MUST include a Copilot. No console ships without AI assistance.

### Section 3.2: Context Protocol

Every Copilot implementation MUST provide context following this interface:

```typescript
interface BedrockCopilotContext {
  // Identity
  consoleId: string;
  
  // Current selection
  selectedObject?: GroveObject;
  selectedObjectType?: GroveObjectType;
  
  // View state
  filters: FilterState;
  sortOrder: SortState;
  
  // Schema for validation
  schema?: ObjectSchema;
  
  // Related objects for reference resolution
  relatedObjects: Record<GroveObjectType, GroveObject[]>;
}
```

### Section 3.3: Required Copilot Capabilities

Every console Copilot MUST support these baseline capabilities:

| Capability | Description | Implementation |
|------------|-------------|----------------|
| Schema awareness | Knows valid fields for current object | Load schema on selection |
| Patch generation | Produces JSON patches from natural language | Structured output prompt |
| Validation | Rejects invalid patches before display | Schema validation layer |
| Diff preview | Shows changes before applying | Standard diff component |
| Model indicator | Shows which model is active | UI indicator |

### Section 3.4: Console-Specific Actions

Each console MUST define its specific Copilot actions in SPEC.md:

```markdown
## Copilot Actions

| Action | Trigger | Output | Model Preference |
|--------|---------|--------|------------------|
| [Action name] | [User intent] | [What Copilot produces] | [local/hybrid/cloud] |
```

---

## Article IV: Object Model Compliance

### Section 4.1: GroveObject Mandate

Every entity in Bedrock MUST use the `GroveObject` schema:

```typescript
interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;  // id, type, title, timestamps, provenance
  payload: T;             // Type-specific data
}
```

**No raw objects.** If data doesn't fit GroveObject, escalate to architectural review.

### Section 4.2: Object Model Boundary

Respect the object model boundary:

| Category | Object Types | Console Group |
|----------|--------------|---------------|
| Sprouts (Write Path) | Sprout, SproutClaim, SproutProposal | Knowledge Garden |
| DEX Objects (Read Path) | Hub, Journey, Node, Lens, Moment, Persona | Experience Design |
| System Objects | FeatureFlag, SystemVoice, AudioTrack, HealthCheck | System Configuration |

**Sprouts are the atomic unit of knowledge change.** DEX objects organize how Sprouts surface. Do not conflate.

### Section 4.3: Type Registration

Every new object type MUST be:

1. Added to `GroveObjectType` union in `grove-object.ts`
2. Documented in `BEDROCK_OBJECT_CATALOG.md`
3. Given a schema definition
4. Given default Copilot actions

### Section 4.4: Events vs. Objects

**Events (`GroveEvent`) are NOT GroveObjects.** This is an intentional architectural distinction:

| Concept | Base Type | Purpose | Lifecycle |
|---------|-----------|---------|-----------|
| **GroveObject** | `GroveObjectMeta` | Persistent entities | Long-lived, mutable |
| **GroveEvent** | `MetricAttribution` | Temporal occurrences | Immutable, append-only |

Events record **what happened**; Objects represent **what exists**. Events use `MetricAttribution` as their base type (fieldId + timestamp) to ensure provenance. GroveObjects may be **derived from** events via projections, but events themselves are not subject to Section 4.1 requirements.

**Event infrastructure** resides in `src/core/events/` and follows the event sourcing pattern established in `src/core/schema/telemetry.ts`.

---

## Article V: Strangler Fig Awareness

### Section 5.1: No Legacy Coupling

Bedrock code MUST NOT:

- Import from `src/foundation/` (legacy Foundation console)
- Share state with legacy components
- Assume legacy behavior or data structures
- Use legacy component patterns

**Exception:** Core infrastructure in `src/core/` is **shared by design**. Both Bedrock and legacy routes may import from:
- `src/core/events/` — Event sourcing infrastructure
- `src/core/schema/` — Shared type definitions (telemetry, etc.)
- `src/core/types/` — Common TypeScript interfaces

This enables strangler fig migration where new infrastructure is built once and consumed by both systems until legacy is fully deprecated.

**Bedrock is a clean-room implementation** — but it builds on shared core infrastructure.

### Section 5.2: Feature Parity Tracking

Every sprint MUST update the feature parity checklist:

```markdown
## Feature Parity Status

| Feature | Legacy Location | Bedrock Status | Parity? |
|---------|-----------------|----------------|---------|
| Sprout moderation | SproutQueue.tsx | [status] | [ ] |
| Journey editing | NarrativeArchitect.tsx | [status] | [ ] |
| ... | ... | ... | ... |
```

### Section 5.3: Migration Path

When implementing a feature that exists in legacy:

1. **Audit legacy** — Document what exists, what works, what's broken
2. **Design fresh** — Apply Bedrock patterns, ignore legacy implementation
3. **Verify parity** — Ensure all legacy capabilities are covered
4. **Document differences** — Note intentional deviations from legacy

---

## Article VI: Sprint Artifacts

### Section 6.1: Required Sections

Every Bedrock sprint SPEC.md MUST include:

```markdown
# Sprint: [name]

## Constitutional Reference
- [ ] Read: The_Trellis_Architecture__First_Order_Directives.md
- [ ] Read: Bedrock_Architecture_Specification.md
- [ ] Read: Relevant object schemas

## DEX Compliance Matrix
[Per Section 1.2]

## Console Implementation Checklist
[Per Section 2.3]

## Copilot Actions
[Per Section 3.4]

## Object Types Used
[List all GroveObject types touched]

## Feature Parity Status
[Per Section 5.2]

## Patterns Extended
[Standard Foundation Loop requirement]
```

### Section 6.2: EXECUTION_PROMPT Additions

Every Bedrock EXECUTION_PROMPT.md MUST include:

```markdown
## Bedrock Verification

Before starting:
- [ ] On `bedrock` branch
- [ ] No imports from `src/foundation/`
- [ ] BedrockLayout available

After each epic:
- [ ] Console pattern checklist passes
- [ ] Copilot receives correct context
- [ ] GroveObject schema used for all entities
- [ ] DEX compliance tests documented

Final verification:
- [ ] Feature parity checklist updated
- [ ] No legacy coupling introduced
- [ ] All DEX tests pass
```

### Section 6.3: Core Infrastructure Sprints

Sprints creating **shared infrastructure** in `src/core/` have modified requirements:

**Required sections:**
- Constitutional Reference (Article I)
- DEX Compliance Matrix (Article I Section 1.2)
- Pattern Check (Foundation Loop Phase 0)
- No Legacy Coupling verification (Article V Section 5.1)
- Standard Foundation Loop artifacts

**Omitted sections** (console-specific):
- Console Implementation Checklist (Section 2.3)
- Copilot Actions table (Section 3.4)
- Feature Parity Status (Section 5.2) — unless replacing legacy infrastructure

**Object Model clarification:**
- Core infrastructure may create **event types** (`GroveEvent`) which are NOT GroveObjects (per Section 4.4)
- Event types use `MetricAttribution` as base, not `GroveObjectMeta`
- Projection functions derive GroveObject-compatible state from events

**File locations for core infrastructure:**
```
src/core/
├── events/       # Event sourcing (GroveEvent, projections)
├── schema/       # Type definitions (telemetry, validation)
├── types/        # Shared TypeScript interfaces
└── utils/        # Shared utilities
```

### Section 6.4: Live Status Updates

Every agent executing a sprint MUST maintain status updates in the shared status file.

**File Location:** `~/.claude/notes/sprint-status-live.md`

**Protocol:**
1. Append STARTED entry when beginning sprint work
2. Append IN_PROGRESS entry at each phase completion
3. Append COMPLETE entry with test results when done
4. Append BLOCKED entry if unable to proceed

**Entry Format:**
```markdown
---
## {ISO Timestamp} | {Sprint Name} | {Phase}
**Agent:** {role} / {branch or session-id}
**Status:** STARTED | IN_PROGRESS | COMPLETE | BLOCKED
**Summary:** {1-2 sentences describing work done}
**Files:** {key files changed, comma-separated}
**Tests:** {pass/fail count or "N/A"}
**Unblocks:** {what this completion enables}
**Next:** {recommended next action}
---
```

**Benefits:**
- Zero-friction agent coordination (agents write, Sprintmaster reads)
- Audit trail (append-only preserves history)
- Parallel sprint coordination (multiple agents, one log)
- Resumable sessions (new agents read history for context)

---

## Article VII: Enforcement

### Section 7.1: Pre-Merge Checklist

Before any PR merges to `bedrock`:

```markdown
## Bedrock Merge Checklist

- [ ] SPEC.md includes all required sections (Article VI)
- [ ] DEX compliance matrix shows all passes (Article I)
- [ ] Console pattern checklist complete (Article II)
- [ ] Copilot integrated with context (Article III)
- [ ] All objects use GroveObject schema (Article IV)
- [ ] No imports from src/foundation/ (Article V)
- [ ] Feature parity status updated (Article V)
- [ ] Tests pass (Foundation Loop requirement)
- [ ] Visual baselines updated if applicable
```

### Section 7.2: Architectural Review Triggers

These situations require architectural review before proceeding:

1. Console doesn't fit canonical pattern
2. New structural component needed
3. Object doesn't fit GroveObject schema
4. DEX test fails and workaround proposed
5. Legacy coupling seems necessary
6. New object type proposed

### Section 7.3: Contract Amendments

This contract may be amended via:

1. Proposal documented in sprint SPEC.md
2. Architectural review approval
3. Contract version increment
4. All team members notified

---

## Article VIII: Quick Reference

### The Bedrock Mantra

> Features are proven. Patterns are established. Now we produce them correctly.

### The Four Questions

Before shipping any Bedrock feature:

1. **Does it use BedrockLayout?** (Console pattern — N/A for core infrastructure)
2. **Does it have a Copilot?** (AI assistance — N/A for core infrastructure)
3. **Does it use GroveObject?** (Data model — events use MetricAttribution instead)
4. **Does it pass DEX tests?** (Constitutional compliance — **always required**)

### The Build Sequence

```
Sprint 0: Infrastructure (BedrockLayout, Nav, Inspector, Copilot)
Sprint 1: Sprout Queue (first complete console, proves pattern)
Sprint 2+: Feature conveyor (one console per sprint)
```

### File Locations

```
src/bedrock/                    # Bedrock consoles and components
├── primitives/                 # BedrockLayout, Nav, Inspector, Copilot
├── components/                 # Shared components (StatCard, ObjectList, etc.)
├── consoles/                   # Individual console implementations
├── config/                     # Declarative configuration (navigation.ts, etc.)
├── copilot/                    # Copilot context and actions
└── types/                      # TypeScript interfaces

src/core/                       # Shared infrastructure (both bedrock + legacy)
├── events/                     # Event sourcing (GroveEvent, projections)
│   ├── types.ts                # Event type definitions
│   ├── schema.ts               # Zod validation
│   ├── projections/            # State derivation from events
│   └── store.ts                # Event log management
├── schema/                     # Type definitions (telemetry.ts, etc.)
└── types/                      # Shared TypeScript interfaces
```

---

## Article IX: Visual Verification Requirements

**Added:** January 12, 2026 (Post experience-console-cleanup-v1 retrospective)

### Section 9.1: Visual Verification Mandate

Every sprint that modifies UI MUST include visual verification before completion. **Code that compiles is not proof that features work.** Screenshots are required evidence.

**Rationale:** The `experience-console-cleanup-v1` sprint exposed a pattern where code "compiles and passes build" but UI features are non-functional. This wastes downstream sprint time debugging "working" code.

### Section 9.2: Required Artifacts

Every UI sprint MUST produce:

| Artifact | Location | Purpose |
|----------|----------|---------|
| Screenshots | `docs/sprints/{sprint-name}/screenshots/` | Visual proof of ACs |
| REVIEW.html | `docs/sprints/{sprint-name}/REVIEW.html` | AC-to-evidence mapping |
| Playwright tests | `tests/visual-qa/{feature}.spec.ts` | Automated screenshot capture |

### Section 9.3: Minimum Screenshot Coverage

For any UI sprint, capture at minimum:

1. **Default state** — Feature loads correctly
2. **Each acceptance criterion** — Visual proof it works
3. **Interactive elements** — Dropdowns open, buttons respond
4. **Empty/error states** — Graceful handling
5. **Inspector/editor views** — Forms render correctly

### Section 9.4: Playwright Visual QA Pattern

```typescript
// tests/visual-qa/{feature}.spec.ts
import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'docs/sprints/{sprint-name}/screenshots';

test.describe('{Feature} Visual QA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/{route}');
    await page.waitForLoadState('networkidle');
  });

  test('01 - {AC description}', async ({ page }) => {
    // Setup state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-{description}.png`,
      fullPage: true,
    });
    // Assert expected elements
  });
});
```

### Section 9.5: REVIEW.html Requirements

Every sprint REVIEW.html MUST include:

```html
<!-- Required sections -->
<h2>Acceptance Criteria Verification</h2>
<!-- Table mapping each AC to PASS/FAIL with screenshot evidence -->

<h2>Visual Evidence</h2>
<!-- All screenshots with captions -->

<h2>Build Verification</h2>
<!-- npm run build, TypeScript errors, console errors -->

<h2>Sign-off</h2>
<!-- Verified by, timestamp -->
```

### Section 9.6: Completion Gate

A sprint is **NOT COMPLETE** until:

- [ ] All screenshots captured in `screenshots/` directory
- [ ] REVIEW.html shows each AC mapped to evidence
- [ ] All AC status badges are PASS (not PENDING)
- [ ] Playwright visual QA tests pass
- [ ] `npm run build` passes
- [ ] Sign-off recorded with timestamp

### Section 9.7: Prohibited Practices

The following are **explicitly prohibited**:

1. **Code-only completion** — Marking sprint complete based solely on `npm run build` passing
2. **Deferred verification** — "We'll test it manually later"
3. **Assumed functionality** — "It compiles so it works"
4. **Missing REVIEW.html** — Sprint artifacts incomplete without visual proof
5. **PENDING status at completion** — All ACs must be verified PASS or FAIL

### Section 9.8: Non-UI Sprints

Sprints that don't modify UI (e.g., core infrastructure, schemas, services) may omit visual verification if:

1. Sprint SPEC.md explicitly states "Non-UI Sprint"
2. No React components created or modified
3. No user-facing behavior changes

Such sprints still require:
- `npm run build` passing
- Unit test coverage for new code
- Console logging verification where applicable

---

## Article X: Agent Roles

**Added:** January 13, 2026

### Section 10.1: Role Declaration

Every agent session MUST declare its role at conversation start:

| Property | Value |
|----------|-------|
| Role | Sprintmaster / Developer / QA Reviewer |
| Sprint | {sprint-name} or "Pipeline Coordination" |
| Mode | plan / execute / review |

### Section 10.2: Role Definitions

**Sprintmaster** (Plan Mode)

| Responsibility | Description |
|----------------|-------------|
| Pipeline coordination | Track sprints, clear gates, spot parallelism opportunities |
| Notion sync | Update databases to match actual sprint state |
| QA lead | Review REVIEW.html, verify screenshots against ACs |
| Code review | Assess code against spec, write bug reports |
| Contract amendments | Update this contract when patterns evolve |

**PROHIBITED:** Code changes, bug fixes, implementation work, starting new development

**Developer** (Execute Mode)

| Responsibility | Description |
|----------------|-------------|
| Sprint execution | Follow EXECUTION_PROMPT phases |
| Code changes | Implement features per spec |
| Status updates | Write entries to `sprint-status-live.md` per Section 6.4 |
| Visual verification | Capture screenshots per Article IX |
| REVIEW.html | Complete acceptance criteria evidence |

**PROHIBITED:** Notion updates, starting sprints without gate clearance, architectural decisions without spec

**QA Reviewer** (Review Mode)

| Responsibility | Description |
|----------------|-------------|
| AC verification | Check REVIEW.html against spec |
| Screenshot audit | Verify visual evidence completeness |
| Bug reports | Document issues with reproduction steps |
| Test coverage | Verify appropriate test coverage |

**PROHIBITED:** Code fixes, Notion updates, architectural decisions

### Section 10.3: Role Boundaries

Agents MUST NOT:
- Perform actions outside their declared role
- Switch roles mid-session without explicit user handoff
- Override another agent's work without coordination

### Section 10.4: Coordination Protocol

The standard coordination flow:

1. **Developer** completes work → writes COMPLETE status to `sprint-status-live.md`
2. **Sprintmaster** reads status → triggers QA review, updates Notion
3. **QA Reviewer** verifies → writes bug reports if needed
4. **Sprintmaster** clears gate → updates Notion, assigns next sprint
5. **Developer** receives next sprint assignment with gate clearance

### Section 10.5: Role Activation

Agents are activated with explicit prompts:

**Sprintmaster:**
```
You are acting as SPRINTMASTER for the Grove Foundation.
You operate in PLAN MODE - read-only except notes/plans.
Read sprint status: ~/.claude/notes/sprint-status-live.md
Reference: .agent/roles/sprintmaster.md
```

**Developer:**
```
You are acting as DEVELOPER for sprint: {sprint-name}.
Execute per: docs/sprints/{name}/EXECUTION_PROMPT.md
Write status to: ~/.claude/notes/sprint-status-live.md
Reference: .agent/roles/developer.md
```

**QA Reviewer:**
```
You are acting as QA REVIEWER for sprint: {sprint-name}.
Review: docs/sprints/{name}/REVIEW.html against SPEC.md
Reference: .agent/roles/qa-reviewer.md
```

---

## Signatures

By commencing work on the `bedrock` branch, contributors agree to this contract.

**Effective Date:** December 30, 2025
**Version:** 1.2

---

## Changelog

### v1.3 (January 13, 2026)

**Section 6.4: Live Status Updates (NEW)**

1. **Status Protocol:** Agents must maintain append-only status file
2. **Entry Format:** Standardized markdown template for status entries
3. **File Location:** `~/.claude/notes/sprint-status-live.md`

**Article X: Agent Roles (NEW)**

1. **Section 10.1:** Role Declaration — agents must declare role at session start
2. **Section 10.2:** Role Definitions — Sprintmaster, Developer, QA Reviewer with responsibilities and prohibitions
3. **Section 10.3:** Role Boundaries — agents must not exceed their declared role
4. **Section 10.4:** Coordination Protocol — standard flow for multi-agent coordination
5. **Section 10.5:** Role Activation — explicit prompts for activating each role

**Rationale:** Multiple agents working in parallel on Grove Foundation sprints need a mechanized coordination system. The status protocol enables zero-friction updates between agents. Role definitions prevent scope creep and clarify responsibilities. Inspired by Navigator plugin concepts but customized for sprint-aligned workflow.

---

### v1.2 (January 12, 2026)

**Article IX: Visual Verification Requirements (NEW)**

1. **Section 9.1:** Visual Verification Mandate
   - Code that compiles is not proof features work
   - Screenshots required as evidence for all UI sprints

2. **Section 9.2:** Required Artifacts
   - Screenshots directory in sprint folder
   - REVIEW.html mapping ACs to evidence
   - Playwright visual QA tests

3. **Section 9.3-9.4:** Screenshot Coverage & Playwright Pattern
   - Minimum coverage requirements
   - Standard test file structure

4. **Section 9.5-9.6:** REVIEW.html Requirements & Completion Gate
   - Required sections in review document
   - Checklist that must pass before sprint completion

5. **Section 9.7:** Prohibited Practices
   - Explicitly bans code-only completion
   - Bans deferred verification
   - Bans PENDING status at completion

6. **Section 9.8:** Non-UI Sprint Exemption
   - Criteria for when visual verification may be skipped

**Rationale:** The `experience-console-cleanup-v1` sprint delivered code that compiled but had no visible instances in the UI. This wasted time in downstream sprints debugging "working" features. Visual verification prevents this class of bug from shipping.

---

### v1.1 (January 4, 2026)

**Amendments for Core Infrastructure:**

1. **Section 4.4 (NEW):** Events vs. Objects
   - Clarifies that `GroveEvent` types are NOT `GroveObjects`
   - Events use `MetricAttribution` as base type (provenance-first)
   - Objects may be derived from events via projections

2. **Section 5.1 (AMENDED):** No Legacy Coupling
   - Added exception for shared `src/core/` infrastructure
   - Clarifies strangler fig migration pattern

3. **Section 6.3 (NEW):** Core Infrastructure Sprints
   - Modified requirements for `src/core/` sprints
   - Specifies which sections are required vs. omitted
   - Documents valid file locations for shared infrastructure

4. **Article VIII (AMENDED):** Quick Reference
   - Updated "Four Questions" to note console-specific vs. universal requirements
   - Expanded file locations to include `src/core/`

**Rationale:** The `bedrock-event-architecture-v1` sprint exposed a gap: the contract was written for console development but core infrastructure sprints have different requirements. These amendments maintain contract rigor while acknowledging legitimate architectural distinctions between consoles, objects, and events.

---

*This contract ensures Bedrock delivers on the architectural vision. Deviations fragment the reference implementation. When in doubt, escalate to architectural review.*
