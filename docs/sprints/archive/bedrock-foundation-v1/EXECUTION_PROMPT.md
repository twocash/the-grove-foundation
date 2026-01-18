# Execution Prompt: bedrock-foundation-v1

**Copy this entire prompt into Claude CLI to begin execution.**

---

## Mission

You are executing the **bedrock-foundation-v1** sprint. Build the Lens Workshop as the reference implementation for all Bedrock admin consoles.

## Critical Constraints

1. **NO IMPORTS FROM `src/foundation/`** — This is a strangler fig boundary. Violation fails the sprint.
2. **All entities use GroveObject** — Every type wraps `GroveObjectMeta`
3. **Follow the reference exactly** — `LENS_WORKSHOP_REFERENCE.md` is canonical
4. **Test data layer first** — Hooks must have unit tests before wiring to UI

## Project Location

```
C:\GitHub\the-grove-foundation
```

## Branch

```bash
git checkout bedrock
# If branch doesn't exist:
git checkout -b bedrock
```

## Documents to Read First

Read these in order before writing any code:

1. `docs/sprints/bedrock-foundation-v1/LENS_WORKSHOP_REFERENCE.md` — **Primary implementation guide**
2. `docs/BEDROCK_SPRINT_CONTRACT.md` — Binding constraints
3. `docs/sprints/bedrock-foundation-v1/ARCHITECTURE.md` — Data model and flows
4. `docs/sprints/bedrock-foundation-v1/SPRINTS.md` — Story breakdown
5. `PROJECT_PATTERNS.md` — Pattern catalog (what to use, what to avoid)

## Execution Order

Follow this sequence exactly:

### Phase 1: Types (Days 1-2)

```bash
# Create type files
mkdir -p src/bedrock/types
mkdir -p src/bedrock/patterns
```

Create in order:
1. `src/bedrock/types/console.types.ts`
2. `src/bedrock/types/copilot.types.ts`
3. `src/bedrock/types/lens.ts`
4. `src/bedrock/patterns/collection-view.types.ts`

Verify:
```bash
npx tsc --noEmit
```

### Phase 2: Data Layer (Days 3-5)

Create hooks with unit tests:

1. `src/bedrock/patterns/GroveApi.ts`
   - `tests/unit/GroveApi.test.ts`

2. `src/bedrock/patterns/useCollectionView.ts`
   - `tests/unit/useCollectionView.test.ts`

3. `src/bedrock/patterns/usePatchHistory.ts`
   - `tests/unit/usePatchHistory.test.ts`

Verify:
```bash
npm test -- --testPathPattern=unit
```

**GATE:** All unit tests must pass before proceeding.

### Phase 3: Primitives (Days 6-8)

```bash
mkdir -p src/bedrock/primitives
mkdir -p src/bedrock/context
```

Create in order:
1. `src/bedrock/primitives/StatCard.tsx`
2. `src/bedrock/primitives/MetricsRow.tsx`
3. `src/bedrock/primitives/ConsoleHeader.tsx`
4. `src/bedrock/primitives/BedrockNav.tsx`
5. `src/bedrock/primitives/BedrockInspector.tsx`
6. `src/bedrock/primitives/BedrockLayout.tsx`
7. `src/bedrock/context/BedrockUIContext.tsx`

Verify:
```bash
npm run build
```

### Phase 4: Collection Components (Days 9-11)

```bash
mkdir -p src/bedrock/components
```

Create:
1. `src/bedrock/components/FavoriteToggle.tsx`
2. `src/bedrock/components/ViewModeToggle.tsx`
3. `src/bedrock/components/FilterBar.tsx`
4. `src/bedrock/components/EmptyState.tsx`
5. `src/bedrock/components/ObjectCard.tsx`
6. `src/bedrock/components/ObjectGrid.tsx`
7. `src/bedrock/components/ObjectList.tsx`

Use `--card-*` tokens for all card styling.

### Phase 5: Lens Workshop (Days 12-14)

```bash
mkdir -p src/bedrock/consoles/LensWorkshop
```

Create:
1. `src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts`
2. `src/bedrock/consoles/LensWorkshop/LensCard.tsx`
3. `src/bedrock/consoles/LensWorkshop/LensEditor.tsx`
4. `src/bedrock/consoles/LensWorkshop/LensGrid.tsx`
5. `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx`
6. `src/bedrock/consoles/LensWorkshop/index.ts`

### Phase 6: Routes (Day 15)

```bash
mkdir -p src/app/bedrock/lenses
mkdir -p src/bedrock/config
```

Create:
1. `src/app/bedrock/layout.tsx`
2. `src/app/bedrock/page.tsx` (redirect to /bedrock/lenses)
3. `src/app/bedrock/lenses/page.tsx`
4. `src/bedrock/config/navigation.ts`

Verify:
```bash
npm run dev
# Navigate to http://localhost:3000/bedrock/lenses
```

### Phase 7: Copilot (Days 16-18)

Create:
1. `src/bedrock/context/BedrockCopilotContext.tsx`
2. `src/bedrock/patterns/useBedrockCopilot.ts`
3. `src/bedrock/primitives/BedrockCopilot.tsx`
4. `src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts`

Update:
- `src/bedrock/primitives/BedrockInspector.tsx` (add Copilot slot)
- `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` (wire Copilot)

### Phase 8: Tests & Polish (Days 19-20)

Create tests:
1. `tests/e2e/bedrock-primitives.spec.ts`
2. `tests/e2e/bedrock-collection.spec.ts`
3. `tests/e2e/bedrock-crud.spec.ts`
4. `tests/e2e/bedrock-copilot.spec.ts`
5. `tests/e2e/bedrock-baseline.spec.ts`
6. `tests/integration/LensWorkshop.integration.test.ts`

Add ESLint rule to block Foundation imports.

Final verification:
```bash
npm test
npx playwright test
npm run lint
npm run build
```

---

## Key Implementation Details

### GroveObject Envelope

All API responses use this format:
```typescript
interface ApiResponse<T> {
  data: T;
  meta: { count?, page?, pageSize?, totalPages? };
}
```

### Patch Operations

Use JSON Patch format:
```typescript
interface PatchOperation {
  op: 'replace' | 'add' | 'remove';
  path: string;  // e.g., '/payload/description'
  value?: unknown;
}
```

### Card Styling

Use existing `--card-*` tokens:
```css
--card-border-default
--card-border-inspected
--card-border-active
--card-bg-active
--card-ring-color
```

### Filter Operators

Full set:
```typescript
type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'
  | 'range'        // { min?, max? }
  | 'exists' | 'not_exists';
```

### Favorites Storage

Use existing pattern:
```typescript
const FAVORITES_KEY = 'bedrock:lens-workshop:favorites';
// Uses src/lib/storage/user-preferences.ts pattern
```

---

## Troubleshooting

### Build Fails

```bash
# Check for type errors
npx tsc --noEmit

# Check for lint errors
npm run lint
```

### Tests Fail

```bash
# Run specific test
npm test -- --testPathPattern=useCollectionView

# Run E2E with debug
npx playwright test --debug
```

### Foundation Import Error

If you see "Cannot import from foundation":
1. Check imports in the file
2. Any import from `src/foundation/` is forbidden
3. Implement needed functionality in `src/bedrock/`

---

## Commit Strategy

After each epic:
```bash
git add .
git commit -m "feat(bedrock): complete Epic N - {description}"
```

After final verification:
```bash
git commit -m "feat(bedrock): complete Lens Workshop reference implementation"
git push origin bedrock
```

---

## Success Criteria

Sprint is complete when:

- [ ] `/bedrock/lenses` renders Lens Workshop
- [ ] Filter/sort/favorite works
- [ ] CRUD operations work
- [ ] Undo/redo works
- [ ] Copilot generates valid patches
- [ ] All tests pass
- [ ] No Foundation imports
- [ ] Visual baselines captured

---

## Reference Files

| File | Purpose |
|------|---------|
| `LENS_WORKSHOP_REFERENCE.md` | Primary implementation guide |
| `ARCHITECTURE.md` | Data model, component specs |
| `SPRINTS.md` | Story breakdown |
| `DECISIONS.md` | ADRs explaining "why" |
| `MIGRATION_MAP.md` | File creation sequence |

---

**Begin with Phase 1. Create types first.**
