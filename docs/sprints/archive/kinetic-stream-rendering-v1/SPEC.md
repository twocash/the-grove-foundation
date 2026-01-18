# Specification: kinetic-stream-rendering-v1

**Epic:** Polymorphic StreamRenderer for Kinetic Chat  
**Sprint Owner:** Jim Calhoun  
**Sprint Duration:** 1 week  

---

## 1. Executive Summary

This sprint builds the **polymorphic rendering layer** that consumes Sprint 1's typed `StreamItem` schema. The StreamRenderer dispatches each item to type-specific block components, with `ResponseBlock` using `SpanRenderer` to highlight rhetorical spans (the "Orange Highlights") based on pre-parsed indices.

The key insight: **rendering is now declarative**. The renderer reads structured data and renders accordingly—no parsing during render, no inline computation, pure data-driven UI.

---

## 2. Goals

### 2.1 Primary Goals

1. **Build StreamRenderer** - Polymorphic dispatcher that:
   - Receives `StreamItem[]` from machine context
   - Dispatches to type-specific block components
   - Handles streaming state gracefully

2. **Create Block Components** - Type-specific renderers:
   - `QueryBlock` - User message display
   - `ResponseBlock` - AI response with span highlighting
   - `NavigationBlock` - Path buttons for journey forks
   - `SystemBlock` - Status/error messages

3. **Implement SpanRenderer** - Inline span highlighting:
   - Takes content string + RhetoricalSpan[]
   - Splits content by span indices
   - Wraps spans in interactive styled elements
   - Handles click events for concept exploration

4. **Wire to TerminalChat** - Integration:
   - TerminalChat conditionally uses StreamRenderer
   - Falls back to MarkdownRenderer when no StreamItem
   - Preserves Cognitive Bridge injection

### 2.2 Success Criteria

| Criterion | Verification |
|-----------|--------------|
| StreamRenderer renders all item types | Unit test per type |
| SpanRenderer highlights spans correctly | Unit test with known indices |
| Bold spans are clickable | E2E interaction test |
| Navigation paths render as buttons | Visual verification |
| Backward compatible | Existing chat still works |
| No visual regression | Baseline comparison passes |

---

## 3. Non-Goals (Explicit Scope Boundaries)

### 3.1 NOT in this sprint:

- ❌ **Glass styling** - Sprint 3 handles visual polish
- ❌ **Framer Motion animations** - Sprint 3
- ❌ **Floating input console** - Separate surface concern
- ❌ **Lens hover cards** - Future enhancement
- ❌ **Path traversal logic** - Consumption only; navigation handled by machine

### 3.2 Deferred to Sprint 3:

- Glassmorphism effects on blocks
- Scroll anchoring to active response
- Transition animations between states
- "Typing" animation for streaming

---

## 4. Patterns Extended

Per Phase 0 Pattern Check:

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Polymorphic blocks | Pattern 6: Surface Architecture | Type → Component dispatch |
| Path buttons | Pattern 3: Narrative Schema | JourneyPath → SuggestionChip |
| Span styling | Pattern 4: Token Namespaces | `--chat-concept-*` tokens |
| Machine state | Pattern 2: Engagement Machine | Read streamHistory from context |

## No New Patterns Proposed

All needs met by composing existing patterns and extending token namespace.

---

## 5. Canonical Source Audit

| Capability | Canonical Home | Recommendation |
|------------|----------------|----------------|
| Chat display | `TerminalChat.tsx` | **MODIFY** to use StreamRenderer |
| Span data | `RhetoricalParser.ts` | **USE** parsed spans |
| Path buttons | `SuggestionChip.tsx` | **REUSE** in NavigationBlock |
| Loading | `LoadingIndicator.tsx` | **REUSE** in ResponseBlock |
| Tokens | `globals.css` | **EXTEND** with concept tokens |

### No Duplication Certification

This sprint extracts and composes; it does not duplicate existing capability.

---

## 6. Technical Approach

### 6.1 StreamRenderer Component

```typescript
// components/Terminal/Stream/StreamRenderer.tsx

interface StreamRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;  // For streaming state
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
}

export const StreamRenderer: React.FC<StreamRendererProps> = ({
  items,
  currentItem,
  onSpanClick,
  onPathClick
}) => {
  const allItems = currentItem 
    ? [...items, currentItem] 
    : items;

  return (
    <div className="space-y-6">
      {allItems.map(item => (
        <StreamItem 
          key={item.id} 
          item={item}
          onSpanClick={onSpanClick}
          onPathClick={onPathClick}
        />
      ))}
    </div>
  );
};

const StreamItem: React.FC<{item: StreamItem; ...}> = ({ item, ... }) => {
  switch (item.type) {
    case 'query':
      return <QueryBlock item={item} />;
    case 'response':
      return <ResponseBlock item={item} onSpanClick={onSpanClick} />;
    case 'navigation':
      return <NavigationBlock item={item} onPathClick={onPathClick} />;
    case 'system':
      return <SystemBlock item={item} />;
    default:
      return null;
  }
};
```

### 6.2 SpanRenderer Component

```typescript
// components/Terminal/Stream/SpanRenderer.tsx

interface SpanRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}

export const SpanRenderer: React.FC<SpanRendererProps> = ({
  content,
  spans,
  onSpanClick
}) => {
  // Sort spans by startIndex
  const sortedSpans = [...spans].sort((a, b) => a.startIndex - b.startIndex);
  
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedSpans.forEach((span, i) => {
    // Add text before span
    if (span.startIndex > lastIndex) {
      elements.push(content.slice(lastIndex, span.startIndex));
    }
    
    // Add span element
    elements.push(
      <SpanElement 
        key={span.id} 
        span={span} 
        onClick={() => onSpanClick?.(span)}
      />
    );
    
    lastIndex = span.endIndex;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    elements.push(content.slice(lastIndex));
  }

  return <>{elements}</>;
};
```

### 6.3 Block Components

```typescript
// QueryBlock - User message
export const QueryBlock: React.FC<{item: StreamItem}> = ({ item }) => (
  <div className="flex flex-col items-end">
    <div className="text-xs font-semibold text-slate-600 mb-1.5">You</div>
    <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md max-w-[70%]">
      <p className="text-sm leading-relaxed">{item.content}</p>
    </div>
  </div>
);

// ResponseBlock - AI response with spans
export const ResponseBlock: React.FC<{item: StreamItem; onSpanClick?: ...}> = ({ 
  item, 
  onSpanClick 
}) => (
  <div className="flex flex-col items-start">
    <div className="text-xs font-semibold text-primary mb-1.5">The Grove</div>
    <div className="bg-slate-100 dark:bg-surface-dark px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%]">
      {item.isGenerating && !item.content ? (
        <LoadingIndicator />
      ) : (
        <>
          {hasSpans(item) ? (
            <SpanRenderer 
              content={item.content} 
              spans={item.parsedSpans!}
              onSpanClick={onSpanClick}
            />
          ) : (
            <MarkdownRenderer content={item.content} />
          )}
          {item.isGenerating && <CursorBlink />}
        </>
      )}
    </div>
    {hasPaths(item) && (
      <NavigationPaths paths={item.suggestedPaths!} />
    )}
  </div>
);
```

---

## 7. Token Extensions

Add to `globals.css`:

```css
:root {
  /* Concept spans (Orange Highlights) */
  --chat-concept-text: theme('colors.grove.clay');
  --chat-concept-bg: transparent;
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.1);
  
  /* Action spans */
  --chat-action-text: theme('colors.primary');
  --chat-action-bg: transparent;
  
  /* Entity spans */
  --chat-entity-text: theme('colors.slate.600');
  --chat-entity-style: italic;
}
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

**File:** `tests/unit/StreamRenderer.test.tsx`

```typescript
describe('StreamRenderer', () => {
  it('renders query items as QueryBlock', () => {
    const items: StreamItem[] = [{
      id: '1', type: 'query', content: 'Hello', timestamp: Date.now()
    }];
    render(<StreamRenderer items={items} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders response items with SpanRenderer when spans exist', () => {
    const items: StreamItem[] = [{
      id: '1', type: 'response', content: '**Grove** is distributed',
      timestamp: Date.now(),
      parsedSpans: [{ id: 's1', text: 'Grove', type: 'concept', startIndex: 0, endIndex: 9 }]
    }];
    render(<StreamRenderer items={items} />);
    expect(screen.getByRole('button', { name: 'Grove' })).toBeInTheDocument();
  });
});
```

**File:** `tests/unit/SpanRenderer.test.tsx`

```typescript
describe('SpanRenderer', () => {
  it('renders spans at correct positions', () => {
    const content = 'The **Grove** is here';
    const spans: RhetoricalSpan[] = [{
      id: 's1', text: 'Grove', type: 'concept',
      startIndex: 4, endIndex: 13
    }];
    render(<SpanRenderer content={content} spans={spans} />);
    // Verify "The " + "**Grove**" + " is here" structure
  });

  it('calls onSpanClick when span is clicked', () => {
    const onClick = jest.fn();
    // ... test click handling
  });
});
```

### 8.2 Visual Regression

**File:** `tests/e2e/stream-rendering-baseline.spec.ts`

```typescript
test('StreamRenderer visual baseline', async ({ page }) => {
  // Navigate to terminal with stream content
  await page.goto('/terminal?demo=stream');
  
  // Capture baseline
  await expect(page.locator('[data-testid="stream-renderer"]'))
    .toHaveScreenshot('stream-renderer-baseline.png');
});
```

### 8.3 Build Gate

```bash
npm test -- --coverage
# Expect: ≥80% on new files

npx playwright test tests/e2e/terminal-baseline.spec.ts
# Expect: No visual regressions

npx playwright test tests/e2e/stream-rendering-baseline.spec.ts
# Expect: New baseline captured
```

---

## 9. Acceptance Criteria (Testable)

| # | Criterion | Test Method |
|---|-----------|-------------|
| AC1 | StreamRenderer dispatches by item.type | Unit test |
| AC2 | QueryBlock renders user messages | Unit test |
| AC3 | ResponseBlock uses SpanRenderer when spans exist | Unit test |
| AC4 | SpanRenderer highlights at correct indices | Unit test |
| AC5 | Concept spans are clickable | E2E interaction |
| AC6 | NavigationBlock renders path buttons | Unit test |
| AC7 | Backward compatible with ChatMessage | Integration test |
| AC8 | No visual regression | Visual baseline test |
| AC9 | Cognitive Bridge still injects correctly | E2E test |

---

## 10. Dependencies

### Blocks:
- None

### Blocked By:
- Sprint 1: StreamItem and RhetoricalSpan types
- Sprint 1: RhetoricalParser in machine
- Sprint 1: streamHistory in machine context

### Related:
- Sprint 3 will add animations to these blocks

---

## 11. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Sprint 1 incomplete | Can stub types; wire later |
| Span index off-by-one | Defensive bounds checking |
| Breaking chat rendering | Backward compat fallback |
| Performance with many spans | Memoize SpanRenderer |

---

## 12. DEX Compliance

### Declarative Sovereignty
- Block types extensible via StreamItemType union
- Span styling via CSS tokens (domain expert can modify)

### Capability Agnosticism
- Rendering works with any content
- No model-specific assumptions

### Provenance
- Blocks render item.createdBy when relevant
- Spans link to conceptId for knowledge graph

### Organic Scalability
- New block types added by extending switch
- New span types added by extending SpanElement

---

*Specification approved: [Pending]*  
*Sprint start: [TBD]*
