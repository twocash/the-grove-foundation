# Sprint Stories: kinetic-stream-schema-v1

**Epic/Story breakdown with tests and build gates**

---

## Sprint Overview

| Epic | Description | Stories | Estimated |
|------|-------------|---------|-----------|
| Epic 1 | Schema Foundation | 3 | 2 hours |
| Epic 2 | Rhetorical Parser | 3 | 3 hours |
| Epic 3 | Machine Integration | 4 | 4 hours |
| Epic 4 | Testing & Validation | 2 | 2 hours |

**Total Estimated:** 11 hours (1.5 days)

---

## Epic 1: Schema Foundation

**Goal:** Define the StreamItem and RhetoricalSpan types

### Story 1.1: Create Stream Schema Types

**Task:** Create `src/core/schema/stream.ts` with all type definitions

**Acceptance Criteria:**
- [ ] StreamItemType union defined
- [ ] RhetoricalSpanType union defined  
- [ ] RhetoricalSpan interface with all fields
- [ ] StreamItem interface implementing GroveObjectMeta pattern
- [ ] Type guards (isQueryItem, isResponseItem, hasSpans, hasPaths)
- [ ] JSDoc comments on all exports

**Tests:**
- Type compiles: `npm run typecheck`

**Files:**
- CREATE: `src/core/schema/stream.ts`

---

### Story 1.2: Add Conversion Utilities

**Task:** Add ChatMessage ↔ StreamItem converters

**Acceptance Criteria:**
- [ ] `fromChatMessage(msg: ChatMessage): StreamItem`
- [ ] `toChatMessage(item: StreamItem): ChatMessage`
- [ ] Handles all ChatMessage.metadata fields

**Tests:**
- Unit test: Conversion round-trip preserves data

**Files:**
- MODIFY: `src/core/schema/stream.ts`

---

### Story 1.3: Export from Schema Index

**Task:** Update schema index to export stream types

**Acceptance Criteria:**
- [ ] All stream types importable from `@/core/schema`
- [ ] Existing exports unchanged

**Tests:**
- Import test: `import { StreamItem } from '@/core/schema'`

**Files:**
- MODIFY: `src/core/schema/index.ts`

---

### Build Gate: Epic 1

```bash
npm run typecheck
# Expect: 0 errors

# Verify exports
node -e "require('./src/core/schema').StreamItem"
# Expect: No error (type exists)
```

---

## Epic 2: Rhetorical Parser

**Goal:** Extract structured spans from markdown content

### Story 2.1: Implement Core Parser

**Task:** Create `RhetoricalParser.ts` with `parse()` function

**Acceptance Criteria:**
- [ ] Extracts `**bold**` as concept spans
- [ ] Extracts `→ prompt` as action spans
- [ ] Returns spans sorted by startIndex
- [ ] Handles empty content gracefully
- [ ] Pure function (no side effects)

**Tests:**
- Unit: Bold extraction
- Unit: Arrow extraction
- Unit: Empty content
- Unit: Sort order

**Files:**
- CREATE: `src/core/transformers/RhetoricalParser.ts`

---

### Story 2.2: Add Helper Functions

**Task:** Add `parseByType()` and `hasRhetoricalContent()`

**Acceptance Criteria:**
- [ ] `parseByType(content, type)` filters by span type
- [ ] `hasRhetoricalContent(content)` returns boolean quickly
- [ ] Both handle edge cases

**Tests:**
- Unit: parseByType filtering
- Unit: hasRhetoricalContent detection

**Files:**
- MODIFY: `src/core/transformers/RhetoricalParser.ts`

---

### Story 2.3: Handle Streaming Content

**Task:** Ensure parser handles partial/streaming content safely

**Acceptance Criteria:**
- [ ] Incomplete `**bold` does not create span
- [ ] Incomplete `→ ` does not crash
- [ ] Parser is idempotent (same input → same output)

**Tests:**
- Unit: Partial bold
- Unit: Partial arrow
- Unit: Idempotency

**Files:**
- MODIFY: `src/core/transformers/RhetoricalParser.ts`

---

### Build Gate: Epic 2

```bash
npm test -- tests/unit/RhetoricalParser.test.ts
# Expect: All tests pass

npm run typecheck
# Expect: 0 errors
```

---

## Epic 3: Machine Integration

**Goal:** Wire parser into engagement machine

### Story 3.1: Extend Engagement Types

**Task:** Add stream fields to EngagementContext

**Acceptance Criteria:**
- [ ] `currentStreamItem: StreamItem | null` added
- [ ] `streamHistory: StreamItem[]` added
- [ ] Default values set in initial context
- [ ] Existing context fields unchanged

**Tests:**
- Type check passes
- Machine initializes with defaults

**Files:**
- MODIFY: `src/core/engagement/types.ts`

---

### Story 3.2: Create Stream Actions

**Task:** Implement stream-related XState actions

**Acceptance Criteria:**
- [ ] `createQueryItem` creates user query StreamItem
- [ ] `createResponseItem` creates empty AI response
- [ ] `appendToResponse` appends chunk to content
- [ ] `finalizeResponse` parses spans, adds to history

**Tests:**
- Unit: Each action produces expected context change

**Files:**
- MODIFY: `src/core/engagement/actions.ts`

---

### Story 3.3: Wire Actions to Transitions

**Task:** Add actions to machine transitions

**Acceptance Criteria:**
- [ ] `START_GENERATE` → `createQueryItem`, `createResponseItem`
- [ ] `STREAM_CHUNK` → `appendToResponse`
- [ ] `COMPLETE` → `finalizeResponse`
- [ ] Existing actions unchanged (additive only)

**Tests:**
- Integration: Full flow produces StreamItems
- Visual regression: UI unchanged

**Files:**
- MODIFY: `src/core/engagement/machine.ts`

---

### Story 3.4: Add Machine Unit Tests

**Task:** Test stream emission in isolation

**Acceptance Criteria:**
- [ ] Test: Query creates StreamItem in history
- [ ] Test: Response has parsed spans
- [ ] Test: History accumulates correctly

**Tests:**
- CREATE: `tests/integration/engagement-stream.test.ts`

**Files:**
- CREATE: `tests/integration/engagement-stream.test.ts`

---

### Build Gate: Epic 3

```bash
npm test
# Expect: All tests pass

npx playwright test tests/e2e/terminal-baseline.spec.ts
# Expect: No visual regression

npm run build
# Expect: Clean build
```

---

## Epic 4: Testing & Validation

**Goal:** Ensure quality and prevent regressions

### Story 4.1: Create Parser Unit Tests

**Task:** Comprehensive unit test suite for RhetoricalParser

**Acceptance Criteria:**
- [ ] ≥90% code coverage on parser
- [ ] Edge cases documented and tested
- [ ] Test file well-organized with describe blocks

**Tests:**
- CREATE: `tests/unit/RhetoricalParser.test.ts`

**Test Cases:**
```typescript
describe('RhetoricalParser', () => {
  describe('parse()', () => {
    it('extracts bold as concept spans');
    it('extracts arrows as action spans');
    it('handles mixed content');
    it('returns empty array for no matches');
    it('sorts spans by startIndex');
    it('handles nested content');
  });
  
  describe('parseByType()', () => {
    it('filters by concept type');
    it('filters by action type');
  });
  
  describe('hasRhetoricalContent()', () => {
    it('returns true for bold content');
    it('returns true for arrow content');
    it('returns false for plain content');
  });
  
  describe('edge cases', () => {
    it('handles incomplete bold markers');
    it('handles incomplete arrow markers');
    it('handles escaped characters');
    it('handles empty string');
    it('handles very long content');
  });
});
```

---

### Story 4.2: Run Full Test Suite

**Task:** Verify all tests pass, no regressions

**Acceptance Criteria:**
- [ ] `npm test` passes
- [ ] `npx playwright test` passes
- [ ] No console errors
- [ ] Build succeeds

**Tests:**
- Full test suite execution

---

### Build Gate: Epic 4 (Final)

```bash
# Full verification
npm run build && npm test && npx playwright test

# Coverage check
npm test -- --coverage
# Expect: New files ≥80% coverage

# Visual regression
npx playwright test tests/e2e/*-baseline.spec.ts
# Expect: All pass
```

---

## Commit Sequence

| Order | Type | Message |
|-------|------|---------|
| 1 | feat | feat(schema): add StreamItem and RhetoricalSpan types |
| 2 | feat | feat(parser): add RhetoricalParser for span extraction |
| 3 | feat | feat(engagement): add stream context fields |
| 4 | feat | feat(engagement): add stream actions and wire to machine |
| 5 | test | test(parser): add unit tests for RhetoricalParser |
| 6 | test | test(engagement): add integration tests for stream emission |
| 7 | chore | chore: update exports and documentation |

---

## Definition of Done

- [ ] All stories completed
- [ ] All build gates pass
- [ ] Types compile without errors
- [ ] Unit test coverage ≥80% on new code
- [ ] Visual regression tests pass
- [ ] No console errors in development
- [ ] DEVLOG updated with completion notes
- [ ] Ready for Sprint 2 handoff

---

*Sprint plan created: December 2024*
