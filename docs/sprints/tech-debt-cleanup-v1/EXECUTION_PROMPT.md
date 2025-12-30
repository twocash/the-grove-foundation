# Tech Debt Cleanup v1 - Session 1: Safe Deletions

## Context

This is a technical debt cleanup sprint identified during a comprehensive codebase audit on 2024-12-27. Session 1 focuses on **safe immediate deletions** - items explicitly marked as deprecated with replacements already in production.

**Sprint scope:** Remove 2 deprecated code artifacts that have been superseded by newer implementations.

**Risk level:** Low - all items have explicit `@deprecated` markers and replacement code is verified working.

## Pre-Flight Checklist

Before making any changes, verify the following:

### 1. Verify GardenModal.tsx has no active imports

```bash
# Search for any imports of GardenModal
grep -r "GardenModal" --include="*.tsx" --include="*.ts" src/ components/ pages/

# Expected: Only the file itself and possibly a barrel export in Modals/index.ts
# If found elsewhere: STOP and assess before deleting
```

### 2. Verify legacy routes are not referenced elsewhere

```bash
# Search for legacy route patterns (without groveProject prefix)
grep -r "'explore\.nodes'\|'explore\.journeys'\|'explore\.lenses'" --include="*.tsx" --include="*.ts" src/ components/

# Expected: Only ContentRouter.tsx lines 131-133
# If found elsewhere: STOP and update those references first
```

### 3. Confirm build passes before changes

```bash
npm run build
```

## Cleanup Tasks

### Task 1: Delete GardenModal.tsx

**File:** `components/Terminal/Modals/GardenModal.tsx`

**Evidence of deprecation (from file header):**
```typescript
// @deprecated
// This modal is deprecated in favor of src/widget/views/GardenView.tsx
// The /garden command now switches to garden mode instead of opening a modal.
// This file is retained for backward compatibility but will be removed in a future sprint.
```

**Replacement:** `src/widget/views/GardenView.tsx` (already in production)

**Actions:**

1. Check if there's a barrel export in `components/Terminal/Modals/index.ts`:
   ```bash
   cat components/Terminal/Modals/index.ts
   ```
   If GardenModal is exported, remove that export line.

2. Check `components/Terminal.tsx` for GardenModal import or usage:
   ```bash
   grep -n "GardenModal\|garden" components/Terminal.tsx
   ```
   - Line ~121 has `const showGardenModal = uiState.modals.garden;`
   - This state flag may still exist but the modal component should not be rendered
   - Verify the modal is not actually rendered in the JSX

3. Delete the file:
   ```bash
   rm components/Terminal/Modals/GardenModal.tsx
   ```

4. If there was a barrel export, verify the index.ts is valid:
   ```bash
   cat components/Terminal/Modals/index.ts
   ```

### Task 2: Remove Legacy Route Aliases from ContentRouter

**File:** `src/workspace/ContentRouter.tsx`

**Location:** Lines 130-133

**Current code:**
```typescript
// Legacy
'explore.nodes': 'node-grid',
'explore.journeys': 'journey-list',
'explore.lenses': 'lens-picker',
```

**These are duplicates of (lines 125-127):**
```typescript
'explore.groveProject.nodes': 'node-grid',
'explore.groveProject.journeys': 'journey-list',
'explore.groveProject.lenses': 'lens-picker',
```

**Action:**

Edit `src/workspace/ContentRouter.tsx` and remove lines 130-133 (the comment and three legacy route mappings).

**Before:**
```typescript
'explore.groveProject.lenses': 'lens-picker',
'explore.groveProject.journeys': 'journey-list',
'explore.groveProject.nodes': 'node-grid',
'explore.groveProject.diary': 'diary-list',
'explore.groveProject.sprouts': 'sprout-grid',
// Legacy
'explore.nodes': 'node-grid',
'explore.journeys': 'journey-list',
'explore.lenses': 'lens-picker',
// Do - Coming Soon placeholders
```

**After:**
```typescript
'explore.groveProject.lenses': 'lens-picker',
'explore.groveProject.journeys': 'journey-list',
'explore.groveProject.nodes': 'node-grid',
'explore.groveProject.diary': 'diary-list',
'explore.groveProject.sprouts': 'sprout-grid',
// Do - Coming Soon placeholders
```

## Post-Cleanup Verification

### 1. TypeScript compilation

```bash
npm run build
```

**Expected:** Clean build with no errors

### 2. Verify no broken imports

```bash
# Quick grep for any remaining GardenModal references
grep -r "GardenModal" --include="*.tsx" --include="*.ts" .
```

**Expected:** No results (or only this execution prompt if stored in repo)

### 3. Run tests (if available)

```bash
npm test
```

### 4. Manual smoke test (recommended)

Start the dev server and verify:
- `/garden` command in Terminal switches to garden view (not a modal)
- Navigation to Explore > Nodes/Journeys/Lenses works via sidebar

```bash
npm run dev
```

## Commit

After all verifications pass:

```bash
git add -A
git commit -m "chore: remove deprecated GardenModal and legacy route aliases

- Delete components/Terminal/Modals/GardenModal.tsx (replaced by widget/views/GardenView.tsx)
- Remove legacy route aliases from ContentRouter (explore.nodes → explore.groveProject.nodes)
- Part of tech-debt-cleanup-v1 sprint"
```

## Rollback Plan

If issues arise:

```bash
git checkout HEAD~1 -- components/Terminal/Modals/GardenModal.tsx src/workspace/ContentRouter.tsx
```

## Success Criteria

- [ ] GardenModal.tsx deleted
- [ ] Legacy route aliases removed from ContentRouter
- [ ] Build passes (`npm run build`)
- [ ] No broken imports
- [ ] Commit created with descriptive message

## Next Sessions (Not in Scope)

- **Session 2:** TerminalFlowState migration (requires careful refactoring)
- **Session 3:** Legacy thread methods cleanup (requires journey hook mapping)
- **Session 4:** Cognitive Bridge decision + NarrativeEngineContext extraction

---

*Generated: 2024-12-27 | Sprint: tech-debt-cleanup-v1 | Session: 1 of 4*
