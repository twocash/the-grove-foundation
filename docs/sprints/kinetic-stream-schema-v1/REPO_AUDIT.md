# Repository Audit: kinetic-stream-schema-v1

**Sprint Scope:** Define StreamItem schema extending ChatMessage, wire engagement machine to emit typed metadata.

---

## 1. Current State Analysis

### 1.1 Chat Message Handling

**Primary File:** `types.ts` (root)

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  metadata?: {
    hubId?: string;
    nodeId?: string;
    stage?: number;
    topic?: string;
    // ...additional metadata
  };
}
```

**Assessment:** ChatMessage is the de facto message type. The `metadata` field is already extensible. We should extend this pattern rather than creating `StreamItem` as a parallel type.

---

### 1.2 Terminal Chat Rendering

**Primary File:** `components/Terminal/TerminalChat.tsx`

**Current Pattern:**
- `ChatMessage[]` stored in parent state (TerminalFlow/TerminalShell)
- MarkdownRenderer parses content inline
- Bold text (`**phrase**`) becomes clickable "Orange Highlights"
- Arrow prompts (`→ prompt`) become SuggestionChips

**Key Observation:** The "ActiveSpan" concept already exists as inline parsing in MarkdownRenderer. The vision's `RhetoricalSpan` is a formalization of this.

```typescript
// Current inline parsing (lines 18-45)
const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|_[^_]+_)/g);
  // Maps **bold** to clickable spans with grove-clay color
};
```

**Pattern Match:** This is essentially Pattern 5 (Feature Detection) - we're detecting rhetorical features and responding. Should formalize into declarative detection.

---

### 1.3 Engagement Machine State

**Primary File:** `src/core/engagement/machine.ts`

**Current States:** idle, generating, complete, error (simplified)

**Current Events:** START_GENERATE, COMPLETE, ERROR, etc.

**Gap Identified:** The machine emits state transitions but doesn't emit structured metadata about the generated content. The new pattern requires:
- `STREAM_ITEM_CREATED` event with typed payload
- Metadata extraction happening in actions, not rendering

---

### 1.4 Rhetorical Skeleton Infrastructure

**Primary File:** `src/core/transformers/RhetoricalSkeleton.ts`

**Current State:** Defines rhetorical constraints for LLM content generation (headlines, subtext patterns). Does NOT currently parse responses for active spans.

**Gap:** Need a companion parser that identifies rhetorical spans in generated content.

---

### 1.5 Journey/Navigation System

**Primary Files:**
- `src/core/schema/journey.ts` - JourneyPath, JourneyNode types
- `hooks/useJourneyProgress.ts` - Journey state management

**Assessment:** JourneyPath already exists with `id`, `label`, `type`. The vision's "NavigationBlock" should use this, not reinvent it.

---

### 1.6 GroveObjectMeta Pattern

**Primary File:** `src/core/schema/grove-object.ts`

```typescript
export interface GroveObjectMeta {
  id: string;
  type: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: 'user' | 'system' | 'ai';
  status?: 'active' | 'archived' | 'draft';
  tags?: string[];
  favorite?: boolean;
}
```

**Assessment:** StreamItem SHOULD implement GroveObjectMeta for consistency with Pattern 7.

---

## 2. Files Requiring Changes

| File | Change Type | Scope |
|------|-------------|-------|
| `types.ts` | MODIFY | Extend ChatMessage with StreamItem fields |
| `src/core/schema/stream.ts` | CREATE | Define StreamItem, RhetoricalSpan types |
| `src/core/transformers/RhetoricalParser.ts` | CREATE | Parse content → ActiveSpans |
| `src/core/engagement/machine.ts` | MODIFY | Emit typed metadata |
| `src/core/engagement/actions.ts` | MODIFY | Add span extraction action |
| `components/Terminal/TerminalChat.tsx` | MODIFY (minimal) | Accept pre-parsed spans |

---

## 3. Technical Debt Identified

### 3.1 Inline Parsing in Rendering (Priority: HIGH)

The MarkdownRenderer currently parses markdown AND handles click behavior. This violates separation of concerns:
- Parsing should happen when content is generated (action layer)
- Rendering should consume pre-parsed structure

**Recommendation:** Extract parsing to `RhetoricalParser.ts`, render from structured data.

### 3.2 ChatMessage Metadata Sprawl (Priority: MEDIUM)

The `metadata` field on ChatMessage is growing organically with optional fields. Consider:
- Discriminated union based on `type` field
- Or structured sub-objects for different concerns

---

## 4. Existing Test Coverage

| Area | Coverage | Gap |
|------|----------|-----|
| Engagement Machine | Basic transitions | No tests for metadata emission |
| TerminalChat | None visible | Need behavior tests |
| RhetoricalSkeleton | None | Need parser tests |

**Recommendation:** This sprint should add unit tests for:
- `RhetoricalParser.parse()` - given content, returns spans
- Engagement machine metadata emission

---

## 5. Dependencies

### External Packages
- `xstate` - Already used for engagement machine
- No new dependencies required

### Internal Dependencies
- `GroveObjectMeta` - Must remain compatible
- `JourneyPath` - Must use existing type
- Engagement machine - Core integration point

---

## 6. DEX Compliance Check

| Pillar | Current State | Sprint Impact |
|--------|---------------|---------------|
| **Declarative Sovereignty** | ⚠️ Parsing is in rendering code | ✅ Move to declarative schema |
| **Capability Agnosticism** | ✅ Works with any LLM | ✅ Maintained |
| **Provenance** | ⚠️ No span attribution | ✅ Add span provenance |
| **Organic Scalability** | ⚠️ Hard to add new span types | ✅ Type-extensible |

---

## 7. Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Typed stream items | Pattern 7: GroveObjectMeta | StreamItem implements GroveObjectMeta |
| Rhetorical spans | Pattern 5: Entropy Detection | New detector for rhetorical features |
| Navigation paths | Pattern 3: Narrative Schema | Use existing JourneyPath type |
| Machine metadata | Pattern 2: Engagement Machine | Add metadata to context/events |

---

## 8. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Parsing breaks streaming | Medium | High | Test with partial content |
| Schema migration breaks chat | Low | High | Backward-compatible extension |
| Performance regression | Low | Medium | Lazy parsing, memoization |

---

*Audit completed: December 2024*
*Auditor: Claude (Foundation Loop)*
