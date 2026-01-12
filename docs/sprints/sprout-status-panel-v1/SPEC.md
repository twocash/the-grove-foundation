# Sprout Status Panel Execution Contract

**Codename:** `sprout-status-panel-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.2
**Baseline:** `main` (post garden-tray-mvp)
**Date:** 2026-01-11

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Pre-work |
| **Status** | 🟢 Ready to Execute |
| **Blocking Issues** | None - garden-tray-mvp complete (124d915) |
| **Last Updated** | 2026-01-12T05:00:00Z |
| **Next Action** | Phase 0a - Verify GardenTray component exists |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Notifications and results display for the existing Garden Tray (built in garden-tray-mvp)
- **Success looks like:** Explorer plants sprout → tray shows 🌱 → research completes → pulse + toast notification → 🌻 Ready → click to view results
- **We are NOT:** Building the tray itself (garden-tray-mvp), search/filter (garden-tray-mvp), pagination, feedback mechanism
- **Prerequisite:** garden-tray-mvp must be complete before this sprint begins
- **Current phase:** Phase 0 - Pre-work (BLOCKED)
- **Next action:** Wait for garden-tray-mvp completion

---

## Purpose

Enhance the Garden Tray (built in garden-tray-mvp) with:
1. Pulse animation on badge when sprout becomes ready
2. Toast notification when research completes
3. Click-to-expand results display (summary, evidence, confidence)

**Prerequisite: garden-tray-mvp** — This sprint assumes the tray already exists with sprout list, search, and state filter.

**This is NOT the Nursery** — Nursery shows all sprouts system-wide for Cultivators. This panel shows only the current Explorer's session sprouts.

**This document is an execution contract, not a spec.**

User stories and acceptance criteria are documented in Notion: [Sprint C User Stories](https://www.notion.so/2e5780a78eef81afafcce9fe7103f604)

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
├── /explore route ← THIS SPRINT
├── src/explore/* ← WHERE COMPONENTS GO
└── src/core/schema/* ← IF SCHEMA CHANGES NEEDED
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| Status Badge | Notification style configurable (future) | N/A | N/A | Session scope limits list |
| Sprout Cards | Display format configurable (future) | Shows results regardless of agent | Shows origin spark | Grouping surfaces actionable |
| Notifications | Toast/pulse timing configurable | N/A | N/A | Can batch (deferred) |
| Results Display | Summary format configurable | Evidence from any source | Source attribution | Expandable sections |

### Route for Testing

**CRITICAL:** Test at `/explore`, NOT at `/` or `/terminal`

```
✅ localhost:3000/explore           ← WHERE PANEL LIVES
❌ localhost:3000/                  ← LEGACY TERMINAL
❌ localhost:3000/terminal          ← LEGACY TERMINAL
❌ localhost:3000/bedrock/nursery   ← DIFFERENT COMPONENT (Cultivator view)
```

---

## v1.0 Scope Boundaries (Post garden-tray-mvp)

**Prerequisite (from garden-tray-mvp):**
- Existing Garden Tray with sprout list
- Search input and state filter
- Emoji state display (🌱 Planted, 🌿 Growing, 🌻 Ready)

**In Scope (Must Have):**
- Pulse animation when sprout becomes ready
- Toast notification on ready transition
- Expand card to see results (summary, evidence, confidence)
- Badge count on tray trigger (if not in garden-tray-mvp)

**Explicitly Deferred:**
- Feedback mechanism (needs USER objects)
- Confidence breakdown (just show percentage)
- Session stats beyond simple count
- Estimated time remaining
- Pagination
- Notification batching

---

## Execution Architecture

### Sub-Phases

```
Phase 0: Pre-work
├── 0a: Verify ResearchSprout schema exists
│   └── ✓ GATE: Can import ResearchSprout type
├── 0b: Verify /explore toolbar insertion point
│   └── ✓ GATE: Can identify where badge goes
└── 0c: Verify sprout data accessible
    └── ✓ GATE: Can query session sprouts

Phase 1: Schema & Types
├── 1a: Define SproutStatusState type (drawer open/closed, selected sprout)
│   └── ✓ GATE: Type exports, no build errors
└── 1b: Define notification types (toast, pulse)
    └── ✓ GATE: Types export, no build errors

Phase 2: Data Layer
├── 2a: Create useSessionSprouts hook (fetch session's sprouts)
│   └── ✓ GATE: Hook returns sprouts grouped by status
├── 2b: Create sprout polling mechanism
│   └── ✓ GATE: Status changes detected within 5 seconds
└── 2c: Create notification trigger logic
    └── ✓ GATE: Ready transition fires notification

Phase 3: UI Components (No wiring)
├── 3a: Create SproutStatusBadge component
│   └── ✓ GATE: Badge renders with count and pulse state
├── 3b: Create SproutStatusDrawer component
│   └── ✓ GATE: Drawer renders, animates in/out
├── 3c: Create SproutCard component
│   └── ✓ GATE: Card renders collapsed and expanded states
├── 3d: Create StatusGroup component
│   └── ✓ GATE: Groups render with labels
├── 3e: Create EmptyState component
│   └── ✓ GATE: Empty state renders with instructions
└── 3f: Create ResearchToast component
    └── ✓ GATE: Toast renders with sprout info

Phase 4: Page Assembly
├── 4a: Wire badge to /explore toolbar
│   └── ✓ GATE: Badge visible in toolbar
├── 4b: Wire hover-to-open drawer behavior
│   └── ✓ GATE: Hover badge → drawer opens
├── 4c: Wire sprout data to cards
│   └── ✓ GATE: Cards show real sprout data
├── 4d: Wire expand/collapse behavior
│   └── ✓ GATE: Click card → results visible
├── 4e: Wire pulse animation
│   └── ✓ GATE: Ready sprout → badge pulses
├── 4f: Wire toast notifications
│   └── ✓ GATE: Ready sprout → toast appears
└── 4g: Wire "+ New Sprout" button
    └── ✓ GATE: Click → opens Research Request modal

Phase 5: Polish & Edge Cases
├── 5a: Empty state (no sprouts)
│   └── ✓ GATE: Instructions shown when no sprouts
├── 5b: Keyboard navigation (Escape closes)
│   └── ✓ GATE: Escape closes drawer
├── 5c: Accessibility (aria-labels)
│   └── ✓ GATE: Screen reader announces ready sprouts
└── 5d: Failed sprout display
    └── ✓ GATE: Failed sprouts show with badge

Phase 6: Testing
├── 6a: Smoke test: View badge (US-C001)
│   └── ✓ GATE: Test passes
├── 6b: Smoke test: Open/close drawer (US-C002)
│   └── ✓ GATE: Test passes
├── 6c: Smoke test: View grouped cards (US-C003)
│   └── ✓ GATE: Test passes
├── 6d: Smoke test: Receive notification (US-C005)
│   └── ✓ GATE: Test passes
└── 6e: Smoke test: View results (US-C006)
    └── ✓ GATE: Test passes

Phase 7: Final Gates (v1.2)
├── 7a: Run code-simplifier
│   └── ✓ GATE: /code-simplifier completes without errors
├── 7b: Apply simplifier recommendations
│   └── ✓ GATE: npm run build && npm run lint passes
├── 7c: DEX compliance verification
│   └── ✓ GATE: All 4 DEX tests documented in DEVLOG
└── 7d: Final visual verification
    └── ✓ GATE: Screenshot evidence captured
```

---

## File Organization

### New Files to Create

```
src/explore/
├── components/
│   ├── SproutStatusBadge.tsx       (Phase 3a)
│   ├── SproutStatusDrawer.tsx      (Phase 3b)
│   ├── SproutCard.tsx              (Phase 3c)
│   ├── StatusGroup.tsx             (Phase 3d)
│   ├── SproutEmptyState.tsx        (Phase 3e)
│   └── ResearchToast.tsx           (Phase 3f)
├── hooks/
│   ├── useSessionSprouts.ts        (Phase 2a)
│   ├── useSproutPolling.ts         (Phase 2b)
│   └── useSproutNotifications.ts   (Phase 2c)
└── types/
    └── sprout-status.ts            (Phase 1)

tests/e2e/
└── sprout-status-panel.spec.ts     (Phase 6)
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
# Interact with badge/drawer → Screenshot → Save to docs/sprints/sprout-status-panel-v1/screenshots/
# Update DEVLOG.md
# Then commit
```

### Pre-Commit Gate (v1.2 Protocol)
```bash
1. npm run build && npm run lint
2. /code-simplifier
3. Review and apply changes
4. npm run build && npm run lint
5. Visual verification + screenshot
6. git add . && git commit
```

---

## Notion Tracking (Auto-Update)

**Execution Tracker Entry:** [sprout-status-panel-v1](https://www.notion.so/2e5780a78eef81919c46ff762147be46)
**Page ID:** `2e5780a7-8eef-8191-9c46-ff762147be46`

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
- Next Action: "Phase 2a - Create useSessionSprouts hook"
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
- [ ] garden-tray-mvp prerequisite complete
- [ ] All sub-phases completed with verification
- [ ] All DEX compliance matrix cells verified
- [ ] All build gates passing
- [ ] Screenshot evidence for all visual verifications
- [ ] FROZEN ZONE untouched
- [ ] DEVLOG.md documents complete journey
- [ ] code-simplifier pass applied (v1.2)
- [ ] DEX compliance documented in DEVLOG (v1.2)
- [ ] Smoke tests passing

### Sprint Failed If:
- ❌ garden-tray-mvp not complete (prerequisite missing)
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase completed without screenshot
- ❌ DEX compliance test fails
- ❌ Code committed without code-simplifier pass (v1.2)
- ❌ Notifications don't fire on ready transition
- ❌ Results not viewable when sprout expands

---

## User Stories Reference

| Story ID | Title | Priority | Smoke Test |
|----------|-------|----------|------------|
| US-C001 | View Sprout Status Badge | P0 | Yes |
| US-C002 | Open and Close Drawer | P0 | Yes |
| US-C003 | View Sprout Cards Grouped by Status | P0 | Yes |
| US-C004 | View Empty State | P1 | No (regression) |
| US-C005 | Receive Ready Notification | P0 | Yes |
| US-C006 | View Research Results | P0 | Yes |
| US-C007 | Plant New Sprout from Drawer | P1 | No (regression) |
| US-C008 | Provide Feedback | DEFERRED | No |

Full acceptance criteria: [Notion](https://www.notion.so/2e5780a78eef81afafcce9fe7103f604)

---

## Dependencies (Verify in Phase 0)

| Dependency | Type | Verification |
|------------|------|--------------|
| garden-tray-mvp complete | **PREREQUISITE** | Garden Tray renders with sprout list |
| ResearchSprout schema | Data model | `src/core/schema/research-sprout.ts` exists |
| research_sprouts table | Supabase | Table accessible via client |
| GardenTray component | UI | `src/explore/components/GardenTray.tsx` exists |
| Sprint B complete | Prerequisite | sprout: command creates sprouts |

---

## Design Decisions (From Review)

| Question | Decision | Notes |
|----------|----------|-------|
| **Session Scope** | "Sprout Feed" model | Items visible until resolved + 24 hours |
| **Polling vs WebSocket** | Easiest non-debt option | Start simple, architect for WebSocket |
| **Failed Sprouts** | Yes, show to Explorer | Display "Failed" badge |
| **Multiple Ready Toasts** | One per sprout (noisy OK) | Future: batch notifications |
| **Drawer Trigger** | Mouseover animation | Not click-to-open |

---

*This contract is binding. Deviation requires explicit human approval.*
