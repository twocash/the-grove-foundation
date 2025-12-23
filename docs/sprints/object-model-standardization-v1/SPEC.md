# Specification — Object Model Standardization

## Overview

Unify the Lens and Journey selection flows to follow a consistent Object Model pattern: **Select → Inspect → Activate → Return**. Users should experience identical interaction patterns regardless of which type of content they're selecting.

## Goals

1. **Clean activation**: Clicking "Select" (Lens) or "Start" (Journey) immediately activates the item, closes all overlays, and returns user to Chat
2. **Visual feedback**: Cards display a visible ring highlight when their details are shown in the inspector
3. **Button consistency**: Both flows use filled primary button style for the activation action
4. **No ghost panels**: Inspector never persists after activation—it closes automatically

## Non-Goals

- **Keyboard navigation**: Arrow keys, Enter to select are a separate enhancement
- **Animation/transitions**: Smooth open/close animations are desirable but not blocking
- **Compact mode visual highlights**: CompactLensCard/CompactJourneyCard don't pair with an inspector, so `isInspected` doesn't apply
- **Refactoring WorkspaceUIContext**: The context API is correct; only consumers need fixes

## Target User Experience

### Flow 1: Lens Selection
1. User opens Lenses tab
2. User clicks a Lens card body → Card highlights with ring, Inspector opens showing details
3. User clicks "Select" (card or inspector) → Lens activates, Inspector closes, Chat appears
4. No intermediate steps required

### Flow 2: Journey Selection
1. User opens Journeys tab
2. User clicks a Journey card body → Card highlights with ring, Inspector opens showing details
3. User clicks "Start" (card or inspector) → Journey starts, Inspector closes, Chat appears
4. No intermediate steps required

## Acceptance Criteria

### AC-1: Selection Visibility
- [ ] Clicking a Lens card body applies `ring-2 ring-primary` highlight
- [ ] Clicking a Journey card body applies `ring-2 ring-primary` highlight
- [ ] Highlight persists as long as Inspector is open showing that item
- [ ] Clicking different card moves highlight to new card

### AC-2: Visual Consistency
- [ ] Lens "Select" button uses `bg-primary text-white` (filled style)
- [ ] Journey "Start" button maintains current filled style
- [ ] CustomLensCard uses `ring-2 ring-violet-400` variant

### AC-3: Clean Activation
- [ ] Clicking "Select" on lens card activates lens and closes inspector
- [ ] Clicking "Select Lens" in LensInspector activates lens and closes inspector
- [ ] Clicking "Start" on journey card activates journey and closes inspector
- [ ] Clicking "Start Journey" in JourneyInspector activates journey and closes inspector
- [ ] All four paths land user on clean Chat/Terminal interface

### AC-4: No Ghost Panels
- [ ] Inspector `isOpen` is `false` after any activation path
- [ ] Navigating back to chat never leaves inspector panel visible
- [ ] No "Continue Exploring" intermediate step required

### AC-5: Automated Testing
- [ ] E2E test: Lens card click opens inspector
- [ ] E2E test: Lens Select button closes inspector and returns to chat
- [ ] E2E test: Journey card click opens inspector
- [ ] E2E test: Journey Start button closes inspector and returns to chat
- [ ] E2E test: Inspector buttons match card button behavior
- [ ] All E2E tests pass: `npm run test:e2e`

### AC-6: Build & Existing Tests
- [ ] Build passes: `npm run build`
- [ ] Existing tests pass: `npm test`

## Visual State Matrix

| State | Condition | Visual Treatment |
|-------|-----------|------------------|
| Default | Not active, not inspected | `border-border-light hover:border-primary/30` |
| Inspected | `inspector.mode.id === card.id` | `ring-2 ring-primary border-primary` |
| Active | Currently applied lens/journey | `border-primary/30 bg-primary/5 ring-1 ring-primary/20` + "Active" badge |
| Both | Active AND inspected | Same as Inspected (ring takes precedence) + "Active" badge |

**Note**: Inspected state takes visual precedence because user needs clear feedback about which card's details are shown in the inspector.
