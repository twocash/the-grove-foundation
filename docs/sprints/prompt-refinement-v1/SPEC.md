# SPEC.md - prompt-refinement-v1

> **Sprint**: prompt-refinement-v1
> **Created**: 2026-01-06
> **Status**: 🟡 IN PROGRESS

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ WE ARE BUILDING: Copilot QA layer for extracted prompts        │
│                                                                 │
│ SUCCESS LOOKS LIKE:                                             │
│   • Operators can batch-review prompts with AI assistance       │
│   • Source context visible in Inspector                         │
│   • Copilot validates prompts against source material           │
│   • Keyboard shortcuts (A/R/E) speed up review workflow         │
│                                                                 │
│ WE ARE NOT:                                                     │
│   • Building new extraction pipeline (exists)                   │
│   • Creating new UI patterns (extending existing)               │
│   • Adding operator-level config UI (deferred to Epic 5)        │
│                                                                 │
│ CURRENT PHASE: Specification                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## LIVE STATUS

| Epic | Status | Blocked By |
|------|--------|------------|
| Epic 1: Interactive Inspector | 🔴 Not Started | - |
| Epic 2: Title Refinement | 🔴 Not Started | Epic 1 |
| Epic 3: Copilot QA Layer | 🔴 Not Started | Epic 1 |
| Epic 4: Batch Operations | 🔴 Not Started | Epic 1 |
| Epic 5: 4D Targeting Foundation | 🔴 Not Started | Epic 1 |

**Last Updated**: 2026-01-06 11:00 EST

---

## 1. Executive Summary

Transform the PromptWorkshop from a display-only review queue into an interactive refinement console where:

1. **Source Context** is visible alongside extracted prompts
2. **Copilot QA** validates prompts will produce quality responses
3. **Batch Operations** with keyboard shortcuts speed up review workflow
4. **Title Transformation** converts concepts to compelling explorations

### Headline Feature

> **"AI collaborator that validates your prompts will actually work"**

The Copilot doesn't just edit text—it predicts response quality, identifies prompt engineering issues, and suggests specific fixes with reasoning.

---

## 2. Scope Decisions (From Strategic Brainstorm)

### 2.1 Title Strategy

**Decision**: Questions as default + `/make-compelling` action for selective transformation.

- Default extracted titles become questions: "Observer Dynamic" → "What is the Observer Dynamic?"
- `/make-compelling` uses `interestingBecause` field to create topic-phrase: "The Observer Dynamic: Seeing Without Being Seen"
- Avoids doubling token cost by not generating both styles upfront

### 2.2 Execution Prompt Structure

**Decision**: Three fields, not four.

```typescript
interface StructuredExecutionPrompt {
  userIntent: string;      // What the user wants to learn
  conceptAngle: string;    // How to frame the response (from interestingBecause)
  suggestedFollowups?: string[];  // Optional next questions
}
```

- **Drop `depthLevel`**: Handle at runtime via engagement machine context
- **Rename `responseGuidance`** → `conceptAngle` for clarity

### 2.3 Extraction Triggers

**Decision**: Auto-extraction OFF by default.

- Collection-level toggle, defaults to `false`
- One-click manual trigger: "Extract prompts from this document"
- Smart re-extraction on document update shows diff view

### 2.4 UI Constraint

**Decision**: Stay within three-panel pattern.

- Navigation | Content | Inspector layout preserved
- Add collapsible "Source Context" section at TOP of Inspector
- Defer full-width expand unless proven necessary across multiple use cases

### 2.5 Batch Architecture

**Decision**: Individual actions as primitives, batch = "apply to selection."

- Selection state managed in `usePromptSelection` hook
- Keyboard shortcuts: A (approve), R (reject), E (edit/inspect)
- Batch operations show confirmation + progress
- Results available for review (not auto-applied)

---

## 3. Epic Specifications

### Epic 1: Interactive Inspector Enhancement

**Goal**: Make PromptEditor fully functional for extracted prompts with source context.

#### 1.1 Source Context Section

```typescript
interface SourceContextProps {
  promptId: string;
  documentId: string;
  extractedPassage: string;  // The specific text that triggered extraction
}
```

**UI Behavior**:
- Collapsible section at TOP of Inspector (collapsed by default)
- Shows: Document title, extracted passage (highlighted), confidence score
- "View full document" link opens in new tab

**Data Flow**:
- `useSourceContext(promptId)` fetches from `/api/documents/:id/context`
- Lazy load on Inspector open
- Cache results for session

#### 1.2 Editor Functionality

- All fields editable for prompts with `source !== 'library'`
- Save button calls `PATCH /api/prompts/:id`
- Changes reflect in ReviewQueue immediately (optimistic update)

#### 1.3 Quick Actions

Add to Inspector footer:
- ✓ Approve (same as sidebar)
- ✗ Reject (same as sidebar)
- 🔄 Regenerate Title (Copilot action)
- ✨ QA Check (Copilot action - new)

### Epic 2: Title Refinement

**Goal**: Transform concept labels into compelling exploration prompts.

#### 2.1 Default Question Style

Transformation logic in `TitleTransforms.ts`:

```typescript
function toQuestionTitle(conceptLabel: string, salienceDimensions?: string[]): string {
  // Detect concept type from salience
  if (salienceDimensions?.includes('technical')) {
    return `How does ${conceptLabel} work?`;
  }
  if (salienceDimensions?.includes('philosophical')) {
    return `What is ${conceptLabel} and why does it matter?`;
  }
  // Default
  return `What is ${conceptLabel}?`;
}
```

#### 2.2 Compelling Title Action

Copilot action `/make-compelling`:

```typescript
{
  id: 'make-compelling',
  trigger: '/make-compelling',
  handler: async (prompt) => {
    const { interestingBecause, meta } = prompt;
    // Use interestingBecause to craft topic-phrase style
    return suggestCompellingTitle(meta.title, interestingBecause);
  }
}
```

Output: 3 title options ranked by engagement potential.

### Epic 3: Copilot QA Layer

**Goal**: AI validates prompts will produce quality responses.

#### 3.1 QA Actions

| Action | Trigger | Purpose |
|--------|---------|---------|
| `/qa-check` | Manual or batch | Full quality assessment |
| `/fix-prompt` | After QA check | Apply suggested fixes |
| `/add-context` | Manual | Add missing context to execution prompt |
| `/find-related` | Manual | Identify cross-references in knowledge base |

#### 3.2 QA Check Response

```typescript
interface QACheckResult {
  overallScore: number;  // 0-100
  issues: QAIssue[];
  suggestions: string[];
  predictedResponseQuality: 'high' | 'medium' | 'low';
}

interface QAIssue {
  type: 'missing_context' | 'ambiguous_intent' | 'too_broad' | 'too_narrow';
  description: string;
  suggestedFix: string;
  autoFixAvailable: boolean;
}
```

#### 3.3 Source Consultation

QA layer can access source document to:
- Verify execution prompt aligns with source content
- Identify missing context from source
- Suggest specific passages to include

### Epic 4: Batch Operations

**Goal**: Speed up review workflow with selection + keyboard shortcuts.

#### 4.1 Selection State

```typescript
interface PromptSelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  selectionMode: 'single' | 'multi';
}
```

#### 4.2 Keyboard Shortcuts

| Key | Action | Scope |
|-----|--------|-------|
| A | Approve selected | ReviewQueue focus |
| R | Reject selected | ReviewQueue focus |
| E | Inspect/Edit selected | ReviewQueue focus |
| Shift+Click | Range select | ReviewQueue cards |
| Cmd/Ctrl+A | Select all visible | ReviewQueue focus |
| Escape | Clear selection | Global |

#### 4.3 Batch Action UI

When selection.size > 1:
- Show "X items selected" badge
- Show batch action bar: "Approve All | Reject All | QA Check All"
- Confirmation modal for destructive actions
- Progress indicator during execution

---

### Epic 5: 4D Targeting Foundation

**Goal**: Enable multi-dimensional targeting where prompts work across MANY lenses at different depths.

#### 5.1 Key Insight: Prompts Are Multi-Dimensional

A prompt like "Observer Dynamic" isn't "for one lens" - it's explorable:
- **Technical lens** at Genesis → "What is it?"
- **Technical lens** at Synthesis → "How does it integrate with the memory system?"
- **Executive lens** at Genesis → "Why should I care?"
- **Academic lens** at any depth → Full theoretical treatment

**The stage determines response depth, not the prompt itself.**

#### 5.2 Stage → Depth Mapping

Existing infrastructure (not yet surfaced in UI):

| Stage | Response Character | VocabularyLevel | NarrativeStyle |
|-------|-------------------|-----------------|----------------|
| Genesis | Overview, accessible | `accessible` | `hook-heavy` |
| Exploration | Detailed mechanics | `technical` | `mechanics-deep` |
| Synthesis | Deep-dive, connections | `academic` | `evidence-first` |
| Advocacy | Actionable, focused | `executive` | `resolution-oriented` |

#### 5.3 Lens Compatibility Matrix UI

Instead of "assign to ONE lens," show compatibility across lenses:

```
┌───────────────────┬─────────────┬───────────────────────────┐
│ Lens              │ Affinity    │ Stages Available          │
├───────────────────┼─────────────┼───────────────────────────┤
│ Technical         │ ●●●●○ (0.8) │ Genesis → Synthesis       │
│ Executive         │ ●●●○○ (0.6) │ Genesis → Exploration     │
│ Academic          │ ●●●●● (1.0) │ All stages                │
│ General           │ ●●○○○ (0.4) │ Genesis only              │
└───────────────────┴─────────────┴───────────────────────────┘
```

#### 5.4 `/suggest-targeting` Copilot Action

```typescript
interface TargetingSuggestion {
  lensAffinities: Array<{
    lensId: string;
    weight: number;      // 0-1
    reasoning: string;   // Why this lens works
    stagesAvailable: PromptStage[];  // What depths work for this lens
  }>;
  primaryStage: PromptStage;
  confidence: number;
}
```

**Action behavior:**
1. Analyze concept complexity from `salienceDimensions`
2. Infer lens fit from technical/philosophical/practical nature
3. Suggest which stages work per lens (not all lenses support all depths)
4. Return suggestions for operator approval

#### 5.5 UI Integration

Add to PromptEditor Inspector:

```typescript
// New section: "Targeting" (after Source Context)
<TargetingSection
  lensAffinities={prompt.payload.lensAffinities}
  targetStages={prompt.payload.targeting.stages}
  onSuggestTargeting={handleSuggestTargeting}
  onUpdateAffinities={handleUpdateAffinities}
/>
```

**Section displays:**
- Lens compatibility matrix (editable weights)
- Stage checkboxes per lens
- "Suggest Targeting" button (Copilot action)
- Confidence indicator for suggestions

---

## 4. Data Model Changes

### 4.1 PromptPayload Extensions

```typescript
// Add to src/core/schema/prompt.ts
interface PromptPayload {
  // ... existing fields ...
  
  // Structured execution prompt (Epic 3)
  userIntent?: string;
  conceptAngle?: string;  // Populated from interestingBecause
  suggestedFollowups?: string[];
  
  // QA metadata (Epic 3)
  qaScore?: number;
  qaLastChecked?: string;  // ISO timestamp
  qaIssues?: QAIssue[];
}
```

### 4.2 No Database Migration Required

- All new fields are optional
- Stored in existing JSONB `payload` column
- Existing prompts remain valid

---

## 5. API Endpoints

### 5.1 New Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/prompts/:id/qa` | Run QA check on single prompt |
| POST | `/api/prompts/batch/qa` | Run QA check on multiple prompts |
| GET | `/api/documents/:id/context` | Get source context for extraction |

### 5.2 Existing Endpoints (Verify)

| Method | Path | Verification |
|--------|------|--------------|
| PATCH | `/api/prompts/:id` | Confirm saves payload updates |
| POST | `/api/bedrock/copilot` | Confirm action dispatch works |

---

## 6. Testing Requirements

### 6.1 E2E Tests (`tests/e2e/prompt-workshop.spec.ts`)

```typescript
describe('PromptWorkshop - Prompt Refinement', () => {
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
    await expect(page.locator('[data-testid="qa-issues"]')).toBeVisible();
  });
});
```

### 6.2 Unit Tests

| Test File | Coverage |
|-----------|----------|
| `TitleTransforms.test.ts` | Question/topic transformations |
| `PromptQAActions.test.ts` | QA action logic |
| `usePromptSelection.test.ts` | Selection state management |

### 6.3 Integration Tests

| Test File | Coverage |
|-----------|----------|
| `prompt-qa-api.test.ts` | QA endpoint integration |
| `source-context-api.test.ts` | Document context retrieval |

---

## 7. Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Review time per prompt | < 15 seconds | Telemetry |
| Keyboard shortcut adoption | > 50% of approvals | Telemetry |
| QA check accuracy | > 80% issue detection | Manual audit |
| Title quality (no manual edit) | > 70% | Sampling |

---

## 8. Out of Scope

1. **Operator-level extraction config UI** (Epic 5 from REQUIREMENTS) - Deferred
2. **Fine-tuning data collection** - Future consideration
3. **A/B testing title styles** - Deferred
4. **Kanban-style review board** - Sidebar + Inspector sufficient for MVP

---

## 9. Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| extraction-pipeline-integration-v1 | ✅ Complete | Base extraction |
| prompt-unification-v1 | ✅ Complete | GroveObject schema |
| grove-data-layer-v1 | ✅ Complete | SupabaseAdapter |
| Bedrock Copilot infrastructure | ✅ Exists | Action dispatch |
