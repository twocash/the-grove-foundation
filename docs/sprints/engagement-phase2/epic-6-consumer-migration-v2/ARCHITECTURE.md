# Architecture — Epic 6: Consumer Migration v2

## Overview

Install `EngagementProvider` at the app root and migrate consumer components from the monolithic `useNarrativeEngine` hook to the modular engagement hooks (`useLensState`, `useJourneyState`, `useEntropyState`).

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        App Root                              │
├─────────────────────────────────────────────────────────────┤
│  <NarrativeEngineProvider>                                   │
│    │                                                         │
│    │  ← schema, loading, getPersona, getJourney, etc.       │
│    │                                                         │
│    │  <EngagementProvider>  ← NEW                           │
│    │    │                                                    │
│    │    │  ← actor, useLensState, useJourneyState,          │
│    │    │    useEntropyState                                 │
│    │    │                                                    │
│    │    │  ┌─────────────────────────────────────┐          │
│    │    │  │ Consumer Components                 │          │
│    │    │  │                                     │          │
│    │    │  │  JourneyList      → useJourneyState │          │
│    │    │  │  JourneyInspector → useJourneyState │          │
│    │    │  │  LensPicker       → useLensState    │          │
│    │    │  │  Terminal         → all hooks       │          │
│    │    │  │                                     │          │
│    │    │  │  NodeGrid         → (no migration)  │          │
│    │    │  │  LensInspector    → (no migration)  │          │
│    │    │  │  JourneysModal    → (no migration)  │          │
│    │    │  │  SproutInspector  → (no migration)  │          │
│    │    │  └─────────────────────────────────────┘          │
│    │    │                                                    │
│    └────┴────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Dual-Provider Architecture

During migration, both providers coexist:

```typescript
// app/layout.tsx or equivalent
<NarrativeEngineProvider>
  <EngagementProvider>
    {children}
  </EngagementProvider>
</NarrativeEngineProvider>
```

**Why this order?**
- `NarrativeEngineProvider` provides schema data all components need
- `EngagementProvider` adds engagement state on top
- Components can access either or both during transition

## Migration Pattern

### Before (Legacy)

```typescript
function JourneyList() {
  const { 
    schema,                // ← schema data (keep)
    loading,               // ← loading state (keep)
    startJourney,          // ← MIGRATE to useJourneyState
    activeJourneyId,       // ← MIGRATE to useJourneyState
    getJourney             // ← schema helper (keep)
  } = useNarrativeEngine();
}
```

### After (Migrated)

```typescript
function JourneyList() {
  // Schema data stays with NarrativeEngine
  const { schema, loading, getJourney } = useNarrativeEngine();
  
  // Engagement state from new hooks
  const { actor } = useEngagement();
  const { journey, startJourney, isActive } = useJourneyState({ actor });
  
  // activeJourneyId → journey?.id
  const activeJourneyId = journey?.id ?? null;
}
```

## API Mapping

### Lens State

```typescript
// OLD
const { session, selectLens } = useNarrativeEngine();
const activeLens = session.activeLens;

// NEW
const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });
```

### Journey State

```typescript
// OLD
const { activeJourneyId, startJourney, advanceNode, exitJourney } = useNarrativeEngine();

// NEW
const { actor } = useEngagement();
const { 
  journey,        // full journey object or null
  isActive,       // boolean
  startJourney,   // (journey: Journey) => void
  advanceStep,    // () => void (renamed from advanceNode)
  exitJourney     // () => void
} = useJourneyState({ actor });

// Migration helpers:
const activeJourneyId = journey?.id ?? null;
```

### Entropy State

```typescript
// OLD
const { entropyState, evaluateEntropy, checkShouldInject } = useNarrativeEngine();

// NEW
const { actor } = useEngagement();
const { 
  entropy,           // number
  entropyThreshold,  // number
  updateEntropy,     // (delta: number) => void
  resetEntropy       // () => void
} = useEntropyState({ actor });
```

## File Organization

```
app/
├── layout.tsx          # ADD: EngagementProvider wrapper
│
src/
├── core/engagement/    # EXISTING - no changes
│   ├── context.tsx
│   ├── hooks/
│   └── machine.ts
│
├── explore/
│   ├── JourneyList.tsx      # MIGRATE
│   ├── JourneyInspector.tsx # MIGRATE
│   ├── LensPicker.tsx       # MIGRATE
│   ├── LensInspector.tsx    # NO CHANGE (no engagement state)
│   └── NodeGrid.tsx         # NO CHANGE (no engagement state)
│
├── cultivate/
│   └── SproutInspector.tsx  # NO CHANGE (no engagement state)
│
components/
├── Terminal.tsx             # MIGRATE (last, complex)
└── Terminal/
    └── Modals/
        └── JourneysModal.tsx # NO CHANGE (schema only)

tests/
└── e2e/
    └── engagement-migration.spec.ts  # CREATE
```

## Test Architecture

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/` | Hook isolation (existing 152 tests) |
| E2E | `tests/e2e/` | User behavior verification |

### Behavior Tests Needed

| User Action | Expected Outcome | Test File |
|-------------|------------------|-----------|
| App loads | No errors, UI visible | `engagement-migration.spec.ts` |
| Click journey | Journey starts | `engagement-migration.spec.ts` |
| Exit journey | Returns to default state | `engagement-migration.spec.ts` |

### Health Integration

Tests continue to report via existing Health system:
```
Playwright → Health Reporter → /api/health/report
```

## Configuration

No new configuration required. The engagement system reads/writes to localStorage using existing keys:
- `grove_lens` - selected lens
- `grove_completed_journeys` - completed journey IDs

## Integration Points

| System | Integration |
|--------|-------------|
| NarrativeEngineContext | Coexists as provider parent |
| localStorage | Shared persistence (same keys) |
| Health System | E2E tests report via existing reporter |
| WorkspaceUI | No changes needed |
