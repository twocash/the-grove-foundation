# EXECUTION_PROMPT.md - prompt-refinement-v1

> **Sprint**: prompt-refinement-v1
> **Handoff Date**: 2026-01-06
> **Target**: Claude Code / Fresh Context Window

---

## TRELLIS/DEX COMPLIANCE

This sprint follows the **Declarative Exploration (DEX) Standard**:

| Principle | Application in This Sprint |
|-----------|---------------------------|
| **Declarative Sovereignty** | Targeting configuration in schema, not hardcoded paths |
| **Capability Agnosticism** | QA layer validates prompts regardless of model capability |
| **Provenance as Infrastructure** | Source context tracks extraction origin |
| **Organic Scalability** | Multi-lens targeting enables "guided wandering" |

**Prime Directive**: Never hard-code an exploration path. Build the engine that reads the map; do not build the map into the engine.

---

## ATTENTION ANCHOR - READ THIS FIRST

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  🎯 PRIMARY MISSION: Add Copilot QA Layer to PromptWorkshop         │
│                                                                     │
│  SUCCESS CRITERIA:                                                  │
│  ✓ Operators can batch-review prompts with keyboard shortcuts       │
│  ✓ Source context visible in Inspector                              │
│  ✓ Copilot validates prompts against source material                │
│  ✓ 4D Targeting shows lens compatibility matrix                     │
│  ✓ E2E tests pass for full review workflow                          │
│                                                                     │
│  FAILURE CRITERIA:                                                  │
│  ✗ Creating new patterns (use existing Bedrock patterns)            │
│  ✗ Building new extraction pipeline (already exists)                │
│  ✗ Adding operator-level config UI (deferred)                       │
│  ✗ Breaking existing PromptWorkshop functionality                   │
│  ✗ Hardcoding exploration paths (violates DEX)                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Context Summary

You are extending the **PromptWorkshop** console in the Grove Foundation project to add a Copilot QA layer that helps operators review and refine extracted prompts.

### What Already Exists
- `PromptWorkshop` console at `src/bedrock/consoles/PromptWorkshop/`
- `PromptEditor.tsx` with section-based Inspector
- `ReviewQueue.tsx` with approve/reject functionality
- `PromptCopilotActions.ts` with basic copilot handlers
- Extraction pipeline that creates prompts from documents

### What You're Adding
1. **Source Context Section** - Shows the document passage that triggered extraction
2. **QA Results Section** - Displays Copilot quality assessment
3. **Batch Selection** - Multi-select with keyboard shortcuts (A/R/E)
4. **QA Copilot Actions** - `/qa-check`, `/make-compelling`, `/fix-prompt`
5. **4D Targeting Foundation** - Lens compatibility matrix, `/suggest-targeting` action

---

## Sprint Artifacts

Read these in order before coding:

| # | Artifact | Purpose |
|---|----------|---------|
| 1 | `docs/sprints/prompt-refinement-v1/SPEC.md` | What we're building, scope decisions |
| 2 | `docs/sprints/prompt-refinement-v1/ARCHITECTURE.md` | Component architecture, data flow |
| 3 | `docs/sprints/prompt-refinement-v1/MIGRATION_MAP.md` | File-by-file changes with diffs |
| 4 | `docs/sprints/prompt-refinement-v1/DECISIONS.md` | Why we made certain choices |
| 5 | `docs/sprints/prompt-refinement-v1/SPRINTS.md` | Story breakdown with test tasks |

---

## Execution Order

### Phase 1: Schema (30 min)

```bash
# File: src/core/schema/prompt.ts
# Add these fields to PromptPayload interface:
# - userIntent?: string
# - conceptAngle?: string
# - suggestedFollowups?: string[]
# - qaScore?: number
# - qaLastChecked?: string
# - qaIssues?: QAIssue[]
# Add QAIssue interface
```

**Verify**: `npm run typecheck` passes

### Phase 2: Hooks (1 hour)

```bash
# 1. Create usePromptSelection.ts
# Location: src/bedrock/consoles/PromptWorkshop/hooks/usePromptSelection.ts
# See MIGRATION_MAP.md for full implementation

# 2. Create useSourceContext.ts
# Location: src/bedrock/consoles/PromptWorkshop/hooks/useSourceContext.ts
# Fetches from /api/documents/:id/context
```

**Verify**: Hooks can be imported without errors

### Phase 3: UI Components (2 hours)

```bash
# 1. SourceContextSection.tsx
# Location: src/bedrock/consoles/PromptWorkshop/components/SourceContextSection.tsx
# Uses InspectorSection with collapsible prop

# 2. QAResultsSection.tsx
# Location: src/bedrock/consoles/PromptWorkshop/components/QAResultsSection.tsx
# Displays score, issues, fix buttons

# 3. BatchActions.tsx
# Location: src/bedrock/consoles/PromptWorkshop/components/BatchActions.tsx
# Shows when selection > 0
```

**Verify**: Components render in isolation (Storybook if available)

### Phase 4: Integration (2 hours)

```bash
# 1. Update PromptEditor.tsx
# - Add SourceContextSection at top
# - Add QAResultsSection below Targeting
# - Add QA Check and Make Compelling buttons to footer

# 2. Update ReviewQueue.tsx
# - Add selection hook integration
# - Add keyboard shortcut handlers
# - Add Shift+Click range selection

# 3. Update index.tsx
# - Add BatchActions to ModuleShell contextualFeatures
```

**Verify**: Dev server shows updated UI at `/foundation/prompts`

### Phase 5: API (1.5 hours)

```bash
# NOTE: This is Vite + Express, NOT Next.js
# All API routes are defined in server.js, not pages/api/

# 1. Add source context endpoint to server.js
# Route: GET /api/documents/:id/context

# 2. Create QA check logic module
# Location: lib/prompts/qa.js

# 3. Add QA endpoint to server.js
# Route: POST /api/prompts/:id/qa
```

**Verify**: API endpoints respond correctly via curl/Postman

### Phase 6: Copilot Actions (1 hour)

```bash
# 1. Create PromptQAActions.ts
# Location: src/bedrock/consoles/PromptWorkshop/PromptQAActions.ts

# 2. Register in PromptCopilotActions.ts
```

**Verify**: Copilot actions appear in console

### Phase 7: Title Transforms (1 hour)

```bash
# 1. Create TitleTransforms.ts
# Location: src/bedrock/consoles/PromptWorkshop/utils/TitleTransforms.ts

# 2. Wire to /make-compelling action
```

**Verify**: Title transformation works end-to-end

### Phase 8: Testing (2 hours)

```bash
# 1. E2E tests
npm run test:e2e -- prompt-workshop.spec.ts

# 2. Unit tests
npm run test -- TitleTransforms usePromptSelection PromptQAActions TargetingInference

# 3. Full test suite
npm run test
```

**Verify**: All tests pass, no regressions

---

### Phase 9: 4D Targeting Foundation (1.5 hours)

```bash
# 1. Create TargetingInference.ts
# Location: src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts
# Contains: STAGE_DEPTH_MAP, LENS_STAGE_COMPATIBILITY, inferTargetingFromSalience()

# 2. Create TargetingSection.tsx
# Location: src/bedrock/consoles/PromptWorkshop/components/TargetingSection.tsx
# Displays: Lens compatibility matrix, stage checkboxes, Suggest button

# 3. Add /suggest-targeting action to PromptQAActions.ts

# 4. Wire TargetingSection into PromptEditor.tsx Inspector
```

**Key Concept**: Prompts aren't assigned to ONE lens - they're explorable across MANY lenses at different depths. Stage determines response characteristics:

| Stage | VocabularyLevel | NarrativeStyle | Response Length |
|-------|-----------------|----------------|-----------------|
| genesis | accessible | stakes-heavy | short |
| exploration | technical | mechanics-deep | medium |
| synthesis | academic | evidence-first | long |
| advocacy | executive | resolution-oriented | comprehensive |

**Verify**: TargetingSection visible in Inspector, /suggest-targeting returns suggestions

---

## Key Patterns to Follow

### Pattern: Inspector Section
```typescript
// InspectorSection exists in src/shared/layout/InspectorPanel.tsx
// Import from shared/layout barrel export
import { InspectorSection } from '@shared/layout';
// OR relative: import { InspectorSection } from '../../../../shared/layout';

<InspectorSection title="Source Context" collapsible defaultCollapsed>
  {/* content */}
</InspectorSection>
```

### Pattern: Copilot Action
```typescript
// Register actions following existing pattern
export const QA_ACTIONS = {
  'qa-check': {
    id: 'qa-check',
    trigger: '/qa-check',
    description: 'Run quality assessment',
    handler: qaCheckHandler,
  },
};
```

### Pattern: Keyboard Shortcuts
```typescript
// Scope to component, use useEffect
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === 'a') handleApprove();
    if (e.key === 'r') handleReject();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Testing Requirements

### E2E Tests (Required)
```typescript
// tests/e2e/prompt-workshop.spec.ts

test('user can approve via keyboard', async ({ page }) => {
  await page.goto('/foundation/prompts');
  await page.click('[data-testid="prompt-card"]:first-child');
  await page.keyboard.press('a');
  await expect(page.locator('[data-status="approved"]')).toBeVisible();
});

test('user can see source context', async ({ page }) => {
  await page.goto('/foundation/prompts');
  await page.click('[data-testid="prompt-card"]');
  await page.click('[data-testid="source-context-toggle"]');
  await expect(page.locator('[data-testid="source-passage"]')).toBeVisible();
});

test('QA check shows issues', async ({ page }) => {
  await page.goto('/foundation/prompts');
  await page.click('[data-testid="prompt-card"]');
  await page.click('[data-testid="qa-check-button"]');
  await expect(page.locator('[data-testid="qa-score"]')).toBeVisible();
});
```

### Test Data-TestId Requirements
- `prompt-card` - Each prompt in ReviewQueue
- `source-context-toggle` - Source context section header
- `source-passage` - Extracted passage display
- `qa-check-button` - QA check action button
- `qa-score` - QA score display
- `qa-issues` - QA issues list
- `batch-approve` - Batch approve button
- `batch-reject` - Batch reject button
- `targeting-section` - Targeting section container
- `lens-matrix` - Lens compatibility matrix
- `suggest-targeting-button` - Suggest targeting action button

---

## Anti-Patterns to Avoid

❌ **Don't** create new Inspector patterns - use `InspectorSection`
❌ **Don't** add hardcoded conditionals for source type
❌ **Don't** put business logic in React components
❌ **Don't** skip writing tests
❌ **Don't** break existing approve/reject functionality

---

## Checkpoint Commands

Run these to verify progress:

```bash
# After each phase
npm run typecheck
npm run lint

# After Phase 4
npm run dev  # Manual verification at /foundation/prompts

# After Phase 8
npm run test
npm run test:e2e
```

---

## DEVLOG Updates

After each phase, update `docs/sprints/prompt-refinement-v1/DEVLOG.md`:

```markdown
## Phase X Complete - [timestamp]

### What was done
- [list changes]

### Issues encountered
- [any blockers]

### Next steps
- [what's next]
```

---

## Emergency Contacts

If blocked:
1. Check existing patterns in `src/bedrock/patterns/`
2. Review similar console: `src/bedrock/consoles/LensWorkshop/`
3. Search codebase for similar implementations

---

## Final Checklist

Before marking sprint complete:

- [ ] All P0 stories implemented
- [ ] 4D Targeting foundation implemented (Story 3.6)
- [ ] E2E tests pass
- [ ] Unit tests pass
- [ ] No TypeScript errors
- [ ] No console errors in dev
- [ ] DEVLOG updated
- [ ] PR ready for review
- [ ] DEX compliance verified (no hardcoded exploration paths)
