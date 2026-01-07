# HOTFIX: Library Prompt Duplicate Action

> **Priority**: P1
> **Scope**: Single feature addition
> **Estimated**: 30 min

---

## Problem

QAResultsSection shows "Duplicate this prompt to run QA validation" for library prompts, but "Duplicate" is not a clickable action.

## Solution

Add a "Duplicate to My Prompts" button that:
1. Copies library prompt payload to a new user prompt in Supabase
2. Generates a new UUID
3. Sets `provenance.duplicatedFrom` to original library prompt slug
4. Navigates to the new prompt in the editor

---

## Implementation

### 1. Add Duplicate Handler to PromptEditor.tsx

```typescript
// In PromptEditor.tsx

const handleDuplicateLibraryPrompt = async () => {
  if (!selectedPrompt) return;
  
  try {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          ...selectedPrompt.payload,
          provenance: {
            ...selectedPrompt.payload.provenance,
            duplicatedFrom: selectedPrompt.meta.id,
            duplicatedAt: new Date().toISOString(),
          }
        },
        meta: {
          title: `${selectedPrompt.meta.title} (Copy)`,
          status: 'draft',
        }
      })
    });
    
    if (!response.ok) throw new Error('Failed to duplicate');
    
    const newPrompt = await response.json();
    // Navigate to new prompt or refresh list
    onSelectPrompt?.(newPrompt.id);
    
  } catch (error) {
    console.error('Duplicate failed:', error);
  }
};
```

### 2. Update QAResultsSection.tsx

```diff
// In QAResultsSection.tsx - where library message is shown

interface QAResultsSectionProps {
  prompt: GroveObject<PromptPayload>;
  onRunQACheck?: () => void;
  onFixIssue?: (issue: QAIssue) => void;
  isLoading?: boolean;
+ onDuplicate?: () => void;
+ isLibraryPrompt?: boolean;
}

// In the library prompt message section:
- <p className="text-sm text-slate-500">
-   QA checks are not available for library prompts. 
-   Duplicate this prompt to run QA validation.
- </p>
+ <div className="space-y-3">
+   <p className="text-sm text-slate-500">
+     QA checks are not available for library prompts.
+   </p>
+   {onDuplicate && (
+     <button
+       onClick={onDuplicate}
+       className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
+     >
+       <span className="material-symbols-outlined text-base">content_copy</span>
+       Duplicate to My Prompts
+     </button>
+   )}
+ </div>
```

### 3. Wire Up in PromptEditor.tsx

```diff
// Where QAResultsSection is rendered:

<QAResultsSection
  prompt={selectedPrompt}
  onRunQACheck={isLibraryPrompt ? undefined : handleRunQACheck}
  onFixIssue={handleFixIssue}
  isLoading={qaLoading}
+ onDuplicate={isLibraryPrompt ? handleDuplicateLibraryPrompt : undefined}
+ isLibraryPrompt={isLibraryPrompt}
/>
```

### 4. Verify POST /api/prompts Endpoint Exists

Check `server.js` for a POST handler that creates prompts. If missing, add:

```javascript
// In server.js

app.post('/api/prompts', async (req, res) => {
  try {
    const { payload, meta } = req.body;
    
    const newPrompt = {
      id: crypto.randomUUID(),
      meta: {
        ...meta,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      payload,
    };
    
    const { data, error } = await supabaseAdmin
      .from('prompts')
      .insert(newPrompt)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json(data);
  } catch (error) {
    console.error('Create prompt failed:', error);
    return res.status(500).json({ error: 'Failed to create prompt' });
  }
});
```

---

## Test

1. Navigate to `/foundation/prompts`
2. Select a library prompt (slug ID)
3. In QAResultsSection, click "Duplicate to My Prompts"
4. Verify new prompt created with UUID
5. Verify new prompt selected in editor
6. Run QA check on new prompt - should work

---

## Files to Modify

| File | Change |
|------|--------|
| `src/bedrock/consoles/PromptWorkshop/components/QAResultsSection.tsx` | Add onDuplicate prop, render button |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Add handleDuplicateLibraryPrompt, pass prop |
| `server.js` | Add POST /api/prompts if missing |

---

## Success Criteria

- [ ] "Duplicate to My Prompts" button visible for library prompts
- [ ] Click creates new prompt in Supabase
- [ ] New prompt has UUID (not slug)
- [ ] New prompt has `provenance.duplicatedFrom` set
- [ ] Editor navigates to new prompt
- [ ] QA check works on duplicated prompt
