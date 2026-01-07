# MIGRATION_MAP.md - prompt-refinement-v1

> **Sprint**: prompt-refinement-v1
> **Created**: 2026-01-06

---

## File Change Matrix

### Legend
- ✨ CREATE - New file
- 📝 MODIFY - Existing file changes
- ✅ VERIFY - Check existing functionality
- 🗑️ DELETE - Remove file (none this sprint)

---

## 1. Schema Layer

| Status | File | Changes |
|--------|------|---------|
| 📝 | `src/core/schema/prompt.ts` | Add `userIntent`, `conceptAngle`, `suggestedFollowups`, `qaScore`, `qaLastChecked`, `qaIssues` to PromptPayload |
| ✅ | `src/core/schema/grove-object.ts` | Verify GroveObjectMeta unchanged |
| ✅ | `src/core/context-fields/types.ts` | Verify PromptProvenance has needed fields |

### prompt.ts Changes

```diff
// src/core/schema/prompt.ts

export interface PromptPayload {
  executionPrompt: string;
  systemContext?: string;
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: PromptTargeting;
  baseWeight: number;
  sequences?: PromptSequence[];
  stats: PromptStats;
  source: PromptSource;
  generatedFrom?: PromptGenerationContext;
  cooldownMs?: number;
  maxShows?: number;
  wizardConfig?: WizardStepConfig;
  provenance?: PromptProvenance;
  surfaces?: PromptSurface[];
  highlightTriggers?: HighlightTrigger[];
  salienceDimensions?: ('technical' | 'economic' | 'philosophical' | 'practical')[];
  interestingBecause?: string;
+ 
+ // === Sprint: prompt-refinement-v1 - Structured Execution ===
+ /** What the user implicitly wants to learn */
+ userIntent?: string;
+ /** How to frame the response (derived from interestingBecause) */
+ conceptAngle?: string;
+ /** Optional follow-up exploration questions */
+ suggestedFollowups?: string[];
+ 
+ // === Sprint: prompt-refinement-v1 - QA Metadata ===
+ /** Last QA check score (0-100) */
+ qaScore?: number;
+ /** ISO timestamp of last QA check */
+ qaLastChecked?: string;
+ /** Issues identified by QA check */
+ qaIssues?: QAIssue[];
}

+ export interface QAIssue {
+   type: 'missing_context' | 'ambiguous_intent' | 'too_broad' | 'too_narrow' | 'source_mismatch';
+   description: string;
+   suggestedFix: string;
+   autoFixAvailable: boolean;
+   severity: 'error' | 'warning' | 'info';
+ }
```

---

## 2. PromptWorkshop Console

### 2.1 New Files

| Status | File | Purpose |
|--------|------|---------|
| ✨ | `src/bedrock/consoles/PromptWorkshop/hooks/usePromptSelection.ts` | Selection state management |
| ✨ | `src/bedrock/consoles/PromptWorkshop/hooks/useSourceContext.ts` | Source document fetching |
| ✨ | `src/bedrock/consoles/PromptWorkshop/hooks/useQACheck.ts` | QA action wrapper |
| ✨ | `src/bedrock/consoles/PromptWorkshop/components/SourceContextSection.tsx` | Collapsible source display |
| ✨ | `src/bedrock/consoles/PromptWorkshop/components/QAResultsSection.tsx` | QA issues display |
| ✨ | `src/bedrock/consoles/PromptWorkshop/components/BatchActions.tsx` | Batch action bar |
| ✨ | `src/bedrock/consoles/PromptWorkshop/components/TargetingSection.tsx` | Lens compatibility matrix |
| ✨ | `src/bedrock/consoles/PromptWorkshop/utils/TitleTransforms.ts` | Title transformation logic |
| ✨ | `src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts` | Stage/lens inference logic |
| ✨ | `src/bedrock/consoles/PromptWorkshop/PromptQAActions.ts` | QA-specific copilot actions |

### 2.2 Modified Files

| Status | File | Changes |
|--------|------|---------|
| 📝 | `src/bedrock/consoles/PromptWorkshop/index.tsx` | Add batch actions to ModuleShell |
| 📝 | `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Add SourceContextSection, QAResultsSection |
| 📝 | `src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx` | Add keyboard shortcuts, selection |
| 📝 | `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts` | Register QA actions |
| 📝 | `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | Add source context fetching |

### 2.3 Detailed Changes

#### index.tsx

```diff
// src/bedrock/consoles/PromptWorkshop/index.tsx

+ import { usePromptSelection } from './hooks/usePromptSelection';
+ import { BatchActions } from './components/BatchActions';

export function PromptWorkshop() {
+ const selection = usePromptSelection();
  
  return (
    <ModuleShell
      title="Prompt Workshop"
+     contextualFeatures={
+       <BatchActions
+         selectedCount={selection.selectedCount}
+         onApproveAll={handleBatchApprove}
+         onRejectAll={handleBatchReject}
+         onQACheckAll={handleBatchQACheck}
+         onClearSelection={selection.clearSelection}
+       />
+     }
    >
      {/* ... */}
    </ModuleShell>
  );
}
```

#### PromptEditor.tsx

```diff
// src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx

+ import { SourceContextSection } from './components/SourceContextSection';
+ import { QAResultsSection } from './components/QAResultsSection';

export function PromptEditor({ prompt, onSave, readOnly }: Props) {
  return (
    <div className="flex flex-col h-full">
+     {/* Source Context - NEW SECTION at top */}
+     <SourceContextSection
+       promptId={prompt.meta.id}
+       documentId={prompt.payload.provenance?.sourceDocIds?.[0]}
+     />
      
      {/* Identity Section - existing */}
      <InspectorSection title="Identity" defaultOpen>
        {/* ... */}
      </InspectorSection>
      
      {/* Execution Prompt Section - existing */}
      <InspectorSection title="Execution Prompt" defaultOpen>
        {/* ... */}
      </InspectorSection>
      
+     {/* QA Results - NEW SECTION */}
+     {prompt.payload.qaScore !== undefined && (
+       <QAResultsSection
+         score={prompt.payload.qaScore}
+         issues={prompt.payload.qaIssues}
+         lastChecked={prompt.payload.qaLastChecked}
+       />
+     )}
      
      {/* ... other sections ... */}
      
      {/* Footer with actions */}
      <div className="flex gap-2 p-4 border-t">
        <Button onClick={handleApprove} variant="success">Approve</Button>
        <Button onClick={handleReject} variant="danger">Reject</Button>
+       <Button onClick={handleQACheck} variant="secondary">QA Check</Button>
+       <Button onClick={handleMakeCompelling} variant="ghost">Make Compelling</Button>
      </div>
    </div>
  );
}
```

#### ReviewQueue.tsx

```diff
// src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx

+ import { usePromptSelection } from './hooks/usePromptSelection';

export function ReviewQueue({ prompts, onSelect, onApprove, onReject }: Props) {
+ const selection = usePromptSelection();
  
+ // Keyboard shortcuts
+ useEffect(() => {
+   const handleKeyDown = (e: KeyboardEvent) => {
+     if (e.target instanceof HTMLInputElement) return;
+     
+     switch (e.key.toLowerCase()) {
+       case 'a':
+         if (selection.selectedCount > 0) {
+           handleBatchApprove();
+         }
+         break;
+       case 'r':
+         if (selection.selectedCount > 0) {
+           handleBatchReject();
+         }
+         break;
+       case 'e':
+         if (selection.selectedCount === 1) {
+           onSelect(Array.from(selection.selectedIds)[0]);
+         }
+         break;
+     }
+   };
+   
+   window.addEventListener('keydown', handleKeyDown);
+   return () => window.removeEventListener('keydown', handleKeyDown);
+ }, [selection]);

  return (
    <div className="space-y-2">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.meta.id}
          prompt={prompt}
-         onClick={() => onSelect(prompt.meta.id)}
+         onClick={(e) => {
+           if (e.shiftKey) {
+             selection.select(prompt.meta.id, { shift: true });
+           } else {
+             onSelect(prompt.meta.id);
+           }
+         }}
+         selected={selection.isSelected(prompt.meta.id)}
          onApprove={() => onApprove(prompt.meta.id)}
          onReject={() => onReject(prompt.meta.id)}
        />
      ))}
    </div>
  );
}
```

---

## 3. API Layer

> **NOTE**: This project uses **Vite + Express** (server.js), NOT Next.js.
> All API routes are defined in `server.js`, not `pages/api/`.

| Status | File | Purpose |
|--------|------|---------|
| 📝 | `server.js` | Add QA check and source context endpoints |
| ✨ | `lib/prompts/qa.js` | QA check logic |
| ✨ | `lib/documents/context.js` | Source context retrieval |

### New Routes in server.js

```javascript
// Add to server.js

// --- Prompt QA API ---

// POST /api/prompts/:id/qa - Run QA check on a prompt
app.post('/api/prompts/:id/qa', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch prompt from Supabase
    const { data: prompt, error } = await supabaseAdmin
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // Get source context if available
    const sourceDocId = prompt.payload?.provenance?.sourceDocIds?.[0];
    const sourceContext = sourceDocId 
      ? await getSourceContext(sourceDocId, id)
      : undefined;
    
    // Run QA check
    const result = await runQACheck(prompt, sourceContext, genai);
    
    // Update prompt with QA results
    await supabaseAdmin
      .from('prompts')
      .update({
        payload: {
          ...prompt.payload,
          qaScore: result.score,
          qaLastChecked: new Date().toISOString(),
          qaIssues: result.issues,
        }
      })
      .eq('id', id);
    
    return res.json(result);
  } catch (error) {
    console.error('QA check failed:', error);
    return res.status(500).json({ error: 'QA check failed' });
  }
});

// GET /api/documents/:id/context - Get source context for extraction
app.get('/api/documents/:id/context', async (req, res) => {
  try {
    const { id } = req.params;
    const { promptId } = req.query;
    
    const context = await getSourceContext(id, promptId);
    if (!context) {
      return res.status(404).json({ error: 'Source context not found' });
    }
    
    return res.json(context);
  } catch (error) {
    console.error('Failed to get source context:', error);
    return res.status(500).json({ error: 'Failed to get source context' });
  }
});
```

---

## 4. Library Layer

| Status | File | Purpose |
|--------|------|---------|
| ✨ | `lib/prompts/qa.ts` | QA check logic |
| ✨ | `lib/documents/context.ts` | Source context retrieval |
| 📝 | `lib/knowledge/extractionPrompt.ts` | Add title style options |
| 📝 | `lib/knowledge/extractConcepts.ts` | Generate structured execution prompt |

### lib/prompts/qa.ts

```typescript
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload, QAIssue } from '@core/schema/prompt';

interface SourceContext {
  id: string;
  title: string;
  extractedPassage: string;
  fullContext?: string;
}

interface QACheckResult {
  score: number;
  issues: QAIssue[];
  suggestions: string[];
  predictedResponseQuality: 'high' | 'medium' | 'low';
}

export async function runQACheck(
  prompt: GroveObject<PromptPayload>,
  sourceContext?: SourceContext
): Promise<QACheckResult> {
  const assessmentPrompt = buildAssessmentPrompt(prompt, sourceContext);
  
  // Call LLM for assessment
  const response = await callGemini(assessmentPrompt);
  
  // Parse response into structured result
  return parseQAResponse(response);
}

function buildAssessmentPrompt(
  prompt: GroveObject<PromptPayload>,
  sourceContext?: SourceContext
): string {
  return `
You are a prompt engineering expert. Assess the quality of this exploration prompt.

## Prompt
Title: ${prompt.meta.title}
Execution Prompt: ${prompt.payload.executionPrompt}
${prompt.payload.userIntent ? `User Intent: ${prompt.payload.userIntent}` : ''}
${prompt.payload.conceptAngle ? `Concept Angle: ${prompt.payload.conceptAngle}` : ''}

${sourceContext ? `
## Source Context
Document: ${sourceContext.title}
Extracted Passage: ${sourceContext.extractedPassage}
` : ''}

## Assessment Criteria
1. Clarity: Is the user intent clear?
2. Completeness: Does the execution prompt have enough context?
3. Specificity: Is it specific enough to generate a focused response?
4. Source Alignment: Does it accurately reflect the source material?

## Output Format (JSON)
{
  "score": 0-100,
  "issues": [
    {
      "type": "missing_context" | "ambiguous_intent" | "too_broad" | "too_narrow" | "source_mismatch",
      "description": "...",
      "suggestedFix": "...",
      "autoFixAvailable": true/false,
      "severity": "error" | "warning" | "info"
    }
  ],
  "suggestions": ["..."],
  "predictedResponseQuality": "high" | "medium" | "low"
}
`;
}
```

---

## 5. Test Files

| Status | File | Purpose |
|--------|------|---------|
| ✨ | `tests/e2e/prompt-workshop.spec.ts` | E2E tests for prompt refinement |
| ✨ | `tests/unit/TitleTransforms.test.ts` | Title transformation unit tests |
| ✨ | `tests/unit/PromptQAActions.test.ts` | QA action unit tests |
| ✨ | `tests/unit/usePromptSelection.test.ts` | Selection hook tests |
| ✨ | `tests/integration/prompt-qa-api.test.ts` | QA endpoint integration |

---

## 6. Execution Order

### Phase 1: Foundation (Day 1 AM)
1. [ ] `src/core/schema/prompt.ts` - Add new fields
2. [ ] `src/bedrock/consoles/PromptWorkshop/hooks/usePromptSelection.ts`
3. [ ] `src/bedrock/consoles/PromptWorkshop/hooks/useSourceContext.ts`

### Phase 2: UI Components (Day 1 PM)
4. [ ] `src/bedrock/consoles/PromptWorkshop/components/SourceContextSection.tsx`
5. [ ] `src/bedrock/consoles/PromptWorkshop/components/QAResultsSection.tsx`
6. [ ] `src/bedrock/consoles/PromptWorkshop/components/BatchActions.tsx`

### Phase 3: Integration (Day 2 AM)
7. [ ] `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` - Add sections
8. [ ] `src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx` - Add selection/shortcuts
9. [ ] `src/bedrock/consoles/PromptWorkshop/index.tsx` - Wire up batch actions

### Phase 4: API & QA (Day 2 PM)
10. [ ] `pages/api/documents/[id]/context.ts`
11. [ ] `lib/prompts/qa.ts`
12. [ ] `pages/api/prompts/[id]/qa.ts`
13. [ ] `src/bedrock/consoles/PromptWorkshop/PromptQAActions.ts`

### Phase 5: Title Transforms (Day 3 AM)
14. [ ] `src/bedrock/consoles/PromptWorkshop/utils/TitleTransforms.ts`
15. [ ] `lib/knowledge/extractionPrompt.ts` - Update for structured output

### Phase 6: Testing (Day 3 PM)
16. [ ] `tests/e2e/prompt-workshop.spec.ts`
17. [ ] `tests/unit/TitleTransforms.test.ts`
18. [ ] `tests/unit/usePromptSelection.test.ts`
19. [ ] Verify all tests pass

---

## 7. Rollback Plan

If issues arise:

1. **Schema changes**: New fields are optional, existing prompts unaffected
2. **UI components**: Feature-flagged, can disable without code rollback
3. **API endpoints**: Independent, can be removed without affecting existing endpoints
4. **QA actions**: Registered via config, can be disabled without code changes

No database migrations required - all changes are JSONB payload extensions.
