# EXECUTION_PROMPT: S19-BD-JsonRenderFactory

You are acting as **DEVELOPER** for sprint: `s19-bd-jsonrenderfactory`

---

## Mission

Create a unified json-render component factory that:
1. Eliminates duplicate RenderElement/RenderTree definitions
2. Provides shared base components with layout primitives
3. Enables namespaced component resolution
4. Migrates all 8 existing catalogs to the factory pattern

---

## Quick Start

```bash
# 1. Create feature branch
git checkout -b feat/s19-bd-jsonrenderfactory

# 2. Read the execution contract
cat docs/sprints/s19-bd-jsonrenderfactory/SPEC.md

# 3. Start with Phase 1
# Create src/core/json-render/ files
```

---

## Key Files to Create

### Phase 1: Core Infrastructure

**src/core/json-render/types.ts**
```typescript
// Single source of truth for render types
export interface RenderElement<T = unknown> {
  type: string;  // Namespaced: "base:Stack", "signals:QualityGauge"
  props: T;
  key?: string;
  provenance?: { createdBy: 'system' | 'agent' | 'user'; };
}

export interface RenderTree {
  type: 'root';
  children: RenderElement[];
  meta?: { catalog: string; version: string; };
}

export interface ComponentMeta<T extends z.ZodType = z.ZodType> {
  props: T;
  description?: string;
  category: 'layout' | 'data' | 'feedback' | 'navigation' | 'custom';
  agentHint?: string;
}

export interface CatalogDefinition {
  name: string;
  version: string;
  components: Record<string, ComponentMeta>;
}
```

**src/core/json-render/base-catalog.ts**
```typescript
// Layout primitives
export const StackSchema = z.object({
  direction: z.enum(['vertical', 'horizontal']).default('vertical'),
  gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  align: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
  children: z.array(z.any()),
});

// ... Grid, Container, Spacer, Text, Metric, Badge, Progress

export const BaseCatalog: CatalogDefinition = {
  name: 'base',
  version: '1.0.0',
  components: {
    Stack: { props: StackSchema, category: 'layout' },
    // ... all base components
  },
};
```

**src/core/json-render/factory.ts**
```typescript
export function createCatalog(options: CreateCatalogOptions): CatalogDefinition {
  const { name, version = '1.0.0', extends: parents = [BaseCatalog], components } = options;

  const inheritedComponents = parents.reduce(
    (acc, parent) => ({ ...acc, ...parent.components }),
    {} as Record<string, ComponentMeta>
  );

  return {
    name,
    version,
    components: { ...inheritedComponents, ...components },
  };
}
```

---

## Migration Pattern

For each existing catalog:

1. **Refactor catalog file** to use `createCatalog()`
2. **Add namespace prefix** to all component types in transforms
3. **Move shared components** to base (e.g., MetricCard → base:Metric)
4. **Keep domain-specific** components in domain namespace
5. **Update consumers** to use unified JsonRenderer
6. **Visual verification** — screenshot before/after

Example transform update:
```typescript
// BEFORE
{ type: 'MetricCard', props: { ... } }

// AFTER
{ type: 'base:Metric', props: { ... } }
// or
{ type: 'signals:QualityGauge', props: { ... } }
```

---

## Catalogs to Migrate (Order)

| Phase | Catalog | Location |
|-------|---------|----------|
| 3 | SignalsCatalog | ExperienceConsole/json-render |
| 4 | QualityAnalyticsCatalog | ExperienceConsole/json-render |
| 5 | ModelAnalyticsCatalog | ExperienceConsole/json-render |
| 6 | AttributionCatalog | ExperienceConsole/json-render |
| 7 | ScoreAttributionCatalog | ExperienceConsole/json-render |
| 8 | OverrideHistoryCatalog | ExperienceConsole/json-render |
| 9 | QualityCatalog | bedrock/primitives/QualityBreakdown |
| 10 | ResearchCatalog | SproutFinishingRoom/json-render |

---

## Verification Gates

After each migration phase:
1. `npm run build` — Must pass
2. `npm run lint` — Must pass
3. Visual comparison — Render must be identical
4. Screenshot — Save to `screenshots/`
5. DEVLOG.md — Update with completion

---

## Critical Constraints

### FROZEN ZONE — DO NOT TOUCH
```
/terminal route
/foundation route
src/surface/components/Terminal/*
src/workspace/*
```

### Namespacing Convention
```
base:Stack              ← From base catalog
signals:QualityGauge    ← From signals catalog
research:SourceList     ← From research catalog
```

### DEX Compliance
- All schemas in Zod (Declarative Sovereignty)
- No model-specific code (Capability Agnosticism)
- Track component origin via namespace (Provenance)
- Factory enables extension (Organic Scalability)

---

## Status Updates

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`
Template: `.agent/status/ENTRY_TEMPLATE.md`

On completion: Write COMPLETE entry with migration summary.

---

## References

- SPEC.md: `docs/sprints/s19-bd-jsonrenderfactory/SPEC.md`
- Pattern Guide: `docs/JSON_RENDER_PATTERN_GUIDE.md`
- Existing catalogs: `src/bedrock/consoles/ExperienceConsole/json-render/`
- Notion: https://www.notion.so/2ec780a78eef8153aba8e93600950b2f

---

*Execute per Grove Execution Protocol v1.5*
