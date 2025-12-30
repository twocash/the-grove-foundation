# ARCHITECTURE.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Status:** Planning
**Created:** 2025-12-29

## Target State Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TELEMETRY LAYER                             │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Stage Config    │  │  Provenance      │  │  Field Scoping   │  │
│  │  (Declarative)   │  │  (Attribution)   │  │  (Namespace)     │  │
│  │                  │  │                  │  │                  │  │
│  │  ARRIVAL: 0      │  │  { fieldId,      │  │  grove-telemetry │  │
│  │  ORIENTED: 1     │  │    timestamp,    │  │   -grove-        │  │
│  │  EXPLORING: 3    │  │    journeyId }   │  │   -clinic-       │  │
│  │  ENGAGED: 6      │  │                  │  │   -research-     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                                 │                                   │
│                    ┌────────────▼────────────┐                     │
│                    │   XState Context        │                     │
│                    │   (Computed Props)      │                     │
│                    └────────────┬────────────┘                     │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Persistence Layer       │
                    │   (Field-Scoped Storage)  │
                    └───────────────────────────┘
```

---

## Component Design

### 1. Stage Configuration (`src/core/config/defaults.ts`)

```typescript
/**
 * Declarative stage thresholds
 * DEX Pillar: Declarative Sovereignty
 */
export const DEFAULT_STAGE_THRESHOLDS = {
  ARRIVAL: 0,
  ORIENTED: 1,
  EXPLORING: 3,
  ENGAGED: 6,
} as const;

export type EngagementStage = keyof typeof DEFAULT_STAGE_THRESHOLDS;

/**
 * Compute stage from exchange count using config
 */
export function computeStage(
  exchangeCount: number,
  thresholds = DEFAULT_STAGE_THRESHOLDS
): EngagementStage {
  if (exchangeCount >= thresholds.ENGAGED) return 'ENGAGED';
  if (exchangeCount >= thresholds.EXPLORING) return 'EXPLORING';
  if (exchangeCount >= thresholds.ORIENTED) return 'ORIENTED';
  return 'ARRIVAL';
}
```

### 2. Provenance Types (`src/core/schema/telemetry.ts`)

```typescript
/**
 * Base attribution for all metrics
 * DEX Pillar: Provenance as Infrastructure
 */
export interface MetricAttribution {
  fieldId: string;
  timestamp: number;
}

/**
 * Journey completion with full provenance
 */
export interface JourneyCompletion extends MetricAttribution {
  journeyId: string;
  durationMs?: number;
  waypointsVisited?: number;
}

/**
 * Topic exploration with hub context
 */
export interface TopicExploration extends MetricAttribution {
  topicId: string;
  hubId: string;
  queryTrigger?: string;
}

/**
 * Sprout capture with journey context
 */
export interface SproutCapture extends MetricAttribution {
  sproutId: string;
  journeyId?: string;
  hubId?: string;
}

/**
 * V2 cumulative metrics with full provenance
 */
export interface CumulativeMetricsV2 {
  version: 2;
  fieldId: string;
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];
  sessionCount: number;
  lastSessionAt: number;
}

/**
 * Computed properties (derived from provenance)
 */
export interface ComputedMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
}

export function computeMetrics(metrics: CumulativeMetricsV2): ComputedMetrics {
  return {
    journeysCompleted: metrics.journeyCompletions.length,
    sproutsCaptured: metrics.sproutCaptures.length,
    topicsExplored: [...new Set(metrics.topicExplorations.map(t => t.topicId))],
  };
}
```

### 3. Field-Scoped Persistence (`src/core/engagement/persistence.ts`)

```typescript
const CURRENT_FIELD_ID = 'grove'; // Future: from config/context

export const STORAGE_KEYS = {
  // ... existing keys
  cumulativeMetrics: (fieldId: string = CURRENT_FIELD_ID) =>
    `grove-telemetry-${fieldId}-cumulative`,
} as const;

/**
 * Get field-scoped metrics with migration
 */
export function getCumulativeMetricsV2(fieldId: string = CURRENT_FIELD_ID): CumulativeMetricsV2 | null {
  if (!isBrowser()) return null;

  const key = STORAGE_KEYS.cumulativeMetrics(fieldId);
  const stored = localStorage.getItem(key);

  if (!stored) {
    // Check for legacy v1 data and migrate
    const legacy = localStorage.getItem('grove-telemetry-cumulative');
    if (legacy) {
      const migrated = migrateV1ToV2(JSON.parse(legacy), fieldId);
      setCumulativeMetricsV2(migrated);
      localStorage.removeItem('grove-telemetry-cumulative');
      return migrated;
    }
    return null;
  }

  return JSON.parse(stored);
}

/**
 * Migrate v1 (raw counts) to v2 (provenance)
 */
function migrateV1ToV2(v1: CumulativeMetrics, fieldId: string): CumulativeMetricsV2 {
  const now = Date.now();
  return {
    version: 2,
    fieldId,
    journeyCompletions: Array(v1.journeysCompleted).fill(null).map((_, i) => ({
      fieldId,
      timestamp: now - (i * 1000), // Synthetic timestamps
      journeyId: `legacy-migration-${i}`,
    })),
    topicExplorations: v1.topicsExplored.map((topicId, i) => ({
      fieldId,
      timestamp: now - (i * 1000),
      topicId,
      hubId: 'legacy-migration',
    })),
    sproutCaptures: Array(v1.sproutsCaptured).fill(null).map((_, i) => ({
      fieldId,
      timestamp: now - (i * 1000),
      sproutId: `legacy-migration-${i}`,
    })),
    sessionCount: v1.sessionCount,
    lastSessionAt: v1.lastSessionAt,
  };
}
```

### 4. XState Context Updates (`src/core/engagement/types.ts`)

```typescript
import type {
  CumulativeMetricsV2,
  JourneyCompletion,
  TopicExploration,
  SproutCapture
} from '../schema/telemetry';

export interface EngagementContext {
  // ... existing fields

  // Cumulative metrics with provenance (Sprint: dex-telemetry-compliance-v1)
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];

  // Computed (derived from provenance)
  // These are computed on access, not stored
}
```

### 5. Hooks Layer Updates (`src/surface/hooks/useMoments.ts`)

```typescript
import { computeStage, DEFAULT_STAGE_THRESHOLDS } from '@core/config/defaults';

// BEFORE (hardcoded)
let stage: EngagementStage = 'ARRIVAL';
if (exchangeCount >= 6) stage = 'ENGAGED';
else if (exchangeCount >= 3) stage = 'EXPLORING';
else if (exchangeCount >= 1) stage = 'ORIENTED';

// AFTER (declarative)
const stage = computeStage(exchangeCount, DEFAULT_STAGE_THRESHOLDS);
```

---

## Data Flow

```
User Action (e.g., complete journey)
         │
         ▼
┌─────────────────────────────────────────┐
│ actor.send({ type: 'JOURNEY_COMPLETED', │
│   journeyId: 'ghost-in-the-machine',    │
│   durationMs: 120000                    │
│ })                                      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ XState Action: addJourneyCompletion     │
│                                         │
│ return {                                │
│   journeyCompletions: [                 │
│     ...context.journeyCompletions,      │
│     {                                   │
│       fieldId: 'grove',                 │
│       timestamp: Date.now(),            │
│       journeyId: event.journeyId,       │
│       durationMs: event.durationMs      │
│     }                                   │
│   ]                                     │
│ }                                       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ XState Action: persistMetricsV2         │
│                                         │
│ setCumulativeMetricsV2({                │
│   version: 2,                           │
│   fieldId: 'grove',                     │
│   journeyCompletions: [...],            │
│   ...                                   │
│ })                                      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ localStorage                            │
│ Key: grove-telemetry-grove-cumulative   │
│ Value: { version: 2, ... }              │
└─────────────────────────────────────────┘
```

---

## Migration Strategy

### Phase 1: Additive Changes
1. Add new types to `src/core/schema/telemetry.ts`
2. Add `computeStage()` to `src/core/config/defaults.ts`
3. Keep existing persistence working

### Phase 2: Dual Write
1. XState writes both v1 and v2 formats
2. Reading prefers v2, falls back to v1
3. Validate v2 data matches v1 counts

### Phase 3: Migration
1. On first read, migrate v1 → v2
2. Remove v1 storage key
3. Remove dual-write code

### Phase 4: Cleanup
1. Remove v1 types
2. Remove migration code (after 30 days)
3. Update all tests to v2

---

## Testing Strategy

### Unit Tests
```typescript
// Stage computation
describe('computeStage', () => {
  it('returns ARRIVAL for 0 exchanges', () => {
    expect(computeStage(0)).toBe('ARRIVAL');
  });

  it('respects custom thresholds', () => {
    const custom = { ARRIVAL: 0, ORIENTED: 2, EXPLORING: 5, ENGAGED: 10 };
    expect(computeStage(3, custom)).toBe('ORIENTED');
  });
});

// Provenance
describe('JourneyCompletion', () => {
  it('includes fieldId and timestamp', () => {
    const completion = createJourneyCompletion('ghost', 'grove');
    expect(completion.fieldId).toBe('grove');
    expect(completion.timestamp).toBeCloseTo(Date.now(), -2);
  });
});

// Migration
describe('migrateV1ToV2', () => {
  it('preserves counts during migration', () => {
    const v1 = { journeysCompleted: 3, sproutsCaptured: 5, ... };
    const v2 = migrateV1ToV2(v1, 'grove');
    expect(v2.journeyCompletions.length).toBe(3);
    expect(v2.sproutCaptures.length).toBe(5);
  });
});
```

### Integration Tests
```typescript
describe('Field isolation', () => {
  it('stores metrics separately per field', () => {
    setCumulativeMetricsV2(metricsA, 'grove');
    setCumulativeMetricsV2(metricsB, 'clinic');

    expect(getCumulativeMetricsV2('grove')).toEqual(metricsA);
    expect(getCumulativeMetricsV2('clinic')).toEqual(metricsB);
  });
});
```

---

## DEX Compliance Checklist

| Pillar | Before | After | Implementation |
|--------|--------|-------|----------------|
| Declarative Sovereignty | C+ | A | Stage thresholds in config |
| Provenance | B- | A | Full attribution chain |
| Capability Agnosticism | A | A | No change needed |
| Organic Scalability | A- | A | Field namespacing |
