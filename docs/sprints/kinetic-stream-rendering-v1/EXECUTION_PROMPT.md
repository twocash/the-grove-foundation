# Execution Prompt: kinetic-stream-rendering-v1

**Self-contained handoff for execution agent.**

---

## Quick Start

```bash
cd C:\GitHub\the-grove-foundation
git checkout kinetic-stream-feature
npm install
npm run dev  # Verify dev server starts
```

---

## Context

You are implementing the **polymorphic StreamRenderer** for Kinetic Stream. This sprint builds rendering components that consume typed `StreamItem` objects from Sprint 1's schema.

**Key Principle:** Rendering is declarative. Components read structured data (StreamItem with parsedSpans) and render accordingly. No parsing during render.

---

## Pre-Flight Check

Before starting, verify Sprint 1 artifacts exist:

```bash
# Check schema exists
cat src/core/schema/stream.ts
# Should export: StreamItem, RhetoricalSpan, StreamItemType, etc.

# Check parser exists
cat src/core/transformers/RhetoricalParser.ts
# Should export: parse(), parseByType(), hasRhetoricalContent()

# Check machine has stream context
grep -n "streamHistory" src/core/engagement/machine.ts
# Should find streamHistory in context
```

If Sprint 1 is not complete, you can stub the types temporarily.

---

## File Structure to Create

```
components/Terminal/
├── MarkdownRenderer.tsx      [NEW - extract from TerminalChat]
├── TerminalChat.tsx          [MODIFY]
└── Stream/                   [NEW DIRECTORY]
    ├── index.ts
    ├── StreamRenderer.tsx
    ├── SpanRenderer.tsx
    └── blocks/
        ├── QueryBlock.tsx
        ├── ResponseBlock.tsx
        ├── NavigationBlock.tsx
        └── SystemBlock.tsx

src/app/
└── globals.css               [MODIFY - add tokens]

tests/
├── unit/
│   ├── SpanRenderer.test.tsx     [NEW]
│   └── StreamRenderer.test.tsx   [NEW]
└── e2e/
    └── stream-rendering-baseline.spec.ts [NEW]
```

---

## Implementation Code

### 1. Barrel Export (components/Terminal/Stream/index.ts)

```typescript
// Stream module exports
export { StreamRenderer } from './StreamRenderer';
export type { StreamRendererProps } from './StreamRenderer';
export { SpanRenderer } from './SpanRenderer';
export type { SpanRendererProps } from './SpanRenderer';
export { QueryBlock } from './blocks/QueryBlock';
export { ResponseBlock } from './blocks/ResponseBlock';
export { NavigationBlock } from './blocks/NavigationBlock';
export { SystemBlock } from './blocks/SystemBlock';
```

### 2. SpanRenderer (components/Terminal/Stream/SpanRenderer.tsx)

```typescript
import React, { useMemo } from 'react';
import { RhetoricalSpan, RhetoricalSpanType } from '@/core/schema/stream';

export interface SpanRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}

const SPAN_STYLES: Record<RhetoricalSpanType, string> = {
  concept: 'text-[var(--chat-concept-text)] font-bold hover:bg-[var(--chat-concept-bg-hover)] cursor-pointer transition-colors rounded px-0.5 active:scale-[0.98]',
  action: 'text-[var(--chat-action-text)] font-medium hover:underline cursor-pointer active:scale-[0.98]',
  entity: 'text-[var(--chat-entity-text)] italic'
};

export const SpanRenderer: React.FC<SpanRendererProps> = ({
  content,
  spans,
  onSpanClick
}) => {
  const elements = useMemo(() => {
    if (!spans || spans.length === 0) {
      return [<span key="content">{content}</span>];
    }

    const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSpans.forEach((span) => {
      const start = Math.max(0, Math.min(span.startIndex, content.length));
      const end = Math.max(start, Math.min(span.endIndex, content.length));

      if (start > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, start)}</span>
        );
      }

      const displayText = content.slice(start, end);
      const style = SPAN_STYLES[span.type] || '';

      if (span.type === 'entity') {
        result.push(
          <span key={span.id} className={style}>{displayText}</span>
        );
      } else {
        result.push(
          <button
            key={span.id}
            onClick={() => onSpanClick?.(span)}
            className={style}
            aria-label={`Explore ${span.text}`}
            data-testid={`span-${span.type}`}
          >
            {displayText}
          </button>
        );
      }

      lastIndex = end;
    });

    if (lastIndex < content.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>
      );
    }

    return result;
  }, [content, spans, onSpanClick]);

  return <span className="whitespace-pre-wrap">{elements}</span>;
};

export default SpanRenderer;
```

### 3. QueryBlock (components/Terminal/Stream/blocks/QueryBlock.tsx)

```typescript
import React from 'react';
import { StreamItem } from '@/core/schema/stream';

export interface QueryBlockProps {
  item: StreamItem;
}

export const QueryBlock: React.FC<QueryBlockProps> = ({ item }) => {
  const displayContent = item.content.replace(' --verbose', '');

  return (
    <div className="flex flex-col items-end" data-testid="query-block">
      <div className="flex items-center gap-2 mb-1.5 justify-end">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          You
        </span>
      </div>
      <div className="max-w-[85%] md:max-w-[70%]">
        <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
          <p className="text-sm md:text-base leading-relaxed">{displayContent}</p>
        </div>
      </div>
    </div>
  );
};

export default QueryBlock;
```

### 4. ResponseBlock (components/Terminal/Stream/blocks/ResponseBlock.tsx)

```typescript
import React from 'react';
import { StreamItem, hasSpans, hasPaths, RhetoricalSpan } from '@/core/schema/stream';
import { SpanRenderer } from '../SpanRenderer';
import { MarkdownRenderer } from '../../MarkdownRenderer';
import LoadingIndicator from '../../LoadingIndicator';
import SuggestionChip from '../../SuggestionChip';

export interface ResponseBlockProps {
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

export const ResponseBlock: React.FC<ResponseBlockProps> = ({
  item,
  onSpanClick,
  onPromptSubmit,
  loadingMessages
}) => {
  const isError = item.content.startsWith('SYSTEM ERROR') || 
                  item.content.startsWith('Error:');

  return (
    <div className="flex flex-col items-start" data-testid="response-block">
      <div className="flex items-center gap-2 mb-1.5 justify-start">
        <span className="text-xs font-semibold text-primary">The Grove</span>
      </div>
      
      <div className="max-w-[90%] md:max-w-[85%]">
        <div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
          isError
            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
        }`}>
          {item.isGenerating && !item.content ? (
            <LoadingIndicator messages={loadingMessages} />
          ) : (
            <div className="font-serif text-sm leading-relaxed">
              {hasSpans(item) ? (
                <SpanRenderer
                  content={item.content}
                  spans={item.parsedSpans!}
                  onSpanClick={onSpanClick}
                />
              ) : (
                <MarkdownRenderer 
                  content={item.content} 
                  onPromptClick={onPromptSubmit}
                />
              )}
              {item.isGenerating && (
                <span className="inline-block w-1.5 h-3 ml-1 bg-slate-500 dark:bg-slate-400 cursor-blink align-middle" />
              )}
            </div>
          )}
        </div>
      </div>

      {hasPaths(item) && !item.isGenerating && (
        <div className="mt-3 space-y-1.5">
          {item.suggestedPaths!.map((path) => (
            <SuggestionChip
              key={path.id}
              prompt={path.title}
              onClick={() => onPromptSubmit?.(path.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponseBlock;
```

### 5. NavigationBlock (components/Terminal/Stream/blocks/NavigationBlock.tsx)

```typescript
import React from 'react';
import { StreamItem, hasPaths } from '@/core/schema/stream';
import { JourneyPath } from '@/data/narratives-schema';
import SuggestionChip from '../../SuggestionChip';

export interface NavigationBlockProps {
  item: StreamItem;
  onPathClick?: (path: JourneyPath) => void;
}

export const NavigationBlock: React.FC<NavigationBlockProps> = ({
  item,
  onPathClick
}) => {
  if (!hasPaths(item)) return null;

  return (
    <div className="flex flex-col items-start" data-testid="navigation-block">
      <div className="text-xs font-semibold text-primary mb-2">
        Continue your exploration:
      </div>
      <div className="space-y-1.5">
        {item.suggestedPaths!.map((path) => (
          <SuggestionChip
            key={path.id}
            prompt={path.title}
            onClick={() => onPathClick?.(path)}
          />
        ))}
      </div>
    </div>
  );
};

export default NavigationBlock;
```

### 6. SystemBlock (components/Terminal/Stream/blocks/SystemBlock.tsx)

```typescript
import React from 'react';
import { StreamItem } from '@/core/schema/stream';

export interface SystemBlockProps {
  item: StreamItem;
}

export const SystemBlock: React.FC<SystemBlockProps> = ({ item }) => {
  const isError = item.content.startsWith('Error:') || 
                  item.content.startsWith('SYSTEM ERROR');

  return (
    <div className="flex justify-center" data-testid="system-block">
      <div className={`text-xs px-3 py-1.5 rounded-full ${
        isError 
          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}>
        {item.content}
      </div>
    </div>
  );
};

export default SystemBlock;
```

### 7. StreamRenderer (components/Terminal/Stream/StreamRenderer.tsx)

```typescript
import React from 'react';
import { StreamItem, RhetoricalSpan } from '@/core/schema/stream';
import { JourneyPath } from '@/data/narratives-schema';
import { QueryBlock } from './blocks/QueryBlock';
import { ResponseBlock } from './blocks/ResponseBlock';
import { NavigationBlock } from './blocks/NavigationBlock';
import { SystemBlock } from './blocks/SystemBlock';
import CognitiveBridge from '../CognitiveBridge';
import { BridgeState } from '../types';

export interface StreamRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
  bridgeState?: BridgeState;
  onBridgeAccept?: () => void;
  onBridgeDismiss?: () => void;
  loadingMessages?: string[];
}

export const StreamRenderer: React.FC<StreamRendererProps> = ({
  items,
  currentItem,
  onSpanClick,
  onPathClick,
  onPromptSubmit,
  bridgeState,
  onBridgeAccept,
  onBridgeDismiss,
  loadingMessages
}) => {
  const allItems = currentItem ? [...items, currentItem] : items;

  return (
    <div className="space-y-6" data-testid="stream-renderer">
      {allItems.map((item) => (
        <React.Fragment key={item.id}>
          <StreamBlock
            item={item}
            onSpanClick={onSpanClick}
            onPathClick={onPathClick}
            onPromptSubmit={onPromptSubmit}
            loadingMessages={loadingMessages}
          />
          {bridgeState?.visible && 
           bridgeState.afterMessageId === item.id &&
           bridgeState.journeyId &&
           bridgeState.topicMatch && (
            <CognitiveBridge
              journeyId={bridgeState.journeyId}
              topicMatch={bridgeState.topicMatch}
              onAccept={onBridgeAccept!}
              onDismiss={onBridgeDismiss!}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface StreamBlockProps {
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

const StreamBlock: React.FC<StreamBlockProps> = ({
  item,
  onSpanClick,
  onPathClick,
  onPromptSubmit,
  loadingMessages
}) => {
  switch (item.type) {
    case 'query':
      return <QueryBlock item={item} />;
    case 'response':
      return (
        <ResponseBlock 
          item={item} 
          onSpanClick={onSpanClick}
          onPromptSubmit={onPromptSubmit}
          loadingMessages={loadingMessages}
        />
      );
    case 'navigation':
      return <NavigationBlock item={item} onPathClick={onPathClick} />;
    case 'system':
      return <SystemBlock item={item} />;
    default:
      console.warn(`Unknown stream item type: ${(item as StreamItem).type}`);
      return null;
  }
};

export default StreamRenderer;
```

### 8. Token Additions (src/app/globals.css)

Add after existing chat tokens:

```css
:root {
  /* ─── Chat Span Tokens (kinetic-stream-rendering-v1) ─── */
  --chat-concept-text: theme('colors.grove.clay');
  --chat-concept-bg: transparent;
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.1);
  --chat-action-text: theme('colors.primary');
  --chat-action-bg: transparent;
  --chat-entity-text: theme('colors.slate.600');
}

.dark {
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.2);
  --chat-entity-text: theme('colors.slate.300');
}
```

---

## Integration with TerminalChat

Modify `components/Terminal/TerminalChat.tsx`:

```typescript
// Add imports
import { StreamRenderer } from './Stream';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useEngagement } from '@/core/engagement/hooks';
import { RhetoricalSpan } from '@/core/schema/stream';

// In component body
const { streamHistory, currentStreamItem } = useEngagement();
const useStreamRenderer = streamHistory.length > 0 || currentStreamItem !== null;

// Add handlers
const handleSpanClick = useCallback((span: RhetoricalSpan) => {
  if (span.type === 'concept') {
    onPromptClick?.(`Tell me more about ${span.text}`);
  }
}, [onPromptClick]);

// In render, replace message mapping with:
{useStreamRenderer ? (
  <StreamRenderer
    items={streamHistory}
    currentItem={currentStreamItem}
    onSpanClick={handleSpanClick}
    onPromptSubmit={onPromptClick}
    bridgeState={bridgeState}
    onBridgeAccept={onBridgeAccept}
    onBridgeDismiss={onBridgeDismiss}
    loadingMessages={loadingMessages}
  />
) : (
  // Existing message rendering...
)}
```

---

## Verification Commands

After each epic:

```bash
# Type check
npm run typecheck

# Build
npm run build

# Unit tests
npm test

# E2E tests
npx playwright test

# Visual regression
npx playwright test tests/e2e/terminal-baseline.spec.ts
```

---

## Troubleshooting

### "Cannot find module '@/core/schema/stream'"

Sprint 1 types not yet created. Create stub:

```typescript
// src/core/schema/stream.ts (stub)
export type StreamItemType = 'query' | 'response' | 'navigation' | 'reveal' | 'system';
export type RhetoricalSpanType = 'concept' | 'action' | 'entity';

export interface RhetoricalSpan {
  id: string;
  text: string;
  type: RhetoricalSpanType;
  startIndex: number;
  endIndex: number;
  conceptId?: string;
  confidence?: number;
}

export interface StreamItem {
  id: string;
  type: StreamItemType;
  timestamp: number;
  content: string;
  parsedSpans?: RhetoricalSpan[];
  suggestedPaths?: JourneyPath[];
  isGenerating?: boolean;
  createdBy?: 'user' | 'system' | 'ai';
  role?: 'user' | 'assistant';
}

export function hasSpans(item: StreamItem): item is StreamItem & { parsedSpans: RhetoricalSpan[] } {
  return Array.isArray(item.parsedSpans) && item.parsedSpans.length > 0;
}

export function hasPaths(item: StreamItem): boolean {
  return Array.isArray(item.suggestedPaths) && item.suggestedPaths.length > 0;
}
```

### "streamHistory is undefined"

Engagement context not updated. Add stub to context:

```typescript
// In useEngagement hook or context
streamHistory: [] as StreamItem[],
currentStreamItem: null as StreamItem | null,
```

### Visual regression fails

If intentional changes, update baselines:

```bash
npx playwright test tests/e2e/terminal-baseline.spec.ts --update-snapshots
git add tests/e2e/*-snapshots/
```

---

## Completion Checklist

- [ ] Epic 1: Component Structure
  - [ ] Directory created
  - [ ] Barrel export created
  - [ ] MarkdownRenderer extracted
- [ ] Epic 2: Token Extensions
  - [ ] Tokens added to globals.css
- [ ] Epic 3: SpanRenderer
  - [ ] SpanRenderer implemented
  - [ ] SpanElement implemented
- [ ] Epic 4: Block Components
  - [ ] QueryBlock
  - [ ] ResponseBlock
  - [ ] NavigationBlock
  - [ ] SystemBlock
- [ ] Epic 5: StreamRenderer
  - [ ] Polymorphic dispatch
  - [ ] Cognitive Bridge injection
- [ ] Epic 6: Integration
  - [ ] TerminalChat modified
  - [ ] Click handlers implemented
- [ ] Epic 7: Testing
  - [ ] SpanRenderer tests
  - [ ] StreamRenderer tests
  - [ ] Visual baselines

**All gates passed:**
- [ ] `npm run build` ✅
- [ ] `npm test` ✅
- [ ] `npx playwright test` ✅

---

*Execution prompt complete. Proceed to implementation.*
