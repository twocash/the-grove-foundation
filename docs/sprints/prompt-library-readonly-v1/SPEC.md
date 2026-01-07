# Sprint: prompt-library-readonly-v1 (REVISED)

**Version:** 1.1
**Date:** January 5, 2026
**Author:** Jim Calhoun + Claude
**Status:** Ready for Execution

---

## Summary

Enforce DEX Directive I (Declarative Sovereignty) for the Prompt Workshop by:
1. **Merging** library prompts (from JSON) with user prompts (from data layer) at display time
2. **Making** library prompts read-only in the editor
3. **Enabling** "Duplicate to Customize" to create user-owned variants

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract
**Contract version:** 1.0
**Additional requirements:** Console pattern compliance, GroveObject schema, DEX compliance matrix

---

## Architectural Decision: Runtime Merge, Not Data Copy

### Why NOT copy library prompts into the data layer:

| Approach | Problem |
|----------|---------|
| Copy on first load | Creates divergence when app updates with new library prompts |
| Copy on every load | Duplicates accumulate; sync conflicts |
| Migrate once | Same divergence issue; requires migration versioning |

### The DEX-compliant approach:

```
JSON Files ──────────────────────────────────────────┐
(source: 'library')                                   │
  • Immutable at runtime                              │
  • Git-versioned                                     │──► usePromptData()
  • Always fresh on app load                          │    MERGES AT DISPLAY
                                                      │    
Data Layer ──────────────────────────────────────────┘
(source: 'user')                                      
  • User-created prompts                              
  • Duplicates with provenance
  • Full CRUD
```

**Benefits:**
- JSON remains single source of truth for library prompts
- No migration scripts needed
- New library prompts automatically appear on app update
- Legacy kinetic system unchanged (strangler fig safe)
- Clean separation: library = shipped config, user = runtime state

---

## Problem Statement

### Current State (Broken)

```
JSON Files ──► libraryPrompts ──► Kinetic Text (works!)
                     │
                     └──► getDefaults() ──► ONLY seeds if data layer empty
                                                    │
                                                    ▼
Data Layer ──────────────────────► usePromptData() ──► Workshop
(62 user prompts)                  (NO library prompts visible!)
```

- Workshop only shows user prompts from data layer
- Library prompts invisible in Workshop (never loaded)
- getDefaults() only runs on fresh installs

### DEX-Compliant Target State

```
JSON Files ──► libraryPrompts ──► Kinetic Text (unchanged)
                     │
                     └─────────────────────┐
                                           │
Data Layer ──► userPrompts ──┐             │
                             │             │
                             ▼             ▼
                    usePromptData() MERGES BOTH
                             │
                             ▼
                    PromptWorkshop displays ALL
                             │
                    ┌────────┴────────┐
                    │                 │
            source: 'library'   source: 'user'
              READ-ONLY          FULL EDIT
                    │                 │
                    └── Duplicate ────┘
```

---

## DEX Compliance Matrix

| Principle | Implementation | Test |
|-----------|----------------|------|
| **Declarative Sovereignty** | Library prompts live in JSON, merged at display time | Can a domain expert edit JSON to add/change library prompts? ✅ |
| **Capability Agnosticism** | N/A (UI-only change) | N/A |
| **Provenance as Infrastructure** | Source field on every prompt; duplicates track origin | Can we trace any prompt to its origin? ✅ |
| **Organic Scalability** | Adding new JSON files automatically includes them | Does adding highlights.prompts.json require code changes? ✅ (just import) |

---

## Requirements

### Functional Requirements

1. **FR-0:** PromptWorkshop displays both library AND user prompts
2. **FR-1:** Library prompts visually distinguishable (source badge)
3. **FR-2:** Library prompts read-only in editor (all inputs disabled)
4. **FR-3:** "Duplicate to Customize" button for library prompts
5. **FR-4:** Duplicates have `source: 'user'` and `duplicatedFrom` provenance
6. **FR-5:** Delete button hidden for library prompts
7. **FR-6:** User prompts fully editable (no change from current)

### Non-Functional Requirements

1. **NFR-1:** No changes to kinetic text system (libraryPrompts usage unchanged)
2. **NFR-2:** No data migration required
3. **NFR-3:** Library prompts load instantly (from bundled JSON, not network)

---

## Technical Design

### Epic 0: Runtime Merge of Library Prompts

**File:** `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`

**Pattern:** Merge library prompts (from JSON) with user prompts (from data layer) in the hook.

```typescript
// Import library prompts and transformer
import { libraryPrompts } from '@data/prompts';
import { promptToGroveObject } from '@core/data/defaults';

// Inside usePromptData hook:
const { objects: userPrompts, ...rest } = useGroveData<PromptPayload>('prompt');

// Transform and merge library prompts
const allPrompts = useMemo(() => {
  // Library prompts from JSON (already GroveObject format after transform)
  const libraryObjects = libraryPrompts.map(p => 
    promptToGroveObject(p as LegacyPrompt)
  );
  
  // User prompts from data layer
  // Filter out any user prompts that have same ID as library (shouldn't happen, but defensive)
  const libraryIds = new Set(libraryObjects.map(p => p.meta.id));
  const uniqueUserPrompts = userPrompts.filter(p => !libraryIds.has(p.meta.id));
  
  // Library first, then user
  return [...libraryObjects, ...uniqueUserPrompts];
}, [userPrompts]);
```

**Key insight:** `promptToGroveObject` already exists in `defaults.ts`. We export it and reuse.

### Epic 1: Read-Only Mode

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

```typescript
const isLibraryPrompt = prompt.payload.source === 'library';
const isReadOnly = isLibraryPrompt || loading;
// All inputs use disabled={isReadOnly}
```

### Epic 2: Duplicate Creates User Prompt

**File:** `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`

```typescript
// Duplicate always creates user-owned copy
const duplicate = useCallback(async (object) => {
  const duplicated = {
    ...object,
    meta: { ...object.meta, id: generateUUID(), title: `${object.meta.title} (Copy)` },
    payload: {
      ...object.payload,
      source: 'user',  // ALWAYS user, even if duplicating library
      provenance: {
        ...object.payload.provenance,
        duplicatedFrom: object.meta.id,
        duplicatedAt: new Date().toISOString(),
      },
    },
  };
  return groveData.create(duplicated);
}, [groveData]);
```

---

## Files to Modify

| File | Epic | Change |
|------|------|--------|
| `src/core/data/defaults.ts` | 0 | Export `promptToGroveObject` function |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | 0, 2 | Merge library prompts; fix duplicate() |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | 1 | Read-only mode, banner, conditional footer |
| `src/core/context-fields/types.ts` | 2 | Add `duplicatedFrom` to PromptProvenance (if not present) |

---

## Strangler Fig Verification

After implementation, verify legacy systems unchanged:

```bash
# Kinetic text still works
npm run dev
# Navigate to Terminal, verify highlights still clickable

# Navigation forks still work
# Verify fork buttons appear with correct prompts
```

---

## Test Plan

### Unit Tests

```typescript
describe('usePromptData', () => {
  it('merges library prompts with user prompts', () => {
    const { result } = renderHook(() => usePromptData());
    const libCount = result.current.objects.filter(p => p.payload.source === 'library').length;
    expect(libCount).toBeGreaterThan(0);
  });

  it('library prompts are not duplicated in data layer', () => {
    // Verify we're not creating copies
  });
});

describe('PromptEditor read-only mode', () => {
  it('disables all inputs for library prompts', () => { ... });
  it('shows "Duplicate to Customize" for library prompts', () => { ... });
  it('hides delete button for library prompts', () => { ... });
  it('enables all inputs for user prompts', () => { ... });
});
```

### E2E Tests

```typescript
test('library prompts visible in Workshop', async ({ page }) => {
  await page.goto('/bedrock/prompts');
  // Should see library prompts
  await expect(page.locator('[data-source="library"]')).toHaveCount.greaterThan(0);
});

test('library prompt is read-only', async ({ page }) => {
  await page.goto('/bedrock/prompts');
  await page.click('[data-source="library"]');
  await expect(page.getByText('Library Prompt')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Duplicate to Customize' })).toBeVisible();
});
```

---

## Build Gates

```bash
# After each epic
npm run build          # Compiles
npm test               # Unit tests pass
npx playwright test    # E2E tests pass

# Strangler fig verification
npm run dev            # Manual: kinetic highlights still work
```

---

## Out of Scope

- Changes to kinetic text system (`usePromptForHighlight`)
- Changes to navigation forks (`useNavigationPrompts`)
- Sync mechanism from data layer back to JSON files
- Bulk operations on library prompts

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance: merging on every render | useMemo with dependency on userPrompts only |
| ID collision between library and user | Filter user prompts that shadow library IDs |
| Breaking kinetic text | Strangler fig: don't touch libraryPrompts usage |

---

## Success Criteria

1. ✅ Library prompts visible in PromptWorkshop
2. ✅ Library prompts display in read-only mode
3. ✅ User can duplicate library prompt to create editable copy
4. ✅ Duplicated prompt has `source: 'user'` and tracks origin
5. ✅ Kinetic text and navigation forks unchanged
6. ✅ All unit and E2E tests pass
