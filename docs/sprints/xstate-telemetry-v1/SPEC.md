# SPEC.md — XState Telemetry Migration

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29
**Author:** Claude (Foundation Loop)

---

## Problem Statement

The Moment system's `MomentEvaluationContext` requires several metrics that are either:
1. **Hardcoded** to placeholder values (journeysCompleted, sproutsCaptured, hasCustomLens)
2. **Not tracked** anywhere (topicsExplored, sessionCount)
3. **Computed locally** without persistence (minutesActive)
4. **Only tracked in deprecated Engagement Bus** (telemetry events)

This blocks advanced moment triggers and makes engagement telemetry unreliable.

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Cumulative metrics | Pattern 2: Engagement Machine | Add fields to `EngagementContext` |
| Session tracking | Pattern 2: Engagement Machine | Add `sessionStartedAt`, `sessionCount` |
| Metric persistence | `persistence.ts` in engagement | Extend existing persistence layer |
| Telemetry events | XState events in `types.ts` | Add new event types |

## Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Engagement state | `src/core/engagement/` | ✅ XState | Keep |
| Cumulative metrics | `useEngagementBus.ts` | ❌ Parallel to XState | **PORT** to XState |
| Moment telemetry | Engagement Bus events | ❌ Separate from XState | **PORT** to XState actions |
| localStorage persistence | `persistence.ts` | ✅ Exists but incomplete | **EXTEND** |

### Porting Plan

1. `journeysCompleted`, `sproutsCaptured`, `topicsExplored`, `sessionCount` → Move to XState context
2. `momentShown/Actioned/Dismissed` → Convert from Bus events to XState actions
3. `useEngagementEmit` in useMoments.ts → Replace with XState sends

### No Duplication Certification

I confirm this sprint does not create parallel implementations. All changes extend the existing XState Engagement Machine pattern. The Engagement Bus will be deprecated (not duplicated).

---

## Goals

1. **All MomentEvaluationContext fields sourced from XState** — Single source of truth
2. **Cumulative metrics persist across sessions** — localStorage hydration
3. **Engagement Bus removable from Kinetic Stream** — useMoments.ts has no bus imports
4. **Stage computation in XState** — Not computed ad-hoc in hooks

## Non-Goals

- Full Engagement Bus deprecation (other surfaces may still use it)
- Adding new moment trigger types
- Changing moment evaluation logic
- Backend telemetry integration

---

## Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | `journeysCompleted` tracks actual count | Complete a journey → value increments |
| 2 | `sproutsCaptured` tracks actual count | Capture a sprout → value increments |
| 3 | `sessionCount` increments on new session | Return after 30min → count increases |
| 4 | `minutesActive` computed from session start | Value increases during session |
| 5 | `hasCustomLens` detected from lens ID | Create custom lens → flag is true |
| 6 | All metrics persist to localStorage | Reload page → values preserved |
| 7 | useMoments.ts has no engagement bus import | Grep returns empty |
| 8 | Moment triggers work with new context | Existing tests pass |

---

## Scope

### In Scope

- `src/core/engagement/types.ts` — Add context fields
- `src/core/engagement/machine.ts` — Add events/actions
- `src/core/engagement/persistence.ts` — Add cumulative metrics persistence
- `src/core/engagement/context.tsx` — Add hydration on mount
- `src/surface/hooks/useMoments.ts` — Remove engagement bus
- `src/core/engagement/moment-evaluator.ts` — Update context mapping (if needed)

### Out of Scope

- `hooks/useEngagementBus.ts` — Not deleting (other surfaces use it)
- Foundation consoles — May still use Engagement Bus
- Backend analytics — Not part of this sprint

---

## Technical Constraints

1. **XState context must remain serializable** — No functions, no circular refs
2. **localStorage access must be guarded** — SSR safety via `isBrowser()` check
3. **Backward compatible** — Old localStorage keys should not break
4. **Existing tests must pass** — No breaking changes to machine behavior

---

## DEX Compliance

- **Declarative Sovereignty:** Moment triggers remain in JSON schema; engine interprets them
- **Capability Agnosticism:** Telemetry works regardless of AI model used
- **Provenance:** All metrics include session attribution (timestamp, sessionId)
- **Organic Scalability:** New metrics can be added to context without restructuring
