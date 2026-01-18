# Design Specification: Declarative Layout Density

**Version:** 1.0
**Status:** Draft
**Designer:** UI/UX Designer Agent
**Reviewed by:** UX Chief

---

## Design Intent

Create a **systematic, declarative approach to spacing** in the json-render system that:
- Feels intentional and consistent across all dashboards
- Adapts to content type (data-heavy vs. prose)
- Prepares for future user customization
- Eliminates ad-hoc CSS hacks

**Design Philosophy Alignment:**
- **Configuration Over Code** - Density via props, not CSS overrides
- **Lenses Shape Reality** - Foundation for per-lens density (Phase 2+)
- **Objects Not Messages** - Spacing is part of the object's presentation

---

## Pattern Alignment

### Existing Patterns Used

| Pattern | Usage |
|---------|-------|
| **Tailwind token system** | All spacing values use Tailwind classes |
| **Bedrock primitives** | Extends existing component prop patterns |
| **json-render Renderer** | Adds `layout` prop to existing API |

### New Patterns Proposed

| Pattern | Description | Reusability |
|---------|-------------|-------------|
| **Density presets** | Named configurations (compact/comfortable/spacious) | All future UI components |
| **Token override** | Individual token customization within presets | Any configurable component |

---

## Component Specifications

### LayoutConfig Interface

```typescript
// src/bedrock/json-render/types.ts

/**
 * Layout density preset names.
 * - compact: Dense layouts for data tables, admin lists
 * - comfortable: Default, balanced for dashboards
 * - spacious: Reading-optimized for documentation, prose
 */
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

/**
 * Layout configuration for json-render Renderer.
 * Supports preset selection with optional token overrides.
 */
export interface LayoutConfig {
  /** Density preset to apply */
  density: LayoutDensity;

  /** Override: Container padding (Tailwind class) */
  containerPadding?: string;

  /** Override: Gap between sections (Tailwind class) */
  sectionGap?: string;

  /** Override: Gap between cards/items (Tailwind class) */
  cardGap?: string;
}
```

### Density Preset Values

```typescript
// src/bedrock/json-render/presets.ts

export const DENSITY_PRESETS: Record<LayoutDensity, Required<Omit<LayoutConfig, 'density'>>> = {
  compact: {
    containerPadding: 'p-3',      // 12px
    sectionGap: 'space-y-2',      // 8px
    cardGap: 'gap-2'              // 8px
  },
  comfortable: {
    containerPadding: 'p-6',      // 24px
    sectionGap: 'space-y-4',      // 16px
    cardGap: 'gap-4'              // 16px
  },
  spacious: {
    containerPadding: 'p-8',      // 32px
    sectionGap: 'space-y-6',      // 24px
    cardGap: 'gap-6'              // 24px
  }
};
```

### Renderer Component Update

```typescript
// src/bedrock/json-render/Renderer.tsx

interface RendererProps {
  tree: RenderTree;
  registry: ComponentRegistry;
  layout?: LayoutConfig;  // NEW PROP
}

export function Renderer({ tree, registry, layout }: RendererProps) {
  // Resolve layout config with defaults
  const resolvedLayout = useResolvedLayout(layout);

  return (
    <LayoutContext.Provider value={resolvedLayout}>
      <div className={cn('json-render-root', resolvedLayout.containerPadding)}>
        <div className={resolvedLayout.sectionGap}>
          {/* Render tree content */}
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
```

---

## Visual Specifications

### Density Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DENSITY COMPARISON                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COMPACT (p-3, space-y-2)    COMFORTABLE (p-6, space-y-4)    SPACIOUS      │
│  ┌───────────────────┐       ┌───────────────────┐       ┌───────────────┐ │
│  │┌─────────────────┐│       │                   │       │               │ │
│  ││  Metric Row     ││       │  ┌─────────────┐  │       │               │ │
│  │├─────────────────┤│       │  │ Metric Row  │  │       │ ┌───────────┐ │ │
│  ││  Metric Row     ││       │  └─────────────┘  │       │ │Metric Row │ │ │
│  │├─────────────────┤│       │                   │       │ └───────────┘ │ │
│  ││  Metric Row     ││       │  ┌─────────────┐  │       │               │ │
│  │├─────────────────┤│       │  │ Metric Row  │  │       │               │ │
│  ││  Metric Row     ││       │  └─────────────┘  │       │ ┌───────────┐ │ │
│  │└─────────────────┘│       │                   │       │ │Metric Row │ │ │
│  └───────────────────┘       │  ┌─────────────┐  │       │ └───────────┘ │ │
│                              │  │ Metric Row  │  │       │               │ │
│  Best for:                   │  └─────────────┘  │       └───────────────┘ │
│  • Data tables               │                   │                         │
│  • Admin lists               └───────────────────┘       Best for:         │
│  • Dense information                                     • Documentation   │
│                              Best for:                   • Reading content │
│                              • Dashboards (DEFAULT)      • Prose-heavy UI  │
│                              • General purpose                             │
│                              • Most use cases                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Token Scale Reference

| Token | Compact | Comfortable | Spacious | Tailwind |
|-------|---------|-------------|----------|----------|
| Container Padding | 12px | 24px | 32px | p-3, p-6, p-8 |
| Section Gap | 8px | 16px | 24px | space-y-2, space-y-4, space-y-6 |
| Card Gap | 8px | 16px | 24px | gap-2, gap-4, gap-6 |

---

## Usage Patterns

### Pattern 1: Simple Preset

```typescript
// Most common usage - just specify density
<Renderer
  tree={dashboardTree}
  registry={signalsCatalog}
  layout={{ density: 'comfortable' }}
/>
```

### Pattern 2: Preset with Override

```typescript
// Custom section gap for specific layout needs
<Renderer
  tree={metricsTree}
  registry={metricsCatalog}
  layout={{
    density: 'comfortable',
    sectionGap: 'space-y-8'  // Extra breathing room
  }}
/>
```

### Pattern 3: Compact for Data Tables

```typescript
// Dense layout for tabular data
<Renderer
  tree={tableTree}
  registry={tableCatalog}
  layout={{ density: 'compact' }}
/>
```

### Pattern 4: Default (No Prop)

```typescript
// Backwards compatible - comfortable applied automatically
<Renderer
  tree={tree}
  registry={registry}
  // No layout prop = comfortable density
/>
```

---

## State Variations

### Normal State
Standard rendering with applied density preset.

### Empty State
Empty containers maintain padding from density preset.

### Loading State
Skeleton loaders respect density spacing.

### Error State
Error messages display within density constraints.

---

## Accessibility Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Keyboard navigable | N/A - spacing doesn't affect navigation | ✅ |
| Focus indicators visible | Unaffected by density | ✅ |
| Screen reader labels | Spacing is visual only | ✅ |
| Color contrast AA | Unaffected by density | ✅ |
| Touch targets 44px min | Compact mode maintains 44px minimum | ✅ |
| Reduced motion | Spacing changes don't animate | ✅ |

**Note:** Density affects only spacing, not interactive elements. Touch targets and interactive areas maintain minimum sizes regardless of density setting.

---

## Declarative Configuration Points

| Element | Configurable Via | Default | Override Level |
|---------|-----------------|---------|----------------|
| Density preset | `layout.density` | `'comfortable'` | Component |
| Container padding | `layout.containerPadding` | Per preset | Component |
| Section gap | `layout.sectionGap` | Per preset | Component |
| Card gap | `layout.cardGap` | Per preset | Component |

### Future Configuration Points (Phase 2+)

| Element | Configurable Via | Level |
|---------|-----------------|-------|
| Default density | Grove settings | Grove-wide |
| Lens density override | Lens config | Per-lens |
| User preference | User settings | Per-user |

---

## Integration with Existing Catalogs

### SignalsCatalog
```typescript
// MetricRow, MetricCard inherit layout context
<Renderer
  tree={signalsTree}
  registry={SignalsCatalog}
  layout={{ density: 'comfortable' }}
/>
// MetricRow uses cardGap from context
// MetricCard respects container padding
```

### ResearchCatalog
```typescript
// Research content benefits from spacious
<Renderer
  tree={researchTree}
  registry={ResearchCatalog}
  layout={{ density: 'spacious' }}
/>
```

### JobStatusCatalog
```typescript
// Job lists work well with compact
<Renderer
  tree={jobTree}
  registry={JobStatusCatalog}
  layout={{ density: 'compact' }}
/>
```

---

## Migration Guide

### Before (CSS Hack)

```typescript
// ❌ Fragile, hard-coded
<div className="[&_.json-render-root]:space-y-6 [&_.json-render-root]:p-6">
  <Renderer tree={tree} registry={registry} />
</div>
```

### After (Declarative)

```typescript
// ✅ Clean, configurable
<Renderer
  tree={tree}
  registry={registry}
  layout={{ density: 'comfortable' }}
/>
```

### Migration Mapping

| Old Pattern | New Equivalent |
|-------------|----------------|
| `space-y-2`, `p-3` | `density: 'compact'` |
| `space-y-4`, `p-6` | `density: 'comfortable'` |
| `space-y-6`, `p-6` | `density: 'comfortable', sectionGap: 'space-y-6'` |
| `space-y-6`, `p-8` | `density: 'spacious'` |

---

## Future UI Concept (Phase 2)

### Experience Console → Appearance Tab

```
┌─────────────────────────────────────────────────────────────┐
│ ← Experience Console                                        │
├───────┬─────────────────────────────────────────────────────┤
│       │                                                     │
│ Models│  Appearance Settings                                │
│       │  ─────────────────                                  │
│ Rules │                                                     │
│       │  Layout Density                                     │
│ Appear│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ ance ●│  │ Compact  │ │Comfortable│ │ Spacious │            │
│       │  │   ▪▪▪    │ │   ▪ ▪    │ │          │            │
│       │  │   ▪▪▪    │ │   ▪ ▪    │ │   ▪  ▪   │            │
│       │  │   ▪▪▪    │ │   ▪ ▪    │ │          │            │
│       │  └──────────┘ └────●─────┘ └──────────┘            │
│       │                 selected                            │
│       │                                                     │
│       │  ☐ Allow per-lens overrides                        │
│       │                                                     │
│       │  ┌─────────────────────────────────────────────┐   │
│       │  │            LIVE PREVIEW                      │   │
│       │  │  ┌───────────────────────────────────────┐  │   │
│       │  │  │  Sample Dashboard with Metrics        │  │   │
│       │  │  │  ┌─────────┐  ┌─────────┐             │  │   │
│       │  │  │  │ 125     │  │ 0.67    │             │  │   │
│       │  │  │  │ Tokens  │  │ Progress│             │  │   │
│       │  │  │  └─────────┘  └─────────┘             │  │   │
│       │  │  └───────────────────────────────────────┘  │   │
│       │  └─────────────────────────────────────────────┘   │
│       │                                                     │
│       │  [Save Changes]                                     │
└───────┴─────────────────────────────────────────────────────┘
```

---

## Designer Notes

1. **Preset names are user-facing** - Choose words that communicate intent (compact = dense data, spacious = reading comfort)

2. **Default matters** - `comfortable` is the Goldilocks choice for most dashboards

3. **Consistency over customization** - Phase 1 limits overrides to maintain consistency; full customization comes in Phase 2+

4. **Token scale is intentional** - Uses Tailwind's 4px grid (p-3=12, p-6=24, p-8=32) for harmonic spacing

---

**Designed by:** UI/UX Designer
**Date:** 2026-01-18
**Next Step:** UX Chief final review and DEX compliance sign-off
