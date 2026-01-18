# REPO_AUDIT: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Date:** December 28, 2025
**Auditor:** Claude (Foundation Loop Phase 1)

---

## Executive Summary

This audit validates the codebase for implementing "Sticky-Release" scroll physics in the Kinetic Stream. The existing hook pattern and component structure are well-suited for this addition.

---

## Files to Modify

### 1. ExploreShell: `src/surface/components/KineticStream/ExploreShell.tsx`

**Current State:** 77 lines
**Scroll Container:** `<main className="flex-1 overflow-y-auto p-6">` (line ~55)

**Change Required:**
- Import `useKineticScroll` hook
- Attach `scrollRef` to the `<main>` element
- Pass scroll state to CommandConsole for FAB visibility
- Pass `isStreaming` derived from `currentItem?.isGenerating`

**Key Lines:**
```tsx
<main className="flex-1 overflow-y-auto p-6">
  <div className="max-w-3xl mx-auto pb-32">
    <KineticRenderer ... />
  </div>
</main>
```

**Risk:** Low - Adding refs and props, no structural changes

---

### 2. Hooks Index: `src/surface/components/KineticStream/hooks/index.ts`

**Current State:** 2 lines
```typescript
export { useKineticStream } from './useKineticStream';
```

**Change Required:** Add export for `useKineticScroll`

**Risk:** None

---

### 3. KineticRenderer: `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Current State:** 94 lines

**Change Required:**
- Accept `bottomRef` prop for ScrollAnchor placement
- Render `<ScrollAnchor ref={bottomRef} />` at end of list

**Risk:** Low - Adding optional prop and child component

---

### 4. CommandConsole: `src/surface/components/KineticStream/CommandConsole/index.tsx`

**Current State:** 72 lines

**Change Required:**
- Accept new props: `showScrollButton`, `onScrollToBottom`, `isStreaming`
- Render `ScrollToBottomFab` conditionally

**Risk:** Low - Adding optional props and child

---

## Files to Create

| File | Lines (est.) | Purpose |
|------|--------------|---------|
| `src/surface/components/KineticStream/hooks/useKineticScroll.ts` | ~70 | Sticky-release scroll physics |
| `src/surface/components/KineticStream/Stream/ScrollAnchor.tsx` | ~15 | Invisible scroll target |
| `src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx` | ~50 | Resume button with streaming indicator |

---

## Current Scroll Behavior Analysis

**Problem:** No scroll management exists. The `<main>` has `overflow-y-auto` but:
- No tracking of scroll position
- No auto-scroll during streaming
- No "scroll to bottom" affordance
- User loses context when streaming pushes content down

**Current Flow:**
1. User submits query → `items` updated
2. `currentItem` set with `isGenerating: true`
3. Chunks append to `currentItem.content`
4. Response finalized → `currentItem` moves to `items`
5. **No scroll adjustment at any step**

---

## Integration Points

### Streaming State Detection

From `useKineticStream`:
```typescript
const [currentItem, setCurrentItem] = useState<StreamItem | null>(null);
```

`currentItem !== null` indicates active streaming.
`currentItem?.isGenerating === true` is the precise streaming flag.

### Dependency Array for Scroll Hook

```typescript
// Recommended dependencies
const scrollDeps = [
  items.length,                     // New block added
  currentItem?.content?.length,     // Text streaming
  currentItem?.id                   // New response started
];
```

---

## CSS Token Availability

From `globals.css`:
- `.kinetic-console` - Fixed positioning at bottom (z-index: 50)
- `--glass-panel`, `--glass-border` - For FAB styling
- `--neon-green` - Streaming indicator color

**Note:** FAB should use z-index < 50 to sit below console, or integrate into console area.

---

## Pattern Compliance

| Pattern | Status | Evidence |
|---------|--------|----------|
| Hook Pattern | ✅ Ready | `useKineticStream` is template |
| Component Pattern | ✅ Ready | Block components in `blocks/` |
| Motion Pattern | ✅ Ready | `AnimatePresence` used in renderer |
| CSS Tokens | ✅ Ready | Glass tokens available |

---

## Browser API Notes

### `useLayoutEffect` vs `useEffect`
- **Use `useLayoutEffect`** for scroll updates during streaming
- Synchronous execution prevents visual flicker
- React 18/19 compatible

### `scrollIntoView` Behavior
- `behavior: 'auto'` - Instant (for typing)
- `behavior: 'smooth'` - Animated (for new blocks)
- Safari requires `-webkit-overflow-scrolling: touch` on container

### ResizeObserver
- Not needed initially - scroll listener + content length tracking sufficient
- Can add later for edge cases (dynamic content height)

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Safari scroll quirks | Medium | Test with `-webkit-overflow-scrolling` |
| Race conditions on rapid submit | Low | Abort controller already handles this |
| FAB z-index conflicts | Low | Place inside console container |

---

## Verification Commands

```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build

# Manual testing
npm run dev
# Navigate to /explore
# 1. Submit query, verify auto-scroll during streaming
# 2. Scroll up during streaming, verify scroll stops
# 3. Verify FAB appears when scrolled up
# 4. Click FAB, verify smooth scroll to bottom
# 5. Submit new query, verify instant scroll to bottom
```

---

## Audit Conclusion

**Status:** ✅ Ready for Implementation

The codebase is well-prepared:
1. Hook pattern established
2. Scroll container identified (`<main>`)
3. Streaming state available (`currentItem?.isGenerating`)
4. CSS tokens for FAB styling exist
5. No conflicting scroll logic to remove

**Estimated Effort:** 2 hours implementation, 30 min testing

---

*Audit complete. Proceed to ARCH_DECISIONS.md*
