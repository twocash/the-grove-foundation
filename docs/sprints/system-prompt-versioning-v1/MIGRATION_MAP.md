# MIGRATION_MAP: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Date:** January 10, 2026

---

## 1. Files Modified

### Primary Changes

| File | Lines | Change Type | Description |
|------|-------|-------------|-------------|
| `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts` | ~232 | MODIFY | Add `saveAndActivate()` function |
| `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx` | ~637 | MODIFY | Update "Save & Activate" handler |

### Secondary Changes (Verification Only)

| File | Lines | Change Type | Description |
|------|-------|-------------|-------------|
| `src/bedrock/consoles/ExperiencesConsole/index.ts` | ~56 | VERIFY | Ensure exports include new function |

---

## 2. Change Details

### 2.1 useExperienceData.ts

**Location:** `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`

**Add after line ~165** (after `duplicate` function):

```typescript
/**
 * Save changes to active prompt as a new version.
 * Creates new record with incremented version, archives old.
 * Only valid for prompts with status: 'active'.
 * 
 * @param currentPrompt - The currently active prompt
 * @param pendingChanges - Fields to update in the new version
 * @param userId - Optional user ID for provenance tracking
 * @returns The newly created active prompt
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

  // Step 1: Create new active record
  const created = await create(newPrompt);

  // Step 2: Archive old record (only after create succeeds)
  await update(currentPrompt.meta.id, [
    { op: 'replace', path: '/meta/status', value: 'archived' },
    { op: 'replace', path: '/meta/updatedAt', value: now },
  ]);

  // Step 3: Invalidate server cache
  try {
    await fetch('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'system-prompt' }),
    });
  } catch (e) {
    console.warn('[ExperienceData] Cache invalidation failed:', e);
    // Non-critical - continue
  }

  // Step 4: Refetch to update UI state
  await refetch();

  return created;
}, [create, update, refetch]);
```

**Update return object** (around line ~220):

```typescript
return {
  // ... existing exports ...
  duplicate,
  saveAndActivate,  // ADD THIS
  refetch,
};
```

---

### 2.2 SystemPromptEditor.tsx

**Location:** `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`

**Update Props interface** (around line ~30):

```typescript
interface SystemPromptEditorProps {
  prompt: SystemPrompt;
  onEdit: (patches: PatchOperation[]) => void;
  onSave: () => void;
  onDiscard: () => void;
  hasChanges: boolean;
  saveAndActivate?: (  // ADD THIS
    currentPrompt: SystemPrompt,
    pendingChanges: Partial<SystemPromptPayload>,
    userId?: string | null
  ) => Promise<SystemPrompt>;
}
```

**Add state for tracking changes** (after existing state, around line ~60):

```typescript
// Track which payload fields have been modified
const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
```

**Update field change handler** (modify existing handleFieldChange, around line ~90):

```typescript
const handleFieldChange = useCallback((path: string, value: unknown) => {
  // Track modified field
  const fieldName = path.replace('/payload/', '');
  setModifiedFields(prev => new Set(prev).add(fieldName));
  
  // Existing patch logic
  onEdit([{ op: 'replace', path, value }]);
}, [onEdit]);
```

**Replace handleSaveWithCache** (around line ~130):

```typescript
const handleSaveAndActivate = useCallback(async () => {
  const isActive = prompt.meta.status === 'active';
  
  if (isActive && saveAndActivate) {
    // Active prompt: create new version
    // Extract only modified fields from current prompt state
    const pendingChanges: Partial<SystemPromptPayload> = {};
    
    // Get current values for modified fields
    modifiedFields.forEach(fieldName => {
      const key = fieldName as keyof SystemPromptPayload;
      if (key in prompt.payload) {
        (pendingChanges as Record<string, unknown>)[key] = prompt.payload[key];
      }
    });
    
    try {
      await saveAndActivate(prompt, pendingChanges);
      setModifiedFields(new Set()); // Reset tracking
    } catch (error) {
      console.error('[SystemPromptEditor] Save and activate failed:', error);
      // TODO: Show error toast
    }
  } else {
    // Draft/archived: use regular save (mutation)
    onSave();
    
    // Cache invalidation for active prompt edits
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

**Update button onClick** (around line ~200, in the JSX):

```tsx
{/* Replace existing Save & Activate button */}
{isActive && hasChanges && (
  <button
    onClick={handleSaveAndActivate}
    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
  >
    Save & Activate
  </button>
)}
```

**Reset modifiedFields on discard** (update handleDiscard):

```typescript
const handleDiscard = useCallback(() => {
  setModifiedFields(new Set()); // Reset tracking
  onDiscard();
}, [onDiscard]);
```

---

### 2.3 index.ts (Verification)

**Location:** `src/bedrock/consoles/ExperiencesConsole/index.ts`

No changes needed if using console-factory pattern. The `useExperienceData` hook is imported and its return value (including new `saveAndActivate`) flows through automatically.

**Verify** the hook is properly connected to the editor via the factory.

---

## 3. Integration Points

### Console Factory Connection

The console factory (`console-factory.tsx`) passes props to the editor component. Need to verify `saveAndActivate` reaches the editor.

**Option A: Direct prop drilling**
Factory receives `saveAndActivate` from hook, passes to EditorComponent.

**Option B: Hook in editor**
Editor calls `useExperienceData` directly (not recommended - breaks factory pattern).

**Recommended:** Option A - Add to factory's editor props.

**Update in console-factory.tsx** (around line ~400):

```typescript
// In the EditorComponent render:
<EditorComponent
  prompt={selectedObject}
  onEdit={handleEdit}
  onSave={handleSave}
  onDiscard={handleDiscard}
  hasChanges={hasChanges}
  saveAndActivate={dataHook.saveAndActivate}  // ADD THIS
/>
```

---

## 4. Rollback Plan

If issues arise:

1. **Revert useExperienceData.ts** - Remove `saveAndActivate` function
2. **Revert SystemPromptEditor.tsx** - Restore original `handleSaveWithCache`
3. **Revert console-factory.tsx** - Remove prop passing (if modified)

All changes are additive; existing functionality preserved if new code paths fail.

---

## 5. Verification Checklist

After implementation:

- [ ] Build succeeds (`npm run build`)
- [ ] Navigate to `/bedrock/experiences` loads
- [ ] Select active prompt - editor opens
- [ ] Edit identity field
- [ ] Click "Save & Activate"
- [ ] New UUID visible in inspector
- [ ] Version number incremented
- [ ] Old record archived (check Supabase)
- [ ] `/explore` uses new prompt
- [ ] Metrics update correctly

---

*Migration map complete. Proceed to SPRINTS.md*
