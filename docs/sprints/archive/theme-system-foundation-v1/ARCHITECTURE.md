# Architecture: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024  
**Status:** APPROVED

---

## 1. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Genesis   │    │  Terminal   │    │ Foundation  │    │   Future    │  │
│  │   Surface   │    │  Workspace  │    │   Console   │    │  Surfaces   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         └──────────────────┴────────┬─────────┴──────────────────┘         │
│                          ┌──────────▼──────────┐                           │
│                          │   ThemeProvider     │                           │
│                          │   (React Context)   │                           │
│                          └──────────┬──────────┘                           │
│                          ┌──────────▼──────────┐                           │
│                          │   ThemeResolver     │                           │
│                          │   (Runtime Loader)  │                           │
│                          └──────────┬──────────┘                           │
├──────────────────────────────────────┼──────────────────────────────────────┤
│                          ┌──────────▼──────────┐   DECLARATIVE LAYER       │
│                          │   /data/themes/     │                           │
│                          │   *.theme.json      │                           │
│                          └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. File Structure

### New Files to Create

```
the-grove-foundation/
├── data/
│   └── themes/                           # NEW DIRECTORY
│       ├── _schema.json                  # JSON Schema definition
│       ├── surface.theme.json            # Marketing/Genesis theme
│       ├── foundation-quantum.theme.json # Foundation console theme
│       ├── terminal.theme.json           # Terminal workspace theme
│       └── custom/                       # Future: user themes
│           └── .gitkeep
│
├── src/
│   └── theme/                            # NEW DIRECTORY
│       ├── index.ts                      # Public exports
│       ├── ThemeProvider.tsx             # React context provider
│       ├── ThemeResolver.ts              # Theme loading/resolution
│       ├── useTheme.ts                   # Consumer hook
│       ├── tokens.ts                     # TypeScript types
│       ├── defaults.ts                   # Fallback values
│       └── constants.ts                  # Theme mappings
```

---

## 3. Data Schemas

### Theme Interface

```typescript
interface Theme {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  version: string;               // Semantic version
  extends?: string;              // Parent theme ID
  surfaces: Surface[];           // Where this theme applies
  tokens: TokenSet;              // Default tokens
  modes?: {                      // Mode-specific overrides
    light?: Partial<TokenSet>;
    dark?: Partial<TokenSet>;
  };
  typography?: Typography;
  effects?: Effects;
}

interface TokenSet {
  background: { primary, secondary, tertiary, glass, overlay };
  text: { primary, secondary, muted, accent, inverse };
  border: { default, strong, accent, focus };
  semantic: { success, warning, error, info, highlight };
  accent: { primary, primaryMuted, secondary, glow };
}
```

---

## 4. CSS Variable Naming

```css
/* Pattern: --theme-{category}-{token} */

--theme-bg-primary
--theme-bg-secondary
--theme-text-primary
--theme-text-accent
--theme-border-default
--theme-success
--theme-accent-primary
--theme-accent-glow
--font-display
--font-body
--font-mono
```

---

## 5. Surface Detection

```typescript
function detectSurface(pathname: string): Surface {
  if (pathname.startsWith('/foundation')) return 'foundation';
  if (pathname.startsWith('/terminal')) return 'terminal';
  if (pathname === '/') return 'genesis';
  return 'marketing';
}
```

---

## 6. Tailwind Integration

```typescript
// tailwind.config.ts additions
colors: {
  'theme-bg': {
    primary: 'var(--theme-bg-primary)',
    secondary: 'var(--theme-bg-secondary)',
    // ...
  },
  'theme-text': {
    primary: 'var(--theme-text-primary)',
    accent: 'var(--theme-text-accent)',
    // ...
  },
  // Existing tokens PRESERVED
  paper: { /* unchanged */ },
  ink: { /* unchanged */ },
  grove: { /* unchanged */ },
}
```

---

## 7. Typography (Space Grotesk Confirmed)

Foundation Quantum theme will use:
- **Display:** Space Grotesk, Inter, sans-serif
- **Body:** Inter, sans-serif
- **Mono:** JetBrains Mono, monospace

Surface/Genesis theme preserves:
- **Display:** Tenor Sans, Playfair Display, sans-serif
- **Body:** EB Garamond, Lora, serif

---

## 8. DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| Declarative Sovereignty | Theme behavior in JSON files |
| Capability Agnosticism | Works without any theme files (defaults) |
| Provenance | Theme files include version |
| Organic Scalability | Start with 3 themes, add more as needed |

**The Test:** Can a non-technical user change Foundation colors by editing JSON?  
**Answer:** Yes — edit foundation-quantum.theme.json, refresh, done.

---

*Architecture Complete — Proceed to MIGRATION_MAP.md*
