# Sprint Complete: prompt-extraction-pipeline-v1

**Completed:** 2026-01-05
**Branch:** main (direct commits)

## Summary

Built the prompt extraction pipeline for extracting clickable concepts from Grove documentation using Claude API.

## What Was Built

### Epic 1: Extraction Service
- `src/services/extraction/types.ts` - Core extraction types
- `src/services/extraction/extractionPrompt.ts` - Claude prompt template
- `src/services/extraction/promptExtractor.ts` - Extraction logic with Claude API
- `src/services/extraction/index.ts` - Module exports

### Epic 2: Type Updates
- Extended `PromptProvenance` in `src/core/context-fields/types.ts`:
  - Added `extractionBatch`, `reviewNotes` fields
  - Added `'edited'` to `ReviewStatus` type
- Extended `PromptPayload` in `src/core/schema/prompt.ts`:
  - Added `salienceDimensions` and `interestingBecause` fields

### Epic 3: Review Queue UI
- `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`:
  - Added `reviewQueue` filter for pending extractions
  - Added `approveExtracted()` and `rejectExtracted()` methods
- `src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx` - Review queue component
- Added "Pending Review" metric to config

### Epic 4: Extraction Trigger UI
- `src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx` - Modal for extraction
- `src/bedrock/consoles/PromptWorkshop/PromptWorkshopWithExtraction.tsx` - Enhanced workshop
- Updated `src/router/routes.tsx` to use enhanced workshop
- Added `@services` path alias to `vite.config.ts` and `tsconfig.json`

### Configuration Changes
- Added `secondaryActions` type to `src/bedrock/types/console.types.ts`
- Added `@services` path alias for cleaner imports

## How to Use

### Setup
1. Add Anthropic API key to `.env.local`:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```

### Extraction Flow
1. Navigate to Prompt Workshop (`/bedrock/prompts`)
2. Click "Extract from Document" button
3. Paste Grove documentation content
4. Select model (Sonnet recommended) and confidence threshold
5. Click "Extract Concepts"
6. Review extracted concepts with confidence scores
7. Click "Add to Review Queue"

### Review Flow
1. Click "Review Queue" button (shows count of pending items)
2. Click on an item to inspect it
3. Use checkmark button to approve (becomes user-owned prompt)
4. Use X button to reject (archives the prompt)

## Technical Notes

### Strangler Fig Pattern
Library prompts from JSON files are merged with user/generated prompts from the data layer. Legacy library prompts in Supabase (source: 'library') are filtered out - only `source: 'user'` or `source: 'generated'` come from the data layer.

### Prompt Sources
- `'library'` - Shipped with Grove (read-only, from JSON)
- `'user'` - User-created or approved extractions
- `'generated'` - AI-extracted, pending review

### Provenance Tracking
Extracted prompts include full provenance:
- Source document ID and title
- Extraction model and timestamp
- Confidence score
- Salience dimensions
- Batch ID for grouping

## Files Changed

```
src/services/extraction/
├── types.ts (NEW)
├── extractionPrompt.ts (NEW)
├── promptExtractor.ts (NEW)
└── index.ts (NEW)

src/bedrock/consoles/PromptWorkshop/
├── usePromptData.ts (MODIFIED)
├── ReviewQueue.tsx (NEW)
├── ExtractionModal.tsx (NEW)
├── PromptWorkshopWithExtraction.tsx (NEW)
├── PromptWorkshop.config.ts (MODIFIED)
└── index.ts (MODIFIED)

src/core/context-fields/types.ts (MODIFIED)
src/core/schema/prompt.ts (MODIFIED)
src/bedrock/types/console.types.ts (MODIFIED)
src/router/routes.tsx (MODIFIED)
vite.config.ts (MODIFIED)
tsconfig.json (MODIFIED)
```

## Production Deployment

To deploy to production, add the Anthropic API key to Cloud Run:
```bash
gcloud run services update grove-foundation \
  --set-env-vars="VITE_ANTHROPIC_API_KEY=sk-ant-..."
```
