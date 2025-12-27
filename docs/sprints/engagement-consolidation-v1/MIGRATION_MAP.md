# Migration Map: engagement-consolidation-v1

## File Operations Summary

| Operation | Count |
|-----------|-------|
| DELETE | 6 |
| CREATE | 2 |
| EXTEND | 3 |
| REFACTOR | 3 |

---

## Phase 1: Schema Consolidation

### DELETE: src/core/schema/session-telemetry.ts

**Reason:** Types merged into engagement.ts

### EXTEND: src/core/schema/engagement.ts

**Changes:**
```diff
+ // Session Stage (from session-telemetry.ts)
+ export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';
+ 
+ export interface StageThresholds {
+   oriented: { minExchanges?: number; minVisits?: number };
+   exploring: { minExchanges?: number; minTopics?: number };
+   engaged: { minSprouts?: number; minVisits?: number; minTotalExchanges?: number };
+ }

  export interface EngagementState {
    // ... existing fields ...
+   
+   // Stage fields (from session-telemetry)
+   stage: SessionStage;
+   totalExchangeCount: number;
+   sproutsCaptured: number;
+   allTopicsExplored: string[];
+   visitCount: number;
  }
```

---

## Phase 2: Config Defaults

### EXTEND: src/core/config/defaults.ts

**Changes:**
```diff
+ import { StageThresholds } from '../schema/engagement';
+ 
+ export const DEFAULT_STAGE_THRESHOLDS: StageThresholds = {
+   oriented: { minExchanges: 3, minVisits: 2 },
+   exploring: { minExchanges: 5, minTopics: 2 },
+   engaged: { minSprouts: 1, minVisits: 3, minTotalExchanges: 15 },
+ };

  export const DEFAULT_ENGAGEMENT_STATE: EngagementState = {
    // ... existing fields ...
+   stage: 'ARRIVAL',
+   totalExchangeCount: 0,
+   sproutsCaptured: 0,
+   allTopicsExplored: [],
+   visitCount: 1,
  };
```

### EXTEND: src/core/config/index.ts

**Changes:**
```diff
  export {
    DEFAULT_ENGAGEMENT_STATE,
+   DEFAULT_STAGE_THRESHOLDS,
    // ...
  }
```

---

## Phase 3: Utility Migration

### CREATE: utils/stageComputation.ts

**Source:** Migrate from src/lib/telemetry/stage-computation.ts

**Content:**
```typescript
import { EngagementState, SessionStage, StageThresholds } from '../src/core/schema/engagement';
import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';

export function computeSessionStage(
  state: EngagementState,
  thresholds: StageThresholds = DEFAULT_STAGE_THRESHOLDS
): SessionStage {
  const t = thresholds;
  
  // ENGAGED: 1+ sprout OR (3+ visits AND 15+ exchanges)
  if (
    state.sproutsCaptured >= (t.engaged.minSprouts ?? 1) ||
    (state.visitCount >= (t.engaged.minVisits ?? 3) &&
     state.totalExchangeCount >= (t.engaged.minTotalExchanges ?? 15))
  ) {
    return 'ENGAGED';
  }
  
  // EXPLORING: 5+ exchanges OR 2+ topics
  if (
    state.exchangeCount >= (t.exploring.minExchanges ?? 5) ||
    state.topicsExplored.length >= (t.exploring.minTopics ?? 2)
  ) {
    return 'EXPLORING';
  }
  
  // ORIENTED: 3+ exchanges OR 2+ visits
  if (
    state.exchangeCount >= (t.oriented.minExchanges ?? 3) ||
    state.visitCount >= (t.oriented.minVisits ?? 2)
  ) {
    return 'ORIENTED';
  }
  
  return 'ARRIVAL';
}
```

### DELETE: src/lib/telemetry/stage-computation.ts

**Reason:** Moved to utils/stageComputation.ts

### DELETE: src/lib/telemetry/collector.ts

**Reason:** Consolidated into EngagementBusSingleton

### DELETE: src/lib/telemetry/index.ts

**Reason:** Directory removed

### DELETE: src/lib/telemetry/ (directory)

**Reason:** All functionality merged into engagement bus

---

## Phase 4: Hook Consolidation

### EXTEND: hooks/useEngagementBus.ts

**Changes:**
```diff
+ import { computeSessionStage } from '../utils/stageComputation';
+ import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';

  class EngagementBusSingleton {
+   private migrateFromLegacy(): void {
+     const legacy = localStorage.getItem('grove-telemetry');
+     if (!legacy) return;
+     const data = JSON.parse(legacy);
+     this.state.totalExchangeCount = data.totalExchangeCount || this.state.totalExchangeCount;
+     this.state.sproutsCaptured = data.sproutsCaptured || this.state.sproutsCaptured;
+     this.state.visitCount = data.visitCount || this.state.visitCount;
+     this.state.allTopicsExplored = [...new Set([
+       ...this.state.allTopicsExplored,
+       ...(data.allTopicsExplored || [])
+     ])];
+     localStorage.removeItem('grove-telemetry');
+   }

    constructor() {
      this.state = this.loadState();
+     this.migrateFromLegacy();
+     this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);
      // ...
    }

    private updateState(updates: Partial<EngagementState>): void {
      // ... existing code ...
+     this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);
      this.persistState();
    }

    // Add sprout tracking
+   private processEvent(event: EngagementEvent): void {
+     // ... existing cases ...
+     case 'SPROUT_CAPTURED':
+       this.updateState({
+         sproutsCaptured: this.state.sproutsCaptured + 1
+       });
+       break;
    }
  }
```

### DELETE: hooks/useSessionTelemetry.ts

**Reason:** Redundant. Use useEngagementState instead.

### REFACTOR: hooks/useSuggestedPrompts.ts

**Changes:**
```diff
- import { useSessionTelemetry } from './useSessionTelemetry';
+ import { useEngagementState } from './useEngagementBus';

  export function useSuggestedPrompts(lensId: string, lensName?: string) {
-   const { stage } = useSessionTelemetry();
+   const state = useEngagementState();
+   const stage = state.stage;
    // ... rest unchanged
  }
```

---

## Phase 5: Service Cleanup

### DELETE: services/telemetryService.ts

**Reason:** Server sync deferred. Remove unused code.

---

## Phase 6: UI Wiring

### REFACTOR: components/Terminal/TerminalWelcome.tsx

**Changes:**
```diff
- import { useSessionTelemetry } from '@/hooks/useSessionTelemetry';
+ import { useEngagementState } from '@/hooks/useEngagementBus';
  import { useSuggestedPrompts } from '@/hooks/useSuggestedPrompts';

  export function TerminalWelcome({ lensId, lensName, onPromptClick }) {
-   const { telemetry, stage } = useSessionTelemetry();
+   const state = useEngagementState();
+   const stage = state.stage;
    const { prompts } = useSuggestedPrompts(lensId, lensName);

    const stageDisplay = {
      ARRIVAL: { emoji: '🌱', label: 'New' },
      ORIENTED: { emoji: '🌿', label: 'Exploring' },
      EXPLORING: { emoji: '🌳', label: 'Learning' },
      ENGAGED: { emoji: '🌲', label: 'Engaged' }
    };

    // ... render stage indicator and prompts
  }
```

---

## Phase 7: Cleanup

### Remove imports referencing deleted files

**Files to scan:**
- Any file importing from `@/lib/telemetry`
- Any file importing `useSessionTelemetry`
- Any file importing `session-telemetry` types

**Command:**
```bash
grep -r "telemetry" --include="*.ts" --include="*.tsx" src/ hooks/ components/
```

---

## Verification Checklist

- [ ] `grove-telemetry` localStorage key no longer created
- [ ] `grove-engagement-state` includes stage field
- [ ] Stage visible in Terminal UI
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All tests pass
- [ ] Build succeeds
