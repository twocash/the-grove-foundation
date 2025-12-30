# SPEC: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Feature:** Sticky-Release Scroll Physics

---

## Quick Reference

### The Problem
Streaming LLM text pushes content down. Without scroll management:
- User loses reading position
- Auto-scroll on every token causes "jitter"
- No way to review history while AI is talking

### The Solution
**Sticky-Release Model:**
1. **Magnet** - User at bottom (within 50px) stays locked to bottom
2. **Release** - Scroll up 1px past threshold breaks the lock
3. **Re-engage** - Scroll to bottom, click FAB, or submit new query

---

## Files Summary

| File | Action | Lines |
|------|--------|-------|
| `hooks/useKineticScroll.ts` | CREATE | ~70 |
| `Stream/ScrollAnchor.tsx` | CREATE | ~15 |
| `CommandConsole/ScrollToBottomFab.tsx` | CREATE | ~50 |
| `hooks/index.ts` | MODIFY | +1 |
| `Stream/KineticRenderer.tsx` | MODIFY | +5 |
| `CommandConsole/index.tsx` | MODIFY | +15 |
| `ExploreShell.tsx` | MODIFY | +20 |

---

## API Surface

### useKineticScroll Hook

```typescript
interface UseKineticScrollReturn {
  scrollRef: RefObject<HTMLDivElement>;    // Attach to scroll container
  bottomRef: RefObject<HTMLDivElement>;    // Attach to anchor
  isAtBottom: boolean;                      // User at bottom?
  showScrollButton: boolean;                // Show FAB?
  scrollToBottom: (smooth?: boolean) => void;
}

function useKineticScroll(
  deps: [number, number, string | null],    // [items.length, content.length, currentId]
  isStreaming: boolean
): UseKineticScrollReturn;
```

### Component Props

```typescript
// KineticRenderer - new prop
interface KineticRendererProps {
  bottomRef?: RefObject<HTMLDivElement>;
  // ... existing props
}

// CommandConsole - new props
interface CommandConsoleProps {
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
  isStreaming?: boolean;
  // ... existing props
}
```

---

## Detailed Spec

Full specification provided in user notes. Key implementation details:

1. **50px threshold** for "at bottom" detection
2. **useLayoutEffect** for jitter-free scroll updates
3. **ScrollAnchor** pattern for reliable `scrollIntoView`
4. **Dual behavior modes**: `auto` for typing, `smooth` for blocks

---

*See MIGRATION_MAP.md for implementation steps.*
