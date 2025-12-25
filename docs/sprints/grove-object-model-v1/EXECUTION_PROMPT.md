# Execution Prompt: Grove Object Model v1

**Sprint:** grove-object-model-v1  
**For:** Claude Code CLI  
**Time Budget:** 12 hours (3 sessions recommended)

---

## Pre-Flight Checklist

Before starting, verify:

```bash
cd C:\GitHub\the-grove-foundation
pnpm install
pnpm build  # Must pass
pnpm test   # Must pass
```

**Dependency Check:** Sprint 6 (card-system-unification-v1) must be merged. Verify `--card-*` tokens exist in `src/app/globals.css`.

---

## Context

You are implementing Pattern 7: Object Model for the Grove Foundation project.

**Goal:** Create a unified object identity system where all Grove content (journeys, hubs, sprouts, etc.) shares common metadata and can be rendered with a single generic card component.

**v1 Scope:** 
- GroveObjectMeta type definition
- Journey extended with Object Model fields
- GroveObjectCard generic component
- useGroveObjects collection hook
- Favorites in localStorage

---

## File Creation Order

Execute in this order, verifying build after each major step:

### Step 1: Create grove-object.ts

**File:** `src/core/schema/grove-object.ts`

Create with all type definitions:
- GroveObjectType union (extensible)
- GroveObjectStatus type
- GroveObjectProvenance interface
- GroveObjectMeta interface
- GroveObject<T> generic
- isGroveObjectMeta type guard

See MIGRATION_MAP.md Section 1 for exact code.

**Verify:** `pnpm build`

---

### Step 2: Extend Journey in narrative.ts

**File:** `src/core/schema/narrative.ts`

1. Add import at top:
```typescript
import { GroveObjectMeta, GroveObjectProvenance } from './grove-object';
```

2. Modify Journey interface to extend GroveObjectMeta.

See MIGRATION_MAP.md Section 2 for exact changes.

**Verify:** `pnpm build` — existing code should still work.

---

### Step 3: Create user-preferences.ts

**File:** `src/lib/storage/user-preferences.ts`

Create the favorites storage utility with:
- getFavorites()
- isFavorite()
- setFavorite()
- toggleFavorite()
- getUserTags() / setUserTags()

See MIGRATION_MAP.md Section 3 for exact code.

**Verify:** `pnpm build`

---

### Step 4: Create useGroveObjects.ts

**File:** `src/surface/hooks/useGroveObjects.ts`

Create the collection hook with:
- normalizeJourney function
- UseGroveObjectsOptions interface
- UseGroveObjectsResult interface
- useGroveObjects hook implementation
- Type, status, tags, favorite filtering
- Sorting by createdAt, updatedAt, title

See MIGRATION_MAP.md Section 4 for exact code.

**Verify:** `pnpm build`

---

### Step 5: Create CardShell.tsx

**File:** `src/surface/components/GroveObjectCard/CardShell.tsx`

Create directory first:
```bash
mkdir -p src/surface/components/GroveObjectCard
```

Create CardShell with:
- Visual State Matrix using --card-* tokens
- Header with icon, title, favorite button
- Content slot (children)
- Footer with status and tags

See MIGRATION_MAP.md Section 5 for exact code.

**Verify:** `pnpm build`

---

### Step 6: Create Content Renderers

**Files:**
- `src/surface/components/GroveObjectCard/JourneyContent.tsx`
- `src/surface/components/GroveObjectCard/GenericContent.tsx`

Create both content renderers.

See MIGRATION_MAP.md Section 6 for exact code.

**Verify:** `pnpm build`

---

### Step 7: Create GroveObjectCard/index.tsx

**File:** `src/surface/components/GroveObjectCard/index.tsx`

Create main component with:
- CONTENT_RENDERERS registry
- Type dispatch logic
- Props interface
- Re-exports

See MIGRATION_MAP.md Section 7 for exact code.

**Verify:** `pnpm build`

---

### Step 8: Update PROJECT_PATTERNS.md

**File:** `PROJECT_PATTERNS.md`

Add Pattern 7 section at the end.

See MIGRATION_MAP.md Section 8 for exact content.

---

## Build Gates

After each epic, run:

```bash
pnpm build
pnpm test
```

Do not proceed if either fails.

---

## Manual Test Matrix

After implementation, verify:

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Call useGroveObjects() | Returns journey objects |
| 2 | Call useGroveObjects({ types: ['journey'] }) | Returns only journeys |
| 3 | Call useGroveObjects({ favorite: true }) | Returns only favorites |
| 4 | Render GroveObjectCard with journey | Shows journey content |
| 5 | Click favorite star | Star fills, persists on refresh |
| 6 | Apply isInspected prop | Ring-2 appears |
| 7 | Apply isActive prop | Active styling appears |
| 8 | Pass unknown object type | GenericContent renders |

---

## Troubleshooting

### Import Errors

If `@core/schema/grove-object` doesn't resolve:
- Check tsconfig.json paths
- May need: `"@core/*": ["./src/core/*"]`

### NarrativeEngine Missing

If useNarrativeEngine not found:
- Check existing import paths in project
- May be at different location

### localStorage SSR Crash

If build fails with localStorage in SSR:
- Ensure `typeof window !== 'undefined'` check
- Or wrap in useEffect

### --card-* Tokens Missing

If card tokens don't exist:
- Sprint 6 not merged yet
- Wait for Sprint 6 or add tokens manually

---

## Success Criteria

Sprint is complete when:

- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] useGroveObjects returns normalized Journey objects
- [ ] GroveObjectCard renders Journey with correct content
- [ ] Favorites persist in localStorage
- [ ] Visual states work (inspected, active)
- [ ] Pattern 7 documented in PROJECT_PATTERNS.md

---

## Commit Messages

Use conventional commits:

```
feat(schema): add GroveObjectMeta base types
feat(schema): extend Journey with GroveObjectMeta
feat(storage): add user preferences with favorites
feat(hooks): add useGroveObjects collection hook
feat(components): add GroveObjectCard with type dispatch
docs: add Pattern 7 to PROJECT_PATTERNS.md
```

---

## Post-Execution

After completing:

1. Update DEVLOG.md with execution notes
2. Create PR with sprint summary
3. Link to sprint artifacts in PR description
4. Merge when ready

---

## Reference Files

Read these before starting:
- `docs/sprints/grove-object-model-v1/SPEC.md` — Requirements
- `docs/sprints/grove-object-model-v1/ARCHITECTURE.md` — Design
- `docs/sprints/grove-object-model-v1/MIGRATION_MAP.md` — Exact code
- `docs/sprints/grove-object-model-v1/DECISIONS.md` — Why choices were made
- `PROJECT_PATTERNS.md` — Existing patterns to follow

---

*Ready for execution. This prompt is self-contained for CLI handoff.*
