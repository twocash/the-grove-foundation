# Architecture Decisions: Foundation Theme Integration v1

**Sprint:** 4
**Date:** 2024-12-24

---

## Context

The codebase evolved through multiple styling approaches:

1. **Original:** Hardcoded colors in components
2. **Sprint 1-3 (Chat):** `--chat-*` CSS variables with Tailwind integration
3. **Attempted:** `--theme-*` system (never completed, now orphaned)
4. **Current Foundation:** Workspace tokens (surface-*, border-*, slate-*)

This sprint cleans up the incomplete attempt (#3) while preserving what works.

---

## ADR-001: Delete Orphaned Layout Files

### Status
**ACCEPTED**

### Context
`src/foundation/layout/` contains 310 lines of components that:
- Use broken `theme-*` Tailwind classes
- Are not imported by any route
- Duplicate functionality already in `FoundationWorkspace.tsx`

### Decision
Delete the entire `src/foundation/layout/` directory rather than fix it.

### Rationale
1. **Zero usage** - routes.tsx imports FoundationWorkspace, not FoundationLayout
2. **Working alternative exists** - FoundationWorkspace + FoundationHeader + FoundationNav work correctly
3. **Fixing is more work** - Would require moving theme-* into colors AND converting components
4. **YAGNI** - No current use case for the holodeck aesthetic

### Consequences
- ✅ 310 lines of dead code removed
- ✅ No more confusing parallel systems
- ⚠️ If holodeck aesthetic needed later, will need to rebuild from scratch
- ✅ Clear path forward for Sprint 5 theme system

---

## ADR-002: Remove Broken Tailwind Theme Tokens

### Status
**ACCEPTED**

### Context
tailwind.config.ts has theme tokens at the wrong nesting level:

```typescript
extend: {
  colors: { ... },
  'theme-bg': { ... },  // ❌ Should be inside colors
}
```

This generates no utility classes—the config is effectively broken.

### Decision
Remove the broken theme-* objects from Tailwind config entirely.

### Alternatives Considered

| Option | Effort | Result |
|--------|--------|--------|
| **A: Delete (chosen)** | 5 min | Clean config, no unused tokens |
| B: Move inside colors | 5 min | Working tokens, but no consumers |
| C: Leave broken | 0 | Continued confusion |

### Rationale
Option A is simplest. If theme switching is needed (Sprint 5), we'll implement correctly from scratch with:
- ThemeProvider context
- JSON theme loading
- Proper Tailwind integration

### Consequences
- ✅ Tailwind config is clean and correct
- ✅ No orphaned token definitions
- ⚠️ Sprint 5 starts from clean slate (not a negative)

---

## ADR-003: Remove globals.css Theme Fallbacks

### Status
**ACCEPTED**

### Context
globals.css lines 640-677 define CSS variable fallbacks:

```css
:root {
  --theme-bg-primary: #ffffff;
  --theme-text-accent: #10b981;
  /* ... */
}
```

These exist but:
1. No Tailwind classes reference them (broken config)
2. No ThemeProvider updates them
3. No components use inline var() references

### Decision
Remove the entire THEME SYSTEM section from globals.css.

### Rationale
Dead code. The comment claims "Tokens are injected dynamically by ThemeProvider.tsx" but no such component exists.

### Consequences
- ✅ 40 lines of unused CSS removed
- ✅ globals.css is honest about what it contains
- ⚠️ Sprint 5 must re-add if theme switching is implemented

---

## ADR-004: Preserve Existing Color Tokens

### Status
**ACCEPTED**

### Context
tailwind.config.ts defines multiple token groups:

```typescript
colors: {
  primary: '#4d7c0f',           // Grove green - USED
  'surface-light': '#ffffff',    // Cards - USED
  obsidian: { ... },             // Holodeck - UNUSED
  holo: { ... },                 // Holodeck - UNUSED
}
```

### Decision
Keep obsidian and holo tokens defined but unused.

### Rationale
1. **Not broken** - They generate valid Tailwind classes
2. **Low cost** - ~20 lines of config
3. **Future value** - Could be useful for Foundation dark mode
4. **No confusion** - They're clearly scoped (obsidian, holo prefixes)

### Consequences
- ✅ Future Foundation dark mode has colors ready
- ⚠️ Slight config bloat (~20 lines)
- ✅ No need to re-define if wanted later

---

## ADR-005: Sprint 5 Theme System Architecture

### Status
**PROPOSED** (for Sprint 5, not this sprint)

### Context
If dynamic theme switching is needed, the correct architecture is:

### Proposed Structure

```
src/core/theme/
├── ThemeProvider.tsx      # React context + CSS injection
├── ThemeLoader.ts         # Load from data/themes/*.json
├── useTheme.ts            # Consumer hook
└── types.ts               # ThemeConfig interface

data/themes/
├── foundation-quantum.theme.json  # Dark holodeck
├── surface.theme.json             # Light paper
└── terminal.theme.json            # Terminal aesthetic
```

### Implementation Pattern

```typescript
// ThemeProvider.tsx
function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('surface');
  
  useEffect(() => {
    const theme = await loadTheme(themeId);
    injectCSSVariables(theme.tokens);
  }, [themeId]);
  
  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Inject as CSS variables on :root
function injectCSSVariables(tokens: Record<string, string>) {
  Object.entries(tokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--theme-${key}`, value);
  });
}
```

### Tailwind Integration

```typescript
// tailwind.config.ts (Sprint 5)
extend: {
  colors: {
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

**Key:** Tokens go INSIDE colors object, not as siblings.

### Consequences (if implemented)
- ✅ Dynamic theme switching works
- ✅ JSON-driven, non-developer configurable
- ⚠️ ~200 lines of new infrastructure
- ⚠️ Must convert components to use theme-* tokens

---

## Token Architecture Summary

### After Sprint 4

| Namespace | Scope | Status |
|-----------|-------|--------|
| `--grove-*` | Workspace shell | ✅ Active |
| `--chat-*` | Terminal/chat | ✅ Active |
| `surface-*`, `border-*` | Foundation | ✅ Active |
| `slate-*`, `primary` | Shared | ✅ Active |
| `obsidian`, `holo` | Future holodeck | 🔮 Defined, unused |
| `--theme-*` | — | ❌ Removed |

### After Sprint 5 (if implemented)

| Namespace | Scope | Status |
|-----------|-------|--------|
| `--grove-*` | Workspace shell | ✅ Active |
| `--chat-*` | Terminal/chat | ✅ Active |
| `--theme-*` | Dynamic theming | ✅ Active |
| `surface-*` | — | ⚠️ Migrate to theme-* |

---

## References

- Sprint 1: Chat Column Unification (PR #34)
- Sprint 3: Workspace Inspectors v1 (PR #35)
- tailwind.config.ts: Lines 130-165 (to remove)
- globals.css: Lines 635-677 (to remove)
