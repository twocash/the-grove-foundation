# SPRINTS.md - prompt-refinement-v1

> **Sprint**: prompt-refinement-v1
> **Created**: 2026-01-06
> **Duration**: 3 days

---

## Sprint Overview

| Phase | Duration | Focus |
|-------|----------|-------|
| Day 1 | 8 hours | Foundation + UI Components |
| Day 2 | 8 hours | Integration + API + QA Layer |
| Day 3 | 8 hours | Title Transforms + Testing + Polish |

---

## Day 1: Foundation + UI Components

### Story 1.1: Schema Extensions
**Points**: 2 | **Priority**: P0

**Tasks**:
- [ ] Add `userIntent`, `conceptAngle`, `suggestedFollowups` to PromptPayload
- [ ] Add `qaScore`, `qaLastChecked`, `qaIssues` to PromptPayload
- [ ] Add `QAIssue` interface
- [ ] Update type exports

**Acceptance Criteria**:
- TypeScript compiles without errors
- Existing prompts remain valid (optional fields)

**Test Tasks**:
- [ ] Unit test: Verify PromptPayload accepts new fields
- [ ] Unit test: Verify backward compatibility with existing prompts

---

### Story 1.2: Selection Hook
**Points**: 3 | **Priority**: P0

**Tasks**:
- [ ] Create `usePromptSelection.ts` hook
- [ ] Implement `select`, `selectAll`, `clearSelection` methods
- [ ] Implement `isSelected` predicate
- [ ] Add Escape key handler for clear
- [ ] Export from hooks index

**Acceptance Criteria**:
- Hook manages Set of selected IDs
- Escape key clears selection
- Hook is reusable across components

**Test Tasks**:
- [ ] Unit test: select/deselect single item
- [ ] Unit test: selectAll sets all provided IDs
- [ ] Unit test: clearSelection empties set
- [ ] Unit test: Escape key triggers clear

---

### Story 1.3: Source Context Hook
**Points**: 2 | **Priority**: P1

**Tasks**:
- [ ] Create `useSourceContext.ts` hook
- [ ] Fetch from `/api/documents/:id/context`
- [ ] Cache results in React Query
- [ ] Handle loading/error states

**Acceptance Criteria**:
- Hook fetches context when called
- Results cached for session
- Loading and error states exposed

**Test Tasks**:
- [ ] Unit test: Returns loading state initially
- [ ] Unit test: Returns data after fetch
- [ ] Unit test: Caches results

---

### Story 1.4: Source Context Section Component
**Points**: 3 | **Priority**: P1

**Tasks**:
- [ ] Create `SourceContextSection.tsx` component
- [ ] Use `InspectorSection` with collapsible prop
- [ ] Display document title, passage, confidence, link
- [ ] Handle missing source document gracefully

**Acceptance Criteria**:
- Section collapsed by default
- Expands to show source context
- "View Document" link works
- Graceful "unavailable" state

**Test Tasks**:
- [ ] Unit test: Renders collapsed by default
- [ ] Unit test: Expands on click
- [ ] Unit test: Shows "unavailable" when no documentId

---

### Story 1.5: QA Results Section Component
**Points**: 2 | **Priority**: P1

**Tasks**:
- [ ] Create `QAResultsSection.tsx` component
- [ ] Display score as progress bar/badge
- [ ] List issues with severity icons
- [ ] Show "Apply Fix" button for auto-fixable issues

**Acceptance Criteria**:
- Score displayed prominently
- Issues listed with descriptions
- Auto-fix buttons visible where applicable

**Test Tasks**:
- [ ] Unit test: Renders score correctly
- [ ] Unit test: Renders issues list
- [ ] Unit test: Apply Fix button appears for autoFixAvailable

---

### Story 1.6: Batch Actions Component
**Points**: 2 | **Priority**: P1

**Tasks**:
- [ ] Create `BatchActions.tsx` component
- [ ] Show selected count
- [ ] Approve All, Reject All, QA Check All buttons
- [ ] Clear selection button
- [ ] Hide when no selection

**Acceptance Criteria**:
- Shows selected count
- Buttons trigger handlers
- Hidden when selectedCount = 0

**Test Tasks**:
- [ ] Unit test: Hidden when no selection
- [ ] Unit test: Shows count when selected
- [ ] Unit test: Buttons call handlers

---

## Day 2: Integration + API + QA Layer

### Story 2.1: PromptEditor Integration
**Points**: 3 | **Priority**: P0

**Tasks**:
- [ ] Add SourceContextSection at top of editor
- [ ] Add QAResultsSection below Targeting
- [ ] Add QA Check button to footer
- [ ] Add Make Compelling button to footer
- [ ] Wire up handlers

**Acceptance Criteria**:
- Source context visible in Inspector
- QA results visible when present
- New buttons functional

**Test Tasks**:
- [ ] E2E test: Source context section visible when prompt selected
- [ ] E2E test: QA Check button triggers action

---

### Story 2.2: ReviewQueue Integration
**Points**: 3 | **Priority**: P0

**Tasks**:
- [ ] Integrate selection hook
- [ ] Add keyboard shortcut handlers (A/R/E)
- [ ] Add Shift+Click for range selection
- [ ] Update card styling for selected state

**Acceptance Criteria**:
- Cards show selected state
- Keyboard shortcuts work
- Shift+Click selects range

**Test Tasks**:
- [ ] E2E test: A key approves selected prompts
- [ ] E2E test: R key rejects selected prompts
- [ ] E2E test: Shift+Click selects range

---

### Story 2.3: Source Context API Endpoint
**Points**: 2 | **Priority**: P0

**Tasks**:
- [ ] Create `pages/api/documents/[id]/context.ts`
- [ ] Fetch document by ID
- [ ] Return title, extracted passage, confidence
- [ ] Handle missing documents

**Acceptance Criteria**:
- Returns document context
- 404 for missing documents
- Includes extracted passage when promptId provided

**Test Tasks**:
- [ ] Integration test: Returns context for valid doc
- [ ] Integration test: Returns 404 for missing doc

---

### Story 2.4: QA Check API Endpoint
**Points**: 3 | **Priority**: P0

**Tasks**:
- [ ] Create `lib/prompts/qa.ts` with QA logic
- [ ] Create `pages/api/prompts/[id]/qa.ts` endpoint
- [ ] Build assessment prompt for LLM
- [ ] Parse LLM response into QACheckResult
- [ ] Update prompt with QA results

**Acceptance Criteria**:
- Endpoint accepts POST
- Calls LLM for assessment
- Updates prompt payload with results
- Returns structured result

**Test Tasks**:
- [ ] Unit test: buildAssessmentPrompt includes all fields
- [ ] Integration test: QA check returns valid result
- [ ] Integration test: Prompt updated with QA fields

---

### Story 2.5: QA Copilot Actions
**Points**: 3 | **Priority**: P1

**Tasks**:
- [ ] Create `PromptQAActions.ts` with action handlers
- [ ] Implement `/qa-check` action
- [ ] Implement `/make-compelling` action
- [ ] Implement `/fix-prompt` action
- [ ] Register actions in PromptCopilotActions.ts

**Acceptance Criteria**:
- Actions registered and discoverable
- Each action returns proper CopilotActionResult
- Actions integrate with existing Copilot infrastructure

**Test Tasks**:
- [ ] Unit test: qa-check handler returns valid result
- [ ] Unit test: make-compelling generates options
- [ ] Unit test: fix-prompt applies suggested fixes

---

### Story 2.6: Batch Operations
**Points**: 3 | **Priority**: P1

**Tasks**:
- [ ] Wire BatchActions to index.tsx
- [ ] Implement batch approve handler
- [ ] Implement batch reject handler
- [ ] Implement batch QA check handler
- [ ] Add confirmation modal for destructive actions
- [ ] Add progress indicator

**Acceptance Criteria**:
- Batch approve works for selection
- Batch reject works for selection
- Confirmation required for batch operations
- Progress shown during execution

**Test Tasks**:
- [ ] E2E test: Batch approve updates all selected
- [ ] E2E test: Confirmation modal appears
- [ ] E2E test: Progress indicator visible during batch

---

## Day 3: Title Transforms + Testing + Polish

### Story 3.1: Title Transformation Utilities
**Points**: 3 | **Priority**: P1

**Tasks**:
- [ ] Create `TitleTransforms.ts` utility
- [ ] Implement `toQuestionTitle(conceptLabel, salienceDimensions)`
- [ ] Implement `toCompellingTitle(conceptLabel, interestingBecause)`
- [ ] Add title style detection

**Acceptance Criteria**:
- Question transformation works for all salience types
- Compelling transformation uses interestingBecause
- Pure functions, no side effects

**Test Tasks**:
- [ ] Unit test: toQuestionTitle - technical salience
- [ ] Unit test: toQuestionTitle - philosophical salience
- [ ] Unit test: toQuestionTitle - default case
- [ ] Unit test: toCompellingTitle generates topic phrase
- [ ] Unit test: handles missing interestingBecause

---

### Story 3.2: Extraction Prompt Update
**Points**: 2 | **Priority**: P2

**Tasks**:
- [ ] Update `lib/knowledge/extractionPrompt.ts`
- [ ] Add question-style title generation
- [ ] Add structured execution prompt output
- [ ] Add userIntent and conceptAngle to extraction

**Acceptance Criteria**:
- Extraction generates question titles by default
- Extraction populates userIntent
- Extraction derives conceptAngle from interestingBecause

**Test Tasks**:
- [ ] Integration test: Extraction returns question title
- [ ] Integration test: Extraction includes userIntent

---

### Story 3.3: E2E Test Suite
**Points**: 4 | **Priority**: P0

**Tasks**:
- [ ] Create `tests/e2e/prompt-workshop.spec.ts`
- [ ] Test: User can approve via keyboard
- [ ] Test: User can see source context
- [ ] Test: User can batch approve
- [ ] Test: QA check shows issues
- [ ] Test: Make compelling transforms title

**Acceptance Criteria**:
- All E2E tests pass
- Tests use proper selectors (data-testid)
- Tests follow behavior-over-implementation principle

**Test Implementation**:
```typescript
test.describe('PromptWorkshop - Prompt Refinement', () => {
  test('user can approve prompt via keyboard shortcut', async ({ page }) => {
    await page.goto('/foundation/prompts');
    await page.click('[data-testid="prompt-card"]:first-child');
    await page.keyboard.press('a');
    await expect(page.locator('[data-status="approved"]')).toBeVisible();
  });

  test('user can see source context in Inspector', async ({ page }) => {
    await page.goto('/foundation/prompts');
    await page.click('[data-testid="prompt-card"]');
    await page.click('[data-testid="source-context-toggle"]');
    await expect(page.locator('[data-testid="source-passage"]')).toBeVisible();
  });

  test('user can batch-approve multiple prompts', async ({ page }) => {
    await page.goto('/foundation/prompts');
    await page.keyboard.down('Shift');
    await page.click('[data-testid="prompt-card"]:nth-child(1)');
    await page.click('[data-testid="prompt-card"]:nth-child(3)');
    await page.keyboard.up('Shift');
    await page.click('[data-testid="batch-approve"]');
    await expect(page.locator('[data-status="approved"]')).toHaveCount(3);
  });

  test('copilot QA check shows issues', async ({ page }) => {
    await page.goto('/foundation/prompts');
    await page.click('[data-testid="prompt-card"]');
    await page.click('[data-testid="qa-check-button"]');
    await expect(page.locator('[data-testid="qa-score"]')).toBeVisible();
  });
});
```

---

### Story 3.4: Unit Test Suite
**Points**: 3 | **Priority**: P0

**Tasks**:
- [ ] Create `tests/unit/TitleTransforms.test.ts`
- [ ] Create `tests/unit/usePromptSelection.test.ts`
- [ ] Create `tests/unit/PromptQAActions.test.ts`
- [ ] Achieve >80% coverage on new code

**Acceptance Criteria**:
- All unit tests pass
- Coverage meets threshold
- Tests are behavior-focused

---

### Story 3.5: Polish & Documentation
**Points**: 2 | **Priority**: P2

**Tasks**:
- [ ] Add keyboard shortcut hints to ReviewQueue header
- [ ] Add loading states to all async operations
- [ ] Add error toasts for failures
- [ ] Update sprint DEVLOG with completion notes
- [ ] Verify Health system integration

**Acceptance Criteria**:
- Keyboard shortcuts documented in UI
- Loading states visible
- Errors handled gracefully
- DEVLOG updated

---

### Story 3.6: 4D Targeting Foundation
**Points**: 4 | **Priority**: P1

**Tasks**:
- [ ] Create `TargetingSection.tsx` component for Inspector
- [ ] Create `/suggest-targeting` Copilot action
- [ ] Implement lens compatibility matrix display (read-only first)
- [ ] Wire stage inference from salienceDimensions
- [ ] Add stage → depth mapping constants

**Acceptance Criteria**:
- Targeting section shows lens affinities as matrix
- Suggest Targeting action returns suggestions
- Stage inference considers salience dimensions
- UI shows which stages work per lens

**Technical Notes**:
- Use existing `LensAffinity[]` and `targeting.stages` fields
- Connect to existing `VocabularyLevel` and `NarrativeStyle` in narrative schema
- Future sprint will add editing capabilities

**Test Tasks**:
- [ ] Unit test: Stage inference from salience dimensions
- [ ] Unit test: Lens compatibility calculation
- [ ] E2E test: Targeting section visible in Inspector

---

## Story Summary

| Story | Points | Priority | Day |
|-------|--------|----------|-----|
| 1.1 Schema Extensions | 2 | P0 | 1 |
| 1.2 Selection Hook | 3 | P0 | 1 |
| 1.3 Source Context Hook | 2 | P1 | 1 |
| 1.4 Source Context Section | 3 | P1 | 1 |
| 1.5 QA Results Section | 2 | P1 | 1 |
| 1.6 Batch Actions Component | 2 | P1 | 1 |
| 2.1 PromptEditor Integration | 3 | P0 | 2 |
| 2.2 ReviewQueue Integration | 3 | P0 | 2 |
| 2.3 Source Context API | 2 | P0 | 2 |
| 2.4 QA Check API | 3 | P0 | 2 |
| 2.5 QA Copilot Actions | 3 | P1 | 2 |
| 2.6 Batch Operations | 3 | P1 | 2 |
| 3.1 Title Transforms | 3 | P1 | 3 |
| 3.2 Extraction Update | 2 | P2 | 3 |
| 3.3 E2E Test Suite | 4 | P0 | 3 |
| 3.4 Unit Test Suite | 3 | P0 | 3 |
| 3.5 Polish | 2 | P2 | 3 |
| 3.6 4D Targeting Foundation | 4 | P1 | 3 |

**Total Points**: 49

---

## Definition of Done

- [ ] All P0 stories complete
- [ ] E2E tests pass in CI
- [ ] Unit tests pass with >80% coverage on new code
- [ ] No TypeScript errors
- [ ] No console errors in dev
- [ ] DEVLOG updated with completion notes
- [ ] Sprint artifacts archived
