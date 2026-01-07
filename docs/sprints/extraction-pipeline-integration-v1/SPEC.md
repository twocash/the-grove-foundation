# Specification: Extraction Pipeline Integration

**Sprint:** extraction-pipeline-integration-v1  
**Version:** 1.0  
**Date:** January 6, 2026  
**Status:** Ready for Execution

---

## 1. Executive Summary

Move prompt extraction from a manual Prompt Workshop operation to an integrated Pipeline Monitor workflow. Add bulk processing capability. Enhance extraction to produce complete, stage-aware PromptObjects.

**Key Changes:**
- Remove `ExtractionModal.tsx` from Prompt Workshop
- Add `extract-prompts` Copilot command to Pipeline Monitor
- Add bulk extraction toolbar action
- Enhanced extraction prompt with stage classification and systemContext generation

---

## 2. Problem Statement

The prototype sprint created manual extraction in the wrong location. Prompt extraction is document processing—it belongs in Pipeline Monitor alongside other enrichment operations like `summarize`, `extract keywords`, and `extract entities`.

Additionally, extracted prompts are missing critical facets:
- `systemContext` (LLM guidance) — empty
- `targeting.stages` — defaulting instead of inferred
- `topicAffinities` — not mapped to existing categories

---

## 3. Solution Design

### 3.1 Pipeline Monitor Integration

**New Copilot Command:**
```typescript
{
  id: 'extract-prompts',
  pattern: /^extract\s*prompts?$/i,
  description: 'Extract kinetic highlight prompts from document',
  requiresDocument: true,
  handler: 'handleExtractPrompts',
  preview: true,
}
```

**Bulk Actions (toolbar):**
- Extract from selected documents
- Extract from all documents
- Extract from unprocessed only

### 3.2 Enhanced Extraction Prompt

The extraction prompt must produce complete PromptObjects. Key additions:

**Stage Classification:**
```
GENESIS → "What is X?" questions
EXPLORATION → "How does X work?" questions  
SYNTHESIS → "How do I implement X?" questions
ADVOCACY → "How do I explain X to others?" questions
```

**System Context Generation:**
Each extracted prompt must include guidance for the LLM that will answer:
- What to emphasize
- What tone to use
- What examples to provide
- What to avoid

**Topic Mapping:**
Map concepts to existing categories: infrastructure, architecture, economics, ratchet-thesis, vision, community, philosophy, roles, engagement

### 3.3 Document Tracking

Add fields to track extraction status:
```typescript
promptsExtracted?: boolean;
promptExtractionAt?: string;
promptExtractionCount?: number;
```

---

## 4. Technical Design

### 4.1 Extraction Output Schema

```typescript
interface ExtractedConcept {
  // Identity
  concept: string;           // The phrase to highlight
  label: string;             // Natural question as label
  
  // Content
  executionPrompt: string;   // User voice - confused, curious
  systemContext: string;     // LLM guidance - CRITICAL
  
  // Targeting
  targetStages: Stage[];     // genesis/exploration/synthesis/advocacy
  stageReasoning: string;    // Why these stages
  topicCategory: string;     // From groveCoreConcepts categories
  
  // Quality
  confidence: number;        // 0-1
  salienceDimensions: string[]; // What makes this interesting
}
```

### 4.2 Stage Classification Rules

| Stage | Question Pattern | User State | Tone |
|-------|-----------------|------------|------|
| Genesis | "What is/does X mean?" | First encounter | Slightly confused |
| Exploration | "How does X work?" | Knows term, building model | Curious |
| Synthesis | "How do I use/implement X?" | Understands, wants to apply | Practical |
| Advocacy | "How do I explain X?" | Believes, wants to spread | Champion |

### 4.3 API Contract

```typescript
// POST /api/knowledge/extract-prompts
interface ExtractPromptsRequest {
  documentIds: string[];
  options?: {
    regenerate?: boolean;        // Re-extract even if done
    confidenceThreshold?: number; // Default 0.7
    stages?: Stage[];            // Limit to specific stages
  }
}

interface ExtractPromptsResponse {
  extracted: PromptObject[];     // Saved to data layer
  stats: {
    documentsProcessed: number;
    documentsSkipped: number;
    promptsExtracted: number;
    errors: Array<{ documentId: string; error: string }>;
  }
}
```

---

## 5. Implementation Plan

### Epic 1: Clean Up Prototype
- Delete `ExtractionModal.tsx`
- Remove extraction button from Prompt Workshop
- Verify Review Queue still works

### Epic 2: Pipeline Monitor Copilot Integration
- Add command to `document-copilot.config.ts`
- Implement `handleExtractPrompts` in `copilot-handlers.ts`
- Add document tracking fields to types

### Epic 3: Enhanced Extraction Engine
- Rewrite extraction prompt with stage classification
- Add systemContext generation
- Add topic category mapping
- Update `services/extraction/extractionPrompt.ts`

### Epic 4: Bulk Processing UI
- Add toolbar dropdown to Pipeline Monitor
- Implement multi-select extraction
- Add progress indicator for bulk operations

### Epic 5: API Endpoint
- Create `/api/knowledge/extract-prompts`
- Integrate with extraction service
- Save results to prompts data layer

---

## 6. Files Affected

| File | Action | Description |
|------|--------|-------------|
| `PromptWorkshop/ExtractionModal.tsx` | DELETE | Wrong location |
| `PromptWorkshop/PromptWorkshop.tsx` | MODIFY | Remove extraction button |
| `PipelineMonitor/document-copilot.config.ts` | MODIFY | Add extract-prompts command |
| `PipelineMonitor/copilot-handlers.ts` | MODIFY | Add handler |
| `PipelineMonitor/types.ts` | MODIFY | Add tracking fields |
| `PipelineMonitor/PipelineMonitorWithUpload.tsx` | MODIFY | Add bulk extraction toolbar |
| `services/extraction/extractionPrompt.ts` | MODIFY | Enhanced prompt |
| `server/api/knowledge/extract-prompts.ts` | CREATE | API endpoint |

---

## 7. DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| Declarative Sovereignty | Stage rules and topic mapping in prompt config, not code |
| Capability Agnosticism | Works with any LLM capable of structured JSON output |
| Provenance as Infrastructure | Full chain: Document → Extraction → Review → Curated |
| Organic Scalability | New documents become extraction candidates automatically |

---

## 8. Success Criteria

1. No extraction UI in Prompt Workshop
2. `extract prompts` command works in Pipeline Monitor
3. Bulk extraction processes multiple documents
4. Extracted prompts have populated:
   - `systemContext` with LLM guidance
   - `targeting.stages` based on question type
   - `topicAffinities` mapped to existing categories
5. Review Queue shows extracted prompts
6. Approved prompts work as kinetic highlights

---

## 9. Out of Scope

- Automatic extraction on document upload (future enhancement)
- Multi-stage prompt generation (one concept → multiple prompts per stage)
- Lens-specific extraction (all prompts default to base lens)
- Re-training extraction model (using existing LLM capabilities)
