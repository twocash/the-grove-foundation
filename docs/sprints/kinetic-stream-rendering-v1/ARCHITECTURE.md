# Architecture: kinetic-stream-rendering-v1

**Target State:** Polymorphic StreamRenderer with declarative block components

---

## 1. Architectural Vision

### 1.1 Current State (Before)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT RENDERING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TerminalChat.tsx                                               │
│       ↓                                                          │
│  messages.map(msg => ...)                                       │
│       ├── if (msg.role === 'user') → User bubble               │
│       └── else → Assistant bubble                               │
│                    ↓                                             │
│               MarkdownRenderer                                   │
│                    ├── parseInline() during render              │
│                    ├── Regex for **bold**                       │
│                    └── Create React nodes inline                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- No type discrimination (just user/assistant)
- Parsing happens during render (side effects)
- Inline handlers (non-declarative)
- Tight coupling to ChatMessage structure

### 1.2 Target State (After)

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET RENDERING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TerminalChat.tsx (unchanged API)                               │
│       ↓                                                          │
│  Conditional: streamHistory exists?                              │
│       ├── YES → StreamRenderer                                  │
│       └── NO  → Legacy MarkdownRenderer                         │
│                                                                  │
│  StreamRenderer                                                  │
│       ↓                                                          │
│  items.map(item => dispatch(item.type))                         │
│       ↓                                                          │
│  switch(item.type)                                              │
│       ├── 'query'      → QueryBlock                             │
│       ├── 'response'   → ResponseBlock                          │
│       │                      ↓                                   │
│       │                 SpanRenderer                             │
│       │                      ├── Split by indices               │
│       │                      ├── Wrap spans in <SpanElement>    │
│       │                      └── Declarative: data → UI         │
│       ├── 'navigation' → NavigationBlock                        │
│       └── 'system'     → SystemBlock                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Type-driven rendering (declarative)
- Pre-parsed spans (no render-time computation)
- Extensible via type union
- Clear separation of concerns

---

## 2. Component Architecture

### 2.1 Component Hierarchy

```
components/Terminal/
├── TerminalChat.tsx           [MODIFY] Integration point
├── MarkdownRenderer.tsx       [EXTRACT] Existing logic preserved
├── SuggestionChip.tsx         [REUSE] For path buttons
├── LoadingIndicator.tsx       [REUSE] For streaming state
├── CognitiveBridge.tsx        [REUSE] Journey suggestions
│
└── Stream/                    [NEW DIRECTORY]
    ├── index.ts               Barrel exports
    ├── StreamRenderer.tsx     Polymorphic dispatcher
    ├── blocks/
    │   ├── QueryBlock.tsx     User message
    │   ├── ResponseBlock.tsx  AI response with spans
    │   ├── NavigationBlock.tsx Path buttons
    │   └── SystemBlock.tsx    Status messages
    └── SpanRenderer.tsx       Inline span highlighting
```

### 2.2 Component Responsibilities

| Component | Single Responsibility |
|-----------|----------------------|
| `StreamRenderer` | Dispatch items to block components |
| `QueryBlock` | Render user message bubble |
| `ResponseBlock` | Render AI response with spans and paths |
| `NavigationBlock` | Render journey fork buttons |
| `SystemBlock` | Render status/error messages |
| `SpanRenderer` | Render content with highlighted spans |
| `SpanElement` | Render single interactive span |

---

## 3. Data Flow

### 3.1 Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     RENDERING PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. MACHINE CONTEXT                                             │
│     ┌─────────────────────────────────────────┐                 │
│     │ streamHistory: StreamItem[]             │                 │
│     │ currentStreamItem: StreamItem | null    │                 │
│     └─────────────────────────────────────────┘                 │
│                          ↓                                       │
│  2. TERMINAL CHAT INTEGRATION                                   │
│     ┌─────────────────────────────────────────┐                 │
│     │ const { streamHistory, currentItem } =  │                 │
│     │   useEngagementContext();               │                 │
│     │                                         │                 │
│     │ return streamHistory.length > 0         │                 │
│     │   ? <StreamRenderer items={...} />      │                 │
│     │   : <LegacyChat messages={...} />       │                 │
│     └─────────────────────────────────────────┘                 │
│                          ↓                                       │
│  3. STREAM RENDERER                                             │
│     ┌─────────────────────────────────────────┐                 │
│     │ items.map(item =>                       │                 │
│     │   renderBlock(item.type, item)          │                 │
│     │ )                                       │                 │
│     └─────────────────────────────────────────┘                 │
│                          ↓                                       │
│  4. BLOCK COMPONENTS                                            │
│     ┌─────────────────────────────────────────┐                 │
│     │ QueryBlock: item → User bubble          │                 │
│     │ ResponseBlock: item → AI bubble         │                 │
│     │   └─ SpanRenderer: spans → highlights   │                 │
│     │ NavigationBlock: paths → buttons        │                 │
│     └─────────────────────────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Span Rendering Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                 SPAN RENDERING ALGORITHM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input:                                                          │
│    content = "The **Grove** is distributed **AI**"              │
│    spans = [                                                     │
│      { text: "Grove", startIndex: 4, endIndex: 13 },            │
│      { text: "AI", startIndex: 30, endIndex: 36 }               │
│    ]                                                             │
│                                                                  │
│  Algorithm:                                                      │
│    1. Sort spans by startIndex                                  │
│    2. Initialize lastIndex = 0                                  │
│    3. For each span:                                            │
│       a. Push content[lastIndex..span.startIndex] as text      │
│       b. Push <SpanElement> for span                            │
│       c. lastIndex = span.endIndex                              │
│    4. Push remaining content[lastIndex..end] as text           │
│                                                                  │
│  Output:                                                         │
│    ["The ", <SpanElement>Grove</>, " is distributed ", <SpanElement>AI</>]    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 StreamRenderer

```typescript
// components/Terminal/Stream/StreamRenderer.tsx

import React from 'react';
import { StreamItem, hasSpans, hasPaths } from '@/core/schema/stream';
import { RhetoricalSpan } from '@/core/schema/stream';
import { JourneyPath } from '@/data/narratives-schema';
import { QueryBlock } from './blocks/QueryBlock';
import { ResponseBlock } from './blocks/ResponseBlock';
import { NavigationBlock } from './blocks/NavigationBlock';
import { SystemBlock } from './blocks/SystemBlock';

export interface StreamRendererProps {
  /** Completed stream items */
  items: StreamItem[];
  /** Currently generating item (in progress) */
  currentItem?: StreamItem | null;
  /** Handler for span clicks (concept exploration) */
  onSpanClick?: (span: RhetoricalSpan) => void;
  /** Handler for path clicks (journey navigation) */
  onPathClick?: (path: JourneyPath) => void;
  /** Handler for prompt submission (from suggestions) */
  onPromptSubmit?: (prompt: string) => void;
  /** Cognitive Bridge injection state */
  bridgeState?: BridgeState;
  /** Cognitive Bridge handlers */
  onBridgeAccept?: () => void;
  onBridgeDismiss?: () => void;
}

export const StreamRenderer: React.FC<StreamRendererProps> = ({
  items,
  currentItem,
  onSpanClick,
  onPathClick,
  onPromptSubmit,
  bridgeState,
  onBridgeAccept,
  onBridgeDismiss
}) => {
  // Combine completed items with current generating item
  const allItems = currentItem ? [...items, currentItem] : items;

  return (
    <div className="space-y-6" data-testid="stream-renderer">
      {allItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <StreamBlock
            item={item}
            onSpanClick={onSpanClick}
            onPathClick={onPathClick}
            onPromptSubmit={onPromptSubmit}
          />
          {/* Cognitive Bridge injection point */}
          {bridgeState?.visible && 
           bridgeState.afterMessageId === item.id && (
            <CognitiveBridge
              journeyId={bridgeState.journeyId!}
              topicMatch={bridgeState.topicMatch!}
              onAccept={onBridgeAccept!}
              onDismiss={onBridgeDismiss!}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Polymorphic dispatch
const StreamBlock: React.FC<{
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
}> = ({ item, onSpanClick, onPathClick, onPromptSubmit }) => {
  switch (item.type) {
    case 'query':
      return <QueryBlock item={item} />;
    case 'response':
      return (
        <ResponseBlock 
          item={item} 
          onSpanClick={onSpanClick}
          onPromptSubmit={onPromptSubmit}
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

### 4.2 QueryBlock

```typescript
// components/Terminal/Stream/blocks/QueryBlock.tsx

import React from 'react';
import { StreamItem } from '@/core/schema/stream';

export interface QueryBlockProps {
  item: StreamItem;
}

export const QueryBlock: React.FC<QueryBlockProps> = ({ item }) => {
  // Strip verbose flags from display
  const displayContent = item.content.replace(' --verbose', '');

  return (
    <div className="flex flex-col items-end">
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5 justify-end">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          You
        </span>
      </div>
      {/* Message bubble */}
      <div className="max-w-[85%] md:max-w-[70%]">
        <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
          <p className="text-sm md:text-base leading-relaxed">
            {displayContent}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QueryBlock;
```

### 4.3 ResponseBlock

```typescript
// components/Terminal/Stream/blocks/ResponseBlock.tsx

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
    <div className="flex flex-col items-start">
      {/* Label */}
      <div className="flex items-center gap-2 mb-1.5 justify-start">
        <span className="text-xs font-semibold text-primary">
          The Grove
        </span>
      </div>
      
      {/* Message bubble */}
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
              {/* Streaming cursor */}
              {item.isGenerating && (
                <span className="inline-block w-1.5 h-3 ml-1 bg-slate-500 dark:bg-slate-400 cursor-blink align-middle" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Suggested paths (journey forks) */}
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

### 4.4 SpanRenderer

```typescript
// components/Terminal/Stream/SpanRenderer.tsx

import React, { useMemo } from 'react';
import { RhetoricalSpan, RhetoricalSpanType } from '@/core/schema/stream';

export interface SpanRendererProps {
  /** Raw markdown content */
  content: string;
  /** Pre-parsed rhetorical spans */
  spans: RhetoricalSpan[];
  /** Handler for span clicks */
  onSpanClick?: (span: RhetoricalSpan) => void;
}

// Style mapping for span types
const SPAN_STYLES: Record<RhetoricalSpanType, string> = {
  concept: 'text-[var(--chat-concept-text)] font-bold hover:bg-[var(--chat-concept-bg-hover)] cursor-pointer transition-colors rounded px-0.5',
  action: 'text-[var(--chat-action-text)] font-medium hover:underline cursor-pointer',
  entity: 'text-[var(--chat-entity-text)] italic'
};

export const SpanRenderer: React.FC<SpanRendererProps> = ({
  content,
  spans,
  onSpanClick
}) => {
  const elements = useMemo(() => {
    if (!spans || spans.length === 0) {
      return [content];
    }

    // Sort by startIndex
    const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSpans.forEach((span) => {
      // Bounds checking
      const start = Math.max(0, Math.min(span.startIndex, content.length));
      const end = Math.max(start, Math.min(span.endIndex, content.length));

      // Add text before this span
      if (start > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {content.slice(lastIndex, start)}
          </span>
        );
      }

      // Add span element
      result.push(
        <SpanElement
          key={span.id}
          span={span}
          displayText={content.slice(start, end)}
          onClick={() => onSpanClick?.(span)}
        />
      );

      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex)}
        </span>
      );
    }

    return result;
  }, [content, spans, onSpanClick]);

  return <span className="whitespace-pre-wrap">{elements}</span>;
};

// Individual span element
interface SpanElementProps {
  span: RhetoricalSpan;
  displayText: string;
  onClick?: () => void;
}

const SpanElement: React.FC<SpanElementProps> = ({ span, displayText, onClick }) => {
  const style = SPAN_STYLES[span.type] || '';
  
  if (span.type === 'entity') {
    // Entities are not clickable
    return <span className={style}>{displayText}</span>;
  }

  return (
    <button
      onClick={onClick}
      className={`${style} active:scale-[0.98] transition-all`}
      aria-label={`Explore ${span.text}`}
    >
      {displayText}
    </button>
  );
};

export default SpanRenderer;
```

---

## 5. Token Definitions

Add to `globals.css`:

```css
:root {
  /* ─── Chat Span Tokens ─── */
  
  /* Concept spans (the "Orange Highlights") */
  --chat-concept-text: theme('colors.grove.clay');
  --chat-concept-bg: transparent;
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.1);
  
  /* Action spans (suggested prompts) */
  --chat-action-text: theme('colors.primary');
  --chat-action-bg: transparent;
  
  /* Entity spans (names, places) */
  --chat-entity-text: theme('colors.slate.600');
}

.dark {
  /* Dark mode overrides */
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.2);
  --chat-entity-text: theme('colors.slate.300');
}
```

---

## 6. Integration with TerminalChat

```typescript
// components/Terminal/TerminalChat.tsx (modified)

import StreamRenderer from './Stream';
import { useEngagement } from '@/core/engagement/hooks';

const TerminalChat: React.FC<TerminalChatProps> = ({ ...props }) => {
  // Get stream data from engagement machine
  const { streamHistory, currentStreamItem } = useEngagement();
  
  // Determine rendering mode
  const useStreamRenderer = streamHistory.length > 0 || currentStreamItem !== null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll">
      <div className="max-w-3xl mx-auto">
        {useStreamRenderer ? (
          <StreamRenderer
            items={streamHistory}
            currentItem={currentStreamItem}
            onSpanClick={handleSpanClick}
            onPathClick={handlePathClick}
            onPromptSubmit={handlePromptSubmit}
            bridgeState={bridgeState}
            onBridgeAccept={onBridgeAccept}
            onBridgeDismiss={onBridgeDismiss}
          />
        ) : (
          // Legacy rendering for backward compatibility
          <LegacyMessageList 
            messages={messages}
            {...legacyProps}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 7. DEX Compliance

### 7.1 Declarative Sovereignty

```
┌─────────────────────────────────────────────────────────────────┐
│  DOMAIN EXPERT CAN MODIFY:                                       │
├─────────────────────────────────────────────────────────────────┤
│  • Span type colors (CSS tokens)                                │
│  • Block type styling (CSS classes)                             │
│  • New span types (extend union, add to SPAN_STYLES)            │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN EXPERT CANNOT MODIFY (engine logic):                    │
├─────────────────────────────────────────────────────────────────┤
│  • Rendering algorithm                                           │
│  • Component structure                                           │
│  • Event handling                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Capability Agnosticism

- Renderer works with any StreamItem[]
- No assumption about model output format
- Spans come from parser, not rendering

### 7.3 Provenance

- Each StreamItem has `id` and `createdBy`
- Spans trace to `conceptId` for knowledge graph
- Block components could render provenance (future)

### 7.4 Organic Scalability

```typescript
// Adding new block type (future):
case 'diagram':
  return <DiagramBlock item={item} />;

// Adding new span type (future):
const SPAN_STYLES = {
  ...existing,
  citation: 'text-blue-600 underline',
  warning: 'text-amber-600 bg-amber-50'
};
```

---

## 8. File Structure Summary

```
src/
├── app/
│   └── globals.css              [MOD] Add --chat-concept-* tokens
│
└── components/
    └── Terminal/
        ├── TerminalChat.tsx     [MOD] Integrate StreamRenderer
        ├── MarkdownRenderer.tsx [NEW] Extract from TerminalChat
        └── Stream/              [NEW DIRECTORY]
            ├── index.ts
            ├── StreamRenderer.tsx
            ├── SpanRenderer.tsx
            └── blocks/
                ├── QueryBlock.tsx
                ├── ResponseBlock.tsx
                ├── NavigationBlock.tsx
                └── SystemBlock.tsx

tests/
├── unit/
│   ├── StreamRenderer.test.tsx  [NEW]
│   └── SpanRenderer.test.tsx    [NEW]
└── e2e/
    └── stream-rendering-baseline.spec.ts [NEW]
```

---

*Architecture approved: [Pending]*
*Last updated: December 2024*
