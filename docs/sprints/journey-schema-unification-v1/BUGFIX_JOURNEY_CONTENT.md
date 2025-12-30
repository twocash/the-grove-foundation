# Bug Fix: Journey Content Not Rendering

**Sprint:** journey-content-renderer-hotfix  
**Date:** 2024-12-28  
**Severity:** HIGH - Core feature broken  
**Prerequisite:** journey-schema-unification-v1 complete (✅ 72e8b98)

---

## Problem Statement

Journey pills appear and can be clicked. XState receives `START_JOURNEY` events correctly. BUT... **no journey content ever renders in the Terminal**.

**Console Evidence:**
```
[JourneyService] Found in registry: stakes
[Terminal] Pill button journey lookup: Object
```

The journey IS being found and started, but the UI shows no waypoint content.

---

## Root Cause

In `components/Terminal.tsx`:

1. **Lines 167-173** extract journey state from XState:
```typescript
const {
  journey: engJourney,
  isActive: isJourneyActive,
  startJourney: engStartJourney,
  advanceStep,
  exitJourney: engExitJourney
} = useJourneyState({ actor });
```

2. **Lines 1588-1606** render `<JourneyCard>` BUT only for the **OLD** system:
```typescript
) : currentThread.length > 0 && currentPosition < currentThread.length ? (
  <JourneyCard
    currentPosition={currentPosition}
    totalCards={currentThread.length}
    currentCard={getThreadCard(currentPosition)}
    ...
  />
```

3. **NOWHERE** does Terminal.tsx render anything when `isJourneyActive === true`

The old `JourneyCard` uses `currentThread` from NarrativeEngine (Card[] type).  
The new system uses `engJourney.waypoints[]` from XState (JourneyWaypoint[] type).

**Nothing bridges this gap.**

---

## Solution

Create `JourneyContent` component that renders the active journey waypoint and wire it into Terminal.tsx.

---

## Files to Create

### 1. `components/Terminal/JourneyContent.tsx`

```typescript
// components/Terminal/JourneyContent.tsx
// Renders active journey waypoint content
// Sprint: journey-content-renderer-hotfix

import React from 'react';
import type { Journey, JourneyWaypoint } from '../../src/core/schema/journey';

interface JourneyContentProps {
  journey: Journey;
  currentWaypoint: JourneyWaypoint | null;
  journeyProgress: number;
  journeyTotal: number;
  progressPercent: number;
  onAdvance: () => void;
  onExit: () => void;
  onSendPrompt: (prompt: string) => void;
}

const JourneyContent: React.FC<JourneyContentProps> = ({
  journey,
  currentWaypoint,
  journeyProgress,
  journeyTotal,
  progressPercent,
  onAdvance,
  onExit,
  onSendPrompt,
}) => {
  if (!currentWaypoint) {
    return null;
  }

  const isLastWaypoint = journeyProgress >= journeyTotal - 1;

  return (
    <div className="journey-content mb-4">
      {/* Journey Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Journey
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {journey.title}
          </span>
        </div>
        <button
          onClick={onExit}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          title="Exit journey"
        >
          ✕ Exit
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-700 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Waypoint Content */}
      <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-4 mb-3">
        <div className="text-xs text-emerald-300/70 mb-1">
          Waypoint {journeyProgress + 1} of {journeyTotal}
        </div>
        <h3 className="text-sm font-semibold text-emerald-100 mb-2">
          {currentWaypoint.title}
        </h3>
        {currentWaypoint.prompt && (
          <p className="text-sm text-slate-300 leading-relaxed">
            {currentWaypoint.prompt}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Explore this waypoint */}
        <button
          onClick={() => onSendPrompt(currentWaypoint.prompt)}
          className="flex-1 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
        >
          Explore This
        </button>

        {/* Advance or Complete */}
        <button
          onClick={onAdvance}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            isLastWaypoint
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
        >
          {isLastWaypoint ? 'Complete Journey' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default JourneyContent;
```

### 2. Update `components/Terminal/index.ts`

Add export:
```typescript
export { default as JourneyContent } from './JourneyContent';
```

---

## Files to Modify

### 3. `components/Terminal.tsx`

#### 3.1 Add import (near line 16)

```typescript
import { LensBadge, CustomLensWizard, JourneyCard, JourneyCompletion, JourneyNav, JourneyContent, LoadingIndicator, ...
```

#### 3.2 Extract additional journey state (near line 167)

Update the destructuring to include more state:

```typescript
const {
  journey: engJourney,
  isActive: isJourneyActive,
  currentWaypoint,        // ADD
  journeyProgress,        // ADD
  journeyTotal,           // ADD  
  progressPercent,        // ADD
  startJourney: engStartJourney,
  advanceStep,
  completeJourney,        // ADD
  exitJourney: engExitJourney
} = useJourneyState({ actor });
```

#### 3.3 Add journey completion handler (after other handlers, ~line 700)

```typescript
// Handle journey advancement
const handleJourneyAdvance = useCallback(() => {
  if (journeyProgress >= journeyTotal - 1) {
    // Last waypoint - complete the journey
    completeJourney();
    actions.setReveal('journeyCompletion', true);
    recordJourneyCompleted();
    incrementJourneysCompleted();
    if (engJourney) {
      actions.setCompletedJourneyTitle(engJourney.title);
    }
  } else {
    // Advance to next waypoint
    advanceStep();
  }
}, [journeyProgress, journeyTotal, completeJourney, advanceStep, engJourney, recordJourneyCompleted, incrementJourneysCompleted, actions]);
```

#### 3.4 Render JourneyContent when active (~line 1585)

Find the section that renders suggestions/journey cards (around line 1585). Add this BEFORE the existing `JourneyCard` render:

```typescript
{/* NEW: Active Journey Content (XState-based) */}
{isJourneyActive && engJourney && currentWaypoint ? (
  <JourneyContent
    journey={engJourney}
    currentWaypoint={currentWaypoint}
    journeyProgress={journeyProgress}
    journeyTotal={journeyTotal}
    progressPercent={progressPercent}
    onAdvance={handleJourneyAdvance}
    onExit={engExitJourney}
    onSendPrompt={(prompt) => handleSend(prompt)}
  />
) : nextNodes.length > 0 ? (
  // ... existing nextNodes render
```

---

## Verification Steps

### 1. Build Check
```bash
npm run build
```

### 2. Unit Tests
```bash
npm run test
```

### 3. Manual Verification

1. Open http://localhost:5173
2. Click the tree to open Terminal
3. Select a lens (e.g., "Academic")
4. Click a journey pill (e.g., "The $380 Billion Bet")
5. **Expected:** Journey content panel appears showing:
   - Journey title and exit button
   - Progress bar
   - Current waypoint title and prompt
   - "Explore This" and "Next" buttons
6. Click "Explore This" → sends waypoint prompt to chat
7. Click "Next" → advances to next waypoint
8. At last waypoint, button says "Complete Journey"

### 4. Console Verification

After clicking a journey pill, you should see:
```
[JourneyService] Found in registry: <journey-id>
[Terminal] Pill button journey lookup: {id: '...', waypoints: [...]}
```

And the `isJourneyActive` should be `true` (verify via React DevTools).

---

## Commit

```bash
git add -A
git commit -m "fix: render journey waypoint content when journey active

- Create JourneyContent component for XState-based journeys
- Wire into Terminal.tsx render logic
- Add journey advancement and completion handlers
- Bridge gap between XState journey state and UI render

Fixes: journey-content-not-rendering
Builds on: journey-schema-unification-v1 (72e8b98)"

git push origin main
```

---

## Secondary Bug: Lens-to-Pills Binding

After fixing BUG-1, verify if lens changes update the journey pills:

1. Select "Academic" lens → note which journey pills appear
2. Change to "Engineer" lens → pills SHOULD change based on `lensAffinity`
3. If pills don't change, check `src/data/prompts/stage-prompts.ts` to verify journeys have `lensAffinity` set

If lens filtering isn't working, that's a separate issue in `useSuggestedPrompts.ts` filtering logic.

---

## Architecture Note

This fix bridges two systems:

| System | Data Type | State Location |
|--------|-----------|----------------|
| Old (NarrativeEngine) | `Card[]` via `currentThread` | NarrativeEngine session |
| New (XState) | `JourneyWaypoint[]` via `engJourney` | XState machine context |

The old `JourneyCard` component remains for backward compatibility.  
The new `JourneyContent` component handles XState-based journeys.

Eventually, the old system should be deprecated once all journeys are migrated to the TypeScript registry.

---

*End of Bug Fix Prompt*
