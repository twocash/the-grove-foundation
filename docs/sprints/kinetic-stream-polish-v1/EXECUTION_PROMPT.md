# Execution Prompt: kinetic-stream-polish-v1

**Sprint:** Glass UX Layer and Motion Design  
**Target Branch:** kinetic-stream-feature  
**Prerequisites:** Sprint 1 (schema) and Sprint 2 (rendering) complete  

---

## Quick Start

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# Ensure on correct branch
git checkout kinetic-stream-feature

# Install dependencies (if needed)
npm install

# Verify Framer Motion is available
npm list framer-motion

# Start dev server
npm run dev
```

---

## Pre-Flight Check

Before starting, verify Sprint 2 is complete:

```bash
# Check for Sprint 2 components
ls components/Terminal/Stream/
# Should see: StreamRenderer.tsx, SpanRenderer.tsx, blocks/

# Check for block components
ls components/Terminal/Stream/blocks/
# Should see: QueryBlock.tsx, ResponseBlock.tsx, NavigationBlock.tsx, SystemBlock.tsx
```

If Sprint 2 is incomplete, complete it first or stub the components.

---

## Phase 1: Motion Infrastructure

### 1.1 Create motion directory

```bash
mkdir -p components/Terminal/Stream/motion
```

### 1.2 Create motion/index.ts

```typescript
// components/Terminal/Stream/motion/index.ts

// Animation variants
export {
  blockVariants,
  queryVariants,
  responseVariants,
  systemVariants,
  staggerContainer,
  staggerItem,
  reducedMotionVariants
} from './variants';

// Components
export { GlassPanel } from './GlassPanel';

// Hooks
export { useScrollAnchor } from './useScrollAnchor';
export type { ScrollAnchorState } from './useScrollAnchor';
```

### 1.3 Create motion/variants.ts

```typescript
// components/Terminal/Stream/motion/variants.ts
import type { Variants } from 'framer-motion';

/**
 * Standard block entrance/exit animation.
 * Used as default for all stream blocks.
 */
export const blockVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

/**
 * Query block animation - slides in from right.
 * Creates visual distinction for user messages.
 */
export const queryVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

/**
 * Response block animation - slides in from left.
 * Creates visual distinction for AI responses.
 */
export const responseVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

/**
 * System block animation - fade only.
 * Subtle entrance for status messages.
 */
export const systemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

/**
 * Container for staggered children.
 * Apply to parent, use staggerItem on children.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

/**
 * Individual staggered item.
 * Use inside a staggerContainer parent.
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Reduced motion variants - instant transitions.
 * Used when prefers-reduced-motion is set.
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } }
};
```

### 1.4 Update Stream/index.ts

```typescript
// components/Terminal/Stream/index.ts
// Add to existing exports:

export * from './motion';
export { StreamingText } from './StreamingText';
```

### Build Gate 1

```bash
npm run typecheck
# Should pass with no errors
```

---

## Phase 2: Glass Token System

### 2.1 Add tokens to globals.css

Add to `:root` section:

```css
/* Glass effect tokens */
--glass-bg: rgba(255, 255, 255, 0.05);
--glass-bg-hover: rgba(255, 255, 255, 0.08);
--glass-blur: 12px;
--glass-border: rgba(255, 255, 255, 0.1);
--glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

/* Animation timing tokens */
--motion-duration-fast: 150ms;
--motion-duration-normal: 300ms;
--motion-duration-slow: 500ms;
--motion-ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--motion-ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--motion-ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Streaming animation tokens */
--streaming-cursor-color: var(--grove-primary);
--streaming-char-delay: 50ms;

/* Floating input tokens */
--input-float-offset: 16px;
--input-float-max-height: 200px;
```

### 2.2 Add glass utility classes

Add after tokens:

```css
/* Glass panel base */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
}

/* Glass intensity variants */
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

/* Floating input container */
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
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  z-index: 11;
}

.new-messages-indicator:hover {
  background: var(--glass-bg-hover);
  color: var(--text-primary);
}

.new-messages-indicator .arrow {
  font-size: 1.1em;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Build Gate 2

```bash
# Visual check - inspect glass classes in DevTools
npm run dev
# Open browser, add .glass-panel to any element
```

---

## Phase 3: Glass Components

### 3.1 Create GlassPanel.tsx

```typescript
// components/Terminal/Stream/motion/GlassPanel.tsx
import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type GlassIntensity = 'light' | 'medium' | 'heavy';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  intensity?: GlassIntensity;
  className?: string;
}

const intensityClasses: Record<GlassIntensity, string> = {
  light: 'glass-panel-light',
  medium: 'glass-panel-medium',
  heavy: 'glass-panel-heavy'
};

/**
 * Reusable glass effect panel.
 * Supports three intensity levels and forwards all Framer Motion props.
 */
export function GlassPanel({
  children,
  intensity = 'medium',
  className,
  ...motionProps
}: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        'glass-panel',
        intensityClasses[intensity],
        className
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
```

### 3.2 Create FloatingInput.tsx

```typescript
// components/Terminal/FloatingInput.tsx
import { motion } from 'framer-motion';
import { GlassPanel } from './Stream/motion/GlassPanel';
import { TerminalInput, TerminalInputProps } from './TerminalInput';

interface FloatingInputProps extends TerminalInputProps {
  // Extends all TerminalInput props
}

/**
 * Floating input wrapper with glass effect.
 * Always visible at bottom of viewport.
 */
export function FloatingInput(props: FloatingInputProps) {
  return (
    <div className="floating-input-container">
      <GlassPanel
        intensity="heavy"
        className="floating-input-panel"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
      >
        <TerminalInput {...props} />
      </GlassPanel>
    </div>
  );
}
```

### Build Gate 3

```bash
npm run typecheck
# Components should compile without error
```

---

## Phase 4: Smart Scroll

### 4.1 Create useScrollAnchor.ts

```typescript
// components/Terminal/Stream/motion/useScrollAnchor.ts
import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

export interface ScrollAnchorState {
  isAtBottom: boolean;
  isUserScrolling: boolean;
  shouldAutoScroll: boolean;
  newMessageCount: number;
}

interface UseScrollAnchorOptions {
  containerRef: RefObject<HTMLElement>;
  bottomThreshold?: number;
  debounceMs?: number;
}

interface UseScrollAnchorReturn {
  state: ScrollAnchorState;
  scrollToBottom: () => void;
  onNewMessage: () => void;
  resetAutoScroll: () => void;
}

const DEFAULT_THRESHOLD = 100; // pixels from bottom
const DEFAULT_DEBOUNCE = 100; // milliseconds

/**
 * Smart scroll management hook.
 * Auto-scrolls during generation but respects user scroll.
 */
export function useScrollAnchor({
  containerRef,
  bottomThreshold = DEFAULT_THRESHOLD,
  debounceMs = DEFAULT_DEBOUNCE
}: UseScrollAnchorOptions): UseScrollAnchorReturn {
  const [state, setState] = useState<ScrollAnchorState>({
    isAtBottom: true,
    isUserScrolling: false,
    shouldAutoScroll: true,
    newMessageCount: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  // Check if scrolled to bottom (within threshold)
  const checkIfAtBottom = useCallback((): boolean => {
    const el = containerRef.current;
    if (!el) return true;

    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight < bottomThreshold;
  }, [containerRef, bottomThreshold]);

  // Scroll to bottom with smooth behavior
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    });

    setState(prev => ({
      ...prev,
      isAtBottom: true,
      isUserScrolling: false,
      shouldAutoScroll: true,
      newMessageCount: 0
    }));
  }, [containerRef]);

  // Handle scroll events with debounce
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce scroll handling
      timeoutRef.current = setTimeout(() => {
        const atBottom = checkIfAtBottom();

        setState(prev => ({
          ...prev,
          isAtBottom: atBottom,
          isUserScrolling: !atBottom,
          shouldAutoScroll: atBottom,
          // Reset count if user scrolled to bottom
          newMessageCount: atBottom ? 0 : prev.newMessageCount
        }));
      }, debounceMs);
    };

    // Use passive listener for performance
    el.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, checkIfAtBottom, debounceMs]);

  // Called when new message arrives
  const onNewMessage = useCallback(() => {
    if (state.shouldAutoScroll) {
      // Auto-scroll to bottom
      scrollToBottom();
    } else {
      // Increment new message count
      setState(prev => ({
        ...prev,
        newMessageCount: prev.newMessageCount + 1
      }));
    }
  }, [state.shouldAutoScroll, scrollToBottom]);

  // Reset auto-scroll (alias for scrollToBottom)
  const resetAutoScroll = scrollToBottom;

  return {
    state,
    scrollToBottom,
    onNewMessage,
    resetAutoScroll
  };
}
```

### 4.2 Create NewMessagesIndicator.tsx

```typescript
// components/Terminal/NewMessagesIndicator.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface NewMessagesIndicatorProps {
  count: number;
  onClick: () => void;
}

/**
 * Floating indicator showing new message count.
 * Appears when user has scrolled up and new messages arrive.
 */
export function NewMessagesIndicator({
  count,
  onClick
}: NewMessagesIndicatorProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          className="new-messages-indicator"
          onClick={onClick}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`${count} new message${count > 1 ? 's' : ''}, click to scroll to bottom`}
          role="status"
          aria-live="polite"
        >
          <span>
            {count} new message{count > 1 ? 's' : ''}
          </span>
          <span className="arrow">↓</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
```

### Build Gate 4

```bash
npm run typecheck
# Hook and component should compile
```

---

## Phase 5: Streaming Animation

### 5.1 Create StreamingText.tsx

```typescript
// components/Terminal/Stream/StreamingText.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  characterDelay?: number;
  batchSize?: number;
  onComplete?: () => void;
  className?: string;
}

const DEFAULT_CHAR_DELAY = 50;
const DEFAULT_BATCH_SIZE = 3;

/**
 * Text that reveals character-by-character during streaming.
 * Respects reduced motion preference.
 */
export function StreamingText({
  content,
  isStreaming,
  characterDelay = DEFAULT_CHAR_DELAY,
  batchSize = DEFAULT_BATCH_SIZE,
  onComplete,
  className
}: StreamingTextProps) {
  const reducedMotion = useReducedMotion();
  const [displayedLength, setDisplayedLength] = useState(
    // Show all immediately if not streaming or reduced motion
    (!isStreaming || reducedMotion) ? content.length : 0
  );
  const intervalRef = useRef<NodeJS.Timeout>();
  const completedRef = useRef(false);

  useEffect(() => {
    // Reset when content changes
    if (!isStreaming || reducedMotion) {
      setDisplayedLength(content.length);
      return;
    }

    // Start from 0 for new streaming content
    setDisplayedLength(0);
    completedRef.current = false;

    // Character reveal loop
    intervalRef.current = setInterval(() => {
      setDisplayedLength(prev => {
        const next = Math.min(prev + batchSize, content.length);

        // Check if complete
        if (next >= content.length && !completedRef.current) {
          completedRef.current = true;
          clearInterval(intervalRef.current);
          onComplete?.();
        }

        return next;
      });
    }, characterDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [content, isStreaming, characterDelay, batchSize, onComplete, reducedMotion]);

  // Sync displayed length when content grows (during actual streaming)
  useEffect(() => {
    if (isStreaming && displayedLength > content.length) {
      setDisplayedLength(content.length);
    }
  }, [content.length, displayedLength, isStreaming]);

  const displayedText = content.slice(0, displayedLength);
  const showCursor = isStreaming && displayedLength < content.length;

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <motion.span
          className="streaming-cursor"
          animate={{ opacity: [1, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            ease: 'linear'
          }}
        >
          ▋
        </motion.span>
      )}
    </span>
  );
}
```

### Build Gate 5

```bash
npm run typecheck
# StreamingText should compile
```

---

## Phase 6: Block Animations

### 6.1 Modify QueryBlock.tsx

Add motion wrapper:

```typescript
// components/Terminal/Stream/blocks/QueryBlock.tsx
import { motion } from 'framer-motion';
import { queryVariants } from '../motion/variants';
// ... existing imports

export function QueryBlock({ item }: QueryBlockProps) {
  return (
    <motion.div
      variants={queryVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="query-block" data-testid="query-block">
        {/* existing content unchanged */}
      </div>
    </motion.div>
  );
}
```

### 6.2 Modify ResponseBlock.tsx

Add glass, motion, and streaming:

```typescript
// components/Terminal/Stream/blocks/ResponseBlock.tsx
import { motion } from 'framer-motion';
import { GlassPanel } from '../motion/GlassPanel';
import { StreamingText } from '../StreamingText';
import {
  responseVariants,
  staggerContainer,
  staggerItem
} from '../motion/variants';
// ... existing imports

interface ResponseBlockProps {
  item: StreamItem;
  isGenerating?: boolean;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
}

export function ResponseBlock({
  item,
  isGenerating = false,
  onSpanClick,
  onPathClick
}: ResponseBlockProps) {
  // Show streaming animation if generating and no parsed spans yet
  const isCurrentlyStreaming = isGenerating && !item.parsedSpans;

  return (
    <motion.div
      variants={responseVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <GlassPanel intensity="medium" className="response-block">
        <div className="response-content" data-testid="response-block">
          {isCurrentlyStreaming ? (
            <StreamingText
              content={item.content}
              isStreaming={true}
            />
          ) : (
            <>
              {item.parsedSpans ? (
                <SpanRenderer
                  content={item.content}
                  spans={item.parsedSpans}
                  onSpanClick={onSpanClick}
                />
              ) : (
                <MarkdownRenderer content={item.content} />
              )}
            </>
          )}
        </div>

        {item.suggestedPaths && item.suggestedPaths.length > 0 && (
          <motion.div
            className="suggested-paths"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {item.suggestedPaths.map((path) => (
              <motion.div key={path.id} variants={staggerItem}>
                <SuggestionChip
                  label={path.label}
                  onClick={() => onPathClick?.(path)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </GlassPanel>
    </motion.div>
  );
}
```

### 6.3 Modify NavigationBlock.tsx

Add stagger animation:

```typescript
// components/Terminal/Stream/blocks/NavigationBlock.tsx
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../motion/variants';
// ... existing imports

export function NavigationBlock({ item, onPathClick }: NavigationBlockProps) {
  return (
    <motion.div
      className="navigation-block"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      data-testid="navigation-block"
    >
      {item.paths.map((path) => (
        <motion.div key={path.id} variants={staggerItem}>
          <button
            className="navigation-button"
            onClick={() => onPathClick?.(path)}
          >
            {path.label}
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 6.4 Modify SystemBlock.tsx

Add fade animation:

```typescript
// components/Terminal/Stream/blocks/SystemBlock.tsx
import { motion } from 'framer-motion';
import { systemVariants } from '../motion/variants';
// ... existing imports

export function SystemBlock({ item }: SystemBlockProps) {
  return (
    <motion.div
      variants={systemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="system-block" data-testid="system-block">
        {/* existing content unchanged */}
      </div>
    </motion.div>
  );
}
```

### Build Gate 6

```bash
npm run dev
# Blocks should animate on entrance
```

---

## Phase 7: Container Integration

### 7.1 Modify StreamRenderer.tsx

Add AnimatePresence:

```typescript
// components/Terminal/Stream/StreamRenderer.tsx
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { blockVariants, reducedMotionVariants } from './motion/variants';
// ... existing imports

export function StreamRenderer({
  streamHistory,
  currentStreamItem,
  isGenerating,
  bridgeState,
  onSpanClick,
  onPathClick
}: StreamRendererProps) {
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedMotionVariants : blockVariants;

  // Combine history and current item
  const allItems = currentStreamItem
    ? [...streamHistory, currentStreamItem]
    : streamHistory;

  return (
    <div className="stream-renderer">
      <AnimatePresence mode="popLayout">
        {allItems.map((item) => (
          <motion.div
            key={item.id}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <StreamBlock
              item={item}
              isGenerating={isGenerating && item.id === currentStreamItem?.id}
              onSpanClick={onSpanClick}
              onPathClick={onPathClick}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Cognitive Bridge injection */}
      {bridgeState && <CognitiveBridge state={bridgeState} />}
    </div>
  );
}
```

### 7.2 Modify TerminalChat.tsx

Integrate scroll anchor and floating input:

```typescript
// components/Terminal/TerminalChat.tsx
import { useRef, useEffect } from 'react';
import { useScrollAnchor } from './Stream/motion/useScrollAnchor';
import { FloatingInput } from './FloatingInput';
import { NewMessagesIndicator } from './NewMessagesIndicator';
// ... existing imports

export function TerminalChat() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Smart scroll management
  const { state: scrollState, scrollToBottom, onNewMessage } = useScrollAnchor({
    containerRef: scrollContainerRef
  });

  // Get stream data from machine context
  const { streamHistory, currentStreamItem, isGenerating } = useTerminalContext();

  // Trigger onNewMessage when stream updates
  useEffect(() => {
    if (streamHistory.length > 0 || currentStreamItem) {
      onNewMessage();
    }
  }, [streamHistory.length, currentStreamItem?.id, onNewMessage]);

  // ... existing state and handlers

  return (
    <div className="terminal-chat">
      <div
        ref={scrollContainerRef}
        className="chat-scroll-container"
      >
        <StreamRenderer
          streamHistory={streamHistory}
          currentStreamItem={currentStreamItem}
          isGenerating={isGenerating}
          bridgeState={bridgeState}
          onSpanClick={handleSpanClick}
          onPathClick={handlePathClick}
        />
      </div>

      {/* New messages indicator */}
      <NewMessagesIndicator
        count={scrollState.newMessageCount}
        onClick={scrollToBottom}
      />

      {/* Floating input */}
      <FloatingInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isDisabled={isGenerating}
        placeholder="Ask the Grove..."
      />
    </div>
  );
}
```

### Build Gate 7

```bash
npm run dev
# Full integration should work E2E
# Test: send message, verify animation, scroll behavior
```

---

## Phase 8: Testing

### 8.1 Unit test files to create

Create test files in `tests/unit/`:

1. `StreamingText.test.tsx`
2. `useScrollAnchor.test.ts`
3. `GlassPanel.test.tsx`

### 8.2 E2E test file

Create `tests/e2e/polish-baseline.spec.ts`

### 8.3 Run tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type check
npm run typecheck
```

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Build
npm run build

# Start dev server
npm run dev
```

---

## Troubleshooting

### Glass effect not visible
- Check browser supports `backdrop-filter`
- Verify tokens are in `:root`
- Check element has solid content behind it

### Animations janky
- Profile in Chrome DevTools
- Verify using transform/opacity only
- Check for layout-triggering properties

### Scroll anchor not working
- Verify ref is attached to scroll container
- Check threshold value
- Add console.log to scroll handler

### Streaming not animating
- Check `isGenerating` prop
- Verify `reducedMotion` preference
- Check interval timing

---

## Completion Checklist

- [ ] Phase 1: Motion infrastructure complete
- [ ] Phase 2: Glass tokens added
- [ ] Phase 3: Glass components created
- [ ] Phase 4: Smart scroll working
- [ ] Phase 5: Streaming animation complete
- [ ] Phase 6: Block animations added
- [ ] Phase 7: Container integration done
- [ ] Phase 8: Tests passing
- [ ] All build gates passed
- [ ] Visual regression baselines captured
- [ ] Accessibility audit passed
- [ ] Documentation updated

---

*Execution prompt complete. Begin with Phase 1.*
