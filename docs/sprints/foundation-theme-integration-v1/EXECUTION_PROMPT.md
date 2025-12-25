# Execution Prompt: Foundation Theme Integration v1

**Sprint:** 4
**Type:** Technical Debt Cleanup
**Estimated Time:** 45 minutes
**Branch:** `chore/foundation-theme-cleanup`

---

## Pre-Read Checklist

Before starting, read these files in order:

1. `docs/sprints/foundation-theme-integration-v1/REPO_AUDIT.md` — Understand the problem
2. `docs/sprints/foundation-theme-integration-v1/SPEC.md` — Scope and acceptance criteria
3. `docs/sprints/foundation-theme-integration-v1/MIGRATION_MAP.md` — Exact changes to make

---

## Context

The codebase contains orphaned theme infrastructure:
- `src/foundation/layout/` — 310 lines of dead code, never imported
- `tailwind.config.ts` — theme-* tokens at wrong nesting level (don't generate classes)
- `globals.css` — theme CSS variables that nothing uses

The ACTIVE Foundation surface (`FoundationWorkspace.tsx`) uses workspace tokens and works correctly. We're deleting the broken alternative, not fixing it.

---

## Execution Steps

### Step 1: Create Branch

```bash
cd /path/to/the-grove-foundation
git checkout main
git pull origin main
git checkout -b chore/foundation-theme-cleanup
```

### Step 2: Verify Orphaned Status

Confirm no imports exist before deleting:

```bash
# Should return nothing
grep -r "from.*foundation/layout" src/
grep -r "from '\./layout" src/foundation/
grep -rE "(HUDHeader|NavSidebar|GridViewport|FoundationLayout)" src/ --include="*.tsx" --include="*.ts" | grep -v "layout/"
```

**Expected:** No matches outside the layout directory itself.

### Step 3: Delete Layout Directory

```bash
rm -rf src/foundation/layout/
```

**Verify:**
```bash
ls src/foundation/
# Should NOT contain "layout" directory
```

### Step 4: Edit tailwind.config.ts

Open `tailwind.config.ts` and locate the THEME SYSTEM section (~line 130).

**Delete these objects from `extend` block:**

```typescript
// DELETE ALL OF THIS:
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
```

**Keep:** Everything else in the extend block (colors, fontFamily, spacing, animation, keyframes, borderColor).

### Step 5: Edit styles/globals.css

Open `styles/globals.css` and locate the THEME SYSTEM section (~line 635).

**Delete this entire section:**

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

**Keep:** CHAT COLUMN TOKENS section that follows (those are used).

### Step 6: Verify Build

```bash
npm run build
```

**Expected:** Build succeeds with no errors.

```bash
npx tsc --noEmit
```

**Expected:** No TypeScript errors.

### Step 7: Visual Verification

```bash
npm run dev
```

Test these routes:

| Route | Expected |
|-------|----------|
| `/foundation` | Dashboard with console cards |
| `/foundation/narrative` | NarrativeArchitect loads |
| `/foundation/health` | HealthDashboard loads |
| `/foundation/engagement` | EngagementBridge loads |

**Check:** No console errors in browser DevTools.

### Step 8: Commit

```bash
git add -A
git commit -m "chore(foundation): remove orphaned theme system infrastructure

WHAT:
- Delete src/foundation/layout/ (310 lines unused)
- Remove broken theme-* tokens from tailwind.config.ts
- Remove unused theme fallbacks from globals.css

WHY:
- Layout files were never imported (FoundationWorkspace is used)
- Theme tokens at wrong Tailwind nesting level (broken)
- No ThemeProvider exists despite CSS comments

IMPACT:
- -385 lines of dead/broken code
- No functional changes to /foundation routes
- Foundation continues using workspace tokens

See docs/sprints/foundation-theme-integration-v1/"
```

### Step 9: Push and Create PR

```bash
git push -u origin chore/foundation-theme-cleanup
```

Create PR on GitHub:
- **Title:** `chore(foundation): remove orphaned theme system`
- **Body:** Copy commit message
- **Labels:** `tech-debt`, `cleanup`

---

## Verification Checklist

Before marking complete:

- [ ] `src/foundation/layout/` directory deleted
- [ ] tailwind.config.ts has no theme-* objects
- [ ] globals.css has no THEME SYSTEM section
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` succeeds
- [ ] `/foundation` dashboard loads
- [ ] `/foundation/narrative` works
- [ ] `/foundation/health` works
- [ ] No browser console errors
- [ ] PR created

---

## Rollback

If something breaks:

```bash
git checkout main -- src/foundation/layout/
git checkout main -- tailwind.config.ts
git checkout main -- styles/globals.css
```

---

## After PR Merge

Update ROADMAP.md:

```markdown
## Sprint 4: Foundation Theme Integration ✅ COMPLETE

### Summary
Completed YYYY-MM-DD. Removed orphaned theme system infrastructure.

**PR #XX:** https://github.com/twocash/the-grove-foundation/pull/XX

### Delivered
- Deleted `src/foundation/layout/` (310 lines dead code)
- Removed broken theme-* tokens from Tailwind config
- Removed unused theme fallbacks from globals.css
- Foundation continues working with workspace tokens

### Metrics
| Metric | Value |
|--------|-------|
| Files deleted | 5 |
| Files modified | 2 |
| Lines removed | ~385 |
| Lines added | 0 |
| Time | ~45 min |
```

---

## Sprint 5 Setup

If theme switching is needed later, Sprint 5 would implement:

1. `src/core/theme/ThemeProvider.tsx` — Context + CSS injection
2. `src/core/theme/ThemeLoader.ts` — Load from JSON
3. `src/core/theme/useTheme.ts` — Consumer hook
4. Move theme-* tokens INSIDE colors in Tailwind config
5. Migrate Foundation components to use theme tokens

See `ARCHITECTURE.md` ADR-005 for detailed architecture.
