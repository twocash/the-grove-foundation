# Technical Specification: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2
**Version:** 1.0
**Author:** Claude Code
**Date:** December 28, 2025

---

## Table of Contents

1. [Pattern Check (Phase 0)](#pattern-check-phase-0)
2. [Canonical Source Audit (Phase 0.5)](#canonical-source-audit-phase-05)
3. [Scope Adjustment](#scope-adjustment)
4. [Schema Specification](#schema-specification)
5. [Parser Specification](#parser-specification)
6. [Machine Specification](#machine-specification)
7. [Component Specification](#component-specification)
8. [CSS Token Specification](#css-token-specification)
9. [Integration Points](#integration-points)
10. [DEX Compliance](#dex-compliance)

---

## Pattern Check (Phase 0)

Per PROJECT_PATTERNS.md mandatory review, the following pattern alignment applies:

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| StreamItem discriminated union | Pattern 3: Narrative Schema | Add to `src/core/schema/stream.ts` following existing schema conventions |
| State machine events | Pattern 2: Engagement Machine | Add events to `src/core/engagement/types.ts` and handlers to `machine.ts` |
| Fork button styling | Pattern 4: Token Namespaces | Extend `--chat-*` namespace with `--fork-*` tokens |
| Span rendering | Pattern 8: Canonical Source | SpanRenderer is canonical home; ResponseBlock invokes it |
| Fork navigation | Pattern 8: Canonical Source | NavigationBlock is canonical home for fork rendering |
| Content reactivity | Pattern 1: Quantum Interface | StreamItem types can optionally honor lens context |

### New Patterns Proposed

**Pattern 11: Semantic Content Hydration**

The RhetoricalParser + SpanRenderer system represents a new architectural pattern:

```
Raw Text (Markdown)
       ↓
  RhetoricalParser (declarative patterns)
       ↓
  RhetoricalMap (semantic spans with indices)
       ↓
  SpanRenderer (index-based injection)
       ↓
  Interactive UI (clickable concepts)
```

**Why Existing Patterns Insufficient:**
- Pattern 1 (Quantum Interface) handles lens-based content switching but not semantic extraction
- Pattern 3 (Narrative Schema) handles structured data but not runtime text parsing
- This pattern bridges raw LLM output to structured UI without requiring model changes

**Recommendation:** Document as Pattern 11 in PROJECT_PATTERNS.md after sprint completion.

---

## Canonical Source Audit (Phase 0.5)

### Sources of Truth

| Domain | Canonical File | Current State |
|--------|---------------|---------------|
| Stream types | `src/core/schema/stream.ts` | Needs enhancement |
| Machine events | `src/core/engagement/types.ts` | Needs extension |
| Machine logic | `src/core/engagement/machine.ts` | Mostly complete |
| Rhetorical parsing | `src/core/transformers/RhetoricalParser.ts` | Complete |
| Stream rendering | `components/Terminal/Stream/StreamRenderer.tsx` | Complete |
| Span rendering | `components/Terminal/Stream/SpanRenderer.tsx` | Complete |
| Response display | `components/Terminal/Stream/blocks/ResponseBlock.tsx` | Needs enhancement |
| Navigation display | `components/Terminal/Stream/blocks/NavigationBlock.tsx` | Needs enhancement |
| CSS tokens | `styles/globals.css` | Needs extension |

### What Already Exists (Preserve)

1. **StreamItem → StreamRenderer flow** - Working end-to-end
2. **RhetoricalParser.ts** - Extracts bold/arrow spans, used by machine
3. **SpanRenderer.tsx** - Index-based span injection with click handlers
4. **GlassPanel.tsx** - Intensity variants with proper CSS
5. **Motion variants** - Complete animation system
6. **StreamingText.tsx** - Character reveal animation

### What Needs Creation

1. **NavigationParser.ts** - Extract `<navigation>` blocks from LLM output
2. **JourneyFork types** - Discriminated fork type with `deep_dive | pivot | apply`
3. **ForkButton component** - Replace SuggestionChip in NavigationBlock
4. **Pivot context in QueryBlock** - Show source when query came from pivot

### What Needs Enhancement

1. **stream.ts** - Convert to discriminated union, add missing types
2. **engagement/types.ts** - Add pivot/fork events
3. **ResponseBlock.tsx** - Add inline NavigationBlock mounting
4. **NavigationBlock.tsx** - Add fork type visual hierarchy

---

## Scope Adjustment

Based on REPO_AUDIT.md findings, the requirements scope is **reduced**:

### In Scope

| Epic | Stories | Effort |
|------|---------|--------|
| Schema Enhancement | Discriminated union, JourneyFork type, pivot context | 4h |
| Navigation Parser | `<navigation>` extraction, fallback handling | 3h |
| Machine Events | Pivot/fork events, handlers | 2h |
| NavigationBlock Enhancement | Fork types, ForkButton, visual hierarchy | 4h |
| ResponseBlock Enhancement | Inline navigation mounting | 2h |
| CSS Tokens | Fork button variants | 1h |

**Total Estimated Effort:** 16 hours (vs original 3 weeks)

### Out of Scope (Already Complete)

- StreamRenderer polymorphic dispatch
- SpanRenderer index-based rendering
- GlassPanel component and CSS
- Motion variants
- StreamingText component
- TerminalChat → StreamRenderer integration
- Basic rhetorical parsing

### Deferred (Future Sprint)

- CognitiveTraceBar component
- Cognitive state visibility (considering, synthesizing, etc.)
- Pivot context injection into API calls
- Schema versioning for P2P sync

---

## Schema Specification

### File: `src/core/schema/stream.ts`

**Changes Required:**

```typescript
// ADD: Discriminated union types
// PRESERVE: Existing JourneyPath, StreamItemType, RhetoricalSpan

// NEW: Journey Fork (replaces JourneyPath for new navigation)
export type JourneyForkType = 'deep_dive' | 'pivot' | 'apply';

export interface JourneyFork {
  id: string;
  label: string;
  type: JourneyForkType;
  targetId?: string;        // Link to journey/node
  queryPayload?: string;    // Pre-composed query
  context?: string;         // Context to inject
}

// NEW: Pivot context for queries
export interface PivotContext {
  sourceResponseId: string;
  sourceText: string;
  sourceContext: string;
  targetId?: string;
}

// ENHANCED: Base interface
interface BaseStreamItem {
  id: string;
  timestamp: number;
  isVisible?: boolean;
  metadata?: Record<string, unknown>;
}

// NEW: Discriminated union variants
export interface QueryStreamItem extends BaseStreamItem {
  type: 'query';
  content: string;
  intent?: string;
  pivot?: PivotContext;
  role: 'user';
  createdBy: 'user';
}

export interface ResponseStreamItem extends BaseStreamItem {
  type: 'response';
  content: string;
  isGenerating: boolean;
  parsedSpans?: RhetoricalSpan[];
  suggestedPaths?: JourneyPath[];    // Legacy compat
  navigation?: JourneyFork[];        // New fork system
  role: 'assistant';
  createdBy: 'ai';
}

export interface NavigationStreamItem extends BaseStreamItem {
  type: 'navigation';
  forks: JourneyFork[];
  sourceResponseId: string;
}

export interface SystemStreamItem extends BaseStreamItem {
  type: 'system';
  content: string;
  createdBy: 'system';
}

// ENHANCED: Union type
export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem;

// ENHANCED: Type guards with proper narrowing
export function isQueryItem(item: StreamItem): item is QueryStreamItem {
  return item.type === 'query';
}

export function isResponseItem(item: StreamItem): item is ResponseStreamItem {
  return item.type === 'response';
}

export function isNavigationItem(item: StreamItem): item is NavigationStreamItem {
  return item.type === 'navigation';
}

export function hasNavigation(item: StreamItem): item is ResponseStreamItem & { navigation: JourneyFork[] } {
  return isResponseItem(item) && Array.isArray(item.navigation) && item.navigation.length > 0;
}
```

**Backward Compatibility:**
- Keep `JourneyPath` interface for existing code
- Keep `suggestedPaths` field on ResponseStreamItem
- `fromChatMessage` returns `QueryStreamItem | ResponseStreamItem`

---

## Parser Specification

### File: `src/core/transformers/NavigationParser.ts` (NEW)

```typescript
// src/core/transformers/NavigationParser.ts

import type { JourneyFork, JourneyForkType } from '../schema/stream';

export interface ParsedNavigation {
  forks: JourneyFork[];
  cleanContent: string;
}

const NAVIGATION_REGEX = /<navigation>([\s\S]*?)<\/navigation>/i;

/**
 * Extract <navigation> block from LLM output.
 * Returns cleaned content and parsed forks.
 */
export function parseNavigation(rawContent: string): ParsedNavigation {
  const match = rawContent.match(NAVIGATION_REGEX);

  if (!match) {
    return { forks: [], cleanContent: rawContent };
  }

  const navigationBlock = match[1];
  const cleanContent = rawContent.replace(NAVIGATION_REGEX, '').trim();

  const forks = parseNavigationBlock(navigationBlock);

  return { forks, cleanContent };
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
    // Fall back to line-based parsing
    return parseStructuredText(block);
  }

  return [];
}

function parseStructuredText(block: string): JourneyFork[] {
  const lines = block.trim().split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    const trimmed = line.trim();
    // Format: "→ Label" or "- Label" or just "Label"
    const text = trimmed.replace(/^[→\-•]\s*/, '');
    return {
      id: `fork_${Date.now()}_${i}`,
      label: text,
      type: inferForkType(text),
      queryPayload: text
    };
  });
}

function inferForkType(label: string): JourneyForkType {
  const lower = label.toLowerCase();
  if (lower.includes('deep') || lower.includes('more about') || lower.includes('explain')) {
    return 'deep_dive';
  }
  if (lower.includes('try') || lower.includes('apply') || lower.includes('how to')) {
    return 'apply';
  }
  return 'pivot';
}

function normalizeFork(raw: Record<string, unknown>): JourneyFork {
  return {
    id: String(raw.id || `fork_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    label: String(raw.label || raw.text || 'Continue'),
    type: normalizeType(raw.type),
    targetId: raw.targetId as string | undefined,
    queryPayload: String(raw.query || raw.queryPayload || raw.label || ''),
    context: raw.context as string | undefined
  };
}

function normalizeType(type: unknown): JourneyForkType {
  if (type === 'deep_dive' || type === 'pivot' || type === 'apply') {
    return type;
  }
  return 'pivot';
}
```

### Integration with RhetoricalParser

The existing `RhetoricalParser.ts` is complete. The `NavigationParser` is called **before** rhetorical parsing:

```typescript
// In machine.ts finalizeResponse action
const { forks, cleanContent } = parseNavigation(rawContent);
const { spans } = parse(cleanContent);
// Store both on ResponseStreamItem
```

---

## Machine Specification

### File: `src/core/engagement/types.ts`

**Add Events:**

```typescript
// ADD to EngagementEvent union
  | { type: 'USER.CLICK_PIVOT'; span: RhetoricalSpan; responseId: string }
  | { type: 'USER.SELECT_FORK'; fork: JourneyFork; responseId: string }
```

### File: `src/core/engagement/machine.ts`

**Add Actions:**

```typescript
actions: {
  // ... existing actions ...

  handlePivotClick: assign(({ context, event }) => {
    if (event.type !== 'USER.CLICK_PIVOT') return {};

    const pivotQuery: QueryStreamItem = {
      id: generateId(),
      type: 'query',
      content: `Tell me more about ${event.span.text}`,
      timestamp: Date.now(),
      role: 'user',
      createdBy: 'user',
      pivot: {
        sourceResponseId: event.responseId,
        sourceText: event.span.text,
        sourceContext: '', // Could extract from response
        targetId: event.span.conceptId
      }
    };

    return {
      currentStreamItem: pivotQuery,
      streamHistory: [...context.streamHistory, pivotQuery]
    };
  }),

  handleForkSelect: assign(({ context, event }) => {
    if (event.type !== 'USER.SELECT_FORK') return {};

    const forkQuery: QueryStreamItem = {
      id: generateId(),
      type: 'query',
      content: event.fork.queryPayload || event.fork.label,
      timestamp: Date.now(),
      role: 'user',
      createdBy: 'user',
      intent: event.fork.type
    };

    return {
      currentStreamItem: forkQuery,
      streamHistory: [...context.streamHistory, forkQuery]
    };
  })
}
```

**Add Event Handlers:**

```typescript
on: {
  // ... existing handlers ...

  'USER.CLICK_PIVOT': {
    actions: ['handlePivotClick']
  },

  'USER.SELECT_FORK': {
    actions: ['handleForkSelect']
  }
}
```

---

## Component Specification

### File: `components/Terminal/Stream/blocks/NavigationBlock.tsx`

**Complete Rewrite:**

```typescript
// components/Terminal/Stream/blocks/NavigationBlock.tsx

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { JourneyFork, JourneyForkType } from '../../../../src/core/schema/stream';
import { staggerContainer, staggerItem } from '../motion/variants';

export interface NavigationBlockProps {
  forks: JourneyFork[];
  onSelect?: (fork: JourneyFork) => void;
}

export const NavigationBlock: React.FC<NavigationBlockProps> = ({
  forks,
  onSelect
}) => {
  const grouped = useMemo(() => ({
    deep_dive: forks.filter(f => f.type === 'deep_dive'),
    pivot: forks.filter(f => f.type === 'pivot'),
    apply: forks.filter(f => f.type === 'apply')
  }), [forks]);

  if (forks.length === 0) return null;

  return (
    <motion.div
      className="mt-6 pt-4 border-t border-[var(--glass-border)] space-y-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      data-testid="navigation-block"
    >
      {grouped.deep_dive.length > 0 && (
        <ForkGroup forks={grouped.deep_dive} variant="primary" onSelect={onSelect} />
      )}
      {grouped.pivot.length > 0 && (
        <ForkGroup forks={grouped.pivot} variant="secondary" onSelect={onSelect} />
      )}
      {grouped.apply.length > 0 && (
        <ForkGroup forks={grouped.apply} variant="tertiary" onSelect={onSelect} />
      )}
    </motion.div>
  );
};

const ForkGroup: React.FC<{
  forks: JourneyFork[];
  variant: 'primary' | 'secondary' | 'tertiary';
  onSelect?: (fork: JourneyFork) => void;
}> = ({ forks, variant, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {forks.map(fork => (
      <motion.div key={fork.id} variants={staggerItem}>
        <ForkButton fork={fork} variant={variant} onClick={() => onSelect?.(fork)} />
      </motion.div>
    ))}
  </div>
);

const FORK_ICONS: Record<JourneyForkType, string> = {
  deep_dive: '↓',
  pivot: '→',
  apply: '✓'
};

const ForkButton: React.FC<{
  fork: JourneyFork;
  variant: 'primary' | 'secondary' | 'tertiary';
  onClick: () => void;
}> = ({ fork, variant, onClick }) => (
  <button
    onClick={onClick}
    className={`
      fork-button fork-button--${variant}
      px-4 py-2 rounded-full text-sm font-medium
      transition-all duration-200
      hover:scale-105 active:scale-95
    `}
    data-testid="fork-button"
  >
    <span className="mr-2">{FORK_ICONS[fork.type]}</span>
    {fork.label}
  </button>
);

export default NavigationBlock;
```

### File: `components/Terminal/Stream/blocks/ResponseBlock.tsx`

**Enhancement - Add Inline Navigation:**

```typescript
// CHANGE: Import NavigationBlock
import { NavigationBlock } from './NavigationBlock';
import { hasNavigation } from '../../../../src/core/schema/stream';

// CHANGE: Props
export interface ResponseBlockProps {
  item: ResponseStreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;  // NEW
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

// CHANGE: Inside component, after GlassPanel content
{/* Inline Navigation (Journey Forks) */}
{hasNavigation(item) && !item.isGenerating && (
  <NavigationBlock
    forks={item.navigation!}
    onSelect={onForkSelect}
  />
)}
```

---

## CSS Token Specification

### File: `styles/globals.css`

**Add after line 1206 (after --chat-entity-text):**

```css
/* ============================================
   FORK BUTTON TOKENS (kinetic-stream-reset-v2)
   Visual hierarchy for journey navigation
   ============================================ */

:root {
  /* Primary fork (deep_dive) - uses concept colors */
  --fork-primary-bg: rgba(217, 93, 57, 0.15);
  --fork-primary-text: #D95D39;
  --fork-primary-border: rgba(217, 93, 57, 0.3);
  --fork-primary-hover-bg: rgba(217, 93, 57, 0.25);

  /* Secondary fork (pivot) - subtle glass */
  --fork-secondary-bg: rgba(255, 255, 255, 0.08);
  --fork-secondary-text: var(--glass-text-secondary);
  --fork-secondary-border: var(--glass-border);
  --fork-secondary-hover-bg: rgba(255, 255, 255, 0.12);

  /* Tertiary fork (apply) - ghost button */
  --fork-tertiary-bg: transparent;
  --fork-tertiary-text: var(--glass-text-muted);
  --fork-tertiary-border: var(--glass-border);
  --fork-tertiary-hover-border: var(--glass-border-hover);
}

/* Fork button base */
.fork-button {
  display: inline-flex;
  align-items: center;
  border: 1px solid transparent;
  cursor: pointer;
}

.fork-button--primary {
  background: var(--fork-primary-bg);
  color: var(--fork-primary-text);
  border-color: var(--fork-primary-border);
}

.fork-button--primary:hover {
  background: var(--fork-primary-hover-bg);
}

.fork-button--secondary {
  background: var(--fork-secondary-bg);
  color: var(--fork-secondary-text);
  border-color: var(--fork-secondary-border);
}

.fork-button--secondary:hover {
  background: var(--fork-secondary-hover-bg);
}

.fork-button--tertiary {
  background: var(--fork-tertiary-bg);
  color: var(--fork-tertiary-text);
  border-color: var(--fork-tertiary-border);
}

.fork-button--tertiary:hover {
  border-color: var(--fork-tertiary-hover-border);
  color: var(--glass-text-secondary);
}
```

---

## Integration Points

### StreamRenderer Integration

```typescript
// components/Terminal/Stream/StreamRenderer.tsx

// CHANGE: Props
export interface StreamRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onSpanClick?: (span: RhetoricalSpan, responseId: string) => void;  // ADD responseId
  onForkSelect?: (fork: JourneyFork, responseId: string) => void;    // NEW
  onPromptSubmit?: (prompt: string) => void;
  bridgeState?: BridgeState;
  // ... rest unchanged
}

// CHANGE: StreamBlock case for response
case 'response':
  return (
    <ResponseBlock
      item={item as ResponseStreamItem}
      onSpanClick={(span) => onSpanClick?.(span, item.id)}
      onForkSelect={(fork) => onForkSelect?.(fork, item.id)}
      onPromptSubmit={onPromptSubmit}
      loadingMessages={loadingMessages}
    />
  );
```

### TerminalChat Integration

```typescript
// components/Terminal/TerminalChat.tsx

// CHANGE: Add fork handler
const handleForkSelect = useCallback((fork: JourneyFork, responseId: string) => {
  // Could dispatch to machine or call API directly
  if (onPromptClick) {
    onPromptClick(fork.queryPayload || fork.label);
  }
}, [onPromptClick]);

// CHANGE: Pass to StreamRenderer
<StreamRenderer
  items={streamItems}
  currentItem={currentItem}
  onSpanClick={handleSpanClick}
  onForkSelect={handleForkSelect}  // NEW
  // ... rest unchanged
/>
```

---

## DEX Compliance

### Declarative Sovereignty

- Fork types (`deep_dive`, `pivot`, `apply`) are data, not code
- Visual hierarchy controlled via CSS tokens, not component conditionals
- LLM can output navigation via `<navigation>` JSON, no code changes needed

### Capability Agnosticism

- System works whether LLM outputs `<navigation>` block or not
- Fallback: `inferForkType()` assigns types based on label text
- No model-specific assumptions in parsing

### Provenance as Infrastructure

- `PivotContext` tracks source response, text, and optional conceptId
- `JourneyFork.context` can carry provenance forward
- All stream items have timestamp and createdBy

### Organic Scalability

- New fork types added by extending `JourneyForkType` union
- New span types added to `RhetoricalSpanType` union
- CSS tokens follow existing namespace convention

---

*Specification complete. Proceed to ARCH_DECISIONS.md.*
