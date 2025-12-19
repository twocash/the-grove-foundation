# EXECUTION PROMPT - Sprint 6: Analytics & Tuning

## CONTEXT

You are working on the Grove Terminal codebase at `C:\GitHub\the-grove-foundation`.

The Cognitive Simulator (Sprints 4-5) is **COMPLETE**. The entropy detector scores conversations, the CognitiveBridge component renders inline when thresholds trigger, and journey routing works.

**Sprint 6 Goal:** Add analytics instrumentation and isolate tuning parameters.

## REPO INTELLIGENCE

Read these docs first:
- `docs/REPO_AUDIT.md` - Current codebase state
- `docs/SPEC.md` - Functional requirements
- `docs/ARCHITECTURE.md` - System design
- `docs/SPRINTS.md` - Sprint status

Key files:
- `src/core/engine/entropyDetector.ts` - Entropy scoring logic (✅ COMPLETE)
- `components/Terminal/CognitiveBridge.tsx` - Bridge UI (✅ COMPLETE)  
- `components/Terminal.tsx` - Bridge integration at ~L943 (✅ COMPLETE)
- `hooks/useNarrativeEngine.ts` - State management (✅ COMPLETE)
- `utils/funnelAnalytics.ts` - Existing analytics infrastructure (TARGET)
- `constants.ts` - App constants (TARGET)

## EXECUTION PLAN

### Step 1: Read Existing Analytics
```
Read utils/funnelAnalytics.ts to understand:
- Existing event patterns
- How events are tracked
- Naming conventions
```

### Step 2: Add Bridge Events
Add these tracking functions to `utils/funnelAnalytics.ts`:

```typescript
// Bridge shown to user
export function trackBridgeShown(data: {
  journeyId: string;
  entropyScore: number;
  cluster: string;
  exchangeCount: number;
}): void {
  // Follow existing pattern
}

// User accepted bridge
export function trackBridgeAccepted(data: {
  journeyId: string;
  timeToDecisionMs: number;
}): void {
  // Follow existing pattern
}

// User dismissed bridge
export function trackBridgeDismissed(data: {
  journeyId: string;
  timeToDecisionMs: number;
}): void {
  // Follow existing pattern
}
```

### Step 3: Wire Events in Terminal.tsx

Find the bridge rendering logic (~L943-1000) and add tracking:

1. **When bridge renders:** Call `trackBridgeShown()` with entropy data
2. **In onAccept handler:** Call `trackBridgeAccepted()` with timing
3. **In onDismiss handler:** Call `trackBridgeDismissed()` with timing

Track `timeToDecision` by storing `Date.now()` when bridge appears, calculate delta on action.

### Step 4: Isolate Tuning Constants

Move entropy thresholds from `entropyDetector.ts` to `constants.ts`:

```typescript
// constants.ts - add these
export const ENTROPY_CONFIG = {
  THRESHOLDS: {
    LOW: 30,
    MEDIUM: 60,
  },
  LIMITS: {
    MAX_INJECTIONS_PER_SESSION: 2,
    COOLDOWN_EXCHANGES: 5,
  },
  SCORING: {
    EXCHANGE_DEPTH_BONUS: 30,
    TAG_MATCH_POINTS: 15,
    MAX_TAG_MATCHES: 3,
    DEPTH_MARKER_POINTS: 20,
    REFERENCE_CHAIN_POINTS: 25,
  }
};
```

Then update `entropyDetector.ts` to import from constants:

```typescript
import { ENTROPY_CONFIG } from '../../constants';

// Replace hardcoded values with ENTROPY_CONFIG references
```

### Step 5: Validate Journey Metadata

Check `CognitiveBridge.tsx` DEFAULT_JOURNEY_INFO against actual schema:

1. Read `data/narratives.json` (or fetch from GCS)
2. Verify journey IDs match: `ratchet`, `stakes`, `simulation`
3. Verify metadata (nodeCount, estimatedMinutes) is accurate
4. Update DEFAULT_JOURNEY_INFO if discrepancies found

### Step 6: Verification

```bash
npm run build   # Type safety
npm run dev     # Manual testing
```

Manual test:
1. Type 3+ messages with technical vocabulary ("ratchet", "efficiency tax")
2. Verify Bridge appears
3. Check console for analytics events
4. Verify accept/dismiss both fire events with timing

## CRITICAL INSTRUCTIONS

- **CITATIONS:** When modifying existing files, cite `path:line-line` of insertion points
- **NO REFACTORS:** Keep Terminal.tsx changes minimal (add tracking calls only)
- **FOLLOW PATTERNS:** Match existing analytics event structure in funnelAnalytics.ts
- **TYPE SAFETY:** Ensure all new functions have proper TypeScript types

## ACCEPTANCE CRITERIA

- [ ] `trackBridgeShown()`, `trackBridgeAccepted()`, `trackBridgeDismissed()` exist
- [ ] Events fire in console when bridge appears/is acted upon
- [ ] Entropy thresholds isolated in `constants.ts`
- [ ] `entropyDetector.ts` imports from constants (no hardcoded thresholds)
- [ ] Build passes: `npm run build`
- [ ] Journey metadata validated against schema

## BEGIN

Start by reading `utils/funnelAnalytics.ts` to understand the existing event pattern.
