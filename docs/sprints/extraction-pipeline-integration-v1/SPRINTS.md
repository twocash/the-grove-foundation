# Sprint Breakdown: Extraction Pipeline Integration

**Sprint:** extraction-pipeline-integration-v1  
**Version:** 1.0

---

## Epic 1: Clean Up Prototype [~30 min]

### Task 1.1: Delete ExtractionModal.tsx
```bash
rm src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx
```

### Task 1.2: Update PromptWorkshopWithExtraction.tsx
- Remove ExtractionModal import
- Remove extraction button from header
- Keep Review Queue functionality
- Rename to `PromptWorkshopWithReview.tsx`

### Task 1.3: Update index.ts exports
- Remove ExtractionModal export
- Update PromptWorkshopWithExtraction reference

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 2: Pipeline Monitor Copilot Integration [~1 hr]

### Task 2.1: Add Command Definition
**File:** `src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts`

Add to COMMANDS array:
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

Add quick action:
```typescript
{ id: 'extract-prompts', label: 'Prompts', icon: 'auto_awesome', command: 'extract prompts' }
```

### Task 2.2: Add Document Tracking Fields
**File:** `src/bedrock/consoles/PipelineMonitor/types.ts`

Add to Document interface:
```typescript
// Prompt extraction tracking
promptsExtracted?: boolean;
promptExtractionAt?: string;
promptExtractionCount?: number;
```

### Task 2.3: Implement Handler
**File:** `src/bedrock/consoles/PipelineMonitor/copilot-handlers.ts`

Add handler function and update dispatcher.

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 3: Enhanced Extraction Engine [~1.5 hr]

### Task 3.1: Update Extraction Prompt
**File:** `src/services/extraction/extractionPrompt.ts`

Completely rewrite buildExtractionPrompt to include:
- Stage classification guide
- Topic category list
- Enhanced systemContext requirements
- Updated output schema

### Task 3.2: Update Types
**File:** `src/services/extraction/types.ts`

Update ExtractedConcept interface to include:
```typescript
targetStages: Stage[];
stageReasoning: string;
topicCategory: string;
```

### Task 3.3: Update Transformer
**File:** `src/services/extraction/promptExtractor.ts`

Update transformToPromptCandidate to:
- Map targetStages to targeting.stages
- Map topicCategory to topicAffinities
- Use enhanced systemContext

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 4: Bulk Processing UI [~1 hr]

### Task 4.1: Add Bulk Extraction Toolbar
**File:** `src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`

Add toolbar with dropdown:
- "Extract Prompts" button with dropdown
- Options: From selected, From all, From unprocessed
- Wire up to handler

### Task 4.2: Add Multi-Select Support
If not already present, add document selection state and checkbox UI.

### Task 4.3: Implement Bulk Handler
Add handleBulkExtraction function that:
- Collects document IDs based on selection
- Calls API with batching
- Shows progress/results

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 5: API Endpoint [~1 hr]

### Task 5.1: Create API Route
**File:** `server/api/knowledge/extract-prompts.ts`

Create POST handler:
- Parse documentIds from body
- Call extraction service for each
- Save results to prompts data layer
- Return aggregated stats

### Task 5.2: Update Document After Extraction
After successful extraction:
- Set promptsExtracted: true
- Set promptExtractionAt: ISO timestamp
- Set promptExtractionCount: number extracted

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Final Verification

### Manual Tests
1. Delete ExtractionModal - build passes
2. Pipeline Monitor: `extract prompts` command works
3. Pipeline Monitor: Bulk extraction dropdown works
4. Extracted prompts have stages and topics populated
5. Extracted prompts appear in Review Queue
6. Approved prompts work as kinetic highlights

### Commands
```bash
npm run build
npm run typecheck
npm test
npm run dev
# Manual test in browser
```

---

## Progress Tracking

- [ ] Epic 1: Clean Up Prototype
  - [ ] Task 1.1: Delete ExtractionModal
  - [ ] Task 1.2: Update WithExtraction wrapper
  - [ ] Task 1.3: Update exports
- [ ] Epic 2: Copilot Integration
  - [ ] Task 2.1: Command definition
  - [ ] Task 2.2: Document tracking fields
  - [ ] Task 2.3: Handler implementation
- [ ] Epic 3: Enhanced Extraction
  - [ ] Task 3.1: Rewrite extraction prompt
  - [ ] Task 3.2: Update types
  - [ ] Task 3.3: Update transformer
- [ ] Epic 4: Bulk Processing
  - [ ] Task 4.1: Toolbar UI
  - [ ] Task 4.2: Multi-select
  - [ ] Task 4.3: Bulk handler
- [ ] Epic 5: API
  - [ ] Task 5.1: API route
  - [ ] Task 5.2: Document tracking update
