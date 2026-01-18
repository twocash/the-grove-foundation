# Developer Execution Prompt: S13-BD-LayoutDensity-v1

## Quick Start

```bash
# Read the execution contract first
cat docs/sprints/s13-bd-layout-density-v1/GROVE_EXECUTION_CONTRACT.md
```

---

## Sprint Context

**Sprint:** S13-BD-LayoutDensity-v1
**Domain:** Bedrock Infrastructure
**Effort:** Medium (1 sprint)
**Dependencies:** None - standalone implementation

**Goal:** Implement a declarative layout density system for json-render that eliminates CSS hacks and enables consistent spacing configuration.

---

## What You're Building

### Core Deliverables

1. **LayoutConfig TypeScript Interface**
   - `LayoutDensity` type: `'compact' | 'comfortable' | 'spacious'`
   - `LayoutConfig` interface with density + optional token overrides
   - Full type safety for all configuration

2. **DENSITY_PRESETS Object**
   - Three presets with Tailwind class mappings
   - Compact: p-3, space-y-2, gap-2
   - Comfortable: p-6, space-y-4, gap-4
   - Spacious: p-8, space-y-6, gap-6

3. **Renderer Integration**
   - Add `layout` prop to Renderer component
   - `useResolvedLayout` hook for config resolution
   - LayoutContext for child component access

4. **Migration**
   - Remove all `[&_.json-render-root]:space-y-*` CSS hacks
   - Replace with declarative `layout` prop

---

## Implementation Specification

### Phase 1: Type System & Presets (Day 1-2)

**File:** `src/bedrock/json-render/types.ts`
```typescript
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

export interface LayoutConfig {
  density: LayoutDensity;
  containerPadding?: string;
  sectionGap?: string;
  cardGap?: string;
}
```

**File:** `src/bedrock/json-render/presets.ts`
```typescript
import { LayoutDensity, LayoutConfig } from './types';

export const DENSITY_PRESETS: Record<LayoutDensity, Required<Omit<LayoutConfig, 'density'>>> = {
  compact: {
    containerPadding: 'p-3',
    sectionGap: 'space-y-2',
    cardGap: 'gap-2'
  },
  comfortable: {
    containerPadding: 'p-6',
    sectionGap: 'space-y-4',
    cardGap: 'gap-4'
  },
  spacious: {
    containerPadding: 'p-8',
    sectionGap: 'space-y-6',
    cardGap: 'gap-6'
  }
};

export const DEFAULT_DENSITY: LayoutDensity = 'comfortable';
```

**Gate 1 Verification:**
```bash
npm run type-check && npm run build && npm run lint
```

### Phase 2: Renderer Integration (Day 3-4)

**File:** `src/bedrock/json-render/useResolvedLayout.ts`
```typescript
import { useMemo } from 'react';
import { LayoutConfig, LayoutDensity } from './types';
import { DENSITY_PRESETS, DEFAULT_DENSITY } from './presets';

export interface ResolvedLayout {
  containerPadding: string;
  sectionGap: string;
  cardGap: string;
}

export function useResolvedLayout(layout?: LayoutConfig): ResolvedLayout {
  return useMemo(() => {
    const density: LayoutDensity = layout?.density ?? DEFAULT_DENSITY;
    const preset = DENSITY_PRESETS[density];

    return {
      containerPadding: layout?.containerPadding ?? preset.containerPadding,
      sectionGap: layout?.sectionGap ?? preset.sectionGap,
      cardGap: layout?.cardGap ?? preset.cardGap,
    };
  }, [layout]);
}
```

**File:** `src/bedrock/json-render/Renderer.tsx` (modify)
```typescript
// Add to imports
import { LayoutConfig } from './types';
import { useResolvedLayout } from './useResolvedLayout';

// Add to RendererProps interface
interface RendererProps {
  tree: RenderTree;
  registry: ComponentRegistry;
  layout?: LayoutConfig;  // NEW PROP
}

// Update component
export function Renderer({ tree, registry, layout }: RendererProps) {
  const resolvedLayout = useResolvedLayout(layout);

  return (
    <div className={cn('json-render-root', resolvedLayout.containerPadding)}>
      <div className={resolvedLayout.sectionGap}>
        {/* Existing render logic */}
      </div>
    </div>
  );
}
```

**Gate 2 Verification:**
```bash
npm test -- --testPathPattern=Renderer
npm test -- --testPathPattern=layout
npx playwright test --grep="density"
```

### Phase 3: Migration (Day 5)

**Search for CSS hacks to migrate:**
```bash
grep -rn "\[&_.json-render" src/ --include="*.tsx" --include="*.ts"
```

**Migration Pattern:**
```typescript
// BEFORE (CSS hack)
<div className="[&_.json-render-root]:space-y-6 [&_.json-render-root]:p-6">
  <Renderer tree={tree} registry={registry} />
</div>

// AFTER (declarative)
<Renderer
  tree={tree}
  registry={registry}
  layout={{ density: 'comfortable' }}
/>
```

**Gate 3 Verification:**
```bash
# Verify no CSS hacks remain
grep -r "\[&_.json-render" src/ && echo "FAIL: CSS hacks found" || echo "PASS: Migration complete"
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/bedrock/json-render/types.ts` | Add LayoutConfig interface (or extend existing) |
| `src/bedrock/json-render/presets.ts` | DENSITY_PRESETS configuration |
| `src/bedrock/json-render/useResolvedLayout.ts` | Layout resolution hook |
| `tests/unit/layout-density.test.ts` | Unit tests for presets and hook |
| `tests/e2e/s13-bd-layout-density/*.spec.ts` | E2E tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/bedrock/json-render/Renderer.tsx` | Add layout prop |
| `src/bedrock/consoles/ExperienceConsole.tsx` | Migrate CSS hack to layout prop |
| Any file with `[&_.json-render-root]` pattern | Migrate to layout prop |

---

## Visual Testing Requirements

### Screenshot Evidence (Minimum 20)

**Directory:** `docs/sprints/s13-bd-layout-density-v1/screenshots/e2e/`

**Required Screenshots:**
| ID | Description | Verification |
|----|-------------|--------------|
| 01 | Compact density applied | Verify p-3, space-y-2 classes |
| 02 | Comfortable density applied | Verify p-6, space-y-4 classes |
| 03 | Spacious density applied | Verify p-8, space-y-6 classes |
| 04 | Token override working | Override visible in DOM |
| 05 | Default density (no prop) | Comfortable applied automatically |
| 06-10 | ExperienceConsole migrated | Before/after comparison |
| 11-20 | Other dashboards migrated | Each migration verified |

### Console Error Policy

**ZERO TOLERANCE** - Any console errors = QA failure

Monitor for:
- TypeScript errors
- React prop type warnings
- Invalid density value errors
- Missing required props

---

## Acceptance Criteria (Gherkin)

```gherkin
Scenario: Apply comfortable density preset
  Given a Renderer component with tree data
  When I set layout={{ density: 'comfortable' }}
  Then the container should have class 'p-6'
  And sections should have class 'space-y-4'
  And cards should have class 'gap-4'

Scenario: Default density when no prop provided
  Given a Renderer component with tree data
  When no layout prop is provided
  Then 'comfortable' density should be applied by default
  And no console warnings should appear

Scenario: Override individual tokens
  Given a Renderer with layout={{ density: 'comfortable' }}
  When I add sectionGap: 'space-y-8' to the layout config
  Then sectionGap should be 'space-y-8'
  And containerPadding should remain 'p-6' from preset
```

---

## QA Gates

### Gate 1: Pre-Development
- [ ] Baseline tests pass
- [ ] Console clean (zero errors)
- [ ] CSS hack locations identified

### Gate 2: Mid-Sprint
- [ ] Type system compiles
- [ ] Renderer accepts layout prop
- [ ] Presets render correctly

### Gate 3: Pre-Merge
- [ ] All tests green
- [ ] Zero console errors
- [ ] All 5 user stories verified
- [ ] CSS hacks eliminated

### Gate 4: Sprint Complete
- [ ] Visual regression tests pass
- [ ] Cross-browser testing complete
- [ ] Documentation complete
- [ ] REVIEW.html with evidence

---

## What You're NOT Building

- GroveLayoutProvider context (Phase 2)
- Persistence to localStorage/Supabase (Phase 2)
- Experience Console UI for density selection (Phase 2)
- Per-lens density overrides (Phase 3)

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `GROVE_EXECUTION_CONTRACT.md` | Build gates and verification commands |
| `USER_STORIES.md` | Full Gherkin scenarios and E2E specs |
| `DESIGN_SPEC.md` | Component specifications and patterns |
| `PRODUCT_BRIEF.md` | Business context and phased approach |

---

## Start Command

```bash
# 1. Verify baseline
npm run type-check && npm test && npm run build

# 2. Identify migration targets
grep -rn "\[&_.json-render" src/ --include="*.tsx"

# 3. Begin Phase 1
# Create types.ts and presets.ts
```

---

**Sprint ID:** S13-BD-LayoutDensity-v1
**Contract Version:** 1.0
**Ready for Execution:** 2026-01-18
