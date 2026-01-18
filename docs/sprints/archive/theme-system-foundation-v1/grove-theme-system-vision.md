# Grove Theme System Vision

**Document:** Strategic Vision & Technical Specification  
**Date:** December 24, 2024  
**Status:** APPROVED

---

## Executive Summary

This document defines a declarative theme system for the Grove Foundation that enables runtime visual customization through JSON configuration files. The system follows the Trellis Architecture's DEX standard, allowing non-technical users to modify the application's appearance without code changes or recompilation.

**Key Outcomes:**
- Foundation console redesign unblocked (Quantum Grove aesthetic)
- Genesis demo protected (paper aesthetic unchanged)
- Runtime theme switching enabled
- Reality Tuner foundation established
- DEX compliance for styling layer

---

## 1. Current State Analysis

### Existing Token Systems

The codebase contains four parallel styling namespaces:

| Namespace | Purpose | Location |
|-----------|---------|----------|
| `paper-*`, `ink-*`, `grove-*` | Marketing/Genesis | tailwind.config.ts |
| `obsidian-*`, `holo-*` | Foundation console | tailwind.config.ts |
| `terminal-*` | Terminal workspace | tailwind.config.ts |
| CSS custom properties | Workspace effects | globals.css |

### DEX Violations

Current styling is hardcoded in configuration files, violating the Trellis Architecture principle: *"Never hard-code an exploration path. Build the engine that reads the map."*

---

## 2. Target Architecture

### Theme Stack

```
┌─────────────────────────────────────────┐
│         APPLICATION LAYER               │
│  Components use var(--theme-*) tokens   │
├─────────────────────────────────────────┤
│         THEME PROVIDER                  │
│  React Context + CSS Injection          │
├─────────────────────────────────────────┤
│         THEME RESOLVER                  │
│  Loading, Caching, Inheritance          │
├─────────────────────────────────────────┤
│         DECLARATIVE LAYER               │
│  /data/themes/*.theme.json              │
└─────────────────────────────────────────┘
```

### File Structure

```
data/themes/
├── _schema.json                  # Validation schema
├── surface.theme.json            # Marketing/Genesis
├── foundation-quantum.theme.json # Foundation console
├── terminal.theme.json           # Terminal workspace
└── custom/                       # User themes (future)

src/theme/
├── index.ts                      # Public exports
├── ThemeProvider.tsx             # React context
├── ThemeResolver.ts              # Loading logic
├── useTheme.ts                   # Consumer hook
├── tokens.ts                     # TypeScript types
├── defaults.ts                   # Fallback values
└── constants.ts                  # Mappings
```

---

## 3. Theme Schema

### Structure

```typescript
interface Theme {
  id: string;                    // "foundation-quantum"
  name: string;                  // "Quantum Grove"
  version: string;               // "1.0.0"
  extends?: string;              // Parent theme ID
  surfaces: Surface[];           // ["foundation"]
  
  tokens: TokenSet;              // Default tokens
  modes?: {                      // Mode variants
    light?: Partial<TokenSet>;
    dark?: Partial<TokenSet>;
  };
  
  typography?: Typography;
  effects?: Effects;
}
```

### Token Categories

**Background:** primary, secondary, tertiary, glass, overlay  
**Text:** primary, secondary, muted, accent, inverse  
**Border:** default, strong, accent, focus  
**Semantic:** success, warning, error, info, highlight  
**Accent:** primary, primaryMuted, secondary, glow

---

## 4. Example Themes

### Surface Theme (Paper Aesthetic)

```json
{
  "id": "surface",
  "name": "Surface",
  "version": "1.0.0",
  "surfaces": ["marketing", "genesis"],
  "tokens": {
    "background": {
      "primary": "#FAF8F5",
      "secondary": "#F5F0E8"
    },
    "text": {
      "primary": "#2C2416",
      "accent": "#4A7C59"
    }
  },
  "typography": {
    "display": ["Tenor Sans", "Playfair Display", "serif"],
    "body": ["EB Garamond", "Lora", "serif"]
  },
  "effects": {
    "grain": true
  }
}
```

### Foundation Quantum Theme

```json
{
  "id": "foundation-quantum",
  "name": "Quantum Grove",
  "version": "1.0.0",
  "surfaces": ["foundation"],
  "tokens": {
    "background": {
      "primary": "#0a0a0f",
      "secondary": "#12121a",
      "glass": "rgba(16, 185, 129, 0.05)"
    },
    "text": {
      "primary": "#e2e8f0",
      "accent": "#34d399"
    },
    "accent": {
      "primary": "#10b981",
      "glow": "rgba(16, 185, 129, 0.4)"
    }
  },
  "modes": {
    "light": {
      "background": {
        "primary": "#ffffff",
        "secondary": "#f8fafc"
      },
      "text": {
        "primary": "#0f172a"
      }
    }
  },
  "typography": {
    "display": ["Space Grotesk", "Inter", "sans-serif"],
    "body": ["Inter", "sans-serif"],
    "mono": ["JetBrains Mono", "monospace"]
  },
  "effects": {
    "glow": true,
    "glassmorphism": true
  }
}
```

---

## 5. CSS Variable Mapping

```css
/* Pattern: --theme-{category}-{token} */

--theme-bg-primary
--theme-bg-secondary
--theme-bg-tertiary
--theme-bg-glass
--theme-bg-overlay

--theme-text-primary
--theme-text-secondary
--theme-text-muted
--theme-text-accent
--theme-text-inverse

--theme-border-default
--theme-border-strong
--theme-border-accent
--theme-border-focus

--theme-success
--theme-warning
--theme-error
--theme-info
--theme-highlight

--theme-accent-primary
--theme-accent-primary-muted
--theme-accent-secondary
--theme-accent-glow
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
}
```

**Usage:**
```tsx
<div className="bg-theme-bg-primary text-theme-text-accent">
  Themed content
</div>
```

---

## 7. Surface Detection

```typescript
function detectSurface(pathname: string): Surface {
  if (pathname.startsWith('/foundation')) return 'foundation';
  if (pathname.startsWith('/terminal')) return 'terminal';
  if (pathname === '/') return 'genesis';
  return 'marketing';
}
```

ThemeProvider automatically loads the appropriate theme based on the current route.

---

## 8. Future Vision: Reality Tuner

The Reality Tuner transforms from a read-only inspector to a full theme editor:

**Sprint 1 (Current):** Infrastructure + read-only preview  
**Sprint 4 (Future):** Live editing, export, custom themes

### Capabilities Unlocked

| Capability | Before | After |
|------------|--------|-------|
| Change Foundation colors | Code deploy | JSON edit + refresh |
| A/B test themes | Feature flags | Load different file |
| User customization | Not possible | Custom theme upload |
| Dark mode per surface | Hardcoded | Theme variant |

---

## 9. 4-Layer UI Configuration Architecture

The theme system is Layer 1 of a broader declarative UI stack:

```
LAYER 4: EXPERIENCE SCHEMAS (Future)
└── Journey definitions, lens behaviors, interaction patterns

LAYER 3: COMPONENT SCHEMAS (Future)
└── Card layouts, grid configurations, animation presets

LAYER 2: CONTENT SCHEMAS (Existing)
└── Corpus definitions, node types, relationships

LAYER 1: THEME SCHEMAS (This Sprint)
└── Colors, typography, effects, animations
```

### The DEX Promise

When complete: *"Can a non-technical domain expert alter behavior by editing a schema file, without recompiling the application?"*

**Answer:** Yes, for each layer.

---

## 10. Migration Strategy

### Phase 1: Infrastructure (Zero Risk)
Create new files only, no modifications to existing code.

### Phase 2: CSS Integration (Low Risk)
Additive changes to globals.css and tailwind.config.ts.

### Phase 3: Foundation Adoption (Medium Risk)
Replace obsidian/holo tokens with theme-* tokens in Foundation components.

### Phase 4: Genesis Protected
Genesis pages remain unchanged. Paper aesthetic preserved exactly.

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Theme load time | < 50ms |
| Genesis visual diff | < 0.1% |
| Test coverage | > 80% |
| Bundle impact | < 5KB |

---

## 12. Sprint Roadmap

**Sprint 1:** theme-system-foundation-v1 (Current)
- Theme infrastructure
- Foundation Quantum aesthetic

**Sprint 2:** foundation-component-refactor-v1
- ModuleLayout patterns
- Component standardization

**Sprint 3:** terminal-theme-adoption-v1
- Terminal workspace theming

**Sprint 4:** reality-tuner-v1
- Full visual theme editor

**Sprint 5+:** component-schema-v1
- Declarative component layouts

---

*Vision Document Complete — Reference for strategic context*
