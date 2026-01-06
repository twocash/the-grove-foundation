# Story Breakdown — highlight-extraction-v1

## Sprint Summary

| Field | Value |
|-------|-------|
| **Sprint** | highlight-extraction-v1 |
| **Duration** | 3-4 days |
| **Total Points** | 30 |
| **Epics** | 5 |

---

## Epic 1: Core Concept Registry (5 pts)

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows correct phase
- [ ] kinetic-highlights-v1 is complete
- [ ] Build passes: `npm run build`

### Story 1.1: Create Extraction Config (2 pts)

**Task:** Create `src/core/extraction/config.ts` with declarative extraction settings

**Acceptance:**
- [ ] Config exports `EXTRACTION_CONFIG` object
- [ ] `highlight.confidenceThreshold` defaults to 0.7
- [ ] Config is typed with `ExtractionConfig`
- [ ] Comment documents that threshold is mutable per DEX

**Files:**
- Create: `src/core/extraction/config.ts`

### Story 1.2: Create Core Concepts Registry (3 pts)

**Task:** Create `src/data/concepts/groveCoreConcepts.json` with Grove terminology

**Acceptance:**
- [ ] JSON contains 15 core concepts
- [ ] Each concept has: term, category, priority, definition
- [ ] Priority 1 concepts: distributed ownership, hybrid architecture, credit economy, efficiency tax, capability propagation, ratchet thesis, AI villages, exploration architecture
- [ ] Priority 2 concepts: knowledge commons, epistemic independence, trellis architecture, gardener, local inference, pivotal moments, agent diaries
- [ ] Definitions are accurate per Grove documentation

**Files:**
- Create: `src/data/concepts/groveCoreConcepts.json`

### Build Gate (Epic 1)
```bash
npm run build
# Verify JSON is valid
node -e "require('./src/data/concepts/groveCoreConcepts.json')"
```

---

## Epic 2: Concept Detection (8 pts)

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 1 complete
- [ ] Core concepts registry exists
- [ ] Config exports correctly

### Story 2.1: Implement detectConcepts Function (5 pts)

**Task:** Create `src/core/extraction/conceptDetection.ts` with concept detection logic

**Acceptance:**
- [ ] Function accepts document text and options
- [ ] Checks each core concept against document
- [ ] Calculates confidence from: frequency, priority, registry match
- [ ] Filters by confidence threshold
- [ ] Returns sorted DetectedConcept array
- [ ] Extracts context excerpt around first match

**Files:**
- Create: `src/core/extraction/conceptDetection.ts`

### Story 2.2: Unit Tests for Concept Detection (3 pts)

**Task:** Create comprehensive unit tests for detectConcepts

**Tests:**
- [ ] Detects known concepts in sample text
- [ ] Returns empty array for text without concepts
- [ ] Respects confidence threshold
- [ ] Limits to maxConcepts
- [ ] Confidence calculation is correct
- [ ] Context excerpt extraction works

**Files:**
- Create: `tests/unit/conceptDetection.test.ts`

### Build Gate (Epic 2)
```bash
npm test -- conceptDetection
```

---

## Epic 3: Prompt Generation (8 pts)

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 2 complete
- [ ] detectConcepts tests pass
- [ ] Gemini API key available in environment

### Story 3.1: Implement generateHighlightPrompt Function (5 pts)

**Task:** Create `src/core/extraction/highlightPromptGenerator.ts`

**Acceptance:**
- [ ] Function accepts DetectedConcept and document context
- [ ] Uses Emily Short template for generation
- [ ] Calls Gemini API with structured prompt
- [ ] Parses JSON response correctly
- [ ] Returns complete PromptObject with:
  - [ ] Unique ID with timestamp
  - [ ] executionPrompt from generation
  - [ ] systemContext from generation
  - [ ] highlightTriggers from concept
  - [ ] surfaces: ['highlight', 'suggestion']
  - [ ] provenance with extractionMethod

**Files:**
- Create: `src/core/extraction/highlightPromptGenerator.ts`

### Story 3.2: Unit Tests for Prompt Generation (3 pts)

**Task:** Create unit tests with mocked API responses

**Tests:**
- [ ] Generates valid PromptObject structure
- [ ] Provenance includes extractionMethod
- [ ] highlightTriggers populated correctly
- [ ] surfaces includes 'highlight'
- [ ] Handles API errors gracefully

**Files:**
- Create: `tests/unit/highlightGenerator.test.ts`

### Build Gate (Epic 3)
```bash
npm test -- highlightGenerator
```

---

## Epic 4: Merge Logic & Types (5 pts)

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 3 complete
- [ ] Generation produces valid PromptObjects
- [ ] All unit tests pass

### Story 4.1: Implement Trigger Merge Function (3 pts)

**Task:** Create `src/core/extraction/triggerMerge.ts`

**Acceptance:**
- [ ] Function accepts new and existing prompts
- [ ] Detects overlapping triggers (case-insensitive)
- [ ] Implements favor-newer strategy
- [ ] Implements favor-higher-confidence strategy
- [ ] Implements keep-all strategy
- [ ] Returns merged array

**Files:**
- Create: `src/core/extraction/triggerMerge.ts`

### Story 4.2: Add extractionMethod to Types (1 pt)

**Task:** Extend PromptProvenance with extractionMethod field

**Acceptance:**
- [ ] Field added: `extractionMethod?: 'general' | 'highlight-concept-detection'`
- [ ] TypeScript compiles without errors
- [ ] Existing prompts unaffected (field is optional)

**Files:**
- Modify: `src/core/context-fields/types.ts`

### Story 4.3: Unit Tests for Merge Logic (1 pt)

**Task:** Test merge strategies

**Tests:**
- [ ] favor-newer replaces older prompt
- [ ] favor-higher-confidence keeps better
- [ ] keep-all preserves both
- [ ] Non-overlapping prompts both kept
- [ ] Case-insensitive trigger matching

**Files:**
- Create: `tests/unit/triggerMerge.test.ts`

### Build Gate (Epic 4)
```bash
npm run build
npm test -- triggerMerge
```

---

## Epic 5: Workshop UI & Integration (4 pts)

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epics 1-4 complete
- [ ] All unit tests pass
- [ ] Build succeeds

### Story 5.1: Add Surface Filter to Workshop (2 pts)

**Task:** Add surface filter dropdown to Prompt Workshop

**Acceptance:**
- [ ] Dropdown with options: All, Suggestions, Highlights, Journeys, Follow-ups
- [ ] Filtering works correctly
- [ ] Combines with existing provenance filter
- [ ] UI consistent with existing filters

**Files:**
- Modify: `src/bedrock/consoles/PromptWorkshop/PromptFilters.tsx`

### Story 5.2: Display Trigger Badges in Cards (1 pt)

**Task:** Show highlightTriggers in prompt cards

**Acceptance:**
- [ ] Triggers shown as small badges
- [ ] Badge shows text and matchMode
- [ ] Only shown when triggers exist
- [ ] Styled consistently with provenance badges

**Files:**
- Modify: `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`

### Story 5.3: E2E Tests for Workshop Filters (1 pt)

**Task:** Add E2E tests for new filter functionality

**Tests:**
- [ ] Surface filter is visible
- [ ] Selecting "Highlights" filters correctly
- [ ] Trigger badges appear on highlight prompts
- [ ] Filter reset works

**Files:**
- Modify: `tests/e2e/prompt-workshop.spec.ts`

### Build Gate (Epic 5)
```bash
npm run build
npm test
npx playwright test prompt-workshop
```

---

## Final Verification

### Acceptance Test: Recursive Extraction

```bash
# Run extraction on the insight document
# (This would be a manual or scripted test)

# Expected outcomes:
# - 5+ prompts extracted
# - Each has valid highlightTriggers
# - Each has surfaces: ['highlight', 'suggestion']
# - Each has provenance.extractionMethod: 'highlight-concept-detection'
# - Prompts appear in Workshop with "extracted" badge
```

### Smoke Test Checklist
- [ ] `npm run build` succeeds
- [ ] `npm test` all pass
- [ ] `npx playwright test` all pass
- [ ] Workshop loads at `/bedrock/prompts`
- [ ] Surface filter dropdown visible
- [ ] Existing prompts unaffected
- [ ] Manual extraction produces expected output

---

## Commit Sequence

```
1. feat(extraction): add extraction config with mutable thresholds
2. feat(data): add Grove core concepts registry
3. feat(extraction): implement concept detection
4. test(extraction): add concept detection unit tests
5. feat(extraction): implement highlight prompt generator
6. test(extraction): add prompt generator tests
7. feat(extraction): implement trigger merge logic
8. test(extraction): add merge logic tests
9. feat(types): add extractionMethod to PromptProvenance
10. feat(workshop): add surface filter to prompt filters
11. feat(workshop): display trigger badges in prompt cards
12. test(e2e): add workshop filter E2E tests
13. docs: update sprint devlog with completion status
```

---

## Build Gates Summary

| After | Command | Expected |
|-------|---------|----------|
| Epic 1 | `npm run build` | Compiles |
| Epic 2 | `npm test -- conceptDetection` | 6+ tests pass |
| Epic 3 | `npm test -- highlightGenerator` | 5+ tests pass |
| Epic 4 | `npm test -- triggerMerge` | 5+ tests pass |
| Epic 5 | `npx playwright test prompt-workshop` | All pass |
| Final | `npm run build && npm test` | All pass |

---

## Open Issues Reminder

**highlights.prompts.json Coverage:**
- Current: 6 seed prompts
- Target: 20+ core concepts
- Approach: Batch author or validate extraction first
- Status: Deferred to post-sprint
