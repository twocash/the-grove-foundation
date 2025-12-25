# Stories: Foundation Theme Integration v1

**Sprint:** 4
**Total Estimate:** 45-60 minutes
**Stories:** 4

---

## Story 1: Verify No Hidden Imports

**Priority:** P0 (Gate for all other stories)
**Estimate:** 5 minutes
**Type:** Verification

### Description
Before deleting anything, confirm the layout files are truly orphaned.

### Tasks
1. Search for imports of `foundation/layout`
2. Search for imports of HUDHeader, NavSidebar, GridViewport
3. Search for imports of FoundationLayout
4. Document findings

### Acceptance Criteria
- [ ] grep commands run with zero matches
- [ ] Confidence that deletion won't break imports

### Commands
```bash
grep -r "from.*foundation/layout" src/
grep -r "HUDHeader\|NavSidebar\|GridViewport\|FoundationLayout" src/ --include="*.tsx" --include="*.ts"
```

---

## Story 2: Delete Orphaned Layout Directory

**Priority:** P0
**Estimate:** 10 minutes
**Type:** Deletion
**Depends On:** Story 1

### Description
Remove the entire `src/foundation/layout/` directory containing dead code.

### Tasks
1. Delete directory: `rm -rf src/foundation/layout/`
2. Run `npm run build` to verify no breakage
3. Run `npx tsc --noEmit` for type check

### Files Deleted
- `src/foundation/layout/FoundationLayout.tsx` (65 lines)
- `src/foundation/layout/HUDHeader.tsx` (77 lines)
- `src/foundation/layout/NavSidebar.tsx` (129 lines)
- `src/foundation/layout/GridViewport.tsx` (29 lines)
- `src/foundation/layout/index.ts` (~10 lines)

### Acceptance Criteria
- [ ] Directory deleted
- [ ] Build succeeds
- [ ] TypeScript compiles
- [ ] ~310 lines removed

---

## Story 3: Clean Configuration Files

**Priority:** P0
**Estimate:** 15 minutes
**Type:** Edit
**Depends On:** Story 2

### Description
Remove broken theme-* tokens from Tailwind config and unused CSS variables from globals.css.

### Tasks

#### 3a: tailwind.config.ts
1. Open `tailwind.config.ts`
2. Locate the THEME SYSTEM comment block (~line 130)
3. Delete theme-bg, theme-text, theme-border, theme, theme-accent objects
4. Save file

#### 3b: styles/globals.css
1. Open `styles/globals.css`
2. Locate THEME SYSTEM section (~line 635)
3. Delete entire section including comment header
4. Save file

### Acceptance Criteria
- [ ] tailwind.config.ts reduced by ~35 lines
- [ ] globals.css reduced by ~40 lines
- [ ] `npm run build` succeeds
- [ ] No console errors on `/foundation`

---

## Story 4: Verify and Document

**Priority:** P1
**Estimate:** 15 minutes
**Type:** Verification + Documentation
**Depends On:** Story 3

### Description
Comprehensive verification that Foundation still works, plus documentation updates.

### Tasks

#### 4a: Visual Verification
1. Run `npm run dev`
2. Visit `/foundation` - verify dashboard loads
3. Visit `/foundation/narrative` - verify console works
4. Visit `/foundation/health` - verify health dashboard works
5. Visit `/foundation/engagement` - verify console works
6. Check browser console for errors

#### 4b: Documentation Update
1. Update `ARCHITECTURE_NOTES.md` (if exists) with cleanup notes
2. Ensure sprint docs are complete

### Acceptance Criteria
- [ ] All Foundation routes render correctly
- [ ] No console errors
- [ ] Documentation reflects current state

---

## Summary Table

| Story | Priority | Est. | Depends On | Status |
|-------|----------|------|------------|--------|
| 1. Verify No Hidden Imports | P0 | 5m | — | ⬜ |
| 2. Delete Orphaned Layout | P0 | 10m | Story 1 | ⬜ |
| 3. Clean Configuration | P0 | 15m | Story 2 | ⬜ |
| 4. Verify and Document | P1 | 15m | Story 3 | ⬜ |

**Total:** 45 minutes

---

## Definition of Done

Sprint 4 is complete when:

1. ✅ `src/foundation/layout/` directory deleted
2. ✅ tailwind.config.ts has no theme-* objects
3. ✅ globals.css has no THEME SYSTEM section
4. ✅ `npm run build` succeeds
5. ✅ All `/foundation/*` routes work
6. ✅ No console errors
7. ✅ PR created with changes
8. ✅ ROADMAP.md updated

---

## Sprint 5 Preview: Theme System (If Needed)

If dynamic theme switching becomes a requirement, Sprint 5 would:

| Story | Description | Est. |
|-------|-------------|------|
| 5.1 | Create ThemeProvider context | 30m |
| 5.2 | Implement JSON theme loader | 20m |
| 5.3 | Add theme-* tokens to Tailwind (correctly inside colors) | 15m |
| 5.4 | Create useTheme hook | 15m |
| 5.5 | Migrate one Foundation console | 30m |
| 5.6 | Add theme switcher UI | 20m |

**Sprint 5 Total:** ~2-2.5 hours
