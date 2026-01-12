# Sprint A (nursery-v1) Course Correction

**Date:** 2026-01-11
**Reviewer:** Build-Master (Code Review Agent)
**Status:** BLOCKED - Architecture Violation

---

## Executive Summary

Sprint A delivered functional UI but **completely bypassed the established console-factory pattern**. The implementation is a one-off custom build that breaks architectural consistency with Experience, Lens Workshop, and Prompt Workshop consoles.

**The code cannot be committed as-is.** A refactor is required.

---

## The Problem

### What Was Built (WRONG)

```
src/bedrock/nursery/
├── types.ts
├── hooks/
│   ├── useNurserySprouts.ts      # Custom data fetching
│   ├── usePromoteSprout.ts
│   ├── useArchiveSprout.ts
│   └── useRestoreSprout.ts
├── components/
│   ├── NurserySproutCard.tsx     # Custom card
│   ├── NurseryInspector.tsx      # Custom inspector drawer
│   ├── PromoteDialog.tsx
│   ├── ArchiveDialog.tsx
│   └── NurseryFilters.tsx        # Custom filter bar
└── NurseryConsole.tsx            # Custom page layout
```

The implementation:
- Uses `BedrockLayout` directly instead of `createBedrockConsole` factory
- Built custom filter components instead of using `FilterBar`, `SearchInput`, `SortDropdown`
- Built custom inspector drawer instead of using `useBedrockUI().openInspector()`
- Missing MetricsRow stat cards at top
- Inconsistent UI layout vs other consoles

### What Should Have Been Built (CORRECT)

```
src/bedrock/consoles/NurseryConsole/
├── index.ts                      # Uses createBedrockConsole<SproutPayload>()
├── NurseryConsole.config.ts      # Declarative config (metrics, filters, etc.)
├── SproutCard.tsx                # ObjectCardProps<SproutPayload>
├── SproutEditor.tsx              # ObjectEditorProps<SproutPayload>
└── useNurseryData.ts             # CollectionDataResult<SproutPayload>
```

---

## Visual Evidence

### Current Implementation (Screenshots from Sprint A)

![Nursery Empty State](screenshots/nursery-empty-state.png)

**Issues visible:**
- Filters crammed in left nav panel (should be in toolbar)
- No stat cards (Total, Ready, Failed, Archived)
- Custom "Needs Review" toggle instead of standard filter
- Inspector is a custom drawer component

### Correct Pattern (Reference: Experience, Lens, Prompt Workshop)

**Experience Console:**
- Stat cards: Total (9), Active (0), Drafts (0), Archived (0)
- Toolbar: Search, State dropdown, Type dropdown, Favorites, Sort, View toggle
- Card grid with consistent card design
- Right inspector panel via `useBedrockUI`

**Lens Workshop:**
- Same pattern: Stat cards, Toolbar, Card grid, Inspector

---

## Required Refactor

### Phase 1: Config File

Create `src/bedrock/consoles/NurseryConsole/NurseryConsole.config.ts`:

```typescript
import type { ConsoleConfig } from '../../types/console.types';

export const nurseryConsoleConfig: ConsoleConfig = {
  id: 'nursery',
  title: 'Nursery',
  subtitle: 'Research Sprouts',
  description: 'Review and curate research sprouts',

  metrics: [
    { id: 'total', label: 'Total', icon: 'eco', query: 'count(*)' },
    { id: 'ready', label: 'Ready', icon: 'check_circle', query: 'count(where: status=completed)' },
    { id: 'failed', label: 'Failed', icon: 'warning', query: 'count(where: status=blocked)' },
    { id: 'review', label: 'Needs Review', icon: 'rate_review', query: 'count(where: requiresReview)' },
  ],

  collectionView: {
    searchFields: ['meta.title', 'payload.spark', 'payload.tags'],
    filterOptions: [
      { field: 'payload.status', label: 'Status', type: 'select', options: ['completed', 'blocked', 'archived'] },
      { field: 'payload.requiresReview', label: 'Review', type: 'select', options: ['true', 'false'] },
    ],
    sortOptions: [
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'payload.inferenceConfidence', label: 'Confidence', direction: 'desc' },
      { field: 'meta.title', label: 'Title', direction: 'asc' },
    ],
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-nursery-favorites',
  },

  primaryAction: { label: 'New Sprout', icon: 'add', action: 'create' },

  copilot: { enabled: false }, // Nursery doesn't need AI copilot
};
```

### Phase 2: Data Hook

Convert `useNurserySprouts.ts` to implement `CollectionDataResult<SproutPayload>`:

```typescript
export function useNurseryData(): CollectionDataResult<ResearchSprout> {
  // ... existing fetch logic ...

  return {
    objects: sprouts as GroveObject<ResearchSprout>[],
    loading,
    error,
    refetch: fetchSprouts,
    create: async () => { /* create sprout */ },
    update: async (id, ops) => { /* apply patch */ },
    remove: async (id) => { /* archive sprout */ },
    duplicate: async (obj) => { /* clone sprout */ },
  };
}
```

### Phase 3: Card Component

Convert `NurserySproutCard.tsx` to implement `ObjectCardProps<SproutPayload>`:

```typescript
export function SproutCard({
  object,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
}: ObjectCardProps<ResearchSprout>) {
  // ... existing card UI ...
}
```

### Phase 4: Editor Component

Convert inspector logic to `SproutEditor.tsx` implementing `ObjectEditorProps<SproutPayload>`:

```typescript
export function SproutEditor({
  object,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<ResearchSprout>) {
  // Promote = archive with reason "promoted"
  // Archive = archive with reason selection
  // Restore = set status back to 'completed'
}
```

### Phase 5: Factory Integration

Create `src/bedrock/consoles/NurseryConsole/index.ts`:

```typescript
import { createBedrockConsole } from '../../patterns/console-factory';
import { nurseryConsoleConfig } from './NurseryConsole.config';
import { SproutCard } from './SproutCard';
import { SproutEditor } from './SproutEditor';
import { useNurseryData } from './useNurseryData';
import type { ResearchSprout } from '@core/schema/research-sprout';

export const NurseryConsole = createBedrockConsole<ResearchSprout>({
  config: nurseryConsoleConfig,
  useData: useNurseryData,
  CardComponent: SproutCard,
  EditorComponent: SproutEditor,
});

export default NurseryConsole;
```

---

## Files to DELETE After Refactor

```
DELETE: src/bedrock/nursery/components/NurseryFilters.tsx   # Use FilterBar
DELETE: src/bedrock/nursery/components/NurseryInspector.tsx # Use BedrockUI inspector
DELETE: src/bedrock/consoles/NurseryConsole.tsx (current)   # Replace with factory version
```

---

## DEX Compliance After Refactor

| Principle | Before | After |
|-----------|--------|-------|
| **Declarative Sovereignty** | Partial (archive reasons only) | Full (all config in .config.ts) |
| **Capability Agnosticism** | Yes | Yes |
| **Provenance** | Yes | Yes |
| **Organic Scalability** | **NO** - custom one-off | **YES** - factory pattern |

---

## Recommendation

**DO NOT COMMIT Sprint A in current state.**

Options:
1. **Quick fix (recommended):** Refactor to factory pattern before commit (~2-4 hours)
2. **Defer:** Commit with tech debt ticket, refactor in follow-up sprint
3. **Reject:** Discard implementation, re-execute sprint with correct pattern

The factory pattern exists specifically to prevent this kind of drift. All future bedrock console sprints MUST reference the factory pattern in their execution contracts.

---

## Contract Amendment for Future Sprints

Add to Grove Execution Protocol:

```markdown
### Constraint 7: Bedrock Console Factory

All new `/bedrock/*` views MUST use `createBedrockConsole<T>()` factory:

1. Create `ConsoleConfig` in `*.config.ts`
2. Implement `CollectionDataResult<T>` in `use*Data.ts`
3. Implement `ObjectCardProps<T>` in `*Card.tsx`
4. Implement `ObjectEditorProps<T>` in `*Editor.tsx`
5. Wire via factory in `index.ts`

**Reference patterns:**
- `src/bedrock/consoles/ExperienceConsole/`
- `src/bedrock/consoles/LensWorkshop/`
- `src/bedrock/consoles/PromptWorkshop/`

**Never build:**
- Custom layout components
- Custom filter bars
- Custom inspector drawers
- One-off page structures
```

---

*Reviewed by: Build-Master Agent*
*Date: 2026-01-11*
