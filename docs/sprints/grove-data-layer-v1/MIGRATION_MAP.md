# Migration Map: grove-data-layer-v1

**Sprint:** grove-data-layer-v1  
**Date:** January 1, 2026

---

## Files to Create

| File | Purpose | Epic |
|------|---------|------|
| `src/core/data/grove-data-provider.ts` | Interface definition | 1 |
| `src/core/data/grove-data-context.tsx` | React context | 1 |
| `src/core/data/defaults.ts` | Default data for fallback | 1 |
| `src/core/data/use-grove-data.ts` | Main CRUD hook | 1 |
| `src/core/data/use-knowledge-search.ts` | Search hook (wraps lib/knowledge/search.js) | 3 |
| `src/core/data/index.ts` | Barrel export | 1 |
| `src/core/data/adapters/local-storage-adapter.ts` | Dev adapter | 1 |
| `src/core/data/adapters/supabase-adapter.ts` | Prod adapter | 1 |
| `src/core/data/adapters/hybrid-adapter.ts` | Read-through cache adapter | 1 |
| `src/core/data/adapters/index.ts` | Adapter barrel | 1 |
| `src/core/data/transforms/lens-transforms.ts` | Lens ↔ row | 1 |
| `src/core/data/transforms/journey-transforms.ts` | Journey ↔ row | 1 |
| `src/core/data/transforms/sprout-transforms.ts` | Sprout ↔ row | 1 |
| `src/core/data/transforms/column-mapping.ts` | Standard column mappings | 1 |
| `src/core/data/transforms/index.ts` | Transform barrel | 1 |
| `src/core/data/triggers/embedding-trigger.ts` | Optional pipeline trigger | 3 |
| `tests/unit/data/local-storage-adapter.test.ts` | Unit tests | 1 |
| `tests/unit/data/supabase-adapter.test.ts` | Unit tests | 1 |
| `tests/unit/data/use-grove-data.test.ts` | Hook tests | 1 |
| `tests/unit/data/use-knowledge-search.test.ts` | Search hook tests | 3 |

---

## Files to Modify

### Phase 2: Bedrock Migration

| File | Change | Epic |
|------|--------|------|
| `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` | Replace useLensData with useGroveData | 2 |
| `src/bedrock/consoles/LensWorkshop/useLensData.ts` | Mark deprecated, wrap useGroveData | 2 |
| `src/bedrock/consoles/GardenConsole.tsx` | Replace useSproutApi with useGroveData | 2 |
| `src/bedrock/api/sprouts.ts` | Mark deprecated | 2 |
| `src/App.tsx` | Wrap with GroveDataProvider | 2 |

### Phase 3: Runtime Migration

| File | Change | Epic |
|------|--------|------|
| `src/core/engagement/context.tsx` | Use GroveDataProvider for personas | 3 |
| `src/explore/Terminal.tsx` | Use useGroveData for lenses | 3 |
| `src/explore/LensPicker.tsx` | Use useGroveData | 3 |
| `src/explore/JourneyPicker.tsx` | Use useGroveData | 3 |

---

## Supabase Migrations

### New Tables

```sql
-- migrations/001_add_lenses_table.sql

CREATE TABLE IF NOT EXISTS knowledge.lenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  color TEXT,
  tone_guidance TEXT,
  system_prompt TEXT,
  narrative_style TEXT,
  vocabulary_level TEXT,
  emotional_register TEXT,
  arc_emphasis JSONB DEFAULT '{}',
  opening_template TEXT,
  opening_phase TEXT,
  default_thread_length INTEGER DEFAULT 5,
  entry_points TEXT[],
  suggested_thread TEXT[]
);

ALTER TABLE knowledge.lenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON knowledge.lenses FOR ALL USING (true);
```

```sql
-- migrations/002_add_cards_table.sql

CREATE TABLE IF NOT EXISTS knowledge.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  query TEXT,
  personas TEXT[],
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE knowledge.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON knowledge.cards FOR ALL USING (true);
```

```sql
-- migrations/003_add_moments_table.sql

CREATE TABLE IF NOT EXISTS knowledge.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  trigger JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE knowledge.moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON knowledge.moments FOR ALL USING (true);
```

---

## Deprecation Path

### Immediate (This Sprint)

| File | Action |
|------|--------|
| Console-specific hooks | Add `@deprecated` JSDoc |
| Direct Supabase calls | Add wrapper functions |

### Next Sprint

| File | Action |
|------|--------|
| Deprecated hooks | Add console.warn on use |
| Direct API calls | Route through provider |

### Future (Post-Validation)

| File | Action |
|------|--------|
| Deprecated hooks | Remove entirely |
| NarrativeEngineContext data loading | Replace with GroveDataProvider |

---

## Import Changes

### Before

```typescript
// Bedrock console
import { useLensData } from './useLensData';

// Runtime
import { NarrativeEngineContext } from '@/core/engine';
const { personas } = useContext(NarrativeEngineContext);
```

### After

```typescript
// Both Bedrock and Runtime
import { useGroveData } from '@/core/data';
const { objects: lenses } = useGroveData<LensPayload>('lens');
```

---

## Test Migration

| Test File | Changes |
|-----------|---------|
| `tests/unit/bedrock/*.test.ts` | Mock useGroveData instead of API |
| `tests/e2e/bedrock/*.spec.ts` | No changes (behavior same) |
| `tests/e2e/explore/*.spec.ts` | No changes (behavior same) |

---

## Rollback Plan

Each phase can be rolled back independently:

| Phase | Rollback |
|-------|----------|
| Phase 1 | Delete src/core/data/ (no other changes) |
| Phase 2 | Revert import changes, remove GroveDataProvider from App.tsx |
| Phase 3 | Revert NarrativeEngineContext to direct Supabase |
| Phase 4 | Un-deprecate hooks (remove warnings) |

---

## Verification Checklist

### Phase 1 Complete

- [ ] All tests in `tests/unit/data/` pass
- [ ] Build succeeds
- [ ] No new errors in console

### Phase 2 Complete

- [ ] LensWorkshop uses useGroveData
- [ ] GardenConsole uses useGroveData
- [ ] Edit in Bedrock persists to localStorage
- [ ] All Bedrock tests pass

### Phase 3 Complete

- [ ] Edit lens in Bedrock → See in Terminal
- [ ] Create sprout in Bedrock → Appears in /explore
- [ ] All E2E tests pass

### Phase 4 Complete

- [ ] Deprecated hooks show warning
- [ ] No direct API calls in consoles
- [ ] Documentation updated
