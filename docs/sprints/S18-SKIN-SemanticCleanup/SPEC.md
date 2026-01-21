# S18-SKIN-SemanticCleanup Execution Contract

**Codename:** `s18-skin-semanticcleanup`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S17-SKIN-LivingGlass)
**Date:** 2026-01-20
**Branch:** `feat/s18-skin-semanticcleanup`

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Contract Setup |
| **Status** | 🎯 Ready |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-20 |
| **Next Action** | Phase 1 - Success Colors |

---

## Attention Anchor

**We are building:** Complete strangler-fig migration for GroveSkins by replacing hardcoded Tailwind colors with semantic CSS variables.

**Success looks like:**
- Zero hardcoded Tailwind color classes in `src/bedrock/`
- CSS remapping workaround removed from `globals.css` (~180 lines deleted)
- All 4 themes render correctly (quantum-glass, zenith-paper, living-glass, nebula-flux)
- 10 E2E tests passing

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/*

ACTIVE BUILD ZONE — WHERE WE WORK
├── src/bedrock/consoles/ExperienceConsole/*.tsx
├── src/bedrock/consoles/NurseryConsole/*.tsx
├── src/bedrock/consoles/FederationConsole/*.tsx
├── src/bedrock/components/*.tsx
├── src/bedrock/primitives/*.tsx
├── src/bedrock/consoles/PromptWorkshop/*.tsx
└── styles/globals.css (cleanup only)
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Semantic color variables | ✅ Theme JSON controls colors | ✅ Pure CSS | ✅ Theme metadata | ✅ New themes = JSON only |
| Glass neutral variables | ✅ Theme JSON controls neutrals | ✅ Pure CSS | ✅ Theme metadata | ✅ Scales with components |
| CSS workaround removal | ✅ No hidden interception | ✅ N/A | ✅ N/A | ✅ Reduces bundle |

---

## Semantic Variable Reference

### Color Mapping Table

| Hardcoded Tailwind | Semantic Variable | Use Case |
|--------------------|-------------------|----------|
| `text-teal-400`, `text-emerald-400`, `text-green-400` | `var(--semantic-success)` | Success states |
| `bg-teal-*/10`, `bg-emerald-*/20` | `var(--semantic-success)` + opacity | Success backgrounds |
| `border-teal-*`, `border-emerald-*` | `var(--semantic-success)` | Success borders |
| `text-amber-400`, `text-yellow-400`, `text-orange-400` | `var(--semantic-warning)` | Warning states |
| `bg-amber-*/10`, `bg-yellow-*/20` | `var(--semantic-warning)` + opacity | Warning backgrounds |
| `text-red-400`, `text-rose-400` | `var(--semantic-error)` | Error states |
| `bg-red-*/10`, `bg-rose-*/20` | `var(--semantic-error)` + opacity | Error backgrounds |
| `text-blue-400`, `text-cyan-400`, `text-sky-400` | `var(--semantic-info)` | Info states |
| `bg-blue-*/10`, `bg-cyan-*/20` | `var(--semantic-info)` + opacity | Info backgrounds |
| `text-gray-100`, `text-slate-100` | `var(--glass-text-primary)` | Primary text |
| `text-gray-400`, `text-slate-400` | `var(--glass-text-secondary)` | Secondary text |
| `text-gray-500`, `text-slate-500` | `var(--glass-text-muted)` | Muted text |
| `bg-gray-800/*`, `bg-slate-800/*` | `var(--glass-surface)` | Surface backgrounds |
| `bg-gray-900/*`, `bg-slate-900/*` | `var(--glass-void)` | Deep backgrounds |
| `border-gray-*`, `border-slate-*` | `var(--glass-border)` | Borders |

### Inline Style Pattern

Replace Tailwind classes with inline styles using CSS variables:

```tsx
// BEFORE (hardcoded)
<span className="text-teal-400">Connected</span>

// AFTER (semantic)
<span style={{ color: 'var(--semantic-success)' }}>Connected</span>

// OR with className using custom utility
<span className="text-semantic-success">Connected</span>
```

For backgrounds with opacity:
```tsx
// BEFORE
<div className="bg-amber-500/10">Warning</div>

// AFTER
<div style={{ backgroundColor: 'color-mix(in srgb, var(--semantic-warning) 10%, transparent)' }}>Warning</div>

// OR simpler with rgba
<div style={{ backgroundColor: 'var(--semantic-warning)', opacity: 0.1 }}>Warning</div>
```

---

## Execution Architecture

### Phase 1: Success Colors (Green/Teal/Emerald)
**Goal:** Replace all success-state hardcoded colors

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 1a | Grep for teal/emerald/green in src/bedrock/ | List generated |
| 1b | Replace text-teal-*, text-emerald-*, text-green-* | Zero matches |
| 1c | Replace bg-teal-*, bg-emerald-*, bg-green-* | Zero matches |
| 1d | Replace border-teal-*, border-emerald-*, border-green-* | Zero matches |
| 1e | Build verification | `npm run build` passes |

### Phase 2: Warning Colors (Amber/Yellow/Orange)
**Goal:** Replace all warning-state hardcoded colors

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 2a | Grep for amber/yellow/orange in src/bedrock/ | List generated |
| 2b | Replace text-amber-*, text-yellow-*, text-orange-* | Zero matches |
| 2c | Replace bg-amber-*, bg-yellow-*, bg-orange-* | Zero matches |
| 2d | Replace border-amber-*, border-yellow-*, border-orange-* | Zero matches |
| 2e | Build verification | `npm run build` passes |

### Phase 3: Error Colors (Red/Rose)
**Goal:** Replace all error-state hardcoded colors

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 3a | Grep for red/rose in src/bedrock/ | List generated |
| 3b | Replace text-red-*, text-rose-* | Zero matches |
| 3c | Replace bg-red-*, bg-rose-* | Zero matches |
| 3d | Replace border-red-*, border-rose-* | Zero matches |
| 3e | Build verification | `npm run build` passes |

### Phase 4: Info Colors (Blue/Cyan/Sky)
**Goal:** Replace all info-state hardcoded colors

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 4a | Grep for blue/cyan/sky in src/bedrock/ | List generated |
| 4b | Replace text-blue-*, text-cyan-*, text-sky-* | Zero matches |
| 4c | Replace bg-blue-*, bg-cyan-*, bg-sky-* | Zero matches |
| 4d | Replace border-blue-*, border-cyan-*, border-sky-* | Zero matches |
| 4e | Build verification | `npm run build` passes |

### Phase 5: Neutral Colors (Gray/Slate)
**Goal:** Replace all neutral hardcoded colors

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 5a | Grep for gray/slate in src/bedrock/ | List generated |
| 5b | Replace text-gray-*, text-slate-* with glass-text-* | Zero matches |
| 5c | Replace bg-gray-*, bg-slate-* with glass-surface/void | Zero matches |
| 5d | Replace border-gray-*, border-slate-* with glass-border | Zero matches |
| 5e | Build verification | `npm run build` passes |

### Phase 6: CSS Workaround Removal
**Goal:** Delete the CSS interception rules from globals.css

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 6a | Identify remapping section in globals.css | Section marked |
| 6b | Delete Tailwind color class overrides | ~180 lines removed |
| 6c | Delete .bedrock-app color rule if present | Rule removed |
| 6d | Build verification | `npm run build` passes |
| 6e | Visual smoke test | /bedrock renders correctly |

### Phase 7: Verification & Documentation
**Goal:** E2E tests and visual proof

| Sub-phase | Description | Gate |
|-----------|-------------|------|
| 7a | Create E2E test file | Test file exists |
| 7b | Run all E2E tests | 10/10 passing |
| 7c | Screenshot all 4 themes | 4 screenshots captured |
| 7d | Create REVIEW.html | All evidence embedded |
| 7e | Final build verification | `npm run build` passes |

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] Zero hardcoded Tailwind color classes in src/bedrock/ (grep returns empty)
- [ ] CSS workaround removed from globals.css
- [ ] All 10 E2E tests passing
- [ ] All 4 theme screenshots captured
- [ ] REVIEW.html complete with all sections
- [ ] Build passes
- [ ] No console errors on /bedrock

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Hardcoded colors remain in src/bedrock/
- ❌ CSS workaround not removed
- ❌ Any theme renders incorrectly
- ❌ E2E tests fail
- ❌ Build fails

---

## File Inventory (Expected Changes)

### Files to Modify (~68 files)

**ExperienceConsole (~15 files):**
- `src/bedrock/consoles/ExperienceConsole/*.tsx`

**NurseryConsole (~8 files):**
- `src/bedrock/consoles/NurseryConsole/*.tsx`

**FederationConsole (~6 files):**
- `src/bedrock/consoles/FederationConsole/*.tsx`

**Components (~12 files):**
- `src/bedrock/components/*.tsx`

**Primitives (~8 files):**
- `src/bedrock/primitives/*.tsx`

**PromptWorkshop (~5 files):**
- `src/bedrock/consoles/PromptWorkshop/*.tsx`

**CSS Cleanup (1 file):**
- `styles/globals.css`

### Files to Create

- `tests/e2e/s18-semantic-cleanup.spec.ts`
- `docs/sprints/s18-skin-semanticcleanup/REVIEW.html`
- `docs/sprints/s18-skin-semanticcleanup/screenshots/*.png` (4 theme screenshots)

---

## Verification Commands

```bash
# Check for remaining hardcoded colors
grep -r "text-teal-\|text-emerald-\|text-amber-\|text-red-\|text-blue-\|text-gray-\|text-slate-" src/bedrock/ --include="*.tsx"

# Check for remaining background colors
grep -r "bg-teal-\|bg-emerald-\|bg-amber-\|bg-red-\|bg-blue-\|bg-gray-\|bg-slate-" src/bedrock/ --include="*.tsx"

# Check for remaining border colors
grep -r "border-teal-\|border-emerald-\|border-amber-\|border-red-\|border-blue-\|border-gray-\|border-slate-" src/bedrock/ --include="*.tsx"

# Build verification
npm run build

# Run E2E tests
npx playwright test tests/e2e/s18-semantic-cleanup.spec.ts --project=e2e
```

---

## Environment Requirements

- Node.js 20+
- Playwright installed for E2E tests
- All 4 theme JSON files present in `src/bedrock/themes/`

---

## Reference Files

- USER_STORIES.md - Detailed acceptance criteria
- EXECUTION_PROMPT.md - Developer handoff prompt
- Fix Queue source: Notion page 2ee780a7-8eef-81fe-b884-c0929392b92d

---

*This contract is binding. Deviation requires explicit human approval.*
