# EXECUTION_PROMPT: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Date:** January 10, 2026  
**Handoff:** Claude Desktop → Claude CLI

---

## Context

You are implementing provenance-preserving versioning for SystemPrompt objects in the Grove ExperiencesConsole. When a user edits the **active** system prompt and clicks "Save & Activate," the system should create a NEW database record (with new UUID) instead of mutating the existing one. The old version gets archived, maintaining a full history chain.

## Repository

```
C:\github\the-grove-foundation
```

## Key Files

Read these before making changes:

1. **Data Hook:** `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`
2. **Editor:** `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`
3. **Factory:** `src/bedrock/patterns/console-factory.tsx`
4. **Schema:** `src/core/schema/system-prompt.ts` (reference only, no changes)

## Sprint Documents

All planning artifacts are in:
```
docs/sprints/system-prompt-versioning-v1/
├── REPO_AUDIT.md      # Current state analysis
├── SPEC.md            # Requirements
├── ARCHITECTURE.md    # Design
├── DECISIONS.md       # Key choices made
├── MIGRATION_MAP.md   # Exact changes needed
├── SPRINTS.md         # Task breakdown
└── EXECUTION_PROMPT.md  # This file
```

---

## Implementation Tasks

### Epic 1: Data Hook Extension

**File:** `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`

**Task 1.1:** Add `saveAndActivate` function after the `duplicate` function (around line 165):

```typescript
/**
 * Save changes to active prompt as a new version.
 * Creates new record with incremented version, archives old.
 * Only valid for prompts with status: 'active'.
 */
const saveAndActivate = useCallback(async (
  currentPrompt: SystemPrompt,
  pendingChanges: Partial<SystemPromptPayload>,
  userId?: string | null
): Promise<SystemPrompt> => {
  // Validate: only active prompts can use this flow
  if (currentPrompt.meta.status !== 'active') {
    throw new Error('saveAndActivate only valid for active prompts');
  }

  // Build new payload with version increment and provenance
  const newPayload: SystemPromptPayload = {
    ...currentPrompt.payload,
    ...pendingChanges,
    version: currentPrompt.payload.version + 1,
    previousVersionId: currentPrompt.meta.id,
    updatedByUserId: userId ?? currentPrompt.payload.updatedByUserId,
    createdByUserId: userId ?? currentPrompt.payload.createdByUserId,
  };

  // Build new object with fresh UUID
  const now = new Date().toISOString();
  const newPrompt: SystemPrompt = {
    meta: {
      ...currentPrompt.meta,
      id: crypto.randomUUID(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
    payload: newPayload,
  };

  console.log('[ExperienceData] Creating new version:', {
    oldId: currentPrompt.meta.id,
    newId: newPrompt.meta.id,
    version: newPayload.version,
  });

  // Step 1: Create new active record
  const created = await create(newPrompt);

  // Step 2: Archive old record (only after create succeeds)
  await update(currentPrompt.meta.id, [
    { op: 'replace', path: '/meta/status', value: 'archived' },
    { op: 'replace', path: '/meta/updatedAt', value: now },
  ]);

  console.log('[ExperienceData] Archived old version:', currentPrompt.meta.id);

  // Step 3: Invalidate server cache
  try {
    await fetch('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'system-prompt' }),
    });
    console.log('[ExperienceData] Cache invalidated');
  } catch (e) {
    console.warn('[ExperienceData] Cache invalidation failed:', e);
  }

  // Step 4: Refetch to update UI state
  await refetch();

  return created;
}, [create, update, refetch]);
```

**Task 1.2:** Update the return object to include `saveAndActivate`:

```typescript
return {
  // ... existing exports ...
  duplicate,
  saveAndActivate,  // ADD THIS LINE
  refetch,
};
```

---

### Epic 2: Editor Integration

**File:** `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`

**Task 2.1:** Update the props interface to accept `saveAndActivate`:

```typescript
interface SystemPromptEditorProps {
  prompt: SystemPrompt;
  onEdit: (patches: PatchOperation[]) => void;
  onSave: () => void;
  onDiscard: () => void;
  hasChanges: boolean;
  saveAndActivate?: (
    currentPrompt: SystemPrompt,
    pendingChanges: Partial<SystemPromptPayload>,
    userId?: string | null
  ) => Promise<SystemPrompt>;
}
```

**Task 2.2:** Add state to track modified fields (after existing useState calls):

```typescript
// Track which payload fields have been modified for version creation
const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
```

**Task 2.3:** Update the field change handler to track modifications:

Find the existing `handleFieldChange` or equivalent function and add tracking:

```typescript
const handleFieldChange = useCallback((path: string, value: unknown) => {
  // Track modified field for version creation
  if (path.startsWith('/payload/')) {
    const fieldName = path.replace('/payload/', '');
    setModifiedFields(prev => new Set(prev).add(fieldName));
  }
  
  // Existing patch logic
  onEdit([{ op: 'replace', path, value }]);
}, [onEdit]);
```

**Task 2.4:** Replace or update the save handler for active prompts:

```typescript
const handleSaveAndActivate = useCallback(async () => {
  const isActive = prompt.meta.status === 'active';
  
  if (isActive && saveAndActivate && modifiedFields.size > 0) {
    // Active prompt with changes: create new version
    const pendingChanges: Partial<SystemPromptPayload> = {};
    
    // Extract current values for modified fields
    modifiedFields.forEach(fieldName => {
      const key = fieldName as keyof SystemPromptPayload;
      if (key in prompt.payload) {
        (pendingChanges as Record<string, unknown>)[key] = prompt.payload[key];
      }
    });
    
    console.log('[SystemPromptEditor] Creating version with changes:', 
      Object.keys(pendingChanges));
    
    try {
      await saveAndActivate(prompt, pendingChanges);
      setModifiedFields(new Set()); // Reset tracking
    } catch (error) {
      console.error('[SystemPromptEditor] Save and activate failed:', error);
    }
  } else {
    // Draft/archived or no saveAndActivate: use regular save
    onSave();
    
    // Cache invalidation for active prompt (fallback path)
    if (isActive) {
      try {
        await fetch('/api/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'system-prompt' }),
        });
      } catch (e) {
        console.warn('[SystemPromptEditor] Cache invalidation failed:', e);
      }
    }
  }
}, [prompt, saveAndActivate, modifiedFields, onSave]);
```

**Task 2.5:** Update button to use new handler:

Find the "Save & Activate" button for active prompts and update its onClick:

```tsx
onClick={handleSaveAndActivate}
```

**Task 2.6:** Reset tracking on discard:

Update the discard handler:

```typescript
const handleDiscard = useCallback(() => {
  setModifiedFields(new Set()); // Reset modification tracking
  onDiscard();
}, [onDiscard]);
```

---

### Epic 3: Factory Connection

**File:** `src/bedrock/patterns/console-factory.tsx`

**Task 3.1:** Locate where EditorComponent receives its props (around line 400-450).

**Task 3.2:** Add `saveAndActivate` to the props passed to the editor:

Look for the pattern where props are spread to EditorComponent. Add:

```typescript
saveAndActivate={dataHook.saveAndActivate}
```

This may look something like:

```tsx
<EditorComponent
  {...existingProps}
  saveAndActivate={saveAndActivate}
/>
```

Or if props are destructured from the data hook, ensure `saveAndActivate` is included.

---

## Verification Steps

After implementation:

1. **Build Check:**
   ```bash
   npm run build
   ```
   Must pass without errors.

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```

3. **Navigate to Console:**
   Open `http://localhost:8080/bedrock/experiences`

4. **Test Version Creation:**
   - Select the active prompt
   - Edit the "Identity" field (add some test text)
   - Click "Save & Activate"
   - Check console for log messages
   - Verify new UUID appears in inspector

5. **Verify Database:**
   Open Supabase and run:
   ```sql
   SELECT id, meta->>'status' as status, payload->>'version' as version
   FROM system_prompts
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   Should show new active record and old archived record.

6. **Verify Provenance:**
   ```sql
   SELECT id, payload->>'previousVersionId' as prev_id
   FROM system_prompts
   WHERE meta->>'status' = 'active';
   ```
   Should show the new record pointing to old record's ID.

7. **Test /explore:**
   Navigate to `http://localhost:8080/explore`
   Send a test message. The AI should reflect the new prompt.

---

## Anti-Patterns to Avoid

1. **DO NOT** modify Terminal, Foundation, or Genesis code
2. **DO NOT** change the Supabase schema
3. **DO NOT** modify server.js cache logic
4. **DO NOT** break existing draft/archive workflows
5. **DO NOT** use hardcoded UUIDs - always generate fresh

## Patterns to Follow

1. **DO** use existing `create()` and `update()` from the hook
2. **DO** use `crypto.randomUUID()` for new IDs
3. **DO** follow the create-then-archive order
4. **DO** invalidate cache after changes
5. **DO** add console.log statements for debugging

---

## Rollback

If issues arise, revert these files:
- `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`
- `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`
- `src/bedrock/patterns/console-factory.tsx`

All changes are additive; reverting restores original mutation behavior.

---

## Success Criteria

- [ ] Build passes
- [ ] "Save & Activate" on active prompt creates new record
- [ ] New record has incremented version number
- [ ] New record has previousVersionId pointing to old record
- [ ] Old record status changes to 'archived'
- [ ] Only ONE active record exists after operation
- [ ] UI updates to show new record
- [ ] /explore uses new prompt content

---

*Execution prompt complete. Ready for Claude CLI handoff.*
