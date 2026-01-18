# Architecture: kinetic-stream-polish-v1

**Sprint:** Glass UX Layer and Motion Design  
**Version:** 1.0  

---

## 1. Component Architecture

### 1.1 File Structure

```
components/Terminal/
├── Stream/
│   ├── index.ts                    [MODIFY] Add motion exports
│   ├── StreamRenderer.tsx          [MODIFY] Add AnimatePresence
│   ├── SpanRenderer.tsx            [MODIFY] Add hover animations
│   ├── StreamingText.tsx           [NEW] Character reveal component
│   ├── blocks/
│   │   ├── QueryBlock.tsx          [MODIFY] Add motion wrapper
│   │   ├── ResponseBlock.tsx       [MODIFY] Add glass + motion
│   │   ├── NavigationBlock.tsx     [MODIFY] Add stagger
│   │   └── SystemBlock.tsx         [MODIFY] Add fade
│   └── motion/                     [NEW DIRECTORY]
│       ├── index.ts                Barrel export
│       ├── variants.ts             Shared animation variants
│       ├── GlassPanel.tsx          Reusable glass wrapper
│       └── useScrollAnchor.ts      Smart scroll hook
├── TerminalChat.tsx                [MODIFY] Integrate scroll anchor
├── TerminalInput.tsx               [MODIFY] Extract to floating
├── FloatingInput.tsx               [NEW] Floating input wrapper
└── NewMessagesIndicator.tsx        [NEW] Scroll-to-bottom button
```

### 1.2 Component Hierarchy

```
TerminalChat
├── ScrollContainer (with useScrollAnchor)
│   └── StreamRenderer
│       └── AnimatePresence
│           ├── motion.div > QueryBlock
│           ├── motion.div > ResponseBlock
│           │   └── GlassPanel
│           │       ├── StreamingText (if generating)
│           │       └── SpanRenderer (if complete)
│           ├── motion.div > NavigationBlock
│           │   └── motion.div per button (stagger)
│           └── motion.div > SystemBlock
├── NewMessagesIndicator (conditional)
└── FloatingInput
    └── GlassPanel
        └── TerminalInput
```

---

## 2. Data Flow

### 2.1 Animation State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANIMATION DATA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Machine Context                                                │
│       │                                                         │
│       ├── streamHistory ──────────────► StreamRenderer          │
│       │                                    │                    │
│       │                                    ▼                    │
│       │                              AnimatePresence            │
│       │                                    │                    │
│       │                         ┌─────────┴─────────┐          │
│       │                         ▼                   ▼          │
│       │                    Existing Items      New Items       │
│       │                    (no animation)     (animate in)     │
│       │                                                        │
│       ├── isGenerating ───────────────► ResponseBlock          │
│       │                                    │                   │
│       │                                    ▼                   │
│       │                              StreamingText             │
│       │                              (char reveal)             │
│       │                                                        │
│       └── currentStreamItem ──────────► StreamingText          │
│                                         (content prop)         │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Scroll State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCROLL STATE FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Scroll Event                                              │
│       │                                                         │
│       ▼                                                         │
│  useScrollAnchor                                                │
│       │                                                         │
│       ├── Calculate distance from bottom                        │
│       │                                                         │
│       ├── If > THRESHOLD: isUserScrolling = true               │
│       │       │                                                 │
│       │       ▼                                                 │
│       │   shouldAutoScroll = false                             │
│       │       │                                                 │
│       │       ▼                                                 │
│       │   Show NewMessagesIndicator                            │
│       │                                                         │
│       └── If ≤ THRESHOLD: isUserScrolling = false              │
│               │                                                 │
│               ▼                                                 │
│           shouldAutoScroll = true                              │
│               │                                                 │
│               ▼                                                 │
│           Hide NewMessagesIndicator                            │
│                                                                 │
│  New Message Arrives                                           │
│       │                                                         │
│       ▼                                                         │
│  Check shouldAutoScroll                                        │
│       │                                                         │
│       ├── If true: scrollToBottom()                            │
│       │                                                         │
│       └── If false: newMessageCount++                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 StreamingText

**Purpose:** Reveal text character-by-character during generation.

```typescript
// StreamingText.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  characterDelay?: number;
  batchSize?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingText({
  content,
  isStreaming,
  characterDelay = 50,
  batchSize = 3,
  onComplete,
  className
}: StreamingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(
    isStreaming ? 0 : content.length
  );
  const intervalRef = useRef<NodeJS.Timeout>();
  const reducedMotion = useReducedMotion();
  
  useEffect(() => {
    // If reduced motion or not streaming, show all
    if (reducedMotion || !isStreaming) {
      setDisplayedLength(content.length);
      return;
    }
    
    // Character reveal loop
    intervalRef.current = setInterval(() => {
      setDisplayedLength(prev => {
        const next = Math.min(prev + batchSize, content.length);
        if (next >= content.length) {
          clearInterval(intervalRef.current);
          onComplete?.();
        }
        return next;
      });
    }, characterDelay);
    
    return () => clearInterval(intervalRef.current);
  }, [content, isStreaming, characterDelay, batchSize, reducedMotion]);
  
  const displayedText = content.slice(0, displayedLength);
  const showCursor = isStreaming && displayedLength < content.length;
  
  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <motion.span
          className="streaming-cursor"
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
        >
          ▋
        </motion.span>
      )}
    </span>
  );
}
```

**Key Behaviors:**
- Respects `prefers-reduced-motion`
- Batches characters for performance (default: 3 at a time)
- Blinking cursor during stream
- Calls `onComplete` when finished
- Immediate display when `isStreaming=false`

### 3.2 useScrollAnchor

**Purpose:** Smart scroll management that doesn't fight the user.

```typescript
// useScrollAnchor.ts
import { useState, useEffect, useCallback, RefObject } from 'react';

interface ScrollAnchorState {
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

export function useScrollAnchor({
  containerRef,
  bottomThreshold = 100,
  debounceMs = 100
}: UseScrollAnchorOptions) {
  const [state, setState] = useState<ScrollAnchorState>({
    isAtBottom: true,
    isUserScrolling: false,
    shouldAutoScroll: true,
    newMessageCount: 0
  });
  
  // Check if scrolled to bottom
  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight < bottomThreshold;
  }, [containerRef, bottomThreshold]);
  
  // Scroll to bottom
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
      shouldAutoScroll: true,
      newMessageCount: 0
    }));
  }, [containerRef]);
  
  // Handle scroll events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const atBottom = checkIfAtBottom();
        
        setState(prev => ({
          ...prev,
          isAtBottom: atBottom,
          isUserScrolling: !atBottom,
          shouldAutoScroll: atBottom
        }));
      }, debounceMs);
    };
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [containerRef, checkIfAtBottom, debounceMs]);
  
  // Increment new message count when not auto-scrolling
  const onNewMessage = useCallback(() => {
    if (!state.shouldAutoScroll) {
      setState(prev => ({
        ...prev,
        newMessageCount: prev.newMessageCount + 1
      }));
    } else {
      scrollToBottom();
    }
  }, [state.shouldAutoScroll, scrollToBottom]);
  
  return {
    state,
    scrollToBottom,
    onNewMessage,
    resetAutoScroll: scrollToBottom
  };
}
```

**Key Behaviors:**
- Debounces scroll events (100ms default)
- Threshold-based bottom detection (100px default)
- Tracks new message count when paused
- Smooth scroll animation
- Passive scroll listener for performance

### 3.3 GlassPanel

**Purpose:** Reusable glass effect wrapper.

```typescript
// GlassPanel.tsx
import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

const intensityStyles = {
  light: 'glass-panel-light',
  medium: 'glass-panel-medium',
  heavy: 'glass-panel-heavy'
};

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
        intensityStyles[intensity],
        className
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
```

**CSS Classes:**

```css
/* globals.css */
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
```

### 3.4 Motion Variants

**Purpose:** Shared animation configurations.

```typescript
// variants.ts
import { Variants } from 'framer-motion';

// Standard block entrance
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

// Query block (from right)
export const queryVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// Response block (from left)
export const responseVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// System block (fade only)
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

// Container for staggered children
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

// Individual stagger item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 }
  }
};

// Reduced motion variants (instant)
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};
```

### 3.5 FloatingInput

**Purpose:** Always-visible input at bottom of viewport.

```typescript
// FloatingInput.tsx
import { motion } from 'framer-motion';
import { GlassPanel } from './Stream/motion/GlassPanel';
import { TerminalInput } from './TerminalInput';

interface FloatingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export function FloatingInput({
  value,
  onChange,
  onSubmit,
  isDisabled,
  placeholder
}: FloatingInputProps) {
  return (
    <div className="floating-input-container">
      <GlassPanel 
        intensity="heavy"
        className="floating-input-panel"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <TerminalInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          isDisabled={isDisabled}
          placeholder={placeholder}
        />
      </GlassPanel>
    </div>
  );
}
```

**CSS:**

```css
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
```

### 3.6 NewMessagesIndicator

**Purpose:** Show count of new messages and scroll-to-bottom action.

```typescript
// NewMessagesIndicator.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface NewMessagesIndicatorProps {
  count: number;
  onClick: () => void;
}

export function NewMessagesIndicator({ 
  count, 
  onClick 
}: NewMessagesIndicatorProps) {
  if (count === 0) return null;
  
  return (
    <AnimatePresence>
      <motion.button
        className="new-messages-indicator"
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{count} new message{count > 1 ? 's' : ''}</span>
        <span className="arrow">↓</span>
      </motion.button>
    </AnimatePresence>
  );
}
```

---

## 4. Integration Points

### 4.1 StreamRenderer Integration

```typescript
// StreamRenderer.tsx modifications
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { blockVariants, reducedMotionVariants } from './motion/variants';

export function StreamRenderer({ ... }) {
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedMotionVariants : blockVariants;
  
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
            <StreamBlock item={item} {...props} />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Cognitive Bridge injection */}
      {bridgeState && <CognitiveBridge state={bridgeState} />}
    </div>
  );
}
```

### 4.2 ResponseBlock Integration

```typescript
// ResponseBlock.tsx modifications
import { GlassPanel } from '../motion/GlassPanel';
import { StreamingText } from '../StreamingText';
import { responseVariants } from '../motion/variants';

export function ResponseBlock({ item, isGenerating, onSpanClick, onPathClick }) {
  const isCurrentlyStreaming = isGenerating && !item.parsedSpans;
  
  return (
    <motion.div variants={responseVariants}>
      <GlassPanel intensity="medium" className="response-block">
        {isCurrentlyStreaming ? (
          <StreamingText
            content={item.content}
            isStreaming={true}
            onComplete={() => {/* trigger parse */}}
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
        
        {item.suggestedPaths && (
          <motion.div 
            className="suggested-paths"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {item.suggestedPaths.map((path, i) => (
              <motion.div key={path.id} variants={staggerItem}>
                <SuggestionChip
                  label={path.label}
                  onClick={() => onPathClick(path)}
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

### 4.3 TerminalChat Integration

```typescript
// TerminalChat.tsx modifications
import { useScrollAnchor } from './Stream/motion/useScrollAnchor';
import { FloatingInput } from './FloatingInput';
import { NewMessagesIndicator } from './NewMessagesIndicator';

export function TerminalChat() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { state, scrollToBottom, onNewMessage } = useScrollAnchor({
    containerRef: scrollContainerRef
  });
  
  // Trigger onNewMessage when stream updates
  useEffect(() => {
    if (streamHistory.length > 0) {
      onNewMessage();
    }
  }, [streamHistory.length]);
  
  return (
    <div className="terminal-chat">
      <div 
        ref={scrollContainerRef}
        className="chat-scroll-container"
      >
        <StreamRenderer ... />
      </div>
      
      <NewMessagesIndicator
        count={state.newMessageCount}
        onClick={scrollToBottom}
      />
      
      <FloatingInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
```

---

## 5. Performance Considerations

### 5.1 Animation Performance

| Technique | Implementation |
|-----------|----------------|
| GPU acceleration | Use transform/opacity only |
| Layout isolation | `layout` prop on motion.div |
| Batched updates | RequestAnimationFrame in streaming |
| Passive listeners | `{ passive: true }` on scroll |

### 5.2 Bundle Size

```
framer-motion: ~30KB gzipped (already installed)
New components: ~5KB gzipped
Total increase: ~5KB
```

### 5.3 Memory Management

- Clear intervals on unmount
- Debounce scroll handlers
- Use `AnimatePresence mode="popLayout"` for efficient exits

---

## 6. Accessibility

### 6.1 Reduced Motion

```typescript
// All animated components check this
const reducedMotion = useReducedMotion();

// Apply instant variants when true
const variants = reducedMotion ? reducedMotionVariants : normalVariants;
```

### 6.2 Focus Management

- FloatingInput traps focus appropriately
- NewMessagesIndicator is keyboard accessible
- Animation doesn't interfere with screen readers

### 6.3 ARIA Attributes

```tsx
<motion.button
  aria-label={`${count} new messages, click to scroll to bottom`}
  role="status"
  aria-live="polite"
>
```

---

*Architecture complete. Ready for migration mapping.*
