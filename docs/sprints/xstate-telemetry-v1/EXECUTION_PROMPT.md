# EXECUTION_PROMPT.md — Self-Contained Handoff

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29

---

## Mission

Close telemetry gaps by adding missing metrics to XState context with localStorage persistence. Remove Engagement Bus dependency from useMoments.ts.

## Project Location

```
C:\GitHub\the-grove-foundation
```

## Pre-Flight Checks

```bash
cd C:\GitHub\the-grove-foundation
npm run build    # Must pass
npm test         # Must pass
```

---

## EPIC 1: Extend XState Types

### File: `src/core/engagement/types.ts`

Add these fields to `EngagementContext` interface (after existing fields):

```typescript
  // Session tracking (Sprint: xstate-telemetry-v1)
  sessionStartedAt: number;
  sessionCount: number;

  // Cumulative metrics (Sprint: xstate-telemetry-v1)
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];

  // Detection (Sprint: xstate-telemetry-v1)
  hasCustomLens: boolean;
```

Add to `initialContext`:

```typescript
  // Session tracking (Sprint: xstate-telemetry-v1)
  sessionStartedAt: Date.now(),
  sessionCount: 1,
  // Cumulative metrics (Sprint: xstate-telemetry-v1)
  journeysCompleted: 0,
  sproutsCaptured: 0,
  topicsExplored: [],
  // Detection (Sprint: xstate-telemetry-v1)
  hasCustomLens: false,
```

Add to `EngagementEvent` union (before the closing semicolon):

```typescript
  // Session events (Sprint: xstate-telemetry-v1)
  | { type: 'SESSION_STARTED' }
  // Cumulative metric events (Sprint: xstate-telemetry-v1)
  | { type: 'JOURNEY_COMPLETED_TRACKED' }
  | { type: 'SPROUT_CAPTURED'; sproutId: string }
  | { type: 'TOPIC_EXPLORED'; topicId: string }
  // Telemetry events (Sprint: xstate-telemetry-v1)
  | { type: 'MOMENT_SHOWN'; momentId: string; surface: string }
  | { type: 'MOMENT_ACTIONED'; momentId: string; actionId: string; actionType: string }
  | { type: 'MOMENT_DISMISSED'; momentId: string };
```

**Verify:** `npm run typecheck`

---

## EPIC 2: Extend Persistence Layer

### File: `src/core/engagement/persistence.ts`

Add to `STORAGE_KEYS`:

```typescript
  cumulativeMetrics: 'grove-telemetry-cumulative',
```

Add after existing types:

```typescript
// Sprint: xstate-telemetry-v1
export interface CumulativeMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  sessionCount: number;
  lastSessionAt: number;
}

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
    console.warn('[Persistence] Failed to persist cumulative metrics');
  }
}

export function isNewSession(lastSessionAt: number | undefined): boolean {
  if (!lastSessionAt) return true;
  return Date.now() - lastSessionAt > SESSION_TIMEOUT_MS;
}
```

**Verify:** `npm run typecheck`

---

## EPIC 3: Extend XState Machine

### File: `src/core/engagement/machine.ts`

Add import at top:

```typescript
import { setCumulativeMetrics } from './persistence';
```

Add helper function (before machine definition):

```typescript
// Sprint: xstate-telemetry-v1
function isCustomLensId(lensId: string | null): boolean {
  if (!lensId) return false;
  return lensId.startsWith('custom-') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lensId);
}
```

Add to `actions` object in machine definition:

```typescript
    // Sprint: xstate-telemetry-v1 - Cumulative metrics
    incrementJourneysCompleted: assign({
      journeysCompleted: (ctx) => ctx.journeysCompleted + 1,
    }),

    incrementSproutsCaptured: assign({
      sproutsCaptured: (ctx) => ctx.sproutsCaptured + 1,
    }),

    addTopicExplored: assign({
      topicsExplored: (ctx, event) => {
        const e = event as { topicId: string };
        if (ctx.topicsExplored.includes(e.topicId)) return ctx.topicsExplored;
        return [...ctx.topicsExplored, e.topicId];
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

Add event handlers to the `on:` block (global events):

```typescript
      // Sprint: xstate-telemetry-v1 - Cumulative metric events
      JOURNEY_COMPLETED_TRACKED: {
        actions: ['incrementJourneysCompleted', 'persistMetrics'],
      },
      SPROUT_CAPTURED: {
        actions: ['incrementSproutsCaptured', 'persistMetrics'],
      },
      TOPIC_EXPLORED: {
        actions: ['addTopicExplored', 'persistMetrics'],
      },
      // Sprint: xstate-telemetry-v1 - Telemetry events (logging only)
      MOMENT_SHOWN: {
        actions: (_, event) => {
          const e = event as { momentId: string; surface: string };
          console.log('[Telemetry] Moment shown:', e.momentId, e.surface);
        },
      },
      MOMENT_ACTIONED: {
        actions: (_, event) => {
          const e = event as { momentId: string; actionId: string; actionType: string };
          console.log('[Telemetry] Moment actioned:', e.momentId, e.actionId, e.actionType);
        },
      },
      MOMENT_DISMISSED: {
        actions: (_, event) => {
          const e = event as { momentId: string };
          console.log('[Telemetry] Moment dismissed:', e.momentId);
        },
      },
```

Update the `SELECT_LENS` handler to also run `updateHasCustomLens`:

```typescript
      SELECT_LENS: {
        actions: ['setLens', 'persistLens', 'updateHasCustomLens'],
      },
```

**Verify:** `npm run typecheck && npm run build`

---

## EPIC 4: Add Context Hydration

### File: `src/core/engagement/context.tsx`

Add imports:

```typescript
import { getCumulativeMetrics, isNewSession } from './persistence';
```

Add hydration function (before provider component):

```typescript
// Sprint: xstate-telemetry-v1
function getHydratedContext(): EngagementContext {
  if (typeof window === 'undefined') {
    return { ...initialContext, sessionStartedAt: Date.now() };
  }

  const stored = getCumulativeMetrics();

  if (stored) {
    const isNew = isNewSession(stored.lastSessionAt);
    return {
      ...initialContext,
      journeysCompleted: stored.journeysCompleted,
      sproutsCaptured: stored.sproutsCaptured,
      topicsExplored: stored.topicsExplored,
      sessionCount: isNew ? stored.sessionCount + 1 : stored.sessionCount,
      sessionStartedAt: Date.now(),
    };
  }

  return {
    ...initialContext,
    sessionStartedAt: Date.now(),
    sessionCount: 1,
  };
}
```

Update actor creation to use hydrated context. Find where `createActor` is called and update:

```typescript
// Before
const actor = createActor(engagementMachine);

// After
const actor = createActor(engagementMachine.withContext(getHydratedContext()));
```

**Verify:** `npm run build && npm test`

---

## EPIC 5: Migrate useMoments.ts

### File: `src/surface/hooks/useMoments.ts`

**Step 1:** Remove Engagement Bus import

```diff
- import { useEngagementEmit } from '../../../hooks/useEngagementBus';
```

**Step 2:** Remove hook usage

```diff
  const { actor } = useEngagement();
- const emit = useEngagementEmit();
```

**Step 3:** Update useEffect for moment shown (around line 100-105)

```diff
  useEffect(() => {
    if (activeMoment) {
-     emit.momentShown(activeMoment.meta.id, surface);
+     actor.send({ type: 'MOMENT_SHOWN', momentId: activeMoment.meta.id, surface });
    }
- }, [activeMoment?.meta.id, surface, emit]);
+ }, [activeMoment?.meta.id, surface, actor]);
```

**Step 4:** Update executeAction callback (around line 130)

```diff
-   emit.momentActioned(momentId, actionId, action.type);
+   actor.send({ type: 'MOMENT_ACTIONED', momentId, actionId, actionType: action.type });
```

**Step 5:** Update dismissMoment callback (around line 153)

```diff
-     emit.momentDismissed(momentId);
+     actor.send({ type: 'MOMENT_DISMISSED', momentId });
```

**Step 6:** Update evaluationContext mapping (in useMemo around line 62-80)

Replace the entire return block in the useMemo:

```typescript
    const minutesActive = Math.floor((Date.now() - xstateContext.sessionStartedAt) / 60000);

    return {
      ...base,
      stage,
      exchangeCount,
      journeysCompleted: xstateContext.journeysCompleted,
      sproutsCaptured: xstateContext.sproutsCaptured,
      topicsExplored: xstateContext.topicsExplored,
      entropy: xstateContext.entropy,
      minutesActive,
      sessionCount: xstateContext.sessionCount,
      activeLens: xstateContext.lens,
      activeJourney: xstateContext.journey?.id || null,
      hasCustomLens: xstateContext.hasCustomLens,
      flags: xstateContext.flags,
      momentCooldowns: xstateContext.momentCooldowns,
    };
```

**Verify:**
```bash
npm run typecheck
npm run build
grep -n "useEngagementBus" src/surface/hooks/useMoments.ts  # Should return empty
```

---

## Final Verification

```bash
# All must pass
npm run build
npm test
npx playwright test

# Verify no engagement bus in useMoments
grep -rn "useEngagementBus" src/surface/hooks/useMoments.ts
# Expected: no output
```

## Manual Testing

1. Open http://localhost:3000/terminal
2. Complete a journey
3. Open DevTools → Application → localStorage
4. Find `grove-telemetry-cumulative`
5. Verify `journeysCompleted` is 1
6. Reload page
7. Verify value persists

---

## Troubleshooting

### Type errors after types.ts changes
- Ensure all new fields are in both interface AND initialContext
- Run `npm run typecheck` after each file

### Context hydration breaks SSR
- Ensure `getHydratedContext` checks `typeof window === 'undefined'`
- Return initialContext with Date.now() for server

### Moments stop triggering
- Check console for XState errors
- Verify actor.send is called with correct event structure
- Temporarily restore engagement bus to verify

### localStorage not updating
- Check browser console for persistence warnings
- Verify `setCumulativeMetrics` is being called (add console.log)
- Clear localStorage and retry
