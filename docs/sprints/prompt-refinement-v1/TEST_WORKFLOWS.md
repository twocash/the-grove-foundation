# TEST_WORKFLOWS.md - prompt-refinement-v1

> **Purpose**: Systematic verification workflows for Claude Code
> **Sprint**: prompt-refinement-v1
> **Created**: 2026-01-06

---

## Pre-Flight Checks

Before running workflows, verify:

```bash
# 1. Dev server running
npm run dev
# Should be available at http://localhost:5173 or :8080

# 2. No TypeScript errors
npm run typecheck

# 3. Database accessible
# Check Supabase connection in server logs
```

---

## Epic 1: Schema Extensions

### Test 1.1: Type Definitions Compile

**Goal**: Verify QAIssue and extended PromptPayload types exist

```bash
# Run typecheck
npm run typecheck

# Verify no errors in:
# - src/core/schema/prompt.ts
```

**Pass Criteria**: 
- [ ] No TypeScript errors
- [ ] QAIssue interface exists with: type, description, suggestedFix, autoFixAvailable, severity
- [ ] PromptPayload has: userIntent?, conceptAngle?, suggestedFollowups?, qaScore?, qaLastChecked?, qaIssues?

### Test 1.2: Schema Import Works

**Goal**: Verify types can be imported elsewhere

```typescript
// Create temp test file or check in browser console
import { QAIssue, PromptPayload } from '@core/schema/prompt';

// Should not error
const testIssue: QAIssue = {
  type: 'missing_context',
  description: 'Test',
  suggestedFix: 'Fix it',
  autoFixAvailable: false,
  severity: 'warning'
};
```

**Pass Criteria**:
- [ ] Import resolves without error
- [ ] Type validation works

---

## Epic 2: Source Context

### Test 2.1: useSourceContext Hook Loads

**Goal**: Verify hook fetches source context for a prompt

**Steps**:
1. Navigate to `/foundation/prompts`
2. Open browser DevTools → Network tab
3. Select a prompt that has `provenance.sourceDocIds`
4. Watch for request to `/api/documents/:id/context`

**Pass Criteria**:
- [ ] Network request fires when prompt selected
- [ ] Response contains: id, title, extractedPassage
- [ ] No console errors

### Test 2.2: SourceContextSection Renders

**Goal**: Verify component displays in Inspector

**Steps**:
1. Navigate to `/foundation/prompts`
2. Select any prompt
3. Look for "Source Context" section in Inspector panel
4. Click toggle to expand/collapse

**Pass Criteria**:
- [ ] Section header "Source Context" visible
- [ ] Collapsible toggle works
- [ ] If source exists: passage text displayed
- [ ] If no source: "No source context available" message

### Test 2.3: API Endpoint Returns Data

**Goal**: Verify GET /api/documents/:id/context works

```bash
# Get a document ID from Supabase or existing prompt
curl http://localhost:8080/api/documents/{DOC_ID}/context?promptId={PROMPT_ID}
```

**Pass Criteria**:
- [ ] Returns 200 with JSON payload
- [ ] Contains: id, title, extractedPassage
- [ ] Returns 404 for invalid ID

---

## Epic 3: QA Layer

### Test 3.1: QAResultsSection Renders

**Goal**: Verify QA results display in Inspector

**Steps**:
1. Navigate to `/foundation/prompts`
2. Select a prompt
3. Look for "QA Results" section in Inspector

**Pass Criteria**:
- [ ] Section visible in Inspector
- [ ] Shows score (0-100) or "Not checked"
- [ ] Shows issues list if any exist
- [ ] Shows "Run QA Check" button

### Test 3.2: QA Check Button Triggers API

**Goal**: Verify clicking "Run QA Check" calls endpoint

**Steps**:
1. Select a prompt
2. Open DevTools → Network tab
3. Click "Run QA Check" button (or use /qa-check copilot action)
4. Watch for POST to `/api/prompts/:id/qa-check`

**Pass Criteria**:
- [ ] POST request fires
- [ ] Response contains: score, issues[]
- [ ] UI updates to show new score
- [ ] Issues display with severity badges

### Test 3.3: QA API Endpoint Works

**Goal**: Verify POST /api/prompts/:id/qa-check works

```bash
# Get a prompt ID from the UI
curl -X POST http://localhost:8080/api/prompts/{PROMPT_ID}/qa-check
```

**Pass Criteria**:
- [ ] Returns 200 with JSON
- [ ] Contains: score (number), issues (array)
- [ ] Issues have: type, description, suggestedFix, severity
- [ ] Prompt record updated in Supabase (check qaScore field)

### Test 3.4: Copilot /qa-check Action

**Goal**: Verify copilot action triggers QA

**Steps**:
1. Select a prompt
2. Open Copilot input
3. Type `/qa-check` and execute
4. Watch for response

**Pass Criteria**:
- [ ] Action recognized by copilot
- [ ] Triggers API call
- [ ] Returns human-readable summary
- [ ] UI updates with results

---

## Epic 4: Batch Operations

### Test 4.1: usePromptSelection Hook Works

**Goal**: Verify multi-select state management

**Steps**:
1. Navigate to `/foundation/prompts`
2. Click first prompt (should select)
3. Shift+Click third prompt (should range select)
4. Ctrl+Click to toggle individual

**Pass Criteria**:
- [ ] Single click selects one
- [ ] Shift+Click selects range
- [ ] Ctrl+Click toggles without clearing others
- [ ] Selection count displayed somewhere

### Test 4.2: BatchActions Component Renders

**Goal**: Verify batch action bar appears on selection

**Steps**:
1. Select 2+ prompts
2. Look for batch action bar (above list or floating)

**Pass Criteria**:
- [ ] Bar appears when selection > 0
- [ ] Shows count: "3 selected"
- [ ] Shows buttons: Approve All, Reject All, QA Check All, Clear
- [ ] Bar hides when selection cleared

### Test 4.3: Keyboard Shortcuts Work

**Goal**: Verify A/R/Esc shortcuts in ReviewQueue

**Steps**:
1. Select a prompt
2. Press `A` key
3. Check if prompt approved
4. Select another prompt
5. Press `R` key
6. Check if prompt rejected
7. Select prompts
8. Press `Esc`
9. Check if selection cleared

**Pass Criteria**:
- [ ] `A` triggers approve action
- [ ] `R` triggers reject action
- [ ] `Esc` clears selection
- [ ] Shortcuts only work when focus is in ReviewQueue (not in text inputs)

### Test 4.4: Batch Approve/Reject

**Goal**: Verify batch actions affect multiple prompts

**Steps**:
1. Select 3 prompts
2. Click "Approve All"
3. Verify all 3 changed status
4. Select 2 different prompts
5. Click "Reject All"
6. Verify both changed status

**Pass Criteria**:
- [ ] Batch approve updates all selected
- [ ] Batch reject updates all selected
- [ ] Selection clears after batch action
- [ ] Toast/notification confirms action

---

## Epic 5: 4D Targeting

### Test 5.1: TargetingSection Renders

**Goal**: Verify targeting matrix displays in Inspector

**Steps**:
1. Navigate to `/foundation/prompts`
2. Select a prompt
3. Look for "Targeting" section in Inspector

**Pass Criteria**:
- [ ] Section visible
- [ ] Shows lens compatibility matrix
- [ ] Columns: Lens, Affinity (dots), Stages Available
- [ ] At least one lens row displayed

### Test 5.2: Lens Matrix Shows Correct Data

**Goal**: Verify matrix reflects prompt's targeting config

**Steps**:
1. Select prompt with known lensAffinities in payload
2. Compare matrix display to actual data

**Pass Criteria**:
- [ ] Affinity dots match numeric values (●●●○○ = 0.6)
- [ ] Stage badges show correct stages per lens
- [ ] Technical lens shows: Genesis → Synthesis
- [ ] Executive lens shows: Genesis → Advocacy

### Test 5.3: /suggest-targeting Copilot Action

**Goal**: Verify copilot suggests targeting based on salience

**Steps**:
1. Select a prompt
2. Open Copilot
3. Type `/suggest-targeting` and execute

**Pass Criteria**:
- [ ] Action recognized
- [ ] Returns suggested lenses with affinities
- [ ] Returns suggested primary stage
- [ ] Includes confidence score
- [ ] Reasoning based on salienceDimensions

### Test 5.4: TargetingInference Logic

**Goal**: Verify inference utility produces correct suggestions

```typescript
// In browser console or test file
import { inferTargetingFromSalience } from '@bedrock/consoles/PromptWorkshop/utils/TargetingInference';

const result = inferTargetingFromSalience(
  { technical: true, economic: true, philosophical: false, practical: false },
  "This explores the technical architecture of distributed systems"
);

console.log(result);
// Should suggest: Technical (0.8), Academic (0.9), stage: exploration
```

**Pass Criteria**:
- [ ] Returns lensAffinities array
- [ ] Returns suggestedStage
- [ ] Returns confidence (0.5-0.9)
- [ ] Technical salience → Technical/Academic lenses

---

## Epic 6: Title Transforms

### Test 6.1: TitleTransforms Utility Works

**Goal**: Verify title transformation functions

```typescript
// In browser console or test file
import { toQuestionFormat, toStatementFormat, makeCompelling } from '@core/utils/TitleTransforms';

console.log(toQuestionFormat("Observer Dynamic")); 
// → "What is the Observer Dynamic?"

console.log(toStatementFormat("How does Grove work?"));
// → "How Grove Works"

console.log(makeCompelling("Database Architecture"));
// → "Why Database Architecture Changes Everything"
```

**Pass Criteria**:
- [ ] toQuestionFormat adds "What is...?"
- [ ] toStatementFormat removes question marks, capitalizes
- [ ] makeCompelling adds hook/intrigue

### Test 6.2: /make-compelling Copilot Action

**Goal**: Verify copilot transforms title

**Steps**:
1. Select a prompt with plain title
2. Open Copilot
3. Type `/make-compelling` and execute
4. Check if title updated

**Pass Criteria**:
- [ ] Action recognized
- [ ] Shows before/after
- [ ] Offers to apply change
- [ ] Title updates in prompt if confirmed

---

## Integration Tests

### Test INT-1: Full Review Workflow

**Goal**: End-to-end prompt review flow

**Steps**:
1. Navigate to `/foundation/prompts`
2. Select prompt from ReviewQueue
3. View Source Context (expand section)
4. Run QA Check (button or /qa-check)
5. View QA Results
6. Check Targeting section
7. Press `A` to approve
8. Verify status changed

**Pass Criteria**:
- [ ] All sections load without error
- [ ] QA results populate
- [ ] Keyboard shortcut works
- [ ] Prompt status updates

### Test INT-2: Batch Review Workflow

**Goal**: Multi-prompt review flow

**Steps**:
1. Select 5 prompts (Shift+Click)
2. Verify BatchActions bar appears
3. Click "QA Check All"
4. Wait for all checks to complete
5. Click "Approve All"
6. Verify all statuses changed

**Pass Criteria**:
- [ ] Batch selection works
- [ ] Batch QA runs on all
- [ ] Batch approve updates all
- [ ] Progress indicator shown during batch ops

### Test INT-3: Copilot Integration

**Goal**: All copilot actions work together

**Steps**:
1. Select prompt
2. Run `/qa-check`
3. Run `/suggest-targeting`
4. Run `/make-compelling`
5. Verify all actions complete without error

**Pass Criteria**:
- [ ] All actions recognized
- [ ] No action breaks another
- [ ] Results persist correctly

---

## Error Handling Tests

### Test ERR-1: Missing Source Document

**Steps**:
1. Select prompt with no sourceDocIds
2. Check SourceContextSection

**Pass Criteria**:
- [ ] Shows "No source context" message
- [ ] No console errors
- [ ] No broken UI

### Test ERR-2: QA Check Fails

**Steps**:
1. Disconnect network or mock API failure
2. Click QA Check

**Pass Criteria**:
- [ ] Error message displayed
- [ ] UI doesn't break
- [ ] Can retry after reconnect

### Test ERR-3: Invalid Prompt ID

```bash
curl -X POST http://localhost:8080/api/prompts/invalid-uuid/qa-check
```

**Pass Criteria**:
- [ ] Returns 404 or 400
- [ ] Descriptive error message
- [ ] No server crash

---

## Test Execution Checklist

| Epic | Test | Status | Notes |
|------|------|--------|-------|
| 1 | 1.1 Schema Compiles | ⬜ | |
| 1 | 1.2 Schema Imports | ⬜ | |
| 2 | 2.1 useSourceContext | ⬜ | |
| 2 | 2.2 SourceContextSection | ⬜ | |
| 2 | 2.3 Context API | ⬜ | |
| 3 | 3.1 QAResultsSection | ⬜ | |
| 3 | 3.2 QA Button | ⬜ | |
| 3 | 3.3 QA API | ⬜ | |
| 3 | 3.4 /qa-check | ⬜ | |
| 4 | 4.1 usePromptSelection | ⬜ | |
| 4 | 4.2 BatchActions | ⬜ | |
| 4 | 4.3 Keyboard Shortcuts | ⬜ | |
| 4 | 4.4 Batch Approve/Reject | ⬜ | |
| 5 | 5.1 TargetingSection | ⬜ | |
| 5 | 5.2 Lens Matrix Data | ⬜ | |
| 5 | 5.3 /suggest-targeting | ⬜ | |
| 5 | 5.4 TargetingInference | ⬜ | |
| 6 | 6.1 TitleTransforms | ⬜ | |
| 6 | 6.2 /make-compelling | ⬜ | |
| INT | INT-1 Full Review | ⬜ | |
| INT | INT-2 Batch Review | ⬜ | |
| INT | INT-3 Copilot Integration | ⬜ | |
| ERR | ERR-1 Missing Source | ⬜ | |
| ERR | ERR-2 QA Fails | ⬜ | |
| ERR | ERR-3 Invalid ID | ⬜ | |

---

## Claude Code Execution Notes

When executing these tests:

1. **Start each epic fresh** - Clear browser cache between epics if needed
2. **Log failures immediately** - Note exact error messages
3. **Check both UI and Network** - Many issues show in DevTools before UI
4. **Verify data persistence** - Check Supabase after mutations
5. **Test with real data** - Use existing prompts, not empty state

Report format for each test:
```
Test X.Y: [PASS/FAIL]
- Expected: [what should happen]
- Actual: [what happened]
- Error (if any): [console/network error]
- Fix needed: [description or "none"]
```
