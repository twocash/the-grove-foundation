# ARCHITECTURE.md — Target State Design

**Sprint:** xstate-telemetry-v1
**Date:** 2024-12-29

---

## Target State Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    XSTATE ENGAGEMENT CONTEXT                        │
├────────────────────────────────────────────────────────────────────┤
│  Session Metrics (per session, computed)                           │
│  ├── sessionStartedAt: number (timestamp)                          │
│  ├── minutesActive: derived from sessionStartedAt                  │
│  └── stage: derived from exchangeCount + other signals             │
├────────────────────────────────────────────────────────────────────┤
│  Cumulative Metrics (persisted across sessions)                    │
│  ├── journeysCompleted: number                                     │
│  ├── sproutsCaptured: number                                       │
│  ├── topicsExplored: string[]                                      │
│  └── sessionCount: number                                          │
├────────────────────────────────────────────────────────────────────┤
│  Detection Metrics                                                  │
│  └── hasCustomLens: boolean (derived from lens ID pattern)         │
├────────────────────────────────────────────────────────────────────┤
│  Existing Fields (unchanged)                                        │
│  ├── lens, lensSource, journey, journeyProgress...                 │
│  ├── entropy, entropyThreshold                                      │
│  ├── flags, momentCooldowns                                        │
│  └── streamHistory, currentStreamItem...                           │
└────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                                │
├────────────────────────────────────────────────────────────────────┤
│  localStorage Keys:                                                 │
│  ├── grove-lens (existing)                                         │
│  ├── grove-completed-journeys (existing, array of IDs)             │
│  ├── grove-telemetry-cumulative (NEW)                              │
│  │   {                                                              │
│  │     journeysCompleted: number,                                   │
│  │     sproutsCaptured: number,                                     │
│  │     topicsExplored: string[],                                    │
│  │     sessionCount: number,                                        │
│  │     lastSessionAt: number                                        │
│  │   }                                                              │
│  └── grove-journey-progress (existing)                              │
└────────────────────────────────────────────────────────────────────┘
```

---

## New Context Fields

```typescript
// Add to EngagementContext in types.ts

interface EngagementContext {
  // ... existing fields ...

  // Session tracking (new)
  sessionStartedAt: number;  // Timestamp when session began
  sessionCount: number;      // Total sessions (persisted)

  // Cumulative metrics (new, persisted)
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];

  // Detection (new)
  hasCustomLens: boolean;
}
```

---

## New Events

```typescript
// Add to EngagementEvent union in types.ts

type EngagementEvent =
  | // ... existing events ...

  // Session events
  | { type: 'SESSION_STARTED' }

  // Cumulative metric events
  | { type: 'JOURNEY_COMPLETED_TRACKED' }  // Distinct from COMPLETE_JOURNEY
  | { type: 'SPROUT_CAPTURED'; sproutId: string }
  | { type: 'TOPIC_EXPLORED'; topicId: string }

  // Telemetry events (replacing Engagement Bus)
  | { type: 'MOMENT_SHOWN'; momentId: string; surface: string }
  | { type: 'MOMENT_ACTIONED'; momentId: string; actionId: string; actionType: string }
  | { type: 'MOMENT_DISMISSED'; momentId: string }
```

---

## New Actions

```typescript
// Add to machine.ts

const engagementMachine = createMachine({
  // ...
  actions: {
    // Session tracking
    initSession: assign({
      sessionStartedAt: () => Date.now(),
    }),

    incrementSessionCount: assign({
      sessionCount: (ctx) => ctx.sessionCount + 1,
    }),

    // Cumulative metrics
    incrementJourneysCompleted: assign({
      journeysCompleted: (ctx) => ctx.journeysCompleted + 1,
    }),

    incrementSproutsCaptured: assign({
      sproutsCaptured: (ctx) => ctx.sproutsCaptured + 1,
    }),

    addTopicExplored: assign({
      topicsExplored: (ctx, event) => {
        if (ctx.topicsExplored.includes(event.topicId)) return ctx.topicsExplored;
        return [...ctx.topicsExplored, event.topicId];
      },
    }),

    // Custom lens detection
    detectCustomLens: assign({
      hasCustomLens: (ctx) => isCustomLensId(ctx.lens),
    }),

    // Telemetry logging (side effect)
    logMomentShown: (ctx, event) => {
      console.log('[Telemetry] Moment shown:', event.momentId, event.surface);
    },

    logMomentActioned: (ctx, event) => {
      console.log('[Telemetry] Moment actioned:', event.momentId, event.actionId);
    },

    logMomentDismissed: (ctx, event) => {
      console.log('[Telemetry] Moment dismissed:', event.momentId);
    },

    // Persistence
    persistCumulativeMetrics: (ctx) => {
      persistCumulativeMetrics({
        journeysCompleted: ctx.journeysCompleted,
        sproutsCaptured: ctx.sproutsCaptured,
        topicsExplored: ctx.topicsExplored,
        sessionCount: ctx.sessionCount,
      });
    },
  },
});
```

---

## Computed Values

### minutesActive

Not stored in context. Computed on-demand from `sessionStartedAt`:

```typescript
// In useMoments.ts or a selector
const minutesActive = Math.floor((Date.now() - ctx.sessionStartedAt) / 60000);
```

### stage

Computed from `exchangeCount` and potentially other signals:

```typescript
function computeStage(ctx: EngagementContext): TriggerStage {
  const exchangeCount = ctx.streamHistory.filter(i => i.type === 'query').length;

  if (exchangeCount >= 6) return 'ENGAGED';
  if (exchangeCount >= 3) return 'EXPLORING';
  if (exchangeCount >= 1) return 'ORIENTED';
  return 'ARRIVAL';
}
```

---

## Hydration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    CONTEXT HYDRATION ON MOUNT                     │
└──────────────────────────────────────────────────────────────────┘

1. EngagementProvider mounts
   │
2. Check localStorage for 'grove-telemetry-cumulative'
   │
3. If exists and valid:
   │  ├── Parse JSON
   │  ├── Check if new session (> 30min since lastSessionAt)
   │  │   ├── If new: increment sessionCount
   │  │   └── If continuing: keep sessionCount
   │  └── Hydrate context with persisted values
   │
4. If not exists:
   │  └── Use initialContext defaults (all zeros)
   │
5. Set sessionStartedAt = Date.now()
   │
6. Send SESSION_STARTED event
```

---

## Persistence Format

```typescript
// New storage key
const STORAGE_KEYS = {
  // ... existing ...
  cumulativeMetrics: 'grove-telemetry-cumulative',
}

interface CumulativeMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  sessionCount: number;
  lastSessionAt: number;  // For session timeout detection
}
```

---

## useMoments.ts Changes

```diff
- import { useEngagementEmit } from '../../../hooks/useEngagementBus';
+ // No engagement bus import

// In executeAction callback:
- emit.momentActioned(momentId, actionId, action.type);
+ actor.send({ type: 'MOMENT_ACTIONED', momentId, actionId, actionType: action.type });

// In dismissMoment callback:
- emit.momentDismissed(momentId);
+ actor.send({ type: 'MOMENT_DISMISSED', momentId });

// In useEffect for tracking shown:
- emit.momentShown(activeMoment.meta.id, surface);
+ actor.send({ type: 'MOMENT_SHOWN', momentId: activeMoment.meta.id, surface });
```

---

## DEX Compliance

- **Declarative Sovereignty:** Metrics tracked in context; moment triggers remain in JSON schema
- **Capability Agnosticism:** Telemetry works regardless of AI model
- **Provenance:** All metrics include session attribution via sessionStartedAt
- **Organic Scalability:** New metrics added to context; no restructuring needed
