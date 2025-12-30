# REPO_AUDIT.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Audited:** 2025-12-29
**Parent Sprint:** xstate-telemetry-v1

## Executive Summary

The xstate-telemetry-v1 sprint successfully migrated telemetry from the deprecated engagement bus to XState. However, the implementation introduced several DEX (Declarative Exploration) violations that compromise architectural purity.

| Pillar | Current Grade | Violations |
|--------|---------------|------------|
| Declarative Sovereignty | C+ | Stage thresholds hardcoded in React hook |
| Provenance as Infrastructure | B- | No attribution chain for cumulative metrics |
| Capability Agnosticism | A | (No violations) |
| Organic Scalability | A- | Global metrics, no Field namespacing |

---

## Violation 1: Hardcoded Stage Thresholds

**Location:** `src/surface/hooks/useMoments.ts:65-68`

```typescript
// Compute stage based on exchange count
let stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED' = 'ARRIVAL';
if (exchangeCount >= 6) stage = 'ENGAGED';
else if (exchangeCount >= 3) stage = 'EXPLORING';
else if (exchangeCount >= 1) stage = 'ORIENTED';
```

**DEX Violation:** Declarative Sovereignty
- Stage thresholds (1, 3, 6) are hardcoded in a React component
- Cannot be changed without code deployment
- No declarative configuration for per-Field or per-journey thresholds
- Domain logic embedded in UI layer

**Impact:**
- Foundation operators cannot tune engagement stages
- A/B testing stage thresholds requires code changes
- Different Fields may need different progression curves

---

## Violation 2: Missing Provenance Attribution

**Location:** `src/core/engagement/persistence.ts:81-87`

```typescript
export interface CumulativeMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  sessionCount: number;
  lastSessionAt: number;
}
```

**DEX Violation:** Provenance as Infrastructure
- Cumulative metrics are raw counters with no attribution
- Cannot trace which journeys contributed to `journeysCompleted`
- Cannot trace which topics are in `topicsExplored` or when they were added
- No Field attribution for multi-Field scenarios

**Impact:**
- Audit trail missing for all cumulative metrics
- Cannot implement "undo" or correction for misattributed metrics
- Cross-Field aggregation impossible without provenance

**Missing Attribution Chain:**
```typescript
// Current: journeysCompleted: 5
// Should be:
journeysCompleted: [
  { journeyId: 'ghost-in-the-machine', completedAt: timestamp, fieldId: 'grove' },
  { journeyId: 'ratchet-effect', completedAt: timestamp, fieldId: 'grove' },
  // ...
]
```

---

## Violation 3: Global Metrics (No Field Scoping)

**Location:** `src/core/engagement/types.ts:43-46`

```typescript
// Cumulative metrics (Sprint: xstate-telemetry-v1)
journeysCompleted: number;
sproutsCaptured: number;
topicsExplored: string[];
```

**DEX Violation:** Organic Scalability
- All metrics are global to the user
- No Field namespacing for multi-Field deployments
- Storage key is global: `grove-telemetry-cumulative`

**Impact:**
- Cannot run multiple Fields on same browser
- Metrics from "grove" Field would pollute "clinic" Field data
- No isolation for development/staging Fields

---

## Violation 4: Custom Lens Detection Logic

**Location:** `src/core/engagement/machine.ts:24-28`

```typescript
function isCustomLensId(lensId: string | null): boolean {
  if (!lensId) return false;
  return lensId.startsWith('custom-') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lensId);
}
```

**DEX Violation:** Declarative Sovereignty (Minor)
- Custom lens detection is hardcoded heuristic
- UUID pattern and "custom-" prefix are convention, not schema
- Should be declared in lens schema: `{ isCustom: true }`

**Impact:** Low
- Works correctly but relies on naming convention
- Could break if lens ID generation changes

---

## Files Requiring Modification

| File | Violation | Priority |
|------|-----------|----------|
| `src/surface/hooks/useMoments.ts` | Hardcoded thresholds | High |
| `src/core/engagement/persistence.ts` | Missing provenance | High |
| `src/core/engagement/types.ts` | Global metrics | Medium |
| `src/core/engagement/machine.ts` | Detection heuristic | Low |
| `src/core/config/defaults.ts` | (New) Stage config | High |
| `src/core/schema/telemetry.ts` | (New) Provenance types | High |

---

## Recommended Fixes

### Fix 1: Extract Stage Configuration

Create declarative stage thresholds in `src/core/config/defaults.ts`:

```typescript
export const DEFAULT_STAGE_THRESHOLDS = {
  ARRIVAL: 0,
  ORIENTED: 1,
  EXPLORING: 3,
  ENGAGED: 6,
} as const;
```

### Fix 2: Add Provenance Types

Create `src/core/schema/telemetry.ts`:

```typescript
export interface MetricAttribution {
  fieldId: string;
  timestamp: number;
}

export interface JourneyCompletion extends MetricAttribution {
  journeyId: string;
}

export interface TopicExploration extends MetricAttribution {
  topicId: string;
  hubId: string;
}

export interface SproutCapture extends MetricAttribution {
  sproutId: string;
  journeyId?: string;
}

export interface CumulativeMetricsV2 {
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];
  sessionCount: number;
  lastSessionAt: number;
}
```

### Fix 3: Add Field Scoping

Modify storage key pattern:

```typescript
const STORAGE_KEYS = {
  cumulativeMetrics: (fieldId: string) => `grove-telemetry-${fieldId}-cumulative`,
} as const;
```

---

## Testing Gaps

| Test | Status | Gap |
|------|--------|-----|
| Stage computation | Missing | No unit test for stage transitions |
| Provenance persistence | Missing | No test for attribution chain |
| Field isolation | Missing | No test for multi-Field storage |
| Custom lens detection | Present | Works but brittle |

---

## Conclusion

The xstate-telemetry-v1 sprint achieved its primary goal of migration but introduced technical debt that violates DEX principles. This follow-up sprint should:

1. Extract all magic numbers to declarative config
2. Add full provenance chain to cumulative metrics
3. Add Field namespacing for organic scalability
4. Add unit tests for all stage/threshold logic
