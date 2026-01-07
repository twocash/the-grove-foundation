# REPO_AUDIT.md - prompt-refinement-v1

> Generated: 2026-01-06
> Sprint Tier: SPRINT (1-3 days)
> Branch: bedrock (implied by PromptWorkshop location)

---

## 1. Current State Analysis

### 1.1 PromptWorkshop Console

**Location**: `src/bedrock/consoles/PromptWorkshop/`

| File | Lines | Purpose | Sprint Impact |
|------|-------|---------|---------------|
| `index.tsx` | ~150 | Console registration, ModuleShell wrapper | MINOR - add batch selection UI |
| `PromptEditor.tsx` | 455 | Section-based inspector (matches LensEditor pattern) | MAJOR - add Source Context section, QA actions |
| `ReviewQueue.tsx` | 189 | Pending review queue with approve/reject | MAJOR - add keyboard shortcuts, batch selection |
| `PromptCopilotActions.ts` | 292 | Existing copilot action handlers | MAJOR - add QA layer actions |
| `usePromptData.ts` | ~100 | Data loading hook | MINOR - add source document fetching |
| `prompt-transforms.ts` | ~80 | API ↔ GroveObject transforms | MINOR - add new fields |

### 1.2 Prompt Schema

**Location**: `src/core/schema/prompt.ts`

Current `PromptPayload` includes:
- `executionPrompt: string` - Single field (needs restructuring)
- `interestingBecause?: string` - Already extracted, use for conceptAngle
- `salienceDimensions?: string[]` - Already extracted
- `provenance?: PromptProvenance` - Source tracking exists

**Missing fields** (per REQUIREMENTS):
- `userIntent?: string`
- `conceptAngle?: string` (renamed from responseGuidance)
- `suggestedFollowups?: string[]`

### 1.3 Context Fields Types

**Location**: `src/core/context-fields/types.ts`

`PromptProvenance` interface already has:
- `sourceDocIds?: string[]`
- `sourceDocTitles?: string[]`
- `extractionConfidence?: number`
- `extractionBatch?: string`
- `reviewNotes?: string`

✅ Provenance infrastructure exists - no changes needed.

### 1.4 Extraction Pipeline

**Location**: `lib/knowledge/` (server-side)

| File | Purpose | Sprint Impact |
|------|---------|---------------|
| `extractionPrompt.ts` | LLM prompt for concept extraction | MAJOR - add title style options |
| `extractConcepts.ts` | Extraction orchestration | MEDIUM - add userIntent/conceptAngle |
| `types.js` | Database row types | MINOR - add new columns |

### 1.5 API Layer

**Existing endpoints**:
- `PATCH /api/prompts/:id` - Update prompt (verify working)
- `POST /api/bedrock/copilot` - Copilot action dispatch

**Missing endpoints**:
- `POST /api/prompts/:id/qa` - Copilot QA validation (new)
- `GET /api/documents/:id/context` - Source context retrieval (new)

### 1.6 Test Infrastructure

**Existing tests**:
- `tests/e2e/pipeline-inspector.spec.ts` - Document inspector patterns
- `tests/unit/copilot/` - Copilot action tests

**Missing tests**:
- E2E: Prompt approval/rejection flow
- E2E: Batch selection and keyboard shortcuts
- Integration: Copilot QA actions
- Unit: Title transformation logic

---

## 2. Pattern Compliance Check

### 2.1 Patterns to EXTEND

| Pattern | Location | Extension Required |
|---------|----------|-------------------|
| GroveObject Model | `src/core/schema/` | Add prompt payload fields |
| Bedrock Copilot | `src/bedrock/patterns/copilot/` | Add QA-specific actions |
| Console Factory | `src/bedrock/patterns/console-factory.tsx` | No changes needed |
| Module Shell | `src/bedrock/patterns/module-shell.tsx` | Add batch selection slot |
| Inspector Section | `src/bedrock/patterns/inspector-section.tsx` | Use existing collapsible |

### 2.2 Anti-Patterns to AVOID

| Anti-Pattern | Risk | Mitigation |
|--------------|------|------------|
| Hardcoded conditionals | Source !== 'library' checks | Use status/capabilities pattern |
| Feature in wrong home | Batch logic in UI component | Extract to usePromptSelection hook |
| Presentation-bound logic | Title transform in React | Create pure utility functions |

---

## 3. File-Level Impact Assessment

### 3.1 Files to CREATE

```
src/bedrock/consoles/PromptWorkshop/
├── hooks/
│   ├── usePromptSelection.ts      # Batch selection state management
│   └── useSourceContext.ts        # Source document fetching
├── components/
│   ├── SourceContextSection.tsx   # Collapsible source display
│   ├── QAResultsSection.tsx       # QA results display
│   ├── BatchActions.tsx           # Batch action bar
│   └── TargetingSection.tsx       # 4D lens compatibility matrix
├── utils/
│   ├── TitleTransforms.ts         # Title style transformations
│   └── TargetingInference.ts      # Stage-depth mapping, lens inference
└── PromptQAActions.ts             # QA-specific copilot actions

lib/api/prompts/
└── qa.ts                          # QA validation endpoint handler

tests/e2e/
└── prompt-workshop.spec.ts        # E2E tests for prompt refinement
```

### 3.2 Files to MODIFY

```
src/core/schema/prompt.ts                    # Add new payload fields
src/bedrock/consoles/PromptWorkshop/
├── PromptEditor.tsx                         # Add Source Context section
├── ReviewQueue.tsx                          # Add keyboard shortcuts, batch selection
├── PromptCopilotActions.ts                  # Integrate QA actions
└── usePromptData.ts                         # Add source document fetching

lib/knowledge/extractionPrompt.ts            # Add title style generation
lib/knowledge/extractConcepts.ts             # Generate structured execution prompt

pages/api/prompts/[id]/qa.ts                 # New QA endpoint
```

### 3.3 Files UNCHANGED (verify only)

```
src/bedrock/patterns/console-factory.tsx     # Should support selection
src/bedrock/patterns/inspector-section.tsx   # Already has collapsible
src/bedrock/context/BedrockCopilotContext.tsx # Already dispatches actions
```

---

## 4. Database Schema Analysis

### 4.1 Current prompts Table

From Supabase schema (inferred):
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  meta JSONB,           -- GroveObjectMeta
  payload JSONB,        -- PromptPayload
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4.2 Required Additions

**Option A: JSONB payload extension** (recommended)
- No schema migration needed
- Add fields to PromptPayload TypeScript type
- Existing rows remain compatible (optional fields)

**Option B: Dedicated columns**
- Requires migration
- Better query performance
- More complex maintenance

**Decision**: Use Option A (JSONB payload extension)

---

## 5. Risk Assessment

### 5.1 High Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Extraction prompt changes break existing flow | Medium | High | A/B test with feature flag |
| Batch operations cause race conditions | Low | Medium | Optimistic UI with rollback |
| Source document missing/deleted | Medium | Low | Graceful degradation, show "unavailable" |

### 5.2 Medium Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Copilot QA latency impacts UX | Medium | Medium | Show loading states, cache results |
| Title transformations feel formulaic | Medium | Low | Provide multiple options, manual override |

### 5.3 Low Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Keyboard shortcuts conflict | Low | Low | Document in console header |

---

## 6. Dependency Graph

```mermaid
graph TD
    A[PromptPayload Schema] --> B[PromptEditor.tsx]
    A --> C[ReviewQueue.tsx]
    A --> D[PromptCopilotActions.ts]
    
    E[usePromptSelection] --> C
    E --> F[Batch Operations]
    
    G[useSourceContext] --> B
    G --> H[SourceContextSection]
    
    I[TitleTransforms] --> D
    I --> J[extractionPrompt.ts]
    
    D --> K[PromptQAActions.ts]
    K --> L[/api/prompts/qa]
```

---

## 7. Recommended Execution Order

1. **Schema first**: Add fields to `PromptPayload` (non-breaking)
2. **UI infrastructure**: `usePromptSelection`, `useSourceContext` hooks
3. **Source context display**: `SourceContextSection` in Inspector
4. **Copilot QA actions**: `PromptQAActions.ts` with API endpoint
5. **Keyboard shortcuts**: Integrate into `ReviewQueue`
6. **Batch operations**: Selection UI + batch action dispatch
7. **Title transforms**: Update extraction prompt, add `/make-compelling`
8. **E2E tests**: Full workflow coverage

---

## 8. Open Questions for DECISIONS.md

1. **Source context fetch**: Lazy load on Inspector open, or pre-fetch for visible items?
2. **Batch size limits**: Max prompts in single batch operation?
3. **QA result caching**: Cache Copilot QA results, or always fresh?
4. **Title style default**: Question style vs. topic phrase as default?
5. **Keyboard shortcut scope**: Global (window) or scoped to ReviewQueue?
