# Grove Execution Contract: S13-BD-LayoutDensity-v1

## Handoff Summary

**Sprint:** S13-BD-LayoutDensity-v1
**Goal:** Implement declarative layout density system for json-render
**Scope:** LayoutConfig interface, Renderer integration, density presets
**Effort:** Medium (1 sprint)
**Dependencies:** None - standalone Bedrock infrastructure

**What We're Building:**
- `LayoutConfig` TypeScript interface with density presets
- `layout` prop on Renderer component
- Three density presets: compact, comfortable, spacious
- Token override capability
- Migration guide for existing CSS hacks

**What We're NOT Building:**
- GroveLayoutProvider context (Phase 2)
- Persistence to localStorage/Supabase (Phase 2)
- Experience Console UI (Phase 2)
- Per-lens density overrides (Phase 3)

---

## Build Gates

### Phase 1: Type System & Presets
**Timeline:** Day 1-2
**Focus:** TypeScript interfaces and preset definitions

```bash
# Gate 1.1: Type checking
npm run type-check

# Gate 1.2: Unit tests (layout types)
npm test -- --testPathPattern=layout

# Gate 1.3: Build verification
npm run build

# Gate 1.4: Linting
npm run lint
```

**Success Criteria:**
- `LayoutConfig` interface compiles
- `DENSITY_PRESETS` object validates
- All TypeScript compilation successful
- Linting passes

---

### Phase 2: Renderer Integration
**Timeline:** Day 3-4
**Focus:** Add layout prop to Renderer, implement resolution logic

```bash
# Gate 2.1: Component unit tests
npm test -- --testPathPattern=Renderer

# Gate 2.2: Integration tests
npm test -- --testPathPattern=integration

# Gate 2.3: E2E tests (density)
npx playwright test --grep="density"

# Gate 2.4: Build verification
npm run build
```

**Success Criteria:**
- Renderer accepts layout prop
- Default density applied when no prop
- All three presets render correctly
- Token overrides work

---

### Phase 3: Migration & Documentation
**Timeline:** Day 5
**Focus:** Migrate existing CSS hacks, document patterns

```bash
# Gate 3.1: Full test suite
npm test && npm run build

# Gate 3.2: E2E migration tests
npx playwright test --grep="migration"

# Gate 3.3: Visual regression
npm run test:visual

# Gate 3.4: Linting (no CSS hacks remaining)
grep -r "\[&_.json-render" src/ && echo "CSS hacks found!" || echo "Clean!"
```

**Success Criteria:**
- All CSS hacks replaced with layout prop
- Visual regression tests pass
- Documentation complete
- No grep matches for CSS hack pattern

---

### Final Verification
**Timeline:** Day 5 (end of day)

```bash
# Final verification suite
npm run type-check && \
npm test && \
npm run build && \
npx playwright test && \
npm run lint
```

**Success Criteria:**
- All gates passed
- Zero console errors
- Documentation complete
- REVIEW.html with evidence

---

## QA Gates (Mandatory)

### Gate 1: Pre-Development
**Status:** Must complete before coding begins

- [ ] Baseline tests pass (verify existing dashboards work)
- [ ] Console clean (zero errors, zero warnings)
- [ ] TypeScript compilation successful
- [ ] Existing Renderer API understood
- [ ] CSS hack locations identified (grep for patterns)

### Gate 2: Mid-Sprint (Daily)
**Status:** Complete after each phase

- [ ] Phase 1: Type system compiles and tests pass
- [ ] Phase 2: Renderer integration tested
- [ ] Console audit: Zero errors after each phase
- [ ] Core functionality verified (apply preset, verify spacing)
- [ ] Unit test coverage maintained > 80%

### Gate 3: Pre-Merge (Sprint Complete)
**Status:** Complete before merging to main

- [ ] All tests green (unit, integration, E2E)
- [ ] Console audit: ZERO errors, ZERO warnings
- [ ] Error boundary testing complete
- [ ] All 5 user stories verified
- [ ] Visual regression tests pass
- [ ] Migration complete (no CSS hacks in codebase)

### Gate 4: Sprint Complete
**Status:** Complete before sprint closure

- [ ] All QA gates passed
- [ ] Cross-browser testing (Chrome, Firefox)
- [ ] Mobile testing (responsive density)
- [ ] Accessibility audit (spacing doesn't break a11y)
- [ ] Visual regression tests pass
- [ ] Performance check (no render overhead)
- [ ] Documentation complete (storybook, migration guide)
- [ ] REVIEW.html with screenshot evidence

---

## Console Error Policy

**ZERO TOLERANCE** - Any console errors/warnings = QA failure

### Critical Errors (Immediate Block):
- Error, TypeError, ReferenceError
- React component crashes
- Invalid prop type warnings
- Missing required props

### Warnings (Must Address):
- Unused variables or imports
- Deprecated API usage
- Performance warnings

### Layout-Specific Errors:
- Invalid density value
- Invalid token override
- LayoutContext not found (if using context)

---

## Verification Commands

### Pre-Development Verification
```bash
# Verify sprint folder exists
ls -la docs/sprints/s13-bd-layout-density-v1/

# Identify CSS hack locations
grep -rn "\[&_.json-render" src/ --include="*.tsx" --include="*.ts"

# Count CSS hacks to migrate
grep -c "\[&_.json-render" src/**/*.tsx src/**/*.ts 2>/dev/null || echo "0"
```

### Phase Completion Verification
```bash
# Phase 1: Types exist
test -f src/bedrock/json-render/types.ts && echo "✅ Types created"
test -f src/bedrock/json-render/presets.ts && echo "✅ Presets created"

# Phase 2: Renderer updated
grep -q "layout" src/bedrock/json-render/Renderer.tsx && echo "✅ Renderer updated"

# Phase 3: CSS hacks removed
grep -r "\[&_.json-render" src/ && echo "❌ CSS hacks remain" || echo "✅ Migration complete"
```

### Screenshot Evidence Verification
```bash
# Verify screenshot directory
mkdir -p docs/sprints/s13-bd-layout-density-v1/screenshots/e2e

# Count screenshots (minimum 20 for medium sprint)
find docs/sprints/s13-bd-layout-density-v1/screenshots -name "*.png" | wc -l
```

---

## Key Files to Create/Modify

### New Files
```typescript
// src/bedrock/json-render/types.ts (ADD to existing or CREATE)
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export interface LayoutConfig { ... }

// src/bedrock/json-render/presets.ts (CREATE)
export const DENSITY_PRESETS = { ... }

// src/bedrock/json-render/useResolvedLayout.ts (CREATE)
export function useResolvedLayout(layout?: LayoutConfig) { ... }

// tests/unit/layout-density.test.ts (CREATE)
// tests/e2e/s13-bd-layout-density/*.spec.ts (CREATE)
```

### Files to Modify
```typescript
// src/bedrock/json-render/Renderer.tsx
// ADD: layout prop to interface
// ADD: useResolvedLayout hook call
// ADD: apply resolved classes to container

// src/bedrock/consoles/ExperienceConsole.tsx (MIGRATE)
// REMOVE: CSS hack [&_.json-render-root]:space-y-6
// ADD: layout={{ density: 'comfortable' }}

// [Other dashboards with CSS hacks] (MIGRATE)
```

---

## Verification Steps

### 1. Preset Application Verification
```typescript
// Manual verification in browser
<Renderer tree={testTree} registry={registry} layout={{ density: 'compact' }} />
// Inspect: container has p-3, sections have space-y-2

<Renderer tree={testTree} registry={registry} layout={{ density: 'comfortable' }} />
// Inspect: container has p-6, sections have space-y-4

<Renderer tree={testTree} registry={registry} layout={{ density: 'spacious' }} />
// Inspect: container has p-8, sections have space-y-6
```

### 2. Override Verification
```typescript
<Renderer
  tree={testTree}
  registry={registry}
  layout={{ density: 'comfortable', sectionGap: 'space-y-8' }}
/>
// Inspect: sectionGap is space-y-8, others are comfortable defaults
```

### 3. Default Behavior Verification
```typescript
<Renderer tree={testTree} registry={registry} />
// Inspect: comfortable density applied (p-6, space-y-4, gap-4)
// Console: no warnings about missing layout prop
```

### 4. Migration Verification
```bash
# Before migration
git stash
grep -rn "\[&_.json-render" src/
# Should show existing CSS hacks

# After migration
git stash pop
grep -rn "\[&_.json-render" src/
# Should show ZERO matches
```

---

## Rollback Plan

### Scenario 1: Visual Regression Detected
**Risk:** Low impact, medium probability

**Rollback Procedure:**
```bash
# Revert Renderer changes
git checkout HEAD~1 -- src/bedrock/json-render/Renderer.tsx

# Keep types/presets for future attempt
# Investigate visual differences before retry
```

**Recovery Time:** < 30 minutes

### Scenario 2: Performance Regression
**Risk:** Very low probability

**Rollback Procedure:**
```typescript
// Remove layout prop usage temporarily
<Renderer tree={tree} registry={registry} />
// Default behavior maintains existing functionality
```

**Recovery Time:** < 15 minutes

### Scenario 3: Type Conflicts
**Risk:** Low probability

**Rollback Procedure:**
```bash
# Revert type changes
git checkout HEAD~1 -- src/bedrock/json-render/types.ts

# Remove presets file
rm src/bedrock/json-render/presets.ts
```

**Recovery Time:** < 15 minutes

---

## Attention Anchor

### We Are Building
A declarative layout density system that makes spacing configuration a first-class citizen in json-render, eliminating CSS hacks and enabling future user customization.

### Success Looks Like
- All CSS hacks replaced with `layout={{ density: '...' }}` prop
- Three presets work correctly (compact, comfortable, spacious)
- Token overrides function as documented
- All tests passing, zero console errors
- Migration documentation complete

### We Are NOT
- Building the Experience Console UI (Phase 2)
- Adding persistence (Phase 2)
- Implementing per-lens overrides (Phase 3)
- Changing the visual appearance of components (only spacing)
- Creating new UI components

### Current Phase
Phase 7: Execution Contract Complete → Ready for Developer Handoff

### Next Action
Execute Grove Foundation Loop starting with Phase 0 (Pattern Check).

---

## Completion Checklist

Before marking sprint complete:

- [ ] All 5 user stories implemented and tested
- [ ] All build gates passed (Phase 1-3)
- [ ] All QA gates passed (Gate 1-4)
- [ ] CSS hacks eliminated (grep returns 0 matches)
- [ ] Visual verification complete (screenshots in REVIEW.html)
- [ ] E2E tests passing
- [ ] Migration documentation complete
- [ ] Storybook examples added
- [ ] DEX compliance verified (all 4 pillars)
- [ ] REVIEW.html with acceptance criteria evidence

**Sprint Complete:** All checklist items checked ✅

---

**Contract Version:** 1.0
**Last Updated:** 2026-01-18
**Enforcement:** This contract is binding - all gates must pass before merge
