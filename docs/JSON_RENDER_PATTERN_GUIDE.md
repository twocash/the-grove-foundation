# JSON-Render Pattern Guide v1.0

**Version:** 1.0
**Date:** 2026-01-16
**Status:** MANDATORY for all future sprints
**Domain:** bedrock, surface, explore

---

## Executive Summary

The json-render pattern is now a **mandatory** part of Grove's 1.0 architecture for declarative UI rendering. This guide establishes when, why, and how to use json-render, and provides a factory for creating new catalog entries.

**TL;DR:**
- ✅ **REQUIRED**: Analytics dashboards, status displays, read-only UIs
- ❌ **FORBIDDEN**: Interactive forms, stateful editors, complex workflows
- ⚠️ **EVALUATE**: Conditional rendering, multi-stage interactions

---

## What is json-render?

Json-render is a **declarative component vocabulary** that implements a three-layer architecture:

```
┌─────────────────────────────────────────────┐
│ Layer 1: Catalog (Zod Schemas)              │
│   - Type-safe component definitions           │
│   - Runtime validation via Zod               │
└─────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Layer 2: Registry (React Components)         │
│   - Maps types to React implementations      │
│   - Provides styling and interactivity       │
└─────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Layer 3: Transform (Domain → Render)        │
│   - Converts domain objects to render trees │
│   - Enables composition and reuse            │
└─────────────────────────────────────────────┘
```

**Why it matters:**
- **Declarative**: UI structure defined by data, not code
- **Composable**: Components assemble into meaningful information hierarchies
- **Type-safe**: Zod schemas validate at runtime
- **Testable**: Transform functions are pure and testable
- **Reusable**: Same pattern across analytics, research, status displays

---

## When to Use json-render

### ✅ MANDATORY USE CASES

**1. Analytics Dashboards**
- Metrics, KPIs, progress indicators
- Signal aggregation displays
- Research document visualizations

**Example:**
```typescript
// SignalsCatalog - Shows sprout usage analytics
SignalsCatalog = {
  components: {
    MetricCard, QualityGauge, DiversityBadge,
    FunnelChart, ActivityTimeline, AdvancementIndicator
  }
}
```

**2. Status Displays**
- Job execution status (queued → running → complete)
- System health indicators
- Real-time monitoring UIs

**Example:**
```typescript
// JobStatusCatalog - Shows batch job status
JobStatusCatalog = {
  components: {
    JobPhaseIndicator, JobProgressBar, JobLogEntry,
    JobErrorAlert, NextRunCountdown
  }
}
```

**3. Read-Only Information UIs**
- AI-generated content structures
- Research documents
- Audit trails
- Provenance displays

**Example:**
```typescript
// ResearchCatalog - Shows AI-generated research documents
ResearchCatalog = {
  components: {
    ResearchHeader, AnalysisBlock, SourceList,
    LimitationsBlock, Metadata
  }
}
```

### ❌ FORBIDDEN USE CASES

**1. Interactive Forms**
- User input fields
- Editors with controlled inputs
- CRUD operations

**Correct Pattern:**
```typescript
// JobConfigEditor.tsx - Interactive form
export function JobConfigEditor({ object, onEdit }) {
  return (
    <form>
      <BufferedInput
        value={object.payload.displayName}
        onChange={(val) => onEdit([{ op: 'replace', path: '/payload/displayName', value: val }])}
      />
    </form>
  );
}
```

**2. Stateful Components**
- Components with local state
- Toggle buttons
- Modal dialogs

**Correct Pattern:**
```typescript
// Use traditional React patterns with useState, useEffect
// NOT json-render
```

**3. Complex Workflows**
- Multi-step wizards
- Conditional logic
- User interaction flows

### ⚠️ EVALUATE USE CASES

**1. Conditional Rendering (Case-by-Case)**
```typescript
// If simple conditional based on data → json-render OK
{
  type: 'JobErrorAlert',
  props: { show: execution.errors > 0, error: execution.error }
}

// If complex user-driven logic → traditional React
if (userHasPermission && config.isEnabled) { ... }
```

**2. Partial Interactivity (Use Hybrid Pattern)**
```typescript
// Most readable approach:
┌─────────────────────────────────────┐
│  Config Form Section                 │ ← Traditional React
│  - Input fields                     │
│  - Validation                       │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Status Display Section               │ ← json-render
│  - Live progress                    │
│  - Metrics                          │
└─────────────────────────────────────┘
```

---

## Pattern Factory

### Creating a New Catalog

**Step 1: Define Zod Schemas**

```typescript
// {Domain}Catalog.ts
import { z } from 'zod';

// Component 1
export const {ComponentName}Schema = z.object({
  // Schema definition
});

// Component 2
export const {AnotherComponent}Schema = z.object({
  // Schema definition
});

// Catalog aggregator
export const {Domain}Catalog = {
  components: {
    {ComponentName}: { props: {ComponentName}Schema },
    {AnotherComponent}: { props: {AnotherComponent}Schema },
  },
} as const;

// Type exports
export type {ComponentName}Props = z.infer<typeof {ComponentName}Schema>;
export type {AnotherComponent}Props = z.infer<typeof {AnotherComponent}Schema>;
```

**Step 2: Implement Registry**

```typescript
// {Domain}Registry.tsx
import React from 'react';
import { ComponentRegistry } from '@surface/components/modals/SproutFinishingRoom/json-render';

export const {Domain}Registry: ComponentRegistry = {
  {ComponentName}: ({ element }) => {
    const props = element.props as {ComponentName}Props;
    return (
      <div className="...">
        {/* React JSX rendering */}
      </div>
    );
  },

  {AnotherComponent}: ({ element }) => {
    const props = element.props as {AnotherComponent}Props;
    return (
      <div className="...">
        {/* React JSX rendering */}
      </div>
    );
  },
};
```

**Step 3: Create Transform**

```typescript
// {Domain}Transform.ts
import { RenderTree } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { {Domain}Object } from './types';

export function {domain}ObjectToRenderTree(obj: {Domain}Object): RenderTree {
  return {
    type: 'root',
    children: [
      {
        type: '{ComponentName}',
        props: {
          // Transform domain data → render props
        },
      },
    ],
  };
}
```

**Step 4: Export Barrel**

```typescript
// index.ts
export * from './{Domain}Catalog';
export * from './{Domain}Registry';
export * from './{Domain}Transform';
```

**Step 5: Use in Component**

```typescript
// MyComponent.tsx
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { {Domain}Registry, {Domain}Catalog } from './{domain}/index';
import { {domain}ObjectToRenderTree } from './{domain}/transform';

export function {Domain}Display({ data }: { data: {Domain}Object }) {
  const renderTree = {domain}ObjectToRenderTree(data);

  return (
    <Renderer
      tree={renderTree}
      registry={{Domain}Registry}
      catalog={{Domain}Catalog}
    />
  );
}
```

---

## Established Catalogs

### 1. ResearchCatalog
**Purpose:** AI-generated research documents
**Location:** `src/surface/components/modals/SproutFinishingRoom/json-render/research-catalog.ts`
**Components:** ResearchHeader, AnalysisBlock, SourceList, LimitationsBlock, Metadata

### 2. SignalsCatalog
**Purpose:** Usage signals and analytics
**Location:** `src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts`
**Components:** SignalHeader, MetricCard, MetricRow, QualityGauge, DiversityBadge, EventBreakdown, FunnelChart, ActivityTimeline, AdvancementIndicator

### 3. JobStatusCatalog (S7.5)
**Purpose:** Job execution status and history
**Location:** `src/bedrock/consoles/ExperienceConsole/json-render/job-status-catalog.ts`
**Components:** JobPhaseIndicator, JobProgressBar, JobMetricRow, JobLogEntry, JobErrorAlert, NextRunCountdown

---

## Pattern Checklist

### For Every New Catalog

- [ ] **Zod schemas defined** for all components
- [ ] **Type safety** via `z.infer<typeof Schema>`
- [ ] **Registry implemented** with React components
- [ ] **Transform function** converts domain → render tree
- [ ] **Type exports** available for TypeScript
- [ ] **Barrel export** in `index.ts`
- [ ] **Documentation** with examples
- [ ] **Tests** for transform function
- [ ] **Visual tests** with Playwright screenshots

### For Component Usage

- [ ] **Read-only** (no user input)
- [ ] **Declarative structure** (data-driven)
- [ ] **Composable** (assembles into hierarchy)
- [ ] **Type-safe** (schemas validate)
- [ ] **Reusable** (works across contexts)

---

## DEX Alignment

### Declarative Sovereignty
- ✅ UI structure defined by catalog, not hardcoded
- ✅ Components composed declaratively via render tree
- ✅ Domain objects → render tree via transform

### Capability Agnosticism
- ✅ Works regardless of AI model
- ✅ Same rendering for any data source
- ✅ Transform functions are pure and model-independent

### Provenance as Infrastructure
- ✅ Each component can track computation metadata
- ✅ Transform functions preserve data lineage
- ✅ Source attribution in render tree

### Organic Scalability
- ✅ New components additive to catalog
- ✅ No breaking changes to existing UIs
- ✅ Pattern reuse across domains

---

## Common Patterns

### Reusing Existing Components

**SignalsCatalog MetricRow** is highly reusable:

```typescript
// In new catalog
export const MyMetricRowSchema = z.object({
  metrics: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    color: z.enum(['default', 'green', 'red', 'amber', 'blue']).default('default'),
  })),
});

// Transform
function objectToRenderTree(obj: MyObject): RenderTree {
  return {
    type: 'root',
    children: [
      {
        type: 'MetricRow',  // Reuse from SignalsCatalog!
        props: {
          metrics: [
            { label: 'Total', value: obj.total, color: 'blue' },
            { label: 'Errors', value: obj.errors, color: obj.errors > 0 ? 'red' : 'green' },
          ],
        },
      },
    ],
  };
}
```

### Composition Pattern

Build complex UIs by composing simpler components:

```typescript
// Complex dashboard
function Dashboard({ data }: { data: DashboardData }) {
  return {
    type: 'root',
    children: [
      // Header section
      { type: 'MetricCard', props: { ... } },
      // Metrics grid
      { type: 'MetricRow', props: { ... } },
      // Timeline
      { type: 'ActivityTimeline', props: { ... } },
      // Progress
      { type: 'FunnelChart', props: { ... } },
    ],
  };
}
```

---

## Migration Guide

### For Existing Analytics UIs

If you have hardcoded analytics components:

**Before:**
```typescript
function AnalyticsDashboard({ signals }) {
  return (
    <div>
      <div className="metric-card">
        <span>Total Views</span>
        <span>{signals.viewCount}</span>
      </div>
      <div className="quality-gauge">
        <span>Quality</span>
        <span>{signals.qualityScore}</span>
      </div>
    </div>
  );
}
```

**After (json-render):**
```typescript
// 1. Create catalog
export const AnalyticsCatalog = {
  components: {
    MetricCard: { props: MetricCardSchema },
    QualityGauge: { props: QualityGaugeSchema },
  },
};

// 2. Create transform
function signalsToRenderTree(signals: SignalAggregation): RenderTree {
  return {
    type: 'root',
    children: [
      { type: 'MetricCard', props: { label: 'Total Views', value: signals.viewCount } },
      { type: 'QualityGauge', props: { score: signals.qualityScore } },
    ],
  };
}

// 3. Use renderer
function AnalyticsDashboard({ signals }) {
  const tree = signalsToRenderTree(signals);
  return <Renderer tree={tree} registry={AnalyticsRegistry} catalog={AnalyticsCatalog} />;
}
```

**Benefits:**
- Type safety via Zod
- Testable transform functions
- Reusable components
- Consistent styling

---

## Testing

### Transform Function Tests

```typescript
// MyCatalog.test.ts
import { objectToRenderTree } from './transform';

describe('objectToRenderTree', () => {
  it('should create valid render tree', () => {
    const result = objectToRenderTree(mockData);
    expect(result.type).toBe('root');
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('should map domain data correctly', () => {
    const result = objectToRenderTree(mockData);
    const metricCard = result.children.find(c => c.type === 'MetricCard');
    expect(metricCard.props.value).toBe(mockData.total);
  });
});
```

### Visual Tests

```typescript
// MyCatalog.visual.test.ts
test('renders correctly', async ({ page }) => {
  await page.goto('/my-page');
  await expect(page.locator('[data-testid="metric-card"]')).toBeVisible();
  await expect(page).toHaveScreenshot('analytics-dashboard.png');
});
```

---

## Resources

### Pattern Reference Files

| Pattern | Location | Purpose |
|---------|----------|---------|
| ResearchCatalog | `src/surface/components/modals/SproutFinishingRoom/json-render/` | AI-generated documents |
| SignalsCatalog | `src/bedrock/consoles/ExperienceConsole/json-render/` | Analytics dashboards |
| JobStatusCatalog | `src/bedrock/consoles/ExperienceConsole/json-render/` | Job status displays |

### Core Infrastructure

| Component | Location | Purpose |
|----------|----------|---------|
| Renderer | `src/surface/components/modals/SproutFinishingRoom/json-render/Renderer.tsx` | Generic tree renderer |
| ComponentRegistry | Same directory | Type-safe registry interface |
| RenderTree | Same directory | Render tree type definition |

### Documentation

- **JSON-Render Pattern Guide** (this file) - When and how to use
- **Component Catalogs** - Examples of established catalogs
- **API Reference** - Renderer and registry APIs

---

## Checklist for Sprint Planning

### Before Starting a Sprint

- [ ] Does this sprint include analytics or status displays?
- [ ] Can any UI be made declarative via json-render?
- [ ] Are there read-only information UIs that would benefit?

### During Implementation

- [ ] Creating new catalog? Follow Pattern Factory steps
- [ ] Reusing existing components? Check SignalsCatalog first
- [ ] Writing transforms? Pure functions, testable
- [ ] Rendering UIs? Use `<Renderer />` component

### Sprint Review

- [ ] All analytics UIs use json-render
- [ ] No hardcoded metrics in React components
- [ ] Transform functions are pure and tested
- [ ] Catalog components are type-safe via Zod
- [ ] Visual tests capture declarative UIs

---

## Conclusion

Json-render is a powerful pattern for declarative UI in Grove. Use it for:
- ✅ Analytics dashboards
- ✅ Status displays
- ✅ Read-only information UIs

Don't use it for:
- ❌ Interactive forms
- ❌ Stateful editors
- ❌ Complex workflows

When in doubt, ask:
> **"Can this UI be expressed as a pure function of domain data?"**
>
> If yes → json-render
> If no → traditional React

---

*JSON-Render Pattern Guide v1.0*
*Grove Foundation - Mandatory Architecture Pattern*
*Updated: 2026-01-16*
