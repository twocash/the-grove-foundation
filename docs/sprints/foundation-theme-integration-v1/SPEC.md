# Specification: Foundation Theme Integration v1

**Sprint:** 4
**Type:** Technical Debt Cleanup
**Est. Time:** 1-1.5 hours
**Owner:** Jim Calhoun

---

## Problem Statement

The codebase contains an incomplete theme system that was partially implemented but never finished. This creates:

1. **300+ lines of orphaned code** in `src/foundation/layout/`
2. **Broken Tailwind config** with theme tokens at wrong nesting level
3. **Confusing architecture** where comments reference non-existent ThemeProvider
4. **Dead CSS** in globals.css that serves no purpose

---

## Sprint Objective

**Clean up the broken theme system infrastructure to eliminate dead code and technical debt.**

This is NOT a feature sprint. We're removing broken code, not building new functionality.

---

## Scope

### In Scope (P0)

| Item | Description | Est. Time |
|------|-------------|-----------|
| Delete orphaned layout files | Remove `src/foundation/layout/` directory | 5 min |
| Clean Tailwind config | Remove theme-* token objects from extend | 10 min |
| Clean globals.css | Remove unused theme variable fallbacks | 10 min |
| Verify Foundation works | Test /foundation routes still render | 5 min |
| Document cleanup | Update architecture notes | 10 min |

### Out of Scope (Sprint 5+)

| Item | Reason |
|------|--------|
| ThemeProvider implementation | Active Foundation works without it |
| Theme JSON loading | Not needed for current user flows |
| Dark mode switching | Can be added when there's a use case |
| obsidian/holo token usage | These can stay defined for future use |

---

## Acceptance Criteria

### Must Have
- [ ] `/foundation` loads without console errors
- [ ] All Foundation consoles render correctly
- [ ] No references to deleted files in remaining code
- [ ] Tailwind build completes without warnings
- [ ] TypeScript compiles without errors

### Should Have
- [ ] globals.css reduced by ~40 lines
- [ ] tailwind.config.ts reduced by ~35 lines
- [ ] No orphaned imports in codebase

### Nice to Have
- [ ] ARCHITECTURE_NOTES.md updated with theme system status

---

## Technical Details

### Files to Delete

```
src/foundation/layout/
├── FoundationLayout.tsx    (65 lines) - DELETE
├── HUDHeader.tsx           (77 lines) - DELETE
├── NavSidebar.tsx          (129 lines) - DELETE
├── GridViewport.tsx        (29 lines) - DELETE
└── index.ts                (~10 lines) - DELETE
```

**Total:** ~310 lines removed

### tailwind.config.ts Changes

**Remove (lines ~130-165):**
```typescript
// These are at wrong nesting level and unused
'theme-bg': { ... },
'theme-text': { ... },
'theme-border': { ... },
'theme': { ... },
'theme-accent': { ... },
```

### globals.css Changes

**Remove (lines ~640-677):**
```css
/* THEME SYSTEM section */
:root {
  --theme-bg-primary: #ffffff;
  --theme-bg-secondary: #f8fafc;
  /* ... all theme fallbacks ... */
}
```

---

## Verification Steps

After changes:

1. `npm run build` - Must complete without errors
2. `npm run dev` - Server starts
3. Visit `/foundation` - Dashboard loads
4. Visit `/foundation/narrative` - Console loads
5. Visit `/foundation/health` - Console loads
6. Check browser console - No missing class warnings

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking Foundation UI | Low | High | Files are confirmed orphaned; not imported |
| Build failure | Low | Medium | Incremental changes; verify after each |
| Missing hidden imports | Low | Low | grep for imports before deleting |

---

## Dependencies

- Sprint 3 complete (PR #35 merged) ✅
- No blocking dependencies

---

## Forward Planning: Sprint 5

### Theme System Architecture (if needed)

Sprint 5 could implement proper theme switching:

```
src/core/theme/
├── ThemeProvider.tsx       # Context provider
├── ThemeLoader.ts          # Loads JSON themes
├── useTheme.ts             # Hook for consumers
└── tokens.ts               # Type definitions

data/themes/
├── foundation-quantum.theme.json  # Already exists
├── surface.theme.json             # Already exists
└── terminal.theme.json            # Already exists
```

### Implementation Pattern

```typescript
// ThemeProvider.tsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<ThemeConfig>();
  
  useEffect(() => {
    // Load theme based on route or preference
    const tokens = theme.tokens;
    
    // Inject CSS variables
    Object.entries(tokens).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });
  }, [theme]);
  
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```

### Tailwind Integration (Correct)

```typescript
// tailwind.config.ts (Sprint 5 - CORRECT structure)
extend: {
  colors: {
    // Existing workspace tokens...
    
    // Theme tokens (inside colors object)
    'theme-bg': {
      primary: 'var(--theme-bg-primary)',
      secondary: 'var(--theme-bg-secondary)',
    },
    'theme-text': {
      primary: 'var(--theme-text-primary)',
      accent: 'var(--theme-text-accent)',
    },
  },
}
```

This generates correct utility classes like `bg-theme-bg-primary`, `text-theme-text-accent`.

---

## Success Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines in /layout | 310 | 0 | -310 |
| tailwind.config.ts | 169 | ~134 | -35 |
| globals.css | 761 | ~720 | -41 |
| Console errors | Variable | 0 | Clean |

---

## Commit Strategy

Single commit:
```
chore(foundation): remove orphaned theme system

- Delete src/foundation/layout/ (310 lines dead code)
- Remove broken theme-* tokens from Tailwind config
- Remove unused theme fallbacks from globals.css
- Foundation uses workspace tokens, not theme system

Closes #XX
```
