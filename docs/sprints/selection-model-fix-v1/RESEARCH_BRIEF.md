# Selection Model Research Brief
## Sprint: selection-model-fix-v1

**Date:** December 30, 2024  
**Status:** Research Complete  
**Priority:** High (Core UX Broken)

---

## Problem Statement

The inline sprout capture system has multiple selection-related bugs:

1. **Selection disappears when clicking MagneticPill** - Focus shifts to button, browser clears selection
2. **Selection highlights wrong text** - Race conditions between selection events and UI updates
3. **Selection lost when ActionMenu opens** - Menu render triggers focus change
4. **Random text gets highlighted** - Stale `SelectionState` referenced after user changes selection

---

## Root Cause Analysis

### Issue 1: Focus Theft
When user clicks MagneticPill or ActionMenu buttons, the browser:
1. Fires `mousedown` → focus moves to button
2. Fires `click` → handler executes
3. Selection collapses because focus left the selectable content

**Evidence:** MagneticPill has no `onMouseDown={(e) => e.preventDefault()}`

### Issue 2: Race Conditions  
Current flow:
```
User selects text
  → selectionchange event fires
  → 100ms debounce
  → handleSelectionChange reads window.getSelection()
  → setState(selection)
  → React renders MagneticPill
  → User clicks pill (but selection may have changed)
  → captureState uses stale selection data
```

**Problem:** The `selection` state captures a snapshot, but `window.getSelection()` is live. By the time user clicks, the selection may be different.

### Issue 3: Click-to-Clear Handler
```typescript
// useTextSelection.ts line 97-103
const handleClick = () => {
  const sel = window.getSelection();
  if (sel?.isCollapsed) {
    setSelection(null);
  }
};
document.addEventListener('click', handleClick);
```

This runs on EVERY click, including clicks on the pill itself. If the pill click causes selection to collapse (due to focus theft), this handler immediately clears the selection state.

### Issue 4: No Selection Preservation
The current implementation stores only derived data (`text`, `rect`, `messageId`, `contextSpan`), not the actual `Range` object. This means:
- Cannot restore the visual highlight after focus moves
- Cannot verify selection is still valid before capture
- Cannot implement "fake highlight" when native selection is lost

---

## Research: Best Practices

### Pattern 1: Prevent Focus Theft (Critical)
From Next.js discussion and Medium Editor:
```tsx
<button
  onMouseDown={(e) => e.preventDefault()} // ← KEY: Prevents focus shift
  onClick={handleClick}
>
```

This single line prevents the browser from moving focus, preserving the native selection highlight.

### Pattern 2: Clone and Store Range
From MDN and javascript.info:
```typescript
const sel = window.getSelection();
if (sel && sel.rangeCount > 0) {
  const range = sel.getRangeAt(0).cloneRange(); // Clone, don't reference
  // Store range for later restoration
}
```

The Range object is live - changes when selection changes. `cloneRange()` creates an independent copy.

### Pattern 3: Selection Restoration
From Lexical's SelectionAlwaysOnDisplay:
```typescript
const restoreSelection = (savedRange: Range) => {
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(savedRange);
  }
};

// After toolbar interaction:
setTimeout(() => restoreSelection(savedRange), 0);
```

The `setTimeout(..., 0)` is crucial - it queues restoration after the browser's focus handling completes.

### Pattern 4: Fake Highlight Overlay
When native selection is lost (user focuses input in capture card), render a visual highlight:
```typescript
// Create highlight spans around the selected text
const markSelection = (range: Range): HTMLElement[] => {
  const rects = range.getClientRects();
  return Array.from(rects).map(rect => {
    const highlight = document.createElement('div');
    highlight.className = 'selection-highlight';
    highlight.style.cssText = `
      position: fixed;
      background: rgba(6, 182, 212, 0.3);
      pointer-events: none;
      z-index: 40;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;
    document.body.appendChild(highlight);
    return highlight;
  });
};
```

### Pattern 5: Selection Validation
Before using stored selection, verify it's still valid:
```typescript
const isSelectionValid = (savedRange: Range, container: HTMLElement): boolean => {
  // Check if range nodes still exist in DOM
  if (!document.contains(savedRange.commonAncestorContainer)) {
    return false;
  }
  // Check if range is still within our container
  if (!container.contains(savedRange.commonAncestorContainer)) {
    return false;
  }
  return true;
};
```

---

## Recommended Architecture

### New Data Model
```typescript
interface SelectionState {
  // Derived data (for display/capture)
  text: string;
  rect: DOMRect;
  messageId: string;
  contextSpan: string;
  
  // NEW: Preserved Range for restoration
  range: Range;
  
  // NEW: Timestamp for staleness detection
  capturedAt: number;
}
```

### New Hook: useSelectionPreserver
```typescript
export function useSelectionPreserver() {
  const savedRangeRef = useRef<Range | null>(null);
  const highlightElementsRef = useRef<HTMLElement[]>([]);

  const preserve = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restore = useCallback(() => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  }, []);

  const showFakeHighlight = useCallback(() => {
    if (savedRangeRef.current) {
      highlightElementsRef.current = markSelection(savedRangeRef.current);
    }
  }, []);

  const hideFakeHighlight = useCallback(() => {
    highlightElementsRef.current.forEach(el => el.remove());
    highlightElementsRef.current = [];
  }, []);

  return { preserve, restore, showFakeHighlight, hideFakeHighlight };
}
```

### Component Changes

**MagneticPill.tsx:**
```tsx
<motion.button
  onMouseDown={(e) => e.preventDefault()} // ← ADD THIS
  onClick={handleClick}
  // ...
>
```

**ActionMenu.tsx:**
```tsx
<motion.div
  onMouseDown={(e) => e.preventDefault()} // ← ADD THIS
  // ...
>
```

**SproutCaptureCard.tsx / ResearchManifestCard.tsx:**
- On mount: Call `showFakeHighlight()`
- On unmount: Call `hideFakeHighlight()` 
- When clicking "Save": Call `restore()` first to validate, then capture

---

## Implementation Plan

### Epic 1: Quick Fixes (30 min)
1. Add `onMouseDown={(e) => e.preventDefault()}` to MagneticPill button
2. Add `onMouseDown={(e) => e.preventDefault()}` to ActionMenu container
3. Remove the global click-to-clear handler (line 97-103 in useTextSelection.ts)

### Epic 2: Selection Preservation (1 hour)
1. Store cloned Range in SelectionState
2. Create useSelectionPreserver hook
3. Wire restore() into capture flow

### Epic 3: Fake Highlight System (1 hour)
1. Create SelectionHighlight component
2. Render when capture card is open
3. Position using stored Range.getClientRects()
4. Clean up on card close

### Epic 4: Validation & Edge Cases (30 min)
1. Add selection validity check before capture
2. Handle selection that spans multiple messages
3. Handle scroll during capture (rect recalculation)

---

## Success Criteria

1. ✅ Selecting text and clicking pill preserves visual highlight
2. ✅ ActionMenu selection maintains highlight
3. ✅ Capture card open shows highlight (native or fake)
4. ✅ Completing capture uses correct text (not stale/different selection)
5. ✅ Canceling capture restores clean state
6. ✅ Scrolling during capture works correctly

---

## References

- [MDN Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection)
- [MDN Range API](https://developer.mozilla.org/en-US/docs/Web/API/Range)
- [javascript.info Selection and Range](https://javascript.info/selection-range)
- [Lexical SelectionAlwaysOnDisplay](https://github.com/facebook/lexical/discussions/6050)
- [Next.js Selection Toolbar Discussion](https://github.com/vercel/next.js/discussions/85322)
