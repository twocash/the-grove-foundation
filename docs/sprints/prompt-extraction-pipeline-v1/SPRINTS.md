# Sprint: prompt-extraction-pipeline-v1

## Status: Ready for Execution

## The Vision

Documents → Extracted Prompts → Human Review → Curated Library → Kinetic Highlights

This closes the loop on organic scalability.

---

## Prerequisites

- [x] Prompt Workshop displays library prompts (prompt-library-readonly-v1)
- [x] Read-only mode for library prompts
- [x] Duplicate-to-customize workflow
- [ ] Anthropic API key in environment

---

## Epics

### Epic 1: Extraction Service
- [ ] Story 1.1: Create extraction types (`src/services/extraction/types.ts`)
- [ ] Story 1.2: Create extraction prompt template (`extractionPrompt.ts`)
- [ ] Story 1.3: Create extraction service (`promptExtractor.ts`)
- [ ] Story 1.4: Create index export (`index.ts`)

### Epic 2: Update Types for Extraction
- [ ] Story 2.1: Add extraction provenance to PromptProvenance
- [ ] Story 2.2: Add extraction metadata to PromptPayload

### Epic 3: Review Queue UI
- [ ] Story 3.1: Add reviewQueue accessor to usePromptData
- [ ] Story 3.2: Add approve/reject methods
- [ ] Story 3.3: Create ReviewQueue component
- [ ] Story 3.4: Integrate into PromptWorkshop

### Epic 4: Extraction Trigger UI
- [ ] Story 4.1: Create ExtractionModal component
- [ ] Story 4.2: Add extraction button to PromptWorkshop

---

## Build Gates

After Epic 1:
```bash
npm run build  # Service compiles
```

After Epic 2:
```bash
npm run build  # Types check
```

After Epic 3:
```bash
npm run build
npm run dev
# Manual: Review queue visible, approve/reject work
```

After Epic 4:
```bash
npm run build
npm run dev
# Full extraction → review → curate flow works
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/services/extraction/types.ts` | Extraction type definitions |
| `src/services/extraction/extractionPrompt.ts` | The extraction prompt template |
| `src/services/extraction/promptExtractor.ts` | Core extraction logic |
| `src/services/extraction/index.ts` | Service exports |
| `src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx` | Review queue component |
| `src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx` | Extraction trigger UI |

## Files Modified

| File | Change |
|------|--------|
| `src/core/context-fields/types.ts` | Add extraction provenance fields |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | Add reviewQueue, approve, reject |
| `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.tsx` | Integrate queue and modal |

---

## Execution

```bash
cd C:\GitHub\the-grove-foundation
claude "Read docs/sprints/prompt-extraction-pipeline-v1/EXECUTION_PROMPT.md and execute"
```

---

## Success Criteria

1. ✅ Extract concepts from any Grove document via UI
2. ✅ Extracted prompts appear in Review Queue with confidence scores
3. ✅ Approve/reject workflow updates prompt source and status
4. ✅ Approved prompts become curated and work as kinetic highlights
5. ✅ Full provenance chain from source document to live highlight

---

## The Recursion

When complete:

```
You write a document about Grove
         ↓
Extraction pipeline identifies concepts
         ↓
You review and approve in Workshop
         ↓
Users click highlights and learn
         ↓
Telemetry reveals what resonates
         ↓
You write better documents
         ↓
[Loop]
```

*"The system teaches itself what to teach."*
