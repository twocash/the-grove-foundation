# Sprints: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024  
**Estimated Duration:** 4 days

---

## Pre-Sprint Checklist

- [ ] Capture Genesis visual baseline
- [ ] Confirm Space Grotesk font available

```bash
npx playwright test --update-snapshots tests/e2e/genesis-baseline.spec.ts
```

---

## Epic 1: Theme Infrastructure

### Story 1.1: TypeScript Type Definitions
**Files:** CREATE `src/theme/tokens.ts`
**Acceptance:** All theme types defined, build succeeds

### Story 1.2: Default Values and Constants
**Files:** CREATE `src/theme/defaults.ts`, `src/theme/constants.ts`
**Acceptance:** Defaults cover all values, surface detection works

### Story 1.3: ThemeResolver Implementation
**Files:** CREATE `src/theme/ThemeResolver.ts`
**Tests:** `tests/unit/theme/ThemeResolver.test.ts`
**Acceptance:** Loads themes, handles errors, caches results

### Story 1.4: ThemeProvider Implementation
**Files:** CREATE `src/theme/ThemeProvider.tsx`, `src/theme/useTheme.ts`
**Acceptance:** Context works, CSS injection works, mode switching works

### Story 1.5: Public Exports
**Files:** CREATE `src/theme/index.ts`
**Acceptance:** Clean barrel file exports

### Build Gate: Epic 1
```bash
npm run build
npm test
```

---

## Epic 2: Theme JSON Files

### Story 2.1: JSON Schema
**Files:** CREATE `data/themes/_schema.json`

### Story 2.2: Surface Theme (Paper)
**Files:** CREATE `data/themes/surface.theme.json`
**Acceptance:** Paper/ink colors, EB Garamond typography, grain effect

### Story 2.3: Foundation Quantum Theme
**Files:** CREATE `data/themes/foundation-quantum.theme.json`
**Acceptance:** Light/dark modes, Space Grotesk typography, glow effects

### Story 2.4: Terminal Theme
**Files:** CREATE `data/themes/terminal.theme.json`

### Story 2.5: Custom Directory
**Files:** CREATE `data/themes/custom/.gitkeep`

### Build Gate: Epic 2
```bash
node -e "require('./data/themes/surface.theme.json')"
node -e "require('./data/themes/foundation-quantum.theme.json')"
```

---

## Epic 3: CSS Integration

### Story 3.1: CSS Custom Properties
**Files:** MODIFY `styles/globals.css` (ADDITIVE)
**Acceptance:** All --theme-* variables in :root

### Story 3.2: Tailwind Token Extension
**Files:** MODIFY `tailwind.config.ts` (ADDITIVE)
**Acceptance:** theme-bg-*, theme-text-* utilities work

### Story 3.3: App Provider Integration
**Files:** MODIFY `src/App.tsx`
**Acceptance:** ThemeProvider wraps router, no console errors

### Build Gate: Epic 3
```bash
npm run build
npm run dev
```

---

## Epic 4: Foundation Component Adoption

### Story 4.1: FoundationLayout Migration
**Files:** MODIFY `src/foundation/FoundationLayout.tsx`
**Token Replacements:**
- bg-obsidian → bg-theme-bg-primary
- text-holo-cyan → text-theme-text-accent
- border-holo-border → border-theme-border

### Story 4.2: MetricCard Component
**Files:** MODIFY `src/foundation/components/MetricCard.tsx`

### Story 4.3: GlowButton Component
**Files:** MODIFY `src/foundation/components/GlowButton.tsx`

### Story 4.4: Additional Components
**Files:** MODIFY remaining Foundation components

### Build Gate: Epic 4
```bash
npm run build
npx playwright test tests/e2e/surface-theming.spec.ts
```

---

## Epic 5: Testing & Validation

### Story 5.1: Genesis Visual Regression
**Files:** CREATE `tests/e2e/genesis-visual-regression.spec.ts`
**Acceptance:** Visual diff < 0.1%

### Story 5.2: Mode Switching Tests
**Files:** CREATE `tests/e2e/mode-switching.spec.ts`

### Story 5.3: Surface Theming Tests
**Files:** CREATE `tests/e2e/surface-theming.spec.ts`

### Story 5.4: Fallback Behavior Tests
**Files:** UPDATE `tests/unit/theme/ThemeResolver.test.ts`

### Build Gate: Epic 5 (FINAL)
```bash
npm test
npx playwright test
npm run build
```

---

## Epic 6: Documentation

### Story 6.1: Theme Usage Guide
**Files:** CREATE `docs/themes/USAGE.md`

### Story 6.2: Token Reference
**Files:** CREATE `docs/themes/TOKEN_REFERENCE.md`

---

## Commit Sequence

```
feat: add theme type definitions
feat: add theme defaults and constants
feat: implement ThemeResolver
feat: implement ThemeProvider and useTheme
feat: add theme public exports
feat: add theme JSON schema
feat: add surface theme (paper aesthetic)
feat: add foundation quantum theme
feat: add terminal theme
feat: add theme CSS custom properties
feat: extend Tailwind with theme tokens
feat: integrate ThemeProvider in App
refactor: migrate FoundationLayout to theme tokens
refactor: migrate Foundation components to theme tokens
test: add genesis visual regression test
test: add theme system tests
docs: add theme documentation
```

---

*Sprints Complete — Proceed to EXECUTION_PROMPT.md*
