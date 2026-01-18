# ARCH_DECISIONS: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Date:** December 28, 2025

---

## ADR-001: Sticky-Release Scroll Model

### Context
Streaming chat UIs have a fundamental tension: auto-scroll to show new content vs. user control to review history.

### Decision
**Implement "Sticky-Release" physics with a 50px magnetic threshold.**

### Model
```
┌─────────────────────────────────────┐
│  [User scrolls up]                  │
│         ↓                           │
│  isAtBottom = false                 │
│  Auto-scroll STOPS                  │
│  FAB appears                        │
│         ↓                           │
│  [User scrolls to bottom OR         │
│   clicks FAB OR submits query]      │
│         ↓                           │
│  isAtBottom = true                  │
│  Auto-scroll RESUMES                │
│  FAB hides                          │
└─────────────────────────────────────┘
```

### Rationale
- 50px threshold accounts for momentum scrolling overshooting exact bottom
- Instant release (1px past threshold) gives user immediate control
- Three re-engagement paths cover all user intents

### Consequences
- Must track scroll position continuously
- FAB adds visual element (but only when needed)
- New submissions must force re-engagement

---

## ADR-002: useLayoutEffect for Scroll Updates

### Context
`useEffect` runs after browser paint. `useLayoutEffect` runs before paint.

### Decision
**Use `useLayoutEffect` for scroll-to-bottom during streaming.**

### Rationale
```
useEffect timing:
  Content updates → Paint → Effect runs → Scroll → Repaint
  = Single frame of content at wrong position (flicker)

useLayoutEffect timing:
  Content updates → Effect runs → Scroll → Paint
  = No visible flicker
```

### Consequences
- Synchronous execution blocks paint (acceptable for scroll updates)
- Must avoid heavy computation in the effect
- React 18/19 compatible

---

## ADR-003: Scroll Anchor Pattern

### Context
`container.scrollTo()` is unreliable across browsers. `element.scrollIntoView()` is more consistent.

### Decision
**Use an invisible 1px anchor div at the end of the stream, scroll to it via `scrollIntoView()`.**

### Implementation
```tsx
// At end of KineticRenderer
<div ref={bottomRef} className="h-px" aria-hidden="true" />
```

### Rationale
- `scrollIntoView` handles container detection automatically
- Works consistently in Chrome, Firefox, Safari
- No need to calculate scroll positions manually

### Consequences
- Anchor must always be last child (after lens offers, navigation forks)
- Anchor is invisible and ARIA-hidden

---

## ADR-004: Dual Scroll Behavior Modes

### Context
Different events need different scroll animations.

### Decision
**Use `behavior: 'auto'` (instant) for streaming text, `behavior: 'smooth'` for discrete events.**

### Matrix
| Event | Behavior | Reason |
|-------|----------|--------|
| Text chunk appended | `auto` | Prevent motion blur on typing |
| New response started | `auto` | Immediate context switch |
| New block added (fork, lens offer) | `smooth` | Choreographed entrance |
| User clicks FAB | `smooth` | Deliberate navigation |
| User submits new query | `auto` | Force re-engagement |

### Rationale
- Instant scrolling during typing prevents the "earthquake" effect
- Smooth scrolling for discrete events feels intentional
- User-initiated smooth scroll respects their intent

### Consequences
- Must track event type to choose behavior
- Hook needs two scroll methods or a behavior parameter

---

## ADR-005: FAB Placement Inside Console Area

### Context
FAB needs to float above content but not conflict with console z-index.

### Decision
**Render FAB as sibling to console input, positioned above it.**

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│         [Stream Content]            │
│                                     │
├─────────────────────────────────────┤
│           [FAB ↓]                   │  ← Conditionally visible
│    ┌─────────────────────────┐      │
│    │  [Input Console]        │      │
│    └─────────────────────────┘      │
└─────────────────────────────────────┘
```

### Rationale
- Single z-index context (console container)
- FAB animates from console, feels connected
- No z-index conflicts with other UI elements

### Consequences
- FAB rendered in CommandConsole, not ExploreShell
- Console component needs scroll state props

---

## ADR-006: Dependency Array Strategy

### Context
The scroll hook needs to know when content changes.

### Decision
**Track three signals: item count, current content length, current item ID.**

### Implementation
```typescript
const scrollDeps = useMemo(() => [
  items.length,
  currentItem?.content?.length ?? 0,
  currentItem?.id ?? null
], [items.length, currentItem?.content?.length, currentItem?.id]);
```

### Rationale
- `items.length` - Detects finalized items (triggers smooth scroll)
- `currentItem?.content?.length` - Detects streaming progress (triggers instant scroll)
- `currentItem?.id` - Detects new response start (triggers instant scroll)

### Consequences
- Three distinct change types tracked
- Can differentiate "new block" vs "text update" for behavior selection

---

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Scroll state is derived from content, not imperatively managed |
| **Capability Agnosticism** | Works with any streaming source |
| **Provenance as Infrastructure** | Scroll position reflects content state |
| **Organic Scalability** | No special handling for different block types |

---

*Architecture decisions complete. Proceed to MIGRATION_MAP.md*
