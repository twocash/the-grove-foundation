# DECISIONS.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Status:** Planning
**Created:** 2025-12-29

---

## ADR-001: Provenance Arrays vs. Counters

### Context
The xstate-telemetry-v1 sprint used raw counters for cumulative metrics:
```typescript
journeysCompleted: number;  // 5
sproutsCaptured: number;    // 12
topicsExplored: string[];   // ['ratchet', 'observer']
```

This violates DEX Provenance as Infrastructure: we cannot trace when, where, or how these metrics accumulated.

### Decision
Replace raw counters with provenance arrays containing full attribution:

```typescript
journeyCompletions: JourneyCompletion[];  // [{ journeyId, fieldId, timestamp }, ...]
sproutCaptures: SproutCapture[];          // [{ sproutId, fieldId, timestamp }, ...]
topicExplorations: TopicExploration[];    // [{ topicId, hubId, fieldId, timestamp }, ...]
```

### Consequences

**Positive:**
- Full audit trail for all metrics
- Can implement "undo" / correction
- Enables Field-level aggregation
- Supports future analytics queries

**Negative:**
- Increased storage size (~100 bytes per event vs ~10 bytes for counter)
- Need migration strategy for existing users
- Computed properties add minor CPU overhead

### Status
Accepted

---

## ADR-002: Storage Key Namespacing Strategy

### Context
Current storage uses global key: `grove-telemetry-cumulative`

Multi-Field deployments (e.g., grove + clinic on same browser) would collide.

### Options Considered

1. **Field prefix in key:** `grove-telemetry-{fieldId}-cumulative`
2. **Field as top-level in value:** `{ grove: {...}, clinic: {...} }`
3. **Separate IndexedDB per Field**

### Decision
Option 1: Field prefix in storage key.

```typescript
cumulativeMetricsV2: (fieldId: string) => `grove-telemetry-${fieldId}-cumulative-v2`
```

### Rationale
- Simplest implementation
- localStorage has 5MB limit per origin, not per key
- Easy to enumerate Fields: `Object.keys(localStorage).filter(k => k.startsWith('grove-telemetry-'))`
- Clear ownership: each Field owns its own key

### Consequences

**Positive:**
- Complete Field isolation
- Easy debugging (inspect single key)
- No cross-Field pollution

**Negative:**
- Need to pass fieldId everywhere
- Default fieldId ('grove') hardcoded for now

### Status
Accepted

---

## ADR-003: Computed Properties vs. Denormalized Storage

### Context
Should we store both provenance AND computed values?

```typescript
// Option A: Provenance only (compute on read)
{ journeyCompletions: [...] }
// journeysCompleted = journeyCompletions.length

// Option B: Both (denormalized)
{ journeyCompletions: [...], journeysCompleted: 5 }
```

### Decision
Option A: Provenance only, compute on read.

```typescript
export function computeMetrics(metrics: CumulativeMetricsV2): ComputedMetrics {
  return {
    journeysCompleted: metrics.journeyCompletions.length,
    sproutsCaptured: metrics.sproutCaptures.length,
    topicsExplored: [...new Set(metrics.topicExplorations.map(t => t.topicId))],
  };
}
```

### Rationale
- Single source of truth (provenance arrays)
- No sync bugs between counter and array
- Computation is O(n) but n is typically < 100
- Memoization can be added if needed

### Consequences

**Positive:**
- No denormalization bugs
- Always consistent
- Simpler persistence code

**Negative:**
- Must call `computeMetrics()` when reading
- Slightly more CPU on read (negligible)

### Status
Accepted

---

## ADR-004: V1 to V2 Migration Strategy

### Context
Existing users have v1 data:
```typescript
{ journeysCompleted: 5, sproutsCaptured: 3, topicsExplored: ['a', 'b'] }
```

We need to migrate to v2 without data loss.

### Options Considered

1. **Automatic migration on first read:** Detect v1, convert to v2, delete v1
2. **Parallel writes during transition:** Write both v1 and v2, eventually drop v1
3. **Manual migration via admin tool:** User triggers migration

### Decision
Option 1: Automatic migration on first read.

```typescript
export function getCumulativeMetricsV2(fieldId): CumulativeMetricsV2 | null {
  const v2 = localStorage.getItem(STORAGE_KEYS.cumulativeMetricsV2(fieldId));
  if (v2) return JSON.parse(v2);

  // No v2, check for v1
  const v1 = localStorage.getItem(STORAGE_KEYS.cumulativeMetrics);
  if (v1) {
    const migrated = migrateV1ToV2(JSON.parse(v1), fieldId);
    setCumulativeMetricsV2(migrated);
    // Keep v1 for 30 days for rollback, then remove
    return migrated;
  }

  return null;
}
```

### Consequences

**Positive:**
- Zero user friction
- Automatic and invisible
- Preserves all existing counts

**Negative:**
- Synthetic timestamps for migrated events
- Cannot recover original timestamps
- Need to mark migrated events (`journeyId: 'legacy-migration-0'`)

### Status
Accepted

---

## ADR-005: Stage Threshold Configuration Location

### Context
Stage thresholds (ARRIVAL=0, ORIENTED=1, EXPLORING=3, ENGAGED=6) are hardcoded in `useMoments.ts`.

Where should declarative config live?

### Options Considered

1. **`src/core/config/defaults.ts`:** With other defaults
2. **`src/core/schema/engagement.ts`:** With engagement types
3. **JSON file in `data/`:** Externally editable
4. **GCS/API:** Remote configuration

### Decision
Option 1: `src/core/config/defaults.ts`

```typescript
export const DEFAULT_STAGE_THRESHOLDS = {
  ARRIVAL: 0,
  ORIENTED: 1,
  EXPLORING: 3,
  ENGAGED: 6,
} as const;
```

### Rationale
- Consistent with existing pattern (DEFAULT_* exports)
- Type-safe (const assertion)
- Can be overridden by future GCS config layer
- No new file or pattern introduced

### Consequences

**Positive:**
- Single import for all defaults
- TypeScript enforcement
- Easy to find

**Negative:**
- Still requires code deployment to change
- Future: Add Foundation console for threshold tuning

### Status
Accepted

---

## ADR-006: Field ID Source

### Context
Where does the current Field ID come from?

### Options Considered

1. **Hardcoded constant:** `const DEFAULT_FIELD_ID = 'grove'`
2. **URL parameter:** `?field=grove`
3. **React Context:** `<FieldProvider fieldId="grove">`
4. **Environment variable:** `VITE_FIELD_ID=grove`

### Decision
Option 1 for now: Hardcoded constant.

```typescript
// src/core/engagement/persistence.ts
const DEFAULT_FIELD_ID = 'grove';
```

### Rationale
- The Grove Foundation is single-Field for now
- Multi-Field is a future requirement
- Adding Context/URL now adds complexity without benefit
- Easy to swap constant for Context later

### Future Migration Path
1. Create `FieldContext` with `useField()` hook
2. Replace `DEFAULT_FIELD_ID` references with `useField()`
3. Pass fieldId from URL or config

### Consequences

**Positive:**
- Simplest implementation
- No new patterns
- Works for single Field

**Negative:**
- Must refactor for multi-Field
- Cannot run two Fields simultaneously (yet)

### Status
Accepted (temporary)

---

## ADR-007: Backward Compatibility for Moment Evaluation

### Context
`MomentEvaluationContext` expects:
```typescript
journeysCompleted: number;
sproutsCaptured: number;
topicsExplored: string[];
```

New XState context has:
```typescript
journeyCompletions: JourneyCompletion[];
sproutCaptures: SproutCapture[];
topicExplorations: TopicExploration[];
```

How do we bridge them?

### Decision
Use `computeMetrics()` in `useMoments.ts` to derive the old shape:

```typescript
const computed = computeMetrics({
  version: 2,
  fieldId: 'grove',
  journeyCompletions: xstateContext.journeyCompletions,
  topicExplorations: xstateContext.topicExplorations,
  sproutCaptures: xstateContext.sproutCaptures,
  sessionCount: xstateContext.sessionCount,
  lastSessionAt: Date.now(),
});

// Use computed.journeysCompleted, computed.sproutsCaptured, etc.
```

### Rationale
- `MomentEvaluationContext` is a stable interface
- Moments don't need provenance detail, just counts
- Computing on each render is fast (< 1ms)

### Consequences

**Positive:**
- No changes to moment schema
- Backward compatible
- Separation of concerns (moments don't know storage format)

**Negative:**
- Extra computation per evaluation
- Must remember to call computeMetrics()

### Status
Accepted

---

## Summary

| ADR | Decision | DEX Pillar |
|-----|----------|------------|
| ADR-001 | Provenance arrays | Provenance as Infrastructure |
| ADR-002 | Field prefix in key | Organic Scalability |
| ADR-003 | Compute on read | Provenance as Infrastructure |
| ADR-004 | Auto-migrate on read | Organic Scalability |
| ADR-005 | Config in defaults.ts | Declarative Sovereignty |
| ADR-006 | Hardcoded Field ID | (Temporary) |
| ADR-007 | computeMetrics() bridge | Capability Agnosticism |
