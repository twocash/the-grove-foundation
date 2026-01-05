# Architecture: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Date:** January 4, 2026

---

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Explore Route Components                           │
│                                                                              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                   │
│   │  ChatWindow  │   │  LensPicker  │   │  JourneyNav  │   ...             │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                   │
│          │                  │                  │                            │
│          └──────────────────┼──────────────────┘                            │
│                             │                                                │
│                             ▼                                                │
│                    ┌─────────────────┐                                      │
│                    │  useEventBridge │  ← Thin routing layer                │
│                    └────────┬────────┘                                      │
│                             │                                                │
│          ┌──────────────────┼──────────────────┐                            │
│          │                                     │                            │
│          ▼                                     ▼                            │
│   ┌──────────────┐                    ┌──────────────┐                     │
│   │useEventHelpers│                    │useLegacyBridge│                    │
│   └──────┬───────┘                    └──────┬───────┘                     │
│          │                                   │                              │
│          ▼                                   ▼                              │
│   ┌──────────────────┐              ┌──────────────────┐                   │
│   │ GroveEventProvider│              │EngagementBus    │                   │
│   │ (new system)      │              │(legacy, deprecated)│                │
│   └──────────────────┘              └──────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Layer 1: Components

Components (ChatWindow, LensPicker, JourneyNav) care about:
- User interactions
- Business logic
- UI rendering

They **don't know** which event system is active. They call `useEventBridge().emit.*` and trust the routing.

### Layer 2: Event Bridge

`useEventBridge` is a **thin routing layer**:
- Checks feature flag
- Routes to new system if enabled
- Always routes to legacy (dual-write)
- **Never creates raw event objects**

```typescript
// CORRECT: Delegate to typed helpers
emit.lensActivated = (lensId, source, isCustom) => {
  if (isEnabled) typedEmit.lensActivated(lensId, source, isCustom);
  legacy.onLensActivated(lensId, isCustom);
};

// WRONG: Create events directly
emit.lensActivated = (lensId, source, isCustom) => {
  dispatch({ type: 'LENS_ACTIVATED', ... });  // ❌ Schema drift risk
};
```

### Layer 3: System Hooks

**useEventHelpers (Sprint 2):**
- Creates properly typed events
- Validates via Zod schema
- Dispatches to GroveEventProvider

**useLegacyBridge (new):**
- Translates to legacy format
- Fires on legacy bus
- Isolated for deprecation

### Layer 4: Providers

**GroveEventProvider:**
- Event log state management
- localStorage persistence
- V2 → V3 migration

**EngagementBus (legacy):**
- XState-based telemetry
- Being deprecated
- Receives translated events

---

## Data Flow

### New System Enabled

```
Component
    │
    ├── emit.querySubmitted('q-1', 'What is Grove?', 'explore')
    │
    ▼
useEventBridge
    │
    ├──► useEventHelpers.emit.querySubmitted(...)
    │       │
    │       ├── Create QUERY_SUBMITTED event
    │       ├── Zod.parse() validates
    │       └── dispatch() to provider
    │
    └──► useLegacyBridge.onQuerySubmitted(...)
            │
            └── emit('EXCHANGE_SENT', { query, responseLength: 0 })
```

### New System Disabled

```
Component
    │
    ├── emit.querySubmitted('q-1', 'What is Grove?', 'explore')
    │
    ▼
useEventBridge
    │
    ├──► useEventHelpers → SKIPPED (flag off)
    │
    └──► useLegacyBridge.onQuerySubmitted(...)
            │
            └── emit('EXCHANGE_SENT', { query, responseLength: 0 })
```

---

## Event Translation Map

How new events map to legacy events:

| New Event | Legacy Event | Translation |
|-----------|--------------|-------------|
| `SESSION_STARTED` | *(none)* | No legacy equivalent |
| `QUERY_SUBMITTED` | `EXCHANGE_SENT` | `{ query: content }` |
| `RESPONSE_COMPLETED` | `CARD_VISITED` | If hubId present |
| `LENS_ACTIVATED` | `LENS_SELECTED` | `{ lensId, isCustom }` |
| `HUB_ENTERED` | `TOPIC_EXPLORED` + `HUB_VISITED` | Dual emit |
| `JOURNEY_STARTED` | `JOURNEY_STARTED` | `{ lensId, threadLength }` |
| `JOURNEY_COMPLETED` | `JOURNEY_COMPLETED` | `{ durationMinutes, cardsVisited }` |
| `INSIGHT_CAPTURED` | `SPROUT_CAPTURED` | `{ sproutId }` |

---

## Feature Flag Behavior

### Flag: `grove-event-system`

| State | New System | Legacy System | Provider |
|-------|------------|---------------|----------|
| `false` (default) | Off | On | Not wrapped |
| `true` | On | On (dual-write) | Wrapped |

### Override Mechanisms

1. **URL param:** `?grove-events=true`
2. **localStorage:** `grove-event-system-override=true`
3. **Admin panel:** Flag in narratives-schema

### Check Order

```typescript
function checkLocalOverride(): boolean {
  // 1. URL param (highest priority - for testing)
  if (urlParams.get('grove-events') === 'true') return true;
  if (urlParams.get('grove-events') === 'false') return false;

  // 2. localStorage (persistent override)
  const override = localStorage.getItem('grove-event-system-override');
  if (override === 'true') return true;
  if (override === 'false') return false;

  // 3. Default: disabled
  return false;
}
```

---

## File Structure

```
src/core/events/
├── types.ts              # Event type definitions (Sprint 1)
├── schema.ts             # Zod validation (Sprint 1)
├── projections/          # State derivation (Sprint 1)
├── store.ts              # Log management (Sprint 1)
├── migration.ts          # V2→V3 migration (Sprint 1)
├── index.ts              # Public exports
│
└── hooks/                # React hooks
    ├── context.tsx           # React context (Sprint 2)
    ├── provider.tsx          # Provider component (Sprint 2)
    ├── useGroveEvents.ts     # Log access (Sprint 2)
    ├── useDispatch.ts        # Event dispatch (Sprint 2)
    ├── useEventHelpers.ts    # Typed emit helpers (Sprint 2)
    ├── useSession.ts         # Session projection (Sprint 2)
    ├── useContextState.ts    # Context projection (Sprint 2)
    ├── useTelemetry.ts       # V2 compat (Sprint 2)
    ├── useMomentContext.ts   # Moment context (Sprint 2)
    ├── useStream.ts          # Stream projection (Sprint 2)
    │
    ├── ExploreEventProvider.tsx  # Feature flag wrapper (Sprint 3)
    ├── useEventBridge.ts         # Thin routing (Sprint 3 - rewrite)
    ├── useLegacyBridge.ts        # Legacy translation (Sprint 3 - new)
    │
    └── index.ts              # Hook exports
```

---

## Interfaces

### EventBridgeAPI

```typescript
interface EventBridgeAPI {
  emit: EventBridgeEmit;
  isNewSystemEnabled: boolean;
  isProviderAvailable: boolean;
}
```

### EventBridgeEmit

```typescript
interface EventBridgeEmit {
  // Session
  sessionStarted: (isReturning?: boolean, previousSessionId?: string) => void;

  // Exploration
  querySubmitted: (queryId: string, content: string, intent?: string, sourceResponseId?: string) => void;
  responseCompleted: (responseId: string, queryId: string, hasNavigation: boolean, spanCount: number, hubId?: string, nodeId?: string) => void;

  // Lens
  lensActivated: (lensId: string, source: LensSource, isCustom: boolean, archetypeId?: string) => void;

  // Hub
  hubEntered: (hubId: string, source: HubSource, queryTrigger?: string) => void;

  // Journey
  journeyStarted: (journeyId: string, lensId: string, waypointCount: number) => void;
  journeyAdvanced: (journeyId: string, waypointId: string, position: number) => void;
  journeyCompleted: (journeyId: string, durationMs?: number, waypointsVisited?: number) => void;

  // Capture
  insightCaptured: (sproutId: string, journeyId?: string, hubId?: string, responseId?: string) => void;
}
```

### LegacyBridgeAPI

```typescript
interface LegacyBridgeAPI {
  onSessionStarted: () => void;
  onQuerySubmitted: (content: string) => void;
  onResponseCompleted: (hubId?: string) => void;
  onLensActivated: (lensId: string, isCustom: boolean) => void;
  onHubEntered: (hubId: string, hubName?: string) => void;
  onJourneyStarted: (lensId: string, waypointCount: number) => void;
  onJourneyCompleted: (lensId: string, durationMs?: number, cardsVisited?: number) => void;
  onInsightCaptured: (sproutId: string) => void;
}
```

---

## Testing Strategy

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `hooks.test.tsx` (Sprint 2) | Provider, dispatch, projections |
| `integration.test.tsx` (Sprint 3) | Bridge routing, dual-write |

### Integration Tests

```typescript
// Verify new system receives valid events
it('dispatches valid LENS_ACTIVATED to provider', async () => {
  const { emit } = renderHook(() => useEventBridge(), {
    wrapper: ({ children }) => (
      <GroveEventProvider>{children}</GroveEventProvider>
    )
  });

  emit.lensActivated('engineer', 'selection', false);

  // Get log from provider
  const { log } = renderHook(() => useGroveEvents());
  expect(log.sessionEvents).toContainEqual(
    expect.objectContaining({
      type: 'LENS_ACTIVATED',
      lensId: 'engineer',
      source: 'selection',  // Correct field name
      isCustom: false
    })
  );
});
```

---

## Migration Path

### Current State → Target State

```
Current:
- Components call legacy hooks directly
- XState engagement machine
- Scattered telemetry

Target (after Sprint 3):
- Components call useEventBridge
- Dual-write to both systems
- Schema-validated events
- Unified provenance

Future (Sprint 4+):
- Components call useEventBridge
- Legacy dual-write removed
- Single event source
- Full projection hooks
```

### Deprecation Timeline

| Sprint | Legacy Status |
|--------|---------------|
| Sprint 3 | Dual-write enabled |
| Sprint 4 | Audit consumers |
| Sprint 5 | Remove dual-write (if safe) |
| Sprint 6 | Delete legacy files |

---

*Architecture documented for Foundation Loop Phase 2*
