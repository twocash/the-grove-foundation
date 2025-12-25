# SPRINTS.md — Quantum Glass v1.1

## Sprint: Card System Unification
## Date: 2025-12-25

---

## Sprint Structure

**Single Sprint:** This is a focused half-day sprint. No subdivision needed.

---

## Phase Breakdown

### Phase 1: CSS Foundation
**Duration:** 15 minutes
**Risk:** Low

**Tasks:**
- [ ] Add `.glass-card-icon` utility
- [ ] Add `.glass-callout` utility
- [ ] Add `.glass-card-footer` utility
- [ ] Add `.glass-card-meta` utility
- [ ] Add `.glass-btn-primary` utility
- [ ] Add `.glass-btn-secondary` utility

**File:** `styles/globals.css`
**Lines:** ~80 additions

**Verification:**
```bash
npm run build
```

---

### Phase 2: Inspector Context Fix
**Duration:** 10 minutes
**Risk:** Medium

**Tasks:**
- [ ] Modify `navigateTo` to detect collection change
- [ ] Close inspector when collection changes
- [ ] Preserve inspector when navigating within collection

**File:** `src/workspace/WorkspaceUIContext.tsx`
**Lines:** ~15 modifications

**Verification:**
1. Open Journey inspector
2. Navigate to Lenses tab
3. Confirm inspector closed

---

### Phase 3: JourneyCard Refactor
**Duration:** 25 minutes
**Risk:** Medium

**Tasks:**
- [ ] Add `StatusBadge` import
- [ ] Refactor `CompactJourneyCard` to glass pattern
- [ ] Refactor `JourneyCard` to glass pattern
- [ ] Remove amber callout styling
- [ ] Use `.glass-callout` for target aha
- [ ] Use data attributes for state

**File:** `src/explore/JourneyList.tsx`
**Lines:** ~120 modifications

**Verification:**
1. Visual check Journeys tab (full cards)
2. Visual check chat nav picker (compact cards)
3. Confirm no amber colors
4. Test hover, selected, active states

---

### Phase 4: LensCard Refactor
**Duration:** 30 minutes
**Risk:** Medium

**Tasks:**
- [ ] Add `StatusBadge` import
- [ ] Delete entire `lensAccents` object (~80 lines)
- [ ] Refactor `CompactLensCard` to glass pattern
- [ ] Refactor `LensCard` to glass pattern
- [ ] Standardize to single icon (`psychology`)
- [ ] Use data attributes for state

**File:** `src/explore/LensPicker.tsx`
**Lines:** ~150 modifications (net reduction due to lensAccents deletion)

**Verification:**
1. Visual check Lenses tab (full cards)
2. Visual check chat nav picker (compact cards)
3. Confirm no colored icon backgrounds
4. Test hover, selected, active states

---

### Phase 5: NodeCard Refactor
**Duration:** 15 minutes
**Risk:** Low

**Tasks:**
- [ ] Remove lucide-react icon imports
- [ ] Refactor `NodeCard` to glass pattern
- [ ] Replace `--grove-*` tokens with `--glass-*`
- [ ] Add footer structure
- [ ] Update page and section headers

**File:** `src/explore/NodeGrid.tsx`
**Lines:** ~60 modifications

**Verification:**
1. Visual check Nodes tab
2. Confirm glass styling throughout
3. Test hover state (cyan text)

---

### Phase 6: Shared Components
**Duration:** 15 minutes
**Risk:** Low

**Tasks:**
- [ ] Update `CollectionHeader` text tokens
- [ ] Update `SearchInput` to glass tokens + cyan focus
- [ ] Update `ActiveIndicator` to glass tokens + green pulse

**Files:**
- `src/shared/CollectionHeader.tsx`
- `src/shared/SearchInput.tsx`
- `src/shared/ActiveIndicator.tsx`

**Lines:** ~35 modifications total

**Verification:**
1. Visual check page headers
2. Focus search input, confirm cyan ring
3. Start a journey, confirm green pulse indicator

---

### Phase 7: Final Verification
**Duration:** 15 minutes
**Risk:** Low

**Tasks:**
- [ ] Run full test suite
- [ ] Run build
- [ ] Visual sweep all collection views
- [ ] Test inspector behavior across collections
- [ ] Commit and push

**Verification:**
```bash
npm test
npm run build
```

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. CSS Foundation | 15 min | 0:15 |
| 2. Inspector Fix | 10 min | 0:25 |
| 3. JourneyCard | 25 min | 0:50 |
| 4. LensCard | 30 min | 1:20 |
| 5. NodeCard | 15 min | 1:35 |
| 6. Shared Components | 15 min | 1:50 |
| 7. Final Verification | 15 min | 2:05 |

**Total Estimated Time:** ~2 hours

---

## Dependencies

```
Phase 1 (CSS)
    │
    ├──► Phase 3 (JourneyCard)
    │
    ├──► Phase 4 (LensCard)
    │
    └──► Phase 5 (NodeCard)

Phase 2 (Inspector) ──► Independent

Phase 6 (Shared) ──► Independent

Phase 7 (Verify) ──► After all others
```

---

## Rollback Plan

Each phase can be rolled back independently:

| Phase | Rollback Strategy |
|-------|-------------------|
| 1 | Delete added CSS block |
| 2 | Revert navigateTo function |
| 3 | `git checkout -- src/explore/JourneyList.tsx` |
| 4 | `git checkout -- src/explore/LensPicker.tsx` |
| 5 | `git checkout -- src/explore/NodeGrid.tsx` |
| 6 | `git checkout -- src/shared/*.tsx` |

---

## Success Criteria

### Must Have
- [ ] All cards use `glass-card` class
- [ ] All cards use data attributes for state
- [ ] Inspector closes on collection change
- [ ] No amber/teal/pink accent colors
- [ ] Build passes
- [ ] Tests pass

### Should Have
- [ ] Consistent hover behavior (lift + cyan)
- [ ] Consistent selected behavior (cyan ring)
- [ ] Consistent active behavior (green border)

### Nice to Have
- [ ] Inspector context tests added
- [ ] Documentation updated
