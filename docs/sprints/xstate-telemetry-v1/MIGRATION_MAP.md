# MIGRATION_MAP.md — File-by-File Change Plan

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29

---

## File Change Order

Execute in this order to maintain working state throughout:

| Order | File | Action | Dependencies |
|-------|------|--------|--------------|
| 1 | `types.ts` | Modify | None |
| 2 | `persistence.ts` | Modify | types.ts |
| 3 | `machine.ts` | Modify | types.ts |
| 4 | `context.tsx` | Modify | persistence.ts, machine.ts |
| 5 | `useMoments.ts` | Modify | context.tsx |
| 6 | Tests | Add/Update | All above |

---

## 1. types.ts

**Path:** `src/core/engagement/types.ts`

### Add Context Fields

```diff
 export interface EngagementContext {
   // Lens state
   lens: string | null;
   lensSource: 'url' | 'localStorage' | 'selection' | null;
+  hasCustomLens: boolean;

   // Journey state
   journey: import('../schema/journey').Journey | null;
   journeyProgress: number;
   journeyTotal: number;
+  journeysCompleted: number;

   // ... existing fields ...

+  // Session tracking
+  sessionStartedAt: number;
+  sessionCount: number;

+  // Cumulative metrics
+  sproutsCaptured: number;
+  topicsExplored: string[];
 }
```

### Add Initial Values

```diff
 export const initialContext: EngagementContext = {
   lens: null,
   lensSource: null,
+  hasCustomLens: false,
   journey: null,
   journeyProgress: 0,
   journeyTotal: 0,
+  journeysCompleted: 0,
   // ... existing ...
+  sessionStartedAt: Date.now(),
+  sessionCount: 1,
+  sproutsCaptured: 0,
+  topicsExplored: [],
 };
```

### Add Event Types

```diff
 export type EngagementEvent =
   | // ... existing events ...
+  // Session events
+  | { type: 'SESSION_STARTED' }
+  // Cumulative metric events
+  | { type: 'JOURNEY_COMPLETED_TRACKED' }
+  | { type: 'SPROUT_CAPTURED'; sproutId: string }
+  | { type: 'TOPIC_EXPLORED'; topicId: string }
+  // Telemetry events
+  | { type: 'MOMENT_SHOWN'; momentId: string; surface: string }
+  | { type: 'MOMENT_ACTIONED'; momentId: string; actionId: string; actionType: string }
+  | { type: 'MOMENT_DISMISSED'; momentId: string }
```

---

## 2. persistence.ts

**Path:** `src/core/engagement/persistence.ts`

### Add Storage Key

```diff
 export const STORAGE_KEYS = {
   lens: 'grove-lens',
   completedJourneys: 'grove-completed-journeys',
   journeyProgress: 'grove-journey-progress',
+  cumulativeMetrics: 'grove-telemetry-cumulative',
 } as const;
```

### Add Types

```typescript
export interface CumulativeMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  sessionCount: number;
  lastSessionAt: number;
}
```

### Add Functions

```typescript
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function getCumulativeMetrics(): CumulativeMetrics | null {
  if (!isBrowser()) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cumulativeMetrics);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCumulativeMetrics(metrics: CumulativeMetrics): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.cumulativeMetrics, JSON.stringify(metrics));
  } catch {
    console.warn('Failed to persist cumulative metrics');
  }
}

export function isNewSession(lastSessionAt: number | undefined): boolean {
  if (!lastSessionAt) return true;
  return Date.now() - lastSessionAt > SESSION_TIMEOUT_MS;
}
```

---

## 3. machine.ts

**Path:** `src/core/engagement/machine.ts`

### Add Actions

```typescript
// Add to actions object
incrementJourneysCompleted: assign({
  journeysCompleted: (ctx) => ctx.journeysCompleted + 1,
}),

incrementSproutsCaptured: assign({
  sproutsCaptured: (ctx) => ctx.sproutsCaptured + 1,
}),

addTopicExplored: assign({
  topicsExplored: (ctx, event) => {
    const topicId = (event as { topicId: string }).topicId;
    if (ctx.topicsExplored.includes(topicId)) return ctx.topicsExplored;
    return [...ctx.topicsExplored, topicId];
  },
}),

updateHasCustomLens: assign({
  hasCustomLens: (ctx) => isCustomLensId(ctx.lens),
}),

persistMetrics: (ctx) => {
  setCumulativeMetrics({
    journeysCompleted: ctx.journeysCompleted,
    sproutsCaptured: ctx.sproutsCaptured,
    topicsExplored: ctx.topicsExplored,
    sessionCount: ctx.sessionCount,
    lastSessionAt: Date.now(),
  });
},
```

### Add Event Handlers

```typescript
// In on: {} block for global events
'JOURNEY_COMPLETED_TRACKED': {
  actions: ['incrementJourneysCompleted', 'persistMetrics'],
},

'SPROUT_CAPTURED': {
  actions: ['incrementSproutsCaptured', 'persistMetrics'],
},

'TOPIC_EXPLORED': {
  actions: ['addTopicExplored', 'persistMetrics'],
},

'MOMENT_SHOWN': {
  actions: (ctx, event) => {
    console.log('[Telemetry] Moment shown:', event.momentId);
  },
},

'MOMENT_ACTIONED': {
  actions: (ctx, event) => {
    console.log('[Telemetry] Moment actioned:', event.momentId, event.actionId);
  },
},

'MOMENT_DISMISSED': {
  actions: (ctx, event) => {
    console.log('[Telemetry] Moment dismissed:', event.momentId);
  },
},
```

### Add Helper Function

```typescript
function isCustomLensId(lensId: string | null): boolean {
  if (!lensId) return false;
  // Custom lenses have 'custom-' prefix or are UUIDs
  return lensId.startsWith('custom-') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lensId);
}
```

---

## 4. context.tsx

**Path:** `src/core/engagement/context.tsx`

### Add Hydration

```typescript
// In createInitialContext or where actor is created

function getHydratedContext(): EngagementContext {
  const stored = getCumulativeMetrics();
  const base = { ...initialContext };

  if (stored) {
    const isNew = isNewSession(stored.lastSessionAt);
    return {
      ...base,
      journeysCompleted: stored.journeysCompleted,
      sproutsCaptured: stored.sproutsCaptured,
      topicsExplored: stored.topicsExplored,
      sessionCount: isNew ? stored.sessionCount + 1 : stored.sessionCount,
      sessionStartedAt: Date.now(),
    };
  }

  return {
    ...base,
    sessionStartedAt: Date.now(),
    sessionCount: 1,
  };
}
```

### Update Actor Creation

```diff
- const actor = createActor(engagementMachine);
+ const actor = createActor(engagementMachine.withContext(getHydratedContext()));
```

---

## 5. useMoments.ts

**Path:** `src/surface/hooks/useMoments.ts`

### Remove Import

```diff
- import { useEngagementEmit } from '../../../hooks/useEngagementBus';
```

### Remove Hook Usage

```diff
  const { actor } = useEngagement();
- const emit = useEngagementEmit();
```

### Update Telemetry Calls

```diff
  // Line ~103
- emit.momentShown(activeMoment.meta.id, surface);
+ actor.send({ type: 'MOMENT_SHOWN', momentId: activeMoment.meta.id, surface });

  // Line ~130
- emit.momentActioned(momentId, actionId, action.type);
+ actor.send({ type: 'MOMENT_ACTIONED', momentId, actionId, actionType: action.type });

  // Line ~153
- emit.momentDismissed(momentId);
+ actor.send({ type: 'MOMENT_DISMISSED', momentId });
```

### Update Context Mapping

```diff
  const evaluationContext = useMemo((): MomentEvaluationContext => {
    const base = createDefaultEvaluationContext();
    const exchangeCount = xstateContext.streamHistory.filter(item => item.type === 'query').length;

    let stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED' = 'ARRIVAL';
    if (exchangeCount >= 6) stage = 'ENGAGED';
    else if (exchangeCount >= 3) stage = 'EXPLORING';
    else if (exchangeCount >= 1) stage = 'ORIENTED';

+   const minutesActive = Math.floor((Date.now() - xstateContext.sessionStartedAt) / 60000);

    return {
      ...base,
      stage,
      exchangeCount,
-     journeysCompleted: xstateContext.journey ? 1 : 0,
+     journeysCompleted: xstateContext.journeysCompleted,
-     sproutsCaptured: 0,
+     sproutsCaptured: xstateContext.sproutsCaptured,
+     topicsExplored: xstateContext.topicsExplored,
      entropy: xstateContext.entropy,
+     minutesActive,
+     sessionCount: xstateContext.sessionCount,
      activeLens: xstateContext.lens,
      activeJourney: xstateContext.journey?.id || null,
-     hasCustomLens: false,
+     hasCustomLens: xstateContext.hasCustomLens,
      flags: xstateContext.flags,
      momentCooldowns: xstateContext.momentCooldowns,
    };
  }, [xstateContext]);
```

---

## Rollback Plan

If issues arise:

1. **Revert useMoments.ts changes** — Restore engagement bus import
2. **Keep XState additions** — They don't break existing behavior
3. **Debug persistence** — Check localStorage for corrupted data

---

## Verification Commands

```bash
# After each file change
npm run build    # Must compile

# After types.ts
npm run typecheck  # Types must validate

# After all changes
npm test
npx playwright test tests/e2e/engagement*.spec.ts

# Verify no engagement bus in useMoments
grep -n "useEngagementBus" src/surface/hooks/useMoments.ts
# Should return empty
```
