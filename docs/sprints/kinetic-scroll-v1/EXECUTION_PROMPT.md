# EXECUTION_PROMPT: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Purpose:** Self-contained prompt for Claude Code CLI execution

---

## Context

You are implementing "Sticky-Release" scroll physics for the Kinetic Stream at `/explore`. This prevents jitter during LLM streaming while giving users control to review history.

**The Problem:** Streaming text pushes content down. Without scroll management:
- User loses reading position
- Auto-scroll on every token causes "jitter"
- No way to review history while AI is talking

**The Solution:** "Sticky-Release" model:
1. **Magnet** - User at bottom (within 50px) stays locked to bottom
2. **Release** - Scroll up 1px past threshold breaks the lock  
3. **Re-engage** - Scroll to bottom, click FAB, or submit new query

---

## Pre-Flight Checks

```bash
cd C:\GitHub\the-grove-foundation

# Verify clean state
git status

# Type check
npx tsc --noEmit

# Verify existing files
cat src/surface/components/KineticStream/hooks/index.ts
cat src/surface/components/KineticStream/ExploreShell.tsx
```

---

## Implementation Steps

### Step 1: Create useKineticScroll Hook

**File:** `src/surface/components/KineticStream/hooks/useKineticScroll.ts`

```typescript
// src/surface/components/KineticStream/hooks/useKineticScroll.ts
// Sticky-release scroll physics for streaming content
// Sprint: kinetic-scroll-v1

import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';

const BOTTOM_THRESHOLD = 50; // pixels from bottom to consider "at bottom"

export interface UseKineticScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  bottomRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  showScrollButton: boolean;
  scrollToBottom: (smooth?: boolean) => void;
}

export function useKineticScroll(
  deps: [number, number, string | null], // [items.length, contentLength, currentId]
  isStreaming: boolean
): UseKineticScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Track previous values to detect change type
  const prevItemsLength = useRef(deps[0]);
  const prevContentLength = useRef(deps[1]);

  // 1. Track User Scroll Intent
  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distToBottom = scrollHeight - clientHeight - scrollTop;
      const stuck = distToBottom < BOTTOM_THRESHOLD;
      
      setIsAtBottom(stuck);
      setShowScrollButton(!stuck && isStreaming);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isStreaming]);

  // Update FAB visibility when streaming state changes
  useEffect(() => {
    if (!isStreaming) {
      setShowScrollButton(false);
    } else if (!isAtBottom) {
      setShowScrollButton(true);
    }
  }, [isStreaming, isAtBottom]);

  // 2. The Magnet - Auto-scroll during streaming (Layout Effect prevents flicker)
  useLayoutEffect(() => {
    if (!isStreaming || !isAtBottom) return;
    
    // Determine scroll behavior based on change type
    const itemsChanged = deps[0] !== prevItemsLength.current;
    const contentChanged = deps[1] !== prevContentLength.current;
    
    // Update refs
    prevItemsLength.current = deps[0];
    prevContentLength.current = deps[1];
    
    if (itemsChanged || contentChanged) {
      bottomRef.current?.scrollIntoView({
        behavior: 'auto', // Always instant during streaming
        block: 'end',
      });
    }
  }, [deps, isStreaming, isAtBottom]);

  // 3. Manual scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
    setIsAtBottom(true);
    setShowScrollButton(false);
  }, []);

  return {
    scrollRef,
    bottomRef,
    isAtBottom,
    showScrollButton,
    scrollToBottom,
  };
}
```

---

### Step 2: Update Hooks Index

**File:** `src/surface/components/KineticStream/hooks/index.ts`

Replace entire file:

```typescript
export { useKineticStream } from './useKineticStream';
export { useKineticScroll } from './useKineticScroll';
export type { UseKineticScrollReturn } from './useKineticScroll';
```

---

### Step 3: Create ScrollAnchor Component

**File:** `src/surface/components/KineticStream/Stream/ScrollAnchor.tsx`

```typescript
// src/surface/components/KineticStream/Stream/ScrollAnchor.tsx
// Invisible scroll target for reliable scrollIntoView
// Sprint: kinetic-scroll-v1

import React, { forwardRef } from 'react';

export const ScrollAnchor = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div 
      ref={ref} 
      className="h-px w-full" 
      aria-hidden="true"
      data-testid="scroll-anchor"
    />
  );
});

ScrollAnchor.displayName = 'ScrollAnchor';

export default ScrollAnchor;
```

---

### Step 4: Create ScrollToBottomFab Component

**File:** `src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx`

```typescript
// src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx
// Floating action button to resume auto-scroll
// Sprint: kinetic-scroll-v1

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export interface ScrollToBottomFabProps {
  visible: boolean;
  isStreaming: boolean;
  onClick: () => void;
}

export const ScrollToBottomFab: React.FC<ScrollToBottomFabProps> = ({
  visible,
  isStreaming,
  onClick,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="absolute -top-14 left-1/2 -translate-x-1/2
                     w-10 h-10 rounded-full
                     bg-[var(--glass-panel)] border border-[var(--glass-border)]
                     flex items-center justify-center
                     hover:bg-[var(--glass-solid)] hover:border-[var(--neon-cyan)]
                     transition-colors cursor-pointer
                     shadow-lg"
          aria-label="Scroll to bottom"
          data-testid="scroll-to-bottom-fab"
        >
          <ArrowDown className="w-4 h-4 text-[var(--glass-text-primary)]" />
          
          {/* Streaming indicator dot */}
          {isStreaming && (
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--neon-green)]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottomFab;
```

---

### Step 5: Update KineticRenderer

**File:** `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

Add import at top:
```typescript
import { ScrollAnchor } from './ScrollAnchor';
```

Update interface (add `bottomRef`):
```typescript
export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  bottomRef?: React.RefObject<HTMLDivElement>;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}
```

Update component signature:
```typescript
export const KineticRenderer: React.FC<KineticRendererProps> = ({
  items,
  currentItem,
  bottomRef,
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
```

Add ScrollAnchor at end of return, inside the outer div, after AnimatePresence:
```typescript
  return (
    <div className="space-y-6" data-testid="kinetic-renderer">
      <AnimatePresence mode="popLayout">
        {allItems.map((item) => (
          // ... existing code ...
        ))}
      </AnimatePresence>
      
      {/* Scroll anchor - must be last */}
      <ScrollAnchor ref={bottomRef} />
    </div>
  );
```

---

### Step 6: Update CommandConsole

**File:** `src/surface/components/KineticStream/CommandConsole/index.tsx`

Add import at top:
```typescript
import { ScrollToBottomFab } from './ScrollToBottomFab';
```

Update interface:
```typescript
export interface CommandConsoleProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
  isStreaming?: boolean;
}
```

Update component signature:
```typescript
export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onSubmit,
  isLoading,
  placeholder = 'Ask anything...',
  showScrollButton = false,
  onScrollToBottom,
  isStreaming = false,
}) => {
```

Add FAB before the relative div inside the return:
```typescript
  return (
    <div className="kinetic-console">
      {/* Scroll FAB - positioned above input */}
      {onScrollToBottom && (
        <ScrollToBottomFab
          visible={showScrollButton}
          isStreaming={isStreaming}
          onClick={onScrollToBottom}
        />
      )}
      
      <div className="relative">
        {/* ... existing input code ... */}
      </div>
    </div>
  );
```

---

### Step 7: Update ExploreShell

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

Replace entire file:

```typescript
// src/surface/components/KineticStream/ExploreShell.tsx
// Main container for the Kinetic exploration experience
// Sprint: kinetic-scroll-v1

import React, { useCallback, useMemo } from 'react';
import { KineticRenderer } from './Stream/KineticRenderer';
import { CommandConsole } from './CommandConsole';
import { useKineticStream } from './hooks/useKineticStream';
import { useKineticScroll } from './hooks/useKineticScroll';
import type { RhetoricalSpan, JourneyFork, PivotContext } from '@core/schema/stream';

export interface ExploreShellProps {
  initialLens?: string;
  initialJourney?: string;
}

export const ExploreShell: React.FC<ExploreShellProps> = ({
  initialLens,
  initialJourney
}) => {
  const { items, currentItem, isLoading, submit } = useKineticStream();
  
  // Determine if currently streaming
  const isStreaming = Boolean(
    currentItem?.type === 'response' && 
    'isGenerating' in currentItem && 
    currentItem.isGenerating
  );
  
  // Scroll management
  const scrollDeps = useMemo<[number, number, string | null]>(() => [
    items.length,
    currentItem?.content?.length ?? 0,
    currentItem?.id ?? null
  ], [items.length, currentItem?.content?.length, currentItem?.id]);
  
  const { 
    scrollRef, 
    bottomRef, 
    showScrollButton, 
    scrollToBottom 
  } = useKineticScroll(scrollDeps, isStreaming);

  const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
    const pivotContext: PivotContext = {
      sourceResponseId: sourceId,
      sourceText: span.text,
      sourceContext: `User clicked on the concept "${span.text}" to explore it further.`
    };

    submit(span.text, pivotContext);
  }, [submit]);

  const handleForkSelect = useCallback((fork: JourneyFork) => {
    if (fork.queryPayload) {
      submit(fork.queryPayload);
    } else {
      submit(fork.label);
    }
  }, [submit]);

  const handleSubmit = useCallback((query: string) => {
    // Force scroll to bottom on new submission (instant)
    scrollToBottom(false);
    submit(query);
  }, [submit, scrollToBottom]);

  return (
    <div className="kinetic-surface flex flex-col h-screen bg-[var(--glass-void)]">
      {/* Header area */}
      <header className="flex-none p-4 border-b border-[var(--glass-border)]">
        <h1 className="text-base font-sans font-semibold text-[var(--glass-text-primary)]">
          Explore The Grove
        </h1>
      </header>

      {/* Stream area - attach scrollRef */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto pb-32">
          <KineticRenderer
            items={items}
            currentItem={currentItem}
            bottomRef={bottomRef}
            onConceptClick={handleConceptClick}
            onForkSelect={handleForkSelect}
            onPromptSubmit={handleSubmit}
          />
        </div>
      </main>

      {/* Command console - with scroll props */}
      <CommandConsole
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Ask anything about The Grove..."
        showScrollButton={showScrollButton}
        onScrollToBottom={() => scrollToBottom(true)}
        isStreaming={isStreaming}
      />
    </div>
  );
};

export default ExploreShell;
```

---

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Run dev server
npm run dev
```

### Manual Testing Checklist

1. Navigate to `/explore`
2. Submit a query (e.g., "What is Grove?")
3. **Verify:** Content auto-scrolls as response streams
4. **Verify:** No jitter/flickering during streaming
5. During streaming, scroll up
6. **Verify:** Auto-scroll stops immediately
7. **Verify:** FAB appears with pulsing green dot
8. Click FAB
9. **Verify:** Smooth scroll to bottom
10. **Verify:** FAB disappears
11. Submit another query
12. **Verify:** Instant scroll to bottom, FAB hidden

---

## Troubleshooting

### FAB not appearing
- Check `showScrollButton` state in React DevTools
- Verify `isStreaming` is `true` during response generation
- Check z-index conflicts in CSS

### Scroll jitter during typing
- Ensure `useLayoutEffect` (not `useEffect`) for scroll updates
- Verify `behavior: 'auto'` for streaming updates

### Safari scroll issues
- Add to container CSS if needed: `-webkit-overflow-scrolling: touch`

### TypeScript errors
- Ensure `bottomRef` is optional in KineticRendererProps
- Check `RefObject<HTMLDivElement>` type for refs

---

## Success Criteria

- [ ] Streaming text auto-scrolls without jitter
- [ ] User can scroll up to break the lock
- [ ] FAB appears when scrolled up during streaming
- [ ] FAB has pulsing indicator when streaming active
- [ ] Clicking FAB smooth-scrolls to bottom
- [ ] New query submission forces instant scroll to bottom
- [ ] TypeScript compiles without errors
- [ ] Build succeeds

---

## Commit Message

```
feat(kinetic): implement sticky-release scroll physics

- Add useKineticScroll hook with 50px magnetic threshold
- Add ScrollAnchor component for reliable scrollIntoView
- Add ScrollToBottomFab with streaming indicator
- Wire scroll refs and handlers through ExploreShell
- Auto-scroll during streaming, release on user scroll
- FAB appears when scrolled up during active stream

Sprint: kinetic-scroll-v1
```

---

*Execution prompt complete. Run with Claude Code CLI.*
