# Migration Map: Foundation Theme Integration v1

**Sprint:** 4
**Type:** Deletion/Cleanup
**Est. Changes:** -385 lines

---

## Overview

This sprint removes dead code. No new files, no complex migrations.

```
Phase 1: Verify no hidden imports ──► Phase 2: Delete files ──► Phase 3: Clean config ──► Phase 4: Test
```

---

## Phase 1: Pre-Flight Verification

### 1.1 Confirm Orphaned Status

Before deleting, verify no imports exist:

```bash
# Search for any imports of the layout directory
grep -r "from.*foundation/layout" src/
grep -r "from.*./layout" src/foundation/

# Search for any imports of specific components
grep -r "HUDHeader" src/
grep -r "NavSidebar" src/
grep -r "GridViewport" src/
grep -r "FoundationLayout" src/
```

**Expected Result:** No matches (components are orphaned)

### 1.2 Verify Active System Works

```bash
npm run dev
# Visit http://localhost:3000/foundation
# Confirm dashboard loads
# Visit http://localhost:3000/foundation/narrative
# Confirm console loads
```

---

## Phase 2: Delete Orphaned Files

### 2.1 Delete Layout Directory

```bash
# Remove entire directory
rm -rf src/foundation/layout/
```

**Files Removed:**

| File | Lines |
|------|-------|
| FoundationLayout.tsx | 65 |
| HUDHeader.tsx | 77 |
| NavSidebar.tsx | 129 |
| GridViewport.tsx | 29 |
| index.ts | ~10 |
| **Total** | **~310** |

### 2.2 Verify Build Still Works

```bash
npm run build
```

**Expected:** Build succeeds (no imports to break)

---

## Phase 3: Clean Configuration Files

### 3.1 tailwind.config.ts

**Location:** Root directory
**Action:** Remove theme-* objects from extend block

**Before (lines ~130-165):**
```typescript
extend: {
  colors: { ... },
  
  // ... other extend properties ...

  // ============================================================
  // THEME SYSTEM (CSS variable-driven from ThemeProvider)
  // ============================================================
  'theme-bg': {
    primary: 'var(--theme-bg-primary)',
    secondary: 'var(--theme-bg-secondary)',
    tertiary: 'var(--theme-bg-tertiary)',
    glass: 'var(--theme-bg-glass)',
    overlay: 'var(--theme-bg-overlay)',
  },
  'theme-text': {
    primary: 'var(--theme-text-primary)',
    secondary: 'var(--theme-text-secondary)',
    muted: 'var(--theme-text-muted)',
    accent: 'var(--theme-text-accent)',
    inverse: 'var(--theme-text-inverse)',
  },
  'theme-border': {
    DEFAULT: 'var(--theme-border-default)',
    strong: 'var(--theme-border-strong)',
    accent: 'var(--theme-border-accent)',
    focus: 'var(--theme-border-focus)',
  },
  'theme': {
    success: 'var(--theme-success)',
    warning: 'var(--theme-warning)',
    error: 'var(--theme-error)',
    info: 'var(--theme-info)',
    highlight: 'var(--theme-highlight)',
  },
  'theme-accent': {
    DEFAULT: 'var(--theme-accent-primary)',
    muted: 'var(--theme-accent-primary-muted)',
    secondary: 'var(--theme-accent-secondary)',
    glow: 'var(--theme-accent-glow)',
  },
}
```

**After:**
```typescript
extend: {
  colors: { ... },
  
  // ... other extend properties (fontFamily, spacing, animation, etc.) ...
  
  // THEME SYSTEM removed - was at wrong nesting level
  // See Sprint 5 for proper implementation if needed
}
```

**Lines Removed:** ~35

### 3.2 styles/globals.css

**Location:** styles/globals.css
**Action:** Remove THEME SYSTEM section (lines ~635-677)

**Before (lines 635-677):**
```css
/* ============================================================
   THEME SYSTEM (Declarative JSON-driven theming)
   Tokens are injected dynamically by ThemeProvider.tsx
   ============================================================ */
:root {
  /* Background tokens */
  --theme-bg-primary: #ffffff;
  --theme-bg-secondary: #f8fafc;
  --theme-bg-tertiary: #f1f5f9;
  --theme-bg-glass: rgba(255, 255, 255, 0.7);
  --theme-bg-overlay: rgba(0, 0, 0, 0.5);

  /* Text tokens */
  --theme-text-primary: #0f172a;
  --theme-text-secondary: #334155;
  --theme-text-muted: #64748b;
  --theme-text-accent: #10b981;
  --theme-text-inverse: #f8fafc;

  /* Border tokens */
  --theme-border-default: #e2e8f0;
  --theme-border-strong: #94a3b8;
  --theme-border-accent: #10b981;
  --theme-border-focus: #10b981;

  /* Semantic tokens */
  --theme-success: #10b981;
  --theme-warning: #f59e0b;
  --theme-error: #ef4444;
  --theme-info: #06b6d4;
  --theme-highlight: #34d399;

  /* Accent tokens */
  --theme-accent-primary: #10b981;
  --theme-accent-primary-muted: rgba(16, 185, 129, 0.1);
  --theme-accent-secondary: #06b6d4;
  --theme-accent-glow: rgba(16, 185, 129, 0.5);
}
```

**After:** Section deleted entirely (40 lines removed)

---

## Phase 4: Verification

### 4.1 Build Check

```bash
npm run build
```

**Expected:** Build succeeds, no errors

### 4.2 Type Check

```bash
npx tsc --noEmit
```

**Expected:** No TypeScript errors

### 4.3 Visual Verification

```bash
npm run dev
```

| Route | Expected |
|-------|----------|
| `/foundation` | Dashboard with grid of console cards |
| `/foundation/narrative` | NarrativeArchitect console |
| `/foundation/health` | HealthDashboard with status cards |
| `/foundation/engagement` | EngagementBridge console |

### 4.4 Console Check

Open browser DevTools console. Expected: No errors about missing classes or undefined variables.

---

## Rollback Plan

If issues discovered:

```bash
# Restore deleted directory
git checkout HEAD -- src/foundation/layout/

# Restore config files
git checkout HEAD -- tailwind.config.ts
git checkout HEAD -- styles/globals.css
```

---

## File Summary

### Deleted Files

| Path | Lines |
|------|-------|
| `src/foundation/layout/FoundationLayout.tsx` | 65 |
| `src/foundation/layout/HUDHeader.tsx` | 77 |
| `src/foundation/layout/NavSidebar.tsx` | 129 |
| `src/foundation/layout/GridViewport.tsx` | 29 |
| `src/foundation/layout/index.ts` | ~10 |

### Modified Files

| Path | Action | Lines Changed |
|------|--------|---------------|
| `tailwind.config.ts` | Remove theme-* objects | -35 |
| `styles/globals.css` | Remove THEME SYSTEM section | -40 |

### Total Impact

| Metric | Value |
|--------|-------|
| Files deleted | 5 |
| Files modified | 2 |
| Lines removed | ~385 |
| Lines added | 0 |
| Net | **-385 lines** |

---

## Commit Message

```
chore(foundation): remove orphaned theme system infrastructure

WHAT:
- Delete src/foundation/layout/ (310 lines, unused)
- Remove broken theme-* tokens from tailwind.config.ts
- Remove unused theme fallbacks from globals.css

WHY:
- Layout files were never imported (FoundationWorkspace is used instead)
- Theme tokens at wrong Tailwind nesting level (never generated classes)
- No ThemeProvider exists despite CSS comments claiming it does
- Foundation works correctly with workspace tokens

IMPACT:
- -385 lines of dead/broken code
- Cleaner config files
- No functional changes to /foundation routes

NEXT:
- Sprint 5 can implement proper theme system if needed
- See docs/sprints/foundation-theme-integration-v1/ARCHITECTURE.md

Closes #XX
```
