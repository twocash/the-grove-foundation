# Engagement Architecture Migration: Phase 2 Roadmap

**Document Owner**: Grove Foundation Team
**Created**: 2024-12-23
**Status**: PLANNING
**Target**: Q1-Q2 2025

---

## Executive Summary

This roadmap details the migration from `NarrativeEngineContext` (694-line monolith) to a declarative `EngagementContext` that mirrors Grove's distributed AI thesis. The migration establishes patterns that will be replicated when rebuilding the Foundation backend.

**Strategic Goals:**
1. Replace imperative handlers with declarative configuration
2. Integrate testing as continuous process via Health system
3. Enable non-developer customization of engagement flows
4. Establish architecture patterns for Foundation backend rebuild

---

## Current State Assessment

### NarrativeEngineContext: The Monolith

| Responsibility | Lines | Risk Level |
|---------------|-------|------------|
| Session state (lens, exchanges, visited) | ~80 | HIGH - core state |
| localStorage persistence | ~60 | MEDIUM |
| Schema loading from API | ~40 | LOW |
| URL parameter handling | ~50 | MEDIUM (SSR issues) |
| Journey navigation | ~100 | HIGH - complex state |
| Card threading | ~80 | MEDIUM |
| Entropy detection | ~60 | MEDIUM |
| First-time user detection | ~80 | LOW |
| Referrer tracking | ~40 | LOW |
| Callbacks (40+ useCallback) | ~100 | HIGH - interdependent |

**Total**: 694 lines, 10+ responsibilities, impossible to test in isolation

### Health System: Already Declarative

The Health system (`lib/health-validator.js`) already demonstrates the target pattern:

```javascript
// Declarative check definition in health-config.json
{
  "id": "journey-hub-refs",
  "name": "Journey Hub References",
  "type": "reference-check",
  "source": { "file": "exploration/journeys.json", "path": "journeys.*.hubId" },
  "target": { "file": "knowledge/hubs.json", "path": "hubs" }
}
```

**Key patterns to replicate:**
- Configuration defines behavior
- Engine interprets configuration
- Results logged with attribution
- API exposes status and history

---

## Target State: Declarative Engagement

### Architecture Overview

```
src/core/engagement/
├── EngagementContext.tsx      # Thin coordinator (~100 lines)
├── machine.ts                 # XState state machine
├── config/
│   ├── engagement-config.json # Declarative behavior config
│   └── engagement-schema.ts   # TypeScript types
├── hooks/
│   ├── useLensState.ts        # Lens selection & persistence
│   ├── useJourneyState.ts     # Journey navigation
│   ├── useEntropyState.ts     # Entropy detection
│   ├── useThreadState.ts      # Card threading
│   └── usePersistence.ts      # Storage abstraction
├── hydration/
│   ├── useLensHydration.ts    # URL ?lens= (DONE - Epic 5)
│   ├── useShareHydration.ts   # URL ?share=
│   └── useReferrerTracking.ts # URL ?r=
├── health/
│   ├── engagement-checks.ts   # Health check definitions
│   └── engagement-reporter.ts # Integration with Health API
└── types.ts
```

### Declarative Configuration Example

```json
// engagement-config.json
{
  "version": "1.0",
  "states": {
    "anonymous": {
      "allowedTransitions": ["lensSelected", "journeyStarted"],
      "persistence": { "lens": false, "session": false }
    },
    "lensSelected": {
      "allowedTransitions": ["journeyStarted", "anonymous", "lensChanged"],
      "persistence": { "lens": true, "session": true },
      "analytics": { "event": "lens_selected", "includeProperties": ["lensId"] }
    }
  },
  "urlParameters": {
    "lens": {
      "validate": "isValidArchetype",
      "action": "SELECT_LENS",
      "fallback": "showPicker"
    },
    "share": {
      "validate": "isValidShareCode",
      "action": "LOAD_SHARED_REALITY",
      "fallback": "ignore"
    }
  },
  "persistence": {
    "lens": { "storage": "localStorage", "key": "grove-lens" },
    "session": { "storage": "localStorage", "key": "grove-session" },
    "entropy": { "storage": "localStorage", "key": "grove-entropy" }
  }
}
```

---

## Migration Epics

### Epic 0: Health Integration Foundation (Week 1)

**Goal**: Extend Health system to monitor engagement architecture migration

**Deliverables**:
1. Add engagement health checks to `health-config.json`
2. Create `engagement-reporter.ts` for E2E test integration
3. Establish "health as testing" pattern

**Health Checks to Add**:
```json
{
  "engagementChecks": [
    {
      "id": "lens-state-valid",
      "name": "Lens State Schema Valid",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:lens selection persists"
    },
    {
      "id": "journey-navigation-works",
      "name": "Journey Navigation Functional",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:journey navigation"
    }
  ]
}
```

**Testing Integration**:
```typescript
// engagement-reporter.ts
export async function reportTestResults(playwrightResults: TestResult[]) {
  const healthEntry = {
    timestamp: new Date().toISOString(),
    category: 'engagement-e2e',
    checks: playwrightResults.map(r => ({
      id: r.title.toLowerCase().replace(/\s+/g, '-'),
      name: r.title,
      status: r.status === 'passed' ? 'pass' : 'fail',
      message: r.error?.message || 'Passed'
    })),
    attribution: {
      triggeredBy: 'ci-pipeline',
      commit: process.env.GIT_COMMIT
    }
  };
  
  await appendToHealthLog(healthEntry);
}
```

**Success Criteria**:
- [ ] E2E test results appear in Health dashboard
- [ ] Health API returns engagement check status
- [ ] CI pipeline reports to Health system

---

### Epic 1: State Machine Foundation (Week 2)

**Goal**: Define engagement states as XState machine

**Dependencies**: Epic 0

**Deliverables**:
1. `src/core/engagement/machine.ts` - State machine definition
2. `src/core/engagement/config/engagement-config.json` - Declarative states
3. Health check: "State machine transitions valid"

**State Machine**:
```typescript
// machine.ts
import { createMachine, assign } from 'xstate';

export const engagementMachine = createMachine({
  id: 'engagement',
  initial: 'anonymous',
  context: {
    activeLens: null,
    activeJourney: null,
    currentNode: null,
    entropyLevel: 0
  },
  states: {
    anonymous: {
      on: {
        SELECT_LENS: {
          target: 'lensActive',
          actions: assign({ activeLens: (_, e) => e.lensId })
        },
        URL_LENS_DETECTED: {
          target: 'lensActive',
          actions: assign({ activeLens: (_, e) => e.lensId })
        }
      }
    },
    lensActive: {
      entry: ['persistLens', 'markSessionEstablished'],
      on: {
        START_JOURNEY: 'journeyActive',
        CHANGE_LENS: {
          target: 'lensActive',
          actions: assign({ activeLens: (_, e) => e.lensId })
        },
        CLEAR_LENS: 'anonymous'
      }
    },
    journeyActive: {
      entry: ['persistJourney'],
      on: {
        ADVANCE_NODE: {
          actions: assign({ currentNode: (_, e) => e.nodeId })
        },
        COMPLETE_JOURNEY: 'journeyComplete',
        ABANDON_JOURNEY: 'lensActive'
      }
    },
    journeyComplete: {
      entry: ['recordCompletion'],
      on: {
        START_NEW_JOURNEY: 'journeyActive',
        RETURN_TO_EXPLORE: 'lensActive'
      }
    }
  }
});
```

**Health Check**:
```json
{
  "id": "state-machine-valid",
  "name": "Engagement State Machine Valid",
  "category": "engagement",
  "type": "unit-test",
  "test": "engagement-machine.test.ts"
}
```

**Success Criteria**:
- [ ] State machine passes all transition tests
- [ ] Health dashboard shows state machine health
- [ ] No NarrativeEngine changes required

---

### Epic 2: Lens State Extraction (Week 3)

**Goal**: Extract lens management to focused hook

**Dependencies**: Epic 1

**Deliverables**:
1. `src/core/engagement/hooks/useLensState.ts`
2. `src/core/engagement/hooks/useLensPersistence.ts`
3. Migrate `useLensHydration` to new location
4. Health checks for lens state integrity

**useLensState Hook**:
```typescript
// hooks/useLensState.ts
export function useLensState() {
  const [state, send] = useMachine(engagementMachine);
  
  const selectLens = useCallback((lensId: string) => {
    send({ type: 'SELECT_LENS', lensId });
  }, [send]);
  
  const clearLens = useCallback(() => {
    send({ type: 'CLEAR_LENS' });
  }, [send]);
  
  return {
    activeLens: state.context.activeLens,
    selectLens,
    clearLens,
    isLensActive: state.matches('lensActive') || state.matches('journeyActive')
  };
}
```

**Adapter for Legacy**:
```typescript
// hooks/useLensStateAdapter.ts
// Bridges new useLensState to NarrativeEngine consumers
export function useLensStateAdapter() {
  const newLens = useLensState();
  const { selectLens: legacySelectLens } = useNarrativeEngine();
  
  // Sync new state to legacy for gradual migration
  useEffect(() => {
    legacySelectLens(newLens.activeLens);
  }, [newLens.activeLens]);
  
  return newLens;
}
```

**Health Checks**:
```json
[
  {
    "id": "lens-state-sync",
    "name": "Lens State Sync (New ↔ Legacy)",
    "category": "engagement",
    "type": "e2e-behavior",
    "test": "lens-state-sync.spec.ts"
  },
  {
    "id": "lens-persistence-valid",
    "name": "Lens Persists Across Sessions",
    "category": "engagement",
    "type": "e2e-behavior",
    "test": "engagement-behaviors.spec.ts:lens persists"
  }
]
```

**Success Criteria**:
- [ ] useLensState works independently
- [ ] Adapter syncs state to legacy consumers
- [ ] All lens behavior tests pass
- [ ] Health dashboard shows lens subsystem health

---

### Epic 3: Journey State Extraction (Week 4)

**Goal**: Extract journey navigation to focused hook

**Dependencies**: Epic 2

**Deliverables**:
1. `src/core/engagement/hooks/useJourneyState.ts`
2. `src/core/engagement/hooks/useJourneyPersistence.ts`
3. Journey health checks

**useJourneyState Hook**:
```typescript
// hooks/useJourneyState.ts
export function useJourneyState() {
  const [state, send] = useMachine(engagementMachine);
  
  const startJourney = useCallback((journeyId: string) => {
    send({ type: 'START_JOURNEY', journeyId });
  }, [send]);
  
  const advanceNode = useCallback((nodeId: string) => {
    send({ type: 'ADVANCE_NODE', nodeId });
  }, [send]);
  
  const abandonJourney = useCallback(() => {
    send({ type: 'ABANDON_JOURNEY' });
  }, [send]);
  
  return {
    activeJourney: state.context.activeJourney,
    currentNode: state.context.currentNode,
    isInJourney: state.matches('journeyActive'),
    startJourney,
    advanceNode,
    abandonJourney
  };
}
```

**Health Checks**:
```json
[
  {
    "id": "journey-start-works",
    "name": "Journey Start Transition Works",
    "category": "engagement",
    "type": "e2e-behavior"
  },
  {
    "id": "journey-chain-complete",
    "name": "Journey Chains Reach Terminal",
    "category": "engagement",
    "type": "chain-valid",
    "source": { "file": "exploration/journeys.json", "path": "journeys" }
  }
]
```

**Success Criteria**:
- [ ] useJourneyState works independently
- [ ] Journey health checks pass
- [ ] Existing journey tests pass
- [ ] No regressions in journey navigation

---

### Epic 4: Entropy State Extraction (Week 5)

**Goal**: Extract entropy detection to focused hook

**Dependencies**: Epic 3

**Deliverables**:
1. `src/core/engagement/hooks/useEntropyState.ts`
2. Declarative entropy thresholds in config
3. Entropy health checks

**Declarative Entropy Config**:
```json
{
  "entropy": {
    "thresholds": {
      "inject": 0.7,
      "cooldown": 3
    },
    "clusters": {
      "vision": { "journeyId": "grove-vision", "weight": 1.2 },
      "technical": { "journeyId": "technical-deep-dive", "weight": 1.0 }
    }
  }
}
```

**useEntropyState Hook**:
```typescript
// hooks/useEntropyState.ts
export function useEntropyState(config: EntropyConfig) {
  const [entropyLevel, setEntropyLevel] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  
  const evaluateEntropy = useCallback((message: string, history: Message[]) => {
    const result = calculateEntropy(message, history);
    setEntropyLevel(result.level);
    return result;
  }, []);
  
  const shouldInject = useMemo(() => 
    entropyLevel >= config.thresholds.inject && cooldown === 0,
    [entropyLevel, cooldown, config]
  );
  
  return {
    entropyLevel,
    shouldInject,
    evaluateEntropy,
    recordInjection: () => setCooldown(config.thresholds.cooldown)
  };
}
```

**Success Criteria**:
- [ ] useEntropyState works with config
- [ ] Entropy thresholds configurable without code
- [ ] Health checks for entropy calculation

---

### Epic 5: EngagementContext Assembly (Week 6)

**Goal**: Assemble focused hooks into thin coordinator

**Dependencies**: Epics 1-4

**Deliverables**:
1. `src/core/engagement/EngagementContext.tsx`
2. Full test coverage
3. Health dashboard integration

**EngagementContext**:
```typescript
// EngagementContext.tsx
export function EngagementProvider({ children }: Props) {
  const config = useEngagementConfig();
  const lens = useLensState();
  const journey = useJourneyState();
  const entropy = useEntropyState(config.entropy);
  
  // Compose into single context value
  const value = useMemo(() => ({
    ...lens,
    ...journey,
    ...entropy,
    config
  }), [lens, journey, entropy, config]);
  
  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
}
```

**Success Criteria**:
- [ ] EngagementContext provides all functionality
- [ ] All behavior tests pass with new context
- [ ] Health dashboard shows full engagement system health
- [ ] < 100 lines for EngagementContext.tsx

---

### Epic 6: Consumer Migration (Weeks 7-8)

**Goal**: Migrate consumers from NarrativeEngine to EngagementContext

**Dependencies**: Epic 5

**Migration Order** (by risk):
1. **GenesisPage** - Highest visibility, well-tested
2. **Terminal** - Complex, many interactions
3. **LensPicker** - Simple, low risk
4. **JourneyViewer** - Moderate complexity
5. **EntropyRouter** - Moderate complexity

**For Each Consumer**:
```typescript
// BEFORE
const { session, selectLens } = useNarrativeEngine();

// AFTER
const { activeLens, selectLens } = useEngagement();
```

**Health Check per Consumer**:
```json
{
  "id": "genesis-page-uses-engagement",
  "name": "GenesisPage Uses EngagementContext",
  "category": "migration",
  "type": "code-check",
  "pattern": "useEngagement",
  "file": "src/surface/pages/GenesisPage.tsx"
}
```

**Success Criteria**:
- [ ] All consumers migrated
- [ ] All behavior tests pass
- [ ] No imports from NarrativeEngineContext in migrated files
- [ ] Health shows migration progress

---

### Epic 7: Legacy Deprecation (Week 9)

**Goal**: Remove NarrativeEngineContext

**Dependencies**: Epic 6

**Checklist**:
- [ ] No imports of `useNarrativeEngine` remain
- [ ] No imports of `NarrativeEngineContext` remain
- [ ] Delete `hooks/NarrativeEngineContext.tsx`
- [ ] Delete `hooks/useNarrativeEngine.ts`
- [ ] Delete bridge hooks (`useLensHydration` moves to core)
- [ ] Update `docs/ENGAGEMENT_ARCHITECTURE_MIGRATION.md` to "COMPLETE"
- [ ] Remove deprecated E2E tests

**Final Health Check**:
```json
{
  "id": "legacy-removed",
  "name": "NarrativeEngineContext Removed",
  "category": "migration",
  "type": "file-not-exists",
  "target": { "file": "hooks/NarrativeEngineContext.tsx" }
}
```

**Success Criteria**:
- [ ] NarrativeEngineContext deleted
- [ ] All tests pass
- [ ] Health shows "Legacy Removed"
- [ ] Total engagement code < 500 lines (vs 694 original)

---

## Testing as Process

### Continuous Health Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Testing as Process Flow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Developer                                                                  │
│     │                                                                       │
│     ▼                                                                       │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                │
│  │   Write     │──────│    Run      │──────│   Report    │                │
│  │   Code      │      │   Tests     │      │  to Health  │                │
│  └─────────────┘      └─────────────┘      └──────┬──────┘                │
│                                                   │                        │
│                                                   ▼                        │
│                                           ┌─────────────┐                 │
│                                           │   Health    │                 │
│                                           │  Dashboard  │                 │
│                                           └──────┬──────┘                 │
│                                                   │                        │
│                        ┌──────────────────────────┴───────────┐           │
│                        ▼                                      ▼           │
│                 ┌─────────────┐                        ┌─────────────┐    │
│                 │   Pass?     │                        │   Fail?     │    │
│                 │   ✅ Ship   │                        │   🚫 Block  │    │
│                 └─────────────┘                        └─────────────┘    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Health Check Categories

| Category | Purpose | Check Types |
|----------|---------|-------------|
| `engine` | Core system health | json-exists, api-responds |
| `schema-integrity` | Data consistency | reference-check |
| `engagement` | Engagement system | e2e-behavior, unit-test |
| `migration` | Migration progress | code-check, file-not-exists |

### CI/CD Integration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    steps:
      - name: Run E2E Tests
        run: npx playwright test
        
      - name: Report to Health
        run: node scripts/report-test-health.js
        env:
          GIT_COMMIT: ${{ github.sha }}
          
      - name: Check Health Status
        run: |
          STATUS=$(curl -s ${{ secrets.API_URL }}/api/health | jq '.summary.failed')
          if [ "$STATUS" != "0" ]; then
            echo "Health checks failed"
            exit 1
          fi
```

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Engagement code lines | 694 | <500 | wc -l |
| Test coverage | ~60% | >90% | Coverage report |
| Health checks passing | N/A | 100% | Health API |
| Non-dev configurable behaviors | 0 | 10+ | Config audit |
| Time to add new lens behavior | ~2 hours | ~10 minutes | Measurement |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regressions during migration | HIGH | HIGH | Behavior tests as safety net |
| State sync issues (new ↔ legacy) | MEDIUM | HIGH | Adapter pattern, extensive logging |
| Performance degradation | LOW | MEDIUM | Benchmark before/after |
| Team confusion about which system | MEDIUM | MEDIUM | Clear migration documentation |
| Health system overwhelm | LOW | LOW | Rate limiting, log rotation |

---

## Timeline Summary

| Week | Epic | Deliverable |
|------|------|-------------|
| 1 | 0 | Health integration foundation |
| 2 | 1 | State machine definition |
| 3 | 2 | Lens state extraction |
| 4 | 3 | Journey state extraction |
| 5 | 4 | Entropy state extraction |
| 6 | 5 | EngagementContext assembly |
| 7-8 | 6 | Consumer migration |
| 9 | 7 | Legacy deprecation |

**Total: 9 weeks**

---

## Next Steps

1. **Review this roadmap** with stakeholders
2. **Create Epic 0 Foundation Loop** for Health integration
3. **Set up Health dashboard** to track migration
4. **Begin Epic 0 implementation**

---

## Related Documents

- `docs/ENGAGEMENT_ARCHITECTURE_MIGRATION.md` - High-level migration guide
- `docs/testing/ENGAGEMENT_MIGRATION_TEST_STRATEGY.md` - Test approach
- `lib/health-validator.js` - Health system implementation
- `data/infrastructure/health-config.json` - Current health checks
