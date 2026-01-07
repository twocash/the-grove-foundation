# REQUIREMENTS.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06
> **Type**: Architecture Unification + DEX Pattern Implementation

---

## Problem Statement

Current document processing requires **multiple manual steps**:

```
Upload → Wait → Click "Process Queue" → Wait → Click "Bulk Extract" → Wait → Polish
```

This is **imperative**, not **declarative**. Users must remember the sequence and execute each step manually.

**Additional Problem**: Embedding keyword extraction is **Grove-agnostic**. The current `extractKeywords()` function generates generic keywords without Grove vocabulary weighting, causing:
- Poor semantic search results for Grove-specific queries
- Keywords don't reflect the corpus's worldview
- Missed connections between documents sharing Grove concepts

---

## Solution: Declarative Pipeline at Upload Time

**DEX Pattern**: Declare intent at the point of action.

```
┌─────────────────────────────────────────────────────────────────┐
│ Upload Documents                                                │
│                                                                 │
│ [Drop files here]                                               │
│                                                                 │
│ Processing Pipeline:                                            │
│ ☑ Embed for search (required)                                  │
│ ☑ Extract exploration prompts                                   │
│   └─ ☑ Auto-enrich with Grove context                          │
│                                                                 │
│ [Upload & Process]                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Grove Context as Infrastructure**: `GROVE_WORLDVIEW_CONTEXT` informs ALL pipeline stages:

| Stage | How Grove Context Helps |
|-------|------------------------|
| **Keyword Extraction** | Weight Grove vocabulary (8 terms) in extracted keywords |
| **Embedding** | Better semantic vectors via Grove-aware keywords |
| **Concept Extraction** | Ground concepts in Grove thesis |
| **Polish** | Enforce Grove vocabulary in titles/targeting |

---

## User Stories

### US-1: Declarative Processing Settings
**As a** curator uploading documents  
**I want** to declare processing intent at upload time  
**So that** the system executes the full pipeline automatically

**Acceptance Criteria:**
- Upload modal shows processing checkboxes
- Settings stored in document metadata
- "Process Queue" reads settings and executes appropriate pipeline
- Single button triggers entire declared pipeline

### US-2: Grove-Weighted Keywords
**As a** user searching the corpus  
**I want** keywords to reflect Grove vocabulary  
**So that** semantic search understands Grove-specific queries

**Acceptance Criteria:**
- `extractKeywords()` uses `GROVE_WORLDVIEW_CONTEXT`
- Keywords include Grove terms when document discusses related concepts
- Search for "computational sovereignty" finds relevant documents

### US-3: Unified Pipeline Execution
**As a** curator  
**I want** "Process Queue" to run the full declared pipeline  
**So that** I don't need to click multiple buttons in sequence

**Acceptance Criteria:**
- If `extractPrompts: true`, embedding triggers extraction
- If `autoEnrich: true`, extraction triggers polish
- Progress shown for each stage
- Errors reported per-stage without blocking subsequent documents

### US-4: Context Consistency
**As a** system maintainer  
**I want** all pipeline stages to use the same Grove context  
**So that** the corpus maintains vocabulary coherence

**Acceptance Criteria:**
- `GROVE_WORLDVIEW_CONTEXT` used by: extractKeywords, polishExtractedConcepts, enrichPromptTitles, enrichPromptTargeting
- Single source of truth (constant, not lookup)
- Context version tracked in document metadata

---

## Scope

### In Scope
- Add processing settings UI to `UploadModal.tsx`
- Store settings in document metadata schema
- Modify `/api/knowledge/embed` to execute full pipeline based on settings
- Modify `extractKeywords()` to use `GROVE_WORLDVIEW_CONTEXT`
- Track context version in document/prompt metadata

### Out of Scope
- Changing the manual "Bulk Extract" button (keep for ad-hoc use)
- Per-document settings override after upload
- Real-time pipeline progress websocket (future enhancement)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Clicks to full processing | 2 (upload + process) → down from 4+ |
| Grove keyword density | 30%+ of keywords are Grove vocabulary when relevant |
| QA flags on auto-processed prompts | 50% reduction vs manual |
| Pipeline completion rate | 95%+ (graceful degradation on errors) |

---

## Dependencies

- `GROVE_WORLDVIEW_CONTEXT` constant (from extraction-grove-context-v1 sprint)
- Existing embedding infrastructure (`/api/knowledge/embed`)
- Existing extraction infrastructure (`/api/prompts/extract-bulk`)
- Existing polish infrastructure (`polishExtractedConcepts`)
