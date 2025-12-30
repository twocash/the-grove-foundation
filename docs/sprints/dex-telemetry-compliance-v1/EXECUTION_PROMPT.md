# EXECUTION_PROMPT.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Status:** Ready for Execution
**Created:** 2025-12-29

---

## Mission

Remediate DEX (Declarative Exploration) violations introduced in xstate-telemetry-v1:
1. **Declarative Sovereignty (C+ → A):** Extract hardcoded stage thresholds to config
2. **Provenance (B- → A):** Add attribution chains to cumulative metrics
3. **Organic Scalability (A- → A):** Add Field namespacing for multi-Field support

---

## Context Files to Read First

Before executing, read these files to understand current state:

1. `src/core/engagement/types.ts` - Current context shape
2. `src/core/engagement/persistence.ts` - Current storage layer
3. `src/core/engagement/machine.ts` - Current XState machine
4. `src/surface/hooks/useMoments.ts` - Hardcoded thresholds location
5. `src/core/config/defaults.ts` - Where config should go

---

## EPIC 1: Schema & Config

### Task 1.1: Create Telemetry Schema

Create file `src/core/schema/telemetry.ts`:

```typescript
// src/core/schema/telemetry.ts
// Sprint: dex-telemetry-compliance-v1
// DEX Pillar: Provenance as Infrastructure

/**
 * Base attribution for all telemetry metrics
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
 * V2 cumulative metrics with full provenance chain
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
 * Computed metrics derived from provenance arrays
 */
export interface ComputedMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
}

/**
 * Compute derived metrics from provenance data
 */
export function computeMetrics(metrics: CumulativeMetricsV2): ComputedMetrics {
  return {
    journeysCompleted: metrics.journeyCompletions.length,
    sproutsCaptured: metrics.sproutCaptures.length,
    topicsExplored: [...new Set(metrics.topicExplorations.map(t => t.topicId))],
  };
}
```

### Task 1.2: Add Stage Config

Add to `src/core/config/defaults.ts` (at end of file):

```typescript
// Sprint: dex-telemetry-compliance-v1
// DEX Pillar: Declarative Sovereignty

/**
 * Declarative stage thresholds for engagement progression
 * These define how many exchanges are needed to reach each stage
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
 * Uses declarative thresholds instead of hardcoded values
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

### Task 2.1: Update `src/core/engagement/persistence.ts`

**Add imports at top:**
```typescript
import type {
  CumulativeMetricsV2,
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
```

**Add constant after imports:**
```typescript
// Default Field ID for single-Field deployments
const DEFAULT_FIELD_ID = 'grove';
```

**Update STORAGE_KEYS (add new key):**
```typescript
export const STORAGE_KEYS = {
  lens: 'grove-lens',
  completedJourneys: 'grove-completed-journeys',
  journeyProgress: 'grove-journey-progress',
  cumulativeMetrics: 'grove-telemetry-cumulative',
  cumulativeMetricsV2: (fieldId: string = DEFAULT_FIELD_ID) =>
    `grove-telemetry-${fieldId}-cumulative-v2`,
} as const;
```

**Add V2 functions after existing CumulativeMetrics functions:**
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

**Update HydratedContextOverrides interface:**
```typescript
export interface HydratedContextOverrides {
  sessionStartedAt: number;
  sessionCount: number;
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];
}
```

**Update getHydratedContextOverrides function:**
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

### Task 3.1: Update `src/core/engagement/types.ts`

**Add import:**
```typescript
import type {
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
```

**Replace in EngagementContext (around lines 43-46):**

REMOVE:
```typescript
journeysCompleted: number;
sproutsCaptured: number;
topicsExplored: string[];
```

ADD:
```typescript
// Cumulative metrics with provenance (Sprint: dex-telemetry-compliance-v1)
journeyCompletions: JourneyCompletion[];
topicExplorations: TopicExploration[];
sproutCaptures: SproutCapture[];
```

**Update initialContext (around lines 73-76):**

REMOVE:
```typescript
journeysCompleted: 0,
sproutsCaptured: 0,
topicsExplored: [],
```

ADD:
```typescript
journeyCompletions: [],
topicExplorations: [],
sproutCaptures: [],
```

**Update EngagementEvent types (around lines 110-113):**

CHANGE:
```typescript
| { type: 'JOURNEY_COMPLETED_TRACKED'; journeyId: string; durationMs?: number }
| { type: 'SPROUT_CAPTURED'; sproutId: string; journeyId?: string; hubId?: string }
| { type: 'TOPIC_EXPLORED'; topicId: string; hubId: string }
```

---

## EPIC 4: XState Machine

### Task 4.1: Update `src/core/engagement/machine.ts`

**Add imports:**
```typescript
import type {
  JourneyCompletion,
  TopicExploration,
  SproutCapture,
} from '../schema/telemetry';
import { setCumulativeMetricsV2 } from './persistence';
```

**Add constant after imports:**
```typescript
const DEFAULT_FIELD_ID = 'grove';
```

**Replace action definitions (around lines 243-255):**

REMOVE:
```typescript
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
```

ADD:
```typescript
// Sprint: dex-telemetry-compliance-v1 - Provenance-tracked metrics
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

**Update persistMetrics action:**
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

**Update event handlers (around lines 419-427):**
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

### Task 5.1: Update `src/surface/hooks/useMoments.ts`

**Add imports:**
```typescript
import { computeStage } from '@core/config/defaults';
import { computeMetrics, type CumulativeMetricsV2 } from '@core/schema/telemetry';
```

**Replace stage computation (around lines 65-68):**

REMOVE:
```typescript
let stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED' = 'ARRIVAL';
if (exchangeCount >= 6) stage = 'ENGAGED';
else if (exchangeCount >= 3) stage = 'EXPLORING';
else if (exchangeCount >= 1) stage = 'ORIENTED';
```

ADD:
```typescript
const stage = computeStage(exchangeCount);
```

**Update evaluation context mapping (around lines 74-89):**

REPLACE the entire useMemo return with:
```typescript
const evaluationContext = useMemo((): MomentEvaluationContext => {
  const base = createDefaultEvaluationContext();
  const exchangeCount = xstateContext.streamHistory.filter(item => item.type === 'query').length;
  const stage = computeStage(exchangeCount);
  const minutesActive = Math.floor((Date.now() - xstateContext.sessionStartedAt) / 60000);

  // Sprint: dex-telemetry-compliance-v1 - Compute metrics from provenance
  const metricsV2: CumulativeMetricsV2 = {
    version: 2,
    fieldId: 'grove',
    journeyCompletions: xstateContext.journeyCompletions,
    topicExplorations: xstateContext.topicExplorations,
    sproutCaptures: xstateContext.sproutCaptures,
    sessionCount: xstateContext.sessionCount,
    lastSessionAt: Date.now(),
  };
  const computed = computeMetrics(metricsV2);

  return {
    ...base,
    stage,
    exchangeCount,
    journeysCompleted: computed.journeysCompleted,
    sproutsCaptured: computed.sproutsCaptured,
    topicsExplored: computed.topicsExplored,
    entropy: xstateContext.entropy,
    minutesActive,
    sessionCount: xstateContext.sessionCount,
    activeLens: xstateContext.lens,
    activeJourney: xstateContext.journey?.id || null,
    hasCustomLens: xstateContext.hasCustomLens,
    flags: xstateContext.flags,
    momentCooldowns: xstateContext.momentCooldowns,
  };
}, [xstateContext]);
```

---

## EPIC 6: Tests

### Task 6.1: Create `tests/unit/telemetry.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computeMetrics, type CumulativeMetricsV2 } from '../../src/core/schema/telemetry';

describe('computeMetrics', () => {
  const createMetrics = (overrides: Partial<CumulativeMetricsV2> = {}): CumulativeMetricsV2 => ({
    version: 2,
    fieldId: 'grove',
    journeyCompletions: [],
    topicExplorations: [],
    sproutCaptures: [],
    sessionCount: 1,
    lastSessionAt: Date.now(),
    ...overrides,
  });

  it('computes journeysCompleted from array length', () => {
    const metrics = createMetrics({
      journeyCompletions: [
        { fieldId: 'grove', timestamp: 1, journeyId: 'a' },
        { fieldId: 'grove', timestamp: 2, journeyId: 'b' },
      ],
    });
    expect(computeMetrics(metrics).journeysCompleted).toBe(2);
  });

  it('computes sproutsCaptured from array length', () => {
    const metrics = createMetrics({
      sproutCaptures: [
        { fieldId: 'grove', timestamp: 1, sproutId: 'x' },
        { fieldId: 'grove', timestamp: 2, sproutId: 'y' },
        { fieldId: 'grove', timestamp: 3, sproutId: 'z' },
      ],
    });
    expect(computeMetrics(metrics).sproutsCaptured).toBe(3);
  });

  it('deduplicates topicsExplored by topicId', () => {
    const metrics = createMetrics({
      topicExplorations: [
        { fieldId: 'grove', timestamp: 1, topicId: 'ratchet', hubId: 'hub1' },
        { fieldId: 'grove', timestamp: 2, topicId: 'ratchet', hubId: 'hub2' },
        { fieldId: 'grove', timestamp: 3, topicId: 'observer', hubId: 'hub1' },
      ],
    });
    expect(computeMetrics(metrics).topicsExplored).toEqual(['ratchet', 'observer']);
  });

  it('returns empty arrays for empty metrics', () => {
    const metrics = createMetrics();
    const computed = computeMetrics(metrics);
    expect(computed.journeysCompleted).toBe(0);
    expect(computed.sproutsCaptured).toBe(0);
    expect(computed.topicsExplored).toEqual([]);
  });
});
```

### Task 6.2: Create `tests/unit/stage-computation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computeStage, DEFAULT_STAGE_THRESHOLDS } from '../../src/core/config/defaults';

describe('computeStage', () => {
  it('returns ARRIVAL for 0 exchanges', () => {
    expect(computeStage(0)).toBe('ARRIVAL');
  });

  it('returns ORIENTED for 1 exchange', () => {
    expect(computeStage(1)).toBe('ORIENTED');
  });

  it('returns ORIENTED for 2 exchanges', () => {
    expect(computeStage(2)).toBe('ORIENTED');
  });

  it('returns EXPLORING for 3 exchanges', () => {
    expect(computeStage(3)).toBe('EXPLORING');
  });

  it('returns EXPLORING for 5 exchanges', () => {
    expect(computeStage(5)).toBe('EXPLORING');
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
    } as typeof DEFAULT_STAGE_THRESHOLDS;

    expect(computeStage(0, custom)).toBe('ARRIVAL');
    expect(computeStage(3, custom)).toBe('ARRIVAL');
    expect(computeStage(5, custom)).toBe('ORIENTED');
    expect(computeStage(7, custom)).toBe('ORIENTED');
    expect(computeStage(10, custom)).toBe('EXPLORING');
    expect(computeStage(15, custom)).toBe('EXPLORING');
    expect(computeStage(20, custom)).toBe('ENGAGED');
    expect(computeStage(25, custom)).toBe('ENGAGED');
  });
});
```

---

## Verification

After completing all EPICs, run:

```bash
npm run build
npm run test
```

Expected:
- Build succeeds with no TypeScript errors
- All tests pass (365+ tests, including 2 new test files)

---

## Success Criteria

| Criterion | Verification |
|-----------|--------------|
| No hardcoded thresholds | Grep for `>= 6` in useMoments.ts returns nothing |
| Provenance arrays in context | `EngagementContext` has `journeyCompletions[]` |
| V2 storage with Field | localStorage key contains `grove-telemetry-grove-cumulative-v2` |
| computeMetrics used | Import in useMoments.ts |
| computeStage used | Import in useMoments.ts |
| Tests pass | `npm run test` shows 365+ passing |

---

## DEX Grade After Completion

| Pillar | Grade |
|--------|-------|
| Declarative Sovereignty | A |
| Provenance as Infrastructure | A |
| Capability Agnosticism | A |
| Organic Scalability | A |
