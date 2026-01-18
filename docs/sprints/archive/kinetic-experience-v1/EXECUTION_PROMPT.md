# Kinetic Experience v1: Execution Prompt

**Sprint:** kinetic-experience-v1
**Handoff Date:** December 28, 2025
**Execution Environment:** Claude Code CLI

---

## Mission

Create a new exploration surface at `/explore` that implements the Kinetic Stream vision. This is a **fresh implementation** — do NOT modify Terminal components.

**The One-Liner:** Build the exploration surface that Terminal was trying to become.

---

## Critical Rule: No Terminal Imports

⚠️ **BEFORE EVERY FILE SAVE**, verify:

```bash
grep -r "from.*components/Terminal" src/surface/components/KineticStream/
```

This command MUST return empty. Any import from `components/Terminal/` is a sprint violation.

**Allowed imports:**
- `src/core/schema/*` — StreamItem types, journey types
- `src/core/transformers/*` — NavigationParser, RhetoricalParser
- `src/core/engagement/*` — Machine, hooks
- `services/*` — chatService
- `styles/globals.css` — Via Tailwind/CSS

**Forbidden imports:**
- `components/Terminal/*` — Anything under this path
- `components/Terminal.tsx` — The monolith

---

## Pre-Execution Setup

### 1. Verify Codebase State

```bash
cd C:\GitHub\the-grove-foundation

# Check existing structure
ls src/surface/components/

# Verify core transformers exist
ls src/core/transformers/
# Expected: NavigationParser.ts, RhetoricalParser.ts

# Verify schema exists
ls src/core/schema/
# Expected: stream.ts with StreamItem types
```

### 2. Read Reference Files

Before coding, read these files to understand existing patterns:

```bash
# Stream types (canonical)
cat src/core/schema/stream.ts

# Navigation parser (reuse)
cat src/core/transformers/NavigationParser.ts

# Rhetoric parser (reuse)
cat src/core/transformers/RhetoricalParser.ts

# Existing Surface page pattern
cat src/surface/pages/SurfacePage.tsx
```

### 3. Understand the Engagement Machine

```bash
# Check engagement exports
cat src/core/engagement/index.ts

# Understand hooks
cat src/core/engagement/hooks.ts
```

---

## Epic 1: Foundation & Route

### Step 1.1: Create Directory Structure

```bash
mkdir -p src/surface/components/KineticStream/Stream/blocks
mkdir -p src/surface/components/KineticStream/Stream/motion
mkdir -p src/surface/components/KineticStream/CommandConsole
mkdir -p src/surface/components/KineticStream/ActiveRhetoric
mkdir -p src/surface/components/KineticStream/hooks
```

### Step 1.2: Create Index Files

Create `src/surface/components/KineticStream/index.ts`:

```typescript
// src/surface/components/KineticStream/index.ts
// Kinetic Stream - Exploration Surface
// Sprint: kinetic-experience-v1

export { ExploreShell } from './ExploreShell';
export { KineticRenderer } from './Stream/KineticRenderer';
export { CommandConsole } from './CommandConsole';
```

### Step 1.3: Create ExploreShell

Create `src/surface/components/KineticStream/ExploreShell.tsx`:

```typescript
// src/surface/components/KineticStream/ExploreShell.tsx
// Main container for the Kinetic exploration experience
// Sprint: kinetic-experience-v1

import React, { useCallback } from 'react';
import { KineticRenderer } from './Stream/KineticRenderer';
import { CommandConsole } from './CommandConsole';
import { useKineticStream } from './hooks/useKineticStream';
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

  const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
    // Create pivot context
    const pivotContext: PivotContext = {
      sourceResponseId: sourceId,
      sourceText: span.text,
      sourceContext: `User clicked on the concept "${span.text}" to explore it further.`
    };
    
    // Submit the concept as a new query with pivot context
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
    submit(query);
  }, [submit]);

  return (
    <div className="flex flex-col h-screen bg-[var(--glass-void)]">
      {/* Header area - minimal for now */}
      <header className="flex-none p-4 border-b border-[var(--glass-border)]">
        <h1 className="text-lg font-semibold text-[var(--glass-text-primary)]">
          Explore The Grove
        </h1>
      </header>

      {/* Stream area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto pb-32">
          <KineticRenderer
            items={items}
            currentItem={currentItem}
            onConceptClick={handleConceptClick}
            onForkSelect={handleForkSelect}
            onPromptSubmit={handleSubmit}
          />
        </div>
      </main>

      {/* Command console - fixed at bottom */}
      <CommandConsole
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Ask anything about The Grove..."
      />
    </div>
  );
};

export default ExploreShell;
```

### Step 1.4: Create useKineticStream Hook

Create `src/surface/components/KineticStream/hooks/useKineticStream.ts`:

```typescript
// src/surface/components/KineticStream/hooks/useKineticStream.ts
// Stream state management for Kinetic experience
// Sprint: kinetic-experience-v1

import { useState, useCallback, useRef } from 'react';
import type {
  StreamItem,
  QueryStreamItem,
  ResponseStreamItem,
  PivotContext
} from '@core/schema/stream';
import { parseNavigation } from '@core/transformers/NavigationParser';
import { parse as parseRhetoric } from '@core/transformers/RhetoricalParser';
import { sendMessageStream } from '../../../../services/chatService';

interface UseKineticStreamReturn {
  items: StreamItem[];
  currentItem: StreamItem | null;
  isLoading: boolean;
  submit: (query: string, pivot?: PivotContext) => Promise<void>;
  clear: () => void;
}

export function useKineticStream(): UseKineticStreamReturn {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [currentItem, setCurrentItem] = useState<StreamItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(async (query: string, pivot?: PivotContext) => {
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    // Create query item
    const queryItem: QueryStreamItem = {
      id: `query-${Date.now()}`,
      type: 'query',
      timestamp: Date.now(),
      content: query,
      role: 'user',
      createdBy: 'user',
      pivot
    };

    // Add query to items
    setItems(prev => [...prev, queryItem]);
    setIsLoading(true);

    // Create response item placeholder
    const responseId = `response-${Date.now()}`;
    const responseItem: ResponseStreamItem = {
      id: responseId,
      type: 'response',
      timestamp: Date.now(),
      content: '',
      isGenerating: true,
      role: 'assistant',
      createdBy: 'ai'
    };
    setCurrentItem(responseItem);

    try {
      // Build messages array for API
      const messages = items
        .filter(item => item.type === 'query' || item.type === 'response')
        .map(item => ({
          role: item.type === 'query' ? 'user' : 'model',
          text: 'content' in item ? item.content : ''
        }));
      
      // Add current query
      messages.push({ role: 'user', text: query });

      let fullContent = '';

      // Stream response
      await sendMessageStream(
        messages,
        (chunk: string) => {
          fullContent += chunk;
          setCurrentItem(prev => prev ? {
            ...prev,
            content: fullContent
          } as ResponseStreamItem : null);
        },
        {
          signal: abortRef.current?.signal,
          lensId: undefined, // TODO: Get from context
          pivotContext: pivot
        }
      );

      // Parse completed response
      const { forks, cleanContent } = parseNavigation(fullContent);
      const { spans } = parseRhetoric(cleanContent);

      // Finalize response
      const finalResponse: ResponseStreamItem = {
        id: responseId,
        type: 'response',
        timestamp: Date.now(),
        content: cleanContent,
        isGenerating: false,
        role: 'assistant',
        createdBy: 'ai',
        parsedSpans: spans.length > 0 ? spans : undefined,
        navigation: forks.length > 0 ? forks : undefined
      };

      setItems(prev => [...prev, finalResponse]);
      setCurrentItem(null);

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Stream error:', error);
        // Add error response
        const errorResponse: ResponseStreamItem = {
          id: responseId,
          type: 'response',
          timestamp: Date.now(),
          content: `Error: ${(error as Error).message}`,
          isGenerating: false,
          role: 'assistant',
          createdBy: 'ai'
        };
        setItems(prev => [...prev, errorResponse]);
        setCurrentItem(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  const clear = useCallback(() => {
    setItems([]);
    setCurrentItem(null);
    setIsLoading(false);
  }, []);

  return { items, currentItem, isLoading, submit, clear };
}
```

### Step 1.5: Create ExplorePage

Create `src/surface/pages/ExplorePage.tsx`:

```typescript
// src/surface/pages/ExplorePage.tsx
// Route handler for /explore
// Sprint: kinetic-experience-v1

import React from 'react';
import { ExploreShell } from '../components/KineticStream';

const ExplorePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--glass-void)]">
      <ExploreShell />
    </div>
  );
};

export default ExplorePage;
```

### Step 1.6: Add Route

Modify `src/router/index.tsx` to add the explore route:

```typescript
// Add import at top
import ExplorePage from '../surface/pages/ExplorePage';

// Add route in routes array
{
  path: '/explore',
  element: <ExplorePage />
}
```

### Step 1.7: Verify Epic 1

```bash
# Build
npm run build

# Check for Terminal imports
grep -r "from.*components/Terminal" src/surface/components/KineticStream/
# Expected: empty

# Start dev server
npm run dev

# In another terminal, check route
curl -I http://localhost:5173/explore
# Expected: 200 OK
```

---

## Epic 2: Stream Rendering

### Step 2.1: Create Motion Variants

Create `src/surface/components/KineticStream/Stream/motion/variants.ts`:

```typescript
// src/surface/components/KineticStream/Stream/motion/variants.ts
// Framer Motion variants for Kinetic Stream
// Sprint: kinetic-experience-v1

import { Variants } from 'framer-motion';

export const blockVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.2
    }
  }
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};
```

### Step 2.2: Create GlassContainer

Create `src/surface/components/KineticStream/Stream/motion/GlassContainer.tsx`:

```typescript
// src/surface/components/KineticStream/Stream/motion/GlassContainer.tsx
// Glass effect wrapper component
// Sprint: kinetic-experience-v1

import React from 'react';
import { motion } from 'framer-motion';
import { blockVariants } from './variants';

export interface GlassContainerProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'elevated';
  variant?: 'default' | 'user' | 'assistant' | 'error';
  className?: string;
}

const intensityClasses = {
  subtle: 'bg-[var(--glass-surface)]/50',
  medium: 'bg-[var(--glass-surface)]/85',
  elevated: 'bg-[var(--glass-elevated)]'
};

const variantClasses = {
  default: 'border-[var(--glass-border)]',
  user: 'border-[var(--neon-cyan)]/30',
  assistant: 'border-[var(--neon-green)]/30',
  error: 'border-red-500/30'
};

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  intensity = 'medium',
  variant = 'default',
  className = ''
}) => {
  return (
    <motion.div
      variants={blockVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`
        ${intensityClasses[intensity]}
        ${variantClasses[variant]}
        border rounded-xl
        backdrop-blur-sm
        shadow-lg
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default GlassContainer;
```

### Step 2.3: Create KineticRenderer

Create `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`:

```typescript
// src/surface/components/KineticStream/Stream/KineticRenderer.tsx
// Polymorphic renderer for StreamItems
// Sprint: kinetic-experience-v1

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { StreamItem, RhetoricalSpan, JourneyFork } from '@core/schema/stream';
import { QueryObject } from './blocks/QueryObject';
import { ResponseObject } from './blocks/ResponseObject';
import { NavigationObject } from './blocks/NavigationObject';
import { SystemObject } from './blocks/SystemObject';
import { blockVariants, reducedMotionVariants } from './motion/variants';

export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}

export const KineticRenderer: React.FC<KineticRendererProps> = ({
  items,
  currentItem,
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedMotionVariants : blockVariants;
  const allItems = currentItem ? [...items, currentItem] : items;

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
    </div>
  );
};

interface KineticBlockProps {
  item: StreamItem;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}

const KineticBlock: React.FC<KineticBlockProps> = ({
  item,
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
  switch (item.type) {
    case 'query':
      return <QueryObject item={item} />;
    case 'response':
      return (
        <ResponseObject
          item={item}
          onConceptClick={onConceptClick ? (span) => onConceptClick(span, item.id) : undefined}
          onForkSelect={onForkSelect}
          onPromptSubmit={onPromptSubmit}
        />
      );
    case 'navigation':
      return <NavigationObject forks={item.forks} onSelect={onForkSelect} />;
    case 'system':
      return <SystemObject item={item} />;
    default:
      return null;
  }
};

export default KineticRenderer;
```

### Step 2.4: Create Block Components

Create `src/surface/components/KineticStream/Stream/blocks/QueryObject.tsx`:

```typescript
// src/surface/components/KineticStream/Stream/blocks/QueryObject.tsx
// User query display
// Sprint: kinetic-experience-v1

import React from 'react';
import type { QueryStreamItem } from '@core/schema/stream';

export interface QueryObjectProps {
  item: QueryStreamItem;
}

export const QueryObject: React.FC<QueryObjectProps> = ({ item }) => {
  return (
    <div className="flex justify-end" data-testid="query-object">
      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-[var(--glass-elevated)] border border-[var(--neon-cyan)]/20">
        {item.pivot && (
          <div className="text-xs text-[var(--neon-cyan)] mb-1 flex items-center gap-1">
            <span>→</span>
            <span>Exploring concept</span>
          </div>
        )}
        <p className="text-[var(--glass-text-primary)]">{item.content}</p>
      </div>
    </div>
  );
};

export default QueryObject;
```

Create `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`:

```typescript
// src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx
// AI response display with glass, concepts, and forks
// Sprint: kinetic-experience-v1

import React from 'react';
import type { ResponseStreamItem, RhetoricalSpan, JourneyFork } from '@core/schema/stream';
import { hasSpans, hasNavigation } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';
import { RhetoricRenderer } from '../../ActiveRhetoric/RhetoricRenderer';
import { NavigationObject } from './NavigationObject';

export interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}

export const ResponseObject: React.FC<ResponseObjectProps> = ({
  item,
  onConceptClick,
  onForkSelect,
  onPromptSubmit
}) => {
  const isError = item.content.startsWith('Error:');

  return (
    <div className="flex flex-col items-start" data-testid="response-object">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-[var(--neon-green)]">The Grove</span>
        {item.isGenerating && (
          <span className="w-2 h-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
        )}
      </div>

      <GlassContainer
        intensity="medium"
        variant={isError ? 'error' : 'assistant'}
        className="w-full max-w-[90%] px-5 py-4"
      >
        {item.isGenerating && !item.content ? (
          <LoadingIndicator />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            {hasSpans(item) ? (
              <RhetoricRenderer
                content={item.content}
                spans={item.parsedSpans}
                onSpanClick={onConceptClick}
              />
            ) : (
              <div 
                className="text-[var(--glass-text-body)] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(item.content) }}
              />
            )}
          </div>
        )}
      </GlassContainer>

      {hasNavigation(item) && !item.isGenerating && (
        <div className="mt-4 w-full max-w-[90%]">
          <NavigationObject forks={item.navigation!} onSelect={onForkSelect} />
        </div>
      )}
    </div>
  );
};

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-[var(--glass-text-subtle)]">
    <div className="flex gap-1">
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm">Thinking...</span>
  </div>
);

// Simple markdown formatting (bold only for now)
function formatMarkdown(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--grove-clay)]">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br />');
}

export default ResponseObject;
```

Create `src/surface/components/KineticStream/Stream/blocks/NavigationObject.tsx`:

```typescript
// src/surface/components/KineticStream/Stream/blocks/NavigationObject.tsx
// Fork button display
// Sprint: kinetic-experience-v1

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { JourneyFork, JourneyForkType } from '@core/schema/stream';
import { staggerContainer, staggerItem } from '../motion/variants';

export interface NavigationObjectProps {
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}

const FORK_ICONS: Record<JourneyForkType, string> = {
  deep_dive: '↓',
  pivot: '→',
  apply: '✓',
  challenge: '?'
};

const FORK_STYLES: Record<JourneyForkType, string> = {
  deep_dive: 'kinetic-fork--primary',
  pivot: 'kinetic-fork--secondary',
  apply: 'kinetic-fork--tertiary',
  challenge: 'kinetic-fork--quaternary'
};

export const NavigationObject: React.FC<NavigationObjectProps> = ({
  forks,
  onSelect
}) => {
  const grouped = useMemo(() => ({
    deep_dive: forks.filter(f => f.type === 'deep_dive'),
    pivot: forks.filter(f => f.type === 'pivot'),
    apply: forks.filter(f => f.type === 'apply'),
    challenge: forks.filter(f => f.type === 'challenge')
  }), [forks]);

  if (forks.length === 0) return null;

  return (
    <motion.div
      className="pt-4 border-t border-[var(--glass-border)] space-y-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      data-testid="navigation-object"
    >
      {grouped.deep_dive.length > 0 && (
        <ForkGroup forks={grouped.deep_dive} onSelect={onSelect} />
      )}
      {grouped.pivot.length > 0 && (
        <ForkGroup forks={grouped.pivot} onSelect={onSelect} />
      )}
      {grouped.apply.length > 0 && (
        <ForkGroup forks={grouped.apply} onSelect={onSelect} />
      )}
      {grouped.challenge.length > 0 && (
        <ForkGroup forks={grouped.challenge} onSelect={onSelect} />
      )}
    </motion.div>
  );
};

const ForkGroup: React.FC<{
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}> = ({ forks, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {forks.map(fork => (
      <motion.button
        key={fork.id}
        variants={staggerItem}
        onClick={() => onSelect?.(fork)}
        className={`kinetic-fork ${FORK_STYLES[fork.type]}`}
        data-testid="fork-button"
      >
        <span>{FORK_ICONS[fork.type]}</span>
        <span>{fork.label}</span>
      </motion.button>
    ))}
  </div>
);

export default NavigationObject;
```

Create `src/surface/components/KineticStream/Stream/blocks/SystemObject.tsx`:

```typescript
// src/surface/components/KineticStream/Stream/blocks/SystemObject.tsx
// System message display
// Sprint: kinetic-experience-v1

import React from 'react';
import type { SystemStreamItem } from '@core/schema/stream';

export interface SystemObjectProps {
  item: SystemStreamItem;
}

export const SystemObject: React.FC<SystemObjectProps> = ({ item }) => {
  return (
    <div 
      className="text-center py-2 text-sm text-[var(--glass-text-subtle)]"
      data-testid="system-object"
    >
      {item.content}
    </div>
  );
};

export default SystemObject;
```

### Step 2.5: Create CommandConsole

Create `src/surface/components/KineticStream/CommandConsole/index.tsx`:

```typescript
// src/surface/components/KineticStream/CommandConsole/index.tsx
// Floating input console
// Sprint: kinetic-experience-v1

import React, { useState, useCallback, KeyboardEvent } from 'react';

export interface CommandConsoleProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onSubmit,
  isLoading,
  placeholder = 'Ask anything...'
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSubmit(trimmed);
      setValue('');
    }
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="kinetic-console">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="kinetic-console-input pr-12"
          data-testid="command-input"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !value.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full 
                     bg-[var(--neon-green)] text-white
                     hover:bg-[var(--neon-green)]/80 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
          data-testid="submit-button"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommandConsole;
```

### Step 2.6: Add CSS Tokens

Add to `styles/globals.css` (at the end, before closing):

```css
/* ============================================================================
   Kinetic Stream Tokens
   Sprint: kinetic-experience-v1
   ============================================================================ */

/* Fork Buttons */
.kinetic-fork {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  outline: none;
}

.kinetic-fork:hover {
  transform: scale(1.05);
}

.kinetic-fork:active {
  transform: scale(0.95);
}

.kinetic-fork--primary {
  background: linear-gradient(135deg, var(--grove-clay, #d97706), var(--grove-terracotta, #c2410c));
  color: white;
  box-shadow: 0 0 12px rgba(217, 119, 6, 0.3);
}

.kinetic-fork--secondary {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  color: var(--glass-text-body);
}

.kinetic-fork--tertiary {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--glass-text-subtle);
}

.kinetic-fork--quaternary {
  background: transparent;
  color: var(--glass-text-subtle);
  font-style: italic;
}

/* Concept Spans (Active Rhetoric) */
.kinetic-concept {
  color: var(--grove-clay, #d97706);
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: all 0.15s ease;
}

.kinetic-concept:hover {
  border-bottom-color: var(--grove-clay, #d97706);
  text-shadow: 0 0 8px rgba(217, 119, 6, 0.3);
}

/* Command Console */
.kinetic-console {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(90vw, 48rem);
  z-index: 50;
}

.kinetic-console-input {
  width: 100%;
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 1.5rem;
  padding: 1rem 1.5rem;
  color: var(--glass-text-primary);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.kinetic-console-input:focus {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
}

.kinetic-console-input::placeholder {
  color: var(--glass-text-subtle);
}

.kinetic-console-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Step 2.7: Verify Epic 2

```bash
# Build
npm run build

# Check for Terminal imports
grep -r "from.*components/Terminal" src/surface/components/KineticStream/
# Expected: empty

# Run dev server and test manually
npm run dev
# Navigate to http://localhost:5173/explore
# Submit a query, verify response renders with glass styling
```

---

## Epic 3: Active Rhetoric

### Step 3.1: Create ConceptSpan

Create `src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx`:

```typescript
// src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx
// Clickable concept highlight
// Sprint: kinetic-experience-v1

import React from 'react';
import type { RhetoricalSpan } from '@core/schema/stream';

export interface ConceptSpanProps {
  span: RhetoricalSpan;
  onClick?: (span: RhetoricalSpan) => void;
}

export const ConceptSpan: React.FC<ConceptSpanProps> = ({ span, onClick }) => {
  return (
    <span
      className="kinetic-concept"
      onClick={() => onClick?.(span)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(span);
        }
      }}
      data-testid="concept-span"
    >
      {span.text}
    </span>
  );
};

export default ConceptSpan;
```

### Step 3.2: Create RhetoricRenderer

Create `src/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer.tsx`:

```typescript
// src/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer.tsx
// Renders content with concept spans injected
// Sprint: kinetic-experience-v1

import React, { useMemo } from 'react';
import type { RhetoricalSpan } from '@core/schema/stream';
import { ConceptSpan } from './ConceptSpan';

export interface RhetoricRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}

interface ContentSegment {
  type: 'text' | 'span';
  content: string;
  span?: RhetoricalSpan;
}

export const RhetoricRenderer: React.FC<RhetoricRendererProps> = ({
  content,
  spans,
  onSpanClick
}) => {
  const segments = useMemo(() => {
    if (!spans || spans.length === 0) {
      return [{ type: 'text' as const, content }];
    }

    // Sort spans by start index
    const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
    const result: ContentSegment[] = [];
    let lastIndex = 0;

    for (const span of sortedSpans) {
      // Add text before this span
      if (span.startIndex > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, span.startIndex)
        });
      }

      // Add the span
      result.push({
        type: 'span',
        content: span.text,
        span
      });

      lastIndex = span.endIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return result;
  }, [content, spans]);

  return (
    <div className="text-[var(--glass-text-body)] leading-relaxed">
      {segments.map((segment, index) => {
        if (segment.type === 'span' && segment.span) {
          return (
            <ConceptSpan
              key={`span-${index}`}
              span={segment.span}
              onClick={onSpanClick}
            />
          );
        }
        // Render text with basic formatting
        return (
          <span 
            key={`text-${index}`}
            dangerouslySetInnerHTML={{ 
              __html: formatText(segment.content) 
            }}
          />
        );
      })}
    </div>
  );
};

function formatText(text: string): string {
  return text
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br />');
}

export default RhetoricRenderer;
```

### Step 3.3: Create Index Exports

Create `src/surface/components/KineticStream/ActiveRhetoric/index.ts`:

```typescript
export { ConceptSpan } from './ConceptSpan';
export { RhetoricRenderer } from './RhetoricRenderer';
```

Create `src/surface/components/KineticStream/Stream/blocks/index.ts`:

```typescript
export { QueryObject } from './QueryObject';
export { ResponseObject } from './ResponseObject';
export { NavigationObject } from './NavigationObject';
export { SystemObject } from './SystemObject';
```

Create `src/surface/components/KineticStream/Stream/motion/index.ts`:

```typescript
export { GlassContainer } from './GlassContainer';
export { blockVariants, staggerContainer, staggerItem, reducedMotionVariants } from './variants';
```

Create `src/surface/components/KineticStream/Stream/index.ts`:

```typescript
export { KineticRenderer } from './KineticRenderer';
export * from './blocks';
export * from './motion';
```

Create `src/surface/components/KineticStream/hooks/index.ts`:

```typescript
export { useKineticStream } from './useKineticStream';
```

### Step 3.4: Final Verification

```bash
# Full build
npm run build

# Check for Terminal imports (CRITICAL)
grep -r "from.*components/Terminal" src/surface/components/KineticStream/
# MUST return empty

# Type check
npx tsc --noEmit

# Run dev and test manually
npm run dev

# Test flow:
# 1. Go to http://localhost:5173/explore
# 2. Submit "What is the Grove?"
# 3. Verify glass-styled response appears
# 4. Look for orange concepts (if LLM uses bold)
# 5. Click a concept to pivot
# 6. Verify new query appears with pivot indicator
```

---

## Post-Execution Checklist

- [ ] All files created in `src/surface/components/KineticStream/`
- [ ] Route `/explore` works
- [ ] Chat flow functions end-to-end
- [ ] Glass styling applies correctly
- [ ] Concepts highlight in orange (when parsed)
- [ ] Concept clicks trigger pivot
- [ ] Fork buttons render (when navigation present)
- [ ] Fork clicks submit queries
- [ ] **NO IMPORTS FROM `components/Terminal/`**
- [ ] Build passes
- [ ] No TypeScript errors

---

## Troubleshooting

### "Module not found" errors

Check import paths. Should use:
- `@core/schema/stream` (not relative paths to core)
- `../../../../services/chatService` (relative to hooks)

### Styles not applying

Verify CSS tokens added to `globals.css` and file is imported in app.

### Navigation forks not appearing

The LLM must output `<navigation>` blocks. Check:
1. System prompt includes navigation instructions
2. `parseNavigation` returns forks
3. `hasNavigation(item)` returns true

### Concepts not highlighting

The LLM must use `**bold**` syntax. Check:
1. `parseRhetoric` returns spans
2. `hasSpans(item)` returns true
3. RhetoricRenderer receives spans

---

*Execution prompt complete. Begin implementation with Epic 1, Step 1.1.*
