# Execution Prompt: kinetic-stream-schema-v1

**Self-contained handoff for Claude Code CLI execution**

---

## Quick Start

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# Read sprint context
cat docs/sprints/kinetic-stream-schema-v1/SPEC.md
cat docs/sprints/kinetic-stream-schema-v1/ARCHITECTURE.md

# Verify current state
npm run build
npm test
```

---

## Project Context

**Repository:** `C:\GitHub\the-grove-foundation`  
**Branch:** Create `feature/kinetic-stream-schema-v1`  
**Sprint:** kinetic-stream-schema-v1  
**Goal:** Define StreamItem schema, create RhetoricalParser, wire to engagement machine

---

## What You're Building

1. **StreamItem Schema** - Typed message objects for the chat stream
2. **RhetoricalParser** - Extract spans from markdown content  
3. **Machine Integration** - Wire parser to engagement machine

**NOT building:** UI components (that's Sprint 2)

---

## Epic 1: Schema Foundation

### Task 1.1: Create Stream Schema

Create `src/core/schema/stream.ts`:

```typescript
// src/core/schema/stream.ts
// StreamItem and RhetoricalSpan types for Kinetic Stream
// Sprint: kinetic-stream-schema-v1

import { JourneyPath } from './journey';

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM TYPES
// ─────────────────────────────────────────────────────────────────

export type StreamItemType = 
  | 'query'       // User input
  | 'response'    // AI response
  | 'navigation'  // Journey fork
  | 'reveal'      // Concept reveal
  | 'system';     // Status messages

// ─────────────────────────────────────────────────────────────────
// RHETORICAL SPANS
// ─────────────────────────────────────────────────────────────────

export type RhetoricalSpanType = 
  | 'concept'  // Bold phrases
  | 'action'   // Arrow prompts
  | 'entity';  // Named entities

export interface RhetoricalSpan {
  id: string;
  text: string;
  type: RhetoricalSpanType;
  startIndex: number;
  endIndex: number;
  conceptId?: string;
  confidence?: number;
}

// ─────────────────────────────────────────────────────────────────
// STREAM ITEM
// ─────────────────────────────────────────────────────────────────

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

import type { ChatMessage } from '../../../types';

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

### Task 1.2: Update Schema Index

Add to `src/core/schema/index.ts`:

```typescript
export * from './stream';
```

### Verify Epic 1

```bash
npm run typecheck
# Expect: 0 errors
```

---

## Epic 2: Rhetorical Parser

### Task 2.1: Create Parser

Create `src/core/transformers/RhetoricalParser.ts`:

```typescript
// src/core/transformers/RhetoricalParser.ts
// Parse markdown content to extract rhetorical spans
// Sprint: kinetic-stream-schema-v1

import { RhetoricalSpan, RhetoricalSpanType } from '../schema/stream';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface ParseResult {
  spans: RhetoricalSpan[];
  content: string;
}

// ─────────────────────────────────────────────────────────────────
// PATTERNS
// ─────────────────────────────────────────────────────────────────

const PATTERNS = {
  bold: /\*\*([^*]+)\*\*/g,
  arrow: /^(?:→|->)\s+(.+)$/gm,
} as const;

// ─────────────────────────────────────────────────────────────────
// ID GENERATION
// ─────────────────────────────────────────────────────────────────

let spanIdCounter = 0;

function generateSpanId(): string {
  return `span_${++spanIdCounter}_${Date.now()}`;
}

// ─────────────────────────────────────────────────────────────────
// PARSER
// ─────────────────────────────────────────────────────────────────

export function parse(content: string): ParseResult {
  if (!content) {
    return { spans: [], content: '' };
  }

  const spans: RhetoricalSpan[] = [];
  let match: RegExpExecArray | null;
  
  // Extract bold (concepts)
  const boldRegex = new RegExp(PATTERNS.bold.source, 'g');
  while ((match = boldRegex.exec(content)) !== null) {
    spans.push({
      id: generateSpanId(),
      text: match[1],
      type: 'concept',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 1.0
    });
  }
  
  // Extract arrows (actions)
  const arrowRegex = new RegExp(PATTERNS.arrow.source, 'gm');
  while ((match = arrowRegex.exec(content)) !== null) {
    spans.push({
      id: generateSpanId(),
      text: match[1],
      type: 'action',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      confidence: 1.0
    });
  }
  
  // Sort by position
  spans.sort((a, b) => a.startIndex - b.startIndex);
  
  return { spans, content };
}

export function parseByType(
  content: string, 
  type: RhetoricalSpanType
): RhetoricalSpan[] {
  return parse(content).spans.filter(s => s.type === type);
}

export function hasRhetoricalContent(content: string): boolean {
  if (!content) return false;
  return PATTERNS.bold.test(content) || PATTERNS.arrow.test(content);
}
```

### Task 2.2: Update Transformers Index

Add to `src/core/transformers/index.ts`:

```typescript
export * from './RhetoricalParser';
```

### Verify Epic 2

```bash
npm run typecheck
```

---

## Epic 3: Machine Integration

### Task 3.1: Extend Engagement Types

In `src/core/engagement/types.ts`, add to EngagementContext:

```typescript
import { StreamItem } from '../schema/stream';

// Add to EngagementContext interface:
currentStreamItem: StreamItem | null;
streamHistory: StreamItem[];
```

### Task 3.2: Add Stream Actions

In `src/core/engagement/actions.ts`, add:

```typescript
import { parse } from '../transformers/RhetoricalParser';
import { StreamItem } from '../schema/stream';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const createQueryItem = assign<EngagementContext>({
  currentStreamItem: (_, event: any) => ({
    id: generateId(),
    type: 'query' as const,
    content: event.prompt || '',
    timestamp: Date.now(),
    createdBy: 'user' as const,
    role: 'user' as const
  }),
  streamHistory: (ctx) => [...ctx.streamHistory]
});

export const createResponseItem = assign<EngagementContext>({
  currentStreamItem: () => ({
    id: generateId(),
    type: 'response' as const,
    content: '',
    timestamp: Date.now(),
    createdBy: 'ai' as const,
    role: 'assistant' as const,
    isGenerating: true
  })
});

export const appendToResponse = assign<EngagementContext>({
  currentStreamItem: (ctx, event: any) => {
    if (!ctx.currentStreamItem) return null;
    return {
      ...ctx.currentStreamItem,
      content: ctx.currentStreamItem.content + (event.chunk || '')
    };
  }
});

export const finalizeResponse = assign<EngagementContext>({
  currentStreamItem: (ctx) => {
    if (!ctx.currentStreamItem) return null;
    const { spans } = parse(ctx.currentStreamItem.content);
    return {
      ...ctx.currentStreamItem,
      isGenerating: false,
      parsedSpans: spans
    };
  },
  streamHistory: (ctx) => {
    if (!ctx.currentStreamItem) return ctx.streamHistory;
    return [...ctx.streamHistory, ctx.currentStreamItem];
  }
});
```

### Task 3.3: Wire to Machine

In `src/core/engagement/machine.ts`:

1. Add new actions to initial context:
```typescript
currentStreamItem: null,
streamHistory: [],
```

2. Wire actions to transitions (additive to existing):
```typescript
// On START_GENERATE
actions: ['createQueryItem', 'createResponseItem', /* existing actions */]

// On STREAM_CHUNK (if exists)
actions: ['appendToResponse', /* existing */]

// On COMPLETE
actions: ['finalizeResponse', /* existing */]
```

### Verify Epic 3

```bash
npm run typecheck
npm test
npx playwright test tests/e2e/terminal-baseline.spec.ts
```

---

## Epic 4: Testing

### Task 4.1: Create Parser Tests

Create `tests/unit/RhetoricalParser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parse, parseByType, hasRhetoricalContent } from '@/core/transformers/RhetoricalParser';

describe('RhetoricalParser', () => {
  describe('parse()', () => {
    it('extracts bold as concept spans', () => {
      const result = parse('The **Grove** is distributed AI.');
      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].text).toBe('Grove');
      expect(result.spans[0].type).toBe('concept');
    });

    it('extracts arrows as action spans', () => {
      const result = parse('→ Tell me more');
      expect(result.spans).toHaveLength(1);
      expect(result.spans[0].text).toBe('Tell me more');
      expect(result.spans[0].type).toBe('action');
    });

    it('handles empty content', () => {
      const result = parse('');
      expect(result.spans).toHaveLength(0);
    });

    it('sorts spans by position', () => {
      const result = parse('**First** then **Second**');
      expect(result.spans[0].text).toBe('First');
      expect(result.spans[1].text).toBe('Second');
    });
  });

  describe('hasRhetoricalContent()', () => {
    it('returns true for bold', () => {
      expect(hasRhetoricalContent('**test**')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(hasRhetoricalContent('plain text')).toBe(false);
    });
  });
});
```

### Final Verification

```bash
npm run build
npm test
npx playwright test
```

---

## Troubleshooting

### Type Errors

If ChatMessage import fails:
```typescript
// Try relative import
import type { ChatMessage } from '../../../types';
```

### Test Failures

If visual regression fails:
```bash
# Update baselines if changes are intentional
npx playwright test --update-snapshots
```

### Machine Not Wiring

Check that actions are exported from actions.ts and imported in machine.ts.

---

## Completion Checklist

- [ ] `src/core/schema/stream.ts` created
- [ ] `src/core/transformers/RhetoricalParser.ts` created
- [ ] Engagement types extended
- [ ] Engagement actions added
- [ ] Machine wired
- [ ] Tests created and passing
- [ ] Build succeeds
- [ ] Visual regression passes

---

## Next Steps (Sprint 2)

After this sprint completes, Sprint 2 will:
1. Create StreamRenderer component
2. Build ActiveResponseBlock with span rendering
3. Build NavigationBlock with path buttons
4. Wire to Terminal

---

*Execution prompt created: December 2024*
