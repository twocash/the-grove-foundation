# Execution Prompt: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2
**Purpose:** Self-contained implementation handoff
**Date:** December 28, 2025

---

## For the Implementing Agent

This document is your complete context for implementing the Kinetic Stream Reset v2 sprint. Read this document, then execute the stories in order.

---

## What You're Building

You are enhancing the Terminal chat experience to support:

1. **Journey Forks** - Navigation buttons at the end of AI responses
2. **Pivot Clicks** - Clicking concept spans auto-submits follow-up queries
3. **Enhanced Types** - Discriminated unions for better type safety

The infrastructure already exists. You are adding refinements, not building from scratch.

---

## Reference Documents

Read these in order if you need deeper context:

| Document | Purpose |
|----------|---------|
| `REPO_AUDIT.md` | What exists vs what's claimed |
| `SPEC.md` | Technical specification with code snippets |
| `ARCH_DECISIONS.md` | Why decisions were made |
| `TEST_STRATEGY.md` | Test cases to implement |
| `MIGRATION_PLAN.md` | Rollback procedures |
| `SPRINTS.md` | Story breakdown and dependencies |

---

## Implementation Sequence

Execute these stories in order. Each includes the exact code changes needed.

---

### Story 1.1: Discriminated Union Types

**File:** `src/core/schema/stream.ts`

**Task:** Enhance StreamItem with discriminated union types.

**Instructions:**

1. Read the current file (109 lines)
2. Add these types AFTER the existing `RhetoricalSpan` interface:

```typescript
// ─────────────────────────────────────────────────────────────────
// JOURNEY FORK (Navigation suggestions - enhanced)
// ─────────────────────────────────────────────────────────────────

export type JourneyForkType = 'deep_dive' | 'pivot' | 'apply';

export interface JourneyFork {
  id: string;
  label: string;
  type: JourneyForkType;
  targetId?: string;
  queryPayload?: string;
  context?: string;
}

// ─────────────────────────────────────────────────────────────────
// PIVOT CONTEXT
// ─────────────────────────────────────────────────────────────────

export interface PivotContext {
  sourceResponseId: string;
  sourceText: string;
  sourceContext: string;
  targetId?: string;
}

// ─────────────────────────────────────────────────────────────────
// DISCRIMINATED STREAM ITEMS
// ─────────────────────────────────────────────────────────────────

interface BaseStreamItem {
  id: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

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
  suggestedPaths?: JourneyPath[];
  navigation?: JourneyFork[];
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
```

3. Update the existing `StreamItem` interface to be the union:

```typescript
// Keep the old interface as an alias for backward compatibility
// This allows existing code to continue working

export type StreamItem =
  | QueryStreamItem
  | ResponseStreamItem
  | NavigationStreamItem
  | SystemStreamItem
  | {
      // Legacy catch-all for 'reveal' type
      id: string;
      type: 'reveal';
      timestamp: number;
      content: string;
      createdBy?: 'user' | 'system' | 'ai';
      role?: 'user' | 'assistant';
      metadata?: Record<string, unknown>;
      isGenerating?: boolean;
      parsedSpans?: RhetoricalSpan[];
      suggestedPaths?: JourneyPath[];
    };
```

4. Enhance type guards:

```typescript
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

5. Run: `npx tsc --noEmit` to verify no type errors

---

### Story 1.2: Navigation Parser

**File:** `src/core/transformers/NavigationParser.ts` (CREATE NEW)

**Task:** Create parser for `<navigation>` blocks.

**Instructions:**

1. Create the file with this content:

```typescript
// src/core/transformers/NavigationParser.ts
// Extract <navigation> blocks from LLM output
// Sprint: kinetic-stream-reset-v2

import type { JourneyFork, JourneyForkType } from '../schema/stream';

export interface ParsedNavigation {
  forks: JourneyFork[];
  cleanContent: string;
}

const NAVIGATION_REGEX = /<navigation>([\s\S]*?)<\/navigation>/i;

export function parseNavigation(rawContent: string): ParsedNavigation {
  if (!rawContent) {
    return { forks: [], cleanContent: '' };
  }

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
  const trimmed = block.trim();

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeFork);
    }
    if (parsed.forks && Array.isArray(parsed.forks)) {
      return parsed.forks.map(normalizeFork);
    }
  } catch {
    // Fall back to structured text
  }

  return parseStructuredText(block);
}

function parseStructuredText(block: string): JourneyFork[] {
  const lines = block.trim().split('\n').filter(l => l.trim());

  return lines.map((line, i) => {
    const trimmed = line.trim();
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
  if (lower.includes('try') || lower.includes('apply') || lower.includes('how to') || lower.includes('implement')) {
    return 'apply';
  }

  return 'pivot';
}

function normalizeFork(raw: Record<string, unknown>): JourneyFork {
  const type = normalizeType(raw.type);
  const label = String(raw.label || raw.text || 'Continue');

  return {
    id: String(raw.id || `fork_${Date.now()}_${Math.random().toString(36).slice(2)}`),
    label,
    type,
    targetId: raw.targetId as string | undefined,
    queryPayload: String(raw.query || raw.queryPayload || label),
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

2. Add to barrel export in `src/core/transformers/index.ts`:

```typescript
export * from './NavigationParser';
```

3. Run: `npx tsc --noEmit`

---

### Story 1.3: Machine Event Integration

**Files:**
- `src/core/engagement/types.ts`
- `src/core/engagement/machine.ts`

**Task:** Add pivot/fork events and integrate NavigationParser.

**Instructions:**

1. In `types.ts`, add to `EngagementEvent` union (around line 52):

```typescript
  // Kinetic stream events (kinetic-stream-reset-v2)
  | { type: 'USER.CLICK_PIVOT'; span: import('../schema/stream').RhetoricalSpan; responseId: string }
  | { type: 'USER.SELECT_FORK'; fork: import('../schema/stream').JourneyFork; responseId: string };
```

2. In `machine.ts`, add import at top:

```typescript
import { parseNavigation } from '../transformers/NavigationParser';
import type { QueryStreamItem, ResponseStreamItem, JourneyFork, RhetoricalSpan } from '../schema/stream';
```

3. In `machine.ts`, add new actions in the `actions` block:

```typescript
    // Pivot click action (kinetic-stream-reset-v2)
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
          sourceContext: '',
          targetId: event.span.conceptId
        }
      };

      return {
        currentStreamItem: pivotQuery,
        streamHistory: [...context.streamHistory, pivotQuery]
      };
    }),

    // Fork select action (kinetic-stream-reset-v2)
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
    }),
```

4. Update `finalizeResponse` action to use NavigationParser:

```typescript
    finalizeResponse: assign(({ context }) => {
      if (!context.currentStreamItem) return {};

      // Parse navigation block first
      const { forks, cleanContent } = parseNavigation(context.currentStreamItem.content);

      // Then parse rhetoric on clean content
      const { spans } = parse(cleanContent);

      const finalizedItem: ResponseStreamItem = {
        ...context.currentStreamItem,
        content: cleanContent,
        isGenerating: false,
        parsedSpans: spans,
        navigation: forks.length > 0 ? forks : undefined,
        role: 'assistant',
        createdBy: 'ai'
      } as ResponseStreamItem;

      return {
        currentStreamItem: finalizedItem,
        streamHistory: [...context.streamHistory, finalizedItem]
      };
    }),
```

5. Add event handlers in the top-level `on` block:

```typescript
    'USER.CLICK_PIVOT': {
      actions: 'handlePivotClick',
    },
    'USER.SELECT_FORK': {
      actions: 'handleForkSelect',
    },
```

6. Run: `npx tsc --noEmit`

---

### Story 2.1: NavigationBlock Rewrite

**File:** `components/Terminal/Stream/blocks/NavigationBlock.tsx`

**Task:** Replace SuggestionChip-based implementation with ForkButton.

**Instructions:**

1. Replace the entire file content:

```typescript
// components/Terminal/Stream/blocks/NavigationBlock.tsx
// Journey navigation fork block with visual hierarchy
// Sprint: kinetic-stream-reset-v2

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

2. Run: `npx tsc --noEmit`

---

### Story 2.2: ResponseBlock Enhancement

**File:** `components/Terminal/Stream/blocks/ResponseBlock.tsx`

**Task:** Add inline NavigationBlock mount point.

**Instructions:**

1. Add import at top:

```typescript
import { NavigationBlock } from './NavigationBlock';
import { hasSpans, hasPaths, hasNavigation, type ResponseStreamItem, type JourneyFork } from '../../../../src/core/schema/stream';
```

2. Update props interface:

```typescript
export interface ResponseBlockProps {
  item: ResponseStreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}
```

3. Add `onForkSelect` to destructuring:

```typescript
export const ResponseBlock: React.FC<ResponseBlockProps> = ({
  item,
  onSpanClick,
  onForkSelect,
  onPromptSubmit,
  loadingMessages
}) => {
```

4. Add NavigationBlock after GlassPanel content (inside the component, after the existing `hasPaths` block):

```typescript
      {/* New navigation system (kinetic-stream-reset-v2) */}
      {hasNavigation(item) && !item.isGenerating && (
        <NavigationBlock
          forks={item.navigation!}
          onSelect={onForkSelect}
        />
      )}
```

5. Run: `npx tsc --noEmit`

---

### Story 2.3: StreamRenderer Wiring

**Files:**
- `components/Terminal/Stream/StreamRenderer.tsx`
- `components/Terminal/TerminalChat.tsx`

**Task:** Wire fork select and span click with responseId.

**Instructions:**

1. In `StreamRenderer.tsx`, update props:

```typescript
export interface StreamRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onSpanClick?: (span: RhetoricalSpan, responseId: string) => void;
  onForkSelect?: (fork: JourneyFork, responseId: string) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
  bridgeState?: BridgeState;
  onBridgeAccept?: () => void;
  onBridgeDismiss?: () => void;
  loadingMessages?: string[];
}
```

2. Add import:

```typescript
import type { JourneyFork } from '../../../src/core/schema/stream';
```

3. Update StreamBlockProps and the response case:

```typescript
interface StreamBlockProps {
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan, responseId: string) => void;
  onForkSelect?: (fork: JourneyFork, responseId: string) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

// In the switch statement, update the response case:
    case 'response':
      return (
        <ResponseBlock
          item={item as any}
          onSpanClick={(span) => onSpanClick?.(span, item.id)}
          onForkSelect={(fork) => onForkSelect?.(fork, item.id)}
          onPromptSubmit={onPromptSubmit}
          loadingMessages={loadingMessages}
        />
      );
```

4. In `TerminalChat.tsx`, update the span click handler and add fork handler:

```typescript
  // Handle span clicks (bold text → prompt)
  const handleSpanClick = (span: RhetoricalSpan, responseId: string) => {
    if (onPromptClick && span.type === 'concept') {
      // For now, just submit the concept as a query
      // Future: could dispatch USER.CLICK_PIVOT to machine
      onPromptClick(`Tell me more about ${span.text}`);
    }
  };

  // Handle fork selection
  const handleForkSelect = (fork: JourneyFork, responseId: string) => {
    if (onPromptClick) {
      onPromptClick(fork.queryPayload || fork.label);
    }
  };
```

5. Update StreamRenderer call:

```typescript
        <StreamRenderer
          items={streamItems}
          currentItem={currentItem}
          onSpanClick={handleSpanClick}
          onForkSelect={handleForkSelect}
          onPromptSubmit={onPromptClick}
          bridgeState={bridgeState}
          onBridgeAccept={onBridgeAccept}
          onBridgeDismiss={onBridgeDismiss}
          loadingMessages={loadingMessages}
        />
```

6. Add JourneyFork import:

```typescript
import { fromChatMessage, type StreamItem, type RhetoricalSpan, type JourneyFork } from '../../src/core/schema/stream';
```

7. Run: `npx tsc --noEmit`

---

### Story 2.4: CSS Tokens

**File:** `styles/globals.css`

**Task:** Add fork button CSS tokens.

**Instructions:**

1. Find line 1206 (after `--chat-entity-text: #64748b;`)

2. Add this block:

```css
  /* ============================================
     FORK BUTTON TOKENS (kinetic-stream-reset-v2)
     Visual hierarchy for journey navigation
     ============================================ */

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
```

3. At the end of the file (before the final closing), add:

```css
/* ============================================
   FORK BUTTON STYLES (kinetic-stream-reset-v2)
   ============================================ */

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

4. Run: `npm run build`

---

## Final Verification

After completing all stories:

```bash
# Full build
npm run build

# Run tests
npm test

# E2E tests (if configured)
npx playwright test

# Manual smoke test
npm run dev
# Open browser, submit a query, verify:
# - Query appears in stream
# - Response appears
# - Concept spans are highlighted (if any)
# - Navigation forks appear (if LLM outputs them)
# - Clicking fork submits new query
```

---

## Commit Message Template

```
feat(stream): enhance kinetic stream with journey forks

- Add discriminated union types for StreamItem
- Create NavigationParser for <navigation> block extraction
- Add pivot/fork events to engagement machine
- Implement ForkButton with visual hierarchy
- Wire fork selection through StreamRenderer

Sprint: kinetic-stream-reset-v2
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Type errors after schema change | Check imports, may need `as ResponseStreamItem` casts temporarily |
| NavigationBlock not showing | Verify `hasNavigation()` returns true, check if `navigation` is populated |
| Fork clicks not working | Check `onForkSelect` prop chain from TerminalChat through StreamRenderer |
| CSS not applying | Verify class names match, check for typos in `fork-button--` |

---

## Success Criteria

- [ ] Build passes (`npm run build`)
- [ ] No console errors in browser
- [ ] Query submission works
- [ ] Response rendering works
- [ ] Concept spans are clickable
- [ ] Fork buttons appear when navigation present
- [ ] Fork clicks submit new queries

---

*Implementation handoff complete. Execute stories in order.*
