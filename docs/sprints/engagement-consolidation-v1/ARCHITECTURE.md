# Architecture: engagement-consolidation-v1

## Design Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EngagementBusSingleton                   │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ EngagementState │  │ StageThresholds  │ ← Config        │
│  │                 │  │                  │                 │
│  │ - sessionId     │  │ - oriented       │                 │
│  │ - exchangeCount │  │ - exploring      │                 │
│  │ - topicsExplored│  │ - engaged        │                 │
│  │ - sproutCount   │  │                  │                 │
│  │ - stage ←───────┼──┤ computeStage()   │                 │
│  │ - revealQueue   │  └──────────────────┘                 │
│  └────────┬────────┘                                       │
│           │                                                │
│           ▼                                                │
│  localStorage: grove-engagement-state                      │
└─────────────────────────────────────────────────────────────┘
           │
           │ subscribe()
           ▼
┌─────────────────────────────────────────────────────────────┐
│                      React Hooks                            │
│                                                             │
│  useEngagementState() ──→ { ...state, stage }              │
│         │                                                   │
│         ▼                                                   │
│  useSuggestedPrompts(lensId) ──→ filtered prompts          │
│         │                                                   │
│         ▼                                                   │
│  TerminalWelcome ──→ Stage indicator + Prompt chips        │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Extend EngagementBus (not replace)

**Why:** EngagementBus has mature infrastructure:
- Singleton pattern with subscription
- Event emission and history
- Reveal queue and trigger evaluation
- Session management with timeout

Adding stage computation is additive, not disruptive.

### 2. Stage as Computed Property

**Why:** Stage is deterministic function of state + thresholds.

```typescript
// Pure function, no side effects
function computeSessionStage(
  state: EngagementState, 
  thresholds: StageThresholds
): SessionStage
```

Recompute on every state update. Never store stage directly—always derive.

### 3. Thresholds in Config

**Why:** DEX Declarative Sovereignty pillar.

```typescript
// src/core/config/defaults.ts
export const DEFAULT_STAGE_THRESHOLDS: StageThresholds = {
  oriented: { minExchanges: 3, minVisits: 2 },
  exploring: { minExchanges: 5, minTopics: 2 },
  engaged: { minSprouts: 1, minVisits: 3, minTotalExchanges: 15 },
};
```

Future: Lens-specific threshold overrides in SUPERPOSITION_MAP.

### 4. Migration on First Load

**Why:** Users may have data in `grove-telemetry` from adaptive-engagement sprint.

```typescript
// In EngagementBusSingleton.loadState()
const legacy = localStorage.getItem('grove-telemetry');
if (legacy) {
  const data = JSON.parse(legacy);
  // Merge relevant fields
  this.state.totalExchangeCount = data.totalExchangeCount || 0;
  this.state.sproutsCaptured = data.sproutsCaptured || 0;
  // etc.
  localStorage.removeItem('grove-telemetry');
}
```

## Test Architecture

### Test Categories

| Category | Focus | Location |
|----------|-------|----------|
| Unit | Stage computation pure function | utils/stageComputation.test.ts |
| Integration | Hook behavior, subscriptions | hooks/useEngagementBus.test.ts |
| E2E | User progression flow | e2e/engagement-stage.spec.ts |

### Behavior Tests Needed

| Scenario | Test |
|----------|------|
| New user has ARRIVAL stage | Unit: computeStage returns ARRIVAL for empty state |
| 3 exchanges → ORIENTED | Unit: threshold crossing |
| Stage displayed in UI | E2E: Verify stage indicator visible |
| Prompts change with stage | Integration: useSuggestedPrompts filters by stage |
| Data migration | Unit: Legacy data merged correctly |
| No data loss | E2E: Refresh preserves state |

## File Changes Summary

### Extend

**src/core/schema/engagement.ts**
```diff
+ export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';
+ 
  export interface EngagementState {
    // existing fields...
+   stage: SessionStage;
+   totalExchangeCount: number;
+   sproutsCaptured: number;
  }
```

**hooks/useEngagementBus.ts**
```diff
+ import { computeSessionStage } from '../utils/stageComputation';
+ import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';

  private updateState(updates: Partial<EngagementState>): void {
    // existing code...
+   this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);
  }
```

### Create

**utils/stageComputation.ts** (migrate from telemetry)

### Delete

- src/lib/telemetry/* (entire directory)
- src/core/schema/session-telemetry.ts
- hooks/useSessionTelemetry.ts

## Backward Compatibility

| Consumer | Impact | Action |
|----------|--------|--------|
| useEngagementState() | None | Now includes `stage` field |
| useEngagementBus() | None | Same API |
| useRevealQueue() | None | Unchanged |
| useSuggestedPrompts() | Refactor | Read stage from useEngagementState |
| TerminalWelcome | Refactor | Use new hooks |
