# REPO_AUDIT: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Date:** January 10, 2026  
**Auditor:** Claude (Foundation Loop Phase 1)

---

## 1. Scope Definition

### Target Functionality
Implement provenance-preserving versioning for SystemPrompt objects in the ExperiencesConsole. When editing and saving an active prompt, the system should create a NEW record (new UUID) while archiving the previous active version.

### Files in Scope

| File | Purpose | Change Type |
|------|---------|-------------|
| `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts` | Data hook with activation/versioning logic | MODIFY |
| `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx` | Editor UI with Save & Activate flow | MODIFY |
| `src/bedrock/consoles/ExperiencesConsole/index.ts` | Console export (may need re-export) | VERIFY |

### Files Explicitly Out of Scope

| File | Reason |
|------|--------|
| `src/terminal/*` | Terminal is off-limits (VIP production) |
| `src/foundation/*` | Foundation is off-limits (legacy) |
| `src/genesis/*` | Genesis is off-limits (legacy) |
| `server.js` | Server-side cache already works; no changes needed |
| `src/core/schema/system-prompt.ts` | Schema already has version, previousVersionId, changelog |

---

## 2. Current State Analysis

### useExperienceData.ts (232 lines)

**Current Capabilities:**
- `create()`: Creates new object with generated UUID
- `update()`: Patches existing object in place (mutates)
- `activate()`: Archives current active, activates selected (mutates both)
- `createVersion()`: Creates new draft from source (appends, doesn't activate)
- `duplicate()`: Creates copy with reset version

**Gap Identified:**
The `activate()` function operates on EXISTING records via mutation:
```typescript
// Current behavior (WRONG for provenance):
activate(id) {
  // 1. Archives old active (mutation)
  await update(oldId, [{ op: 'replace', path: '/meta/status', value: 'archived' }]);
  // 2. Activates selected (mutation)  
  await update(id, [{ op: 'replace', path: '/meta/status', value: 'active' }]);
}
```

**Required Behavior:**
"Save & Activate" on the ACTIVE prompt should:
1. Create NEW record with new UUID
2. Set `previousVersionId` to old ID
3. Increment `version` number
4. Archive old record
5. New record starts as `active`

### SystemPromptEditor.tsx (637 lines)

**Current Capabilities:**
- Displays active/draft/archived status banners
- Shows "Save & Activate" button when editing active prompt
- Has `handleSaveWithCache()` that calls `onSave()` + cache invalidation
- Has `handleDiscard()` to restore original state

**Gap Identified:**
The "Save & Activate" button currently:
1. Calls `onSave()` → parent saves patches to SAME record (mutation)
2. Calls cache invalidation

**Required Behavior:**
"Save & Activate" on active prompt should:
1. Call new `saveAndActivate()` function in data hook
2. That function creates new record + archives old
3. UI updates to show new record (same content, new UUID)

### Console Factory (console-factory.tsx)

**Relevant Section:**
Lines 97-105 show how `handleEdit` works:
```typescript
const handleEdit = useCallback(async (operations: PatchOperation[]) => {
  if (!selectedObject) return;
  patchHistory.applyPatch(operations, selectedObject, 'user');
  await update(selectedObject.meta.id, operations);
  setHasChanges(true);
}, [selectedObject, patchHistory, update]);
```

This is the standard flow - edits call `update()` which mutates in place.

For our new flow, when the active prompt is edited and saved, we need to intercept and create a NEW record instead.

---

## 3. Existing Patterns Extended

| Requirement | Pattern | Extension |
|-------------|---------|-----------|
| Provenance tracking | Pattern 7 (Object Model) | Add `previousVersionId` chain traversal |
| Versioning | Pattern 7 (Object Model) | `version` field already exists |
| Status transitions | `useExperienceData.activate()` | Extend for save-and-activate flow |
| Cache invalidation | `server.js /api/cache/invalidate` | Reuse existing endpoint |

---

## 4. Schema Verification

**SystemPromptPayload** (from `src/core/schema/system-prompt.ts`):
```typescript
// Already has all required versioning fields:
version: number;                // ✓ Exists
changelog?: string;             // ✓ Exists
previousVersionId?: string;     // ✓ Exists
createdByUserId?: string | null; // ✓ Exists
updatedByUserId?: string | null; // ✓ Exists
```

**GroveObjectMeta** (from `src/core/schema/grove-object.ts`):
```typescript
status: 'active' | 'draft' | 'archived';  // ✓ Exists
createdAt: string;  // ✓ Exists
updatedAt: string;  // ✓ Exists
```

No schema changes required.

---

## 5. Data Flow Diagram

### Current Flow (Mutation-based)
```
User edits active prompt
    ↓
handleEdit() → onEdit([patches])
    ↓
Parent calls update(sameId, patches)  ← MUTATION
    ↓
"Save & Activate" → handleSaveWithCache()
    ↓
onSave() → setHasChanges(false)
    ↓
invalidateCache()
```

### Target Flow (Append-based)
```
User edits active prompt
    ↓
handleEdit() → onEdit([patches])  
    ↓
Local state tracks pending changes (no DB write yet)
    ↓
"Save & Activate" → saveAndActivate(editedContent)
    ↓
Creates NEW record {
  id: newUUID,
  version: old.version + 1,
  previousVersionId: oldId,
  status: 'active',
  ...editedContent
}
    ↓
Archives OLD record { status: 'archived' }
    ↓
invalidateCache()
    ↓
UI refreshes to show new record (new UUID, same content)
```

---

## 6. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing draft/archive flows | High | Only change active prompt save flow |
| Console factory expects update() | Medium | Add saveAndActivate() to hook, call from Editor |
| UI doesn't update after version | Medium | Trigger refetch after create |
| Stale closure on callbacks | Low | Use refs pattern from factory |

---

## 7. Test Strategy

### Unit Tests Required
- `saveAndActivate()` creates new record with correct fields
- Old record gets archived
- Only ONE active at any time
- Version number increments
- previousVersionId links correctly

### Manual Verification
1. Navigate to `/bedrock/experiences`
2. Select active prompt, edit identity field
3. Click "Save & Activate"
4. Verify in Supabase: NEW record exists
5. Verify in Supabase: OLD record status = 'archived'
6. Navigate to `/explore`, verify new prompt active
7. Reload `/bedrock/experiences`, verify counters correct

---

## 8. Dependencies

**External:**
- Supabase `system_prompts` table (exists, no changes)
- Server-side cache invalidation endpoint (exists, no changes)

**Internal:**
- `useGroveData` hook (via `groveData.create`, `groveData.update`)
- `generateUUID()` utility (exists)

---

*Audit complete. Proceed to SPEC.md*
