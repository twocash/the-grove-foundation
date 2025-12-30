# Architecture: kinetic-stream-schema-v1

**Target State:** Declarative typed stream infrastructure for Kinetic Chat

---

## 1. Architectural Vision

### 1.1 Current State (Before)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LLM Response (string)                                          │
│       ↓                                                          │
│  ChatMessage { role, content: string }                          │
│       ↓                                                          │
│  TerminalChat.tsx                                               │
│       ↓                                                          │
│  MarkdownRenderer (inline parsing)                              │
│       ├── Regex detects **bold**                                │
│       ├── Regex detects → prompts                               │
│       └── Returns React nodes                                   │
│       ↓                                                          │
│  Rendered output with inline onClick handlers                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- Parsing happens during rendering (violates separation)
- No reusable span data (can't persist, can't share)
- Inline handlers are non-declarative
- No type safety on parsed content

### 1.2 Target State (After)

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LLM Response (string)                                          │
│       ↓                                                          │
│  Engagement Machine Action: parseContent()                      │
│       ↓                                                          │
│  RhetoricalParser.parse(content)                                │
│       ├── Returns RhetoricalSpan[]                              │
│       └── Indices into original content                         │
│       ↓                                                          │
│  StreamItem { type, content, parsedSpans, suggestedPaths }     │
│       ↓                                                          │
│  Machine Context: streamHistory.push(item)                      │
│       ↓                                                          │
│  [Sprint 2] StreamRenderer consumes typed data                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Parsing in action layer (single responsibility)
- Spans are data (persist, serialize, analyze)
- Declarative: renderer reads schema, doesn't compute
- Type-safe: StreamItem schema enforced

---

## 2. Data Flow

### 2.1 Stream Item Lifecycle

```
1. USER QUERY
   ┌─────────────────────────────────────────┐
   │ User types: "What is Grove?"            │
   └─────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────┐
   │ Machine receives: START_GENERATE        │
   │ Action: createQueryItem()               │
   │ Result: StreamItem {                    │
   │   id: uuid(),                           │
   │   type: 'query',                        │
   │   content: 'What is Grove?',            │
   │   timestamp: Date.now(),                │
   │   createdBy: 'user'                     │
   │ }                                       │
   └─────────────────────────────────────────┘
                    ↓
2. RESPONSE STREAMING
   ┌─────────────────────────────────────────┐
   │ Machine receives: STREAM_CHUNK          │
   │ Action: appendToCurrentItem()           │
   │ Result: StreamItem.content += chunk     │
   │         StreamItem.isGenerating = true  │
   └─────────────────────────────────────────┘
                    ↓
3. RESPONSE COMPLETE
   ┌─────────────────────────────────────────┐
   │ Machine receives: COMPLETE              │
   │ Action: parseContent()                  │
   │   - RhetoricalParser.parse(content)     │
   │   - Extract suggested paths             │
   │ Result: StreamItem {                    │
   │   ...existing,                          │
   │   isGenerating: false,                  │
   │   parsedSpans: [...spans],              │
   │   suggestedPaths: [...paths]            │
   │ }                                       │
   └─────────────────────────────────────────┘
                    ↓
4. HISTORY UPDATE
   ┌─────────────────────────────────────────┐
   │ Machine context updated:                │
   │ streamHistory.push(completedItem)       │
   └─────────────────────────────────────────┘
```

### 2.2 Component Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      DATA FLOW DIAGRAM                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌──────────────────┐     ┌──────────────┐  │
│  │  ChatInput  │────▶│ Engagement       │────▶│ Stream       │  │
│  │             │     │ Machine          │     │ History      │  │
│  └─────────────┘     └──────────────────┘     └──────────────┘  │
│        │                     │                       │           │
│        │              ┌──────┴───────┐               │           │
│        │              ▼              ▼               │           │
│        │        ┌──────────┐  ┌──────────┐          │           │
│        │        │ Rhetor.  │  │ Path     │          │           │
│        │        │ Parser   │  │ Extractor│          │           │
│        │        └──────────┘  └──────────┘          │           │
│        │                                             │           │
│        │         [Sprint 2: StreamRenderer]          │           │
│        │              ┌─────────────────────────────▼           │
│        │              │                                          │
│        │              │  Map streamHistory → UI Blocks           │
│        │              │    - QueryBlock                          │
│        │              │    - ResponseBlock (with spans)          │
│        │              │    - NavigationBlock (with paths)        │
│        │              │                                          │
│        └──────────────┴──────────────────────────────────────▶  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Schema Definitions

### 3.1 StreamItem (New File: src/core/schema/stream.ts)

```typescript
import { GroveObjectMeta } from './grove-object';
import { JourneyPath } from './journey';

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM TYPES
// ─────────────────────────────────────────────────────────────────

/**
 * Discriminated union for stream item types.
 * Each type has specific semantic meaning in the chat flow.
 */
export type StreamItemType = 
  | 'query'       // User-initiated question or command
  | 'response'    // AI-generated response
  | 'navigation'  // Journey fork/path options
  | 'reveal'      // Concept or lens reveal
  | 'system';     // Status, error, loading states

// ─────────────────────────────────────────────────────────────────
// RHETORICAL SPANS
// ─────────────────────────────────────────────────────────────────

/**
 * Type of rhetorical element detected in content.
 */
export type RhetoricalSpanType = 
  | 'concept'  // Bold phrases representing key concepts
  | 'action'   // Arrow prompts representing suggested actions
  | 'entity';  // Named entities (people, places, organizations)

/**
 * A parsed span within content that has special meaning.
 * These become the "Orange Highlights" in the UI.
 */
export interface RhetoricalSpan {
  /** Unique identifier for this span */
  id: string;
  
  /** The text content of the span */
  text: string;
  
  /** What kind of rhetorical element this is */
  type: RhetoricalSpanType;
  
  /** Start index in original content string */
  startIndex: number;
  
  /** End index in original content string (exclusive) */
  endIndex: number;
  
  /** Optional link to knowledge graph concept */
  conceptId?: string;
  
  /** Parser confidence score (0-1) */
  confidence?: number;
}

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM
// ─────────────────────────────────────────────────────────────────

/**
 * StreamItem is the atomic unit of the chat stream.
 * 
 * It extends ChatMessage semantics while implementing GroveObjectMeta
 * for consistency with the Grove Object Model (Pattern 7).
 * 
 * @see Pattern 7: Grove Object Model
 * @see ChatMessage (types.ts)
 */
export interface StreamItem {
  // ─── Identity (from GroveObjectMeta) ───
  /** Unique identifier */
  id: string;
  
  /** Discriminated type for polymorphic rendering */
  type: StreamItemType;
  
  /** Unix timestamp of creation */
  timestamp: number;
  
  /** Human-readable title (optional for most items) */
  title?: string;
  
  // ─── Content ───
  /** Raw markdown content */
  content: string;
  
  /** Parsed rhetorical spans (the "Orange Highlights") */
  parsedSpans?: RhetoricalSpan[];
  
  // ─── Navigation ───
  /** Suggested continuation paths (journey forks) */
  suggestedPaths?: JourneyPath[];
  
  // ─── State ───
  /** True while content is still streaming */
  isGenerating?: boolean;
  
  // ─── Provenance (from GroveObjectMeta) ───
  /** Who/what created this item */
  createdBy?: 'user' | 'system' | 'ai';
  
  // ─── ChatMessage Compatibility ───
  /** Role for backward compatibility with ChatMessage */
  role?: 'user' | 'assistant';
  
  /** Legacy metadata passthrough */
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────────

export function isQueryItem(item: StreamItem): boolean {
  return item.type === 'query';
}

export function isResponseItem(item: StreamItem): boolean {
  return item.type === 'response';
}

export function hasSpans(item: StreamItem): item is StreamItem & { parsedSpans: RhetoricalSpan[] } {
  return Array.isArray(item.parsedSpans) && item.parsedSpans.length > 0;
}

export function hasPaths(item: StreamItem): item is StreamItem & { suggestedPaths: JourneyPath[] } {
  return Array.isArray(item.suggestedPaths) && item.suggestedPaths.length > 0;
}

// ─────────────────────────────────────────────────────────────────
// CONVERSION UTILITIES
// ─────────────────────────────────────────────────────────────────

import { ChatMessage } from '../../../types';

/**
 * Convert legacy ChatMessage to StreamItem.
 * Enables gradual migration without breaking changes.
 */
export function fromChatMessage(msg: ChatMessage): StreamItem {
  return {
    id: msg.id,
    type: msg.role === 'user' ? 'query' : 'response',
    timestamp: msg.timestamp ?? Date.now(),
    content: msg.content,
    role: msg.role,
    metadata: msg.metadata,
    createdBy: msg.role === 'user' ? 'user' : 'ai'
  };
}

/**
 * Convert StreamItem back to ChatMessage for legacy compatibility.
 */
export function toChatMessage(item: StreamItem): ChatMessage {
  return {
    id: item.id,
    role: item.type === 'query' ? 'user' : 'assistant',
    content: item.content,
    timestamp: item.timestamp,
    metadata: item.metadata as ChatMessage['metadata']
  };
}
```

### 3.2 RhetoricalParser (New File)

```typescript
// src/core/transformers/RhetoricalParser.ts

import { RhetoricalSpan, RhetoricalSpanType } from '../schema/stream';

// ─────────────────────────────────────────────────────────────────
// PARSER RESULT
// ─────────────────────────────────────────────────────────────────

export interface ParseResult {
  /** Extracted rhetorical spans */
  spans: RhetoricalSpan[];
  
  /** Content with markdown markers preserved */
  content: string;
}

// ─────────────────────────────────────────────────────────────────
// PARSER PATTERNS
// ─────────────────────────────────────────────────────────────────

const PATTERNS = {
  // Matches **bold text**
  bold: /\*\*([^*]+)\*\*/g,
  
  // Matches → prompt or -> prompt
  arrow: /^(?:→|->)\s+(.+)$/gm,
  
  // Matches _italic_ (entities)
  italic: /_([^_]+)_/g
} as const;

// ─────────────────────────────────────────────────────────────────
// PARSER IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────

let spanIdCounter = 0;

function generateSpanId(): string {
  return `span_${++spanIdCounter}_${Date.now()}`;
}

/**
 * Parse content and extract rhetorical spans.
 * 
 * This is a pure function - no side effects.
 * Spans include indices into the original content for later rendering.
 */
export function parse(content: string): ParseResult {
  const spans: RhetoricalSpan[] = [];
  
  // Extract bold phrases (concepts)
  let match: RegExpExecArray | null;
  
  // Reset regex state
  PATTERNS.bold.lastIndex = 0;
  while ((match = PATTERNS.bold.exec(content)) !== null) {
    spans.push({
      id: generateSpanId(),
      text: match[1],
      type: 'concept',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 1.0
    });
  }
  
  // Extract arrow prompts (actions)
  PATTERNS.arrow.lastIndex = 0;
  while ((match = PATTERNS.arrow.exec(content)) !== null) {
    spans.push({
      id: generateSpanId(),
      text: match[1],
      type: 'action',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 1.0
    });
  }
  
  // Sort by position for rendering order
  spans.sort((a, b) => a.startIndex - b.startIndex);
  
  return { spans, content };
}

/**
 * Parse content but only return spans of a specific type.
 */
export function parseByType(
  content: string, 
  type: RhetoricalSpanType
): RhetoricalSpan[] {
  return parse(content).spans.filter(s => s.type === type);
}

/**
 * Check if content contains any rhetorical spans.
 * Useful for quick checks without full parsing.
 */
export function hasRhetoricalContent(content: string): boolean {
  return PATTERNS.bold.test(content) || PATTERNS.arrow.test(content);
}
```

---

## 4. Machine Integration

### 4.1 Context Extension

```typescript
// In src/core/engagement/types.ts

import { StreamItem } from '../schema/stream';

export interface EngagementContext {
  // ... existing fields ...
  
  /** Current item being generated (in progress) */
  currentStreamItem: StreamItem | null;
  
  /** Completed stream items (immutable history) */
  streamHistory: StreamItem[];
}
```

### 4.2 New Actions

```typescript
// In src/core/engagement/actions.ts

import { assign } from 'xstate';
import { parse } from '../transformers/RhetoricalParser';
import { StreamItem } from '../schema/stream';
import { v4 as uuid } from 'uuid';

export const createQueryItem = assign<EngagementContext>({
  currentStreamItem: (ctx, event) => ({
    id: uuid(),
    type: 'query',
    content: event.prompt,
    timestamp: Date.now(),
    createdBy: 'user'
  })
});

export const createResponseItem = assign<EngagementContext>({
  currentStreamItem: (ctx) => ({
    id: uuid(),
    type: 'response',
    content: '',
    timestamp: Date.now(),
    createdBy: 'ai',
    isGenerating: true
  })
});

export const appendToResponse = assign<EngagementContext>({
  currentStreamItem: (ctx, event) => ({
    ...ctx.currentStreamItem!,
    content: ctx.currentStreamItem!.content + event.chunk
  })
});

export const finalizeResponse = assign<EngagementContext>({
  currentStreamItem: (ctx) => {
    const item = ctx.currentStreamItem!;
    const { spans } = parse(item.content);
    
    return {
      ...item,
      isGenerating: false,
      parsedSpans: spans,
      // suggestedPaths will be added by separate action
    };
  },
  streamHistory: (ctx) => [
    ...ctx.streamHistory,
    ctx.currentStreamItem!
  ]
});
```

---

## 5. DEX Compliance

### 5.1 Declarative Sovereignty

```
┌─────────────────────────────────────────────────────────────────┐
│  DOMAIN EXPERT CAN MODIFY:                                       │
├─────────────────────────────────────────────────────────────────┤
│  • Span types (add 'citation', 'warning', etc.)                 │
│  • Pattern definitions (in config, not code) [future]           │
│  • Visual treatment per span type (in theme tokens)             │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN EXPERT CANNOT MODIFY (engine logic):                    │
├─────────────────────────────────────────────────────────────────┤
│  • Parsing algorithm                                             │
│  • State machine transitions                                     │
│  • React component structure                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Capability Agnosticism

The parser works on any markdown content regardless of source:
- GPT-4 output
- Claude output
- Local 7B model output
- Hand-written content

No model-specific assumptions.

### 5.3 Provenance

Every StreamItem tracks:
- `id`: Unique identifier
- `timestamp`: When created
- `createdBy`: Who/what created it
- `parsedSpans[].id`: Traceable span identity

### 5.4 Organic Scalability

```typescript
// Adding new span type (future):
type RhetoricalSpanType = 
  | 'concept' 
  | 'action' 
  | 'entity'
  | 'citation'    // NEW
  | 'warning';    // NEW

// Adding new item type (future):
type StreamItemType = 
  | 'query' 
  | 'response' 
  | 'navigation'
  | 'reveal'
  | 'system'
  | 'diagram';    // NEW
```

---

## 6. File Structure (New/Modified)

```
src/
├── core/
│   ├── schema/
│   │   ├── stream.ts           [NEW] StreamItem, RhetoricalSpan
│   │   └── index.ts            [MOD] Export stream types
│   ├── transformers/
│   │   ├── RhetoricalParser.ts [NEW] Parse content → spans
│   │   └── index.ts            [MOD] Export parser
│   └── engagement/
│       ├── types.ts            [MOD] Add stream context
│       ├── actions.ts          [MOD] Add stream actions
│       └── machine.ts          [MOD] Wire actions to transitions
└── types.ts                    [UNCHANGED] ChatMessage stays for compatibility

tests/
├── unit/
│   └── RhetoricalParser.test.ts    [NEW]
└── integration/
    └── engagement-stream.test.ts   [NEW]
```

---

*Architecture approved: [Pending]*
*Last updated: December 2024*
