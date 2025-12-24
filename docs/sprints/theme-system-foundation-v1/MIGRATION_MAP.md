# Migration Map: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024

---

## Migration Phases

### Phase 1: Infrastructure (Zero Risk)
Create new files only, no modifications.

**Files to CREATE:**
- `src/theme/tokens.ts` — Type definitions
- `src/theme/defaults.ts` — Fallback values
- `src/theme/constants.ts` — Surface mappings
- `src/theme/ThemeResolver.ts` — Theme loading
- `src/theme/ThemeProvider.tsx` — React context
- `src/theme/useTheme.ts` — Consumer hook
- `src/theme/index.ts` — Public exports

### Phase 2: Theme Files (Zero Risk)
Create declarative theme definitions.

**Files to CREATE:**
- `data/themes/_schema.json` — Validation schema
- `data/themes/surface.theme.json` — Paper aesthetic
- `data/themes/foundation-quantum.theme.json` — Quantum aesthetic
- `data/themes/terminal.theme.json` — Terminal workspace
- `data/themes/custom/.gitkeep` — Future user themes

### Phase 3: CSS Integration (Low Risk)
Additive changes only.

**Files to MODIFY:**
- `styles/globals.css` — ADD theme CSS variables (do not modify existing)
- `tailwind.config.ts` — ADD theme-* tokens (do not modify existing)
- `src/App.tsx` — WRAP in ThemeProvider

### Phase 4: Foundation Adoption (Medium Risk)
Update Foundation components to use theme tokens.

**Token Replacement Map:**
| Old Token | New Token |
|-----------|-----------|
| `bg-obsidian` | `bg-theme-bg-primary` |
| `bg-obsidian-light` | `bg-theme-bg-secondary` |
| `text-holo-cyan` | `text-theme-text-accent` |
| `text-holo-text` | `text-theme-text-primary` |
| `border-holo-border` | `border-theme-border` |

**Files to MODIFY:**
- `src/foundation/FoundationLayout.tsx`
- `src/foundation/components/MetricCard.tsx`
- `src/foundation/components/GlowButton.tsx`
- `src/foundation/pages/FoundationDashboard.tsx`
- `components/Admin/NarrativeConsole.tsx`

### Phase 5: Testing (Zero Risk)
Add tests to verify behavior.

**Files to CREATE:**
- `tests/unit/theme/ThemeResolver.test.ts`
- `tests/e2e/theme-loading.spec.ts`
- `tests/e2e/surface-theming.spec.ts`
- `tests/e2e/mode-switching.spec.ts`
- `tests/e2e/genesis-visual-regression.spec.ts`

---

## DO NOT MODIFY (Protected)

```
src/surface/pages/GenesisPage.tsx
src/surface/pages/SurfacePage.tsx
src/surface/components/genesis/*
src/surface/components/ActiveGroveLayout.tsx
src/surface/components/ContentRail.tsx
```

---

## Rollback Plan

```bash
# If anything breaks
git checkout styles/globals.css
git checkout tailwind.config.ts
git checkout src/App.tsx
git checkout src/foundation/
rm -rf src/theme/
rm -rf data/themes/
```

---

## Summary

| Category | Count |
|----------|-------|
| Files to CREATE | 12 |
| Files to MODIFY (additive) | 3 |
| Files to MODIFY (replace tokens) | 5 |
| Files PROTECTED | 10+ |
| Test files to CREATE | 5 |

---

*Migration Map Complete — Proceed to DECISIONS.md*
