# Migration Map: kinetic-stream-rendering-v1

**Purpose:** Detailed file-by-file changes organized into phases.

---

## Phase Overview

| Phase | Focus | Files Changed | Risk |
|-------|-------|---------------|------|
| 1 | Component Structure | 7 new files | Low |
| 2 | Token Extensions | 1 modified | Low |
| 3 | SpanRenderer | 1 new, tests | Medium |
| 4 | Block Components | 4 new | Low |
| 5 | StreamRenderer | 1 new | Low |
| 6 | TerminalChat Integration | 2 modified | Medium |
| 7 | Testing | 3 new test files | Low |

---

## Phase 1: Component Structure

**Goal:** Create directory structure and barrel exports.

### 1.1 Create Directory

```bash
mkdir -p components/Terminal/Stream/blocks
```

### 1.2 Create Barrel Export

**CREATE:** `components/Terminal/Stream/index.ts`

```typescript
// Stream module exports
export { StreamRenderer } from './StreamRenderer';
export { SpanRenderer } from './SpanRenderer';
export { QueryBlock } from './blocks/QueryBlock';
export { ResponseBlock } from './blocks/ResponseBlock';
export { NavigationBlock } from './blocks/NavigationBlock';
export { SystemBlock } from './blocks/SystemBlock';

// Re-export types for convenience
export type { StreamRendererProps } from './StreamRenderer';
export type { SpanRendererProps } from './SpanRenderer';
```

### 1.3 Extract MarkdownRenderer

**CREATE:** `components/Terminal/MarkdownRenderer.tsx`

Extract existing `MarkdownRenderer` and `parseInline` from `TerminalChat.tsx` into its own file for reuse as fallback.

```typescript
// components/Terminal/MarkdownRenderer.tsx
// Extracted from TerminalChat.tsx for backward compatibility

import React from 'react';
import SuggestionChip from './SuggestionChip';

// ... (existing parseInline and MarkdownRenderer implementation)

export { MarkdownRenderer, parseInline };
export default MarkdownRenderer;
```

**Build Gate:**
```bash
npm run typecheck
# Expect: No errors
```

---

## Phase 2: Token Extensions

**Goal:** Add CSS tokens for span styling.

### 2.1 Modify globals.css

**MODIFY:** `src/app/globals.css`

Add after existing chat tokens:

```css
:root {
  /* ─── Chat Span Tokens (Sprint: kinetic-stream-rendering-v1) ─── */
  
  /* Concept spans - the "Orange Highlights" */
  --chat-concept-text: theme('colors.grove.clay');
  --chat-concept-bg: transparent;
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.1);
  
  /* Action spans - suggested prompts inline */
  --chat-action-text: theme('colors.primary');
  --chat-action-bg: transparent;
  --chat-action-bg-hover: rgba(var(--primary-rgb), 0.1);
  
  /* Entity spans - names, places */
  --chat-entity-text: theme('colors.slate.600');
}

.dark {
  /* Dark mode overrides */
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.2);
  --chat-entity-text: theme('colors.slate.300');
}
```

**Build Gate:**
```bash
npm run build
# Expect: No CSS errors
```

---

## Phase 3: SpanRenderer

**Goal:** Build the core span rendering logic.

### 3.1 Create SpanRenderer

**CREATE:** `components/Terminal/Stream/SpanRenderer.tsx`

Full implementation as specified in ARCHITECTURE.md:

```typescript
import React, { useMemo } from 'react';
import { RhetoricalSpan, RhetoricalSpanType } from '@/core/schema/stream';

export interface SpanRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}

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

    const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSpans.forEach((span) => {
      // Bounds checking
      const start = Math.max(0, Math.min(span.startIndex, content.length));
      const end = Math.max(start, Math.min(span.endIndex, content.length));

      // Text before span
      if (start > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>{content.slice(lastIndex, start)}</span>
        );
      }

      // Span element
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

    // Remaining text
    if (lastIndex < content.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>
      );
    }

    return result;
  }, [content, spans, onSpanClick]);

  return <span className="whitespace-pre-wrap">{elements}</span>;
};

interface SpanElementProps {
  span: RhetoricalSpan;
  displayText: string;
  onClick?: () => void;
}

const SpanElement: React.FC<SpanElementProps> = ({ span, displayText, onClick }) => {
  const style = SPAN_STYLES[span.type] || '';
  
  if (span.type === 'entity') {
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

**Build Gate:**
```bash
npm run typecheck
npm test -- SpanRenderer.test.tsx
```

---

## Phase 4: Block Components

**Goal:** Create type-specific rendering blocks.

### 4.1 QueryBlock

**CREATE:** `components/Terminal/Stream/blocks/QueryBlock.tsx`

```typescript
import React from 'react';
import { StreamItem } from '@/core/schema/stream';

export interface QueryBlockProps {
  item: StreamItem;
}

export const QueryBlock: React.FC<QueryBlockProps> = ({ item }) => {
  const displayContent = item.content.replace(' --verbose', '');

  return (
    <div className="flex flex-col items-end">
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

### 4.2 ResponseBlock

**CREATE:** `components/Terminal/Stream/blocks/ResponseBlock.tsx`

(Full implementation as specified in ARCHITECTURE.md)

### 4.3 NavigationBlock

**CREATE:** `components/Terminal/Stream/blocks/NavigationBlock.tsx`

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
    <div className="flex flex-col items-start">
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

### 4.4 SystemBlock

**CREATE:** `components/Terminal/Stream/blocks/SystemBlock.tsx`

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
    <div className="flex justify-center">
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

**Build Gate:**
```bash
npm run typecheck
npm test -- blocks/
```

---

## Phase 5: StreamRenderer

**Goal:** Build the polymorphic dispatcher.

### 5.1 Create StreamRenderer

**CREATE:** `components/Terminal/Stream/StreamRenderer.tsx`

Full implementation as specified in ARCHITECTURE.md.

**Build Gate:**
```bash
npm run typecheck
npm test -- StreamRenderer.test.tsx
```

---

## Phase 6: TerminalChat Integration

**Goal:** Wire StreamRenderer to TerminalChat.

### 6.1 Modify TerminalChat

**MODIFY:** `components/Terminal/TerminalChat.tsx`

1. Import StreamRenderer
2. Add conditional rendering based on streamHistory
3. Preserve Cognitive Bridge injection
4. Add span/path click handlers

```typescript
// At top of file
import { StreamRenderer } from './Stream';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useEngagement } from '@/core/engagement/hooks';

// In component body
const { streamHistory, currentStreamItem } = useEngagement();
const useStreamRenderer = streamHistory.length > 0 || currentStreamItem !== null;

// In render
{useStreamRenderer ? (
  <StreamRenderer
    items={streamHistory}
    currentItem={currentStreamItem}
    onSpanClick={handleSpanClick}
    onPathClick={handlePathClick}
    onPromptSubmit={onPromptClick}
    bridgeState={bridgeState}
    onBridgeAccept={onBridgeAccept}
    onBridgeDismiss={onBridgeDismiss}
  />
) : (
  // Existing message rendering logic
  <LegacyMessageList ... />
)}
```

### 6.2 Add Click Handlers

**MODIFY:** `components/Terminal/TerminalChat.tsx`

```typescript
const handleSpanClick = useCallback((span: RhetoricalSpan) => {
  // For now, treat concept clicks as prompt submissions
  if (span.type === 'concept') {
    onPromptClick?.(`Tell me more about ${span.text}`);
  }
}, [onPromptClick]);

const handlePathClick = useCallback((path: JourneyPath) => {
  // Navigate or submit as prompt
  onPromptClick?.(path.title);
}, [onPromptClick]);
```

**Build Gate:**
```bash
npm run build
npm test
npx playwright test tests/e2e/terminal-baseline.spec.ts
```

---

## Phase 7: Testing

**Goal:** Add comprehensive tests.

### 7.1 Unit Tests

**CREATE:** `tests/unit/SpanRenderer.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanRenderer } from '@/components/Terminal/Stream/SpanRenderer';
import { RhetoricalSpan } from '@/core/schema/stream';

describe('SpanRenderer', () => {
  it('renders content without spans as plain text', () => {
    render(<SpanRenderer content="Hello world" spans={[]} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('highlights spans at correct positions', () => {
    const content = 'The **Grove** is here';
    const spans: RhetoricalSpan[] = [{
      id: 's1',
      text: 'Grove',
      type: 'concept',
      startIndex: 4,
      endIndex: 13
    }];
    
    render(<SpanRenderer content={content} spans={spans} />);
    expect(screen.getByRole('button', { name: /Explore Grove/i })).toBeInTheDocument();
  });

  it('calls onSpanClick when concept span is clicked', () => {
    const onClick = jest.fn();
    const spans: RhetoricalSpan[] = [{
      id: 's1',
      text: 'Grove',
      type: 'concept',
      startIndex: 4,
      endIndex: 13
    }];
    
    render(
      <SpanRenderer 
        content="The **Grove** is here" 
        spans={spans} 
        onSpanClick={onClick}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(spans[0]);
  });

  it('handles overlapping spans gracefully', () => {
    // Edge case testing
  });

  it('handles out-of-bounds indices', () => {
    const spans: RhetoricalSpan[] = [{
      id: 's1',
      text: 'Test',
      type: 'concept',
      startIndex: 100,  // Beyond content length
      endIndex: 110
    }];
    
    // Should not crash
    render(<SpanRenderer content="Short" spans={spans} />);
  });
});
```

**CREATE:** `tests/unit/StreamRenderer.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { StreamRenderer } from '@/components/Terminal/Stream';
import { StreamItem } from '@/core/schema/stream';

describe('StreamRenderer', () => {
  it('renders query items as QueryBlock', () => {
    const items: StreamItem[] = [{
      id: '1',
      type: 'query',
      content: 'Hello',
      timestamp: Date.now()
    }];
    
    render(<StreamRenderer items={items} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders response items as ResponseBlock', () => {
    const items: StreamItem[] = [{
      id: '1',
      type: 'response',
      content: 'Hello back',
      timestamp: Date.now()
    }];
    
    render(<StreamRenderer items={items} />);
    expect(screen.getByText('The Grove')).toBeInTheDocument();
  });

  it('includes currentItem when provided', () => {
    const items: StreamItem[] = [];
    const currentItem: StreamItem = {
      id: 'current',
      type: 'response',
      content: 'Generating...',
      timestamp: Date.now(),
      isGenerating: true
    };
    
    render(<StreamRenderer items={items} currentItem={currentItem} />);
    // Should show loading or streaming indicator
  });
});
```

### 7.2 Visual Regression

**CREATE:** `tests/e2e/stream-rendering-baseline.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Stream Rendering', () => {
  test('StreamRenderer visual baseline', async ({ page }) => {
    // Setup: Need demo mode or fixture
    await page.goto('/terminal?demo=stream');
    
    await expect(page.locator('[data-testid="stream-renderer"]'))
      .toHaveScreenshot('stream-renderer-baseline.png');
  });

  test('Span highlights render correctly', async ({ page }) => {
    await page.goto('/terminal?demo=stream-with-spans');
    
    // Find concept span
    const conceptSpan = page.locator('button:has-text("Grove")');
    await expect(conceptSpan).toBeVisible();
    await expect(conceptSpan).toHaveCSS('color', 'rgb(186, 110, 64)'); // grove.clay
  });
});
```

**Build Gate:**
```bash
npm test -- --coverage
# Expect: ≥80% on new files

npx playwright test
# Expect: All passing
```

---

## Rollback Plan

### Phase 1-4 (Component Creation)
```bash
# Delete new files
rm -rf components/Terminal/Stream/
rm components/Terminal/MarkdownRenderer.tsx
```

### Phase 5-6 (Integration)
```bash
# Restore TerminalChat.tsx
git checkout components/Terminal/TerminalChat.tsx
```

### Full Rollback
```bash
git stash
# or
git checkout kinetic-stream-feature~1
```

---

## File Change Summary

| Action | File | Phase |
|--------|------|-------|
| CREATE | `components/Terminal/Stream/index.ts` | 1 |
| CREATE | `components/Terminal/MarkdownRenderer.tsx` | 1 |
| MODIFY | `src/app/globals.css` | 2 |
| CREATE | `components/Terminal/Stream/SpanRenderer.tsx` | 3 |
| CREATE | `components/Terminal/Stream/blocks/QueryBlock.tsx` | 4 |
| CREATE | `components/Terminal/Stream/blocks/ResponseBlock.tsx` | 4 |
| CREATE | `components/Terminal/Stream/blocks/NavigationBlock.tsx` | 4 |
| CREATE | `components/Terminal/Stream/blocks/SystemBlock.tsx` | 4 |
| CREATE | `components/Terminal/Stream/StreamRenderer.tsx` | 5 |
| MODIFY | `components/Terminal/TerminalChat.tsx` | 6 |
| CREATE | `tests/unit/SpanRenderer.test.tsx` | 7 |
| CREATE | `tests/unit/StreamRenderer.test.tsx` | 7 |
| CREATE | `tests/e2e/stream-rendering-baseline.spec.ts` | 7 |

**Total:** 11 new files, 2 modified files

---

*Migration map approved: [Pending]*
