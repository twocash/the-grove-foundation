# MIGRATION_MAP: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Date:** December 28, 2025

---

## Phase 1: Hook Layer (Core Logic)

### 1.1 Create useKineticScroll Hook

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

### 1.2 Export from Hooks Index

**File:** `src/surface/components/KineticStream/hooks/index.ts`

```typescript
export { useKineticStream } from './useKineticStream';
export { useKineticScroll } from './useKineticScroll';
export type { UseKineticScrollReturn } from './useKineticScroll';
```

---

## Phase 2: Component Layer

### 2.1 Create ScrollAnchor Component

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

### 2.2 Create ScrollToBottomFab Component

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

## Phase 3: Integration Layer

### 3.1 Update KineticRenderer

**File:** `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Changes:**
1. Add `bottomRef` prop
2. Import and render `ScrollAnchor`

```typescript
// Add import
import { ScrollAnchor } from './ScrollAnchor';

// Update interface
export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  bottomRef?: React.RefObject<HTMLDivElement>;  // ADD THIS
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}

// Update component signature
export const KineticRenderer: React.FC<KineticRendererProps> = ({
  items,
  currentItem,
  bottomRef,  // ADD THIS
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
  // ... existing code ...

  return (
    <div className="space-y-6" data-testid="kinetic-renderer">
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
            <KineticBlock
              item={item}
              onConceptClick={onConceptClick}
              onForkSelect={onForkSelect}
              onPromptSubmit={onPromptSubmit}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Scroll anchor - must be last */}
      <ScrollAnchor ref={bottomRef} />
    </div>
  );
};
```

### 3.2 Update CommandConsole

**File:** `src/surface/components/KineticStream/CommandConsole/index.tsx`

**Changes:**
1. Add scroll-related props
2. Import and render `ScrollToBottomFab`

```typescript
// Add import
import { ScrollToBottomFab } from './ScrollToBottomFab';

// Update interface
export interface CommandConsoleProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  showScrollButton?: boolean;      // ADD
  onScrollToBottom?: () => void;   // ADD
  isStreaming?: boolean;           // ADD
}

// Update component
export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onSubmit,
  isLoading,
  placeholder = 'Ask anything...',
  showScrollButton = false,        // ADD
  onScrollToBottom,                // ADD
  isStreaming = false,             // ADD
}) => {
  // ... existing state and handlers ...

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
        {/* ... existing input and button ... */}
      </div>
    </div>
  );
};
```

### 3.3 Update ExploreShell

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Changes:**
1. Import `useKineticScroll`
2. Wire up refs and state
3. Force re-engagement on submit

```typescript
// Update imports
import React, { useCallback, useMemo } from 'react';
import { KineticRenderer } from './Stream/KineticRenderer';
import { CommandConsole } from './CommandConsole';
import { useKineticStream } from './hooks/useKineticStream';
import { useKineticScroll } from './hooks/useKineticScroll';  // ADD
import type { RhetoricalSpan, JourneyFork, PivotContext } from '@core/schema/stream';

export const ExploreShell: React.FC<ExploreShellProps> = ({
  initialLens,
  initialJourney
}) => {
  const { items, currentItem, isLoading, submit } = useKineticStream();
  
  // Scroll management
  const isStreaming = currentItem?.type === 'response' && 
    'isGenerating' in currentItem && 
    currentItem.isGenerating === true;
  
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

  // ... existing handlers ...

  const handleSubmit = useCallback((query: string) => {
    // Force scroll to bottom on new submission
    scrollToBottom(false); // instant
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
            bottomRef={bottomRef}  // ADD
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
        showScrollButton={showScrollButton}       // ADD
        onScrollToBottom={() => scrollToBottom(true)}  // ADD
        isStreaming={isStreaming}                 // ADD
      />
    </div>
  );
};
```

---

## Rollback Plan

All changes are additive. To rollback:

1. Delete created files:
   - `hooks/useKineticScroll.ts`
   - `Stream/ScrollAnchor.tsx`
   - `CommandConsole/ScrollToBottomFab.tsx`

2. Revert modified files to previous commit

3. Single command: `git revert HEAD` (if committed atomically)

---

*Migration map complete. Proceed to TEST_STRATEGY.md*
