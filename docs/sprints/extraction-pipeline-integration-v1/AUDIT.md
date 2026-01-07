# Foundation Loop Phase 0: Repository Audit

**Sprint:** extraction-pipeline-integration-v1  
**Date:** January 6, 2026  
**Domain Contract:** Bedrock Sprint Contract v1.0  
**Phase:** 0 (Pattern Check)

---

## 1. What We're Actually Building

**Goal:** Extract kinetic highlight prompts from RAG documents as part of the pipeline workflow, not as a manual operation in Prompt Workshop.

**The Correction:** The prototype sprint (`prompt-extraction-pipeline-v1`) created a manual "Extract from Document" button in Prompt Workshop. This is wrong. Extraction belongs in Pipeline Monitor as part of document processing.

---

## 2. Existing Patterns Analysis

### Pattern: Document Enrichment (Pipeline Monitor)

**Location:** `src/bedrock/consoles/PipelineMonitor/`

**How it works:**
1. Document uploaded → Embedding created → Document stored
2. User runs enrichment commands via Copilot: `enrich`, `extract keywords`, `summarize`, etc.
3. `/api/knowledge/enrich` API performs extraction via LLM
4. Results preview → User approves → Document updated

**Files:**
- `document-copilot.config.ts` — Command definitions
- `copilot-handlers.ts` — Handler implementations
- `types.ts` — Document types with enrichment fields

**Existing commands that inform our approach:**
```typescript
// Already exists - extracts concepts
'suggest-questions' → questions_answered[]
'extract-entities' → named_entities.concepts[]

// We need to add
'extract-prompts' → Creates PromptObjects in data layer
```

### Pattern: PromptObject (Full Schema)

**Location:** `src/core/context-fields/types.ts`

**Key facets we must populate:**

| Facet | Purpose | Source |
|-------|---------|--------|
| `label` | Display name | Generated: natural question |
| `executionPrompt` | User's voice | Generated: confused, curious |
| `systemContext` | LLM guidance | Generated: what to emphasize |
| `targeting.stages` | When relevant | **Inferred from question type** |
| `topicAffinities` | Topic weights | From `groveCoreConcepts.json` categories |
| `lensAffinities` | Persona weights | Default to `base`, infer from content |
| `highlightTriggers` | Activation phrases | The concept itself |
| `surfaces` | Where it appears | `['highlight', 'suggestion']` |
| `provenance` | Full tracking | Source doc, model, confidence |

### Pattern: Stage Targeting

**Stages and their question signatures:**

| Stage | Question Type | Signal Words |
|-------|--------------|--------------|
| **Genesis** | "What is X?" | "what does...mean", "what is", "I keep seeing" |
| **Exploration** | "How does X work?" | "how does", "why does", "explain how" |
| **Synthesis** | "How do I implement X?" | "how do I", "how would I", "implement", "build" |
| **Advocacy** | "How do I convince others?" | "convince", "explain to", "pitch", "persuade" |

**Extraction must classify each prompt's appropriate stage(s).**

### Pattern: Topic Categories

**Location:** `src/data/concepts/groveCoreConcepts.json`

**Valid categories (for topicAffinities):**
- `infrastructure`
- `architecture`
- `economics`
- `ratchet-thesis`
- `vision`
- `community`
- `philosophy`
- `roles`
- `engagement`

**Extraction must map concepts to these categories.**

---

## 3. What Already Exists (DO NOT RECREATE)

### In `prompt-extraction-pipeline-v1` (prototype)

| Created | Status | Keep/Remove |
|---------|--------|-------------|
| `src/services/extraction/` | Exists | **Keep** (move logic to API) |
| `ExtractionModal.tsx` | Exists | **REMOVE** (wrong location) |
| `ReviewQueue.tsx` | Exists | **Keep** (correct location) |
| Review workflow in usePromptData | Exists | **Keep** |

### Already Working

- Review queue in Prompt Workshop ✅
- Approve/reject workflow ✅
- Library prompts display ✅
- Provenance tracking ✅

---

## 4. What Needs to Change

### Change 1: Move Extraction to Pipeline Monitor

**Remove:** `ExtractionModal.tsx` from Prompt Workshop  
**Add:** `extract-prompts` command to Pipeline Monitor Copilot

```typescript
// document-copilot.config.ts - ADD
{
  id: 'extract-prompts',
  pattern: /^extract\s*prompts?$/i,
  description: 'Extract kinetic highlight prompts from document',
  requiresDocument: true,
  handler: 'handleExtractPrompts',
  preview: true,
}
```

### Change 2: Add Bulk Extraction

**Add:** Toolbar action in Pipeline Monitor for bulk operations

```typescript
// Options:
// - "Extract prompts from all documents"
// - "Extract prompts from filtered documents" (current filter)
// - "Re-extract prompts" (regenerate from previously processed)
```

### Change 3: Enhance Extraction Prompt

Current extraction produces minimal output. New extraction must produce **complete PromptObjects**:

```typescript
interface ExtractionOutput {
  concept: string;              // The phrase
  label: string;                // Natural question
  executionPrompt: string;      // User voice, confused, curious
  systemContext: string;        // LLM guidance - CRITICAL
  targetStages: Stage[];        // genesis/exploration/synthesis/advocacy
  topicCategory: string;        // From groveCoreConcepts categories
  confidence: number;
  whyThisStage: string;         // Reasoning for stage assignment
}
```

### Change 4: Stage-Aware Extraction Prompt

The extraction prompt must understand stage semantics:

```markdown
## Stage Classification Guide

For each concept, determine which stage(s) the generated question is appropriate for:

**GENESIS (first encounter)**
- User has never seen this term
- Question form: "What is X?", "What does X mean?"
- User tone: Slightly lost, needs grounding

**EXPLORATION (understanding mechanics)**
- User knows the term exists, wants to understand how it works
- Question form: "How does X work?", "Why does X matter?"
- User tone: Curious, building mental model

**SYNTHESIS (applying knowledge)**
- User understands concept, wants to use it
- Question form: "How do I implement X?", "How does X connect to Y?"
- User tone: Practical, integrating with their work

**ADVOCACY (teaching others)**
- User believes in concept, wants to spread it
- Question form: "How do I explain X to skeptics?", "What's the pitch for X?"
- User tone: Champion, needs talking points

Most prompts target 1-2 stages. A concept like "distributed ownership" might have:
- Genesis prompt: "What does distributed ownership mean?"
- Synthesis prompt: "How would I actually implement distributed ownership in my organization?"
```

---

## 5. API Integration

### New Endpoint Required

```typescript
// /api/knowledge/extract-prompts

POST /api/knowledge/extract-prompts
Body: {
  documentIds: string[];  // Which docs to process
  options?: {
    regenerate?: boolean; // Re-extract even if already processed
    confidenceThreshold?: number;
  }
}

Response: {
  extracted: ExtractedPromptCandidate[];
  processed: number;
  skipped: number;
  errors: { documentId: string; error: string }[];
}
```

### Document Tracking

Add to Document type (or use existing field):

```typescript
// Track whether prompts have been extracted from this doc
promptsExtracted?: boolean;
promptExtractionAt?: string;
promptExtractionCount?: number;
```

---

## 6. DEX Compliance Matrix

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Stage classification rules in prompt, not code. Topic mapping from JSON config. |
| **Capability Agnosticism** | Works with any LLM capable of structured output. Fallback to simpler extraction if model struggles. |
| **Provenance as Infrastructure** | Full chain: Document → Extraction → Review → Curated. Every prompt knows its source. |
| **Organic Scalability** | New documents automatically become extraction candidates. No deployment to add prompts. |

---

## 7. What We're NOT Doing

1. **NOT extending PromptObject type** — All needed facets already exist
2. **NOT creating new type definitions** — Use existing types properly
3. **NOT building manual extraction UI** — Pipeline integration only
4. **NOT changing library prompts system** — JSON remains read-only seeds
5. **NOT modifying kinetic highlights system** — It already works with any prompt

---

## 8. Sprint Scope

### Epic 1: Remove Manual Extraction from Workshop
- Remove `ExtractionModal.tsx`
- Remove "Extract from Document" button
- Keep Review Queue (it's correct)

### Epic 2: Add Pipeline Monitor Integration
- Add `extract-prompts` command to Copilot
- Add handler implementation
- Add bulk extraction toolbar action

### Epic 3: Enhanced Extraction Engine
- Update extraction prompt for full PromptObject output
- Add stage classification logic
- Add topic category mapping

### Epic 4: API Layer
- Create `/api/knowledge/extract-prompts` endpoint
- Add document tracking for extraction status
- Add bulk processing support

---

## 9. Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `PipelineMonitor/document-copilot.config.ts` | Modify | Add extract-prompts command |
| `PipelineMonitor/copilot-handlers.ts` | Modify | Add handleExtractPrompts |
| `PipelineMonitor/types.ts` | Modify | Add extraction tracking fields |
| `PromptWorkshop/ExtractionModal.tsx` | **DELETE** | Wrong location |
| `PromptWorkshop/PromptWorkshop.tsx` | Modify | Remove extraction button |
| `services/extraction/extractionPrompt.ts` | Modify | Enhanced prompt with stages |
| `api/knowledge/extract-prompts.ts` | Create | New API endpoint |

---

## 10. Success Criteria

1. ✅ No manual extraction in Prompt Workshop
2. ✅ `extract-prompts` command works in Pipeline Monitor
3. ✅ Bulk extraction processes all/filtered documents
4. ✅ Extracted prompts have complete targeting (stages, topics, lenses)
5. ✅ Extracted prompts have full systemContext guidance
6. ✅ Review queue in Workshop shows extracted prompts
7. ✅ Approved prompts work as kinetic highlights immediately

---

## 11. Advisory Council Check

| Advisor | Concern | Addressed |
|---------|---------|-----------|
| **Park (10)** | Extraction quality depends on LLM capability | Cloud API for extraction; stage classification is inference |
| **Short (8)** | Salience over volume | Enhanced prompt demands multi-dimensional relevance |
| **Adams (8)** | Interesting moments | systemContext guides LLM to create tension/curiosity |
| **Asparouhova (7)** | Maintainer burnout | Bulk operations reduce manual work; review is fast |

---

## 12. Recommendation

**Proceed to Phase 1 (SPEC.md)** with this scope:

1. Remove prototype's manual extraction UI
2. Integrate extraction into Pipeline Monitor workflow
3. Enhance extraction to produce complete, stage-aware PromptObjects
4. Add bulk processing for entire RAG

This aligns extraction with the document processing pipeline where it belongs, rather than treating it as a separate workflow.

---

*Next: Create SPEC.md with detailed implementation design*
