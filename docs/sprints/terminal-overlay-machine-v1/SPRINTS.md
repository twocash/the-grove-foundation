# Sprint Plan: terminal-overlay-machine-v1

## Overview

| Metric | Value |
|--------|-------|
| **Total Epics** | 4 |
| **Total Stories** | 11 |
| **Estimated Duration** | 2-3 hours |
| **Risk Level** | Medium (refactor of core component) |

---

## Epic 1: Type Foundation

**Goal:** Establish new type system alongside existing (additive, no breaking changes)

### Story 1.1: Add TerminalOverlay Type

**Task:** Add discriminated union type to types.ts

**Files:** `components/Terminal/types.ts`

**Implementation:**
```typescript
export type TerminalOverlay = 
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string }
  | { type: 'field-picker' };

export type OverlayType = TerminalOverlay['type'];
export const INITIAL_OVERLAY: TerminalOverlay = { type: 'none' };
```

**Verification:**
- [ ] Types compile without errors
- [ ] No changes to existing types yet

### Story 1.2: Create Overlay Registry

**Task:** Create declarative component registry

**Files:** `components/Terminal/overlay-registry.ts` (new)

**Implementation:** See MIGRATION_MAP.md Section 2

**Verification:**
- [ ] File created with all 4 overlay configs
- [ ] Imports resolve correctly
- [ ] No circular dependencies

### Story 1.3: Create Overlay Helpers

**Task:** Create derived state helper functions

**Files:** `components/Terminal/overlay-helpers.ts` (new)

**Implementation:** See MIGRATION_MAP.md Section 4

**Verification:**
- [ ] `shouldShowInput()` returns correct values
- [ ] `isOverlayActive()` returns correct values

### Build Gate

```bash
npm run build  # Must pass - additive changes only
```

---

## Epic 2: Renderer Component

**Goal:** Create unified overlay renderer

### Story 2.1: Create TerminalOverlayRenderer

**Task:** Build renderer that maps overlay type to component

**Files:** `components/Terminal/TerminalOverlayRenderer.tsx` (new)

**Implementation:** See MIGRATION_MAP.md Section 3

**Verification:**
- [ ] Component renders correct overlay based on type
- [ ] Returns null for `type: 'none'`
- [ ] Props mapped correctly per overlay type

### Story 2.2: Export New Components

**Task:** Update barrel exports

**Files:** `components/Terminal/index.ts`

**Implementation:**
```typescript
export { TerminalOverlayRenderer } from './TerminalOverlayRenderer';
export { OVERLAY_REGISTRY } from './overlay-registry';
export { shouldShowInput, isOverlayActive } from './overlay-helpers';
export type { TerminalOverlay, OverlayType } from './types';
```

**Verification:**
- [ ] All new components importable from `./Terminal`
- [ ] No export conflicts

### Build Gate

```bash
npm run build  # Must pass
```

---

## Epic 3: State Migration

**Goal:** Replace boolean flags with overlay state

### Story 3.1: Add Overlay State to Hook

**Task:** Add overlay useState alongside existing booleans (dual-write phase)

**Files:** `components/Terminal/useTerminalState.ts`

**Implementation:**
```typescript
// Add alongside existing:
const [overlay, setOverlayInternal] = useState<TerminalOverlay>(
  showWelcome ? { type: 'welcome' } : INITIAL_OVERLAY
);

// Add new actions:
const setOverlay = useCallback((newOverlay: TerminalOverlay) => {
  setOverlayInternal(newOverlay);
  // Also update legacy booleans for now (dual-write)
  setShowLensPicker(newOverlay.type === 'lens-picker');
  setShowJourneyPicker(newOverlay.type === 'journey-picker');
  setShowCustomLensWizard(newOverlay.type === 'wizard');
  setShowWelcomeInterstitial(newOverlay.type === 'welcome');
}, []);
```

**Verification:**
- [ ] Both old and new state work simultaneously
- [ ] Setting overlay updates legacy booleans
- [ ] No regressions in existing behavior

### Story 3.2: Update Terminal.tsx to Use Renderer

**Task:** Replace ternary cascade with TerminalOverlayRenderer

**Files:** `components/Terminal.tsx`

**Implementation:**
```tsx
// Add overlay handlers
const overlayHandlers: OverlayHandlers = useMemo(() => ({
  onDismiss: () => actions.dismissOverlay(),
  onLensSelect: handleLensSelect,
  onWelcomeChooseLens: () => actions.setOverlay({ type: 'lens-picker' }),
  onWizardComplete: handleCustomLensComplete,
  onWizardCancel: () => actions.dismissOverlay()
}), [actions, handleLensSelect, handleCustomLensComplete]);

// Replace ternary cascade
{overlay.type !== 'none' ? (
  <TerminalOverlayRenderer overlay={overlay} handlers={overlayHandlers} />
) : (
  <ChatContent />
)}
```

**Verification:**
- [ ] Overlays render correctly
- [ ] All overlay transitions work
- [ ] Input visibility correct

### Story 3.3: Update Action Callsites

**Task:** Change all `showLensPicker()` calls to `setOverlay({ type: 'lens-picker' })`

**Files:** `components/Terminal.tsx`

**Implementation:**
```typescript
// Find and replace:
// actions.showLensPicker() → actions.setOverlay({ type: 'lens-picker' })
// actions.showJourneyPicker() → actions.setOverlay({ type: 'journey-picker' })
// actions.showCustomLensWizard() → actions.setOverlay({ type: 'wizard' })
// actions.showWelcomeInterstitial() → actions.setOverlay({ type: 'welcome' })
// actions.hideLensPicker() → actions.dismissOverlay()
// etc.
```

**Verification:**
- [ ] All callsites updated
- [ ] No TypeScript errors
- [ ] All flows still work

### Build Gate

```bash
npm run build
npm test  # If tests exist
```

---

## Epic 4: Cleanup

**Goal:** Remove legacy state and complete migration

### Story 4.1: Remove Dual-Write from setOverlay

**Task:** Remove legacy boolean updates from setOverlay

**Files:** `components/Terminal/useTerminalState.ts`

**Implementation:**
```typescript
// Remove the dual-write lines:
const setOverlay = useCallback((newOverlay: TerminalOverlay) => {
  setOverlayInternal(newOverlay);
  // REMOVE: setShowLensPicker, setShowJourneyPicker, etc.
}, []);
```

**Verification:**
- [ ] App still works with overlay only
- [ ] No regressions

### Story 4.2: Remove Legacy State

**Task:** Remove boolean flags and old actions from hook

**Files:** `components/Terminal/useTerminalState.ts`

**Implementation:**
- Remove useState declarations for booleans
- Remove useCallback for show/hide actions
- Update state memo to exclude booleans
- Update actions memo to exclude old actions

**Verification:**
- [ ] Hook significantly shorter
- [ ] No TypeScript errors
- [ ] All tests pass

### Story 4.3: Remove Legacy Types

**Task:** Remove TerminalFlowState and boolean fields from types

**Files:** `components/Terminal/types.ts`

**Implementation:**
- Remove `TerminalFlowState` type
- Remove boolean fields from `TerminalUIState`
- Remove old actions from `TerminalActions`
- Update `INITIAL_TERMINAL_UI_STATE`

**Verification:**
- [ ] Types file cleaner
- [ ] No TypeScript errors anywhere
- [ ] Build passes

### Build Gate (Final)

```bash
npm run build            # Compiles
npm test                 # All tests pass
npx playwright test      # E2E if configured
```

---

## QA Checklist

### Functional Testing

- [ ] **New User Flow:**
  - Open Terminal fresh → Welcome appears
  - Click "Choose Lens" → LensPicker appears
  - Select lens → Chat appears with lens active

- [ ] **Lens Switching:**
  - In chat, click Lens pill → LensPicker appears
  - Select different lens → Chat returns, lens changed
  - Click back → Chat returns, lens unchanged

- [ ] **Journey Switching:**
  - Click Journey pill → JourneyList appears
  - Select journey → Chat returns, journey active
  - Click back → Chat returns, no change

- [ ] **Custom Lens Wizard:**
  - Trigger wizard → Wizard appears
  - Complete wizard → Lens created, chat returns
  - Cancel wizard → Chat returns, no change

- [ ] **Input Visibility:**
  - In chat → Input visible
  - In any overlay → Input hidden
  - Return to chat → Input visible

### Visual Testing

- [ ] No visual changes to any overlay
- [ ] No visual changes to chat area
- [ ] Transitions smooth (no flicker)

### Edge Cases

- [ ] Rapid overlay switching doesn't break state
- [ ] Browser refresh maintains correct state
- [ ] Works in both embedded and overlay variants

---

## Rollback Plan

If issues discovered after merge:

1. `git revert <commit-hash>` the merge
2. Re-deploy previous version
3. Document issues in DEVLOG.md
4. Plan fix sprint

The migration uses clearly separable files, making partial rollback possible:
- Remove new files (overlay-registry.ts, TerminalOverlayRenderer.tsx, overlay-helpers.ts)
- Restore previous types.ts and useTerminalState.ts
- Restore Terminal.tsx
