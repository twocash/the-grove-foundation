# Continuation Prompt: Post engagement-consolidation-v1

## Session Context

**Completed:**
- ✅ engagement-consolidation-v1 — Merged EngagementBus + TelemetryCollector
- ✅ Post-consolidation hotfix — Added null checks, attempted re-render fix, attempted journey click wiring

**Remaining Issues (from console logs):**
1. **P0 CRASH:** TypeError in WaveformCollapse on lens selection
2. **P2 PERF:** 30+ re-renders per state change (refreshKey anti-pattern)
3. **P1 BROKEN:** Journey pills don't fire click events

**Next Sprint:** `journey-system-v2` (spec at `docs/sprints/journey-system-v2/INDEX.md`)

---

## For Claude CLI Session Handoff

```
CONTEXT: Post engagement-consolidation-v1 sprint
THREE BUGS DISCOVERED during verification that need fixing before journeys work.

BUG 1 - TypeError CRASH (P0):
Location: WaveformCollapse component during lens selection animation
Console shows:
  [WaveformCollapse] Text changed while idle, updating directly
  Uncaught TypeError: Cannot read properties of undefined (reading 'length')
  
FIX APPROACH:
  1. Open src/components/WaveformCollapse.tsx
  2. Search for .length access
  3. Add defensive null/undefined checks
  4. Test: Select a lens, animation shouldn't crash

BUG 2 - Re-render Storm (P2):
Console shows 30+ identical log pairs per state change:
  [useSuggestedPrompts] engagementState: {...refreshKey: 6}
  [TerminalHeader] Rendering with stage: EXPLORING...
  (repeats 30+ times)

ROOT CAUSE: refreshKey pattern in useEngagementBus.ts
The "fix" we applied created a refreshKey that increments on every subscription fire,
which FORCES re-renders even when state is identical.

FIX APPROACH:
  1. Open hooks/useEngagementBus.ts
  2. REMOVE refreshKey entirely - it's an anti-pattern
  3. Consider useSyncExternalStore pattern for proper subscription:
     ```typescript
     import { useSyncExternalStore } from 'react';
     
     export function useEngagementState() {
       return useSyncExternalStore(
         engagementBus.subscribe,
         engagementBus.getSnapshot,
         engagementBus.getSnapshot // server snapshot
       );
     }
     ```
  4. Ensure engagementBus.getSnapshot returns SAME reference if state unchanged
  5. Target: ≤3 renders per meaningful state change

BUG 3 - Journey Click Not Firing (P1):
Console shows ZERO journey-related logs when clicking journey pills.
Click handler isn't wired correctly.

FIX APPROACH:
  1. Add traces at each step:
     - TerminalWelcome.tsx: console.log('[JOURNEY CLICK] prompt:', prompt)
     - Terminal.tsx: console.log('[JOURNEY HANDLER] received:', prompt)
  2. Verify prompt object has journeyId property
  3. Verify getJourneyById returns a journey
  4. Verify emit.journeyStarted() is called
  5. Test: Click journey pill, should see [JOURNEY_STARTED] in console

EXECUTION ORDER:
1. Fix TypeError FIRST (blocks testing other fixes)
2. Fix re-renders SECOND (clears console noise for debugging)
3. Fix journey click THIRD (requires clear console to trace)

VERIFICATION:
After all three fixes:
- [ ] Lens selection doesn't crash
- [ ] Console shows ≤5 logs per state change (not 30+)
- [ ] Clicking journey pill shows JOURNEY_STARTED event
- [ ] Journey progress indicator appears

KEY FILES:
- src/components/WaveformCollapse.tsx — TypeError source
- hooks/useEngagementBus.ts — Re-render source
- components/Terminal/TerminalWelcome.tsx — Journey click start
- components/Terminal.tsx — Journey click handler

SPRINT DOCS:
- Completed: docs/sprints/engagement-consolidation-v1/
- Planning: docs/sprints/journey-system-v2/INDEX.md

COMMANDS:
npm run dev          # Dev server (check console for bugs)
npm run test         # All tests (should pass)
npm run build        # Production build
```

---

## Technical Debt Context

These bugs exposed architectural issues worth fixing properly:

### TD-001: Journey Suggestions Hardcoded
```typescript
// Current (src/data/prompts/stage-prompts.ts)
{
  id: 'journey-simulation',
  text: '🗺️ The Ghost in the Machine',
  journeyId: 'simulation',
  weight: 1.2,
}
```

**Target:** Declarative JSON registry with filtering by completion state.

### TD-002/003: Stage Thresholds & Prompt Filtering
Both hardcoded in TypeScript. Should be declarative config.

**Decision:** Fix bugs FIRST, then tackle TD items in separate sprint if time permits.

---

## Architectural Opportunity: useSyncExternalStore

The re-render problem is a symptom of manual subscription management.
React 18's `useSyncExternalStore` is designed exactly for this:

```typescript
// hooks/useEngagementBus.ts

import { useSyncExternalStore } from 'react';

// Singleton bus with stable references
const engagementBus = {
  state: loadInitialState(),
  listeners: new Set<() => void>(),
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  getSnapshot() {
    return this.state; // Returns SAME reference if unchanged
  },
  
  emit(event: EngagementEvent) {
    const newState = reduce(this.state, event);
    if (newState !== this.state) { // Only update if different
      this.state = newState;
      this.listeners.forEach(l => l());
    }
  }
};

// Hook consumers
export function useEngagementState() {
  return useSyncExternalStore(
    engagementBus.subscribe.bind(engagementBus),
    engagementBus.getSnapshot.bind(engagementBus),
    engagementBus.getSnapshot.bind(engagementBus)
  );
}
```

This eliminates:
- Manual useState + useEffect subscription
- refreshKey hacks
- Stale closure bugs
- Multiple re-renders

**Recommendation:** Consider this refactor as part of the fix, not separate sprint.

---

## Quick Diagnostic Commands

```bash
# Check current state of key files
cat src/components/WaveformCollapse.tsx | grep -n "\.length"
cat hooks/useEngagementBus.ts | grep -n "refreshKey"
grep -n "journeyId" components/Terminal/TerminalWelcome.tsx

# Check tests still pass
npm run test -- --reporter=dot

# Check build
npm run build
```
