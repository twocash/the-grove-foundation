# Nursery Full View Execution Contract

**Codename:** `nursery-v1`
**Status:** Execution Contract for Claude Code CLI
**Baseline:** `main` (commit `ff65219`)
**Date:** 2026-01-11

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Complete |
| **Status** | ✅ Complete |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-11T23:00:00Z |
| **Next Action** | N/A - Sprint Complete |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** The Nursery Full View at `/bedrock/nursery` — a Cultivator's queue for reviewing and promoting research sprouts
- **Success looks like:** Cultivator can view ready sprouts, open Inspector, promote to Garden, archive with reason
- **We are NOT:** Building stat cards, tier assignment, category tags, or Extend Research flow (all deferred)
- **Current phase:** ✅ Complete
- **Next action:** Sprint complete - all smoke tests passing

---

## Purpose

Transform the placeholder at `/bedrock/nursery` into a functional moderation workflow where Cultivators review completed research (status='ready' or 'failed'), promote validated sprouts to the Garden corpus, and archive low-quality submissions with audit trails.

**This document is an execution contract, not a spec.**

User stories and acceptance criteria are documented in Notion: [Sprint A User Stories](https://www.notion.so/2e5780a78eef8123aa8bdc33da6d4769)

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
├── /bedrock/nursery route ← THIS SPRINT
├── src/bedrock/* ← WHERE COMPONENTS GO
└── src/core/schema/* ← IF SCHEMA CHANGES NEEDED
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| Nursery List View | Archive reasons configurable | Displays results regardless of agent | Shows who planted, when | Filters handle any volume |
| Inspector Drawer | Layout via config (future) | Confidence shown without model info | Full provenance section | Sections expandable |
| Promote Action | No options = no config needed | Works regardless of embedding model | Records promotedBy, promotedAt | Single action, no complexity |
| Archive Action | Reason dropdown configurable | N/A | Records archiver + reason | Standard audit pattern |

### Route for Testing

**CRITICAL:** Test at `/bedrock/nursery`, NOT at `/` or `/terminal`

```
✅ localhost:3000/bedrock/nursery  ← WHERE TO TEST
❌ localhost:3000/                 ← LEGACY TERMINAL
❌ localhost:3000/terminal         ← LEGACY TERMINAL
```

---

## v1.0 Scope Boundaries (From User Stories)

**In Scope (Must Have):**
- View sprouts awaiting action (Ready, Failed)
- Open sprout details in Inspector drawer
- Promote sprout to Garden (simple, no options)
- Archive sprout with reason
- View archived sprouts (via filter toggle)
- Restore archived sprout

**Explicitly Deferred:**
- Stat cards (Total, Planted, Germinating, Ready counts)
- Tier assignment (Seed/Sapling/Tree)
- Category tagging
- Embedding toggle (always embed on promote)
- Extend Research flow
- Bulk actions

---

## Execution Architecture

### Sub-Phases

```
Phase 0: Pre-work
├── 0a: Verify ResearchSprout schema exists
│   └── ✓ GATE: Schema file exists, types are importable
├── 0b: Verify Supabase tables exist
│   └── ✓ GATE: research_sprouts table accessible
└── 0c: Seed test data (if needed)
    └── ✓ GATE: At least 3 sprouts in various states exist

Phase 1: Schema & Types
├── 1a: Define NurseryFilters type
│   └── ✓ GATE: Type exports, no build errors
├── 1b: Define NurseryState type (if using local state)
│   └── ✓ GATE: Type exports, no build errors
└── 1c: Add archive reasons enum/config
    └── ✓ GATE: Build passes

Phase 2: Data Layer
├── 2a: Create useNurserySprouts hook (fetch with filters)
│   └── ✓ GATE: Hook returns data, loading, error states
├── 2b: Create usePromoteSprout mutation
│   └── ✓ GATE: Function exists, types correct
├── 2c: Create useArchiveSprout mutation
│   └── ✓ GATE: Function exists, types correct
└── 2d: Create useRestoreSprout mutation
    └── ✓ GATE: Function exists, types correct

Phase 3: UI Components (No wiring)
├── 3a: Create NurserySproutCard component
│   └── ✓ GATE: Renders in isolation with mock data
├── 3b: Create NurseryInspector drawer component
│   └── ✓ GATE: Renders in isolation with mock data
├── 3c: Create PromoteDialog component
│   └── ✓ GATE: Renders in isolation
├── 3d: Create ArchiveDialog component
│   └── ✓ GATE: Renders in isolation
└── 3e: Create NurseryFilters component
    └── ✓ GATE: Renders in isolation

Phase 4: Page Assembly
├── 4a: Create NurseryPage layout
│   └── ✓ GATE: Page renders at /bedrock/nursery
├── 4b: Wire NurserySproutCard list
│   └── ✓ GATE: Cards display real data
├── 4c: Wire Inspector open/close
│   └── ✓ GATE: Click card → Inspector opens
├── 4d: Wire Promote action
│   └── ✓ GATE: Promote → status changes → Garden doc created
├── 4e: Wire Archive action
│   └── ✓ GATE: Archive → status changes → reason recorded
└── 4f: Wire Filters
    └── ✓ GATE: Toggle filters → list updates

Phase 5: Polish & Edge Cases
├── 5a: Empty state
│   └── ✓ GATE: Empty message shows when no sprouts
├── 5b: Error states
│   └── ✓ GATE: Error messages display on failure
├── 5c: Loading states
│   └── ✓ GATE: Skeletons show while loading
└── 5d: Keyboard navigation (Escape to close)
    └── ✓ GATE: Escape closes Inspector

Phase 6: Testing
├── 6a: Write smoke test: View Nursery
│   └── ✓ GATE: Test passes
├── 6b: Write smoke test: Open Inspector
│   └── ✓ GATE: Test passes
├── 6c: Write smoke test: Promote sprout
│   └── ✓ GATE: Test passes
└── 6d: Write smoke test: Archive sprout
    └── ✓ GATE: Test passes
```

---

## File Organization

### New Files to Create

```
src/bedrock/nursery/
├── NurseryPage.tsx              (Phase 4a)
├── components/
│   ├── NurserySproutCard.tsx    (Phase 3a)
│   ├── NurseryInspector.tsx     (Phase 3b)
│   ├── PromoteDialog.tsx        (Phase 3c)
│   ├── ArchiveDialog.tsx        (Phase 3d)
│   └── NurseryFilters.tsx       (Phase 3e)
├── hooks/
│   ├── useNurserySprouts.ts     (Phase 2a)
│   ├── usePromoteSprout.ts      (Phase 2b)
│   ├── useArchiveSprout.ts      (Phase 2c)
│   └── useRestoreSprout.ts      (Phase 2d)
└── types.ts                     (Phase 1)

tests/e2e/
└── nursery.spec.ts              (Phase 6)
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
# Navigate to localhost:3000/bedrock/nursery
# Interact → Screenshot → Save to docs/sprints/nursery-v1/screenshots/
# Update DEVLOG.md
# Update REVIEW.html
# Then commit
```

---

## Notion Tracking (Auto-Update)

**Execution Tracker Entry:** [nursery-v1](https://www.notion.so/2e5780a78eef814fb4c0f53a317baa4a)
**Page ID:** `2e5780a7-8eef-814f-b4c0-f53a317baa4a`

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
- Current Phase: "Phase 2 - Data Layer"
- Phases Complete: 1
- Last Updated: {today}
- Next Action: "Phase 2a - Create useNurserySprouts hook"
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
- [ ] 4 smoke tests passing (US-A001 through US-A004)

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase completed without screenshot
- DEX compliance test fails
- Promote doesn't create Garden document
- Archive doesn't record reason in provenance

---

## User Stories Reference

| Story ID | Title | Priority | Smoke Test |
|----------|-------|----------|------------|
| US-A001 | View Actionable Sprouts | P0 | Yes |
| US-A002 | Open Sprout Inspector | P0 | Yes |
| US-A003 | Promote Sprout to Garden | P0 | Yes |
| US-A004 | Archive Sprout | P0 | Yes |
| US-A005 | View Archived Sprouts | P1 | No (regression) |
| US-A006 | Restore Archived Sprout | P1 | No (regression) |

Full acceptance criteria: [Notion](https://www.notion.so/2e5780a78eef8123aa8bdc33da6d4769)

---

## Dependencies (Verify in Phase 0)

| Dependency | Type | Verification |
|------------|------|--------------|
| ResearchSprout schema | Data model | `src/core/schema/research-sprout.ts` exists |
| research_sprouts table | Supabase | Table accessible via client |
| Garden document creation | Integration | Garden schema exists |
| /bedrock route | UI | Route renders without error |

---

*This contract is binding. Deviation requires explicit human approval.*
