# Epic 5: Lens URL Hydration - Sprint Breakdown

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23
**Estimated Time**: 30 minutes

---

## Task Overview

| Task | Est. Time | Risk | Dependencies |
|------|-----------|------|--------------|
| T1: Create useLensHydration.ts | 15 min | LOW | None |
| T2: Modify GenesisPage.tsx | 5 min | LOW | T1 |
| T3: Manual Testing | 10 min | LOW | T2 |

---

## Task Details

### T1: Create useLensHydration.ts

**File**: `src/surface/hooks/useLensHydration.ts`

**Deliverables**:
- [ ] Header documentation (50 lines explaining migration context)
- [ ] Import statements
- [ ] VALID_ARCHETYPES constant
- [ ] useLensHydration function with:
  - [ ] SSR guard
  - [ ] Idempotency guard (useRef)
  - [ ] URL param reading
  - [ ] Validation against DEFAULT_PERSONAS
  - [ ] selectLens() call
  - [ ] Console logging
- [ ] Default export

**Acceptance**:
- File compiles without errors
- TypeScript types are correct
- Documentation explains WHY, not just WHAT

---

### T2: Modify GenesisPage.tsx

**File**: `src/surface/pages/GenesisPage.tsx`

**Changes**:
1. [ ] Add import for useLensHydration
2. [ ] Add useLensHydration() call BEFORE useQuantumInterface()
3. [ ] Add comment explaining the call

**Acceptance**:
- Build succeeds
- No TypeScript errors
- Hook is called in correct order

---

### T3: Manual Testing

**Test Matrix**:

| URL | Expected Console | Expected Behavior |
|-----|------------------|-------------------|
| `/` | "No URL lens param" | Picker shows on tree click |
| `/?lens=engineer` | "Hydrating from URL: engineer" | Skips picker |
| `/?lens=academic` | "Hydrating from URL: academic" | Skips picker |
| `/?lens=invalid` | "Invalid lens param: invalid" | Picker shows |
| `/?lens=Engineer` | "Invalid lens param: Engineer" | Picker shows (case-sensitive) |

**Acceptance**:
- All scenarios pass
- No console errors
- No visual regressions

---

## Definition of Done

- [ ] Code compiles (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] All test scenarios pass
- [ ] Documentation is comprehensive
- [ ] Commit message follows convention: `feat(lens): URL parameter hydration for deep links`

---

## Sprint Execution Order

```
1. Read SPEC.md and ARCHITECTURE.md for context
2. Create useLensHydration.ts (T1)
3. Modify GenesisPage.tsx (T2)
4. Run build to verify compilation
5. Run dev server
6. Execute test matrix (T3)
7. Commit changes
8. Update DEVLOG.md
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Build fails | Check imports paths are correct |
| Hook doesn't fire | Verify component renders useLensHydration |
| Wrong lens selected | Check VALID_ARCHETYPES includes target lens |
| Double selection | Verify useRef guard works |
