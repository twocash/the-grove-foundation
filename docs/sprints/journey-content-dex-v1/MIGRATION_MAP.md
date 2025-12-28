# MIGRATION_MAP.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Overview

This sprint adds new functionality without breaking existing code. The "migration" is about wiring new components into existing architecture.

## Phase 1: Schema Extension

### Step 1.1: Extend journey.ts types

**File:** `src/core/schema/journey.ts`

**Before:**
```typescript
export interface JourneyWaypoint {
  id: string;
  title: string;
  prompt: string;
  hub?: string;
  successCriteria?: { minExchanges?: number; topicsMentioned?: string[] };
  entryPatterns?: string[];
}

export interface Journey {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  lensAffinity?: string[];
  lensExclude?: string[];
  waypoints: JourneyWaypoint[];
  completionMessage: string;
  nextJourneys?: string[];
  allowImplicitEntry?: boolean;
  ambientTracking?: boolean;
}
```

**After:** Add these types BEFORE the existing interfaces:
```typescript
// DEX Display Configuration
export interface JourneyDisplayConfig {
  showProgressBar?: boolean;
  showExitButton?: boolean;
  showWaypointCount?: boolean;
  progressBarColor?: 'emerald' | 'cyan' | 'amber' | 'blue' | 'purple';
  labels?: {
    sectionTitle?: string;
    exitButton?: string;
  };
}

// DEX Action Definition
export interface WaypointAction {
  type: 'explore' | 'advance' | 'complete' | 'branch' | 'custom';
  label: string;
  variant?: 'primary' | 'secondary' | 'subtle';
  targetWaypoint?: string;
  command?: string;
}
```

**Then extend existing interfaces:**
```typescript
export interface JourneyWaypoint {
  // ... existing fields
  actions?: WaypointAction[];  // ADD THIS
}

export interface Journey {
  // ... existing fields
  display?: JourneyDisplayConfig;  // ADD THIS
}
```

### Step 1.2: Create provenance type

**File:** `src/core/schema/journey-provenance.ts` (NEW)

```typescript
/**
 * Provenance tracking for journey-initiated interactions
 * Satisfies Trellis Pillar III: Provenance as Infrastructure
 */
export interface JourneyProvenance {
  journey: {
    id: string;
    title: string;
  };
  waypoint: {
    id: string;
    title: string;
    index: number;
  };
  action: {
    type: string;
    label: string;
    timestamp: string;
  };
}

export function createJourneyProvenance(
  journey: { id: string; title: string },
  waypoint: { id: string; title: string },
  waypointIndex: number,
  action: { type: string; label: string }
): JourneyProvenance {
  return {
    journey: { id: journey.id, title: journey.title },
    waypoint: { id: waypoint.id, title: waypoint.title, index: waypointIndex },
    action: { ...action, timestamp: new Date().toISOString() },
  };
}
```

### Step 1.3: Export new types

**File:** `src/core/schema/index.ts`

Add to exports:
```typescript
export * from './journey-provenance';
export type { JourneyDisplayConfig, WaypointAction } from './journey';
```

---

## Phase 2: Component Creation

### Step 2.1: Create JourneyContent component

**File:** `components/Terminal/JourneyContent.tsx` (NEW)

See ARCHITECTURE.md for full implementation. Key structure:

```typescript
import { Journey, JourneyWaypoint, WaypointAction, JourneyProvenance } from '@/core/schema';

interface JourneyContentProps {
  journey: Journey;
  currentWaypoint: JourneyWaypoint;
  journeyProgress: number;
  journeyTotal: number;
  onAction: (action: WaypointAction, provenance: JourneyProvenance) => void;
  onExit: () => void;
}

// Default configurations (DEX-compliant fallbacks)
const DEFAULT_DISPLAY = { ... };
const DEFAULT_ACTIONS = [ ... ];
const FINAL_ACTIONS = [ ... ];

export function JourneyContent({ ... }: JourneyContentProps) {
  // Merge schema config with defaults
  const display = { ...DEFAULT_DISPLAY, ...journey.display };
  
  // Determine actions
  const isLastWaypoint = journeyProgress >= journeyTotal - 1;
  const actions = currentWaypoint.actions 
    ?? (isLastWaypoint ? FINAL_ACTIONS : DEFAULT_ACTIONS);
  
  // Build provenance for actions
  const buildProvenance = (action: WaypointAction): JourneyProvenance => { ... };
  
  return (
    <div className="...">
      {/* Header with title and exit */}
      {/* Progress bar (if enabled) */}
      {/* Waypoint content */}
      {/* Action buttons */}
    </div>
  );
}
```

### Step 2.2: Create unit tests

**File:** `components/Terminal/JourneyContent.test.tsx` (NEW)

Test cases per ARCHITECTURE.md testing strategy.

### Step 2.3: Export component

**File:** `components/Terminal/index.ts`

Add:
```typescript
export { JourneyContent } from './JourneyContent';
```

---

## Phase 3: Terminal Integration

### Step 3.1: Add imports

**File:** `components/Terminal.tsx`

At imports section (~line 16), add:
```typescript
import { JourneyContent } from './Terminal/JourneyContent';
import { WaypointAction, JourneyProvenance, createJourneyProvenance } from '@/core/schema';
```

### Step 3.2: Extend state extraction

**File:** `components/Terminal.tsx`

At useJourneyState call (~line 167), expand destructuring:
```typescript
const {
  journey: engJourney,
  isActive: isJourneyActive,
  currentWaypoint,        // ADD
  journeyProgress,        // ADD
  journeyTotal,           // ADD
  startJourney: engStartJourney,
  advanceStep,
  completeJourney,        // ADD
  exitJourney: engExitJourney
} = useJourneyState({ actor });
```

### Step 3.3: Add action handler

**File:** `components/Terminal.tsx`

After other handlers (~line 700), add:
```typescript
const handleJourneyAction = useCallback((
  action: WaypointAction,
  provenance: JourneyProvenance
) => {
  console.log('[Terminal] Journey action:', action.type, provenance);
  
  switch (action.type) {
    case 'explore':
      // Send waypoint prompt - provenance attached for Sprout tracking
      handleSend(currentWaypoint?.prompt || '', { journeyProvenance: provenance });
      break;
      
    case 'advance':
      advanceStep();
      break;
      
    case 'complete':
      completeJourney();
      // Trigger completion UI
      actions.setReveal('journeyCompletion', true);
      actions.setCompletedJourneyTitle(engJourney?.title || '');
      // Record metrics
      recordJourneyCompleted();
      incrementJourneysCompleted();
      emit.journeyCompleted(engJourney?.id || '');
      break;
      
    case 'branch':
      console.warn('[Terminal] Branch action not yet implemented');
      break;
      
    case 'custom':
      if (action.command) {
        handleSend(action.command);
      }
      break;
      
    default:
      console.warn('[Terminal] Unknown action type:', action.type);
  }
}, [currentWaypoint, advanceStep, completeJourney, engJourney, handleSend, actions]);
```

### Step 3.4: Add render logic

**File:** `components/Terminal.tsx`

In the render section (~line 1585), add BEFORE the existing journey/suggestion checks:
```typescript
{/* DEX-Compliant Journey Content */}
{isJourneyActive && engJourney && currentWaypoint ? (
  <JourneyContent
    journey={engJourney}
    currentWaypoint={currentWaypoint}
    journeyProgress={journeyProgress}
    journeyTotal={journeyTotal}
    onAction={handleJourneyAction}
    onExit={engExitJourney}
  />
) : nextNodes.length > 0 ? (
  // ... existing SuggestionChips code
```

---

## Phase 4: Verification

### Step 4.1: Type check
```bash
npx tsc --noEmit
```

### Step 4.2: Unit tests
```bash
npm run test
```

### Step 4.3: Build
```bash
npm run build
```

### Step 4.4: Manual verification
1. Run `npm run dev`
2. Navigate to Terminal
3. Click tree → select lens → click journey pill
4. Verify: Journey content panel appears
5. Click "Explore This" → prompt sent to chat
6. Click "Next →" → progress advances
7. On final waypoint → "Complete Journey" button
8. Complete → modal appears

### Step 4.5: E2E screenshots
```bash
npx playwright test tests/e2e/journey-screenshots.spec.ts --update-snapshots
```

---

## Rollback Plan

If issues discovered:

1. **Quick fix:** Comment out JourneyContent render block in Terminal.tsx
2. **Full rollback:** `git revert HEAD` (single commit strategy)

No database migrations. No external API changes. Pure frontend code.

---

## Files Changed Summary

| File | Action | Lines Est. |
|------|--------|------------|
| `src/core/schema/journey.ts` | MODIFY | +25 |
| `src/core/schema/journey-provenance.ts` | CREATE | ~30 |
| `src/core/schema/index.ts` | MODIFY | +3 |
| `components/Terminal/JourneyContent.tsx` | CREATE | ~150 |
| `components/Terminal/JourneyContent.test.tsx` | CREATE | ~100 |
| `components/Terminal/index.ts` | MODIFY | +1 |
| `components/Terminal.tsx` | MODIFY | +50 |

**Total new code:** ~360 lines
