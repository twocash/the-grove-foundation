# SPRINTS.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06
> **Type**: Architecture Unification + DEX Pattern

---

## Sprint Overview

| Attribute | Value |
|-----------|-------|
| Duration | ~2.5 hours |
| Complexity | Medium-High |
| Risk | Low (additive changes, backward compatible) |
| Files Changed | 3 |
| Functions Modified/Added | 4 |

---

## Story Breakdown

### Story 0: Verify GROVE_WORLDVIEW_CONTEXT Exists
**Estimate**: 5 min

| Task | Description |
|------|-------------|
| 0.1 | Search for `GROVE_WORLDVIEW_CONTEXT` in server.js |
| 0.2 | If missing, add it (copy from extraction-grove-context-v1 spec) |
| 0.3 | Verify constant includes 8 vocabulary terms |

**Acceptance**: Constant exists and is accessible in server.js

---

### Story 1: Grove-Weighted Keyword Extraction
**Estimate**: 20 min

| Task | Description |
|------|-------------|
| 1.1 | Find `extractKeywords` function in server.js |
| 1.2 | Replace prompt with Grove-weighted version |
| 1.3 | Include all 8 Grove vocabulary terms |
| 1.4 | Test with sample document |

**Acceptance**: Keywords include Grove terms when document discusses related concepts

---

### Story 2: Unified Pipeline Endpoint
**Estimate**: 40 min

| Task | Description |
|------|-------------|
| 2.1 | Find `/api/knowledge/embed` endpoint |
| 2.2 | Add `runExtraction`, `runEnrichment` params |
| 2.3 | Implement conditional extraction after embedding |
| 2.4 | Add `extractPromptsFromDocuments` helper function |
| 2.5 | Handle errors per-document |
| 2.6 | Return combined response |

**Acceptance**: 
- Endpoint accepts new params
- Full pipeline runs when params provided
- Backward compatible (no params = embed only)

---

### Story 3: Upload Modal Settings UI
**Estimate**: 30 min

| Task | Description |
|------|-------------|
| 3.1 | Open `UploadModal.tsx` |
| 3.2 | Add state for `extractPrompts`, `autoEnrich` |
| 3.3 | Add checkbox UI section |
| 3.4 | Style to match glass design system |
| 3.5 | Conditional display of nested checkbox |

**Acceptance**: Modal shows processing settings when files selected

---

### Story 4: Process Queue Handler Update
**Estimate**: 15 min

| Task | Description |
|------|-------------|
| 4.1 | Open `PipelineMonitorWithUpload.tsx` |
| 4.2 | Modify `handleProcess` to include new params |
| 4.3 | Handle extraction results in response |
| 4.4 | Show extraction result notification |

**Acceptance**: "Process Queue" triggers full pipeline

---

### Story 5: Validation & Testing
**Estimate**: 30 min

| Task | Description |
|------|-------------|
| 5.1 | `npm run build` passes |
| 5.2 | Upload document with settings enabled |
| 5.3 | Verify keywords include Grove vocabulary |
| 5.4 | Click "Process Queue" |
| 5.5 | Verify prompts appear automatically |
| 5.6 | Test backward compat (API call without new params) |
| 5.7 | Test error handling (bad document) |

**Acceptance**: Full pipeline works, backward compatible

---

## Execution Order

```
0. Verify GROVE_WORLDVIEW_CONTEXT exists
   ↓
1. Grove-weighted keyword extraction
   ↓
2. Unified pipeline endpoint (backend)
   ↓
3. Upload modal settings UI (frontend)
   ↓
4. Process queue handler update
   ↓
5. Validation & testing
```

---

## Dependencies

```
extraction-grove-context-v1 (GROVE_WORLDVIEW_CONTEXT constant)
         │
         ▼
upload-pipeline-unification-v1 (this sprint)
```

If extraction-grove-context-v1 isn't complete:
- Story 0 adds the constant
- Both sprints can run in parallel or this sprint can include the constant

---

## Rollback Plan

Each change is additive and reversible:

| Change | Rollback |
|--------|----------|
| Grove keywords | Revert prompt to original |
| Embed endpoint params | Ignore new params if issues |
| UI checkboxes | Remove JSX section |
| Process handler | Remove new params from fetch |

---

## Definition of Done

- [ ] `GROVE_WORLDVIEW_CONTEXT` constant exists
- [ ] `extractKeywords` uses Grove vocabulary prompt
- [ ] `/api/knowledge/embed` accepts `runExtraction`, `runEnrichment`
- [ ] Helper function `extractPromptsFromDocuments` works
- [ ] Upload modal shows processing settings
- [ ] "Process Queue" runs full pipeline
- [ ] Keywords include Grove terms when relevant
- [ ] Prompts generated automatically after processing
- [ ] Backward compatibility verified
- [ ] `npm run build` passes
- [ ] DEVLOG updated
