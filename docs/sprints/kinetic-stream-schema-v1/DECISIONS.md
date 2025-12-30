# Decisions: kinetic-stream-schema-v1

**Architectural Decision Records (ADRs) for this sprint**

---

## ADR-001: Extend ChatMessage, Don't Replace

### Context

The vision document proposed a new `StreamItem` type to replace `ChatMessage`. However, `ChatMessage` is used throughout the codebase and represents the fundamental unit of chat interaction.

### Decision

**Extend ChatMessage pattern with StreamItem, maintaining backward compatibility.**

StreamItem:
- Adds `type` discriminator for polymorphic rendering
- Adds `parsedSpans` for rhetorical analysis
- Adds `suggestedPaths` for navigation
- Provides `fromChatMessage()` and `toChatMessage()` converters

### Rationale

1. **Backward Compatibility**: Existing code continues to work unchanged
2. **Gradual Migration**: Can migrate consumers incrementally
3. **Pattern 7 Alignment**: StreamItem implements GroveObjectMeta principles
4. **No Parallel Systems**: Single conceptual model for messages

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Replace ChatMessage entirely | Breaking change, requires full codebase migration |
| Embed StreamItem in ChatMessage.metadata | Loses type safety, awkward access patterns |
| Create separate StreamItem storage | Creates parallel data flow, violates DRY |

### Consequences

- Two type names referring to related concepts (acceptable during transition)
- Conversion utilities needed for interop
- Documentation must clarify relationship

---

## ADR-002: Parse in Action Layer, Not Rendering

### Context

Currently, the "Orange Highlights" are created by inline regex parsing in `MarkdownRenderer` during React rendering. This mixes parsing logic with presentation.

### Decision

**Move parsing to the engagement machine action layer.**

When `COMPLETE` event fires:
1. `finalizeResponse` action calls `RhetoricalParser.parse()`
2. Spans are stored in `StreamItem.parsedSpans`
3. Renderer consumes pre-parsed data

### Rationale

1. **Separation of Concerns**: Parsing is data transformation, not rendering
2. **Reusability**: Parsed spans can be persisted, analyzed, shared
3. **Performance**: Parse once, render many times
4. **Testability**: Parser can be unit tested in isolation

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Keep parsing in renderer | Violates SoC, not reusable |
| Parse on first access (lazy) | Still in render path, timing issues |
| Parse in API layer (backend) | Adds latency, requires backend changes |

### Consequences

- Slight delay after stream complete while parsing
- Memory usage increases (storing span data)
- Clear separation enables future enhancements

---

## ADR-003: Use JourneyPath for Navigation, Not New Type

### Context

The vision document proposed `NavigationBlock` with custom path definitions. However, `JourneyPath` already exists in the narrative schema.

### Decision

**Reuse JourneyPath for suggestedPaths, don't create new type.**

```typescript
// In StreamItem
suggestedPaths?: JourneyPath[];
```

### Rationale

1. **Pattern 3 Compliance**: Narrative Schema pattern already handles journeys
2. **No Duplication**: Single source of truth for path concepts
3. **Existing Infrastructure**: Journey hooks, rendering already exist

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Create NavigationPath type | Duplicates JourneyPath semantics |
| Embed path data inline | Loses type safety, can't reuse |

### Consequences

- May need to extend JourneyPath with additional fields (future sprint)
- Navigation rendering can use existing journey components

---

## ADR-004: Spans Store Indices, Not Rendered Content

### Context

Spans could store either:
1. Text content + indices into original
2. Pre-rendered React nodes
3. Transformation of original content

### Decision

**Spans store text and indices, render from indices.**

```typescript
interface RhetoricalSpan {
  text: string;       // The span text
  startIndex: number; // Start in original content
  endIndex: number;   // End in original content
  // NOT: renderedNode: ReactNode
}
```

### Rationale

1. **Serialization**: Spans can be stored in JSON, sent over network
2. **Framework Agnostic**: Not tied to React
3. **Reprocessing**: Original content can be re-parsed with different rules
4. **Debugging**: Clear relationship between content and spans

### Consequences

- Renderer must reconstruct React nodes from spans
- Slightly more complex rendering logic
- Full flexibility for future enhancements

---

## ADR-005: Testing Strategy - Unit + Visual Regression

### Context

This sprint modifies core infrastructure. Need appropriate test coverage without over-engineering.

### Decision

**Two-tier testing approach:**

1. **Unit Tests**: Parser logic, type conversions
2. **Visual Regression**: Ensure no UI breakage

No E2E behavioral tests for this sprint (defer to Sprint 2 when renderer exists).

### Rationale

1. **Parser is pure function**: Perfect for unit testing
2. **Machine changes are internal**: Verified through visual non-regression
3. **No new UI**: No new behaviors to test E2E

### Consequences

- Fast feedback on parser correctness
- Safety net for unintended visual changes
- Sprint 2 will add behavioral E2E tests

---

## ADR-006: Span ID Generation Strategy

### Context

Each RhetoricalSpan needs a unique ID for React keys and potential future persistence.

### Decision

**Generate IDs client-side using counter + timestamp.**

```typescript
let spanIdCounter = 0;
function generateSpanId(): string {
  return `span_${++spanIdCounter}_${Date.now()}`;
}
```

### Rationale

1. **Simplicity**: No external dependencies
2. **Uniqueness**: Counter + timestamp sufficient for session
3. **Debuggability**: Human-readable format

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| UUID v4 | Overkill for ephemeral spans |
| Content hash | Same content would have same ID (problematic) |
| Index only | Not unique across stream items |

### Consequences

- IDs not suitable for long-term persistence (acceptable)
- Counter resets on page refresh (acceptable)
- Can upgrade to UUID later if needed

---

*Decisions documented: December 2024*
*Reviewer: [Pending]*
