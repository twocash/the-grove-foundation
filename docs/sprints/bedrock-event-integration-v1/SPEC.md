# Bedrock Event Integration v1 — Specification

**Sprint:** bedrock-event-integration-v1  
**Depends On:** bedrock-event-hooks-v1 (✅ Complete)  
**Date:** January 4, 2026  
**Sprint Type:** Core Infrastructure (per BEDROCK_SPRINT_CONTRACT.md v1.1 Section 6.3)  
**Est. Duration:** 1 day

---

## Constitutional Reference

- [x] `The_Trellis_Architecture__First_Order_Directives.md` — DEX stack standards
- [x] `BEDROCK_SPRINT_CONTRACT.md` v1.1 — Core infrastructure provisions
- [x] `src/core/events/types.ts` — Canonical event schema (Sprint 1)
- [x] `src/core/events/hooks/` — React hooks (Sprint 2)

---

## Overview

Wire the Grove event system to explore routes with:
1. **Feature flag control** — Gradual rollout via `grove-event-system` flag
2. **Thin bridge pattern** — Wraps existing hooks, adds legacy dual-write
3. **Schema adherence** — All events validate against Sprint 1 types
4. **Backward compatibility** — Legacy engagement bus receives translated events

---

## Problem Statement

### Current WIP Issues

The uncommitted `useEventBridge.ts` has critical schema violations:

| Issue | Impact |
|-------|--------|
| `RESPONSE_COMPLETED` missing required fields | Zod throws at dispatch |
| `HUB_VISITED` doesn't exist (should be `HUB_ENTERED`) | Unknown type error |
| `SPROUT_CAPTURED` doesn't exist (should be `INSIGHT_CAPTURED`) | Unknown type error |
| `trigger` field on `LENS_ACTIVATED` should be `source` | Schema mismatch |

### Root Cause

Bridge was written against **assumed** event schema rather than **actual** schema from Sprint 1. This violates Provenance as Infrastructure (broken chain) and Organic Scalability (hardcoded subset).

---

## Goals

- [x] Preserve `ExploreEventProvider.tsx` (feature flag wrapper) — already correct
- [x] Preserve feature flag additions to schemas — already correct
- [x] Rewrite `useEventBridge.ts` with thin bridge pattern
- [x] Legacy dual-write integrated into bridge hook (async, fire-and-forget)
- [x] Add integration tests for dual-write behavior (22 tests)
- [ ] Document Sprint 2 retroactively (DECISIONS.md for pattern choices)

## Non-Goals

- Migrate existing components to new hooks (future sprint)
- Remove legacy engagement machine (requires consumer audit first)
- Real-time tab sync (future enhancement)

---

## DEX Compliance Matrix

### Feature: Event Integration Layer

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Feature flag (`grove-event-system`) controls behavior via config. Admin can enable/disable without code changes. |
| Capability Agnosticism | ✅ | No LLM calls in integration layer. Works regardless of model. |
| Provenance as Infrastructure | ✅ | All events dispatched via `useEventHelpers` which enforces `fieldId` + `timestamp` + `sessionId`. No raw dispatch. |
| Organic Scalability | ✅ | Bridge delegates to `useEventHelpers`. New events auto-available without bridge changes. Legacy translation isolated in `useLegacyBridge`. |

**Blocking issues:** None after fix.

### Feature: Legacy Dual-Write

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Dual-write controlled by same feature flag. Legacy consumers aren't modified. |
| Capability Agnosticism | ✅ | No model dependency. |
| Provenance as Infrastructure | ⚠️ | Legacy events are translations—provenance is in new system, legacy is derivative. Acceptable for migration period. |
| Organic Scalability | ⚠️ | New events need translation added to `useLegacyBridge`. Acceptable—legacy system is deprecated. |

**Blocking issues:** None. Deprecation planned.

---

## Architecture

### Pattern: Thin Bridge

```
┌─────────────────────────────────────────────────────────────────┐
│                     Component                                    │
│                        │                                         │
│                        ▼                                         │
│              useEventBridge()                                    │
│                   │    │                                         │
│         ┌────────┘    └────────┐                                │
│         ▼                      ▼                                 │
│  useEventHelpers()      useLegacyBridge()                       │
│  (Sprint 2)             (new - translation)                     │
│         │                      │                                 │
│         ▼                      ▼                                 │
│  GroveEventProvider     Legacy EngagementBus                    │
│  (new system)           (deprecated)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principle

**Bridge doesn't create events.** It calls `useEventHelpers.emit.*` methods which:
1. Create events with correct schema
2. Validate via Zod
3. Dispatch to provider

Then bridge calls `useLegacyBridge` which:
1. Translates new events to legacy format
2. Fires on legacy bus
3. Has no impact on new system

---

## Epics

### Epic 1: Legacy Bridge Isolation (2 hrs)

**Goal:** Extract legacy engagement bus writes to dedicated hook

#### Story 1.1: Create useLegacyBridge.ts

**File:** `src/core/events/hooks/useLegacyBridge.ts`

```typescript
/**
 * Hook for writing to legacy engagement bus.
 * Isolated for deprecation—when all consumers migrate, delete this file.
 */
export function useLegacyBridge() {
  return useMemo(() => ({
    // Session
    onSessionStarted: () => {
      // Legacy has no explicit session event
    },

    // Exploration
    onQuerySubmitted: (content: string) => {
      emit('EXCHANGE_SENT', { query: content, responseLength: 0 });
    },

    onResponseCompleted: (hubId?: string) => {
      if (hubId) emit('CARD_VISITED', { cardId: hubId, cardLabel: hubId });
    },

    // Lens
    onLensActivated: (lensId: string, isCustom: boolean) => {
      emit('LENS_SELECTED', { lensId, isCustom });
    },

    // Journey
    onJourneyStarted: (lensId: string, waypointCount: number) => {
      emit('JOURNEY_STARTED', { lensId, threadLength: waypointCount });
    },

    onJourneyCompleted: (lensId: string, durationMs?: number, cardsVisited?: number) => {
      emit('JOURNEY_COMPLETED', {
        lensId,
        durationMinutes: Math.floor((durationMs ?? 0) / 60000),
        cardsVisited: cardsVisited ?? 0
      });
    },

    // Hub/Topic
    onHubEntered: (hubId: string, hubName?: string) => {
      emit('TOPIC_EXPLORED', { topicId: hubId, topicLabel: hubName ?? hubId });
      emit('HUB_VISITED', { hubId });
    },

    // Sprout
    onInsightCaptured: (sproutId: string) => {
      emit('SPROUT_CAPTURED', { sproutId });
    },
  }), []);
}
```

**Acceptance Criteria:**
- [ ] All legacy event translations in one file
- [ ] Comments mark for deprecation
- [ ] No schema imports (legacy is untyped)

### Epic 2: Thin Bridge Rewrite (3 hrs)

**Goal:** Rewrite useEventBridge to delegate to useEventHelpers

#### Story 2.1: Rewrite useEventBridge.ts

```typescript
export function useEventBridge(): EventBridgeAPI {
  const isEnabled = useIsEventSystemEnabled();
  const context = useContext(GroveEventContext);
  const isProviderAvailable = context !== null;

  // Delegate to existing typed helpers
  const { emit: typedEmit } = isProviderAvailable
    ? useEventHelpers()
    : { emit: noopEmitters };

  // Legacy bridge for dual-write
  const legacy = useLegacyBridge();

  // Unified emit that routes both ways
  const emit = useMemo<EventBridgeEmit>(() => ({
    sessionStarted: (isReturning, previousSessionId) => {
      if (isEnabled && isProviderAvailable) {
        typedEmit.sessionStarted(isReturning ?? false, previousSessionId);
      }
      legacy.onSessionStarted();
    },

    querySubmitted: (queryId, content, intent) => {
      if (isEnabled && isProviderAvailable) {
        typedEmit.querySubmitted(queryId, content, intent);
      }
      legacy.onQuerySubmitted(content);
    },

    // ... all methods follow same pattern
  }), [isEnabled, isProviderAvailable, typedEmit, legacy]);

  return { emit, isNewSystemEnabled: isEnabled, isProviderAvailable };
}
```

**Acceptance Criteria:**
- [ ] All events dispatched via `useEventHelpers`
- [ ] No raw event object creation in bridge
- [ ] Legacy writes via `useLegacyBridge`
- [ ] Types match existing `EventBridgeEmit` interface

#### Story 2.2: Update EventBridgeEmit Types

Align interface with what consumers need (may be subset of all 15 events):

```typescript
export interface EventBridgeEmit {
  // Core flow (what explore routes actually use)
  sessionStarted: (isReturning?: boolean, previousSessionId?: string) => void;
  querySubmitted: (queryId: string, content: string, intent?: string) => void;
  responseCompleted: (responseId: string, queryId: string, hasNavigation: boolean, spanCount: number, hubId?: string) => void;
  lensActivated: (lensId: string, source: LensSource, isCustom: boolean) => void;
  hubEntered: (hubId: string, source: HubSource, queryTrigger?: string) => void;
  journeyStarted: (journeyId: string, lensId: string, waypointCount: number) => void;
  journeyCompleted: (journeyId: string, durationMs?: number, waypointsVisited?: number) => void;
  insightCaptured: (sproutId: string, journeyId?: string, hubId?: string, responseId?: string) => void;
}
```

**Acceptance Criteria:**
- [ ] Interface matches actual component needs
- [ ] Types align with Sprint 1 event schemas
- [ ] Removed non-existent event types

### Epic 3: Integration Tests (2 hrs)

**Goal:** Verify dual-write behavior

#### Story 3.1: Create integration.test.tsx

**File:** `tests/unit/events/integration.test.tsx`

```typescript
describe('ExploreEventProvider', () => {
  it('renders children without provider when flag disabled', () => {});
  it('wraps with GroveEventProvider when flag enabled', () => {});
  it('respects URL param override', () => {});
  it('respects localStorage override', () => {});
});

describe('useEventBridge', () => {
  describe('when new system enabled', () => {
    it('dispatches to GroveEventProvider via useEventHelpers', () => {});
    it('also writes to legacy bus', () => {});
    it('validates events before dispatch', () => {});
  });

  describe('when new system disabled', () => {
    it('only writes to legacy bus', () => {});
    it('does not throw without provider', () => {});
  });
});

describe('useSafeEventBridge', () => {
  it('returns no-op emit when outside providers', () => {});
});
```

**Acceptance Criteria:**
- [ ] Feature flag switching tested
- [ ] Dual-write verified (both systems receive events)
- [ ] Schema validation tested
- [ ] Error cases handled

### Epic 4: Sprint 2 Documentation (1 hr)

**Goal:** Add missing Foundation Loop artifacts for Sprint 2

#### Story 4.1: Create Sprint 2 DECISIONS.md

**File:** `docs/sprints/bedrock-event-hooks-v1/DECISIONS.md`

Document the pattern decisions from Sprint 2:
- Why hooks in `src/core/events/` vs `src/hooks/`
- Why `useContextState` naming
- Why memoization strategy
- Why provider handles migration

#### Story 4.2: Add DEX Matrix to Sprint 2 SPEC.md

Update existing SPEC.md with retroactive compliance matrix.

---

## File Summary

### New Files

| File | Purpose |
|------|---------|
| `src/core/events/hooks/useLegacyBridge.ts` | Isolated legacy bus writes |
| `tests/unit/events/integration.test.tsx` | Integration tests |
| `docs/sprints/bedrock-event-hooks-v1/DECISIONS.md` | Sprint 2 decisions |

### Modified Files

| File | Changes |
|------|---------|
| `src/core/events/hooks/useEventBridge.ts` | Rewrite to thin bridge |
| `src/core/events/hooks/index.ts` | Export useLegacyBridge |
| `docs/sprints/bedrock-event-hooks-v1/SPEC.md` | Add DEX matrix |

### Preserved Files (No Changes)

| File | Reason |
|------|--------|
| `ExploreEventProvider.tsx` | Already correct |
| `data/narratives-schema.ts` | Feature flag correct |
| `src/core/config/defaults.ts` | Feature flag correct |

---

## Build Gates

### Epic 1 Complete
```bash
npx tsc --noEmit  # No type errors
```

### Epic 2 Complete
```bash
npx tsc --noEmit
npm test -- tests/unit/events/hooks.test.tsx  # Existing tests still pass
```

### Epic 3 Complete
```bash
npm test -- tests/unit/events/  # All event tests pass
```

### Sprint Complete
```bash
npm run build
npm test
npx tsc --noEmit
git status  # Clean working tree
```

---

## Bedrock Verification

Per BEDROCK_SPRINT_CONTRACT.md v1.1 Section 6.3 (Core Infrastructure):

**Before starting:**
- [x] Constitutional documents reviewed
- [x] DEX compliance matrix completed
- [x] Pattern check via REPO_AUDIT.md

**After each epic:**
- [ ] No imports from `src/foundation/`
- [ ] Event types use MetricAttribution base (Sprint 1 verified)
- [ ] DEX tests documented

**Final verification:**
- [ ] All events validate against Sprint 1 schema
- [ ] Feature flag controls behavior declaratively
- [ ] Legacy dual-write isolated in dedicated file

---

## Success Criteria

- [ ] `useEventBridge` dispatches valid events (no Zod errors)
- [ ] Legacy bus receives translated events
- [ ] Feature flag enables/disables new system
- [ ] Integration tests pass
- [ ] Sprint 2 documentation gap closed
- [ ] Clean git commit

---

## Notes

- Bridge is **thin** — no event construction, only routing
- Legacy translation is **isolated** — delete `useLegacyBridge.ts` when migration complete
- Feature flag defaults to `false` — gradual rollout
- Next sprint: Wire hooks to actual explore components

---

*Generated by Foundation Loop — Phase 1: Specification*
