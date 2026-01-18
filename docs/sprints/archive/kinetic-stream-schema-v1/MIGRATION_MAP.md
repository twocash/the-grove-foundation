# Migration Map: kinetic-stream-schema-v1

**Purpose:** File-by-file change plan with execution order and dependencies

---

## Migration Overview

```
Phase 1: Schema Definition (No Runtime Changes)
    ↓
Phase 2: Parser Implementation
    ↓
Phase 3: Machine Integration
    ↓
Phase 4: Testing & Validation
```

---

## Phase 1: Schema Definition

### 1.1 Create Stream Schema

| Action | File | Details |
|--------|------|---------|
| CREATE | `src/core/schema/stream.ts` | StreamItem, RhetoricalSpan types |

**Dependencies:** None  
**Risk:** Low (additive only)

**Content:**
- StreamItemType union
- RhetoricalSpanType union
- RhetoricalSpan interface
- StreamItem interface
- Type guards (isQueryItem, hasSpans, etc.)
- Conversion utilities (fromChatMessage, toChatMessage)

### 1.2 Update Schema Index

| Action | File | Details |
|--------|------|---------|
| MODIFY | `src/core/schema/index.ts` | Add stream exports |

**Change:**
```typescript
// Add to existing exports
export * from './stream';
```

---

## Phase 2: Parser Implementation

### 2.1 Create Rhetorical Parser

| Action | File | Details |
|--------|------|---------|
| CREATE | `src/core/transformers/RhetoricalParser.ts` | Parse content → spans |

**Dependencies:** Phase 1 complete  
**Risk:** Low (isolated module)

**Exports:**
- `parse(content: string): ParseResult`
- `parseByType(content, type): RhetoricalSpan[]`
- `hasRhetoricalContent(content): boolean`

### 2.2 Update Transformers Index

| Action | File | Details |
|--------|------|---------|
| MODIFY | `src/core/transformers/index.ts` | Add parser export |

**Change:**
```typescript
export * from './RhetoricalParser';
```

---

## Phase 3: Machine Integration

### 3.1 Extend Engagement Types

| Action | File | Details |
|--------|------|---------|
| MODIFY | `src/core/engagement/types.ts` | Add stream context fields |

**Changes:**
```typescript
import { StreamItem } from '../schema/stream';

export interface EngagementContext {
  // ... existing fields unchanged ...
  
  // NEW: Stream infrastructure
  currentStreamItem: StreamItem | null;
  streamHistory: StreamItem[];
}
```

**Risk:** Medium (affects type checks across codebase)  
**Mitigation:** All new fields optional or have defaults

### 3.2 Add Stream Actions

| Action | File | Details |
|--------|------|---------|
| MODIFY | `src/core/engagement/actions.ts` | Add stream-related actions |

**New Actions:**
- `createQueryItem` - Create user query StreamItem
- `createResponseItem` - Create empty response StreamItem
- `appendToResponse` - Append chunk to current item
- `finalizeResponse` - Parse spans, finalize item, add to history

**Dependencies:** Parser and types complete  
**Risk:** Medium

### 3.3 Wire Machine Transitions

| Action | File | Details |
|--------|------|---------|
| MODIFY | `src/core/engagement/machine.ts` | Add actions to transitions |

**Changes:**
- `START_GENERATE` → calls `createQueryItem`, `createResponseItem`
- `STREAM_CHUNK` → calls `appendToResponse`
- `COMPLETE` → calls `finalizeResponse`

**Risk:** High (core state machine)  
**Mitigation:** Keep existing actions, add new ones alongside

---

## Phase 4: Testing

### 4.1 Parser Unit Tests

| Action | File | Details |
|--------|------|---------|
| CREATE | `tests/unit/RhetoricalParser.test.ts` | Unit tests for parser |

**Test Cases:**
- Bold extraction (concept spans)
- Arrow extraction (action spans)
- Mixed content
- Empty content
- Partial/streaming content
- Edge cases (nested, escaped)

### 4.2 Machine Integration Tests

| Action | File | Details |
|--------|------|---------|
| CREATE | `tests/integration/engagement-stream.test.ts` | Integration tests |

**Test Cases:**
- Query creates StreamItem
- Response creates StreamItem with spans
- History accumulates correctly
- Legacy ChatMessage compatibility

---

## File Change Summary

| File | Action | Phase | Risk |
|------|--------|-------|------|
| `src/core/schema/stream.ts` | CREATE | 1 | Low |
| `src/core/schema/index.ts` | MODIFY | 1 | Low |
| `src/core/transformers/RhetoricalParser.ts` | CREATE | 2 | Low |
| `src/core/transformers/index.ts` | MODIFY | 2 | Low |
| `src/core/engagement/types.ts` | MODIFY | 3 | Medium |
| `src/core/engagement/actions.ts` | MODIFY | 3 | Medium |
| `src/core/engagement/machine.ts` | MODIFY | 3 | High |
| `tests/unit/RhetoricalParser.test.ts` | CREATE | 4 | Low |
| `tests/integration/engagement-stream.test.ts` | CREATE | 4 | Low |

**Total Files:** 9 (4 new, 5 modified)

---

## Rollback Plan

### If Phase 1-2 Fails:
Delete new files. No runtime impact.

### If Phase 3 Fails:
```bash
# Revert engagement changes
git checkout HEAD -- src/core/engagement/
```

The new context fields are optional, so partial rollback is safe.

---

## Verification Checkpoints

### After Phase 1:
```bash
npm run typecheck
# Expect: No type errors
```

### After Phase 2:
```bash
npm test -- tests/unit/RhetoricalParser.test.ts
# Expect: All tests pass
```

### After Phase 3:
```bash
npm test
npx playwright test tests/e2e/terminal-baseline.spec.ts
# Expect: All tests pass, no visual regression
```

### Final:
```bash
npm run build && npm test && npx playwright test
# Expect: Clean build, all tests green
```

---

*Migration map approved: [Pending]*
