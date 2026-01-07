# ARCHITECTURE.md - upload-pipeline-unification-v1

> **Sprint**: upload-pipeline-unification-v1
> **Created**: 2026-01-06

---

## Current Architecture (Imperative)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT: Manual Pipeline                     │
└─────────────────────────────────────────────────────────────────┘

User Action          API Call                    Result
─────────────        ────────────                ──────
Click "Add Files" → POST /api/knowledge/documents → Document stored
                                                        ↓
Click "Process"   → POST /api/knowledge/embed    → Keywords + vectors
                                                        ↓
Click "Extract"   → POST /api/prompts/extract-bulk → Raw concepts
                                                        ↓
                    (automatic polish)            → Enriched prompts

Problems:
❌ 4+ manual steps required
❌ Keywords are Grove-agnostic (generic extraction)
❌ No declared intent at upload time
❌ User must remember the sequence
```

---

## New Architecture (Declarative)

```
┌─────────────────────────────────────────────────────────────────┐
│                   NEW: Declarative Pipeline                     │
└─────────────────────────────────────────────────────────────────┘

                    GROVE_WORLDVIEW_CONTEXT
                    (single source of truth)
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────┐            ┌─────────────┐           ┌──────────┐
│ Keyword │            │  Concept    │           │  Polish  │
│ Extract │            │ Extraction  │           │(titles,  │
│         │            │             │           │targeting)│
└─────────┘            └─────────────┘           └──────────┘
    │                         │                         │
    └─────────────────────────┼─────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Unified Pipeline│
                    │   Execution     │
                    └─────────────────┘
                              │
                              ▼

User Action                API Call                    Result
─────────────              ────────────                ──────
Click "Add Files"   → Configure settings in modal
Click "Upload"      → POST /api/knowledge/documents   → Document + settings
Click "Process"     → POST /api/knowledge/embed       → FULL PIPELINE
                      {runExtraction, runEnrichment}
                              │
                              ├─→ Grove-weighted keywords
                              ├─→ Semantic vectors
                              ├─→ Concept extraction
                              └─→ Grove-enriched prompts

Benefits:
✅ 2 clicks (upload + process)
✅ Keywords weighted for Grove vocabulary
✅ Intent declared at upload time
✅ Single source of truth for context
```

---

## Data Flow: Grove Context Through Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                 GROVE_WORLDVIEW_CONTEXT                         │
│                                                                 │
│   8 vocabulary terms:                                           │
│   • Computational Sovereignty                                   │
│   • The Ratchet Thesis                                          │
│   • Efficiency-Enlightenment Loop                               │
│   • Knowledge Commons                                           │
│   • Hybrid Cognition                                            │
│   • Gardener/Observer Dynamic                                   │
│   • Epistemic Independence                                      │
│   • Technical Frontier                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  extractKeywords │  │ polishExtracted │  │ enrichPrompt    │
│                 │  │ Concepts        │  │ Titles/Target   │
│ Grove vocab in  │  │                 │  │                 │
│ keyword prompt  │  │ Grove thesis    │  │ Grove vocab     │
│                 │  │ grounding       │  │ enforcement     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Better semantic │  │ Grounded        │  │ Consistent      │
│ search vectors  │  │ concepts        │  │ vocabulary      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      COHERENT GROVE CORPUS    │
              │                               │
              │  • Search finds Grove concepts│
              │  • Prompts use Grove language │
              │  • Documents interconnect via │
              │    shared vocabulary          │
              └───────────────────────────────┘
```

---

## Upload Modal Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      UPLOAD MODAL                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              [Drop files here]                            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Processing Pipeline:                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ☑ Embed for search (required)                             │  │
│  │ ☑ Extract exploration prompts                             │  │
│  │   └─ ☑ Auto-enrich with Grove context                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                        [Upload & Process]                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    POST /api/knowledge/documents
                    {
                      files: [...],
                      processingSettings: {
                        extractPrompts: true,
                        autoEnrich: true
                      }
                    }
```

---

## Unified Embed Endpoint Flow

```
POST /api/knowledge/embed
{
  documentIds?: [...],
  limit?: 10,
  runExtraction: true,
  runEnrichment: true
}
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ Step 1: Embedding                                             │
│                                                               │
│   for each document:                                          │
│     1. extractKeywords(content, title)  ← GROVE_WORLDVIEW     │
│     2. generateEmbedding(content)                             │
│     3. store keywords + vectors                               │
│                                                               │
│   Result: { processed: N, errors: [...] }                     │
└───────────────────────────────────────────────────────────────┘
        │
        ▼ (if runExtraction)
┌───────────────────────────────────────────────────────────────┐
│ Step 2: Extraction                                            │
│                                                               │
│   for each embedded document:                                 │
│     1. buildClaudeExtractionPrompt(doc)                       │
│     2. extractConcepts from LLM response                      │
│                                                               │
│   Result: raw concepts array                                  │
└───────────────────────────────────────────────────────────────┘
        │
        ▼ (if runEnrichment)
┌───────────────────────────────────────────────────────────────┐
│ Step 3: Polish/Enrichment                                     │
│                                                               │
│   polishExtractedConcepts(concepts, doc)  ← GROVE_WORLDVIEW   │
│     - Grove vocabulary enforcement                            │
│     - Compelling titles                                       │
│     - Focused execution prompts                               │
│     - Lens targeting suggestions                              │
│                                                               │
│   Result: enriched prompts saved to corpus                    │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
Response:
{
  embedded: { processed: 5, errors: [] },
  extracted: { prompts: 12, errors: [] }
}
```

---

## Design Principles

### 1. Declarative at Point of Intent
User declares what they want when they upload, not as separate steps later.

### 2. Single Source of Truth
`GROVE_WORLDVIEW_CONTEXT` used by ALL pipeline stages.

### 3. Graceful Degradation
Each stage can fail independently without blocking others. Errors reported per-stage.

### 4. Backward Compatible
Documents without settings still process (embedding only, like before).

### 5. Progressive Enhancement
Settings add capability, don't remove existing behavior.
