# Kinetic Stream Reset v2: Comprehensive Requirements

**Initiative:** Complete Terminal Chat Experience Refactor  
**Sprint Owner:** Jim Calhoun  
**Document Type:** Pre-Foundation Loop Requirements Specification  
**Created:** December 28, 2025  
**Status:** READY FOR FOUNDATION LOOP PROCESSING  

---

## Executive Summary

This document provides comprehensive requirements for refactoring the Terminal chat experience from a legacy "chat log" paradigm to the **Kinetic Stream** architecture. The refactor transforms passive message display into an active exploration surface where responses contain interactive concepts ("Orange Highlights") and contextual navigation ("Journey Forks").

**The Core Transformation:**
- FROM: Messages as dumb text containers rendered via ReactMarkdown
- TO: StreamItems as typed, interactive objects with semantic metadata

**Key Deliverables:**
1. Enhanced StreamItem schema with discriminated union types
2. Polymorphic StreamRenderer replacing legacy chat rendering
3. RhetoricalSkeleton parser with stable hydration logic
4. ActiveResponseBlock with interactive concept spans
5. NavigationBlock with inline journey forks
6. Pivot mechanic connecting concept clicks to auto-queries
7. Cognitive state visibility layer
8. Glass panel visual system

---

## Part I: Strategic Context

### 1.1 Why This Refactor Matters

The current Terminal implementation reflects three user models layered atop each other:

**Model A - Chat Log (ChatGPT):** Treats interaction as transactional Q&A. Every response is a dead end unless the user formulates the next question.

**Model B - Suggestion Engine (Perplexity):** Recognizes users need navigation help but delivers it as spatially disconnected widgets.

**Model C - Exploration Surface (Kinetic):** The target paradigm where every response is a waypoint in a knowledge topology with embedded navigation options.

The refactor commits fully to Model C. The chat log disappears. The exploration surface emerges.

### 1.2 Trellis Architecture Alignment

This initiative implements core DEX (Declarative Exploration) principles:

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | StreamItem types define rendering behavior; domain config determines navigation labels |
| **Capability Agnosticism** | System works whether LLM outputs structured `<navigation>` or not (graceful fallback) |
| **Provenance as Infrastructure** | Every StreamItem carries provenance (timestamp, createdBy, sourceId) |
| **Organic Scalability** | New StreamItem types added via schema extension, not code branching |

### 1.3 The First Order Directive Applied

> **Separation of Exploration Logic from Execution Capability**

The kinetic stream separates:
- **What** (StreamItem schema, RhetoricalMap structure) — declarative data
- **How** (StreamRenderer, SpanRenderer) — generic engine that interprets data

An admin can change what concepts are highlighted by updating extraction rules. They don't touch rendering code.

---

## Part II: Current State Assessment

### 2.1 Existing Assets (Preserve/Extend)

The codebase contains partially-implemented kinetic stream components from previous sprints:

| Asset | Location | Status | Action |
|-------|----------|--------|--------|
| `stream.ts` schema | `src/core/schema/stream.ts` | Exists, basic | **ENHANCE** with discriminated union |
| `StreamRenderer.tsx` | `components/Terminal/Stream/` | Exists, partial | **COMPLETE** polymorphic routing |
| `ResponseBlock.tsx` | `components/Terminal/Stream/blocks/` | Exists, basic | **ENHANCE** with rhetoric |
| `QueryBlock.tsx` | Same directory | Exists, functional | **MINOR UPDATE** for pivot context |
| `SpanRenderer.tsx` | `components/Terminal/Stream/` | Exists | **VERIFY** index-based rendering |
| `RhetoricalSkeleton.ts` | `src/core/transformers/` | Exists | **VERIFY** stable hydration |
| `NavigationBlock.tsx` | `components/Terminal/Stream/blocks/` | Exists, stubbed | **COMPLETE** implementation |
| `GlassPanel.tsx` | `components/Terminal/Stream/motion/` | Exists, CSS missing | **WIRE** CSS tokens |
| `machine.ts` | `src/core/engagement/` | Exists, working | **EXTEND** with new events |

### 2.2 Legacy Components (Deprecate After Migration)

| Component | Location | Reason for Deprecation |
|-----------|----------|------------------------|
| `TerminalChat.tsx` inline rendering | `components/Terminal/` | Legacy chat bubbles |
| `SuggestionChip.tsx` | `components/Terminal/` | Replaced by NavigationBlock |
| Regex-based highlighting | Within markdown pipeline | Replaced by semantic spans |
| Floating suggestions widget | Terminal layout | Replaced by inline forks |



### 2.3 Current Message Flow (To Be Replaced)

```
User types query
    ↓
Input field captures text
    ↓
Submit handler called
    ↓
XState machine receives USER.SUBMIT
    ↓
API call initiated
    ↓
Streaming response begins
    ↓
Chunks appended to message state (Message[])
    ↓
Messages array re-renders
    ↓
Chat bubbles display via MarkdownRenderer
    ↓
Suggested prompts update (separate widget)
```

### 2.4 Target Message Flow (Kinetic Stream)

```
User types query OR clicks pivot OR selects fork
    ↓
QueryObject constructed (with pivot context if applicable)
    ↓
XState machine receives typed event
    ↓
System events emit (considering, connecting, synthesizing...)
    ↓
API call initiated with enhanced context
    ↓
Streaming response begins
    ↓
Chunks append; sentence boundaries detected
    ↓
RhetoricalSkeleton parses completed sentences
    ↓
StreamItem hydrates with rhetoric map
    ↓
<navigation> block detected and stripped from content
    ↓
NavigationBlock renders inline at response bottom
    ↓
StreamRenderer dispatches to typed block components
    ↓
Cognitive state logged to archaeology layer
```

---

## Part III: Schema Specification

### 3.1 Enhanced StreamItem Union

The current `StreamItem` interface in `stream.ts` uses a single interface with `type` field. We enhance this to a proper discriminated union:

```typescript
// src/core/schema/stream.ts

import type { GroveObject } from './grove-object';

// ============================================================================
// BASE TYPES
// ============================================================================

export type StreamItemType = 
  | 'query'           // User input
  | 'response'        // AI textual response (rich)
  | 'system_event'    // Visible cognitive state
  | 'lens_reveal'     // Object card in stream
  | 'journey_fork';   // Navigation block

export type CognitiveState = 
  | 'considering' 
  | 'retrieving' 
  | 'synthesizing' 
  | 'generating' 
  | 'complete';

// ============================================================================
// RHETORICAL TYPES (Active Rhetoric System)
// ============================================================================

export type RhetoricalSpanType = 'concept' | 'entity' | 'action' | 'bridge';

export interface RhetoricalSpan {
  id: string;
  text: string;                    // The literal text in the response
  type: RhetoricalSpanType;
  startIndex: number;              // For stable hydration
  endIndex: number;
  definition?: string;             // For hover card
  connectionCount?: number;        // "Appears in N nodes"
  conceptId?: string;              // Link to knowledge graph
  relatedJourneyIds?: string[];    // Active journeys involving this
  confidence?: number;             // Parser confidence score
}

export interface RhetoricalMap {
  spans: RhetoricalSpan[];
  sentenceCount: number;           // For progressive hydration
  parsedAt: number;                // Timestamp
}

// ============================================================================
// NAVIGATION TYPES (Journey Forks)
// ============================================================================

export type JourneyForkType = 'deep_dive' | 'pivot' | 'apply';

export interface JourneyFork {
  id: string;
  label: string;                   // LLM-generated, context-specific
  type: JourneyForkType;
  targetId?: string;               // Link to specific journey/node
  queryPayload?: string;           // Pre-composed query text
  context?: string;                // Context to inject if selected
}


// ============================================================================
// STREAM ITEM VARIANTS (Discriminated Union)
// ============================================================================

interface BaseStreamItem {
  id: string;
  timestamp: number;
  isVisible: boolean;
  metadata?: Record<string, unknown>;
}

export interface QueryItem extends BaseStreamItem {
  type: 'query';
  content: string;
  intent?: string;                 // Classified intent
  pivot?: {                        // Present if this came from a pivot click
    sourceResponseId: string;
    sourceText: string;
    sourceContext: string;
    targetId?: string;
  };
}

export interface ResponseItem extends BaseStreamItem {
  type: 'response';
  content: string;                 // Markdown content (navigation stripped)
  isStreaming: boolean;
  rhetoric: RhetoricalMap;         // The active spans
  navigation?: JourneyFork[];      // Parsed from <navigation> block
  cognitiveTrace?: {               // Optional archaeology
    retrievedNodes: string[];
    reasoningPath: string[];
  };
}

export interface SystemEventItem extends BaseStreamItem {
  type: 'system_event';
  message: string;
  state: CognitiveState;
  duration?: number;               // How long this state lasted
}

export interface LensRevealItem extends BaseStreamItem {
  type: 'lens_reveal';
  objectType: string;              // 'node', 'journey', 'sprout', etc.
  objectId: string;
  data?: GroveObject;              // The actual object for inline rendering
}

export interface JourneyForkItem extends BaseStreamItem {
  type: 'journey_fork';
  forks: JourneyFork[];
  sourceResponseId: string;        // Which response these forks came from
}

// ============================================================================
// MASTER UNION
// ============================================================================

export type StreamItem = 
  | QueryItem 
  | ResponseItem 
  | SystemEventItem 
  | LensRevealItem
  | JourneyForkItem;

export type KineticStream = StreamItem[];

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isQueryItem(item: StreamItem): item is QueryItem {
  return item.type === 'query';
}

export function isResponseItem(item: StreamItem): item is ResponseItem {
  return item.type === 'response';
}

export function isSystemEventItem(item: StreamItem): item is SystemEventItem {
  return item.type === 'system_event';
}

export function isLensRevealItem(item: StreamItem): item is LensRevealItem {
  return item.type === 'lens_reveal';
}

export function isJourneyForkItem(item: StreamItem): item is JourneyForkItem {
  return item.type === 'journey_fork';
}

export function hasRhetoric(item: StreamItem): item is ResponseItem {
  return isResponseItem(item) && item.rhetoric.spans.length > 0;
}

export function hasNavigation(item: StreamItem): item is ResponseItem & { navigation: JourneyFork[] } {
  return isResponseItem(item) && Array.isArray(item.navigation) && item.navigation.length > 0;
}
```

### 3.2 Engagement Machine Events

New events for the XState machine:

```typescript
// src/core/engagement/types.ts (extend existing)

export type KineticStreamEvent =
  | { type: 'USER.SUBMIT_QUERY'; text: string; intent?: string }
  | { type: 'USER.CLICK_PIVOT'; span: RhetoricalSpan; responseId: string }
  | { type: 'USER.SELECT_FORK'; fork: JourneyFork; responseId: string }
  | { type: 'SYSTEM.STREAM_CHUNK'; token: string }
  | { type: 'SYSTEM.SENTENCE_COMPLETE'; sentenceIndex: number; content: string }
  | { type: 'SYSTEM.PARSE_RHETORIC'; rhetoric: RhetoricalMap }
  | { type: 'SYSTEM.PARSE_NAVIGATION'; forks: JourneyFork[] }
  | { type: 'SYSTEM.GENERATION_COMPLETE' }
  | { type: 'SYSTEM.COGNITIVE_STATE'; state: CognitiveState };
```

---

## Part IV: Rendering Specification

### 4.1 StreamRenderer Architecture

The StreamRenderer is the "traffic controller" that routes StreamItems to type-specific blocks:

```typescript
// components/Terminal/Stream/StreamRenderer.tsx

interface StreamRendererProps {
  items: StreamItem[];
  activeItemId?: string;           // For streaming state indication
  onSpanClick?: (span: RhetoricalSpan, responseId: string) => void;
  onForkSelect?: (fork: JourneyFork, responseId: string) => void;
}

export const StreamRenderer: React.FC<StreamRendererProps> = ({
  items,
  activeItemId,
  onSpanClick,
  onForkSelect
}) => {
  return (
    <AnimatePresence mode="popLayout">
      {items.map(item => (
        <motion.div
          key={item.id}
          variants={streamItemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <StreamItemBlock 
            item={item}
            isActive={item.id === activeItemId}
            onSpanClick={onSpanClick}
            onForkSelect={onForkSelect}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};


const StreamItemBlock: React.FC<{
  item: StreamItem;
  isActive: boolean;
  onSpanClick?: (span: RhetoricalSpan, responseId: string) => void;
  onForkSelect?: (fork: JourneyFork, responseId: string) => void;
}> = ({ item, isActive, onSpanClick, onForkSelect }) => {
  switch (item.type) {
    case 'query':
      return <QueryBlock item={item} />;
    case 'response':
      return (
        <ActiveResponseBlock 
          item={item} 
          isActive={isActive}
          onSpanClick={span => onSpanClick?.(span, item.id)}
          onForkSelect={fork => onForkSelect?.(fork, item.id)}
        />
      );
    case 'system_event':
      return <SystemEventBlock item={item} />;
    case 'lens_reveal':
      return <LensRevealBlock item={item} />;
    case 'journey_fork':
      return (
        <NavigationBlock 
          forks={item.forks}
          onSelect={fork => onForkSelect?.(fork, item.sourceResponseId)}
        />
      );
    default:
      return null;
  }
};
```

### 4.2 ActiveResponseBlock (The Heart of Kinetic)

This component renders AI responses with interactive rhetoric:

```typescript
// components/Terminal/Stream/blocks/ActiveResponseBlock.tsx

interface ActiveResponseBlockProps {
  item: ResponseItem;
  isActive: boolean;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
}

export const ActiveResponseBlock: React.FC<ActiveResponseBlockProps> = ({
  item,
  isActive,
  onSpanClick,
  onForkSelect
}) => {
  return (
    <GlassPanel 
      variant="response" 
      className={cn(
        "relative",
        isActive && "ring-1 ring-chat-concept-active/30"
      )}
    >
      {/* Cognitive Trace (optional, subtle) */}
      {item.cognitiveTrace && (
        <CognitiveTraceBar trace={item.cognitiveTrace} />
      )}
      
      {/* Main Content with Spans */}
      <div className="prose prose-grove max-w-none">
        <SpanRenderer 
          content={item.content}
          rhetoric={item.rhetoric}
          isStreaming={item.isStreaming}
          onSpanClick={onSpanClick}
        />
      </div>
      
      {/* Inline Navigation (Journey Forks) */}
      {item.navigation && item.navigation.length > 0 && !item.isStreaming && (
        <NavigationBlock 
          forks={item.navigation}
          onSelect={onForkSelect}
        />
      )}
      
      {/* Streaming Indicator */}
      {item.isStreaming && (
        <StreamingIndicator />
      )}
    </GlassPanel>
  );
};
```

### 4.3 SpanRenderer (Index-Based Highlighting)

The SpanRenderer uses pre-computed indices to inject interactive spans:

```typescript
// components/Terminal/Stream/SpanRenderer.tsx

interface SpanRendererProps {
  content: string;
  rhetoric: RhetoricalMap;
  isStreaming: boolean;
  onSpanClick?: (span: RhetoricalSpan) => void;
}

export const SpanRenderer: React.FC<SpanRendererProps> = ({
  content,
  rhetoric,
  isStreaming,
  onSpanClick
}) => {
  // Sort spans by startIndex for proper slicing
  const sortedSpans = [...rhetoric.spans].sort((a, b) => a.startIndex - b.startIndex);
  
  // Build segments: alternating plain text and interactive spans
  const segments: Array<{ type: 'text' | 'span'; content: string; span?: RhetoricalSpan }> = [];
  let cursor = 0;
  
  for (const span of sortedSpans) {
    // Only hydrate spans in completed sentences (stable hydration)
    if (isStreaming && span.endIndex > getLastCompleteSentenceIndex(content)) {
      continue;
    }
    
    // Plain text before this span
    if (span.startIndex > cursor) {
      segments.push({
        type: 'text',
        content: content.slice(cursor, span.startIndex)
      });
    }
    
    // The span itself
    segments.push({
      type: 'span',
      content: content.slice(span.startIndex, span.endIndex),
      span
    });
    
    cursor = span.endIndex;
  }
  
  // Remaining text after last span
  if (cursor < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(cursor)
    });
  }
  
  return (
    <ReactMarkdown
      components={{
        // Custom paragraph renderer that processes our segments
        p: ({ children }) => (
          <p className="mb-4 last:mb-0">
            {processSegments(segments, onSpanClick)}
          </p>
        )
      }}
    >
      {/* Implementation will render segments directly */}
    </ReactMarkdown>
  );
};

// Helper to find last complete sentence boundary
function getLastCompleteSentenceIndex(content: string): number {
  const sentenceEnders = /[.!?]\s/g;
  let lastMatch = 0;
  let match;
  while ((match = sentenceEnders.exec(content)) !== null) {
    lastMatch = match.index + match[0].length;
  }
  return lastMatch;
}
```


### 4.4 NavigationBlock (Journey Forks)

Inline navigation buttons at response bottom:

```typescript
// components/Terminal/Stream/blocks/NavigationBlock.tsx

interface NavigationBlockProps {
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}

export const NavigationBlock: React.FC<NavigationBlockProps> = ({
  forks,
  onSelect
}) => {
  // Group forks by type for visual hierarchy
  const grouped = useMemo(() => ({
    deep_dive: forks.filter(f => f.type === 'deep_dive'),
    pivot: forks.filter(f => f.type === 'pivot'),
    apply: forks.filter(f => f.type === 'apply')
  }), [forks]);
  
  return (
    <motion.div 
      className="mt-6 pt-4 border-t border-white/10 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Deep Dive options - primary emphasis */}
      {grouped.deep_dive.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {grouped.deep_dive.map(fork => (
            <ForkButton 
              key={fork.id}
              fork={fork}
              variant="primary"
              onClick={() => onSelect?.(fork)}
            />
          ))}
        </div>
      )}
      
      {/* Pivot options - secondary */}
      {grouped.pivot.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {grouped.pivot.map(fork => (
            <ForkButton 
              key={fork.id}
              fork={fork}
              variant="secondary"
              onClick={() => onSelect?.(fork)}
            />
          ))}
        </div>
      )}
      
      {/* Apply options - tertiary */}
      {grouped.apply.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {grouped.apply.map(fork => (
            <ForkButton 
              key={fork.id}
              fork={fork}
              variant="tertiary"
              onClick={() => onSelect?.(fork)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

const ForkButton: React.FC<{
  fork: JourneyFork;
  variant: 'primary' | 'secondary' | 'tertiary';
  onClick: () => void;
}> = ({ fork, variant, onClick }) => {
  const icons = {
    deep_dive: '↓',
    pivot: '→',
    apply: '✓'
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all",
        "hover:scale-105 active:scale-95",
        variant === 'primary' && "bg-chat-concept-bg text-chat-concept-text hover:bg-chat-concept-bg/80",
        variant === 'secondary' && "bg-white/10 text-white/80 hover:bg-white/15",
        variant === 'tertiary' && "bg-transparent border border-white/20 text-white/60 hover:border-white/40"
      )}
    >
      <span className="mr-2">{icons[fork.type]}</span>
      {fork.label}
    </button>
  );
};
```

---

## Part V: Parser Specification

### 5.1 RhetoricalSkeleton Enhancement

The parser must support "stable hydration" — only igniting concepts in completed sentences to prevent UI jitter during streaming:

```typescript
// src/core/transformers/RhetoricalSkeleton.ts

export interface ParseOptions {
  /** Only parse up to this character index (for streaming) */
  parseUpTo?: number;
  /** Minimum confidence threshold for spans */
  minConfidence?: number;
  /** Concept patterns to match */
  patterns?: ConceptPattern[];
}

export interface ConceptPattern {
  regex: RegExp;
  type: RhetoricalSpanType;
  confidence: number;
  /** Function to extract conceptId if available */
  conceptExtractor?: (match: RegExpMatchArray) => string | undefined;
}

const DEFAULT_PATTERNS: ConceptPattern[] = [
  // Bold text (markdown) - high confidence concepts
  {
    regex: /\*\*([^*]+)\*\*/g,
    type: 'concept',
    confidence: 0.9
  },
  // Grove-specific terms
  {
    regex: /\b(Ratchet|Trellis|Sprout|Grove|DEX|Kinetic)\b/gi,
    type: 'entity',
    confidence: 0.95
  },
  // Action phrases
  {
    regex: /→\s*([^.!?\n]+)/g,
    type: 'action',
    confidence: 0.8
  }
];


export function parseRhetoricalSkeleton(
  content: string,
  options: ParseOptions = {}
): RhetoricalMap {
  const {
    parseUpTo = content.length,
    minConfidence = 0.7,
    patterns = DEFAULT_PATTERNS
  } = options;
  
  // Find last complete sentence boundary for stable hydration
  const stableIndex = findLastSentenceBoundary(content, parseUpTo);
  const parseableContent = content.slice(0, stableIndex);
  
  const spans: RhetoricalSpan[] = [];
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    
    while ((match = regex.exec(parseableContent)) !== null) {
      const text = match[1] || match[0];
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      if (pattern.confidence >= minConfidence) {
        spans.push({
          id: `span_${startIndex}_${endIndex}`,
          text,
          type: pattern.type,
          startIndex,
          endIndex,
          confidence: pattern.confidence,
          conceptId: pattern.conceptExtractor?.(match)
        });
      }
    }
  }
  
  // Deduplicate overlapping spans (keep highest confidence)
  const dedupedSpans = deduplicateSpans(spans);
  
  return {
    spans: dedupedSpans,
    sentenceCount: countSentences(parseableContent),
    parsedAt: Date.now()
  };
}
```

### 5.2 Navigation Parser

Extract `<navigation>` blocks from LLM output:

```typescript
// src/core/transformers/NavigationParser.ts

export interface ParsedNavigation {
  forks: JourneyFork[];
  cleanContent: string;  // Content with <navigation> block removed
}

export function parseNavigation(rawContent: string): ParsedNavigation {
  const navigationRegex = /<navigation>([\s\S]*?)<\/navigation>/i;
  const match = rawContent.match(navigationRegex);
  
  if (!match) {
    return {
      forks: [],
      cleanContent: rawContent
    };
  }
  
  const navigationBlock = match[1];
  const cleanContent = rawContent.replace(navigationRegex, '').trim();
  
  // Parse the navigation block (expected format is JSON or structured text)
  const forks = parseNavigationBlock(navigationBlock);
  
  return {
    forks,
    cleanContent
  };
}

function parseNavigationBlock(block: string): JourneyFork[] {
  try {
    // Try JSON first
    const parsed = JSON.parse(block.trim());
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeFork);
    }
    if (parsed.forks && Array.isArray(parsed.forks)) {
      return parsed.forks.map(normalizeFork);
    }
  } catch {
    // Fall back to structured text parsing
    return parseStructuredTextNavigation(block);
  }
  
  return [];
}

function normalizeFork(raw: Record<string, any>): JourneyFork {
  return {
    id: raw.id || `fork_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    label: raw.label || raw.text || 'Continue',
    type: normalizeType(raw.type),
    targetId: raw.targetId || raw.target,
    queryPayload: raw.query || raw.queryPayload,
    context: raw.context
  };
}
```

---

## Part VI: Interaction Specification

### 6.1 The Pivot Mechanic

When a user clicks an "Orange Highlight" (concept span), the system should:

1. **Capture Context:** Record which response the concept appeared in
2. **Construct Query:** Build a context-aware query focusing on that concept
3. **Auto-Submit:** Immediately send the query without requiring Enter
4. **Track Provenance:** The new QueryItem records its pivot origin

```typescript
// Event handling in Terminal or parent component

const handleSpanClick = (span: RhetoricalSpan, responseId: string) => {
  // Find the source response for context
  const sourceResponse = items.find(
    item => item.id === responseId && isResponseItem(item)
  ) as ResponseItem | undefined;
  
  // Construct the pivot query
  const pivotQuery: QueryItem = {
    id: generateId('query'),
    type: 'query',
    timestamp: Date.now(),
    isVisible: true,
    content: `Tell me more about ${span.text}`,
    pivot: {
      sourceResponseId: responseId,
      sourceText: span.text,
      sourceContext: sourceResponse?.content.slice(0, 500) || '',
      targetId: span.conceptId
    }
  };
  
  // Dispatch to machine - auto-submit
  send({ 
    type: 'USER.CLICK_PIVOT', 
    span,
    responseId 
  });
};
```


### 6.2 Fork Selection

When a user clicks a Journey Fork button:

1. **Determine Action:** Based on fork type:
   - `deep_dive`: Go deeper into current topic
   - `pivot`: Branch to related topic
   - `apply`: Transition to action/application

2. **Use queryPayload:** If the fork has a pre-composed query, use it directly
3. **Inject Context:** If fork has context, include it in the API call
4. **Navigate if targetId:** If fork points to a specific journey/node, navigate there

```typescript
const handleForkSelect = (fork: JourneyFork, responseId: string) => {
  if (fork.targetId) {
    // Navigate to specific content
    router.push(`/journeys/${fork.targetId}`);
    return;
  }
  
  // Construct query from fork
  const forkQuery: QueryItem = {
    id: generateId('query'),
    type: 'query',
    timestamp: Date.now(),
    isVisible: true,
    content: fork.queryPayload || fork.label,
    intent: fork.type
  };
  
  send({ 
    type: 'USER.SELECT_FORK', 
    fork, 
    responseId 
  });
};
```

### 6.3 Cognitive State Visibility

System events should pulse subtly above the active response:

```typescript
// components/Terminal/Stream/blocks/SystemEventBlock.tsx

export const SystemEventBlock: React.FC<{ item: SystemEventItem }> = ({ item }) => {
  const stateIcons: Record<CognitiveState, string> = {
    considering: '💭',
    retrieving: '📚',
    synthesizing: '🔗',
    generating: '✨',
    complete: '✓'
  };
  
  const stateLabels: Record<CognitiveState, string> = {
    considering: 'Considering context...',
    retrieving: 'Retrieving knowledge...',
    synthesizing: 'Connecting patterns...',
    generating: 'Composing response...',
    complete: 'Complete'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-white/5 text-white/40 text-xs",
        "w-fit mx-auto"
      )}
    >
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {stateIcons[item.state]}
      </motion.span>
      <span>{item.message || stateLabels[item.state]}</span>
    </motion.div>
  );
};
```

---

## Part VII: Visual Specification

### 7.1 Glass Panel System

CSS tokens for glassmorphism hierarchy:

```css
/* In globals.css - extend existing chat tokens */

:root {
  /* Glass Hierarchy */
  --glass-bg-primary: rgba(255, 255, 255, 0.03);
  --glass-bg-secondary: rgba(255, 255, 255, 0.05);
  --glass-bg-elevated: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-bright: rgba(255, 255, 255, 0.12);
  
  /* Concept Highlighting (Orange System) */
  --chat-concept-text: #ff9940;
  --chat-concept-bg: rgba(255, 153, 64, 0.15);
  --chat-concept-bg-hover: rgba(255, 153, 64, 0.25);
  --chat-concept-border: rgba(255, 153, 64, 0.3);
  --chat-concept-active: rgba(255, 153, 64, 0.4);
  
  /* Fork Button Variants */
  --fork-primary-bg: var(--chat-concept-bg);
  --fork-primary-text: var(--chat-concept-text);
  --fork-secondary-bg: rgba(255, 255, 255, 0.1);
  --fork-secondary-text: rgba(255, 255, 255, 0.8);
  --fork-tertiary-border: rgba(255, 255, 255, 0.2);
  --fork-tertiary-text: rgba(255, 255, 255, 0.6);
  
  /* Streaming Animation */
  --stream-cursor-color: var(--chat-concept-text);
  --stream-pulse-color: rgba(255, 153, 64, 0.2);
}
```


### 7.2 GlassPanel Component

```typescript
// components/Terminal/Stream/motion/GlassPanel.tsx

interface GlassPanelProps {
  variant?: 'query' | 'response' | 'system' | 'navigation';
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'response',
  children,
  className
}) => {
  return (
    <div
      className={cn(
        "rounded-xl backdrop-blur-sm border transition-all duration-300",
        variant === 'query' && [
          "bg-[var(--glass-bg-elevated)]",
          "border-[var(--glass-border-bright)]",
          "ml-auto max-w-[85%]",
          "p-4"
        ],
        variant === 'response' && [
          "bg-[var(--glass-bg-primary)]",
          "border-[var(--glass-border)]",
          "p-6"
        ],
        variant === 'system' && [
          "bg-transparent",
          "border-none",
          "py-2"
        ],
        variant === 'navigation' && [
          "bg-[var(--glass-bg-secondary)]",
          "border-[var(--glass-border)]",
          "p-4"
        ],
        className
      )}
    >
      {children}
    </div>
  );
};
```

### 7.3 Concept Span Styling

```typescript
// Interactive span component for concepts

export const ConceptSpan: React.FC<{
  span: RhetoricalSpan;
  onClick?: () => void;
}> = ({ span, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <span className="relative inline">
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer transition-all duration-200",
          "text-[var(--chat-concept-text)]",
          "hover:bg-[var(--chat-concept-bg-hover)]",
          "rounded px-0.5 -mx-0.5",
          "border-b border-[var(--chat-concept-border)] border-dashed",
          "hover:border-solid"
        )}
      >
        {span.text}
      </button>
      
      {/* Lens Peek Hover Card */}
      {isHovered && span.definition && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute z-50 bottom-full left-0 mb-2",
            "bg-[var(--glass-bg-elevated)] backdrop-blur-lg",
            "border border-[var(--glass-border-bright)]",
            "rounded-lg p-3 max-w-xs",
            "text-sm text-white/80"
          )}
        >
          <p>{span.definition}</p>
          {span.connectionCount && (
            <p className="text-xs text-white/40 mt-2">
              Connected to {span.connectionCount} nodes
            </p>
          )}
        </motion.div>
      )}
    </span>
  );
};
```

---

## Part VIII: Integration Specification

### 8.1 TerminalChat Migration Path

The migration preserves backward compatibility while enabling the new rendering:

```typescript
// components/Terminal/TerminalChat.tsx (modified)

export const TerminalChat: React.FC = () => {
  const { state } = useEngagement();
  
  // Feature flag for gradual rollout
  const useKineticStream = useFeatureFlag('kinetic-stream') ?? true;
  
  // Get stream items from machine context
  const streamItems = useSelector(selectStreamItems);
  const activeItemId = useSelector(selectActiveItemId);
  
  const handleSpanClick = useCallback((span: RhetoricalSpan, responseId: string) => {
    send({ type: 'USER.CLICK_PIVOT', span, responseId });
  }, [send]);
  
  const handleForkSelect = useCallback((fork: JourneyFork, responseId: string) => {
    send({ type: 'USER.SELECT_FORK', fork, responseId });
  }, [send]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {useKineticStream ? (
          <StreamRenderer
            items={streamItems}
            activeItemId={activeItemId}
            onSpanClick={handleSpanClick}
            onForkSelect={handleForkSelect}
          />
        ) : (
          // Legacy rendering path (for rollback)
          <LegacyMessageList messages={messages} />
        )}
      </div>
      
      {/* Cognitive Bridge injection point preserved */}
      {state.matches('active.generating') && (
        <CognitiveBridge />
      )}
      
      {/* Input area */}
      <CommandInput />
    </div>
  );
};
```


### 8.2 Engagement Machine Extensions

Add new events and state handling:

```typescript
// src/core/engagement/machine.ts (extend existing)

// Add to machine context
interface ExtendedContext {
  // ... existing context
  stream: StreamItem[];
  currentStreamItem: StreamItem | null;
  cognitiveState: CognitiveState;
}

// Add handling in the machine definition
{
  states: {
    active: {
      states: {
        idle: {
          on: {
            'USER.SUBMIT_QUERY': {
              target: 'processing',
              actions: ['appendQueryItem', 'clearCurrentItem']
            },
            'USER.CLICK_PIVOT': {
              target: 'processing',
              actions: ['constructPivotQuery', 'appendQueryItem']
            },
            'USER.SELECT_FORK': {
              target: 'processing', 
              actions: ['constructForkQuery', 'appendQueryItem']
            }
          }
        },
        processing: {
          entry: ['setCognitiveState_considering'],
          invoke: {
            src: 'streamingChat',
            onDone: {
              target: 'idle',
              actions: ['finalizeResponseItem', 'setCognitiveState_complete']
            }
          },
          on: {
            'SYSTEM.STREAM_CHUNK': {
              actions: ['appendToCurrentItem', 'maybeUpdateRhetoric']
            },
            'SYSTEM.SENTENCE_COMPLETE': {
              actions: ['parseRhetoricUpToSentence']
            },
            'SYSTEM.PARSE_NAVIGATION': {
              actions: ['attachNavigationToResponse']
            },
            'SYSTEM.COGNITIVE_STATE': {
              actions: ['updateCognitiveState']
            }
          }
        }
      }
    }
  }
}
```

---

## Part IX: Testing Specification

### 9.1 Unit Tests

Each new component and parser requires unit tests:

| Test File | Coverage |
|-----------|----------|
| `tests/unit/stream-schema.test.ts` | StreamItem construction, type guards |
| `tests/unit/rhetorical-skeleton.test.ts` | Parser output, stable hydration |
| `tests/unit/navigation-parser.test.ts` | `<navigation>` extraction |
| `tests/unit/span-renderer.test.ts` | Index-based span injection |

### 9.2 Integration Tests

Machine and component integration:

| Test File | Coverage |
|-----------|----------|
| `tests/integration/stream-machine.test.ts` | Event → State transitions |
| `tests/integration/pivot-flow.test.ts` | Click → Query → Response flow |
| `tests/integration/fork-selection.test.ts` | Fork → Navigation flow |

### 9.3 E2E Tests

Full user journey testing:

```typescript
// tests/e2e/kinetic-stream.spec.ts

test.describe('Kinetic Stream Experience', () => {
  test('user query renders in stream', async ({ page }) => {
    await page.goto('/terminal');
    await page.fill('[data-testid="command-input"]', 'Explain the Ratchet');
    await page.press('[data-testid="command-input"]', 'Enter');
    
    await expect(page.locator('[data-testid="query-block"]'))
      .toContainText('Explain the Ratchet');
  });
  
  test('response shows orange highlights', async ({ page }) => {
    await page.goto('/terminal');
    await submitQuery(page, 'What is Grove?');
    
    await expect(page.locator('[data-testid="concept-span"]')).toBeVisible();
    await expect(page.locator('[data-testid="concept-span"]'))
      .toHaveCSS('color', 'rgb(255, 153, 64)');  // Orange
  });
  
  test('clicking concept span triggers pivot', async ({ page }) => {
    await page.goto('/terminal');
    await submitQuery(page, 'What is Grove?');
    
    const conceptSpan = page.locator('[data-testid="concept-span"]').first();
    const conceptText = await conceptSpan.textContent();
    
    await conceptSpan.click();
    
    // Verify new query was auto-submitted
    await expect(page.locator('[data-testid="query-block"]').last())
      .toContainText(`Tell me more about ${conceptText}`);
  });
  
  test('journey forks appear after response', async ({ page }) => {
    await page.goto('/terminal');
    await submitQuery(page, 'Explain the Trellis Architecture');
    
    await expect(page.locator('[data-testid="navigation-block"]')).toBeVisible();
    await expect(page.locator('[data-testid="fork-button"]')).toHaveCount(3);
  });
  
  test('clicking fork submits new query', async ({ page }) => {
    await page.goto('/terminal');
    await submitQuery(page, 'What is DEX?');
    
    const forkButton = page.locator('[data-testid="fork-button"]').first();
    const forkLabel = await forkButton.textContent();
    
    await forkButton.click();
    
    await expect(page.locator('[data-testid="query-block"]').last())
      .toContainText(forkLabel);
  });
});
```


---

## Part X: Sprint Breakdown

### Sprint 1: The Stream Contract (Week 1)

**Goal:** Schema and state machine foundation. No UI changes yet.

**Stories:**

1.1 **Enhanced StreamItem Schema**
- Implement discriminated union types per Section III
- Add type guards and helper functions
- Write schema validation tests
- Files: `src/core/schema/stream.ts`

1.2 **Engagement Machine Events**
- Add new event types to machine definition
- Implement `appendQueryItem`, `appendResponseItem` actions
- Implement `updateCognitiveState` action
- Wire pivot and fork event handlers
- Files: `src/core/engagement/machine.ts`, `types.ts`

1.3 **RhetoricalSkeleton Parser**
- Implement stable hydration logic
- Add configurable concept patterns
- Write parser unit tests
- Files: `src/core/transformers/RhetoricalSkeleton.ts`

1.4 **Navigation Parser**
- Implement `<navigation>` block extraction
- Handle JSON and structured text formats
- Write parser unit tests
- Files: `src/core/transformers/NavigationParser.ts`

**Build Gate:**
```bash
npm test -- tests/unit/stream-schema.test.ts
npm test -- tests/unit/rhetorical-skeleton.test.ts
npm test -- tests/unit/navigation-parser.test.ts
```

---

### Sprint 2: The Polymorphic Renderer (Week 2)

**Goal:** New rendering layer. Legacy rendering still exists as fallback.

**Stories:**

2.1 **StreamRenderer Implementation**
- Polymorphic dispatch by item type
- AnimatePresence for smooth transitions
- Wire to TerminalChat (conditional)
- Files: `components/Terminal/Stream/StreamRenderer.tsx`

2.2 **Block Components**
- QueryBlock (simple, shows pivot context if present)
- SystemEventBlock (cognitive state display)
- LensRevealBlock (object card in stream)
- Files: `components/Terminal/Stream/blocks/`

2.3 **ActiveResponseBlock**
- Response container with GlassPanel
- SpanRenderer integration
- Inline NavigationBlock mounting point
- Files: `components/Terminal/Stream/blocks/ActiveResponseBlock.tsx`

2.4 **SpanRenderer**
- Index-based span injection
- ConceptSpan interactive component
- Lens Peek hover card
- Files: `components/Terminal/Stream/SpanRenderer.tsx`

2.5 **NavigationBlock**
- Fork button rendering
- Fork type visual hierarchy
- Click handler wiring
- Files: `components/Terminal/Stream/blocks/NavigationBlock.tsx`

**Build Gate:**
```bash
npm test -- tests/unit/span-renderer.test.ts
npm test -- tests/integration/stream-machine.test.ts
npx playwright test tests/e2e/kinetic-stream.spec.ts
```

---

### Sprint 3: The Glass Experience (Week 3)

**Goal:** Visual polish and interaction refinement.

**Stories:**

3.1 **GlassPanel CSS System**
- Define glass hierarchy tokens
- Implement blur/opacity variants
- Apply to all block components
- Files: `styles/globals.css`, `components/Terminal/Stream/motion/GlassPanel.tsx`

3.2 **Entrance Choreography**
- Staggered fade-in for stream items
- Journey fork slide-up animation
- Concept highlight warmth spread
- Files: `components/Terminal/Stream/motion/variants.ts`

3.3 **Cognitive State Visibility**
- Pulsing state indicators
- Subtle positioning above response
- State transition animations
- Files: `components/Terminal/Stream/blocks/SystemEventBlock.tsx`

3.4 **Streaming Text Animation**
- Cursor animation during generation
- Progressive reveal of concepts
- Smooth sentence completion
- Files: `components/Terminal/Stream/StreamingText.tsx`

3.5 **Legacy Cleanup**
- Remove old chat bubble styling
- Remove floating suggestion widget
- Remove regex-based highlighting
- Archive deprecated components

**Build Gate:**
```bash
npm test
npx playwright test
npx playwright test tests/e2e/*-baseline.spec.ts
```

---

## Part XI: Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| Breaking existing chat during migration | Feature flag + parallel rendering paths |
| Performance degradation from real-time parsing | Sentence-boundary hydration, debouncing |
| XState machine complexity explosion | Incremental event additions, clear docs |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| LLM not outputting `<navigation>` reliably | Fallback to generated suggestions |
| Glass effects slow on low-end devices | CSS-only blur, reduced motion preference |
| Pivot context not improving RAG quality | Iterative prompt tuning |

### Low Risk

| Risk | Mitigation |
|------|------------|
| User confusion with new patterns | Affordances, subtle animations |
| Mobile experience issues | Out of scope for v2; future sprint |
