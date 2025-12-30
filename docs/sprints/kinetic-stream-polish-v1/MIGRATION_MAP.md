# Migration Map: kinetic-stream-polish-v1

**Sprint:** Glass UX Layer and Motion Design  
**Total Files:** 15 (8 new, 7 modified)  
**Estimated LOC:** ~800 new/modified lines  

---

## Phase Overview

| Phase | Focus | Files | Risk |
|-------|-------|-------|------|
| 1 | Motion Infrastructure | 3 new | Low |
| 2 | Glass Token System | 1 modified | Low |
| 3 | Glass Components | 2 new | Low |
| 4 | Smart Scroll | 2 new | Medium |
| 5 | Streaming Animation | 1 new | Medium |
| 6 | Block Animations | 4 modified | Medium |
| 7 | Container Integration | 2 modified | High |
| 8 | Testing & Validation | 3 new | Low |

---

## Phase 1: Motion Infrastructure

**Goal:** Create shared motion utilities and variants.

### File 1.1: CREATE `Stream/motion/index.ts`

```typescript
// Barrel export for motion utilities
export { blockVariants, queryVariants, responseVariants, systemVariants, staggerContainer, staggerItem, reducedMotionVariants } from './variants';
export { GlassPanel } from './GlassPanel';
export { useScrollAnchor } from './useScrollAnchor';
```

**Location:** `components/Terminal/Stream/motion/index.ts`  
**Lines:** ~10  
**Dependencies:** None (creates exports for later files)

### File 1.2: CREATE `Stream/motion/variants.ts`

```typescript
// Full implementation in ARCHITECTURE.md Section 3.4
// Contains: blockVariants, queryVariants, responseVariants, 
//           systemVariants, staggerContainer, staggerItem, 
//           reducedMotionVariants
```

**Location:** `components/Terminal/Stream/motion/variants.ts`  
**Lines:** ~90  
**Dependencies:** framer-motion

### File 1.3: MODIFY `Stream/index.ts`

**Change:** Add motion exports to barrel.

```diff
  export { StreamRenderer } from './StreamRenderer';
  export { SpanRenderer } from './SpanRenderer';
+ export * from './motion';
+ export { StreamingText } from './StreamingText';
```

**Location:** `components/Terminal/Stream/index.ts`  
**Lines Changed:** +2  

**Build Gate 1:** `npm run typecheck` passes

---

## Phase 2: Glass Token System

**Goal:** Add CSS custom properties for glass effects.

### File 2.1: MODIFY `globals.css`

**Change:** Add glass and animation tokens.

```css
/* Add to :root */

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

```css
/* Add glass panel classes */

.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
}

.glass-panel-light {
  --glass-blur: 8px;
  --glass-bg: rgba(255, 255, 255, 0.03);
}

.glass-panel-medium {
  --glass-blur: 12px;
  --glass-bg: rgba(255, 255, 255, 0.05);
}

.glass-panel-heavy {
  --glass-blur: 20px;
  --glass-bg: rgba(255, 255, 255, 0.08);
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(1px)) {
  .glass-panel {
    background: var(--surface-elevated);
  }
}

/* Streaming cursor */
.streaming-cursor {
  color: var(--streaming-cursor-color);
  font-weight: bold;
}

/* Floating input */
.floating-input-container {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--input-float-offset);
  pointer-events: none;
  z-index: 10;
}

.floating-input-panel {
  pointer-events: auto;
  max-height: var(--input-float-max-height);
}

/* New messages indicator */
.new-messages-indicator {
  position: absolute;
  bottom: calc(var(--input-float-offset) + 80px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  z-index: 11;
}

.new-messages-indicator:hover {
  background: var(--glass-bg-hover);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Location:** `app/globals.css`  
**Lines Added:** ~80  

**Build Gate 2:** Visual inspection - glass classes work

---

## Phase 3: Glass Components

**Goal:** Create reusable glass wrapper component.

### File 3.1: CREATE `Stream/motion/GlassPanel.tsx`

```typescript
// Full implementation in ARCHITECTURE.md Section 3.3
// Reusable glass effect wrapper with intensity variants
```

**Location:** `components/Terminal/Stream/motion/GlassPanel.tsx`  
**Lines:** ~40  
**Dependencies:** framer-motion, cn utility

### File 3.2: CREATE `FloatingInput.tsx`

```typescript
// Full implementation in ARCHITECTURE.md Section 3.5
// Floating input with glass effect
```

**Location:** `components/Terminal/FloatingInput.tsx`  
**Lines:** ~45  
**Dependencies:** GlassPanel, TerminalInput, framer-motion

**Build Gate 3:** Components render without error

---

## Phase 4: Smart Scroll

**Goal:** Implement scroll anchor hook and new messages indicator.

### File 4.1: CREATE `Stream/motion/useScrollAnchor.ts`

```typescript
// Full implementation in ARCHITECTURE.md Section 3.2
// Smart scroll management hook
```

**Location:** `components/Terminal/Stream/motion/useScrollAnchor.ts`  
**Lines:** ~90  
**Dependencies:** React hooks

### File 4.2: CREATE `NewMessagesIndicator.tsx`

```typescript
// Full implementation in ARCHITECTURE.md Section 3.6
// Scroll-to-bottom indicator
```

**Location:** `components/Terminal/NewMessagesIndicator.tsx`  
**Lines:** ~35  
**Dependencies:** framer-motion

**Build Gate 4:** Hook returns expected state shape

---

## Phase 5: Streaming Animation

**Goal:** Create character-by-character text reveal.

### File 5.1: CREATE `Stream/StreamingText.tsx`

```typescript
// Full implementation in ARCHITECTURE.md Section 3.1
// Character reveal animation component
```

**Location:** `components/Terminal/Stream/StreamingText.tsx`  
**Lines:** ~80  
**Dependencies:** framer-motion, React hooks

**Build Gate 5:** StreamingText reveals characters correctly

---

## Phase 6: Block Animations

**Goal:** Add motion wrappers to block components.

### File 6.1: MODIFY `blocks/QueryBlock.tsx`

**Change:** Wrap in motion with queryVariants.

```diff
+ import { motion } from 'framer-motion';
+ import { queryVariants } from '../motion/variants';

  export function QueryBlock({ item }: QueryBlockProps) {
    return (
+     <motion.div variants={queryVariants}>
        <div className="query-block" data-testid="query-block">
          {/* existing content */}
        </div>
+     </motion.div>
    );
  }
```

**Lines Changed:** +5

### File 6.2: MODIFY `blocks/ResponseBlock.tsx`

**Change:** Add GlassPanel, StreamingText, and motion.

```diff
+ import { motion } from 'framer-motion';
+ import { GlassPanel } from '../motion/GlassPanel';
+ import { StreamingText } from '../StreamingText';
+ import { responseVariants, staggerContainer, staggerItem } from '../motion/variants';

  export function ResponseBlock({ 
    item, 
+   isGenerating,
    onSpanClick, 
    onPathClick 
  }: ResponseBlockProps) {
+   const isCurrentlyStreaming = isGenerating && !item.parsedSpans;
    
    return (
+     <motion.div variants={responseVariants}>
+       <GlassPanel intensity="medium" className="response-block">
+         {isCurrentlyStreaming ? (
+           <StreamingText content={item.content} isStreaming={true} />
+         ) : (
            {/* existing SpanRenderer/MarkdownRenderer logic */}
+         )}
          
          {item.suggestedPaths && (
+           <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {item.suggestedPaths.map((path, i) => (
+               <motion.div key={path.id} variants={staggerItem}>
                  <SuggestionChip ... />
+               </motion.div>
              ))}
+           </motion.div>
          )}
+       </GlassPanel>
+     </motion.div>
    );
  }
```

**Lines Changed:** +25

### File 6.3: MODIFY `blocks/NavigationBlock.tsx`

**Change:** Add staggered button animation.

```diff
+ import { motion } from 'framer-motion';
+ import { staggerContainer, staggerItem } from '../motion/variants';

  export function NavigationBlock({ item, onPathClick }: NavigationBlockProps) {
    return (
+     <motion.div 
+       className="navigation-block"
+       variants={staggerContainer}
+       initial="hidden"
+       animate="visible"
+     >
        {item.paths.map((path) => (
+         <motion.div key={path.id} variants={staggerItem}>
            <button onClick={() => onPathClick(path)}>
              {path.label}
            </button>
+         </motion.div>
        ))}
+     </motion.div>
    );
  }
```

**Lines Changed:** +12

### File 6.4: MODIFY `blocks/SystemBlock.tsx`

**Change:** Add fade animation.

```diff
+ import { motion } from 'framer-motion';
+ import { systemVariants } from '../motion/variants';

  export function SystemBlock({ item }: SystemBlockProps) {
    return (
+     <motion.div variants={systemVariants}>
        <div className="system-block" data-testid="system-block">
          {/* existing content */}
        </div>
+     </motion.div>
    );
  }
```

**Lines Changed:** +5

**Build Gate 6:** Blocks animate on entrance

---

## Phase 7: Container Integration

**Goal:** Wire everything together in parent components.

### File 7.1: MODIFY `StreamRenderer.tsx`

**Change:** Add AnimatePresence and reduced motion support.

```diff
+ import { AnimatePresence, motion } from 'framer-motion';
+ import { useReducedMotion } from 'framer-motion';
+ import { blockVariants, reducedMotionVariants } from './motion/variants';

  export function StreamRenderer({ ... }) {
+   const reducedMotion = useReducedMotion();
+   const variants = reducedMotion ? reducedMotionVariants : blockVariants;
    
    return (
      <div className="stream-renderer">
+       <AnimatePresence mode="popLayout">
          {allItems.map((item) => (
+           <motion.div
+             key={item.id}
+             variants={variants}
+             initial="hidden"
+             animate="visible"
+             exit="exit"
+             layout
+           >
              <StreamBlock item={item} {...props} />
+           </motion.div>
          ))}
+       </AnimatePresence>
        
        {bridgeState && <CognitiveBridge state={bridgeState} />}
      </div>
    );
  }
```

**Lines Changed:** +18

### File 7.2: MODIFY `TerminalChat.tsx`

**Change:** Integrate scroll anchor, floating input, new messages.

```diff
+ import { useRef, useEffect } from 'react';
+ import { useScrollAnchor } from './Stream/motion/useScrollAnchor';
+ import { FloatingInput } from './FloatingInput';
+ import { NewMessagesIndicator } from './NewMessagesIndicator';

  export function TerminalChat() {
+   const scrollContainerRef = useRef<HTMLDivElement>(null);
+   const { state, scrollToBottom, onNewMessage } = useScrollAnchor({
+     containerRef: scrollContainerRef
+   });
    
+   // Trigger onNewMessage when stream updates
+   useEffect(() => {
+     if (streamHistory.length > 0) {
+       onNewMessage();
+     }
+   }, [streamHistory.length, onNewMessage]);
    
    return (
      <div className="terminal-chat">
        <div 
+         ref={scrollContainerRef}
          className="chat-scroll-container"
        >
          <StreamRenderer ... />
        </div>
        
+       <NewMessagesIndicator
+         count={state.newMessageCount}
+         onClick={scrollToBottom}
+       />
        
-       <TerminalInput ... />
+       <FloatingInput
+         value={inputValue}
+         onChange={setInputValue}
+         onSubmit={handleSubmit}
+       />
      </div>
    );
  }
```

**Lines Changed:** +30

**Build Gate 7:** Full integration works E2E

---

## Phase 8: Testing & Validation

**Goal:** Add tests and visual regression baselines.

### File 8.1: CREATE `tests/unit/StreamingText.test.tsx`

```typescript
describe('StreamingText', () => {
  it('reveals characters progressively when streaming');
  it('shows full text immediately when not streaming');
  it('respects reduced motion preference');
  it('calls onComplete when finished');
  it('shows cursor during streaming');
  it('hides cursor when complete');
});
```

**Location:** `tests/unit/StreamingText.test.tsx`  
**Lines:** ~80

### File 8.2: CREATE `tests/unit/useScrollAnchor.test.ts`

```typescript
describe('useScrollAnchor', () => {
  it('detects when scrolled to bottom');
  it('detects user scroll away from bottom');
  it('auto-scrolls on new message when at bottom');
  it('does not auto-scroll when user has scrolled up');
  it('tracks new message count when paused');
  it('resets on scrollToBottom call');
  it('debounces scroll events');
});
```

**Location:** `tests/unit/useScrollAnchor.test.ts`  
**Lines:** ~100

### File 8.3: CREATE `tests/e2e/polish-baseline.spec.ts`

```typescript
test.describe('Polish Visual Regression', () => {
  test('glass effect renders correctly');
  test('animations complete smoothly');
  test('floating input stays visible');
  test('new messages indicator appears on scroll');
  test('reduced motion disables animations');
});
```

**Location:** `tests/e2e/polish-baseline.spec.ts`  
**Lines:** ~60

**Build Gate 8:** All tests pass

---

## File Summary

| Phase | File | Action | Lines |
|-------|------|--------|-------|
| 1 | Stream/motion/index.ts | CREATE | 10 |
| 1 | Stream/motion/variants.ts | CREATE | 90 |
| 1 | Stream/index.ts | MODIFY | +2 |
| 2 | globals.css | MODIFY | +80 |
| 3 | Stream/motion/GlassPanel.tsx | CREATE | 40 |
| 3 | FloatingInput.tsx | CREATE | 45 |
| 4 | Stream/motion/useScrollAnchor.ts | CREATE | 90 |
| 4 | NewMessagesIndicator.tsx | CREATE | 35 |
| 5 | Stream/StreamingText.tsx | CREATE | 80 |
| 6 | blocks/QueryBlock.tsx | MODIFY | +5 |
| 6 | blocks/ResponseBlock.tsx | MODIFY | +25 |
| 6 | blocks/NavigationBlock.tsx | MODIFY | +12 |
| 6 | blocks/SystemBlock.tsx | MODIFY | +5 |
| 7 | StreamRenderer.tsx | MODIFY | +18 |
| 7 | TerminalChat.tsx | MODIFY | +30 |
| 8 | tests/unit/StreamingText.test.tsx | CREATE | 80 |
| 8 | tests/unit/useScrollAnchor.test.ts | CREATE | 100 |
| 8 | tests/e2e/polish-baseline.spec.ts | CREATE | 60 |

**Total:** 8 new files, 7 modified files, ~800 lines

---

## Rollback Plan

### Per-Phase Rollback

| Phase | Rollback Command |
|-------|------------------|
| 1 | `rm -rf components/Terminal/Stream/motion/` |
| 2 | `git checkout app/globals.css` |
| 3 | `rm components/Terminal/FloatingInput.tsx` |
| 4 | `rm components/Terminal/NewMessagesIndicator.tsx` |
| 5 | `rm components/Terminal/Stream/StreamingText.tsx` |
| 6 | `git checkout components/Terminal/Stream/blocks/` |
| 7 | `git checkout components/Terminal/StreamRenderer.tsx components/Terminal/TerminalChat.tsx` |
| 8 | Delete test files |

### Full Rollback

```bash
# Option 1: Stash everything
git stash

# Option 2: Reset to pre-sprint commit
git checkout kinetic-stream-feature~1

# Option 3: Interactive revert
git revert HEAD~N..HEAD
```

---

## Dependency Graph

```
Phase 1 (variants)
    │
    ▼
Phase 2 (tokens)
    │
    ▼
Phase 3 (GlassPanel) ◄──────────────┐
    │                                │
    ▼                                │
Phase 4 (scroll) ◄────────┐         │
    │                      │         │
    ▼                      │         │
Phase 5 (streaming)        │         │
    │                      │         │
    ▼                      │         │
Phase 6 (blocks) ──────────┴─────────┘
    │
    ▼
Phase 7 (integration)
    │
    ▼
Phase 8 (testing)
```

---

*Migration map complete. Ready for architectural decisions.*
