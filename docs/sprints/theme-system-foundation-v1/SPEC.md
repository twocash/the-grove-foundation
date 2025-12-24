# Specification: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024  
**Status:** APPROVED

---

## 1. Overview

### Problem Statement

The Grove's styling is hardcoded in Tailwind configuration and CSS files, violating the Trellis Architecture's DEX standard. This prevents runtime theme switching, A/B testing, user customization, and safe iteration on Foundation console.

### Solution

Implement a declarative theme system where visual styling is defined in JSON configuration files, loaded at runtime, and injected as CSS custom properties.

---

## 2. Goals

| Goal | Success Metric |
|------|----------------|
| DEX compliance for styling | Theme behavior from JSON, not code |
| Foundation redesign unblocked | Can ship Quantum Grove aesthetic |
| Genesis protected | Zero changes to paper aesthetic |
| Runtime switching | Mode toggle works without reload |
| Reality Tuner foundation | Live preview infrastructure ready |

---

## 3. Non-Goals

| Explicitly Out of Scope | Reason |
|------------------------|--------|
| Genesis/Surface migration | Requires separate approval |
| Terminal theme adoption | Separate sprint |
| User custom themes | Future feature |
| Full Reality Tuner UI | Separate sprint |

---

## 4. Acceptance Criteria

### AC1: Theme Infrastructure
- Theme files load from /data/themes/
- CSS custom properties injected into :root
- Components can use var(--theme-*) tokens

### AC2: Surface-Aware Theming
- /foundation loads Quantum Grove theme
- / (Genesis) preserves paper aesthetic unchanged

### AC3: Mode Switching
- Dark/light toggle updates tokens immediately
- No page reload required
- Preference persists in localStorage

### AC4: Fallback Behavior
- App renders with defaults if theme loading fails
- No console errors on fallback

### AC5: Genesis Preservation
- Visual diff < 0.1% compared to baseline
- All paper/ink/grove tokens resolve identically

---

## 5. Technical Requirements

### TR1: Theme Schema
- JSON Schema validation for theme files
- Required: id, name, version, surfaces, tokens
- Optional: modes, extends, typography, effects

### TR2: ThemeProvider
- React Context for theme state
- Surface detection from route
- Mode state with localStorage persistence
- CSS custom property injection

### TR3: ThemeResolver
- Async theme file loading with caching
- Inheritance resolution
- Fallback to defaults on error

### TR4: CSS Integration
- New CSS variables: --theme-bg-*, --theme-text-*, etc.
- Tailwind extension for theme-* utilities
- Coexistence with existing tokens (additive)

---

## 6. Decisions Confirmed

| Question | Decision |
|----------|----------|
| Include Space Grotesk font? | **Yes** |
| Terminal theme scope? | **Sprint 3** |
| Reality Tuner scope? | **Read-only preview** |

---

## 7. Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Infrastructure | 1 day | ThemeProvider, ThemeResolver, types |
| Theme Files | 0.5 day | surface.theme.json, foundation-quantum.theme.json |
| CSS Integration | 0.5 day | globals.css updates, Tailwind config |
| Foundation Adoption | 1 day | FoundationLayout + core components |
| Testing | 0.5 day | E2E tests, visual regression |
| Documentation | 0.5 day | Usage guide, token reference |

**Total:** ~4 days

---

*Specification Complete — Proceed to ARCHITECTURE.md*
