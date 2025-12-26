# Repository Audit: terminal-overlay-machine-v1

## Executive Summary

Terminal's overlay state management has accumulated technical debt through incremental additions. What started as a clean `TerminalFlowState` enum has grown parallel boolean flags that duplicate and conflict with the original design. This audit documents the current state for targeted refactoring.

## Current State Analysis

### State Definition (types.ts)

**Location:** `components/Terminal/types.ts`

```typescript
// CURRENT: Redundant sources of truth
type TerminalFlowState = 'idle' | 'welcome' | 'selecting' | 'wizard' | 'active';

interface TerminalUIState {
  flowState: TerminalFlowState;        // Enum approach
  showLensPicker: boolean;             // Duplicates 'selecting'
  showJourneyPicker: boolean;          // Added later, no flowState equivalent
  showCustomLensWizard: boolean;       // Duplicates 'wizard'
  showWelcomeInterstitial: boolean;    // Duplicates 'welcome'
  hasShownWelcome: boolean;            // Legitimate separate flag
  // ...other state
}
```

**Problems:**
1. `flowState` and boolean flags can get out of sync
2. `showJourneyPicker` was added without corresponding flowState value
3. Manual sync logic required in actions

### State Management (useTerminalState.ts)

**Location:** `components/Terminal/useTerminalState.ts`

```typescript
// CURRENT: Manual sync that's error-prone
const setFlowState = useCallback((state: TerminalFlowState) => {
  setFlowStateInternal(state);
  switch (state) {
    case 'selecting':
      setShowLensPicker(true);
      setShowCustomLensWizard(false);
      // BUG: showJourneyPicker not reset here!
      break;
    // ...
  }
}, []);

// CURRENT: Separate actions for each boolean
const showLensPickerAction = useCallback(() => {
  setShowLensPicker(true);
  setShowJourneyPicker(false);  // Manual mutual exclusivity
}, []);

const showJourneyPickerAction = useCallback(() => {
  setShowJourneyPicker(true);
  setShowLensPicker(false);     // Manual mutual exclusivity
}, []);
```

**Problems:**
1. Each new overlay needs new useState + useCallback
2. Mutual exclusivity is manual and scattered
3. Multiple places to update when adding overlays

### Rendering Logic (Terminal.tsx)

**Location:** `components/Terminal.tsx` (two render paths - embedded and overlay)

```tsx
// CURRENT: Cascade of ternaries (appears twice - embedded ~line 920, overlay ~line 1055)
{showWelcomeInterstitial ? (
  <WelcomeInterstitial />
) : showLensPicker ? (
  <LensPicker mode="compact" />
) : showJourneyPicker ? (
  <JourneyList mode="compact" />
) : showCustomLensWizard ? (
  <CustomLensWizard />
) : (
  <ChatContent />
)}

// Input visibility check (appears ~line 1000 for embedded, ~line 1250 for overlay)
{!showCustomLensWizard && !showWelcomeInterstitial && !showLensPicker && !showJourneyPicker && (
  <CommandInput />
)}
```

**Problems:**
1. Same logic duplicated for embedded vs overlay variants
2. Adding overlay requires finding both locations
3. Input visibility logic duplicates overlay checks

### Action Types (types.ts)

```typescript
// CURRENT: Separate actions for each overlay
interface TerminalActions {
  showLensPicker: () => void;
  hideLensPicker: () => void;
  showJourneyPicker: () => void;
  hideJourneyPicker: () => void;
  showCustomLensWizard: () => void;
  hideCustomLensWizard: () => void;
  showWelcomeInterstitial: () => void;
  hideWelcomeInterstitial: () => void;
  // ...
}
```

**Problems:**
1. 8 actions for what should be 2 (setOverlay, dismissOverlay)
2. Each new overlay adds 2 more actions
3. No single "dismiss current overlay" action

## Files Affected

| File | Lines | Role | Changes Needed |
|------|-------|------|----------------|
| `components/Terminal/types.ts` | 379 | Type definitions | Replace booleans with TerminalOverlay union |
| `components/Terminal/useTerminalState.ts` | 314 | State hooks | Replace 8 actions with 2 |
| `components/Terminal.tsx` | 1514 | Main component | Use TerminalOverlayRenderer |
| (new) `overlay-registry.ts` | ~50 | Registry config | Create |
| (new) `TerminalOverlayRenderer.tsx` | ~60 | Renderer | Create |

## Current Overlay Inventory

| Overlay | State Flag | In FlowState? | Hides Input? | Handler |
|---------|------------|---------------|--------------|---------|
| Welcome | `showWelcomeInterstitial` | `'welcome'` | Yes | `onChooseLens` → lens-picker |
| LensPicker | `showLensPicker` | `'selecting'` | Yes | `onBack`, `onAfterSelect` |
| JourneyPicker | `showJourneyPicker` | ❌ Missing | Yes | `onBack` |
| Wizard | `showCustomLensWizard` | `'wizard'` | Yes | `onComplete`, `onCancel` |

## Patterns to Extend

Per PROJECT_PATTERNS.md Phase 0:

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Overlay state machine | Pattern 2: Engagement Machine | Apply discriminated union pattern from XState |
| Component rendering | Pattern 8: Canonical Source | Registry maps overlay type to component |
| Input visibility | N/A (derived state) | Compute from registry config |

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regression in overlay transitions | Medium | Dual-write during migration |
| Missing handler wiring | Low | TypeScript will catch |
| Visual regression | Low | E2E tests + manual QA |

## Recommendation

This is a **refactor-in-place** sprint. No new functionality—just converting imperative state to declarative. The scope is contained to Terminal's overlay system with clear file boundaries.

Estimated effort: **1 development session** (2-3 hours)
