# Specification: kinetic-stream-polish-v1

**Sprint:** Glass UX Layer and Motion Design  
**Version:** 1.0  
**Last Updated:** December 2024  

---

## 1. Goals

### Primary Goals

1. **Add entrance animations to stream blocks** — Messages should feel like they're arriving, not appearing
2. **Implement glass effect on response blocks** — Visual depth through glassmorphism
3. **Create character streaming animation** — Text appears character-by-character during generation
4. **Build smart scroll behavior** — Auto-scroll during generation, pause on user scroll
5. **Float the input console** — Always visible at bottom with glass effect

### Secondary Goals

6. **Add hover micro-interactions** — Subtle feedback on interactive elements
7. **Create shared motion variants** — Reusable animation patterns
8. **Respect accessibility preferences** — Honor prefers-reduced-motion

---

## 2. Non-Goals (Out of Scope)

| Excluded | Reason | Future Sprint |
|----------|--------|---------------|
| ❌ Page transitions | Different scope | Navigation sprint |
| ❌ Sound design | Requires audio assets | Audio sprint |
| ❌ Haptic feedback | Mobile-specific | Mobile sprint |
| ❌ Advanced particles | Performance risk | Enhancement sprint |
| ❌ 3D transforms | Complexity | Never (keep flat) |

---

## 3. User Stories

### US-1: Animated Message Arrival

> As a user, I want messages to animate in smoothly so the chat feels alive and responsive.

**Acceptance Criteria:**
- [ ] Query blocks slide in from right with fade
- [ ] Response blocks slide in from left with fade
- [ ] Navigation blocks stagger their button reveals
- [ ] System blocks fade in/out smoothly
- [ ] Animation completes within 300ms

### US-2: Glass Response Panels

> As a user, I want AI responses to have a subtle glass effect so they feel distinct and premium.

**Acceptance Criteria:**
- [ ] Response blocks have backdrop-filter blur
- [ ] Glass effect respects current lens theme colors
- [ ] Fallback solid background for unsupported browsers
- [ ] Glass doesn't reduce text readability

### US-3: Streaming Text Reveal

> As a user, I want to see text appear character-by-character during generation so I can read along.

**Acceptance Criteria:**
- [ ] Characters appear at ~50ms intervals (adjustable)
- [ ] Cursor indicator shows generation point
- [ ] Animation pauses if user scrolls up
- [ ] Final text matches streamed text exactly
- [ ] Works with formatted content (bold, links)

### US-4: Smart Scroll Behavior

> As a user, I want the chat to auto-scroll during responses but let me scroll up without fighting me.

**Acceptance Criteria:**
- [ ] Auto-scrolls to bottom during generation
- [ ] Detects user scroll-up and pauses auto-scroll
- [ ] Shows "New messages ↓" indicator when paused
- [ ] Clicking indicator scrolls to bottom
- [ ] Resumes auto-scroll when user scrolls to bottom

### US-5: Floating Input Console

> As a user, I want the input always visible so I don't have to scroll to type.

**Acceptance Criteria:**
- [ ] Input floats at bottom of viewport
- [ ] Glass effect matches response blocks
- [ ] Chat content scrolls behind input
- [ ] Input expands smoothly when typing long messages
- [ ] Submit button has hover animation

### US-6: Reduced Motion Support

> As a user with vestibular sensitivity, I want animations disabled when I've set that preference.

**Acceptance Criteria:**
- [ ] All animations respect prefers-reduced-motion
- [ ] Reduced motion shows instant transitions
- [ ] Functionality unchanged without animations
- [ ] No flashing or strobing effects ever

---

## 4. Technical Requirements

### 4.1 Animation Specifications

| Animation | Duration | Easing | Delay |
|-----------|----------|--------|-------|
| Block entrance | 300ms | ease-out | 0ms |
| Block exit | 200ms | ease-in | 0ms |
| Character reveal | 50ms/char | linear | 0ms |
| Button stagger | 200ms | ease-out | 50ms × index |
| Glass fade | 200ms | ease-in-out | 0ms |
| Scroll smooth | 400ms | ease-out | 0ms |

### 4.2 Glass Effect Specifications

```css
/* Base glass effect */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

/* Token values */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-blur: 12px;
--glass-border: rgba(255, 255, 255, 0.1);
```

### 4.3 Scroll Behavior Specifications

```typescript
interface ScrollAnchorState {
  isAtBottom: boolean;
  isUserScrolling: boolean;
  shouldAutoScroll: boolean;
  newMessageCount: number;
}

// Thresholds
const BOTTOM_THRESHOLD = 100; // px from bottom
const SCROLL_DEBOUNCE = 100; // ms
```

### 4.4 Streaming Animation Specifications

```typescript
interface StreamingConfig {
  characterDelay: number;      // Default: 50ms
  batchSize: number;           // Default: 3 characters
  cursorChar: string;          // Default: "▋"
  pauseOnUserScroll: boolean;  // Default: true
}
```

---

## 5. Design Tokens

### 5.1 New Tokens Required

```css
/* Glass tokens */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-hover: rgba(255, 255, 255, 0.08);
--glass-blur: 12px;
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

/* Animation tokens */
--motion-duration-fast: 150ms;
--motion-duration-normal: 300ms;
--motion-duration-slow: 500ms;
--motion-ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--motion-ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--motion-ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Streaming tokens */
--streaming-cursor-color: var(--grove-primary);
--streaming-char-delay: 50ms;

/* Floating input tokens */
--input-float-offset: 16px;
--input-float-max-height: 200px;
```

### 5.2 Lens-Aware Glass Colors

```css
/* Default (grove lens) */
--glass-tint: var(--grove-primary-subtle);

/* Academia lens */
[data-lens="academia"] {
  --glass-tint: var(--academia-primary-subtle);
}

/* Technical lens */
[data-lens="technical"] {
  --glass-tint: var(--technical-primary-subtle);
}
```

---

## 6. Component Specifications

### 6.1 StreamingText Component

```typescript
interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  characterDelay?: number;
  onComplete?: () => void;
}

// Renders text character-by-character when isStreaming=true
// Shows full text immediately when isStreaming=false
```

### 6.2 useScrollAnchor Hook

```typescript
interface UseScrollAnchorOptions {
  containerRef: RefObject<HTMLElement>;
  bottomThreshold?: number;
  onScrollStateChange?: (state: ScrollAnchorState) => void;
}

interface UseScrollAnchorReturn {
  state: ScrollAnchorState;
  scrollToBottom: () => void;
  resetAutoScroll: () => void;
}
```

### 6.3 FloatingInput Component

```typescript
interface FloatingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isDisabled?: boolean;
  placeholder?: string;
}

// Wrapper around TerminalInput with floating + glass
```

### 6.4 Motion Variants

```typescript
// variants.ts
export const blockVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export const queryVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 }
};

export const responseVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const staggerContainer = {
  visible: {
    transition: { staggerChildren: 0.05 }
  }
};
```

---

## 7. Acceptance Criteria Summary

### Must Have (P0)

- [ ] Block entrance animations (all 4 types)
- [ ] Glass effect on response blocks
- [ ] Smart scroll with pause detection
- [ ] Floating input console
- [ ] prefers-reduced-motion support

### Should Have (P1)

- [ ] Character streaming animation
- [ ] "New messages" indicator
- [ ] Hover micro-interactions on spans
- [ ] Lens-aware glass tinting

### Nice to Have (P2)

- [ ] Input expand animation
- [ ] Cursor blink in streaming
- [ ] Subtle glow on active response

---

## 8. Testing Requirements

### Unit Tests

| Component | Test Cases |
|-----------|------------|
| StreamingText | Character timing, completion callback, reduced motion |
| useScrollAnchor | State transitions, threshold detection, debounce |
| Motion variants | Variant object structure, duration values |

### Integration Tests

| Scenario | Verification |
|----------|--------------|
| Message flow | Blocks animate in sequence |
| User scroll | Auto-scroll pauses correctly |
| Long generation | Streaming doesn't lag |

### Visual Regression

| Baseline | Comparison |
|----------|------------|
| Glass effect | Matches design comp |
| Animation timing | Feels smooth, not janky |
| Reduced motion | No animations fire |

### Performance Tests

| Metric | Target |
|--------|--------|
| Animation frame rate | ≥ 60fps |
| Time to interactive | < 100ms after animation |
| Memory (during stream) | < 50MB increase |

---

## 9. Rollout Strategy

### Phase 1: Core Animations (Day 1-2)
- Block entrance animations
- Exit animations
- Shared variants

### Phase 2: Glass Effects (Day 2-3)
- Glass tokens
- Response block glass
- Floating input glass

### Phase 3: Smart Scroll (Day 3-4)
- useScrollAnchor hook
- New messages indicator
- Integration

### Phase 4: Streaming (Day 4-5)
- StreamingText component
- Integration with generation state
- Performance optimization

### Phase 5: Polish & Test (Day 5-7)
- Micro-interactions
- Accessibility audit
- Visual regression baselines
- Bug fixes

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Animation smoothness | 60fps | Chrome DevTools |
| Glass render time | <16ms | Performance profiler |
| Scroll responsiveness | <100ms | User testing |
| Accessibility score | 100% | axe-core |
| User satisfaction | "Feels polished" | Qualitative feedback |

---

*Specification complete. Ready for architecture design.*
