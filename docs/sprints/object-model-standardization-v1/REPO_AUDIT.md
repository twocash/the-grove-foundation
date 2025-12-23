# Repository Audit — Object Model Standardization

## Audit Date: December 23, 2024

## Current State Summary

The application has inconsistent behavior between Lens selection and Journey selection flows. Users experience:
1. **Extra clicks required**: After selecting a lens, users must click "Continue Exploring" to return to chat
2. **Missing visual feedback**: No highlight on cards when viewing their details in the inspector
3. **Ghost panels**: Inspector persists after activation, overlaying the chat interface

## File Structure Analysis

### Core Files Requiring Changes

| File | Purpose | Lines | Issue |
|------|---------|-------|-------|
| `src/explore/LensPicker.tsx` | Lens grid and selection | ~420 | `handleSelect` opens inspector instead of closing |
| `src/explore/LensInspector.tsx` | Lens detail panel | ~280 | Button uses inline handler, bypasses `handleActivate` |
| `src/explore/JourneyList.tsx` | Journey grid and selection | ~220 | `handleStart` missing `closeInspector()` call |
| `src/explore/JourneyInspector.tsx` | Journey detail panel | ~180 | ✓ Correct implementation (reference) |

### Component Hierarchy

```
ExploreView
├── LensPicker
│   ├── LensCard (standard personas)
│   └── CustomLensCard (user-created)
├── LensInspector (drawer)
├── JourneyList
│   └── JourneyCard
└── JourneyInspector (drawer)
```

### Shared Context

```typescript
// WorkspaceUIContext provides:
interface WorkspaceUI {
  inspector: {
    isOpen: boolean;
    mode: { type: 'lens' | 'journey'; lensId?: string; journeyId?: string };
  };
  openInspector: (mode: InspectorMode) => void;
  closeInspector: () => void;
  navigateTo: (path: string[]) => void;
}
```

## Technical Debt Identified

### 1. Inconsistent Handler Patterns
- **LensPicker.handleSelect**: Opens inspector after selection (backwards)
- **JourneyList.handleStart**: Navigates but doesn't close inspector
- **LensInspector button**: Inline onClick bypasses the `handleActivate` function that exists but isn't used

### 2. Missing Visual States
- Cards have `isActive` prop for "currently applied" state
- Cards lack `isInspected` prop for "currently viewing" state
- No visual feedback when inspector is showing a card's details

### 3. Button Style Inconsistency
- Journey "Start" button: Filled primary (`bg-primary text-white`)
- Lens "Select" button: Ghost/outline style
- Should match for consistent UX

### 4. Component Coverage Gap
- `CustomLensCard` exists but wasn't addressed in original PRD
- Uses violet color scheme, needs same patterns

## Root Cause Analysis

### Why Inspector Persists (Lens Flow)

```typescript
// LensPicker.tsx lines 318-326 — CURRENT (WRONG)
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  onAfterSelect?.(personaId);
  // ... compact mode handling ...
  workspaceUI.openInspector({ type: 'lens', lensId: personaId }); // BUG: Opens inspector
};
```

The `handleSelect` function explicitly **opens** the inspector after selection. This is the root cause of the "Continue Exploring" extra click requirement.

### Why Inspector Persists (Journey Flow)

```typescript
// JourneyList.tsx lines 161-168 — CURRENT (INCOMPLETE)
const handleStart = (journeyId: string) => {
  startJourney(journeyId);
  // ... compact mode handling ...
  workspaceUI.navigateTo(['explore', 'groveProject']); // Missing: closeInspector()
};
```

The `handleStart` function navigates away but never closes the inspector, leaving it open as a ghost panel.

### Reference Implementation (JourneyInspector)

```typescript
// JourneyInspector.tsx lines 44-48 — CORRECT
const handleStart = () => {
  startJourney(journeyId);
  navigateTo(['explore']);
  closeInspector(); // ✓ Properly closes
};
```

## Recommendations

1. **Fix root cause in list components**: Change `handleSelect` and `handleStart` to close inspector and navigate, not open/persist
2. **Add `isInspected` prop**: Derive from `workspaceUI.inspector.mode` and pass to cards
3. **Standardize button styles**: Update Lens "Select" to match Journey "Start"
4. **Include CustomLensCard**: Apply violet variant of same patterns
5. **Test all paths**: Both card buttons and inspector buttons should produce identical behavior
