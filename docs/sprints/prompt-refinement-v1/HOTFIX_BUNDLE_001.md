# HOTFIX_BUNDLE_001.md - Inspector Completeness

> **Priority**: P0
> **Scope**: Multiple related fixes
> **Context**: Inspector fields exist but aren't working properly

---

## Problem Summary

User reports:
1. No "Fix" button visible for QA issues
2. Prompts don't appear editable  
3. Target stages/lens IDs not being set
4. No versioning when editing
5. Structured execution prompt fields not populated

## Root Causes

1. **Fix buttons** require `autoFixAvailable: true` from Claude - often missing
2. **Library prompts** are read-only by design (correct behavior)
3. **User prompts** should be editable - verify source field is set correctly
4. **Versioning** not implemented
5. **Auto-population** of targeting from extraction not implemented

---

## Fix 1: Enforce autoFixAvailable in QA Response

**File**: `server.js` (around line 3655)

**Problem**: Claude returns `autoFixAvailable: false` or omits it entirely.

**Solution**: Post-process the response to set `autoFixAvailable: true` for fixable issue types.

```javascript
// After parsing result (around line 3660)
let result;
try {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
} catch (parseError) {
  console.error('[QA] Failed to parse response:', responseText);
  result = { score: 70, issues: [] };
}

// ADD THIS: Enforce autoFixAvailable for fixable issues
const FIXABLE_TYPES = ['missing_context', 'ambiguous_intent', 'too_broad'];
if (result.issues) {
  result.issues = result.issues.map(issue => ({
    ...issue,
    autoFixAvailable: FIXABLE_TYPES.includes(issue.type)
  }));
}
```

---

## Fix 2: Verify User Prompts Are Editable

**File**: `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Problem**: Need to confirm `isReadOnly` logic is correct.

**Current** (line ~38):
```typescript
const isLibraryPrompt = prompt.payload.source === 'library';
const isReadOnly = isLibraryPrompt || loading;
```

**Check**: When users create prompts via extraction, ensure `source` is set to `'extracted'` or `'authored'`, NOT `'library'`.

**Test**: 
1. Run QA on a user prompt
2. Check browser DevTools: `prompt.payload.source` should NOT be `'library'`
3. If it is, fix the extraction endpoint to set `source: 'extracted'`

---

## Fix 3: Add Edit Versioning

**File**: `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Problem**: Edits modify in place without tracking provenance.

**Solution**: Track edit history in payload.

### Schema Addition
```typescript
// Add to PromptPayload in src/core/schema/prompt.ts
editHistory?: {
  editedAt: string;
  editedBy?: string;
  previousVersion?: string; // ID of parent version
  changeType: 'title' | 'execution' | 'targeting' | 'full';
}[];
```

### Track Edits in onEdit Handler
```typescript
// Wrap existing patchPayload/patchMeta to track edits
const patchWithHistory = (field: string, value: unknown, changeType: string) => {
  const historyEntry = {
    editedAt: new Date().toISOString(),
    changeType,
    field,
  };
  
  const ops: PatchOperation[] = [
    { op: 'replace', path: `/payload/${field}`, value },
    { op: 'add', path: '/payload/editHistory/-', value: historyEntry },
  ];
  
  // Mark as authored if was extracted
  if (prompt.payload.source === 'extracted') {
    ops.push({ op: 'replace', path: '/payload/source', value: 'authored' });
  }
  
  onEdit(ops);
};
```

---

## Fix 4: Auto-Populate Targeting from Salience

**File**: `server.js` - extraction endpoint OR `lib/knowledge/extractConcepts.ts`

**Problem**: Extracted prompts don't have targeting fields populated.

**Solution**: Use `inferTargetingFromSalience` during extraction.

```javascript
// After extracting prompt, before saving
import { inferTargetingFromSalience } from './src/bedrock/consoles/PromptWorkshop/utils/TargetingInference';

// In extraction logic:
const targeting = inferTargetingFromSalience(
  extractedPrompt.salienceDimensions || {},
  extractedPrompt.interestingBecause || ''
);

const promptToSave = {
  ...extractedPrompt,
  payload: {
    ...extractedPrompt.payload,
    targeting: {
      stages: targeting.suggestedStages,
      lensIds: targeting.lensAffinities.map(l => l.lensId),
      minConfidence: targeting.confidence,
    }
  }
};
```

---

## Fix 5: Populate Structured Execution Fields

**File**: Server-side extraction prompt (wherever prompts are generated)

**Problem**: `userIntent`, `conceptAngle`, `suggestedFollowups` not populated.

**Solution**: Update extraction prompt to request these fields.

Add to extraction system prompt:
```
For each prompt extracted, also generate:
- userIntent: What the user implicitly wants to understand (1 sentence)
- conceptAngle: The specific angle/framing for this exploration (1 sentence)  
- suggestedFollowups: 2-3 natural follow-up questions

Return as JSON:
{
  "title": "...",
  "executionPrompt": "...",
  "userIntent": "...",
  "conceptAngle": "...",
  "suggestedFollowups": ["...", "..."]
}
```

---

## Verification Checklist

After applying fixes, verify:

- [ ] Select a user-created prompt (not library)
- [ ] Title, Description, Execution Prompt fields are editable
- [ ] Active toggle works (switches between active/draft)
- [ ] Target Stages buttons are clickable
- [ ] Lens IDs text input accepts values
- [ ] Run QA Check → Issues show "Fix" buttons
- [ ] Clicking "Fix" applies the change
- [ ] After editing, source changes to "authored" (if was "extracted")

---

## Files to Modify

| File | Changes |
|------|---------|
| `server.js` | Fix 1: Enforce autoFixAvailable |
| `src/core/schema/prompt.ts` | Fix 3: Add editHistory type |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Fix 3: Track edit history |
| Extraction endpoint | Fix 4: Auto-populate targeting |
| Extraction system prompt | Fix 5: Request structured fields |

---

## Fix 6: Source Filter Alignment

**File**: Filter component (likely in PromptWorkshop or shared filters)

**Problem**: Source filter dropdown shows `library | generated | user` but:
- Cards display "AI Generated" badge (should match `generated`)
- "Extracted" source exists but not in filter dropdown
- Inconsistent labeling between filter and display

**Solution**: Align filter options with actual source values in schema.

```typescript
// Source options should match PromptPayload.source values
const SOURCE_OPTIONS = [
  { value: 'library', label: 'Library' },
  { value: 'generated', label: 'AI Generated' },
  { value: 'extracted', label: 'Extracted' },
  { value: 'authored', label: 'User Authored' },
];
```

Also check `PROMPT_SOURCE_CONFIG` in `PromptWorkshop.config.ts` for consistency.

---

## Quick Win First

Start with **Fix 1** (autoFixAvailable enforcement) - it's a 5-line change that will immediately make Fix buttons appear.
