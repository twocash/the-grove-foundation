# Repository Audit: prompt-unification-v1

**Date:** January 3, 2026  
**Branch:** bedrock + explore  
**Auditor:** Claude + Jim

---

## Current State Summary

### Data Layer Infrastructure (READY)

The grove-data-layer-v1 sprint completed January 1, 2026. Infrastructure exists:

| Component | Location | Status |
|-----------|----------|--------|
| GroveDataProvider interface | `src/core/data/grove-data-provider.ts` | ✅ Ready |
| SupabaseAdapter | `src/core/data/adapters/supabase-adapter.ts` | ✅ Ready |
| LocalStorageAdapter | `src/core/data/adapters/local-storage-adapter.ts` | ✅ Ready |
| HybridAdapter | `src/core/data/adapters/hybrid-adapter.ts` | ✅ Ready |
| useGroveData hook | `src/core/data/use-grove-data.ts` | ✅ Ready |
| GroveDataContext | `src/core/data/grove-data-context.tsx` | ✅ Ready |

**To extend:** Add 'prompt' to GroveObjectType union, add table mapping to SupabaseAdapter.

### Bedrock Console Infrastructure (READY)

| Component | Location | Purpose |
|-----------|----------|---------|
| BedrockLayout | `src/bedrock/primitives/BedrockLayout.tsx` | Console shell |
| BedrockNav | `src/bedrock/primitives/BedrockNav.tsx` | Left navigation |
| BedrockInspector | `src/bedrock/primitives/BedrockInspector.tsx` | Right panel |
| BedrockCopilot | `src/bedrock/primitives/BedrockCopilot.tsx` | AI assistant |
| MetricsRow | `src/bedrock/primitives/MetricsRow.tsx` | Stats display |
| ConsoleHeader | `src/bedrock/primitives/ConsoleHeader.tsx` | Title + actions |
| ObjectGrid | `src/bedrock/components/ObjectGrid.tsx` | Content grid |
| ObjectList | `src/bedrock/components/ObjectList.tsx` | Nav list |
| ObjectCard | `src/bedrock/components/ObjectCard.tsx` | Grid item |

### Reference Console: LensWorkshop

Structure to follow for PromptWorkshop:

```
src/bedrock/consoles/LensWorkshop/
├── index.ts                 → Exports
├── LensWorkshop.config.ts   → Console configuration
├── useLensData.ts           → Data hook wrapper
├── lens-transforms.ts       → Type transformations
├── LensCard.tsx             → Grid item component
├── LensEditor.tsx           → Detail editor
├── LensGrid.tsx             → Content area
└── LensCopilotActions.ts    → AI actions
```

### Current Object Types

From `src/core/data/grove-data-provider.ts`:

```typescript
export type GroveObjectType =
  | 'lens'      // ✅ Bedrock migrated
  | 'journey'   // ⚠️ Legacy, to be deprecated
  | 'node'      // ⚠️ Legacy, to be deprecated
  | 'hub'       // ✅ Partial migration
  | 'sprout'
  | 'card'
  | 'moment'
  | 'document';
```

**Missing:** 'prompt' type

### Supabase Tables

From `src/core/data/adapters/supabase-adapter.ts`:

```typescript
const TABLE_MAP: Record<GroveObjectType, string> = {
  lens: 'lenses',
  journey: 'journeys',
  hub: 'hubs',
  sprout: 'documents',
  document: 'documents',
  node: 'journey_nodes',
  card: 'cards',
  moment: 'moments',
};
```

**Missing:** `prompt: 'prompts'` mapping

### Grove Object Schema

From `src/core/schema/grove-object.ts`:

```typescript
interface GroveObjectMeta {
  id: string;
  type: GroveObjectType;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: GroveObjectProvenance;
  status?: GroveObjectStatus;
  tags?: string[];
  favorite?: boolean;
}
```

**Status:** Ready to extend with Prompt-specific payload.

---

## Files to Create

### Schema Layer
- `src/core/schema/prompt.ts` — PromptPayload type definitions

### Data Layer
- Extend `grove-data-provider.ts` — Add 'prompt' to union
- Extend `supabase-adapter.ts` — Add table mapping
- `src/core/data/use-prompt-data.ts` — Convenience hook (optional)

### Bedrock Console
```
src/bedrock/consoles/PromptWorkshop/
├── index.ts
├── PromptWorkshop.tsx
├── PromptWorkshop.config.ts
├── usePromptData.ts
├── prompt-transforms.ts
├── PromptCard.tsx
├── PromptEditor.tsx
├── PromptGrid.tsx
├── PromptInspector.tsx
├── SequenceNav.tsx
└── PromptCopilotActions.ts
```

### Explore Integration
- `src/explore/hooks/usePromptSuggestions.ts` — Context scoring
- `src/explore/hooks/useSequence.ts` — Sequence queries
- `src/explore/components/PromptSuggestion/` — Display component

### Database
- Supabase migration: `knowledge.prompts` table

---

## Files to Modify

| File | Change |
|------|--------|
| `src/core/data/grove-data-provider.ts` | Add 'prompt' to GroveObjectType |
| `src/core/data/adapters/supabase-adapter.ts` | Add `prompt: 'prompts'` to TABLE_MAP |
| `src/bedrock/config/navigation.ts` | Add PromptWorkshop route |
| `src/bedrock/consoles/index.ts` | Export PromptWorkshop |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Supabase schema migration | Low | Standard migration process |
| Type conflicts with legacy | Low | Clean types in `src/core/schema/prompt.ts` |
| Console pattern drift | Low | Follow LensWorkshop structure exactly |
| Explore integration complexity | Medium | Implement scoring as pure function first |

---

## Dependencies

| Dependency | Status | Blocker? |
|------------|--------|----------|
| grove-data-layer-v1 | ✅ Complete | No |
| Bedrock primitives | ✅ Ready | No |
| LensWorkshop reference | ✅ Exists | No |
| Supabase access | ✅ Available | No |

---

## Technical Debt to Avoid

1. **No parallel data loading** — Use existing useGroveData, extend type
2. **No duplicate components** — Use Bedrock primitives
3. **No hardcoded sequences** — Derive from prompt metadata
4. **No legacy imports** — Zero imports from `src/foundation/`
