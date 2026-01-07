# User Stories: Extraction Pipeline Integration

**Sprint:** extraction-pipeline-integration-v1  
**Version:** 1.0

---

## Epic 1: Clean Up Prototype

### Story 1.1: Remove ExtractionModal from Prompt Workshop
**As a** developer  
**I want to** remove the manual extraction UI from Prompt Workshop  
**So that** extraction happens in the correct location (Pipeline Monitor)

**Acceptance Criteria:**
- `ExtractionModal.tsx` deleted
- `PromptWorkshopWithExtraction.tsx` no longer imports ExtractionModal
- "Extract from Document" button removed
- Review Queue sidebar still works

### Story 1.2: Update index.ts Exports
**As a** developer  
**I want to** clean up exports  
**So that** deleted components aren't referenced

**Acceptance Criteria:**
- `ExtractionModal` export removed from index.ts
- No broken imports in codebase

---

## Epic 2: Pipeline Monitor Copilot Integration

### Story 2.1: Add extract-prompts Command Definition
**As a** knowledge administrator  
**I want to** type "extract prompts" in Pipeline Monitor Copilot  
**So that** I can extract highlight prompts from the selected document

**Acceptance Criteria:**
- Command defined in `document-copilot.config.ts`
- Pattern matches "extract prompts", "extract prompt"
- Command requires document selection
- Command uses preview mode

### Story 2.2: Implement handleExtractPrompts Handler
**As a** knowledge administrator  
**I want to** see extracted prompts before they're saved  
**So that** I can review extraction quality

**Acceptance Criteria:**
- Handler calls extraction service
- Results shown in preview mode
- "Apply" saves prompts to data layer
- Error handling for extraction failures

### Story 2.3: Add Document Tracking Fields
**As a** developer  
**I want to** track which documents have been processed  
**So that** we can filter "unprocessed only" in bulk operations

**Acceptance Criteria:**
- `promptsExtracted?: boolean` field added to Document type
- `promptExtractionAt?: string` field added
- `promptExtractionCount?: number` field added

---

## Epic 3: Enhanced Extraction Engine

### Story 3.1: Add Stage Classification to Extraction Prompt
**As a** content strategist  
**I want** extracted prompts to have appropriate stage targeting  
**So that** prompts appear at the right point in user journey

**Acceptance Criteria:**
- Extraction prompt includes stage classification guide
- Each extracted concept has `targetStages` array
- Each extracted concept has `stageReasoning` explanation
- Stages limited to: genesis, exploration, synthesis, advocacy

### Story 3.2: Add Topic Category Mapping
**As a** content strategist  
**I want** extracted prompts to map to existing topic categories  
**So that** topicAffinities are populated correctly

**Acceptance Criteria:**
- Extraction prompt includes valid categories list
- Each extracted concept has `topicCategory` field
- Categories match: infrastructure, architecture, economics, ratchet-thesis, vision, community, philosophy, roles, engagement

### Story 3.3: Enhanced systemContext Generation
**As a** content strategist  
**I want** extraction to generate rich systemContext  
**So that** the LLM responding to highlights has proper guidance

**Acceptance Criteria:**
- systemContext includes what to emphasize
- systemContext includes what tone to use
- systemContext includes what to avoid
- systemContext references user's likely confusion

---

## Epic 4: Bulk Processing UI

### Story 4.1: Add Bulk Extraction Toolbar
**As a** knowledge administrator  
**I want to** extract prompts from multiple documents at once  
**So that** I don't have to process each document individually

**Acceptance Criteria:**
- Toolbar shows "Extract Prompts" dropdown button
- Options: "From selected", "From all", "From unprocessed"
- Multi-select works on document grid
- Progress indicator during bulk operation

### Story 4.2: Implement Bulk Processing Logic
**As a** developer  
**I want** bulk extraction to be efficient  
**So that** processing many documents doesn't timeout

**Acceptance Criteria:**
- API accepts array of documentIds
- Processes in batches (5 at a time)
- Returns aggregated results
- Skips documents with `promptsExtracted: true` when "unprocessed" selected

---

## Epic 5: API Endpoint

### Story 5.1: Create extract-prompts API Route
**As a** developer  
**I want** a dedicated API endpoint for prompt extraction  
**So that** frontend can trigger extraction via standard HTTP

**Acceptance Criteria:**
- POST /api/knowledge/extract-prompts endpoint
- Accepts documentIds array
- Accepts options (regenerate, confidenceThreshold)
- Returns extracted prompts and stats

### Story 5.2: Integrate with Prompt Data Layer
**As a** developer  
**I want** extracted prompts saved correctly  
**So that** they appear in Review Queue

**Acceptance Criteria:**
- Extracted prompts saved via GroveObject factory
- source: 'extracted', status: 'draft'
- provenance.type: 'extracted'
- provenance.reviewStatus: 'pending'
- provenance.sourceDocIds populated

---

## Story Point Estimates

| Epic | Stories | Total Points |
|------|---------|--------------|
| Epic 1: Clean Up | 2 | 3 |
| Epic 2: Copilot Integration | 3 | 8 |
| Epic 3: Enhanced Extraction | 3 | 8 |
| Epic 4: Bulk Processing | 2 | 5 |
| Epic 5: API | 2 | 5 |
| **Total** | **12** | **29** |
