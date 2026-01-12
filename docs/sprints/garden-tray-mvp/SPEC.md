# Garden Tray MVP Execution Contract

**Codename:** `garden-tray-mvp`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.2
**Baseline:** `main` (post Sprint B)
**Date:** 2026-01-12

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | ✅ Complete |
| **Status** | 🟢 Sprint Complete |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-12T05:30:00Z |
| **Next Action** | Proceed to Sprint C (Notifications + Results) |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** A simple sprout list inside the existing `/explore` slide-out tray
- **Success looks like:** User plants sprout → sprout appears in tray with emoji state + title
- **We are NOT:** Building results display, notifications, click-to-expand, or feedback mechanisms
- **Current phase:** Phase 0 - Pre-work
- **Next action:** Locate existing slide-out tray component

---

## Purpose

Wire the existing slide-out tray in `/explore` to display session sprouts as a simple list with basic filtering. This replaces the modal-based GardenInspector approach from Sprint B with a simpler, tray-based UX.

**This is a course correction sprint** — we're refactoring from modal → tray before Sprint C builds on this foundation.

**This document is an execution contract, not a spec.**

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
└── Existing slide-out tray component ← ENHANCE, DON'T REPLACE
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative Sovereignty | Capability Agnosticism | Provenance | Organic Scalability |
|---------|------------------------|------------------------|------------|---------------------|
| Sprout List | Display configurable (future) | Shows any sprout regardless of agent | Shows origin spark | Session scope, filterable |
| State Filter | Filter options from enum | N/A | N/A | States extensible |
| Search | Search fields configurable | N/A | N/A | Standard pattern |

### Route for Testing

**CRITICAL:** Test at `/explore`, NOT at `/` or `/terminal`

```
✅ localhost:3000/explore           ← WHERE TRAY LIVES
❌ localhost:3000/                  ← LEGACY TERMINAL
❌ localhost:3000/terminal          ← LEGACY TERMINAL
```

---

## v1.0 Scope Boundaries

### In Scope (Must Have)
- Locate and enhance existing slide-out tray component
- Control bar with search input + state filter dropdown
- Sprout rows showing: state emoji + title
- State emojis: 🌱 Planted, 🌿 Growing, 🌻 Ready
- Session-scoped sprouts (from ResearchSproutContext)
- Empty state: "Select text to plant sprouts" (existing)

### Explicitly Out of Scope (Defer to Sprint C+)
- Results display when sprout completes
- Notifications / pulse animations
- Click-to-expand details
- Feedback mechanism
- Badge count on tray trigger
- Toast notifications

---

## UI Specification

```
┌─────────────────────────────────────┐
│ 🌱 Garden                     [×]   │  ← Existing title bar
├─────────────────────────────────────┤
│ [🔍 Search...    ] [All States ▼]   │  ← Control bar (NEW)
├─────────────────────────────────────┤
│ 🌱 How does authentication...       │  ← Sprout row (NEW)
│ 🌿 Compare React vs Vue for...      │
│ 🌻 Best practices for error...      │
├─────────────────────────────────────┤
│        Select text to plant         │  ← Empty state (existing)
│             sprouts                 │
└─────────────────────────────────────┘
```

### State Emoji Legend
| State | Emoji | Meaning |
|-------|-------|---------|
| `planted` | 🌱 | Sprout created, queued for processing |
| `germinating` | 🌿 | Research agent processing |
| `ready` | 🌻 | Research complete (results available later) |
| `failed` | ❌ | Research failed |

---

## Execution Architecture

### Sub-Phases

```
Phase 0: Pre-work
├── 0a: Locate existing slide-out tray component
│   └── ✓ GATE: Component file identified, structure understood
├── 0b: Verify ResearchSproutContext provides session sprouts
│   └── ✓ GATE: Can access sprouts from context
└── 0c: Understand current tray state management
    └── ✓ GATE: Know how tray opens/closes

Phase 1: Control Bar
├── 1a: Add control bar container below title
│   └── ✓ GATE: Empty bar renders, build passes
├── 1b: Add search input
│   └── ✓ GATE: Input renders, onChange fires
└── 1c: Add state filter dropdown
    └── ✓ GATE: Dropdown renders with state options

Phase 2: Sprout List
├── 2a: Create SproutRow component (emoji + title)
│   └── ✓ GATE: Component renders with mock data
├── 2b: Wire to ResearchSproutContext
│   └── ✓ GATE: Real sprouts display in tray
├── 2c: Apply search filter
│   └── ✓ GATE: Typing filters sprout list
└── 2d: Apply state filter
    └── ✓ GATE: Dropdown filters by state

Phase 3: Polish
├── 3a: Empty state (no sprouts)
│   └── ✓ GATE: Shows "Select text to plant sprouts"
├── 3b: Empty state (filtered to zero)
│   └── ✓ GATE: Shows "No matching sprouts"
└── 3c: Truncate long titles with ellipsis
    └── ✓ GATE: Long titles don't break layout

Phase 4: Testing & Commit
├── 4a: Manual test: Plant sprout → appears in tray
│   └── ✓ GATE: Sprout shows with 🌱 state
├── 4b: Manual test: Search filters correctly
│   └── ✓ GATE: Search narrows list
├── 4c: Manual test: State filter works
│   └── ✓ GATE: Filter isolates by state
├── 4d: Run code-simplifier
│   └── ✓ GATE: /code-simplifier completes
├── 4e: DEX compliance verification
│   └── ✓ GATE: All 4 DEX tests documented
└── 4f: Final commit
    └── ✓ GATE: Screenshot evidence, commit created
```

---

## File Organization

### Files to Modify (Expected)
```
src/explore/
├── components/
│   └── [existing-tray-component].tsx  ← Enhance with control bar + list
├── context/
│   └── ResearchSproutContext.tsx      ← May need session filter
```

### New Files to Create
```
src/explore/
├── components/
│   ├── GardenControlBar.tsx           (Phase 1)
│   └── SproutRow.tsx                  (Phase 2a)
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
# Open tray → Screenshot → Save to docs/sprints/garden-tray-mvp/screenshots/
# Update DEVLOG.md
# Then commit
```

### Pre-Commit Gate (v1.2 - Constraint 8)
```bash
1. npm run build && npm run lint
2. /code-simplifier
3. Review and apply changes
4. npm run build && npm run lint
5. Visual verification + screenshot
6. git add . && git commit
```

---

## Notion Tracking

**Execution Tracker Entry:** TBD (will be created)
**Page ID:** TBD

### Phase Sign-Off Protocol

After each phase:
1. Update "Current Phase" in Notion
2. Update "Phases Complete"
3. Update "Last Updated"
4. Update "Next Action"

---

## Success Criteria

### Sprint Complete When:
- [x] Existing tray enhanced (not replaced)
- [x] Control bar with search + state filter
- [x] Sprout rows with emoji state + title
- [x] Filters working correctly
- [x] Build gates passing
- [x] Screenshot evidence for all visual phases
- [x] Code-simplifier applied (v1.2)
- [x] DEX compliance documented (v1.2)
- [ ] Sprint C updated with learnings

### Sprint Failed If:
- ❌ Created new modal instead of using tray
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase completed without screenshot
- ❌ Code committed without code-simplifier pass
- ❌ Tray doesn't show sprouts after planting

---

## Post-Sprint Actions

1. **Update Sprint C SPEC.md:**
   - Remove GardenInspector modal refactor task
   - Update dependencies (tray now exists)
   - Simplify scope to notifications + results only

2. **Update Sprint C Notion:**
   - Unblock sprint
   - Update blocking issues

---

## Dependencies

| Dependency | Type | Verification |
|------------|------|--------------|
| Sprint B complete | Prerequisite | ResearchSproutContext exists |
| Existing slide-out tray | UI | Component renders in /explore |
| ResearchSprout data | Context | Can query session sprouts |

---

*This contract is binding. Deviation requires explicit human approval.*
