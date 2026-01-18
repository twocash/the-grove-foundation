# Repository Audit: kinetic-stream-rendering-v1

**Purpose:** Document current rendering state and identify gaps for StreamRenderer implementation.

---

## 1. Current State Analysis

### 1.1 Chat Rendering Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT RENDERING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TerminalChat.tsx                                               │
│       ↓                                                          │
│  messages.map(msg => <MessageBubble>)                           │
│       ↓                                                          │
│  MarkdownRenderer                                                │
│       ├── parseInline() - regex for **bold**                    │
│       ├── SuggestionChip for → prompts                          │
│       └── Returns React nodes directly                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- Parsing inline during render (violates SoC)
- No type discrimination for different message types
- Bold phrases create buttons with onClick handlers (not declarative)
- No concept of "span" as data structure

### 1.2 Existing Files

| File | Responsibility | Status |
|------|----------------|--------|
| `components/Terminal/TerminalChat.tsx` | Chat message display | **WILL MODIFY** |
| `components/Terminal/SuggestionChip.tsx` | Arrow prompt button | **WILL REUSE** |
| `components/Terminal/LoadingIndicator.tsx` | Streaming state | **WILL REUSE** |
| `components/Terminal/CognitiveBridge.tsx` | Journey suggestion | **WILL REUSE** |

### 1.3 Existing Inline Parsing (parseInline)

```typescript
// Current implementation in TerminalChat.tsx
const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Creates button with onClick
      return <button key={i} onClick={() => onBoldClick(phrase)} ... />
    }
    // ... italic handling
  });
};
```

**Issues:**
- Returns React nodes (not serializable)
- Parsing happens during render cycle
- No separation of "what to highlight" from "how to highlight"

---

## 2. Sprint 1 Schema (Dependency)

Sprint 1 (`kinetic-stream-schema-v1`) creates:

### 2.1 StreamItem Type

```typescript
interface StreamItem {
  id: string;
  type: 'query' | 'response' | 'navigation' | 'reveal' | 'system';
  timestamp: number;
  content: string;
  parsedSpans?: RhetoricalSpan[];
  suggestedPaths?: JourneyPath[];
  isGenerating?: boolean;
  createdBy?: 'user' | 'system' | 'ai';
  role?: 'user' | 'assistant';
}
```

### 2.2 RhetoricalSpan Type

```typescript
interface RhetoricalSpan {
  id: string;
  text: string;
  type: 'concept' | 'action' | 'entity';
  startIndex: number;
  endIndex: number;
  conceptId?: string;
  confidence?: number;
}
```

### 2.3 Machine Context

```typescript
// Available in engagement machine context
currentStreamItem: StreamItem | null;
streamHistory: StreamItem[];
```

---

## 3. Target State

### 3.1 StreamRenderer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET RENDERING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  StreamRenderer                                                  │
│       ↓                                                          │
│  streamHistory.map(item => renderItem(item))                    │
│       ↓                                                          │
│  switch(item.type)                                              │
│       ├── 'query'      → QueryBlock                             │
│       ├── 'response'   → ResponseBlock (with SpanRenderer)      │
│       ├── 'navigation' → NavigationBlock                        │
│       ├── 'reveal'     → RevealBlock [future]                   │
│       └── 'system'     → SystemBlock                            │
│                                                                  │
│  ResponseBlock                                                   │
│       ↓                                                          │
│  SpanRenderer.render(content, parsedSpans)                      │
│       ├── Split content by span indices                         │
│       ├── Wrap spans in styled components                       │
│       └── Returns React nodes from data                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Hierarchy

```
components/Terminal/
├── TerminalChat.tsx          [MODIFY] → Use StreamRenderer
└── Stream/                   [NEW DIRECTORY]
    ├── index.ts              [NEW] Exports
    ├── StreamRenderer.tsx    [NEW] Polymorphic dispatcher
    ├── QueryBlock.tsx        [NEW] User message block
    ├── ResponseBlock.tsx     [NEW] AI response with spans
    ├── NavigationBlock.tsx   [NEW] Path buttons
    ├── SystemBlock.tsx       [NEW] Status messages
    └── SpanRenderer.tsx      [NEW] Inline span highlighting
```

---

## 4. Patterns Extended

Per Phase 0 Pattern Check:

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Polymorphic rendering | Pattern 6: Surface Architecture | Compose type-specific blocks |
| Path navigation | Pattern 3: Narrative Schema | Reuse JourneyPath in buttons |
| Span styling | Pattern 4: Token Namespaces | Use `--chat-*` tokens |
| State access | Pattern 2: Engagement Machine | Read from streamHistory |

## 5. Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Chat rendering | `TerminalChat.tsx` | Inline parsing | **REFACTOR** to use StreamRenderer |
| Span data | `RhetoricalParser.ts` | N/A (Sprint 1) | **USE** parsed spans from machine |
| Message styling | `TerminalChat.tsx` | Inline classes | **EXTRACT** to block components |
| Path display | `SuggestionChip.tsx` | Exists | **REUSE** for NavigationBlock |
| Loading state | `LoadingIndicator.tsx` | Exists | **REUSE** in ResponseBlock |

### No Duplication Certification

This sprint does not create parallel implementations. It:
- Extracts rendering logic from TerminalChat (refactor, not duplicate)
- Composes existing components (SuggestionChip, LoadingIndicator)
- Reads from existing machine context (streamHistory)

---

## 6. Gaps Identified

| Gap | Resolution |
|-----|------------|
| No StreamRenderer component | Create `Stream/StreamRenderer.tsx` |
| No type-specific blocks | Create QueryBlock, ResponseBlock, etc. |
| Span rendering from indices | Create `SpanRenderer.tsx` with index-based splitting |
| TerminalChat uses ChatMessage | Add conditional: use StreamItem when available |
| Cognitive Bridge injection | Preserve inline injection pattern |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing chat | Medium | High | Backward compat fallback to MarkdownRenderer |
| Performance regression | Low | Medium | Memoize block components |
| Span index errors | Medium | Medium | Defensive bounds checking in SpanRenderer |
| Styling drift | Low | Low | Use existing `--chat-*` tokens |

---

## 8. Dependencies

### Hard Dependencies (Must Exist)

| Dependency | Source | Status |
|------------|--------|--------|
| `StreamItem` type | Sprint 1 schema | 🔄 In Progress |
| `RhetoricalSpan` type | Sprint 1 schema | 🔄 In Progress |
| `streamHistory` in machine | Sprint 1 machine | 🔄 In Progress |
| `RhetoricalParser.parse()` | Sprint 1 transformer | 🔄 In Progress |

### Soft Dependencies (Enhances)

| Dependency | Purpose | Without It |
|------------|---------|------------|
| `JourneyPath` type | Navigation buttons | NavigationBlock simpler |
| Lens context | Contextual styling | Default styling only |

---

*Audit completed: December 2024*
