# ARCHITECTURE: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Date:** January 10, 2026

---

## 1. Architectural Context

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Grove Bedrock Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  Bedrock UI     │    │ Console Factory │    │  Data Layer     │         │
│  │  /experiences   │───▶│ ExperiencesConsole   │───▶│ useExperienceData │     │
│  └─────────────────┘    └─────────────────┘    └────────┬────────┘         │
│                                                          │                  │
│                                                          ▼                  │
│                                              ┌─────────────────────┐        │
│                                              │   GroveDataProvider │        │
│                                              │   (Supabase Adapter)│        │
│                                              └────────┬────────────┘        │
│                                                       │                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Supabase                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ system_prompts                                               │    │   │
│  │  │ ┌────────┬────────┬─────────┬───────────────────────────┐   │    │   │
│  │  │ │   id   │  meta  │ payload │ created_at | updated_at   │   │    │   │
│  │  │ └────────┴────────┴─────────┴───────────────────────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Change Scope

This sprint modifies the interaction between:
- **SystemPromptEditor** (UI layer) - calls new saveAndActivate
- **useExperienceData** (data hook) - implements saveAndActivate

No changes to:
- Console Factory pattern
- GroveDataProvider interface
- Supabase schema
- Server-side cache logic

---

## 2. Component Design

### 2.1 useExperienceData Hook Extension

**Current exports:**
```typescript
{
  prompts,           // All system prompts
  activePrompt,      // Currently active
  draftPrompts,      // Status = 'draft'
  archivedPrompts,   // Status = 'archived'
  loading, error,
  create,            // Create new
  update,            // Patch existing (mutation)
  remove,            // Delete
  activate,          // Switch active status
  createVersion,     // Fork to draft
  duplicate,         // Copy with reset
  refetch,           // Force reload
}
```

**New export:**
```typescript
{
  ...existing,
  saveAndActivate,   // NEW: Create version from active, archive old
}
```

### 2.2 saveAndActivate Implementation

```typescript
const saveAndActivate = useCallback(async (
  currentPrompt: SystemPrompt,
  pendingChanges: Partial<SystemPromptPayload>,
  userId?: string | null
): Promise<SystemPrompt> => {
  // 1. Build new version payload
  const newPayload: SystemPromptPayload = {
    ...currentPrompt.payload,
    ...pendingChanges,
    version: currentPrompt.payload.version + 1,
    previousVersionId: currentPrompt.meta.id,
    updatedByUserId: userId ?? currentPrompt.payload.updatedByUserId,
  };

  // 2. Build new object with fresh UUID
  const newPrompt: SystemPrompt = {
    meta: {
      ...currentPrompt.meta,
      id: generateUUID(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: newPayload,
  };

  // 3. Create new record (atomic)
  const created = await groveData.create('system-prompt', newPrompt);

  // 4. Archive old record (only after create succeeds)
  await groveData.update('system-prompt', currentPrompt.meta.id, [
    { op: 'replace', path: '/meta/status', value: 'archived' },
    { op: 'replace', path: '/meta/updatedAt', value: new Date().toISOString() },
  ]);

  // 5. Invalidate server cache
  await fetch('/api/cache/invalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'system-prompt' }),
  });

  // 6. Refetch to update UI
  await refetch();

  return created;
}, [groveData, refetch]);
```

### 2.3 SystemPromptEditor Changes

**Current "Save & Activate" handler:**
```typescript
const handleSaveWithCache = async () => {
  onSave();  // Tells parent to persist patches (mutation)
  await fetch('/api/cache/invalidate', ...);
};
```

**New handler:**
```typescript
const handleSaveAndActivate = async () => {
  if (!prompt || prompt.meta.status !== 'active') {
    // Non-active: use regular save
    onSave();
    return;
  }
  
  // Active prompt: create new version
  const pendingChanges = extractPendingChanges(prompt, localState);
  await saveAndActivate(prompt, pendingChanges, currentUserId);
  
  // Parent handles UI update via refetch
};
```

---

## 3. Data Flow

### Before: Mutation Flow (Current)
```
User edits active prompt
        │
        ▼
┌───────────────────┐
│ Local state holds │
│ pending patches   │
└────────┬──────────┘
         │
         ▼ "Save & Activate"
┌───────────────────┐
│ update(sameId,    │  ← Same record mutated
│   patches)        │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Cache invalidate  │
└───────────────────┘
```

### After: Append Flow (Target)
```
User edits active prompt
        │
        ▼
┌───────────────────┐
│ Local state holds │
│ pending changes   │
└────────┬──────────┘
         │
         ▼ "Save & Activate"
┌───────────────────┐
│ Build new prompt  │
│ {                 │
│   id: newUUID,    │
│   version: v+1,   │
│   previousVersionId: oldId │
│   status: 'active' │
│ }                 │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ create(newPrompt) │  ← New record created
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ update(oldId,     │  ← Old record archived
│  status:'archived')│
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Cache invalidate  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ refetch()         │  ← UI shows new record
└───────────────────┘
```

---

## 4. Error Handling

### Failure Scenarios

| Scenario | Handling |
|----------|----------|
| Create fails | No archive performed, old version stays active |
| Archive fails | New version is active, old still marked active (duplicate active - needs manual fix) |
| Cache invalidation fails | Versions correct but old prompt may serve briefly |
| Refetch fails | UI stale but data correct; user can refresh |

### Transaction Strategy

Since Supabase doesn't support client-side transactions across multiple operations, we use **ordered operations with compensating actions**:

1. **Create first** - If this fails, stop. No data changed.
2. **Archive second** - If this fails, we have duplicate actives (rare, recoverable)
3. **Cache invalidate third** - Non-critical, eventually consistent
4. **Refetch fourth** - UI nicety, not critical

---

## 5. Interface Contracts

### saveAndActivate Input
```typescript
interface SaveAndActivateInput {
  currentPrompt: SystemPrompt;      // Must have status: 'active'
  pendingChanges: Partial<SystemPromptPayload>;  // Fields to update
  userId?: string | null;           // For provenance
}
```

### saveAndActivate Output
```typescript
// Returns the newly created prompt
// Caller can use this for immediate UI update if needed
Promise<SystemPrompt>
```

### Error Contract
```typescript
// Throws on:
// - currentPrompt.meta.status !== 'active'
// - groveData.create() failure
// - groveData.update() failure (after logging)
```

---

## 6. Integration Points

### With Console Factory
The factory's `handleEdit` continues to work for local state. The difference is what happens on save:
- Factory calls `onSave()` 
- Parent (ExperiencesConsole) detects active prompt
- Calls `saveAndActivate()` instead of `update()`

### With Server Cache
No changes needed. Existing `/api/cache/invalidate` endpoint works.

### With /explore Route
No changes needed. `/explore` fetches active prompt from Supabase via server's `fetchActiveSystemPrompt()`.

---

## 7. Provenance Chain

After several versions:
```
┌────────────────────────────────────────────────────────────────┐
│ Version History Chain                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │ v1          │   │ v2          │   │ v3          │          │
│  │ id: abc     │◀──│ id: def     │◀──│ id: ghi     │          │
│  │ status:     │   │ status:     │   │ status:     │          │
│  │   archived  │   │   archived  │   │   active    │          │
│  │ previousId: │   │ previousId: │   │ previousId: │          │
│  │   null      │   │   abc       │   │   def       │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                │
│  Traversal: ghi.previousVersionId → def.previousVersionId → abc │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

*Architecture complete. Proceed to DECISIONS.md*
