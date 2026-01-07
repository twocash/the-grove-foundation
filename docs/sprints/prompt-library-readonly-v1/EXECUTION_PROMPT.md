# Execution Prompt: prompt-library-readonly-v1 (REVISED)

**Sprint:** prompt-library-readonly-v1
**Target:** Claude CLI / Agentic Execution
**Repository:** C:\GitHub\the-grove-foundation
**Branch:** Create `feature/prompt-library-readonly-v1` from current HEAD

---

## Context

You are implementing DEX Directive I (Declarative Sovereignty) for the Prompt Workshop. This requires:

1. **Epic 0:** Merging library prompts (JSON) with user prompts (data layer) at display time
2. **Epic 1:** Making library prompts read-only in the editor
3. **Epic 2:** Duplicate creates user-owned copies with provenance
4. **Epic 3:** Tests

### Architectural Principle

**JSON files = canonical source for library prompts. No data migration.**

Library prompts are merged at display time, not copied into the data layer. This ensures:
- JSON remains single source of truth
- New library prompts appear automatically on app update  
- No migration scripts or sync issues
- Strangler fig safe (kinetic text unchanged)

### Key Files to Read First

```bash
# Understand existing prompt data flow
cat src/data/prompts/index.ts                    # libraryPrompts export
cat src/core/data/defaults.ts                    # promptToGroveObject transformer
cat src/bedrock/consoles/PromptWorkshop/usePromptData.ts  # Current Workshop data hook
cat src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx  # Current editor
```

---

## Epic 0: Merge Library Prompts at Display Time

### Story 0.1: Export promptToGroveObject from defaults.ts

**File:** `src/core/data/defaults.ts`

**Task:** Export the existing `promptToGroveObject` function so it can be reused.

Find this line (around line 97):
```typescript
function promptToGroveObject(legacy: LegacyPrompt): GroveObject<PromptPayload> {
```

Change to:
```typescript
export function promptToGroveObject(legacy: LegacyPrompt): GroveObject<PromptPayload> {
```

Also export the LegacyPrompt interface. Find:
```typescript
interface LegacyPrompt {
```

Change to:
```typescript
export interface LegacyPrompt {
```

**Verification:**
```bash
npm run build  # Should compile
```

### Story 0.2: Update usePromptData to merge library prompts

**File:** `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`

**Task:** Import library prompts and merge with user prompts.

Add imports at the top:
```typescript
import { useMemo } from 'react';
import { libraryPrompts } from '@data/prompts';
import { promptToGroveObject, type LegacyPrompt } from '@core/data/defaults';
```

Find where `useGroveData` is called and modify the return to merge:

```typescript
export function usePromptData() {
  const groveData = useGroveData<PromptPayload>('prompt');
  
  // Transform library prompts to GroveObject format
  const libraryObjects = useMemo(() => {
    return libraryPrompts.map(p => promptToGroveObject(p as LegacyPrompt));
  }, []); // Empty deps - library prompts don't change at runtime
  
  // Merge library + user prompts
  const mergedObjects = useMemo(() => {
    // Library prompts first
    const libraryIds = new Set(libraryObjects.map(p => p.meta.id));
    
    // Filter out any user prompts that shadow library IDs (defensive)
    const uniqueUserPrompts = groveData.objects.filter(
      p => !libraryIds.has(p.meta.id)
    );
    
    return [...libraryObjects, ...uniqueUserPrompts];
  }, [libraryObjects, groveData.objects]);
  
  // Return merged objects but preserve other groveData methods
  return {
    ...groveData,
    objects: mergedObjects,
    // Note: create/update/delete still only operate on data layer (user prompts)
  };
}
```

**IMPORTANT:** The CRUD operations (`create`, `update`, `delete`) continue to use `groveData` directly, which only affects the data layer. This is correct - you can't modify library prompts via the Workshop.

**Verification:**
```bash
npm run build
npm run dev
# Navigate to /bedrock/prompts
# Should now see library prompts (source: 'library') in the list
```

### Story 0.3: Add data-source attribute to PromptCard for testing

**File:** `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` (or wherever the card component is)

**Task:** Add a data attribute for E2E testing.

Find the card's root element and add:
```tsx
<div 
  className="..."
  data-source={prompt.payload.source}
>
```

**Verification:**
```bash
npm run build
# Manual: Inspect element should show data-source="library" or "user"
```

---

## Epic 1: Read-Only Mode for Library Prompts

### Story 1.1: Add isReadOnly logic to PromptEditor

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Task:** Add read-only detection and propagate to all form inputs.

Add near top of component, after destructuring props:
```typescript
const isLibraryPrompt = prompt.payload.source === 'library';
const isReadOnly = isLibraryPrompt || loading;
```

Update ALL inputs to use `isReadOnly`:
- Change: `disabled={loading}`
- To: `disabled={isReadOnly}`

**Inputs to update (search for `disabled={loading}`):**
- Title textarea
- Description textarea  
- Status toggle button
- Execution prompt textarea
- Base weight slider
- Tags input
- All targeting controls

**Verification:**
```bash
npm run build
```

### Story 1.2: Add read-only visual indicator

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Task:** Add a header banner for library prompts.

Add this JSX right after `<div className="flex flex-col h-full">`:

```tsx
{/* Read-only banner for library prompts */}
{isLibraryPrompt && (
  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
    <span className="material-symbols-outlined text-blue-400 text-base">lock</span>
    <span className="text-sm text-blue-300">
      Library Prompt — shipped with Grove
    </span>
    <span 
      className="material-symbols-outlined text-blue-400/60 text-base cursor-help"
      title="Library prompts are version-controlled configuration. Duplicate to create your own customized version."
    >
      info
    </span>
  </div>
)}
```

**Verification:**
```bash
npm run build
npm run dev  # Library prompts show blue banner
```

### Story 1.3: Conditional footer buttons

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Task:** Replace Save/Duplicate/Delete with "Duplicate to Customize" for library prompts.

Find the footer section and replace with:

```tsx
{/* Fixed footer with actions */}
<div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
  {isLibraryPrompt ? (
    // Library prompt: only duplicate action
    <GlassButton
      onClick={onDuplicate}
      variant="primary"
      size="sm"
      disabled={loading}
      className="w-full"
    >
      <span className="material-symbols-outlined text-lg mr-2">content_copy</span>
      Duplicate to Customize
    </GlassButton>
  ) : (
    // User prompt: full edit actions
    <div className="flex items-center gap-2">
      <GlassButton
        onClick={onSave}
        variant="primary"
        size="sm"
        disabled={loading || !hasChanges}
        className="flex-1"
      >
        {hasChanges ? 'Save Changes' : 'Saved'}
      </GlassButton>
      <GlassButton
        onClick={onDuplicate}
        variant="ghost"
        size="sm"
        disabled={loading}
        title="Duplicate"
      >
        <span className="material-symbols-outlined text-lg">content_copy</span>
      </GlassButton>
      <GlassButton
        onClick={onDelete}
        variant="ghost"
        size="sm"
        disabled={loading}
        className="text-red-400 hover:text-red-300"
        title="Delete"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </GlassButton>
    </div>
  )}
</div>
```

**Verification:**
```bash
npm run build
npm run dev  
# Library prompts: single "Duplicate to Customize" button
# User prompts: Save + Duplicate + Delete buttons
```

---

## Epic 2: Duplicate Creates User Prompt

### Story 2.1: Update duplicate() to set source: 'user'

**File:** `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`

**Task:** Ensure duplicates always create user-owned copies with provenance.

Find or update the `duplicate` function:

```typescript
const duplicate = useCallback(
  async (object: GroveObject<PromptPayload>) => {
    const now = new Date().toISOString();
    
    const duplicated: GroveObject<PromptPayload> = {
      meta: {
        id: crypto.randomUUID(),
        type: 'prompt',
        title: `${object.meta.title} (Copy)`,
        description: object.meta.description,
        icon: object.meta.icon,
        status: 'draft',  // Duplicates start as draft
        createdAt: now,
        updatedAt: now,
        tags: [...(object.meta.tags || [])],
      },
      payload: {
        ...object.payload,
        topicAffinities: [...object.payload.topicAffinities],
        lensAffinities: [...object.payload.lensAffinities],
        targeting: { ...object.payload.targeting },
        sequences: object.payload.sequences?.map((s) => ({ ...s })),
        stats: {
          impressions: 0,
          selections: 0,
          completions: 0,
          avgEntropyDelta: 0,
          avgDwellMs: 0,
        },
        // CRITICAL: Always set source to 'user' for duplicates
        source: 'user',
        // Track provenance
        provenance: {
          ...object.payload.provenance,
          duplicatedFrom: object.meta.id,
          duplicatedAt: now,
        },
      },
    };
    
    // Create in data layer (not in libraryPrompts!)
    return groveData.create(duplicated);
  },
  [groveData]
);
```

**Verification:**
```bash
npm run build
# Manual: Duplicate a library prompt, verify:
# 1. New prompt appears with "(Copy)" suffix
# 2. source is 'user'
# 3. It's fully editable
```

### Story 2.2: Update PromptProvenance type (if needed)

**File:** `src/core/context-fields/types.ts`

**Task:** Ensure PromptProvenance includes duplicate tracking.

Search for `interface PromptProvenance` and add if not present:

```typescript
export interface PromptProvenance {
  // ... existing fields ...
  duplicatedFrom?: string;  // ID of source prompt
  duplicatedAt?: string;    // ISO timestamp
}
```

**Verification:**
```bash
npm run build  # Type check passes
```

---

## Epic 3: Testing

### Story 3.1: Unit tests

**File:** `tests/unit/PromptEditor.test.tsx` (create if needed)

```typescript
import { render, screen } from '@testing-library/react';
import { PromptEditor } from '@/bedrock/consoles/PromptWorkshop/PromptEditor';

const mockLibraryPrompt = {
  meta: {
    id: 'lib-001',
    type: 'prompt' as const,
    title: 'Library Prompt',
    description: 'A library prompt',
    icon: 'chat',
    status: 'active' as const,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    tags: [],
  },
  payload: {
    executionPrompt: 'Test prompt',
    topicAffinities: [],
    lensAffinities: [],
    targeting: {},
    baseWeight: 50,
    stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellMs: 0 },
    source: 'library' as const,
  },
};

const mockUserPrompt = {
  ...mockLibraryPrompt,
  meta: { ...mockLibraryPrompt.meta, id: 'user-001', title: 'User Prompt' },
  payload: { ...mockLibraryPrompt.payload, source: 'user' as const },
};

const mockHandlers = {
  onEdit: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
  loading: false,
  hasChanges: false,
};

describe('PromptEditor read-only mode', () => {
  it('shows lock banner for library prompts', () => {
    render(<PromptEditor object={mockLibraryPrompt} {...mockHandlers} />);
    expect(screen.getByText(/Library Prompt.*shipped with Grove/)).toBeVisible();
  });

  it('shows "Duplicate to Customize" for library prompts', () => {
    render(<PromptEditor object={mockLibraryPrompt} {...mockHandlers} />);
    expect(screen.getByText('Duplicate to Customize')).toBeVisible();
  });

  it('hides save button for library prompts', () => {
    render(<PromptEditor object={mockLibraryPrompt} {...mockHandlers} />);
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('shows full controls for user prompts', () => {
    render(<PromptEditor object={mockUserPrompt} {...mockHandlers} />);
    expect(screen.queryByText(/Library Prompt/)).not.toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeVisible();
  });
});
```

**Verification:**
```bash
npm test -- PromptEditor
```

---

## Final Verification

```bash
# Full build
npm run build

# All tests
npm test

# Manual verification
npm run dev

# Epic 0 verification:
# 1. Navigate to /bedrock/prompts
# 2. Verify library prompts appear (check for prompts with source: library)
# 3. Count should match libraryPrompts.length

# Epic 1 verification:
# 4. Select a library prompt
# 5. Verify blue "Library Prompt" banner
# 6. Verify all inputs disabled
# 7. Verify only "Duplicate to Customize" button

# Epic 2 verification:
# 8. Click "Duplicate to Customize"
# 9. Verify new prompt created with "(Copy)" suffix
# 10. Verify source is 'user'
# 11. Verify fully editable

# Strangler fig verification:
# 12. Navigate to Terminal explore experience
# 13. Verify kinetic highlights still work
# 14. Verify clicking highlights opens correct prompts
```

---

## Commit Sequence

```bash
git checkout -b feature/prompt-library-readonly-v1

# Epic 0: Merge library prompts
git add src/core/data/defaults.ts
git add src/bedrock/consoles/PromptWorkshop/usePromptData.ts
git add src/bedrock/consoles/PromptWorkshop/PromptCard.tsx
git commit -m "feat(prompts): merge library prompts into Workshop display"

# Epic 1: Read-only mode
git add src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
git commit -m "feat(prompts): add read-only mode for library prompts"

# Epic 2: Duplicate creates user copy
git add src/bedrock/consoles/PromptWorkshop/usePromptData.ts
git add src/core/context-fields/types.ts
git commit -m "feat(prompts): duplicate creates user-owned copy with provenance"

# Epic 3: Tests
git add tests/
git commit -m "test(prompts): add unit tests for library prompt handling"

# Push
git push -u origin feature/prompt-library-readonly-v1
```

---

## Troubleshooting

### Library prompts not appearing

Check:
1. `libraryPrompts` export in `src/data/prompts/index.ts` includes highlights
2. `promptToGroveObject` is exported from `defaults.ts`
3. Import path is correct: `@data/prompts` not `@/data/prompts`

### Type errors on promptToGroveObject

Check:
1. `LegacyPrompt` interface is exported
2. `PromptPayload` includes `surfaces` and `highlightTriggers` fields
3. Cast: `libraryPrompts.map(p => promptToGroveObject(p as LegacyPrompt))`

### Duplicate doesn't create editable prompt

Check:
1. `source: 'user'` is set AFTER the spread operator
2. `groveData.create()` is called (not modifying libraryObjects)

### Kinetic text broken after changes

**STOP.** The strangler fig principle was violated. Check:
1. `libraryPrompts` export unchanged in `src/data/prompts/index.ts`
2. `usePromptForHighlight` still imports from `@data/prompts`
3. No changes to `src/explore/hooks/usePromptForHighlight.ts`
