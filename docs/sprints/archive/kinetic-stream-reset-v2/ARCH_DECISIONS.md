# Architecture Decisions: Kinetic Stream Reset v2

**Sprint:** kinetic-stream-reset-v2
**Date:** December 28, 2025

---

## ADR-001: Discriminated Union for StreamItem Types

### Context

The current `StreamItem` interface uses a single interface with a `type` field and optional properties for all variants. This provides weak type safety - TypeScript cannot narrow types in switch statements.

### Decision

**Adopt discriminated union pattern** for StreamItem types.

### Rationale

1. **Type Safety:** TypeScript's control flow analysis narrows types automatically in switch statements
2. **Self-Documentation:** Each variant's required fields are explicit
3. **Compiler Assistance:** Adding new fields to wrong variant causes compile errors
4. **Pattern Alignment:** Matches Pattern 3 (Narrative Schema) conventions

### Consequences

**Positive:**
- Type guards like `isResponseItem(item)` now narrow to `ResponseStreamItem`
- IDE autocomplete shows correct fields per variant
- Invalid field access caught at compile time

**Negative:**
- Breaking change for code accessing `item.content` without type guard
- Requires updating all switch statements to use proper narrowing

### Implementation

```typescript
// Before
if (item.type === 'response') {
  // item.parsedSpans might not exist, no TS help
}

// After
if (isResponseItem(item)) {
  // item is ResponseStreamItem, parsedSpans guaranteed to exist (or be undefined in type)
}
```

---

## ADR-002: Separate NavigationParser from RhetoricalParser

### Context

Requirements propose putting `<navigation>` block parsing into the RhetoricalSkeleton. However, the existing `RhetoricalParser.ts` handles span extraction, while `RhetoricalSkeleton.ts` is actually a configuration file for content generation.

### Decision

**Create new `NavigationParser.ts`** for `<navigation>` block extraction, keep `RhetoricalParser.ts` for span extraction.

### Rationale

1. **Single Responsibility:** Each parser does one thing well
2. **Naming Clarity:** `RhetoricalSkeleton.ts` is not a parser - it's config. Don't add parsing to it.
3. **Pipeline Order:** Navigation parsing must happen BEFORE rhetorical parsing (strips the block from content)
4. **Testability:** Separate parsers are easier to test in isolation

### Consequences

**Positive:**
- Clear separation of concerns
- Can test navigation parsing without rhetorical parsing
- Navigation block format can evolve independently

**Negative:**
- Two imports instead of one in machine.ts
- Must call parsers in correct order

### Implementation

```typescript
// In machine.ts finalizeResponse action
const { forks, cleanContent } = parseNavigation(rawContent);
const { spans } = parse(cleanContent);  // Uses cleaned content
```

---

## ADR-003: Inline Navigation vs Separate NavigationBlock Items

### Context

Requirements show two approaches:
1. Navigation embedded in ResponseStreamItem (`item.navigation: JourneyFork[]`)
2. Separate NavigationStreamItem in the stream

### Decision

**Primary: Inline navigation in ResponseStreamItem.** Optional: Allow standalone NavigationStreamItem for future use cases.

### Rationale

1. **User Experience:** Forks appear immediately after relevant response, no visual separation
2. **Provenance:** Fork context tied to specific response that generated it
3. **Simplicity:** One response = one set of navigation options
4. **Future Flexibility:** Standalone NavigationStreamItem can be used for injected prompts

### Consequences

**Positive:**
- Simpler UI rendering - ResponseBlock handles its own navigation
- Natural association between response and forks
- Less stream item clutter

**Negative:**
- Can't show navigation without a response
- Navigation can't float independently in stream

### Implementation

ResponseBlock conditionally renders NavigationBlock:

```tsx
{hasNavigation(item) && !item.isGenerating && (
  <NavigationBlock forks={item.navigation!} onSelect={onForkSelect} />
)}
```

---

## ADR-004: Fork Type Visual Hierarchy (primary/secondary/tertiary)

### Context

Requirements specify three fork types (`deep_dive`, `pivot`, `apply`) with different visual emphasis. Options:
1. Different component per type
2. Single component with variant prop
3. CSS-only differentiation

### Decision

**Single ForkButton component with variant prop**, mapped to CSS classes.

### Rationale

1. **Pattern 4 Alignment:** Visual behavior controlled by CSS tokens, not component logic
2. **DRY:** One button component, three CSS variants
3. **Declarative:** Fork type → visual variant is data mapping, not code branching
4. **Themeable:** Different deployments can restyle without code changes

### Consequences

**Positive:**
- Fork type assignment happens at parse time
- Component is pure rendering, no business logic
- Easy to add new fork types

**Negative:**
- All fork types share same DOM structure
- Complex hover states require more CSS

### Implementation

```tsx
<button className={`fork-button fork-button--${variant}`}>
  {FORK_ICONS[fork.type]}
  {fork.label}
</button>
```

---

## ADR-005: Pivot Context on QueryStreamItem

### Context

When user clicks a concept span (pivot click), the resulting query should carry context about where it came from. Options:
1. Inject context into query text
2. Store context as separate field
3. Store reference to source response

### Decision

**Store PivotContext as separate field on QueryStreamItem**, don't modify query text.

### Rationale

1. **Provenance:** Source response ID enables tracing back to origin
2. **API Flexibility:** Backend can use context without parsing query text
3. **UI Display:** QueryBlock can show "From: {sourceText}" badge
4. **Analytics:** Pivot patterns can be tracked separately from query content

### Consequences

**Positive:**
- Clean separation of query text and context
- Backend can enhance RAG with source context
- UI can show pivot origin visually

**Negative:**
- Backend must handle optional pivot field
- Slightly more complex QueryStreamItem type

### Implementation

```typescript
interface PivotContext {
  sourceResponseId: string;  // Which response this came from
  sourceText: string;        // The clicked concept text
  sourceContext: string;     // Surrounding text (optional)
  targetId?: string;         // ConceptId if known
}
```

---

## ADR-006: Fallback Fork Type Inference

### Context

LLM may not include fork type in `<navigation>` output. How to handle missing types?

### Decision

**Infer type from label text** using keyword matching, default to `pivot`.

### Rationale

1. **Graceful Degradation:** System works even with minimal LLM output
2. **Capability Agnosticism:** Doesn't require specific model behavior
3. **User Experience:** Forks still appear with reasonable styling
4. **Tunable:** Keyword list can be adjusted without code changes

### Consequences

**Positive:**
- Works with any LLM that outputs basic navigation
- No breaking change if model format changes
- Default `pivot` is safest visual option

**Negative:**
- Inference may be wrong sometimes
- Keywords are English-centric

### Implementation

```typescript
function inferForkType(label: string): JourneyForkType {
  const lower = label.toLowerCase();
  if (lower.includes('deep') || lower.includes('more about')) return 'deep_dive';
  if (lower.includes('try') || lower.includes('apply')) return 'apply';
  return 'pivot';
}
```

---

## ADR-007: Keep SuggestionChip for Legacy Compatibility

### Context

NavigationBlock currently uses SuggestionChip. Requirements say to replace it with ForkButton. Should we delete SuggestionChip?

### Decision

**Keep SuggestionChip, deprecate after migration complete.**

### Rationale

1. **Gradual Migration:** Some code paths may still use JourneyPath (legacy)
2. **Rollback Safety:** If ForkButton has issues, SuggestionChip still works
3. **ResponseBlock Still Uses It:** For `suggestedPaths` (legacy field)
4. **Low Risk:** Small component, minimal maintenance

### Consequences

**Positive:**
- Zero-risk migration path
- Can run both systems in parallel during transition
- Easy rollback

**Negative:**
- Two similar components in codebase temporarily
- Potential confusion about which to use

### Implementation

```
Phase 1: Add ForkButton, NavigationBlock uses it
Phase 2: Migrate ResponseBlock suggestedPaths to use NavigationBlock
Phase 3: Deprecate SuggestionChip with TODO comment
Phase 4: Remove SuggestionChip in future sprint
```

---

## ADR-008: Span Click Handler Includes Response ID

### Context

Current `onSpanClick` signature is `(span: RhetoricalSpan) => void`. Pivot mechanic needs to know which response the span came from.

### Decision

**Add responseId to handler:** `(span: RhetoricalSpan, responseId: string) => void`

### Rationale

1. **Provenance:** Pivot context requires source response ID
2. **Analytics:** Track which responses generate pivots
3. **Future Proofing:** Multiple responses visible, need disambiguation

### Consequences

**Positive:**
- Complete provenance chain
- Works with any stream layout

**Negative:**
- Breaking change to handler signature
- All consumers must be updated

### Implementation

```tsx
// StreamRenderer
onSpanClick={(span) => props.onSpanClick?.(span, item.id)}

// TerminalChat
const handleSpanClick = (span: RhetoricalSpan, responseId: string) => {
  // Can now construct PivotContext
};
```

---

## Summary Table

| ADR | Decision | Risk | Reversibility |
|-----|----------|------|---------------|
| ADR-001 | Discriminated union | Low | Hard (type system change) |
| ADR-002 | Separate NavigationParser | Low | Easy |
| ADR-003 | Inline navigation | Low | Medium |
| ADR-004 | Fork variants via CSS | Low | Easy |
| ADR-005 | PivotContext field | Low | Easy |
| ADR-006 | Fallback type inference | Medium | Easy |
| ADR-007 | Keep SuggestionChip | Low | N/A |
| ADR-008 | ResponseId in handler | Low | Easy |

---

*Architecture decisions documented. Proceed to TEST_STRATEGY.md.*
