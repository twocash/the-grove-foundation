# SPEC: streaming-layout-fix-v2

**Sprint:** streaming-layout-fix-v2  
**Created:** 2025-01-09  
**Status:** Ready for execution  
**Estimated effort:** 30 minutes

---

## Problem Statement

The `/explore` chat experience exhibits visual "jitter" during AI response streaming. Text bunches up and vibrates as it appears, then "explodes" into final position when streaming completes.

### User Impact

- Jarring visual experience during AI responses
- Text appears to vibrate/shake while streaming
- Final "snap" when streaming completes feels unpolished
- Undermines the premium "kinetic stream" aesthetic

---

## Root Cause Analysis

The jitter results from interaction between TWO systems:

1. **CSS centering** (`max-w-3xl mx-auto` in ExploreShell.tsx line ~620) — Container centers itself horizontally

2. **Framer Motion `layout` prop** (KineticRenderer.tsx line 63) — Instructs animation library to animate ALL layout changes, including size changes during streaming

**The cascade:**
```
Character batch arrives during streaming
       ↓
Response block grows slightly
       ↓
layout prop triggers Framer Motion animation
       ↓
mx-auto recalculates center position
       ↓
Block animates to new position
       ↓
Repeat many times per second = JITTER
```

The "explosion" at completion happens when streaming ends and accumulated layout animation delta resolves.

---

## Affected File

**`src/surface/components/KineticStream/Stream/KineticRenderer.tsx`**

NOT `components/Terminal/Stream/StreamRenderer.tsx` (that's Terminal/Genesis, not /explore)

---

## Domain Contract

**Applicable contract:** None (main branch, not bedrock)  
**Contract version:** N/A  
**Additional requirements:** Standard DEX compliance

---

## Pattern Check

### Existing Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Animation behavior during streaming | Stream architecture (kinetic-*) | Conditional application of existing `layout` prop |
| Streaming state detection | `isGenerating` on ResponseStreamItem | Type check in renderer |

### New Patterns Proposed

None. Targeted bug fix within existing architecture.

---

## Proposed Solution

Conditionally disable Framer Motion's `layout` prop during active streaming.

### Technical Approach

**File:** `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Change:** Add streaming state detection and conditionally disable `layout`:

```typescript
// Import ResponseStreamItem for type narrowing (if not already imported)
import type { StreamItem, ResponseStreamItem, ... } from '@core/schema/stream';

// Inside KineticRenderer, before return:
const isAnyStreaming = allItems.some(
  (item): item is ResponseStreamItem => 
    item.type === 'response' && item.isGenerating === true
);

// Modify motion.div (line ~63):
<motion.div
  key={item.id}
  variants={variants}
  initial="hidden"
  animate="visible"
  exit="exit"
  layout={!isAnyStreaming}  // Disable during streaming
>
```

### Why This Approach

1. **Surgical:** Single conditional, single file, ~5 lines added
2. **Backward compatible:** When NOT streaming, behavior unchanged
3. **Preserves animations:** Entrance/exit animations still work
4. **Contained to /explore:** No risk to Terminal or Genesis

---

## DEX Compliance

| Principle | Compliance |
|-----------|------------|
| **Declarative Sovereignty** | N/A — Animation behavior, not domain logic |
| **Capability Agnosticism** | ✅ Fix works regardless of model or streaming source |
| **Provenance** | ✅ Sprint artifacts provide full attribution |
| **Organic Scalability** | ✅ No structural changes |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Entrance animations break | Low | Medium | Test explicitly; layout re-enabled after streaming |
| Type error on isGenerating | Very Low | Low | Type exists on ResponseStreamItem |
| Regression elsewhere | None | N/A | Change is isolated to KineticRenderer |

---

## Success Criteria

1. ✅ No visual jitter during streaming on `/explore`
2. ✅ No "explosion" on streaming completion  
3. ✅ Entrance animations still work (messages fade/slide in)
4. ✅ Build passes
5. ✅ No TypeScript errors

---

## Scope Boundaries

**In scope:**
- KineticRenderer.tsx layout prop conditional
- Manual verification of streaming behavior on `/explore`

**Out of scope:**
- Terminal changes
- Genesis changes
- CSS centering modifications
- StreamRenderer.tsx (different component for different experience)
