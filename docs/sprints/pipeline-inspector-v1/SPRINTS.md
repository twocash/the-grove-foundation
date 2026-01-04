# Sprint Breakdown: pipeline-inspector-v1
**Date:** 2025-01-03
**Estimate:** ~20 hours
**Priority:** Schema → Tier Fix → Inspector → Copilot → API

---

## Epic 1: Schema & Types Foundation (2 hours)

### Story 1.1: Database Migration
**Task:** Create `supabase/migrations/004_document_enrichment.sql`
**Acceptance:**
- [ ] Migration includes tier data fix (seedling→seed, oak→tree)
- [ ] All enrichment columns added per SPEC.md
- [ ] Indexes created for keywords, temporal_class, utility_score
- [ ] Utility score trigger function created
- [ ] Migration applies successfully to local DB

**Tests:**
- Unit: Migration SQL syntax validation
- Integration: Verify columns exist after migration

**Build Gate:**
```bash
npx supabase db push
npx supabase db dump --local | grep -q "keywords TEXT\[\]"
```

### Story 1.2: TypeScript Types
**Task:** Create `src/bedrock/consoles/PipelineMonitor/types.ts`
**Acceptance:**
- [ ] CANONICAL_TIERS exported as const array
- [ ] DocumentTier type derived from const
- [ ] Document interface includes all enrichment fields
- [ ] DOCUMENT_TYPES and TEMPORAL_CLASSES exported

**Tests:**
- Unit: `tests/unit/tier-terminology.test.ts`

**Build Gate:**
```bash
npx tsc --noEmit
```

### Story 1.3: Update Exports
**Task:** Update `src/bedrock/consoles/PipelineMonitor/index.ts`
**Acceptance:**
- [ ] Types exported from module

---

## Epic 2: Tier Terminology Fix (1 hour)

### Story 2.1: DocumentsView Tier Filter
**Task:** Update tier filter options in DocumentsView.tsx
**Acceptance:**
- [ ] All five canonical tiers in dropdown
- [ ] No seedling/oak values anywhere in file
- [ ] Filter logic works with new values

**Tests:**
- E2E: Verify tier filter shows all five options
- Unit: Verify CANONICAL_TIERS matches dropdown

**Build Gate:**
```bash
grep -rn "seedling\|\"oak\"\|'oak'" src/bedrock/consoles/PipelineMonitor/
# Must return empty
```

### Story 2.2: DocumentCard Tier Display
**Task:** Update tier display logic in DocumentCard.tsx
**Acceptance:**
- [ ] Badge shows correct tier name
- [ ] Color mapping works for all five tiers
- [ ] No hardcoded seedling/oak references

**Tests:**
- E2E: Verify card displays correct tier for each value

---

## Epic 3: New Primitives (3 hours)

### Story 3.1: TagArray Component
**Task:** Create `src/bedrock/primitives/TagArray.tsx`
**Acceptance:**
- [ ] Displays array of tags as chips
- [ ] Supports add via input + enter
- [ ] Supports remove via × click
- [ ] Uses `--card-*` tokens
- [ ] Supports readOnly mode
- [ ] Handles empty state

**Tests:**
- Unit: Add/remove tag operations
- E2E: Visual rendering check

### Story 3.2: GroupedChips Component
**Task:** Create `src/bedrock/primitives/GroupedChips.tsx`
**Acceptance:**
- [ ] Renders chips grouped by category
- [ ] Category labels configurable
- [ ] Add/remove per category
- [ ] Uses `--card-*` tokens
- [ ] Supports readOnly mode

**Tests:**
- Unit: Group operations
- E2E: Visual rendering check

### Story 3.3: UtilityBar Component
**Task:** Create `src/bedrock/primitives/UtilityBar.tsx`
**Acceptance:**
- [ ] Progress bar visualization
- [ ] Score and count display
- [ ] Optional trend indicator
- [ ] Always read-only

**Tests:**
- Unit: Score to percentage calculation
- E2E: Visual rendering check

### Story 3.4: Export Primitives
**Task:** Update `src/bedrock/primitives/index.ts`
**Acceptance:**
- [ ] All three new components exported

**Build Gate:**
```bash
npm run build
npx tsc --noEmit
```

---

## Epic 4: Inspector Integration (3 hours)

### Story 4.1: Inspector Config
**Task:** Create `src/bedrock/consoles/PipelineMonitor/document-inspector.config.ts`
**Acceptance:**
- [ ] buildDocumentInspector function exported
- [ ] Five sections defined (Identity, Provenance, Enrichment, Usage, Editorial)
- [ ] Field types match ADR-005
- [ ] Editable flags correct per SPEC

**Tests:**
- Unit: Config builder returns valid structure

### Story 4.2: Document Selection State
**Task:** Add selection state to PipelineMonitor
**Acceptance:**
- [ ] Selected document state managed
- [ ] DocumentsView receives onSelectDocument callback
- [ ] DocumentCard clickable
- [ ] Selection visual feedback

**Tests:**
- E2E: Click card → selection state updates

### Story 4.3: Inspector Wiring
**Task:** Wire BedrockInspector into PipelineMonitor
**Acceptance:**
- [ ] Inspector shows when document selected
- [ ] Config built from selected document
- [ ] Sections collapse/expand
- [ ] Edit fields trigger onSave

**Tests:**
- E2E: `tests/e2e/pipeline-inspector.spec.ts`

**Build Gate:**
```bash
npm run build
npx playwright test tests/e2e/pipeline-inspector.spec.ts
```

---

## Epic 5: Copilot Integration (4 hours)

### Story 5.1: Copilot Config
**Task:** Create `src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts`
**Acceptance:**
- [ ] buildDocumentCopilot function exported
- [ ] All commands from SPEC registered
- [ ] Command patterns match expected input
- [ ] Preview flag set for extraction commands

**Tests:**
- Unit: Config builder returns valid structure

### Story 5.2: Command Handlers
**Task:** Create `src/bedrock/consoles/PipelineMonitor/copilot-handlers.ts`
**Acceptance:**
- [ ] handleExtractKeywords returns preview data
- [ ] handleSummarize returns preview data
- [ ] handleExtractEntities returns preview data
- [ ] handleSuggestQuestions returns preview data
- [ ] handleClassifyType returns preview data
- [ ] handleCheckFreshness returns preview data
- [ ] handleEnrich combines all extractions
- [ ] handlePromote validates tier name
- [ ] handleReEmbed triggers re-embedding

**Tests:**
- Unit: Each handler returns expected structure
- E2E: `tests/e2e/copilot-preview.spec.ts`

### Story 5.3: Copilot Wiring
**Task:** Wire BedrockCopilot into PipelineMonitor
**Acceptance:**
- [ ] Copilot shows in panel
- [ ] Commands work when document selected
- [ ] Preview dialog appears for extraction commands
- [ ] Apply updates document

**Tests:**
- E2E: Full command flow test

**Build Gate:**
```bash
npm run build
npx playwright test tests/e2e/copilot-preview.spec.ts
```

---

## Epic 6: API Endpoints (4 hours)

### Story 6.1: Document Update Endpoint
**Task:** Create `src/app/api/knowledge/documents/[id]/route.ts`
**Acceptance:**
- [ ] PATCH method implemented
- [ ] Validates tier if present
- [ ] Updates document in database
- [ ] Returns updated document
- [ ] Sets updated_at timestamp

**Tests:**
- Integration: PATCH with valid data succeeds
- Integration: PATCH with invalid tier returns 400

### Story 6.2: Enrichment Endpoint
**Task:** Create `src/app/api/knowledge/enrich/route.ts`
**Acceptance:**
- [ ] POST method implemented
- [ ] Accepts documentId and operations array
- [ ] Fetches document content
- [ ] Calls AI API for requested extractions
- [ ] Returns structured results
- [ ] Records model used in response

**Tests:**
- Integration: Enrichment returns expected structure
- Integration: Handles missing document gracefully

**Build Gate:**
```bash
npm test
npm run build
```

---

## Epic 7: Tests & Verification (3 hours)

### Story 7.1: Tier Terminology Test
**Task:** Create `tests/unit/tier-terminology.test.ts`
**Acceptance:**
- [ ] Tests CANONICAL_TIERS values
- [ ] Tests absence of legacy terms

### Story 7.2: Copilot Preview Test
**Task:** Create `tests/e2e/copilot-preview.spec.ts`
**Acceptance:**
- [ ] Tests preview dialog appears
- [ ] Tests Apply button saves
- [ ] Tests Edit allows modification

### Story 7.3: Inspector Integration Test
**Task:** Create `tests/e2e/pipeline-inspector.spec.ts`
**Acceptance:**
- [ ] Tests inspector shows on selection
- [ ] Tests sections exist
- [ ] Tests edit triggers save

### Story 7.4: Final Verification
**Task:** Run all tests, verify no regressions
**Acceptance:**
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No tier terminology violations
- [ ] Build succeeds

**Build Gate:**
```bash
npm test
npx playwright test
npm run build
grep -rn "seedling\|\"oak\"\|'oak'" src/
# Must return empty
```

---

## Definition of Done

Per DEVELOPMENT_CONTRACT.md Article IX:

### Feature Checklist (each story)
- [ ] Uses canonical tier names only
- [ ] No gatekeeping on tier promotion
- [ ] Provenance fields populated
- [ ] Copilot commands show previews
- [ ] Utility score read-only
- [ ] Tests pass
- [ ] ADR-001 compliance verified

### Sprint Completion Checklist
- [ ] Migration 004 created and tested
- [ ] UI tier options fixed
- [ ] Inspector integrated with console-factory
- [ ] Copilot commands functional
- [ ] Documentation updated
- [ ] No prohibited tier terms in codebase

---

## Commit Sequence

1. `feat: add document enrichment migration (004)`
2. `feat: add document types with canonical tiers`
3. `fix: update tier filter to canonical values`
4. `fix: update document card tier display`
5. `feat: add TagArray primitive component`
6. `feat: add GroupedChips primitive component`
7. `feat: add UtilityBar primitive component`
8. `feat: add document inspector configuration`
9. `feat: wire inspector to PipelineMonitor`
10. `feat: add document copilot configuration`
11. `feat: implement copilot command handlers`
12. `feat: wire copilot to PipelineMonitor`
13. `feat: add document update API endpoint`
14. `feat: add enrichment API endpoint`
15. `test: add tier terminology compliance tests`
16. `test: add copilot preview tests`
17. `test: add inspector integration tests`
18. `docs: update sprint documentation`
