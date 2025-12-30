# MIGRATION_MAP.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Status:** Planning
**Created:** 2025-12-29

## File Changes Summary

| File | Action | Priority | EPIC |
|------|--------|----------|------|
| `src/core/schema/telemetry.ts` | Create | High | 1 |
| `src/core/config/defaults.ts` | Modify | High | 1 |
| `src/core/engagement/persistence.ts` | Modify | High | 2 |
| `src/core/engagement/types.ts` | Modify | Medium | 2 |
| `src/core/engagement/machine.ts` | Modify | Medium | 3 |
| `src/surface/hooks/useMoments.ts` | Modify | High | 4 |
| `tests/unit/telemetry.test.ts` | Create | High | 5 |
| `tests/unit/stage-computation.test.ts` | Create | Medium | 5 |

---

## EPIC 1: Schema & Config

### File: `src/core/schema/telemetry.ts` (CREATE)

**Purpose:** Define provenance types for DEX-compliant telemetry

```typescript
// NEW FILE

/**
 * src/core/schema/telemetry.ts
 * Sprint: dex-telemetry-compliance-v1
 *
 * Provenance types for DEX-compliant telemetry.
 * DEX Pillar: Provenance as Infrastructure
 */

export interface MetricAttribution {
  fieldId: string;
  timestamp: number;
}

export interface JourneyCompletion extends MetricAttribution {
  journeyId: string;
  durationMs?: number;
  waypointsVisited?: number;
}

export interface TopicExploration extends MetricAttribution {
  topicId: string;
  hubId: string;
  queryTrigger?: string;
}

export interface SproutCapture extends MetricAttribution {
  sproutId: string;
  journeyId?: string;
  hubId?: string;
}

export interface CumulativeMetricsV2 {
  version: 2;
  fieldId: string;
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];
  sessionCount: number;
  lastSessionAt: number;
}

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

### File: `src/core/config/defaults.ts` (MODIFY)

**Location:** End of file
**Action:** Add stage thresholds and computation function

```typescript
// ADD to existing file

/**
 * Declarative stage thresholds
 * Sprint: dex-telemetry-compliance-v1
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
 * Compute engagement stage from exchange count
 * Uses declarative thresholds, not hardcoded values
 */
export function computeStage(
  exchangeCount: number,
  thresholds: typeof DEFAULT_STAGE_THRESHOLDS = DEFAULT_STAGE_THRESHOLDS
): EngagementStage {
  if (exchangeCount >= thresholds.ENGAGED) return 'ENGAGED';
  if (exchangeCount >= thresholds.EXPLORING) return 'EXPLORING';
  if (exchangeCount >= thresholds.ORIENTED) return 'ORIENTED';
  return 'ARRIVAL';
}
```

---

## EPIC 2: Persistence Layer

### File: `src/core/engagement/persistence.ts` (MODIFY)

**Changes:**

1. **Add imports** (line ~1):
```typescript
import type {
  CumulativeMetricsV2,
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
```

2. **Add Field constant** (after imports):
```typescript
// Default Field ID for single-Field deployments
// Future: This will come from FieldContext
const DEFAULT_FIELD_ID = 'grove';
```

3. **Modify STORAGE_KEYS** (line ~3):
```typescript
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
  cumulativeMetrics: 'grove-telemetry-cumulative', // Legacy v1
  cumulativeMetricsV2: (fieldId: string = DEFAULT_FIELD_ID) =>
    `grove-telemetry-${fieldId}-cumulative-v2`,
} as const;
```

4. **Add V2 functions** (after existing CumulativeMetrics functions):
```typescript
// Sprint: dex-telemetry-compliance-v1 - V2 with provenance

export function getCumulativeMetricsV2(
  fieldId: string = DEFAULT_FIELD_ID
): CumulativeMetricsV2 | null {
  if (!isBrowser()) return null;
  try {
    const key = STORAGE_KEYS.cumulativeMetricsV2(fieldId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      // Check for legacy v1 data and migrate
      const legacy = getCumulativeMetrics();
      if (legacy) {
        const migrated = migrateV1ToV2(legacy, fieldId);
        setCumulativeMetricsV2(migrated);
        // Keep v1 for rollback safety, remove after 30 days
        return migrated;
      }
      return null;
    }

    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCumulativeMetricsV2(metrics: CumulativeMetricsV2): void {
  if (!isBrowser()) return;
  try {
    const key = STORAGE_KEYS.cumulativeMetricsV2(metrics.fieldId);
    localStorage.setItem(key, JSON.stringify(metrics));
  } catch {
    console.warn('[Persistence] Failed to persist cumulative metrics v2');
  }
}

function migrateV1ToV2(
  v1: CumulativeMetrics,
  fieldId: string
): CumulativeMetricsV2 {
  const now = Date.now();

  return {
    version: 2,
    fieldId,
    journeyCompletions: Array(v1.journeysCompleted)
      .fill(null)
      .map((_, i) => ({
        fieldId,
        timestamp: now - i * 1000,
        journeyId: `legacy-migration-${i}`,
      })),
    topicExplorations: v1.topicsExplored.map((topicId, i) => ({
      fieldId,
      timestamp: now - i * 1000,
      topicId,
      hubId: 'legacy-migration',
    })),
    sproutCaptures: Array(v1.sproutsCaptured)
      .fill(null)
      .map((_, i) => ({
        fieldId,
        timestamp: now - i * 1000,
        sproutId: `legacy-migration-${i}`,
      })),
    sessionCount: v1.sessionCount,
    lastSessionAt: v1.lastSessionAt,
  };
}
```

5. **Update getHydratedContextOverrides** (modify existing):
```typescript
export function getHydratedContextOverrides(): HydratedContextOverrides {
  if (!isBrowser()) {
    return {
      sessionStartedAt: Date.now(),
      sessionCount: 1,
      journeyCompletions: [],
      topicExplorations: [],
      sproutCaptures: [],
    };
  }

  const stored = getCumulativeMetricsV2();

  if (stored) {
    const isNew = isNewSession(stored.lastSessionAt);
    return {
      sessionStartedAt: Date.now(),
      sessionCount: isNew ? stored.sessionCount + 1 : stored.sessionCount,
      journeyCompletions: stored.journeyCompletions,
      topicExplorations: stored.topicExplorations,
      sproutCaptures: stored.sproutCaptures,
    };
  }

  return {
    sessionStartedAt: Date.now(),
    sessionCount: 1,
    journeyCompletions: [],
    topicExplorations: [],
    sproutCaptures: [],
  };
}
```

---

## EPIC 3: XState Types

### File: `src/core/engagement/types.ts` (MODIFY)

**Changes:**

1. **Add import** (line ~9):
```typescript
import type {
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
```

2. **Replace raw counters with provenance arrays** (lines ~43-46):
```typescript
// REMOVE:
journeysCompleted: number;
sproutsCaptured: number;
topicsExplored: string[];

// ADD:
journeyCompletions: JourneyCompletion[];
topicExplorations: TopicExploration[];
sproutCaptures: SproutCapture[];
```

3. **Update initialContext** (lines ~73-76):
```typescript
// REMOVE:
journeysCompleted: 0,
sproutsCaptured: 0,
topicsExplored: [],

// ADD:
journeyCompletions: [],
topicExplorations: [],
sproutCaptures: [],
```

4. **Update event payloads** (lines ~110-113):
```typescript
// MODIFY:
| { type: 'JOURNEY_COMPLETED_TRACKED'; journeyId: string; durationMs?: number }
| { type: 'SPROUT_CAPTURED'; sproutId: string; journeyId?: string; hubId?: string }
| { type: 'TOPIC_EXPLORED'; topicId: string; hubId: string }
```

---

## EPIC 4: XState Machine

### File: `src/core/engagement/machine.ts` (MODIFY)

**Changes:**

1. **Add imports**:
```typescript
import type {
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
import { computeMetrics } from '../schema/telemetry';
```

2. **Add Field constant**:
```typescript
const DEFAULT_FIELD_ID = 'grove';
```

3. **Replace increment actions with append actions** (lines ~243-255):
```typescript
// REMOVE:
incrementJourneysCompleted: assign(({ context }) => ({
  journeysCompleted: context.journeysCompleted + 1,
})),

incrementSproutsCaptured: assign(({ context }) => ({
  sproutsCaptured: context.sproutsCaptured + 1,
})),

addTopicExplored: assign(({ context, event }) => {
  if (event.type !== 'TOPIC_EXPLORED') return {};
  if (context.topicsExplored.includes(event.topicId)) return {};
  return { topicsExplored: [...context.topicsExplored, event.topicId] };
}),

// ADD:
addJourneyCompletion: assign(({ context, event }) => {
  if (event.type !== 'JOURNEY_COMPLETED_TRACKED') return {};
  const completion: JourneyCompletion = {
    fieldId: DEFAULT_FIELD_ID,
    timestamp: Date.now(),
    journeyId: event.journeyId,
    durationMs: event.durationMs,
  };
  return { journeyCompletions: [...context.journeyCompletions, completion] };
}),

addSproutCapture: assign(({ context, event }) => {
  if (event.type !== 'SPROUT_CAPTURED') return {};
  const capture: SproutCapture = {
    fieldId: DEFAULT_FIELD_ID,
    timestamp: Date.now(),
    sproutId: event.sproutId,
    journeyId: event.journeyId,
    hubId: event.hubId,
  };
  return { sproutCaptures: [...context.sproutCaptures, capture] };
}),

addTopicExploration: assign(({ context, event }) => {
  if (event.type !== 'TOPIC_EXPLORED') return {};
  // Check for duplicate topic (ignore hub for dedup)
  const exists = context.topicExplorations.some(t => t.topicId === event.topicId);
  if (exists) return {};
  const exploration: TopicExploration = {
    fieldId: DEFAULT_FIELD_ID,
    timestamp: Date.now(),
    topicId: event.topicId,
    hubId: event.hubId,
  };
  return { topicExplorations: [...context.topicExplorations, exploration] };
}),
```

4. **Update persistMetrics action**:
```typescript
persistMetrics: ({ context }) => {
  setCumulativeMetricsV2({
    version: 2,
    fieldId: DEFAULT_FIELD_ID,
    journeyCompletions: context.journeyCompletions,
    topicExplorations: context.topicExplorations,
    sproutCaptures: context.sproutCaptures,
    sessionCount: context.sessionCount,
    lastSessionAt: Date.now(),
  });
},
```

5. **Update event handlers** (lines ~419-427):
```typescript
JOURNEY_COMPLETED_TRACKED: {
  actions: ['addJourneyCompletion', 'persistMetrics'],
},
SPROUT_CAPTURED: {
  actions: ['addSproutCapture', 'persistMetrics'],
},
TOPIC_EXPLORED: {
  actions: ['addTopicExploration', 'persistMetrics'],
},
```

---

## EPIC 5: Hooks Layer

### File: `src/surface/hooks/useMoments.ts` (MODIFY)

**Changes:**

1. **Add import**:
```typescript
import { computeStage } from '@core/config/defaults';
import { computeMetrics } from '@core/schema/telemetry';
```

2. **Replace hardcoded stage computation** (lines ~65-68):
```typescript
// REMOVE:
let stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED' = 'ARRIVAL';
if (exchangeCount >= 6) stage = 'ENGAGED';
else if (exchangeCount >= 3) stage = 'EXPLORING';
else if (exchangeCount >= 1) stage = 'ORIENTED';

// ADD:
const stage = computeStage(exchangeCount);
```

3. **Update evaluation context mapping** (lines ~77-80):
```typescript
// Compute derived metrics from provenance
const computed = computeMetrics({
  version: 2,
  fieldId: 'grove',
  journeyCompletions: xstateContext.journeyCompletions,
  topicExplorations: xstateContext.topicExplorations,
  sproutCaptures: xstateContext.sproutCaptures,
  sessionCount: xstateContext.sessionCount,
  lastSessionAt: Date.now(),
});

return {
  ...base,
  stage,
  exchangeCount,
  journeysCompleted: computed.journeysCompleted,
  sproutsCaptured: computed.sproutsCaptured,
  topicsExplored: computed.topicsExplored,
  // ... rest unchanged
};
```

---

## EPIC 6: Tests

### File: `tests/unit/telemetry.test.ts` (CREATE)

```typescript
// NEW FILE
import { describe, it, expect } from 'vitest';
import {
  computeMetrics,
  type CumulativeMetricsV2,
} from '../../src/core/schema/telemetry';

describe('computeMetrics', () => {
  it('computes journeysCompleted from array length', () => {
    const metrics: CumulativeMetricsV2 = {
      version: 2,
      fieldId: 'grove',
      journeyCompletions: [
        { fieldId: 'grove', timestamp: 1, journeyId: 'a' },
        { fieldId: 'grove', timestamp: 2, journeyId: 'b' },
      ],
      topicExplorations: [],
      sproutCaptures: [],
      sessionCount: 1,
      lastSessionAt: Date.now(),
    };

    const computed = computeMetrics(metrics);
    expect(computed.journeysCompleted).toBe(2);
  });

  it('deduplicates topicsExplored by topicId', () => {
    const metrics: CumulativeMetricsV2 = {
      version: 2,
      fieldId: 'grove',
      journeyCompletions: [],
      topicExplorations: [
        { fieldId: 'grove', timestamp: 1, topicId: 'ratchet', hubId: 'hub1' },
        { fieldId: 'grove', timestamp: 2, topicId: 'ratchet', hubId: 'hub2' },
        { fieldId: 'grove', timestamp: 3, topicId: 'observer', hubId: 'hub1' },
      ],
      sproutCaptures: [],
      sessionCount: 1,
      lastSessionAt: Date.now(),
    };

    const computed = computeMetrics(metrics);
    expect(computed.topicsExplored).toEqual(['ratchet', 'observer']);
  });
});
```

### File: `tests/unit/stage-computation.test.ts` (CREATE)

```typescript
// NEW FILE
import { describe, it, expect } from 'vitest';
import {
  computeStage,
  DEFAULT_STAGE_THRESHOLDS,
} from '../../src/core/config/defaults';

describe('computeStage', () => {
  it('returns ARRIVAL for 0 exchanges', () => {
    expect(computeStage(0)).toBe('ARRIVAL');
  });

  it('returns ORIENTED for 1 exchange', () => {
    expect(computeStage(1)).toBe('ORIENTED');
  });

  it('returns EXPLORING for 3 exchanges', () => {
    expect(computeStage(3)).toBe('EXPLORING');
  });

  it('returns ENGAGED for 6 exchanges', () => {
    expect(computeStage(6)).toBe('ENGAGED');
  });

  it('returns ENGAGED for exchanges above threshold', () => {
    expect(computeStage(100)).toBe('ENGAGED');
  });

  it('respects custom thresholds', () => {
    const custom = {
      ARRIVAL: 0,
      ORIENTED: 5,
      EXPLORING: 10,
      ENGAGED: 20,
    };

    expect(computeStage(3, custom)).toBe('ARRIVAL');
    expect(computeStage(7, custom)).toBe('ORIENTED');
    expect(computeStage(15, custom)).toBe('EXPLORING');
    expect(computeStage(25, custom)).toBe('ENGAGED');
  });
});
```

---

## Execution Order

1. **EPIC 1:** Create schema and config (no dependencies)
2. **EPIC 2:** Update persistence layer (depends on EPIC 1)
3. **EPIC 3:** Update XState types (depends on EPIC 1)
4. **EPIC 4:** Update XState machine (depends on EPIC 1, 2, 3)
5. **EPIC 5:** Update hooks layer (depends on EPIC 1, 4)
6. **EPIC 6:** Create tests (depends on all)

---

## Rollback Plan

If issues occur:

1. **Storage rollback:** V1 data preserved, can revert getHydratedContextOverrides
2. **Type rollback:** Keep old properties as deprecated, add back later
3. **Config rollback:** Hardcode thresholds again if needed
