# Architectural Decisions: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Date:** January 4, 2026

---

## ADR-001: Thin Bridge Over Direct Hook Usage

### Context

Sprint 2 created `useEventHelpers` with typed emit methods for all 15 event types. Components could use this directly, but:
1. Legacy engagement bus must receive events during migration
2. Feature flag must control new system activation
3. Components shouldn't know about migration details

### Decision

Create `useEventBridge` as a **thin routing layer** that:
- Delegates to `useEventHelpers` for new system
- Delegates to `useLegacyBridge` for legacy
- Checks feature flag to control routing

**Bridge never creates events.** It calls existing helpers.

### Consequences

**Positive:**
- Components have single integration point
- Feature flag logic centralized
- Schema adherence guaranteed (via useEventHelpers)
- Legacy translation isolated (easy to remove later)

**Negative:**
- One more abstraction layer
- Bridge interface may lag behind full event set

---

## ADR-002: Isolated Legacy Translation

### Context

Legacy engagement bus uses different event names and formats:

| New | Legacy |
|-----|--------|
| `LENS_ACTIVATED` | `LENS_SELECTED` |
| `QUERY_SUBMITTED` | `EXCHANGE_SENT` |
| `HUB_ENTERED` | `TOPIC_EXPLORED` + `HUB_VISITED` |

Mixing translation logic with routing logic creates:
- Harder to test
- Harder to remove when legacy deprecated
- Risk of schema drift

### Decision

Create dedicated `useLegacyBridge` hook that:
- Contains ALL legacy translations
- Has no knowledge of new event system
- Is clearly marked for deprecation

### Consequences

**Positive:**
- Single file to delete when migration complete
- Clear deprecation boundary
- Testable in isolation

**Negative:**
- Two hooks to maintain during migration
- Translation logic duplicates some field names

---

## ADR-003: Feature Flag in localStorage

### Context

The `grove-event-system` flag controls whether new system is active. Options for flag evaluation:

1. **NarrativeEngine context** — Where other flags live
2. **localStorage + URL param** — Simple, no context dependency
3. **Both** — Complex

### Decision

Use **localStorage + URL param** only.

Rationale:
- ExploreEventProvider renders at route level, before NarrativeEngine
- URL param enables testing without persistent state
- localStorage enables persistent override
- Simple, no circular dependency risk

### Consequences

**Positive:**
- No context dependency
- Easy testing via URL
- Persistent override for local dev

**Negative:**
- Doesn't sync with admin panel flags (acceptable for migration)
- Must check localStorage on every render (cheap)

---

## ADR-004: Discard and Rewrite WIP

### Context

The uncommitted `useEventBridge.ts` has critical schema violations:
- `RESPONSE_COMPLETED` missing required fields
- `HUB_VISITED` doesn't exist
- `SPROUT_CAPTURED` doesn't exist
- `trigger` field should be `source`

Options:
1. **Fix incrementally** — Patch each violation
2. **Discard and rewrite** — Apply thin bridge pattern from scratch

### Decision

**Discard and rewrite.**

Rationale:
- Fundamental pattern is wrong (creates events directly)
- Incremental fixes would leave wrong pattern in place
- Rewrite is ~100 lines, faster than patching

### Consequences

**Positive:**
- Clean implementation
- Correct pattern from start
- No legacy cruft

**Negative:**
- Work already done is discarded
- Must verify all exports still work

---

## ADR-005: Bridge Interface Subset

### Context

Sprint 2's `useEventHelpers` exposes 15 event types. Should bridge expose all 15?

### Decision

Bridge exposes **subset most commonly used by explore routes**:

| Included | Excluded (use useEventHelpers directly) |
|----------|----------------------------------------|
| sessionStarted | sessionResumed |
| querySubmitted | forkSelected |
| responseCompleted | pivotTriggered |
| lensActivated | topicExplored |
| hubEntered | momentSurfaced |
| journeyStarted | momentResolved |
| journeyAdvanced | |
| journeyCompleted | |
| insightCaptured | |

Components needing excluded events can:
1. Use `useEventHelpers` directly (if inside provider)
2. Request bridge expansion (if commonly needed)

### Consequences

**Positive:**
- Simpler bridge interface
- Legacy translation limited to actual use cases
- Organic scalability maintained (useEventHelpers is always available)

**Negative:**
- Some components may need both hooks
- Must document which is which

---

## ADR-006: Dual-Write Strategy

### Context

During migration, both event systems must receive events. Options:

| Strategy | Description |
|----------|-------------|
| A: Always dual-write | Both systems always get events |
| B: Flag-controlled | Dual-write only when legacy consumers exist |
| C: Time-limited | Dual-write for N sprints, then stop |

### Decision

**Strategy A: Always dual-write** for now.

Rationale:
- Simplest to implement
- No risk of breaking legacy consumers
- Can optimize later when we audit consumers

### Consequences

**Positive:**
- No consumer audit needed now
- Maximum compatibility

**Negative:**
- Double the event writes
- Must maintain legacy bridge longer

---

## ADR-007: Error Handling in Legacy Bridge

### Context

Legacy engagement bus may not be available (e.g., in tests). Options:

1. **Throw** — Force bus availability
2. **Warn and continue** — Log warning, don't break
3. **Silent no-op** — Ignore failures

### Decision

**Warn and continue.**

```typescript
async function getLegacyBus() {
  try {
    const module = await import('../../../../hooks/useEngagementBus');
    return module.getEngagementBus();
  } catch (e) {
    console.warn('[EventBridge] Legacy bus not available:', e);
    return null;  // No-op on emit
  }
}
```

### Consequences

**Positive:**
- Works in all environments
- Visibility into missing bus
- Doesn't break new system

**Negative:**
- Silent failures could hide issues
- Must monitor warnings in production

---

## Summary

| ADR | Decision |
|-----|----------|
| 001 | Thin bridge over direct hooks |
| 002 | Isolated legacy translation |
| 003 | localStorage + URL param for flag |
| 004 | Discard and rewrite WIP |
| 005 | Bridge exposes subset of events |
| 006 | Always dual-write during migration |
| 007 | Warn and continue on legacy errors |

---

*Decisions documented for Foundation Loop Phase 2*
