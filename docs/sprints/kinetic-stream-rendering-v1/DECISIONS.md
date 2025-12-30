# Architectural Decision Records: kinetic-stream-rendering-v1

**Purpose:** Document key decisions and their rationale.

---

## ADR-001: Polymorphic Dispatch via Switch Statement

**Status:** Accepted

**Context:**
We need to render different StreamItem types with different components. Options include:
1. Switch statement on `item.type`
2. Registry pattern (map of type → component)
3. Discriminated union with exhaustive type checking

**Decision:**
Use a **switch statement** in a dedicated `StreamBlock` component for polymorphic dispatch.

**Rationale:**
- **Explicit and readable** — Easy to see all cases at once
- **TypeScript exhaustive checking** — Compiler warns if new types aren't handled
- **Pattern 6 compliant** — Surface architecture composes specific blocks
- **No runtime overhead** — Direct dispatch, no registry lookup

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Registry pattern | Adds indirection; type safety harder to enforce |
| Render props | Over-engineered for this use case |
| HOC per type | Fragments component tree unnecessarily |

**Consequences:**
- Adding new StreamItemType requires updating switch
- All block components must have consistent props interface
- Compiler catches missing cases at build time

---

## ADR-002: Extract MarkdownRenderer vs. Replace

**Status:** Accepted

**Context:**
Current MarkdownRenderer is embedded in TerminalChat.tsx. Options:
1. Delete and replace entirely with SpanRenderer
2. Extract to separate file and use as fallback
3. Keep inline and conditionally use SpanRenderer

**Decision:**
**Extract** MarkdownRenderer to its own file and use as **fallback** when StreamItem has no `parsedSpans`.

**Rationale:**
- **Backward compatibility** — Existing content without spans still renders
- **Gradual migration** — Can mix old and new rendering
- **Reduced risk** — Fallback if SpanRenderer has issues
- **Code organization** — Cleaner separation of concerns

**Consequences:**
- Two rendering paths to maintain
- Need to ensure visual parity between renderers
- Eventually can deprecate MarkdownRenderer fallback

---

## ADR-003: Span Indices as Source of Truth

**Status:** Accepted

**Context:**
SpanRenderer needs to know where to highlight. Options:
1. Re-parse content for markdown markers
2. Use pre-parsed indices from RhetoricalSpan
3. Use both (indices + verification)

**Decision:**
Use **pre-parsed indices** from RhetoricalSpan as the single source of truth for span positions.

**Rationale:**
- **Sprint 1 already parses** — No duplicate work
- **Separation of concerns** — Parser parses, renderer renders
- **Performance** — No regex in render loop
- **Testability** — Renderer logic is pure (data → UI)

**Consequences:**
- Spans must have accurate indices from parser
- Need bounds checking for edge cases
- Content changes require re-parsing (handled by machine)

---

## ADR-004: Cognitive Bridge Injection Point

**Status:** Accepted

**Context:**
Cognitive Bridge needs to inject after specific messages. Options:
1. Special block type `'bridge'` in StreamItem[]
2. Separate overlay component
3. Inline injection in StreamRenderer based on `bridgeState`

**Decision:**
**Inline injection** in StreamRenderer, matching current TerminalChat pattern.

**Rationale:**
- **Consistent with current behavior** — Minimal change from existing
- **Not a stream item** — Bridge is UI state, not content
- **Flexible positioning** — `afterMessageId` determines placement
- **Preserves separation** — Bridge state managed externally

**Consequences:**
- StreamRenderer receives `bridgeState` props
- Injection happens between items, not as item
- Bridge visibility controlled by engagement machine

---

## ADR-005: Token-Based Span Styling

**Status:** Accepted

**Context:**
Span styles need to be configurable. Options:
1. Inline styles in components
2. Tailwind classes directly
3. CSS custom properties (tokens)

**Decision:**
Use **CSS custom properties** with `--chat-*` namespace for span styling.

**Rationale:**
- **Pattern 4 compliance** — Token namespaces are established
- **Theme-aware** — Light/dark mode via token overrides
- **Domain expert modifiable** — CSS, not code
- **Consistent with existing** — `--chat-*` tokens exist

**Token Design:**
```css
--chat-concept-text    /* Orange color */
--chat-concept-bg-hover /* Subtle highlight on hover */
--chat-action-text     /* Primary color for actions */
--chat-entity-text     /* Muted color for entities */
```

**Consequences:**
- Styling changes don't require component changes
- Need to document tokens for customization
- Must handle missing tokens gracefully

---

## ADR-006: SpanElement as Separate Component

**Status:** Accepted

**Context:**
Individual spans need consistent rendering with click handling. Options:
1. Inline JSX in SpanRenderer
2. Separate SpanElement component
3. Render function passed as prop

**Decision:**
Create a **private SpanElement component** within SpanRenderer module.

**Rationale:**
- **Encapsulation** — Implementation detail of SpanRenderer
- **Memoization** — Can optimize re-renders per span
- **Type safety** — Props interface enforces consistency
- **Not exported** — Internal detail, not public API

**Consequences:**
- SpanElement is file-private (not in index.ts)
- Style mapping happens in SpanElement
- Click handling unified in one place

---

## ADR-007: Block Components Receive Full StreamItem

**Status:** Accepted

**Context:**
Block components need item data. Options:
1. Pass full StreamItem as `item` prop
2. Destructure and pass only needed fields
3. Use context for item access

**Decision:**
Pass **full StreamItem** as `item` prop to all block components.

**Rationale:**
- **Consistency** — All blocks have same interface pattern
- **Future-proof** — New fields automatically available
- **Type safety** — TypeScript enforces StreamItem shape
- **Simplicity** — One prop vs. many

**Consequences:**
- Blocks may receive more data than needed
- Must not mutate item (read-only)
- Can destructure internally as needed

---

## ADR-008: ResponseBlock Owns Path Rendering

**Status:** Accepted

**Context:**
Suggested paths appear after responses. Options:
1. Separate NavigationBlock for all paths
2. ResponseBlock renders its own paths
3. StreamRenderer inserts NavigationBlock after ResponseBlock

**Decision:**
**ResponseBlock** renders its own `suggestedPaths` inline after the message bubble.

**Rationale:**
- **Colocation** — Paths belong to their response
- **Visual coherence** — Path buttons flow from response
- **Simpler stream** — No need for paired items
- **Matches vision** — "Glow lines at the bottom of each response"

**However:** Standalone NavigationBlock exists for explicit navigation items (e.g., journey forks as dedicated stream items).

**Consequences:**
- ResponseBlock is slightly more complex
- hasPaths() check in ResponseBlock
- NavigationBlock used for different purpose (explicit nav)

---

## ADR-009: No Animation in This Sprint

**Status:** Accepted

**Context:**
Vision includes glass effects and animations. Options:
1. Include basic animations now
2. Defer all animations to Sprint 3
3. Add animation hooks but no implementation

**Decision:**
**Defer all animations** to Sprint 3 (`kinetic-stream-polish-v1`).

**Rationale:**
- **Scope control** — Keep sprint focused on rendering logic
- **Risk reduction** — Animation bugs don't block core functionality
- **Clean separation** — Structure before style
- **Easier testing** — Static output simpler to verify

**Consequences:**
- Sprint 2 output may look "plain"
- Need to design with animation in mind (but not implement)
- Sprint 3 has clear scope

---

## ADR-010: Data-TestId for E2E Targeting

**Status:** Accepted

**Context:**
E2E tests need stable selectors. Options:
1. CSS class selectors
2. Text content selectors
3. data-testid attributes

**Decision:**
Use **data-testid** attributes on key components.

**Rationale:**
- **Stable** — Not affected by styling changes
- **Explicit** — Clear intent for testing
- **Best practice** — Testing Library recommendation
- **No production impact** — Stripped in production builds (optional)

**Implementation:**
```typescript
<div data-testid="stream-renderer">
<div data-testid="query-block">
<div data-testid="response-block">
<button data-testid="span-concept">
```

**Consequences:**
- Minor HTML bloat (acceptable)
- Tests are decoupled from implementation
- Need convention for testid naming

---

## Decision Summary

| ADR | Decision | Pattern Alignment |
|-----|----------|-------------------|
| 001 | Switch for polymorphic dispatch | Pattern 6 |
| 002 | Extract MarkdownRenderer as fallback | Backward compat |
| 003 | Pre-parsed indices as truth | Separation of concerns |
| 004 | Inline Cognitive Bridge injection | Existing pattern |
| 005 | Token-based span styling | Pattern 4 |
| 006 | Private SpanElement component | Encapsulation |
| 007 | Full StreamItem as prop | Consistency |
| 008 | ResponseBlock owns paths | Visual coherence |
| 009 | Defer animations to Sprint 3 | Scope control |
| 010 | data-testid for E2E | Testing best practice |

---

*Decisions documented: December 2024*
