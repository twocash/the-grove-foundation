# Execution Prompt: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024  
**Handoff To:** Claude Code CLI

---

## Context

You are implementing a declarative theme system for the Grove Foundation project. This system loads visual styling from JSON configuration files at runtime, following the Trellis Architecture's DEX standard.

**CRITICAL CONSTRAINT:** The Genesis demo (paper aesthetic at `/`) must remain COMPLETELY UNCHANGED. Do not modify any files in `src/surface/`.

**CONFIRMED:** Include Space Grotesk font for Foundation Quantum theme.

---

## Repository Location

```bash
cd C:/GitHub/the-grove-foundation
```

---

## Pre-Execution Checklist

```bash
git status              # Clean working directory
npm install             # Dependencies installed
npm run build           # Build succeeds
npm run dev             # Dev server works
```

---

## Phase 1: Create Theme Infrastructure

### 1.1 Create directories

```bash
mkdir -p src/theme
mkdir -p data/themes/custom
```

### 1.2 Create src/theme/tokens.ts

```typescript
export type Surface = 'marketing' | 'genesis' | 'foundation' | 'terminal' | 'global';
export type Mode = 'light' | 'dark';

export interface TokenSet {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    glass: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    inverse: string;
  };
  border: {
    default: string;
    strong: string;
    accent: string;
    focus: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
    highlight: string;
  };
  accent: {
    primary: string;
    primaryMuted: string;
    secondary: string;
    glow: string;
  };
}

export interface Typography {
  display: string[];
  body: string[];
  mono: string[];
  ui: string[];
}

export interface Effects {
  grain: boolean;
  glow: boolean;
  gridOverlay: boolean;
  glassmorphism: boolean;
  scanlines: boolean;
}

export interface Theme {
  id: string;
  name: string;
  version: string;
  extends?: string;
  surfaces: Surface[];
  tokens: Partial<TokenSet>;
  modes?: {
    light?: Partial<TokenSet>;
    dark?: Partial<TokenSet>;
  };
  typography?: Typography;
  effects?: Effects;
}

export interface ResolvedTokens extends TokenSet {}
export interface TokenOverrides { [path: string]: string; }
```

### 1.3 Create src/theme/defaults.ts

```typescript
import type { TokenSet, Typography, Effects } from './tokens';

export const defaultTokens: TokenSet = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    glass: 'rgba(255, 255, 255, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#334155',
    muted: '#64748b',
    accent: '#10b981',
    inverse: '#f8fafc',
  },
  border: {
    default: '#e2e8f0',
    strong: '#94a3b8',
    accent: '#10b981',
    focus: '#10b981',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    highlight: '#34d399',
  },
  accent: {
    primary: '#10b981',
    primaryMuted: 'rgba(16, 185, 129, 0.1)',
    secondary: '#06b6d4',
    glow: 'rgba(16, 185, 129, 0.5)',
  },
};

export const defaultTypography: Typography = {
  display: ['Space Grotesk', 'Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
  ui: ['Inter', 'sans-serif'],
};

export const defaultEffects: Effects = {
  grain: false,
  glow: false,
  gridOverlay: false,
  glassmorphism: false,
  scanlines: false,
};
```

### 1.4 Create src/theme/constants.ts

```typescript
import type { Surface } from './tokens';

export const THEME_MAP: Record<Surface, string> = {
  marketing: '/data/themes/surface.theme.json',
  genesis: '/data/themes/surface.theme.json',
  foundation: '/data/themes/foundation-quantum.theme.json',
  terminal: '/data/themes/terminal.theme.json',
  global: '/data/themes/surface.theme.json',
};

export function detectSurface(pathname: string): Surface {
  if (pathname.startsWith('/foundation')) return 'foundation';
  if (pathname.startsWith('/terminal')) return 'terminal';
  if (pathname === '/') return 'genesis';
  return 'marketing';
}
```

### 1.5 Create src/theme/ThemeResolver.ts

Implement theme loading with:
- Async fetch from /data/themes/*.json
- In-memory caching
- Inheritance resolution via `extends` field
- Fallback to defaults on error
- Deep merge for token resolution

### 1.6 Create src/theme/ThemeProvider.tsx

Implement React context with:
- Surface detection from useLocation()
- Mode state with localStorage persistence
- CSS custom property injection to :root
- Token resolution per current mode

### 1.7 Create src/theme/useTheme.ts

```typescript
import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### 1.8 Create src/theme/index.ts

```typescript
export { ThemeProvider, useTheme } from './ThemeProvider';
export { ThemeResolver } from './ThemeResolver';
export { detectSurface, THEME_MAP } from './constants';
export type * from './tokens';
```

---

## Phase 2: Create Theme JSON Files

### 2.1 Create data/themes/surface.theme.json

Paper aesthetic theme preserving Genesis. Include:
- Paper/cream background colors
- Ink/charcoal text colors
- Tenor Sans / EB Garamond typography
- Grain effect enabled

### 2.2 Create data/themes/foundation-quantum.theme.json

Quantum Grove aesthetic with:
- Dark mode: Near-black backgrounds, emerald/cyan accents
- Light mode: Clean white, same accent palette
- Space Grotesk / Inter typography
- Glow and glassmorphism effects

### 2.3 Create data/themes/terminal.theme.json

Minimal terminal theme (placeholder for Sprint 3).

---

## Phase 3: CSS Integration

### 3.1 Add to styles/globals.css (AFTER existing content)

```css
/* === THEME SYSTEM === */
:root {
  --theme-bg-primary: #ffffff;
  --theme-bg-secondary: #f8fafc;
  --theme-bg-tertiary: #f1f5f9;
  --theme-bg-glass: rgba(255, 255, 255, 0.7);
  --theme-bg-overlay: rgba(0, 0, 0, 0.5);
  
  --theme-text-primary: #0f172a;
  --theme-text-secondary: #334155;
  --theme-text-muted: #64748b;
  --theme-text-accent: #10b981;
  --theme-text-inverse: #f8fafc;
  
  --theme-border-default: #e2e8f0;
  --theme-border-strong: #94a3b8;
  --theme-border-accent: #10b981;
  --theme-border-focus: #10b981;
  
  --theme-success: #10b981;
  --theme-warning: #f59e0b;
  --theme-error: #ef4444;
  --theme-info: #06b6d4;
  --theme-highlight: #34d399;
  
  --theme-accent-primary: #10b981;
  --theme-accent-primary-muted: rgba(16, 185, 129, 0.1);
  --theme-accent-secondary: #06b6d4;
  --theme-accent-glow: rgba(16, 185, 129, 0.5);
}
```

### 3.2 Add to tailwind.config.ts (in theme.extend.colors)

```typescript
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

### 3.3 Update src/App.tsx

```typescript
import { ThemeProvider } from './theme';

// Wrap existing router:
<ThemeProvider>
  <RouterProvider router={router} />
</ThemeProvider>
```

---

## Phase 4: Foundation Component Migration

Replace tokens in Foundation components:

| Old | New |
|-----|-----|
| `bg-obsidian` | `bg-theme-bg-primary` |
| `bg-obsidian-light` | `bg-theme-bg-secondary` |
| `text-holo-cyan` | `text-theme-text-accent` |
| `text-holo-text` | `text-theme-text-primary` |
| `border-holo-border` | `border-theme-border` |
| `border-holo-cyan` | `border-theme-border-accent` |

Files to update:
- `src/foundation/FoundationLayout.tsx`
- `src/foundation/components/MetricCard.tsx`
- `src/foundation/components/GlowButton.tsx`
- `src/foundation/pages/FoundationDashboard.tsx`

---

## Phase 5: Testing

Create tests:
- `tests/e2e/genesis-visual-regression.spec.ts`
- `tests/e2e/theme-loading.spec.ts`
- `tests/e2e/surface-theming.spec.ts`

---

## DO NOT MODIFY

```
src/surface/*
```

---

## Verification

```bash
npm run build           # Compiles
npm test                # Tests pass
npm run dev             # Navigate to /foundation - see Quantum theme
                        # Navigate to / - see paper aesthetic unchanged
```

---

## Success Criteria

- [ ] Foundation shows Quantum Grove aesthetic
- [ ] Genesis shows paper aesthetic (unchanged)
- [ ] Mode toggle works (light/dark)
- [ ] Theme loads from JSON files
- [ ] All tests pass

---

*Execute this prompt in Claude Code CLI*
