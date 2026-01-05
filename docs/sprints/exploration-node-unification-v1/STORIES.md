# Sprint Stories: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Version:** 1.0  
**Created:** 2025-01-05  
**Estimated Effort:** 33 points (~3-4 days)

---

## Epic 1: Type Foundation (6 points)

Extend PromptObject with provenance tracking.

### Story 1.1: Add PromptProvenance Type (2 points)

**Task:** Add provenance types to `src/core/context-fields/types.ts`

**Implementation:**
1. Add `ProvenanceType` union type
2. Add `ReviewStatus` union type  
3. Add `PromptProvenance` interface
4. Add `AUTHORED_PROVENANCE` constant
5. Add `createExtractedProvenance()` helper function

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Export from index.ts works

**Tests:**
- Type compilation check (build)

---

### Story 1.2: Extend PromptObject (2 points)

**Task:** Add provenance field to PromptObject interface

**Implementation:**
1. Add `provenance: PromptProvenance` field
2. Add `embedding?: number[]` field
3. Update any type guards if they exist

**Acceptance Criteria:**
- [ ] PromptObject includes provenance field
- [ ] Existing code continues to compile

**Tests:**
- Build passes with new field

---

### Story 1.3: Backfill Authored Prompts (2 points)

**Task:** Add provenance to all existing prompt JSON files

**Implementation:**
1. Add provenance to 23 prompts in `base.prompts.json`
2. Add provenance to 21 prompts in `wayne-turner.prompts.json`
3. Add provenance to 22 prompts in `dr-chiang.prompts.json`
4. Validate all prompts have provenance

**Provenance template:**
```json
"provenance": {
  "type": "authored",
  "reviewStatus": "approved",
  "authorId": "system",
  "authorName": "Grove Team"
}
```

**Acceptance Criteria:**
- [ ] All 66 prompts have provenance field
- [ ] JSON files parse correctly
- [ ] libraryPrompts loads without error

**Tests:**
- Load test: `import { libraryPrompts } from '@data/prompts'`

---

### Build Gate: Epic 1

```bash
npm run build    # Compiles
npm test         # Unit tests pass
```

---

## Epic 2: Extraction Pipeline (10 points)

Create infrastructure to extract PromptObjects from documents.

### Story 2.1: Create Extraction Module Structure (2 points)

**Task:** Set up `src/core/extraction/` directory

**Implementation:**
1. Create directory: `src/core/extraction/`
2. Create `index.ts` (barrel export)
3. Create `types.ts` (extraction-specific types)
4. Create `prompts.ts` (Gemini prompt template)

**Files to create:**
```
src/core/extraction/
├── index.ts
├── types.ts
└── prompts.ts
```

**Acceptance Criteria:**
- [ ] Directory structure exists
- [ ] Types defined for extraction
- [ ] Prompt template constant exported

---

### Story 2.2: Implement Extraction Transform (3 points)

**Task:** Create transform function from raw Gemini output to PromptObject

**File:** `src/core/extraction/transform.ts`

**Implementation:**
1. Create `transformToPromptObject()` function
2. Map raw stages to Stage type
3. Build topic/lens affinities from arrays
4. Create provenance with extracted type
5. Generate unique IDs

**Acceptance Criteria:**
- [ ] Transform produces valid PromptObject
- [ ] Provenance correctly populated
- [ ] Stage mapping works for all tiers

**Tests:**
- Unit test: transform with sample input

---

### Story 2.3: Add Server Extraction Endpoint (3 points)

**Task:** Add `/api/prompts/extract` endpoint to server.js

**Implementation:**
1. Add POST handler after line ~3660
2. Build Gemini prompt with document context
3. Call Gemini API with JSON response mode
4. Parse response and transform to PromptObjects
5. Return extraction result

**Endpoint:** `POST /api/prompts/extract`

**Acceptance Criteria:**
- [ ] Endpoint accepts document content
- [ ] Calls Gemini with extraction prompt
- [ ] Returns PromptObject[] with provenance
- [ ] Handles errors gracefully

**Tests:**
- Manual test with sample document
- Error handling for invalid input

---

### Story 2.4: Client Extraction Function (2 points)

**Task:** Create client-side function to call extraction API

**File:** `src/core/extraction/extract.ts`

**Implementation:**
1. Create `extractPromptsFromDocument()` async function
2. Accept ExtractionContext parameter
3. Call server endpoint
4. Return typed ExtractionResult

**Acceptance Criteria:**
- [ ] Function calls API correctly
- [ ] Returns typed result
- [ ] Handles fetch errors

**Tests:**
- Integration test with mock server

---

### Build Gate: Epic 2

```bash
npm run build              # Compiles
# Manual test:
curl -X POST http://localhost:3001/api/prompts/extract \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test","title":"Test","content":"Sample content about AI infrastructure...","tier":"sapling"}'
```

---

## Epic 3: Hybrid Search Activation (5 points)

Wire existing hybrid search function and enhance results.

### Story 3.1: Verify Hybrid Search Deployed (1 point)

**Task:** Confirm `search_documents_hybrid` exists in Supabase

**Implementation:**
1. Query information_schema for function
2. If missing, apply migration 005
3. Document verification in DEVLOG

**Acceptance Criteria:**
- [ ] Function exists in production Supabase
- [ ] Returns expected columns

**Verification:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'search_documents_hybrid';
```

---

### Story 3.2: Update search.js to Use Hybrid (3 points)

**Task:** Modify `searchDocuments()` to call hybrid search

**File:** `lib/knowledge/search.js`

**Implementation:**
1. Add `useHybrid` option (default: true)
2. Extract keywords from query
3. Call `search_documents_hybrid` RPC
4. Map response with enrichment scores
5. Keep fallback to pure vector

**Acceptance Criteria:**
- [ ] Hybrid search called by default
- [ ] Keywords extracted from query
- [ ] Response includes finalScore, keywordScore, etc.
- [ ] Fallback works when useHybrid: false

**Tests:**
- Test search returns enrichment scores

---

### Story 3.3: Return Retrieved Doc IDs for Scoring (1 point)

**Task:** Ensure search results include document IDs for provenance matching

**Implementation:**
1. Verify `id` field returned in results
2. Add to search context for scoring

**Acceptance Criteria:**
- [ ] Document IDs available in search results
- [ ] Can pass to scoring function

---

### Build Gate: Epic 3

```bash
npm run build
# Manual test:
node -e "
  const { searchDocuments } = require('./lib/knowledge/search');
  searchDocuments('AI infrastructure', { limit: 5 })
    .then(r => console.log(r.map(d => ({ id: d.id, score: d.finalScore }))))
    .catch(console.error);
"
```

---

## Epic 4: Provenance-Aware Scoring (5 points)

Integrate provenance into prompt scoring.

### Story 4.1: Add Provenance Modifier Function (2 points)

**Task:** Create `applyProvenanceModifier()` in scoring.ts

**File:** `src/core/context-fields/scoring.ts`

**Implementation:**
1. Add function that takes baseScore, prompt, context
2. Apply modifiers based on provenance.type
3. Apply review status modifiers
4. Handle source document relevance boost

**Modifiers:**
- authored: +10
- extracted (relevant): +25
- extracted (pending): ×0.8
- generated (not approved): ×0.5

**Acceptance Criteria:**
- [ ] Function correctly modifies scores
- [ ] Handles missing provenance gracefully
- [ ] Source doc boost works

**Tests:**
- Unit test with various provenance types

---

### Story 4.2: Integrate into Prompt Scoring (2 points)

**Task:** Call provenance modifier in main scoring flow

**Implementation:**
1. Update `scorePrompt()` to accept `retrievedDocIds` option
2. Call `applyProvenanceModifier()` on final score
3. Update return type if needed

**Acceptance Criteria:**
- [ ] Scoring includes provenance modifier
- [ ] retrievedDocIds passed through
- [ ] Existing behavior unchanged for authored prompts

**Tests:**
- Test extracted prompt gets boost when doc retrieved

---

### Story 4.3: Update usePromptSuggestions Hook (1 point)

**Task:** Pass retrieved doc IDs to scoring context

**Implementation:**
1. Track retrieved document IDs from search
2. Pass to scoring function
3. Ensure provenance-aware scoring applied

**Acceptance Criteria:**
- [ ] Hook passes retrieval context
- [ ] Extracted prompts boost correctly

---

### Build Gate: Epic 4

```bash
npm run build
npm test
```

---

## Epic 5: Prompt Workshop UI (7 points)

Update admin UI to display provenance and new features.

### Story 5.1: Add "Exploration Nodes" Header Label (1 point)

**Task:** Display "Exploration Nodes" in center of Prompt Workshop header

**Implementation:**
1. Find header rendering location
2. Add centered label "Exploration Nodes"
3. Position left of "+New Prompt" button

**Acceptance Criteria:**
- [ ] Label visible in center header
- [ ] Consistent with Bedrock styling
- [ ] Doesn't interfere with other elements

---

### Story 5.2: Create ProvenanceBadge Component (2 points)

**Task:** Create reusable provenance indicator component

**File:** `src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx`

**Implementation:**
1. Create component with provenance prop
2. Display icon + label based on type
3. Show review status indicator
4. Support sm/md sizes

**Badge config:**
- authored: 📝 blue
- extracted: 📄 green
- generated: 🤖 yellow
- submitted: 👤 purple

**Acceptance Criteria:**
- [ ] Badge displays correct icon/color
- [ ] Review status shows when pending/rejected
- [ ] Size variants work

---

### Story 5.3: Add Badge to PromptCard (2 points)

**Task:** Display provenance badge on each prompt card

**File:** `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`

**Implementation:**
1. Import ProvenanceBadge
2. Add to card layout (top-right or footer)
3. Handle missing provenance gracefully

**Acceptance Criteria:**
- [ ] Badge visible on all cards
- [ ] Positioned consistently
- [ ] Doesn't break card layout

---

### Story 5.4: Add Provenance Filter (2 points)

**Task:** Add filter option for provenance type

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

**Implementation:**
1. Add provenance.type filter to filterOptions
2. Add reviewStatus filter
3. Verify filter hook handles nested fields

**Acceptance Criteria:**
- [ ] Can filter by provenance type
- [ ] Can filter by review status
- [ ] Filters combine correctly with others

---

### Build Gate: Epic 5

```bash
npm run build
npm test
# Visual verification:
# 1. Open http://localhost:3000/bedrock/prompts
# 2. Verify "Exploration Nodes" header
# 3. Verify badges on cards
# 4. Verify filter dropdown
```

---

## Summary

| Epic | Stories | Points | Focus |
|------|---------|--------|-------|
| 1. Type Foundation | 3 | 6 | Types + backfill |
| 2. Extraction Pipeline | 4 | 10 | Gemini extraction |
| 3. Hybrid Search | 3 | 5 | Activate search |
| 4. Scoring | 3 | 5 | Provenance modifiers |
| 5. UI Updates | 4 | 7 | Workshop display |
| **Total** | **17** | **33** | |

---

## Execution Order

**Day 1:**
- Epic 1: Type Foundation (complete)
- Epic 2.1-2.2: Extraction structure

**Day 2:**
- Epic 2.3-2.4: Server endpoint + client
- Epic 3: Hybrid Search

**Day 3:**
- Epic 4: Provenance Scoring
- Epic 5.1-5.2: Header + Badge

**Day 4:**
- Epic 5.3-5.4: Card + Filter
- Testing + verification
- Documentation

---

*Stories complete. Ready for EXECUTION_PROMPT.md generation.*
