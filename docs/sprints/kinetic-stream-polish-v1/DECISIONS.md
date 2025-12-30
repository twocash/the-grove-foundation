# Architectural Decisions: kinetic-stream-polish-v1

**Sprint:** Glass UX Layer and Motion Design  
**Decision Count:** 12 ADRs  

---

## ADR-001: Framer Motion vs CSS Animations

### Context
Need animation library for React components. Options: Framer Motion (already installed), CSS animations, React Spring.

### Decision
**Use Framer Motion** for all component animations.

### Rationale
- Already installed and paid for in bundle
- Native React integration with AnimatePresence
- Built-in reduced motion support via `useReducedMotion`
- Declarative variants pattern matches our architecture
- Industry standard for React animation

### Rejected Alternatives
- **CSS animations**: No exit animations, harder to coordinate
- **React Spring**: Different mental model, additional bundle
- **GSAP**: Overkill, additional cost

### Consequences
- Consistent animation API across components
- Slightly larger bundle (already paid)
- Learning curve for variants pattern (manageable)

---

## ADR-002: Glass Implementation Strategy

### Context
Need glassmorphism effect on response blocks. Options: Pure CSS, styled-components, Tailwind plugin.

### Decision
**CSS custom properties with utility classes** in globals.css.

### Rationale
- Pattern 4 compliance (token namespaces)
- Theme-aware via CSS variables
- Domain experts can modify without React knowledge
- Browser handles fallback via `@supports`

### Rejected Alternatives
- **styled-components**: Not in our stack
- **Tailwind plugin**: Adds build complexity
- **Inline styles**: Not themeable

### Consequences
- Glass tokens live in globals.css
- GlassPanel component applies classes
- Easy to adjust intensity via intensity prop

---

## ADR-003: Scroll Behavior Architecture

### Context
Need smart scroll that auto-scrolls during generation but respects user scroll. Options: Native scroll, custom hook, third-party library.

### Decision
**Custom `useScrollAnchor` hook** using native scroll APIs.

### Rationale
- No additional dependencies
- Full control over scroll behavior
- Can integrate with React state
- Passive listeners for performance

### Rejected Alternatives
- **react-scroll**: Overkill for our needs
- **Native only**: Can't track user intent
- **IntersectionObserver only**: Doesn't handle scroll-to-bottom

### Implementation
- Debounced scroll handler (100ms)
- Threshold-based bottom detection (100px)
- State tracks: isAtBottom, isUserScrolling, shouldAutoScroll, newMessageCount

### Consequences
- ~90 lines of custom code
- Testable in isolation
- No external dependencies

---

## ADR-004: Streaming Animation Approach

### Context
Need character-by-character reveal during LLM generation. Options: CSS typewriter, React state batching, streaming API integration.

### Decision
**React state batching with `setInterval`** in StreamingText component.

### Rationale
- Works with any content source
- Controllable timing (50ms default)
- Batch multiple characters for performance (3 at a time)
- Can pause on user scroll
- Respects reduced motion

### Rejected Alternatives
- **CSS typewriter**: Can't handle dynamic content
- **requestAnimationFrame**: Overkill for text
- **Direct streaming API**: Couples to specific API

### Implementation
- setInterval reveals `batchSize` characters per tick
- Clear interval on unmount
- onComplete callback when finished
- Blinking cursor during stream

### Consequences
- Works with mock data during development
- Easy to adjust timing
- Memory cleanup required

---

## ADR-005: Floating Input Implementation

### Context
Input should float at bottom, always visible. Options: Fixed position, sticky position, portal.

### Decision
**CSS `position: sticky`** with `bottom: 0`.

### Rationale
- Native browser behavior
- No z-index wars
- Works with scroll container
- No JS required for positioning

### Rejected Alternatives
- **Fixed**: Requires viewport calculations
- **Portal**: Complicates state management
- **Absolute**: Doesn't scroll with content

### Implementation
```css
.floating-input-container {
  position: sticky;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}
.floating-input-panel {
  pointer-events: auto;
}
```

### Consequences
- Chat content scrolls behind input
- Input always visible
- `pointer-events` trick allows clicking through container

---

## ADR-006: Animation Variants Organization

### Context
Need shared animation configurations. Options: Inline per component, shared variants file, context provider.

### Decision
**Shared `variants.ts` file** in motion directory.

### Rationale
- Single source of truth
- Easy to modify timing globally
- Composable (can combine variants)
- TypeScript types from Framer Motion

### Rejected Alternatives
- **Inline**: Duplication, drift
- **Context**: Overkill, performance cost
- **CSS variables only**: Can't control Framer Motion

### Implementation
- `blockVariants`: Standard entrance/exit
- `queryVariants`: Slide from right
- `responseVariants`: Slide from left
- `systemVariants`: Fade only
- `staggerContainer` + `staggerItem`: For button groups
- `reducedMotionVariants`: Instant transitions

### Consequences
- Import variants where needed
- Consistent timing across components
- Easy to A/B test animation styles

---

## ADR-007: Reduced Motion Strategy

### Context
Must respect `prefers-reduced-motion` for accessibility. Options: CSS media query only, JS detection, both.

### Decision
**Both CSS media query AND Framer Motion's `useReducedMotion`**.

### Rationale
- CSS handles non-JS animations
- Framer Motion hook handles React animations
- Belt and suspenders for accessibility
- No animations slip through

### Implementation
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```typescript
const reducedMotion = useReducedMotion();
const variants = reducedMotion ? reducedMotionVariants : normalVariants;
```

### Consequences
- 100% reduced motion compliance
- Two places to maintain
- Clear accessibility story

---

## ADR-008: Glass Intensity Levels

### Context
Different contexts need different glass intensity. Options: Single intensity, multiple classes, prop-based.

### Decision
**Three intensity levels** via `intensity` prop: light, medium, heavy.

### Rationale
- Response blocks: medium (primary content)
- Floating input: heavy (needs to stand out)
- Hover states: light (subtle feedback)

### Implementation
```typescript
interface GlassPanelProps {
  intensity?: 'light' | 'medium' | 'heavy';
}

const intensityStyles = {
  light: 'glass-panel-light',   // 8px blur
  medium: 'glass-panel-medium', // 12px blur
  heavy: 'glass-panel-heavy'    // 20px blur
};
```

### Consequences
- Semantic intensity names
- Easy to add more levels
- CSS handles actual values

---

## ADR-009: New Messages Indicator Design

### Context
Need to show unread messages when user scrolls up. Options: Badge on input, floating button, toast.

### Decision
**Floating button above input** with message count.

### Rationale
- Clear visual hierarchy
- Obvious click target
- Shows message count
- Disappears when at bottom

### Rejected Alternatives
- **Badge on input**: Too subtle
- **Toast**: Interrupts workflow
- **Sidebar indicator**: Not visible in focused view

### Implementation
```typescript
<NewMessagesIndicator
  count={state.newMessageCount}
  onClick={scrollToBottom}
/>
```

### Consequences
- Always visible when relevant
- One-click return to bottom
- Matches chat app conventions

---

## ADR-010: AnimatePresence Mode

### Context
Framer Motion's AnimatePresence has multiple modes. Options: sync, wait, popLayout.

### Decision
**Use `mode="popLayout"`** for stream items.

### Rationale
- Allows exit animations
- Prevents layout shift during exit
- Items don't "jump" when one exits

### Rejected Alternatives
- **sync**: No exit animations
- **wait**: Delays entrance until exit complete (feels slow)

### Implementation
```typescript
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.div key={item.id} exit="exit">
      ...
    </motion.div>
  ))}
</AnimatePresence>
```

### Consequences
- Smooth exit animations
- Stable layout during transitions
- Requires unique keys

---

## ADR-011: Streaming Cursor Style

### Context
Need visual indicator during streaming. Options: Blinking cursor, spinner, pulsing dot.

### Decision
**Blinking block cursor (▋)** with opacity animation.

### Rationale
- Matches terminal aesthetic
- Clear indication of generation point
- Familiar from text editors
- Unobtrusive

### Rejected Alternatives
- **Spinner**: Too busy, doesn't show position
- **Pulsing dot**: Doesn't indicate text position
- **Underscore**: Less visible

### Implementation
```typescript
<motion.span
  animate={{ opacity: [1, 0] }}
  transition={{ repeat: Infinity, duration: 0.8 }}
>
  ▋
</motion.span>
```

### Consequences
- Clear visual feedback
- Disappears when complete
- Can be themed via token

---

## ADR-012: Integration Order

### Context
Need to wire Polish components into existing structure. Options: Bottom-up, top-down, parallel.

### Decision
**Bottom-up integration** starting with utilities.

### Rationale
- Each layer is testable before integration
- Lower risk of breaking existing functionality
- Clear build gates between phases

### Integration Order
1. Motion utilities (variants, hooks)
2. Tokens (CSS)
3. Atomic components (GlassPanel, StreamingText)
4. Block modifications (add motion wrappers)
5. Container integration (TerminalChat)
6. Testing

### Consequences
- More files touched
- Easier rollback at each phase
- Clear progress visibility

---

## Decision Summary Table

| # | Decision | Choice | Risk |
|---|----------|--------|------|
| 001 | Animation library | Framer Motion | Low |
| 002 | Glass implementation | CSS tokens + classes | Low |
| 003 | Scroll behavior | Custom useScrollAnchor | Medium |
| 004 | Streaming animation | React state batching | Medium |
| 005 | Floating input | CSS sticky | Low |
| 006 | Variants organization | Shared variants.ts | Low |
| 007 | Reduced motion | CSS + JS dual approach | Low |
| 008 | Glass intensity | Three-level prop | Low |
| 009 | New messages | Floating button | Low |
| 010 | AnimatePresence mode | popLayout | Low |
| 011 | Streaming cursor | Blinking block | Low |
| 012 | Integration order | Bottom-up | Low |

---

## Advisory Council Input

### Tarn Adams (Weight 8)
> "Motion should serve drama. Entry animations for responses should feel like the Grove is *presenting* its answer, not just displaying it."

**Applied:** Response blocks slide in from left with slight delay, creating a "reveal" moment.

### Emily Short (Weight 8)
> "The streaming text is where the user watches the Grove think. This is a narrative moment—the cursor is the Grove's pen moving across the page."

**Applied:** Blinking block cursor, character reveal, pausable on user scroll.

### Park (Weight 10)
> "60fps or nothing. Any animation that drops frames will feel broken. Prioritize transform/opacity, avoid layout-triggering properties."

**Applied:** All animations use transform/opacity. No height/width animations. Passive scroll listeners.

### Vallor (Weight 6)
> "Motion can be overwhelming for users with vestibular disorders. Reduced motion isn't a nice-to-have—it's a necessity."

**Applied:** Dual CSS + JS reduced motion support. All animations respect preference.

---

*Decisions complete. Ready for sprint planning.*
