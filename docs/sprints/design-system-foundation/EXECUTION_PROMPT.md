# Execution Prompt: Design System Foundation

**Sprint:** design-system-foundation  
**For:** Claude Code CLI  
**Time Budget:** 6-8 hours

---

## Pre-Flight Checklist

```bash
cd C:\GitHub\the-grove-foundation
git pull origin main
pnpm install
pnpm build  # Must pass
```

**Verify Sprint 7.1 merged:**
- `src/surface/components/GroveObjectCard/HubContent.tsx` exists
- `normalizeHub` function exists in `useGroveObjects.ts`

---

## Context

You are implementing the Grove Glass design system—a cohesive visual language extracted from the Trellis mock. This sprint adds tokens and utility classes to `globals.css`, then updates `CardShell` to use them.

**Design philosophy:** Dark, layered, alive. Glass panels with subtle blur. Neon accents for state. Monospace for system text.

**Reference:** `docs/design-system/DESIGN_SYSTEM.md`

---

## Step 1: Add Grove Glass Tokens to globals.css

**File:** `styles/globals.css`

Add the complete Grove Glass token system after the existing card tokens section.

**Key sections to add:**
1. Background tokens (void, glass variants)
2. Neon accent colors (green, cyan, amber)
3. Text hierarchy (slate scale)
4. Border tokens
5. Glow effects
6. Animation timing

**Then add utility classes:**
1. `.grove-panel` variants (base, solid, interactive)
2. `.grove-badge` variants (active, processing, draft, archived)
3. `.grove-bg-void` and `.grove-grid-bg`
4. `.grove-glow-*` classes
5. `.grove-scrollbar` styling
6. Typography utilities

See MIGRATION_MAP.md Section 1 for exact CSS (~160 lines).

**Verify:** `pnpm build`

---

## Step 2: Verify Font Loading

**Check:** `src/app/layout.tsx` or equivalent

Ensure Inter and JetBrains Mono are loading.

**If using Next.js fonts:**
```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'
```

**If not present, add font link to head:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

The `--font-sans` and `--font-mono` CSS variables should already reference these fonts in the existing `@theme` block.

**Verify:** Load app, inspect body font - should be Inter.

---

## Step 3: Update CardShell.tsx

**File:** `src/surface/components/GroveObjectCard/CardShell.tsx`

Replace the current card styling with Grove Glass classes.

**Key changes:**
1. Main container: Use `grove-panel-interactive` class
2. Active state: Use `grove-panel-active` class
3. Inspected state: Use `ring-2 ring-[var(--grove-neon-cyan)]/50`
4. Title: Add `grove-text-primary` with hover transition
5. Status badge: Use `grove-badge` classes

See MIGRATION_MAP.md Section 3 for exact changes.

**Verify:** `pnpm build`

---

## Step 4: Add Status Badge Rendering

If CardShell doesn't already render status badges, add them:

```tsx
{object.meta.status && (
  <span className={cn(
    'grove-badge',
    object.meta.status === 'active' && 'grove-badge-active',
    object.meta.status === 'draft' && 'grove-badge-draft',
    object.meta.status === 'archived' && 'grove-badge-archived',
  )}>
    {object.meta.status}
  </span>
)}
```

**Verify:** `pnpm build`

---

## Manual Test Matrix

| # | Test | Expected |
|---|------|----------|
| 1 | Load page with cards | Glass effect visible |
| 2 | Hover over card | Lifts slightly, border lightens |
| 3 | Click card (inspect) | Cyan ring appears |
| 4 | Card with status="active" | Green badge shows |
| 5 | Card with status="draft" | Amber badge shows |
| 6 | Card with status="archived" | Gray badge shows |
| 7 | Check fonts | Inter for body, JetBrains Mono for mono |
| 8 | Existing pages | No visual regressions |

---

## Troubleshooting

### Backdrop blur not working
- Ensure browser supports `backdrop-filter`
- Check if parent has `overflow: hidden` or transforms
- Safari needs `-webkit-backdrop-filter`

### Fonts not loading
- Check network tab for font requests
- Verify CSS variables are set in `:root` or `@theme`
- Clear browser cache

### Cards look wrong
- Check that `grove-panel-interactive` is applied
- Verify the CSS was added to globals.css
- Check for conflicting styles

### Status badges not colored
- Ensure status value matches exactly ('active', 'draft', 'archived')
- Check that badge classes were added to globals.css

---

## Success Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] Cards have glass panel effect
- [ ] Hover lift works
- [ ] Status badges render with semantic colors
- [ ] Fonts load correctly
- [ ] No regressions on existing pages

---

## Commit Messages

```
feat(design): add Grove Glass design system tokens
feat(design): add glass panel and badge utility classes  
feat(components): update CardShell to use Grove Glass styling
```

---

## Reference Files

- `docs/design-system/DESIGN_SYSTEM.md` — Full token reference
- `docs/sprints/design-system-foundation/SPEC.md` — Requirements
- `docs/sprints/design-system-foundation/MIGRATION_MAP.md` — Exact code

---

*Design system foundation. Glass aesthetic. Additive changes.*
