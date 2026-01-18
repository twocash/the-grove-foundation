# Specification: kinetic-stream-schema-v1

**Epic:** Transform chat from text log to typed DEX object stream  
**Sprint Owner:** Jim Calhoun  
**Sprint Duration:** 1 week  

---

## 1. Executive Summary

This sprint establishes the **declarative schema foundation** for the Kinetic Stream architecture. It extends `ChatMessage` with typed metadata, formalizes the "Orange Highlights" as `RhetoricalSpan` objects, and wires the engagement machine to emit structured content—preparing the ground for Sprint 2's polymorphic renderer.

The key insight: **we are not creating parallel infrastructure**. We are extending existing patterns (ChatMessage, GroveObjectMeta, Engagement Machine) to support richer content representation.

---

## 2. Goals

### 2.1 Primary Goals

1. **Define StreamItem Schema** - Extend ChatMessage with typed fields for:
   - `itemType`: 'query' | 'response' | 'navigation' | 'reveal' | 'system'
   - `spans`: RhetoricalSpan[] for parsed active content
   - `suggestedPaths`: JourneyPath[] for navigation options
   - Implement GroveObjectMeta for identity/provenance

2. **Create RhetoricalParser** - Extract active spans from content:
   - Parse `**bold**` → concept spans (the "Orange" behavior)
   - Parse `→ prompt` → action spans
   - Return structured data, not React nodes

3. **Wire Engagement Machine** - Emit typed metadata:
   - Add `spans` and `paths` to machine context
   - Parse content in machine actions, not rendering
   - Maintain streaming compatibility

### 2.2 Success Criteria

| Criterion | Verification |
|-----------|--------------|
| StreamItem schema defined | Types compile, match GroveObjectMeta |
| RhetoricalParser extracts spans | Unit tests pass with sample content |
| Machine emits structured metadata | Integration test verifies context |
| Backward compatible | Existing chat works unchanged |
| Tests added | ≥80% coverage on new code |

---

## 3. Non-Goals (Explicit Scope Boundaries)

### 3.1 NOT in this sprint:

- ❌ **New renderer components** - Sprint 2 builds StreamRenderer
- ❌ **UX/animation changes** - Sprint 3 handles polish
- ❌ **Floating input console** - Separate surface concern
- ❌ **LLM prompt changes** - Parsing works on existing output
- ❌ **Lens hover cards** - Future enhancement

### 3.2 Deferred to Sprint 2:

- ActiveResponseBlock component
- NavigationBlock component
- Polymorphic StreamRenderer

### 3.3 Deferred to Sprint 3:

- Glass styling
- Framer Motion animations
- Scroll anchoring

---

## 4. Patterns Extended

Per Phase 0 Pattern Check:

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Typed stream items | Pattern 7: GroveObjectMeta | StreamItem implements GroveObjectMeta |
| Rhetorical detection | Pattern 5: Entropy Detection | RhetoricalParser as new detector |
| Navigation paths | Pattern 3: Narrative Schema | Reuse JourneyPath (no new type) |
| Machine metadata | Pattern 2: Engagement Machine | Add `stream` field to context |

## No New Patterns Proposed

All needs met by extending existing infrastructure.

---

## 5. Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Message types | `types.ts` | ChatMessage | **EXTEND** with itemType |
| Object identity | `grove-object.ts` | GroveObjectMeta | **USE** as base interface |
| Content parsing | `TerminalChat.tsx` | Inline parseInline() | **PORT** to RhetoricalParser |
| Navigation | `journey.ts` | JourneyPath | **USE** existing type |
| State machine | `engagement/machine.ts` | XState machine | **EXTEND** context |

### No Duplication Certification

I confirm this sprint does not create parallel implementations of existing capabilities. All new code extends existing patterns.

---

## 6. Technical Approach

### 6.1 Schema Design

```typescript
// src/core/schema/stream.ts

import { GroveObjectMeta } from './grove-object';
import { JourneyPath } from './journey';

export type StreamItemType = 
  | 'query'      // User input
  | 'response'   // AI response
  | 'navigation' // Journey fork point
  | 'reveal'     // Lens/concept reveal
  | 'system';    // Status messages

export interface RhetoricalSpan {
  id: string;
  text: string;
  type: 'concept' | 'action' | 'entity';
  startIndex: number;
  endIndex: number;
  conceptId?: string;    // Link to knowledge graph
  confidence?: number;   // Parsing confidence
}

export interface StreamItem extends Partial<GroveObjectMeta> {
  // Required identity
  id: string;
  type: StreamItemType;
  timestamp: number;
  
  // Content
  content: string;           // Raw markdown
  parsedSpans?: RhetoricalSpan[];
  
  // Navigation (for response items)
  suggestedPaths?: JourneyPath[];
  
  // State
  isGenerating?: boolean;
  
  // Provenance (inherited from GroveObjectMeta pattern)
  createdBy?: 'user' | 'system' | 'ai';
}
```

### 6.2 Parser Architecture

```typescript
// src/core/transformers/RhetoricalParser.ts

export interface ParseResult {
  spans: RhetoricalSpan[];
  cleanContent: string;  // Content with span markers stripped
}

export function parse(content: string): ParseResult {
  // 1. Identify bold phrases → concept spans
  // 2. Identify arrow prompts → action spans
  // 3. Return structured spans with indices
}
```

### 6.3 Machine Integration

```typescript
// In engagement/machine.ts

context: {
  // ... existing fields
  currentStreamItem: StreamItem | null;
  streamHistory: StreamItem[];
}

// New action
parseContent: assign({
  currentStreamItem: (ctx, event) => ({
    ...ctx.currentStreamItem,
    parsedSpans: RhetoricalParser.parse(event.content).spans
  })
})
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

**File:** `tests/unit/RhetoricalParser.test.ts`

```typescript
describe('RhetoricalParser', () => {
  it('extracts bold as concept spans', () => {
    const result = parse('The **Grove** is distributed AI.');
    expect(result.spans).toHaveLength(1);
    expect(result.spans[0]).toMatchObject({
      text: 'Grove',
      type: 'concept',
      startIndex: 4,
      endIndex: 13
    });
  });

  it('extracts arrow prompts as action spans', () => {
    const result = parse('→ Tell me more about Grove');
    expect(result.spans[0].type).toBe('action');
  });

  it('handles streaming content gracefully', () => {
    const partial = 'The **Grov';  // Incomplete bold
    const result = parse(partial);
    expect(result.spans).toHaveLength(0);  // No false positives
  });
});
```

### 7.2 Integration Tests

**File:** `tests/integration/engagement-stream.test.ts`

```typescript
describe('Engagement Machine Stream Emission', () => {
  it('emits StreamItem with parsed spans on COMPLETE', async () => {
    const machine = createTestMachine();
    machine.send({ type: 'START_GENERATE', prompt: 'test' });
    machine.send({ type: 'COMPLETE', content: 'The **Grove** awaits.' });
    
    expect(machine.context.currentStreamItem).toMatchObject({
      type: 'response',
      parsedSpans: expect.arrayContaining([
        expect.objectContaining({ text: 'Grove' })
      ])
    });
  });
});
```

### 7.3 Build Gate

```bash
npm test -- --coverage
# Expect: ≥80% on new files
npx playwright test tests/e2e/terminal-baseline.spec.ts
# Expect: No visual regressions
```

---

## 8. Acceptance Criteria (Testable)

| # | Criterion | Test Method |
|---|-----------|-------------|
| AC1 | StreamItem type compiles without error | `npm run typecheck` |
| AC2 | StreamItem implements GroveObjectMeta fields | Type assertion test |
| AC3 | RhetoricalParser.parse() extracts bold phrases | Unit test |
| AC4 | RhetoricalParser.parse() extracts arrow prompts | Unit test |
| AC5 | Engagement machine context includes StreamItem | Integration test |
| AC6 | Existing chat rendering unchanged | Visual regression |
| AC7 | No new React contexts created | Code review |
| AC8 | JourneyPath reused (not new type) | Code review |

---

## 9. Dependencies

### Blocks:
- None (this sprint unblocks Sprint 2)

### Blocked By:
- None

### Related:
- Sprint 2 will consume StreamItem in renderer
- Sprint 3 will add animations to rendered stream

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Parsing breaks streaming | Test with partial content; defensive parsing |
| Schema too rigid | Make all new fields optional |
| Performance impact | Memoize parser results; lazy parse on demand |
| Breaking change | Extend ChatMessage, don't replace |

---

## 11. DEX Compliance

### Declarative Sovereignty
- RhetoricalSpan types can be extended via schema
- Parser rules could move to config (future)

### Capability Agnosticism
- Parser works on any markdown, any LLM output
- No model-specific assumptions

### Provenance
- StreamItem.createdBy tracks origin
- Spans link to conceptId for knowledge graph

### Organic Scalability
- New span types added by extending union
- New item types added by extending StreamItemType

---

*Specification approved: [Pending]*  
*Sprint start: [TBD]*
