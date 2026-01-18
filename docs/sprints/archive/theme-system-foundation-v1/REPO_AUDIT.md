# Repository Audit: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024  
**Auditor:** Claude (Foundation Loop)

---

## 1. Current Architecture Overview

### Directory Structure (Relevant)

```
the-grove-foundation/
├── data/
│   ├── corpus/                    # Content corpus (DEX compliant)
│   ├── journeys/                  # Journey definitions (DEX compliant)
│   └── triggers/                  # Trigger schemas (DEX compliant)
│   # NO /themes/ directory exists
├── src/
│   ├── foundation/                # Admin console components
│   ├── surface/                   # Marketing/Genesis pages
│   ├── terminal/                  # Terminal workspace
│   └── # NO /theme/ directory exists
├── styles/
│   └── globals.css                # All CSS, ~635 lines
├── tailwind.config.ts             # Tailwind configuration, ~132 lines
└── components/
    ├── Terminal/                  # Terminal components
    └── Admin/                     # Foundation admin components
```

### Token Systems Identified

| System | Location | Usage Count | Surface |
|--------|----------|-------------|---------|
| `paper-*`, `ink-*` | tailwind.config.ts | ~50+ refs | Marketing/Genesis |
| `grove-*` | tailwind.config.ts | ~80+ refs | Marketing/Genesis |
| `terminal-*` | tailwind.config.ts | ~20+ refs | Terminal |
| `obsidian-*` | tailwind.config.ts | ~30+ refs | Foundation |
| `holo-*` | tailwind.config.ts | ~25+ refs | Foundation |
| CSS custom props | globals.css | ~40+ refs | All |

---

## 2. DEX Compliance Assessment

### ✅ Currently DEX Compliant

- Corpus content: `/data/corpus/*.json` — Fully declarative
- Journey definitions: `/data/journeys/*.json` — Fully declarative
- Trigger schemas: `/data/triggers/*.json` — Fully declarative
- Lens definitions: Configuration-driven — Good pattern

### ❌ NOT DEX Compliant (Hardcoded)

- Color tokens in `tailwind.config.ts` — Hardcoded hex values
- Typography in `tailwind.config.ts` — Hardcoded font stacks
- Effects in `globals.css` — Hardcoded grain, glow classes
- Surface detection — Component-level, no centralized context
- Mode switching — Scattered, no unified system

---

## 3. Files Requiring Modification

### High Priority (Infrastructure)

| File | Changes Needed |
|------|----------------|
| `tailwind.config.ts` | Add theme token references |
| `styles/globals.css` | Add CSS variable layer |
| `App.tsx` | Wrap in ThemeProvider |

### Medium Priority (Foundation Components)

- `src/foundation/FoundationLayout.tsx` — Replace obsidian/holo tokens
- `src/foundation/components/MetricCard.tsx` — Replace tokens
- `src/foundation/components/GlowButton.tsx` — Replace tokens
- `src/foundation/pages/FoundationDashboard.tsx` — Replace tokens

### DO NOT MODIFY (Genesis Critical)

- `src/surface/pages/GenesisPage.tsx`
- `src/surface/components/genesis/*`
- `src/surface/pages/SurfacePage.tsx`

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Genesis breakage | Low | Critical | DO NOT MODIFY list |
| Token collision | Medium | High | New namespace (theme-*) |
| Runtime errors | Low | Medium | Fallback defaults |

---

## Audit Summary

- **Assessment:** Ready for theme system implementation
- **DEX Violations:** 5 (all in styling layer)
- **Files to Create:** 12 new files
- **Files to Modify:** 8 files
- **Files Protected:** 10+ Genesis/Surface files

*Audit Complete — Proceed to SPEC.md*
