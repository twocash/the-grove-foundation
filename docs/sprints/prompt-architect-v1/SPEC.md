# Prompt Architect Infrastructure Execution Contract

**Codename:** `prompt-architect-v1`
**Status:** Execution Contract for Claude Code CLI
**Baseline:** `main` (commit TBD)
**Date:** 2026-01-11

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 6 - Testing |
| **Status** | ⚠️ Partial Pass |
| **Blocking Issues** | Supabase persistence not implemented (TODO Phase 2d in ResearchSproutContext) |
| **Last Updated** | 2026-01-12T05:45:00Z |
| **Next Action** | Document gap, continue UI flow tests |
| **Discovery** | Phases 2-5 infrastructure already exists from sprout-research-v1 |
| **Test Results** | 6a: PARTIAL (UI✅, DB❌), 6b: PASS (dialog shown) |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** The Prompt Architect Infrastructure — research orchestration from `sprout:` command to Research Agent execution
- **Success looks like:** Explorer types `sprout: question`, ResearchSprout created with provenance, Research Agent processes to `ready` status
- **We are NOT:** Building admin UI for config editing, multiple agent types, semantic inference, or real-time streaming
- **Current phase:** Phase 6 - Testing (Phases 2-5 infrastructure already exists!)
- **Critical gap found:** Supabase persistence not implemented - sprouts stored in-memory only
- **Next action:** Document limitation and decide if persistence is in scope for v1

---

## Purpose

Build the research orchestration system that transforms `sprout:` commands into executed research. This infrastructure enables:
1. PromptArchitectConfig loading (grove research DNA)
2. Quality gate enforcement (hypothesis alignment)
3. Inference rule application (auto-populate manifests)
4. ResearchSprout creation with full provenance
5. Research Agent queue processing

**This document is an execution contract, not a spec.**

User stories and acceptance criteria are documented in Notion: [Sprint B User Stories](https://www.notion.so/2e5780a78eef81b189bed412aec3cb3e)

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route (except Foundation consoles)
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route (command detection)
├── src/explore/* (sprout: command handling)
├── src/bedrock/* (config management)
├── src/core/schema/* (PromptArchitectConfig, ResearchSprout)
└── src/services/* (agent implementations)
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| PromptArchitectConfig | Pure config, no code | N/A | Config versioned | Groves independently configurable |
| Quality Gates | Thresholds configurable | Output-based evaluation | Rejections logged | Gates can be added |
| Inference Rules | Rules are config | Works with any model | Rules applied logged | Rules extensible |
| Research Agent | Strategy configurable | Routes to any backend | Full execution log | Queue scales horizontally |

### Route for Testing

**CRITICAL:** Test at `/explore`, NOT at `/` or `/terminal`

```
✅ localhost:3000/explore           ← WHERE sprout: COMMAND WORKS
✅ localhost:3000/bedrock/nursery   ← WHERE SPROUTS SURFACE
❌ localhost:3000/                  ← LEGACY TERMINAL
❌ localhost:3000/terminal          ← LEGACY TERMINAL
```

---

## v1.0 Scope Boundaries (From User Stories)

**In Scope (Must Have):**
- `sprout:` command detection and routing
- PromptArchitectConfig loading
- Quality gate enforcement (hypothesis alignment)
- Basic inference rule application (keyword matching)
- Confirmation dialog (when required)
- ResearchSprout creation with provenance
- Research Agent queue processing
- Results population and status transitions

**Explicitly Deferred:**
- Admin UI for config editing (JSON config only)
- Multiple agent types (evaluator, critic)
- Semantic similarity for inference (keyword/regex only)
- Real-time streaming (polling only)
- Child sprout spawning (simplified: no recursion in v1)

---

## Execution Architecture

### Sub-Phases

```
Phase 0: Pre-work
├── 0a: Verify Supabase tables exist (prompt_architect_configs, research_sprouts)
│   └── ✓ GATE: Tables accessible via client
├── 0b: Verify ResearchSprout schema exists
│   └── ✓ GATE: Schema file exists, types importable
└── 0c: Seed test PromptArchitectConfig
    └── ✓ GATE: Config exists for test grove

Phase 1: Schema & Types
├── 1a: Define/verify PromptArchitectConfig type
│   └── ✓ GATE: Type exports, no build errors
├── 1b: Define InferenceRule, QualityGateConfig types
│   └── ✓ GATE: Types export, no build errors
└── 1c: Define ResearchManifest type
    └── ✓ GATE: Build passes

Phase 2: Config Layer
├── 2a: Create usePromptArchitectConfig hook
│   └── ✓ GATE: Hook returns config for grove
├── 2b: Create quality gate evaluation function
│   └── ✓ GATE: Function returns pass/fail with reason
└── 2c: Create inference rule matcher
    └── ✓ GATE: Function returns matched rules

Phase 3: Sprout Creation
├── 3a: Create sprout: command detector in /explore
│   └── ✓ GATE: Command detected, callback triggered
├── 3b: Create Research Request modal
│   └── ✓ GATE: Modal renders with title/brief fields
├── 3c: Create useCreateSprout mutation
│   └── ✓ GATE: Function creates ResearchSprout in DB
└── 3d: Wire modal submit to sprout creation
    └── ✓ GATE: Type sprout:, submit modal, sprout appears in Nursery

Phase 4: Confirmation Flow
├── 4a: Create confirmation dialog component
│   └── ✓ GATE: Dialog renders with inferred manifest
├── 4b: Implement confirmationMode logic
│   └── ✓ GATE: 'always' shows dialog, 'never' skips, 'ambiguous' checks confidence
└── 4c: Wire confirmation to sprout creation
    └── ✓ GATE: Low confidence shows dialog, confirm creates sprout

Phase 5: Research Agent
├── 5a: Create Research Agent service
│   └── ✓ GATE: Service polls queue, claims sprouts
├── 5b: Implement status transitions
│   └── ✓ GATE: planted → germinating → ready transitions work
├── 5c: Implement results population
│   └── ✓ GATE: Ready sprout has results object
└── 5d: Wire notifications
    └── ✓ GATE: Badge pulses, toast appears on ready

Phase 6: Testing
├── 6a: Smoke test: Plant sprout (US-B001)
│   └── ✓ GATE: Test passes
├── 6b: Smoke test: Confirm ambiguous (US-B002)
│   └── ✓ GATE: Test passes
├── 6c: Smoke test: Reject off-topic (US-B003)
│   └── ✓ GATE: Test passes
├── 6d: Smoke test: Process sprout (US-B004)
│   └── ✓ GATE: Test passes
├── 6e: Smoke test: Load config (US-B006)
│   └── ✓ GATE: Test passes
├── 6f: Smoke test: Capture provenance (US-B008)
│   └── ✓ GATE: Test passes
└── 6g: Smoke test: Monitor progress (US-B009)
    └── ✓ GATE: Test passes
```

---

## File Organization

### New Files to Create

```
src/core/schema/
├── prompt-architect-config.ts     (Phase 1a)
├── inference-rule.ts              (Phase 1b)
└── research-manifest.ts           (Phase 1c)

src/explore/
├── hooks/
│   ├── usePromptArchitectConfig.ts (Phase 2a)
│   └── useCreateSprout.ts          (Phase 3c)
├── components/
│   ├── ResearchRequestModal.tsx    (Phase 3b)
│   └── ConfirmationDialog.tsx      (Phase 4a)
└── utils/
    ├── sproutCommandDetector.ts    (Phase 3a)
    ├── qualityGateEvaluator.ts     (Phase 2b)
    └── inferenceRuleMatcher.ts     (Phase 2c)

src/services/
└── research-agent/
    ├── index.ts                    (Phase 5a)
    └── statusTransitions.ts        (Phase 5b)

tests/e2e/
└── prompt-architect.spec.ts        (Phase 6)
```

### Files to NEVER Modify

```
src/surface/components/Terminal/*
src/workspace/*
Any file in /terminal or /foundation routes
```

---

## Build Gates

### After Every Sub-Phase
```bash
npm run build
npm run lint
```

### After Every Phase
```bash
npm run build && npm run lint && npm test
npm run dev
# Navigate to localhost:3000/explore
# Test sprout: command → Screenshot → Save to docs/sprints/prompt-architect-v1/screenshots/
# Update DEVLOG.md
# Update REVIEW.html
# Then commit
```

---

## Notion Tracking (Auto-Update)

**Execution Tracker Entry:** [prompt-architect-v1](https://www.notion.so/2e5780a78eef816da5f7e2c8879cf7a0)
**Page ID:** `2e5780a7-8eef-816d-a5f7-e2c8879cf7a0`

### Phase Sign-Off Protocol

**MANDATORY:** After completing each phase, update the Notion Sprint Execution Tracker:

```
When Phase N is complete:
1. Update "Current Phase" → "Phase {N+1} - {Name}" (or "Complete" if final)
2. Update "Phases Complete" → {N}
3. Update "Last Updated" → today's date
4. Update "Next Action" → next phase's first sub-phase
5. If blocked, update "Blocking Issues" and "Status" → "⏸️ Blocked"
6. If all phases done, update "Status" → "✅ Complete"
```

### Notion Update Fields

| Field | Update Trigger | Value |
|-------|---------------|-------|
| Current Phase | Phase complete | "Phase {N} - {Name}" |
| Phases Complete | Phase complete | Increment by 1 |
| Last Updated | Any update | Current date |
| Next Action | Phase complete | Next sub-phase description |
| Status | Sprint start | "🚀 Executing" |
| Status | All phases done | "✅ Complete" |
| Status | Blocked | "⏸️ Blocked" |
| Blocking Issues | When blocked | Description of blocker |

### Example Notion Update (Phase 1 Complete)

After completing Phase 1, update Notion with:
- Current Phase: "Phase 2 - Config Layer"
- Phases Complete: 1
- Last Updated: {today}
- Next Action: "Phase 2a - Create usePromptArchitectConfig hook"
- Status: "🚀 Executing"

---

## Session Handoff Protocol

When context fills or session ends:
1. Update DEVLOG.md with current state
2. Update CONTINUATION_PROMPT.md (create if needed)
3. Commit both
4. Fresh session reads CONTINUATION_PROMPT.md first

---

## Success Criteria

### Sprint Complete When:
- [ ] All sub-phases completed with verification
- [ ] All DEX compliance matrix cells verified
- [ ] All build gates passing
- [ ] Screenshot evidence for all visual verifications
- [ ] FROZEN ZONE untouched
- [ ] DEVLOG.md documents complete journey
- [ ] 7 smoke tests passing (US-B001-B004, B006, B008, B009)

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase completed without screenshot
- DEX compliance test fails
- sprout: command doesn't create ResearchSprout
- Provenance not captured on creation

---

## User Stories Reference

| Story ID | Title | Priority | Smoke Test |
|----------|-------|----------|------------|
| US-B001 | Plant Research Sprout | P0 | Yes |
| US-B002 | Confirm Ambiguous Intent | P0 | Yes |
| US-B003 | Reject Off-Topic Research | P0 | Yes |
| US-B004 | Process Planted Sprout | P0 | Yes |
| US-B005 | Handle Research Failure | P1 | No (regression) |
| US-B006 | Load Grove Configuration | P0 | Yes |
| US-B007 | Apply Inference Rules | P1 | No (regression) |
| US-B008 | Capture Sprout Provenance | P0 | Yes |
| US-B009 | Monitor Research Progress | P0 | Yes |

Full acceptance criteria: [Notion](https://www.notion.so/2e5780a78eef81b189bed412aec3cb3e)

---

## Dependencies (Verify in Phase 0)

| Dependency | Type | Verification |
|------------|------|--------------|
| prompt_architect_configs table | Supabase | Table accessible |
| research_sprouts table | Supabase | Table accessible |
| ResearchSprout schema | Data model | Schema file exists |
| /explore command handling | UI | Can intercept input |

---

*This contract is binding. Deviation requires explicit human approval.*
