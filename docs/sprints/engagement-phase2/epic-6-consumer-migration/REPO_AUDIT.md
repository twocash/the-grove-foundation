# Repository Audit — Epic 6: Consumer Migration

## Audit Date: 2024-12-24

## Current State Summary

Epics 1-5 established the complete engagement stack:
- `engagementMachine` — XState v5 state machine
- `useLensState` — Lens selection with persistence
- `useJourneyState` — Journey lifecycle with completion tracking
- `useEntropyState` — Entropy monitoring with threshold detection
- `EngagementProvider` — Context for actor sharing
- `useEngagement` — Hook for context access

Epic 6 wires this stack into the application, replacing NarrativeEngineContext usage.

## Epic 5 Completion Status

| Component | Status | Verification |
|-----------|--------|--------------|
| EngagementProvider | ✅ Created | 8 tests |
| useEngagement | ✅ Created | Throws without provider |
| EngagementReactContext | ✅ Renamed | Avoids type collision |
| Total tests | ✅ 152 passing | +8 from Epic 5 |

## NarrativeEngineContext Analysis

### Location
`hooks/NarrativeEngineContext.tsx`

### Exported Values (to migrate)

```typescript
interface NarrativeEngineContextValue {
  // Lens state → useLensState
  lens: string | null;
  setLens: (lens: string) => void;
  
  // Journey state → useJourneyState
  journey: Journey | null;
  journeyProgress: number;
  isJourneyActive: boolean;
  startJourney: (journey: Journey) => void;
  advanceJourney: () => void;
  completeJourney: () => void;
  exitJourney: () => void;
  
  // Entropy state → useEntropyState
  entropy: number;
  entropyThreshold: number;
  updateEntropy: (delta: number) => void;
  resetEntropy: () => void;
  
  // Other (not migrating in this epic)
  messages: Message[];
  sendMessage: (content: string) => void;
  isLoading: boolean;
  // ... etc
}
```

### Consumers to Identify

Need to search codebase for:
```typescript
import { useNarrativeEngine } from '@/hooks/NarrativeEngineContext';
// or
const { lens, journey, entropy, ... } = useNarrativeEngine();
```

## Migration Strategy

### Phase 1: Provider Installation

Wrap app root with EngagementProvider:

```typescript
// app/layout.tsx or similar
<NarrativeEngineProvider>
  <EngagementProvider>  {/* NEW */}
    <App />
  </EngagementProvider>
</NarrativeEngineProvider>
```

Both providers coexist during migration.

### Phase 2: Identify Consumers

Search for components using:
- `lens` from NarrativeEngineContext
- `journey*` from NarrativeEngineContext
- `entropy*` from NarrativeEngineContext

### Phase 3: Migrate Consumers

For each consumer:
1. Add `useEngagement` import
2. Add relevant hook(s)
3. Replace context values with hook values
4. Test functionality

### Phase 4: Verify Coexistence

Both systems should work:
- NarrativeEngineContext for non-migrated features
- EngagementProvider for lens/journey/entropy

## Files to Modify

### Application Entry

| File | Change |
|------|--------|
| `app/layout.tsx` or `app/providers.tsx` | Add EngagementProvider |

### Consumer Components

| Component | Migrating |
|-----------|-----------|
| LensSelector (if exists) | lens → useLensState |
| JourneyPanel (if exists) | journey → useJourneyState |
| EntropyMeter (if exists) | entropy → useEntropyState |
| Terminal (if exists) | All three hooks |

### Files NOT to Modify

| File | Why |
|------|-----|
| `hooks/NarrativeEngineContext.tsx` | Keep for non-migrated features |
| `src/core/engagement/*` | Already complete |

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| State divergence | Medium | High | Migrate fully, don't mix |
| Missing consumer | Low | Medium | Thorough search |
| Breaking existing UI | Medium | High | E2E tests verify |

## Recommendations

1. **Dual provider** — Both contexts coexist during migration
2. **Full component migration** — Don't mix old/new in same component
3. **E2E verification** — Test each migrated flow
4. **Incremental** — Migrate one component at a time
5. **Document changes** — Track what was migrated
