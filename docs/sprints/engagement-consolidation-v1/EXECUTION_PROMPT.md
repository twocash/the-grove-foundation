# Execution Prompt: engagement-consolidation-v1

## Context

You are consolidating two redundant engagement tracking systems into one. The current state has:

1. **EngagementBus** (hooks/useEngagementBus.ts) → localStorage: `grove-engagement-state`
   - Full event bus with reveals, triggers, time tracking
   - 503 lines, mature singleton pattern

2. **TelemetryCollector** (src/lib/telemetry/collector.ts) → localStorage: `grove-telemetry`
   - Stage computation, exchange counts
   - 187 lines, created in adaptive-engagement-v1 sprint

**THE BUG:** UI reads from empty `grove-telemetry` while data exists in `grove-engagement-state`.

**THE FIX:** Consolidate everything into EngagementBus. Delete TelemetryCollector.

## Ground Rules

- DEX Declarative Sovereignty: Stage thresholds in config, not hardcoded
- Single source of truth: One localStorage key, one singleton
- No redundant hooks: Delete useSessionTelemetry
- Pure functions: Stage computation is deterministic

## Execution Phases

Execute in order. Each phase has a gate. Do not proceed until gate passes.

---

## Phase 1: Schema Consolidation

### 1.1 Extend engagement.ts types

Edit `src/core/schema/engagement.ts`:

```typescript
// Add after existing imports

// Session Stage (consolidated from session-telemetry.ts)
export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

export interface StageThresholds {
  oriented: { minExchanges?: number; minVisits?: number };
  exploring: { minExchanges?: number; minTopics?: number };
  engaged: { minSprouts?: number; minVisits?: number; minTotalExchanges?: number };
}
```

### 1.2 Extend EngagementState interface

In same file, add fields to EngagementState:

```typescript
export interface EngagementState {
  // ... existing fields ...
  
  // Stage fields (consolidated)
  stage: SessionStage;
  totalExchangeCount: number;
  sproutsCaptured: number;
  allTopicsExplored: string[];
  visitCount: number;
}
```

### 1.3 Add config defaults

Edit `src/core/config/defaults.ts`:

```typescript
import { StageThresholds } from '../schema/engagement';

export const DEFAULT_STAGE_THRESHOLDS: StageThresholds = {
  oriented: { minExchanges: 3, minVisits: 2 },
  exploring: { minExchanges: 5, minTopics: 2 },
  engaged: { minSprouts: 1, minVisits: 3, minTotalExchanges: 15 },
};
```

Add new fields to DEFAULT_ENGAGEMENT_STATE:

```typescript
export const DEFAULT_ENGAGEMENT_STATE: EngagementState = {
  // ... existing fields ...
  stage: 'ARRIVAL',
  totalExchangeCount: 0,
  sproutsCaptured: 0,
  allTopicsExplored: [],
  visitCount: 1,
};
```

### 1.4 Export from config index

Edit `src/core/config/index.ts` to export DEFAULT_STAGE_THRESHOLDS.

### Gate 1
```bash
npx tsc --noEmit
```
Must pass with no errors.

---

## Phase 2: Utility Migration

### 2.1 Create stageComputation utility

Create `utils/stageComputation.ts`:

```typescript
// utils/stageComputation.ts
// Pure function for stage computation
// Sprint: engagement-consolidation-v1

import { EngagementState, SessionStage, StageThresholds } from '../src/core/schema/engagement';
import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';

export function computeSessionStage(
  state: EngagementState,
  thresholds: StageThresholds = DEFAULT_STAGE_THRESHOLDS
): SessionStage {
  const t = thresholds;
  
  // ENGAGED: 1+ sprout OR (3+ visits AND 15+ total exchanges)
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

### 2.2 Create unit test

Create `utils/stageComputation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeSessionStage } from './stageComputation';
import { DEFAULT_ENGAGEMENT_STATE } from '../src/core/config';

describe('computeSessionStage', () => {
  const baseState = { ...DEFAULT_ENGAGEMENT_STATE };

  it('returns ARRIVAL for new user', () => {
    expect(computeSessionStage(baseState)).toBe('ARRIVAL');
  });

  it('returns ORIENTED at 3 exchanges', () => {
    expect(computeSessionStage({ ...baseState, exchangeCount: 3 })).toBe('ORIENTED');
  });

  it('returns ORIENTED at 2 visits', () => {
    expect(computeSessionStage({ ...baseState, visitCount: 2 })).toBe('ORIENTED');
  });

  it('returns EXPLORING at 5 exchanges', () => {
    expect(computeSessionStage({ ...baseState, exchangeCount: 5 })).toBe('EXPLORING');
  });

  it('returns EXPLORING at 2 topics', () => {
    expect(computeSessionStage({ 
      ...baseState, 
      topicsExplored: ['topic1', 'topic2'] 
    })).toBe('EXPLORING');
  });

  it('returns ENGAGED at 1 sprout', () => {
    expect(computeSessionStage({ ...baseState, sproutsCaptured: 1 })).toBe('ENGAGED');
  });

  it('returns ENGAGED at 3 visits + 15 exchanges', () => {
    expect(computeSessionStage({ 
      ...baseState, 
      visitCount: 3, 
      totalExchangeCount: 15 
    })).toBe('ENGAGED');
  });
});
```

### Gate 2
```bash
npm run test -- stageComputation
```
All tests must pass.

---

## Phase 3: Hook Consolidation

### 3.1 Add migration and stage to EngagementBusSingleton

Edit `hooks/useEngagementBus.ts`:

Add imports at top:
```typescript
import { computeSessionStage } from '../utils/stageComputation';
import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';
import { SessionStage } from '../src/core/schema/engagement';
```

Add migration method to EngagementBusSingleton class:
```typescript
private migrateFromLegacy(): void {
  const legacy = localStorage.getItem('grove-telemetry');
  if (!legacy) return;
  
  try {
    const data = JSON.parse(legacy);
    console.log('[EngagementBus] Migrating from legacy telemetry');
    
    // Merge fields
    if (data.totalExchangeCount) {
      this.state.totalExchangeCount = Math.max(
        this.state.totalExchangeCount || 0, 
        data.totalExchangeCount
      );
    }
    if (data.sproutsCaptured) {
      this.state.sproutsCaptured = Math.max(
        this.state.sproutsCaptured || 0,
        data.sproutsCaptured
      );
    }
    if (data.visitCount) {
      this.state.visitCount = Math.max(
        this.state.visitCount || 1,
        data.visitCount
      );
    }
    if (data.allTopicsExplored?.length) {
      this.state.allTopicsExplored = [...new Set([
        ...(this.state.allTopicsExplored || []),
        ...data.allTopicsExplored
      ])];
    }
    
    // Remove legacy key
    localStorage.removeItem('grove-telemetry');
    this.persistState();
  } catch (e) {
    console.warn('[EngagementBus] Failed to migrate legacy data:', e);
  }
}
```

Update constructor to call migration and compute stage:
```typescript
constructor() {
  this.state = this.loadState();
  this.eventHistory = this.loadEventHistory();
  this.migrateFromLegacy();
  this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);
  this.startTimeTracking();
}
```

Update updateState to recompute stage:
```typescript
private updateState(updates: Partial<EngagementState>): void {
  const prevState = { ...this.state };
  this.state = {
    ...this.state,
    ...updates,
    lastActivityAt: new Date().toISOString()
  };
  
  // Recompute stage
  this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);

  this.persistState();
  this.evaluateAndNotify();

  // Notify state subscribers
  this.stateSubscribers.forEach(handler => handler(this.state, prevState));
}
```

Add SPROUT_CAPTURED handling in processEvent:
```typescript
case 'EXCHANGE_SENT':
  this.updateState({
    exchangeCount: this.state.exchangeCount + 1,
    totalExchangeCount: (this.state.totalExchangeCount || 0) + 1
  });
  break;

// Add new case
case 'SPROUT_CAPTURED':
  this.updateState({
    sproutsCaptured: (this.state.sproutsCaptured || 0) + 1
  });
  break;
```

### 3.2 Refactor useSuggestedPrompts

Edit `hooks/useSuggestedPrompts.ts`:

Replace telemetry import:
```typescript
// Remove this:
// import { useSessionTelemetry } from './useSessionTelemetry';

// Add this:
import { useEngagementState } from './useEngagementBus';
```

Update hook body:
```typescript
export function useSuggestedPrompts(lensId: string, lensName?: string) {
  const state = useEngagementState();
  const stage = state.stage;
  
  // ... rest of hook unchanged
}
```

### Gate 3
```bash
npx tsc --noEmit
```
Must pass.

---

## Phase 4: UI Wiring

### 4.1 Update TerminalWelcome

Edit `components/Terminal/TerminalWelcome.tsx`:

Update imports:
```typescript
import { useEngagementState } from '@/hooks/useEngagementBus';
import { useSuggestedPrompts } from '@/hooks/useSuggestedPrompts';
```

Update hook usage:
```typescript
export function TerminalWelcome({ lensId, lensName, onPromptClick }: Props) {
  const state = useEngagementState();
  const { prompts } = useSuggestedPrompts(lensId, lensName);
  
  console.log('[TerminalWelcome] Stage:', state.stage, 'Prompts:', prompts.length);

  const stageDisplay: Record<string, { emoji: string; label: string }> = {
    ARRIVAL: { emoji: '🌱', label: 'New' },
    ORIENTED: { emoji: '🌿', label: 'Exploring' },
    EXPLORING: { emoji: '🌳', label: 'Learning' },
    ENGAGED: { emoji: '🌲', label: 'Engaged' }
  };

  const current = stageDisplay[state.stage] || stageDisplay.ARRIVAL;
  
  // ... render with stage indicator
}
```

Add stage indicator to render:
```tsx
<div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
  <span>{current.emoji}</span>
  <span>{current.label}</span>
  <span className="opacity-50">• {state.exchangeCount} exchanges</span>
</div>
```

### Gate 4

Manual verification:
1. `npm run dev`
2. Open Terminal
3. Verify stage indicator shows "🌱 New"
4. Open DevTools → Application → localStorage
5. Verify only `grove-engagement-state` exists (no `grove-telemetry`)

---

## Phase 5: Cleanup

### 5.1 Delete redundant files

```bash
rm -rf src/lib/telemetry/
rm src/core/schema/session-telemetry.ts
rm hooks/useSessionTelemetry.ts
rm services/telemetryService.ts
```

### 5.2 Remove dead imports

Search for and remove any imports referencing deleted files:
```bash
grep -r "telemetry" --include="*.ts" --include="*.tsx" src/ hooks/ components/
grep -r "useSessionTelemetry" --include="*.ts" --include="*.tsx" .
grep -r "session-telemetry" --include="*.ts" --include="*.tsx" .
```

Fix any broken imports.

### 5.3 Update barrel exports

If `src/lib/index.ts` or similar exports telemetry, remove those exports.

### Gate 5
```bash
npm run build
```
Must succeed with no errors.

---

## Phase 6: Test & Verify

### 6.1 Run tests
```bash
npm run test
```

### 6.2 Manual verification

1. Clear localStorage completely
2. Reload page
3. Verify stage = "🌱 New"
4. Send 3 messages
5. Verify stage = "🌿 Exploring"
6. Capture a sprout
7. Verify stage = "🌲 Engaged"

### 6.3 Commit

```bash
git add .
git commit -m "refactor: consolidate engagement systems into single source of truth

- Extend EngagementBus with SessionStage computation
- Add declarative stage thresholds in config
- Migrate legacy grove-telemetry data on first load
- Delete redundant TelemetryCollector and useSessionTelemetry
- Wire TerminalWelcome to display stage indicator

Closes engagement-consolidation-v1 sprint"
```

---

## Definition of Done Checklist

- [ ] Single localStorage key: `grove-engagement-state`
- [ ] Stage field computed in EngagementBusSingleton
- [ ] Thresholds defined in DEFAULT_STAGE_THRESHOLDS config
- [ ] Stage visible in TerminalWelcome UI
- [ ] Prompts adapt to stage
- [ ] All deleted files removed (6 files)
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No console errors

---

## Files Changed Summary

**DELETED (6):**
- src/lib/telemetry/collector.ts
- src/lib/telemetry/stage-computation.ts  
- src/lib/telemetry/index.ts
- src/core/schema/session-telemetry.ts
- hooks/useSessionTelemetry.ts
- services/telemetryService.ts

**CREATED (2):**
- utils/stageComputation.ts
- utils/stageComputation.test.ts

**EXTENDED (3):**
- src/core/schema/engagement.ts (SessionStage types)
- src/core/config/defaults.ts (DEFAULT_STAGE_THRESHOLDS)
- hooks/useEngagementBus.ts (migration + stage computation)

**REFACTORED (2):**
- hooks/useSuggestedPrompts.ts
- components/Terminal/TerminalWelcome.tsx

---

## Troubleshooting

**Issue:** TypeScript errors about missing types
**Fix:** Ensure SessionStage exported from src/core/schema/engagement.ts and re-exported from index

**Issue:** Stage not updating
**Fix:** Verify computeSessionStage called in updateState method

**Issue:** Legacy data not migrated
**Fix:** Check migrateFromLegacy called in constructor, verify localStorage.getItem('grove-telemetry') returns data

**Issue:** Prompts not changing
**Fix:** Verify useSuggestedPrompts reads stage from useEngagementState, not useSessionTelemetry
