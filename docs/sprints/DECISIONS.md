# DECISIONS.md — Architectural Decision Records
**Sprint:** Grove Main Page Voice Revision
**Generated:** 2025-12-19

---

## ADR-001: Content in Code vs. External Config

### Status: ACCEPTED

### Context
The landing page content could live in hardcoded TSX/TS, external JSON, or a CMS.

### Decision
**Keep content in code.**

### Rationale
1. Current content is already in TSX/TS — changing structure adds risk
2. No immediate need for non-developer content editing
3. Build-time validation catches typos and type errors

### Consequences
- **Pro:** No new infrastructure, type safety
- **Con:** Content changes require code deployment

---

## ADR-002: Telemetry Function Location

### Status: ACCEPTED

### Context
The new `trackPromptHookClicked` function could live in `funnelAnalytics.ts`, a new file, or inline.

### Decision
**Add to existing `funnelAnalytics.ts`.**

### Rationale
1. Consistent with existing pattern (`trackLensActivated`, etc.)
2. Uses same event queue and flush mechanism

### Consequences
- **Pro:** No new files, consistent API
- **Con:** File grows slightly

---

## ADR-003: SectionId Passing to Hook Handler

### Status: ACCEPTED

### Context
`handlePromptHook` needs to know which section the hook came from.

### Decision
**Pass `sectionId` as second parameter.**

### Rationale
1. Explicit is better than implicit
2. `activeSection` state could be stale during scroll
3. Minimal change to existing data shape

### Consequences
- **Pro:** Accurate section attribution
- **Con:** Every PromptHooks call must update callback

---

## ADR-004: Carousel Content Update Strategy

### Status: ACCEPTED

### Context
Carousel content is hardcoded JSX. Options: edit directly, extract to constants, or refactor to data-driven.

### Decision
**Edit JSX directly.**

### Rationale
1. This is a content revision sprint, not refactoring
2. Structure is complex — extraction adds risk
3. Fastest path to updated content

### Consequences
- **Pro:** No structural changes, minimal risk
- **Con:** Future updates still require TSX edits

---

## ADR-005: Terminal Initial Message Format

### Status: ACCEPTED

### Context
Terminal initial message could use `→` arrows (current), clickable buttons, or empty state.

### Decision
**Keep `→` arrow prompts.**

### Rationale
1. Consistent with existing UX
2. Terminal already renders these as clickable
3. Clear entry points without being heavy-handed

---

## DECISIONS STATUS: COMPLETE ✓
