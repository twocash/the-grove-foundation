# Selection Model Fix - Epic 1 Execution Prompt
## Quick Fixes (30 minutes)

**Sprint:** selection-model-fix-v1  
**Prerequisite:** Read `RESEARCH_BRIEF.md` in this directory

---

## Context

The selection system is broken because:
1. MagneticPill and ActionMenu steal focus on click, clearing the browser selection
2. A global click handler clears selection state when it detects collapsed selection

This epic applies the critical one-line fixes that will resolve 80% of the issues.

---

## Task 1: Prevent Focus Theft on MagneticPill

**File:** `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx`

Find the `<motion.button>` element (around line 95) and add `onMouseDown`:

```tsx
<motion.button
  layoutId={layoutId}
  className="fixed z-50 flex items-center justify-center w-8 h-8 rounded-full
             bg-[var(--neon-green)] hover:bg-[var(--neon-cyan)]
             text-white shadow-lg shadow-[var(--neon-green)]/30
             backdrop-blur-sm cursor-pointer
             focus:outline-none focus:ring-2 focus:ring-white/30
             transition-colors duration-150"
  style={{
    left: clampedX,
    top: clampedY,
    translateX: '-50%',
    translateY: '-50%',
    scale,
  }}
  onMouseDown={(e) => e.preventDefault()} // ← ADD THIS LINE
  onClick={handleClick}
  // ... rest of props
>
```

**Why:** `preventDefault()` on `mousedown` stops the browser from moving focus to the button, preserving the text selection highlight.

---

## Task 2: Prevent Focus Theft on ActionMenu

**File:** `src/surface/components/KineticStream/Capture/components/ActionMenu.tsx`

Find the outer `<motion.div>` container and add `onMouseDown`:

```tsx
<motion.div
  ref={menuRef}
  className="fixed z-50 flex flex-col gap-1 p-2
             bg-[var(--glass-solid)] border border-[var(--glass-border)]
             rounded-lg shadow-lg shadow-black/30
             backdrop-blur-sm"
  style={{
    left: position.x,
    top: position.y,
  }}
  onMouseDown={(e) => e.preventDefault()} // ← ADD THIS LINE
  initial={{ opacity: 0, scale: 0.9, y: -10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: -10 }}
  transition={{ duration: 0.15 }}
>
```

Also add it to each action button inside the menu:

```tsx
<button
  key={action.id}
  className={`...`}
  onClick={() => onSelect(action.id)}
  onMouseDown={(e) => e.preventDefault()} // ← ADD THIS LINE
  onKeyDown={(e) => { ... }}
  // ...
>
```

---

## Task 3: Remove Problematic Click-to-Clear Handler

**File:** `src/surface/components/KineticStream/Capture/hooks/useTextSelection.ts`

Find and **remove** the entire `useLayoutEffect` block that adds a click handler (around lines 90-103):

```typescript
// ❌ DELETE THIS ENTIRE BLOCK
useLayoutEffect(() => {
  const handleClick = () => {
    const sel = window.getSelection();
    if (sel?.isCollapsed) {
      setSelection(null);
    }
  };

  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);
```

**Why:** This handler was clearing selection state whenever selection became collapsed (including after clicking the pill). Selection clearing should happen through explicit user actions (new selection, escape key), not through side effects.

---

## Task 4: Store Range Object for Validation

**File:** `src/surface/components/KineticStream/Capture/hooks/useTextSelection.ts`

Update the `SelectionState` interface and selection handling:

```typescript
export interface SelectionState {
  text: string;
  rect: DOMRect;
  messageId: string;
  contextSpan: string;
  range: Range; // ← ADD THIS
  capturedAt: number; // ← ADD THIS
}
```

In `handleSelectionChange`, clone and store the range:

```typescript
const handleSelectionChange = useCallback(() => {
  const sel = window.getSelection();

  if (!sel || sel.isCollapsed || !sel.toString().trim()) {
    setSelection(null);
    return;
  }

  const text = sel.toString().trim();
  if (text.length < minLength) {
    setSelection(null);
    return;
  }

  // Check if selection is within container
  const range = sel.getRangeAt(0);
  const container = containerRef.current;
  if (!container || !container.contains(range.commonAncestorContainer)) {
    setSelection(null);
    return;
  }

  // Find message ID from closest data attribute
  const ancestorNode = range.commonAncestorContainer;
  const elementToSearch = ancestorNode.nodeType === Node.ELEMENT_NODE
    ? (ancestorNode as Element)
    : ancestorNode.parentElement;

  const messageElement = elementToSearch?.closest?.('[data-message-id]');
  const messageId = messageElement?.getAttribute('data-message-id');

  if (!messageId) {
    setSelection(null);
    return;
  }

  const rect = range.getBoundingClientRect();
  const contextNode = messageElement?.closest('p') || messageElement;
  const contextSpan = contextNode?.textContent?.slice(0, 200) || '';

  setSelection({
    text,
    rect,
    messageId,
    contextSpan,
    range: range.cloneRange(), // ← ADD: Clone the range
    capturedAt: Date.now(), // ← ADD: Timestamp
  });
}, [containerRef, minLength]);
```

---

## Testing Checklist

After making changes, test in browser at `/terminal`:

1. [ ] Select text in an AI response
2. [ ] MagneticPill appears near selection
3. [ ] Click pill → Selection highlight remains visible
4. [ ] ActionMenu appears (if multiple actions)
5. [ ] Click action → Capture card opens, selection still highlighted
6. [ ] Complete capture → Sprout created with correct text
7. [ ] Cancel capture → Selection clears cleanly

**Console verification:**
```javascript
// After selecting text and clicking pill, selection should NOT be collapsed:
window.getSelection().isCollapsed // Should be: false
```

---

## Build Gate

```bash
npm run build
npm run test
```

All 376+ tests must pass.

---

## Next Steps

After Epic 1, if selection issues persist during capture card interaction (when user focuses tag input), proceed to Epic 2 (Selection Preservation) and Epic 3 (Fake Highlight System) as documented in `RESEARCH_BRIEF.md`.
