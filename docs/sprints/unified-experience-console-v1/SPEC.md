# Sprint Specification: unified-experience-console-v1

**Sprint Name:** unified-experience-console-v1  
**Domain:** Bedrock  
**Type:** Refactor (architectural correction)  
**Priority:** P0 (blocks future Experience type additions)  
**Estimated Effort:** 4-6 hours  
**Created:** 2025-01-12  
**Author:** Jim Calhoun / Claude  

---

## Executive Summary

The feature-flags-v1 sprint successfully created feature flag objects as GroveObjects but incorrectly wired them to a separate `/bedrock/feature-flags` route instead of integrating them into the unified Experience console at `/bedrock/experience`. This violates DEX principles and the original architectural intent.

This sprint corrects the architecture by making the Experience console truly polymorphic—driven by the `EXPERIENCE_TYPE_REGISTRY` rather than hardcoded to a single type. The console will dynamically discover registered types, resolve appropriate components, and compose data hooks at runtime.

**The DEX Test:** After this sprint, adding a new experience type (e.g., `welcome-config`) requires only:
1. Create Card component
2. Create Editor component  
3. Create data hook
4. Register in `EXPERIENCE_TYPE_REGISTRY`
5. Register in component/hook registries

No modifications to the console, routes, navigation, or config files.

---

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract  
**Contract version:** 1.0  
**Additional requirements:**
- Console Pattern Mandate (three-column + Copilot)
- GroveObject Compliance (unified object schema)
- DEX Compliance Matrix (all four pillars documented)
- Strangler Fig Awareness (no legacy foundation imports)

---

## Problem Statement

### Current State (Incorrect)

```
/bedrock/experience     → SystemPromptPayload only (hardcoded)
/bedrock/feature-flags  → FeatureFlagPayload only (hardcoded)

Navigation: Two entries, two consoles, two data hooks
Registry: Already supports both types, but console doesn't read it
```

### Target State (Correct)

```
/bedrock/experience → All registered types, filtered by Type dropdown

Navigation: Single "Experience" entry
Registry: Drives component resolution, filter options, metrics
Console: Discovers and renders any registered type automatically
```

### Why This Matters

The current implementation requires **7 files changed** to add a new experience type:
1. Create Card component
2. Create Editor component
3. Create data hook
4. Create type-specific console config
5. Create type-specific console component
6. Modify routes.tsx to add route
7. Modify navigation.ts to add nav entry

The DEX-compliant implementation requires **5 files** (creation only, minimal modification):
1. Create Card component
2. Create Editor component
3. Create data hook
4. Register in `EXPERIENCE_TYPE_REGISTRY`
5. Register in component/hook registries

This is the difference between mechanical and organic scalability.

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Type-specific cards | Pattern 7 (Object Model) | Add `cardComponent` to ExperienceTypeDefinition |
| Type-specific editors | Pattern 7 (Object Model) | Already has `editorComponent` |
| Type-specific data | Pattern 3 (Narrative/Schema) | Add `dataHookName` to ExperienceTypeDefinition |
| Dynamic filtering | Pattern 1 (Quantum Interface) | Generate filter options from registry keys |
| Component resolution | Pattern 6 (Surface Architecture) | Registry-driven component lookup |

## New Patterns Proposed

**Pattern 12: Registry-Driven Console (proposed)**

A console that discovers its capabilities from a type registry rather than hardcoding them. The registry defines:
- Which object types the console manages
- Which components render each type
- Which hooks provide data for each type
- Type-specific metrics, filters, and sort options

This pattern generalizes the Bedrock Console Factory to support polymorphic object collections.

---

## DEX Compliance Matrix

### I. Declarative Sovereignty

| Aspect | Implementation |
|--------|----------------|
| Component mapping | Defined in `EXPERIENCE_TYPE_REGISTRY`, not code |
| Filter options | Generated from registry keys at runtime |
| Metrics | Composed from type-specific metric definitions |
| New type addition | Registry entry only, no console modification |

**The Test:** A domain expert can add a new experience type by editing TypeScript configuration (registry entry) without touching console rendering logic.

### II. Capability Agnosticism

| Aspect | Implementation |
|--------|----------------|
| Model independence | No LLM-specific logic in console architecture |
| Type independence | Console renders any registered type identically |

**The Test:** Console works whether managing system prompts, feature flags, or any future type.

### III. Provenance as Infrastructure

| Aspect | Implementation |
|--------|----------------|
| Type definition | Registry entry documents type metadata |
| Component attribution | Clear mapping from type → component |
| Data flow | Each type's hook maintains its own provenance |

**The Test:** Given any rendered card, we can trace back to the registry entry that defined its rendering.

### IV. Organic Scalability

| Aspect | Implementation |
|--------|----------------|
| New types | Registry entry triggers automatic discovery |
| Minimal code changes | Only registries need updating |
| Sensible defaults | Types inherit console behavior automatically |

**The Test:** Adding `welcome-config` type requires zero modifications to console component itself.

---

## Technical Specification

### Phase 1: Extend Registry Schema

**File:** `src/bedrock/types/experience.types.ts`

Extend `ExperienceTypeDefinition` with component and hook references:

```typescript
export interface ExperienceTypeDefinition<T = unknown> {
  // Existing fields
  type: string;
  label: string;
  icon: string;
  description: string;
  defaultPayload: T;
  wizardId?: string;
  editorComponent: string;
  allowMultipleActive: boolean;
  routePath: string;
  color?: string;
  
  // NEW: Component resolution
  cardComponent: string;           // Component name for grid/list cards
  
  // NEW: Data hook resolution  
  dataHookName: string;            // Hook name for CRUD operations
  
  // NEW: Type-specific metrics (optional)
  metrics?: MetricDefinition[];    // Override default metrics
  
  // NEW: Type-specific filters (optional)
  filters?: FilterDefinition[];    // Additional filter options
  
  // NEW: Type-specific sort options (optional)
  sortOptions?: SortDefinition[];  // Additional sort fields
}

interface MetricDefinition {
  id: string;
  label: string;
  icon: string;
  query: string;                   // Pseudo-query for counting
  typeFilter?: string;             // Only count this type
}

interface FilterDefinition {
  field: string;
  label: string;
  type: 'select' | 'boolean';
  options?: string[];
}

interface SortDefinition {
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}
```

Update registry entries:

```typescript
export const EXPERIENCE_TYPE_REGISTRY = {
  'system-prompt': {
    // ...existing fields...
    cardComponent: 'SystemPromptCard',
    dataHookName: 'useExperienceData',
    metrics: [
      { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: status=active)', typeFilter: 'system-prompt' },
      { id: 'drafts', label: 'Drafts', icon: 'edit_note', query: 'count(where: status=draft)', typeFilter: 'system-prompt' },
    ],
  },
  
  'feature-flag': {
    // ...existing fields...
    cardComponent: 'FeatureFlagCard',
    dataHookName: 'useFeatureFlagsData',
    routePath: '/bedrock/experience',  // CHANGED from /bedrock/feature-flags
    metrics: [
      { id: 'available', label: 'Available', icon: 'check_circle', query: 'count(where: payload.available=true)', typeFilter: 'feature-flag' },
      { id: 'disabled', label: 'Disabled', icon: 'block', query: 'count(where: payload.available=false)', typeFilter: 'feature-flag' },
      { id: 'header', label: 'In Header', icon: 'visibility', query: 'count(where: payload.showInExploreHeader=true)', typeFilter: 'feature-flag' },
    ],
    filters: [
      { field: 'payload.available', label: 'Availability', type: 'select', options: ['true', 'false'] },
      { field: 'payload.category', label: 'Category', type: 'select', options: ['experience', 'research', 'experimental', 'internal'] },
    ],
    sortOptions: [
      { field: 'payload.headerOrder', label: 'Header Order', direction: 'asc' },
    ],
  },
};
```

---

### Phase 2: Create Component Registry

**File:** `src/bedrock/consoles/ExperienceConsole/component-registry.ts`

```typescript
// Component Registry for Experience Console
// Maps string names to actual components for runtime resolution
// DEX: Declarative Sovereignty - components defined in config, resolved at runtime

import type { ComponentType } from 'react';
import type { ObjectCardProps, ObjectEditorProps } from '../../patterns/console-factory.types';

// Card components
import { SystemPromptCard } from './SystemPromptCard';
import { FeatureFlagCard } from './FeatureFlagCard';

// Editor components  
import { SystemPromptEditor } from './SystemPromptEditor';
import { FeatureFlagEditor } from './FeatureFlagEditor';

/**
 * Card component registry
 * Maps component names (from EXPERIENCE_TYPE_REGISTRY) to actual components
 */
export const CARD_COMPONENT_REGISTRY: Record<string, ComponentType<ObjectCardProps<any>>> = {
  SystemPromptCard,
  FeatureFlagCard,
};

/**
 * Editor component registry
 * Maps component names (from EXPERIENCE_TYPE_REGISTRY) to actual components
 */
export const EDITOR_COMPONENT_REGISTRY: Record<string, ComponentType<ObjectEditorProps<any>>> = {
  SystemPromptEditor,
  FeatureFlagEditor,
};

/**
 * Resolve card component by name
 * @throws Error if component not found (fail-fast for missing registrations)
 */
export function resolveCardComponent(name: string): ComponentType<ObjectCardProps<any>> {
  const component = CARD_COMPONENT_REGISTRY[name];
  if (!component) {
    throw new Error(
      `Card component "${name}" not found in registry. ` +
      `Did you forget to add it to CARD_COMPONENT_REGISTRY?`
    );
  }
  return component;
}

/**
 * Resolve editor component by name
 * @throws Error if component not found (fail-fast for missing registrations)
 */
export function resolveEditorComponent(name: string): ComponentType<ObjectEditorProps<any>> {
  const component = EDITOR_COMPONENT_REGISTRY[name];
  if (!component) {
    throw new Error(
      `Editor component "${name}" not found in registry. ` +
      `Did you forget to add it to EDITOR_COMPONENT_REGISTRY?`
    );
  }
  return component;
}
```

---

### Phase 3: Create Hook Registry

**File:** `src/bedrock/consoles/ExperienceConsole/hook-registry.ts`

```typescript
// Hook Registry for Experience Console
// Maps string names to data hooks for runtime composition
// DEX: Declarative Sovereignty - data sources defined in config, resolved at runtime

import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { useExperienceData } from './useExperienceData';
import { useFeatureFlagsData } from './useFeatureFlagsData';

/**
 * Data hook registry
 * Maps hook names (from EXPERIENCE_TYPE_REGISTRY) to actual hooks
 */
export const HOOK_REGISTRY: Record<string, () => CollectionDataResult<any>> = {
  useExperienceData,
  useFeatureFlagsData,
};

/**
 * Resolve data hook by name
 * @throws Error if hook not found (fail-fast for missing registrations)
 */
export function resolveDataHook(name: string): () => CollectionDataResult<any> {
  const hook = HOOK_REGISTRY[name];
  if (!hook) {
    throw new Error(
      `Data hook "${name}" not found in registry. ` +
      `Did you forget to add it to HOOK_REGISTRY?`
    );
  }
  return hook;
}
```

---

### Phase 4: Create Unified Data Hook

**File:** `src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts`

```typescript
// Unified Experience Data Hook
// Dynamically composes data from all registered experience types
// DEX: Organic Scalability - new types discovered automatically from registry

import { useMemo, useCallback } from 'react';
import type { GroveObject } from '@core/schema/grove-object';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { EXPERIENCE_TYPE_REGISTRY, getAllExperienceTypes } from '../../types/experience.types';
import { useExperienceData } from './useExperienceData';
import { useFeatureFlagsData } from './useFeatureFlagsData';

/**
 * Union type of all experience payloads
 * Dynamically derived from registry
 */
export type UnifiedExperiencePayload = 
  | import('@core/schema/system-prompt').SystemPromptPayload
  | import('@core/schema/feature-flag').FeatureFlagPayload;
  // Future types added here as registry grows

/**
 * Unified data hook that composes all registered experience type hooks
 * 
 * Architecture:
 * - Calls each registered type's hook explicitly (React hooks constraint)
 * - Merges results into unified collection
 * - Routes mutations to appropriate underlying hook based on object type
 * - Maintains type discrimination for proper CRUD operations
 * 
 * KNOWN LIMITATION: React hooks cannot be called conditionally/dynamically.
 * When adding new types, this hook must be updated to call the new hook.
 * This is documented and acceptable - the key DEX win is that the CONSOLE
 * doesn't need modification, only this data composition layer.
 */
export function useUnifiedExperienceData(): CollectionDataResult<UnifiedExperiencePayload> {
  // Explicit hook calls - update when adding new types
  // This is required due to React's Rules of Hooks
  const systemPromptData = useExperienceData();
  const featureFlagData = useFeatureFlagsData();
  
  // Merge objects from all sources
  const objects = useMemo(() => {
    return [
      ...systemPromptData.objects,
      ...featureFlagData.objects,
    ];
  }, [systemPromptData.objects, featureFlagData.objects]);
  
  // Aggregate loading state
  const loading = systemPromptData.loading || featureFlagData.loading;
  
  // Aggregate errors (first error wins)
  const error = systemPromptData.error || featureFlagData.error;
  
  // Route create to appropriate hook based on type
  const create = useCallback(async (payload: any, type?: string) => {
    const objectType = type || payload?.meta?.type;
    switch (objectType) {
      case 'system-prompt':
        return systemPromptData.create(payload);
      case 'feature-flag':
        return featureFlagData.create(payload);
      default:
        throw new Error(`Unknown experience type: ${objectType}`);
    }
  }, [systemPromptData.create, featureFlagData.create]);
  
  // Route update to appropriate hook based on object type
  const update = useCallback(async (id: string, patches: any[]) => {
    const obj = objects.find(o => o.meta.id === id);
    if (!obj) throw new Error(`Object not found: ${id}`);
    
    switch (obj.meta.type) {
      case 'system-prompt':
        return systemPromptData.update(id, patches);
      case 'feature-flag':
        return featureFlagData.update(id, patches);
      default:
        throw new Error(`Unknown experience type: ${obj.meta.type}`);
    }
  }, [objects, systemPromptData.update, featureFlagData.update]);
  
  // Route remove to appropriate hook based on object type
  const remove = useCallback(async (id: string) => {
    const obj = objects.find(o => o.meta.id === id);
    if (!obj) throw new Error(`Object not found: ${id}`);
    
    switch (obj.meta.type) {
      case 'system-prompt':
        return systemPromptData.remove(id);
      case 'feature-flag':
        return featureFlagData.remove(id);
      default:
        throw new Error(`Unknown experience type: ${obj.meta.type}`);
    }
  }, [objects, systemPromptData.remove, featureFlagData.remove]);
  
  // Route duplicate to appropriate hook
  const duplicate = useCallback(async (id: string) => {
    const obj = objects.find(o => o.meta.id === id);
    if (!obj) throw new Error(`Object not found: ${id}`);
    
    switch (obj.meta.type) {
      case 'system-prompt':
        return systemPromptData.duplicate?.(id);
      case 'feature-flag':
        return featureFlagData.duplicate?.(id);
      default:
        throw new Error(`Unknown experience type: ${obj.meta.type}`);
    }
  }, [objects, systemPromptData.duplicate, featureFlagData.duplicate]);
  
  return {
    objects,
    loading,
    error,
    create,
    update,
    remove,
    duplicate,
  };
}
```

---

### Phase 5: Update Console Config for Dynamic Generation

**File:** `src/bedrock/consoles/ExperienceConsole/ExperienceConsole.config.ts`

Replace the existing config with registry-driven generation:

```typescript
// Experience Console Configuration
// DEX: Declarative Sovereignty - config generated from registry, not hardcoded

import type { ConsoleConfig } from '../../types/console.types';
import { EXPERIENCE_TYPE_REGISTRY, getAllExperienceTypes } from '../../types/experience.types';

/**
 * Generate filter options from registry
 * Includes type filter plus type-specific filters
 */
function generateFilterOptions() {
  const types = getAllExperienceTypes();
  
  // Base type filter (always present)
  const typeFilter = {
    field: 'meta.type',
    label: 'Type',
    type: 'select' as const,
    options: types.map(t => t.type),
  };
  
  // Status filter (common to all)
  const statusFilter = {
    field: 'meta.status',
    label: 'State',
    type: 'select' as const,
    options: ['active', 'draft', 'archived'],
  };
  
  // Collect type-specific filters
  const typeSpecificFilters: any[] = [];
  for (const typeDef of types) {
    if (typeDef.filters) {
      typeSpecificFilters.push(...typeDef.filters);
    }
  }
  
  return [statusFilter, typeFilter, ...typeSpecificFilters];
}

/**
 * Generate sort options from registry
 * Includes common sorts plus type-specific sorts
 */
function generateSortOptions() {
  const types = getAllExperienceTypes();
  
  // Common sort options
  const commonSorts = [
    { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' as const },
    { field: 'meta.title', label: 'Name', direction: 'asc' as const },
    { field: 'meta.type', label: 'Type', direction: 'asc' as const },
  ];
  
  // Collect type-specific sorts
  const typeSpecificSorts: any[] = [];
  for (const typeDef of types) {
    if (typeDef.sortOptions) {
      typeSpecificSorts.push(...typeDef.sortOptions);
    }
  }
  
  return [...commonSorts, ...typeSpecificSorts];
}

/**
 * Generate metrics from registry
 * Includes total count plus type-specific metrics
 */
function generateMetrics() {
  const types = getAllExperienceTypes();
  
  // Total across all types
  const totalMetric = {
    id: 'total',
    label: 'Total',
    icon: 'category',
    query: 'count(*)',
  };
  
  // Per-type count metrics
  const typeCountMetrics = types.map(t => ({
    id: `count-${t.type}`,
    label: t.label,
    icon: t.icon,
    query: `count(where: meta.type=${t.type})`,
  }));
  
  return [totalMetric, ...typeCountMetrics];
}

/**
 * Experience Console Configuration
 * Generated dynamically from EXPERIENCE_TYPE_REGISTRY
 */
export const experienceConsoleConfig: ConsoleConfig = {
  id: 'experience',
  title: 'Experience',
  subtitle: 'Manage AI behaviors and features',
  description: 'Configure system prompts, feature flags, and other experience controls',

  metrics: generateMetrics(),

  navigation: [],

  collectionView: {
    searchFields: [
      'meta.title',
      'meta.description',
      'payload.identity',
      'payload.voiceGuidelines',
      'payload.flagId',
      'payload.headerLabel',
    ],
    filterOptions: generateFilterOptions(),
    sortOptions: generateSortOptions(),
    defaultSort: { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    defaultFilters: { 'meta.status': 'active' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-experience-favorites',
  },

  primaryAction: { label: 'New', icon: 'add', action: 'create' },

  copilot: {
    enabled: true,
    actions: [
      { id: 'set-title', trigger: 'set title to *', description: 'Update the title' },
      { id: 'audit', trigger: '/audit', description: 'Review for consistency and gaps' },
    ],
    quickActions: [
      { id: 'audit', label: 'Audit', command: '/audit', icon: 'fact_check' },
      { id: 'help', label: 'Help', command: 'help', icon: 'help' },
    ],
  },
};

// Response mode configuration for system prompts (preserved for compatibility)
export const RESPONSE_MODE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  architect: { label: 'Architect', icon: 'architecture', color: '#2F5C3B' },
  librarian: { label: 'Librarian', icon: 'local_library', color: '#526F8A' },
  contemplative: { label: 'Contemplative', icon: 'psychology', color: '#7E57C2' },
};

// Closing behavior configuration for system prompts (preserved for compatibility)
export const CLOSING_BEHAVIOR_CONFIG: Record<string, { label: string; icon: string }> = {
  navigation: { label: 'Navigation', icon: 'explore' },
  question: { label: 'Question', icon: 'help_outline' },
  open: { label: 'Open', icon: 'all_inclusive' },
};

export default experienceConsoleConfig;
```

---

### Phase 6: Create Polymorphic Console Component

**File:** `src/bedrock/consoles/ExperienceConsole/index.ts` (replace existing)

```typescript
// Experience Console - Polymorphic Object Management
// Sprint: unified-experience-console-v1
//
// DEX: Organic Scalability - console discovers types from registry
// DEX: Declarative Sovereignty - component resolution from config

import React from 'react';
import { createBedrockConsole } from '../../patterns/console-factory';
import { experienceConsoleConfig } from './ExperienceConsole.config';
import { useUnifiedExperienceData } from './useUnifiedExperienceData';
import { resolveCardComponent, resolveEditorComponent } from './component-registry';
import { getExperienceTypeDefinition, isExperienceObjectType } from '../../types/experience.types';
import type { ObjectCardProps, ObjectEditorProps } from '../../patterns/console-factory.types';

/**
 * Polymorphic Card Component
 * Resolves actual card component based on object type from registry
 */
const PolymorphicCard: React.FC<ObjectCardProps<any>> = (props) => {
  const { object } = props;
  const objectType = object.meta.type;
  
  // Resolve component from registry
  const typeDef = isExperienceObjectType(objectType) 
    ? getExperienceTypeDefinition(objectType)
    : null;
    
  if (!typeDef) {
    console.error(`Unknown experience type: ${objectType}`);
    return (
      <div className="p-4 border border-red-500 rounded bg-red-500/10">
        <p className="text-red-400 text-sm">Unknown type: {objectType}</p>
      </div>
    );
  }
  
  const CardComponent = resolveCardComponent(typeDef.cardComponent);
  return <CardComponent {...props} />;
};

/**
 * Polymorphic Editor Component
 * Resolves actual editor component based on object type from registry
 */
const PolymorphicEditor: React.FC<ObjectEditorProps<any>> = (props) => {
  const { object } = props;
  const objectType = object.meta.type;
  
  // Resolve component from registry
  const typeDef = isExperienceObjectType(objectType)
    ? getExperienceTypeDefinition(objectType)
    : null;
    
  if (!typeDef) {
    console.error(`Unknown experience type: ${objectType}`);
    return (
      <div className="p-4">
        <p className="text-red-400">Cannot edit unknown type: {objectType}</p>
      </div>
    );
  }
  
  const EditorComponent = resolveEditorComponent(typeDef.editorComponent);
  return <EditorComponent {...props} />;
};

/**
 * Experience Console
 *
 * Polymorphic console managing all registered experience object types.
 * Types are discovered from EXPERIENCE_TYPE_REGISTRY at runtime.
 *
 * Supported types (auto-discovered):
 * - system-prompt: AI personality and behavior configuration
 * - feature-flag: Feature toggles across the application
 * - (future types added to registry will appear automatically)
 *
 * DEX Compliance:
 * - Declarative Sovereignty: Components resolved from registry config
 * - Organic Scalability: New types appear without console modification
 * - Provenance: Type registry documents all type metadata
 *
 * @see EXPERIENCE_TYPE_REGISTRY for type definitions
 * @see component-registry.ts for component mapping
 * @see hook-registry.ts for data hook mapping
 */
export const ExperienceConsole = createBedrockConsole<any>({
  config: experienceConsoleConfig,
  useData: useUnifiedExperienceData,
  CardComponent: PolymorphicCard,
  EditorComponent: PolymorphicEditor,
  copilotTitle: 'Experience Copilot',
  copilotPlaceholder: 'Edit this experience object with AI assistance...',
});

// Re-exports for external use
export { experienceConsoleConfig } from './ExperienceConsole.config';
export { RESPONSE_MODE_CONFIG, CLOSING_BEHAVIOR_CONFIG } from './ExperienceConsole.config';
export { useUnifiedExperienceData } from './useUnifiedExperienceData';
export type { UnifiedExperiencePayload } from './useUnifiedExperienceData';
export { resolveCardComponent, resolveEditorComponent } from './component-registry';

// Type-specific re-exports (for direct access if needed)
export { SystemPromptCard } from './SystemPromptCard';
export { SystemPromptEditor } from './SystemPromptEditor';
export { FeatureFlagCard } from './FeatureFlagCard';
export { FeatureFlagEditor } from './FeatureFlagEditor';
export { useExperienceData, createDefaultSystemPrompt } from './useExperienceData';
export { useFeatureFlagsData } from './useFeatureFlagsData';

// Category config for feature flags (preserved for component use)
export { CATEGORY_CONFIG } from './FeatureFlagConsole.config';

export default ExperienceConsole;
```

---

### Phase 7: Route and Navigation Cleanup

**File:** `src/router/routes.tsx`

Remove the feature-flags route and import:

```diff
- const FeatureFlagConsole = lazy(() => import('../bedrock/consoles/ExperienceConsole/FeatureFlagConsole'));

// In children array of /bedrock route:
- {
-   path: 'feature-flags',
-   element: (
-     <Suspense fallback={<ConsoleLoadingFallback />}>
-       <FeatureFlagConsole />
-     </Suspense>
-   ),
- },
```

**File:** `src/bedrock/config/navigation.ts`

Remove the feature-flags entries:

```diff
// In BEDROCK_NAV_ITEMS array:
- {
-   id: 'feature-flags',
-   label: 'Feature Flags',
-   icon: 'toggle_on',
-   path: '/bedrock/feature-flags',
- },

// In CONSOLE_METADATA object:
- 'feature-flags': {
-   id: 'feature-flags',
-   title: 'Feature Flags',
-   description: 'Manage feature toggles for /explore',
-   icon: 'toggle_on',
-   path: '/bedrock/feature-flags',
- },
```

Update Experience entry description:

```diff
  experience: {
    id: 'experience',
    title: 'Experience',
-   description: 'Manage AI system prompts for /explore',
+   description: 'Manage system prompts, feature flags, and experience configuration',
    icon: 'smart_toy',
    path: '/bedrock/experience',
  },
```

---

### Phase 8: Delete Obsolete Files

**Files to Delete:**
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagConsole.tsx`

Note: Keep `FeatureFlagConsole.config.ts` temporarily - it exports `CATEGORY_CONFIG` which is used by `FeatureFlagCard.tsx`. Either move that export to a shared location or keep the file.

**Alternative:** Move `CATEGORY_CONFIG` to a better location:

```typescript
// src/bedrock/consoles/ExperienceConsole/feature-flag.config.ts
// Category configuration for Feature Flag display

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  experience: { label: 'Experience', icon: 'explore', color: '#2F5C3B' },
  research: { label: 'Research', icon: 'science', color: '#7E57C2' },
  experimental: { label: 'Experimental', icon: 'labs', color: '#D95D39' },
  internal: { label: 'Internal', icon: 'settings', color: '#526F8A' },
};
```

Then update imports in `FeatureFlagCard.tsx` and delete `FeatureFlagConsole.config.ts`.

---

## File Inventory

### Files to Create

| File | Purpose |
|------|---------|
| `component-registry.ts` | Maps component names to actual components |
| `hook-registry.ts` | Maps hook names to actual hooks |
| `useUnifiedExperienceData.ts` | Composes data from all registered types |
| `feature-flag.config.ts` | Display config for feature flags (extracted) |

### Files to Modify

| File | Change |
|------|--------|
| `experience.types.ts` | Add cardComponent, dataHookName, metrics, filters, sortOptions |
| `ExperienceConsole.config.ts` | Generate config from registry |
| `ExperienceConsole/index.ts` | Replace with polymorphic console |
| `routes.tsx` | Remove feature-flags route |
| `navigation.ts` | Remove feature-flags nav entry, update Experience description |
| `FeatureFlagCard.tsx` | Update CATEGORY_CONFIG import |

### Files to Delete

| File | Reason |
|------|--------|
| `FeatureFlagConsole.tsx` | Replaced by polymorphic console |
| `FeatureFlagConsole.config.ts` | Config merged into registry (after extracting CATEGORY_CONFIG) |

---

## User Stories

### US-001: Unified Type View
**As a** Grove admin  
**I want to** see both system prompts and feature flags in a single console  
**So that** I can manage all experience objects from one place

**Acceptance Criteria:**
- `/bedrock/experience` displays both object types
- Objects are visually distinguishable by type badge/icon
- Total count reflects all types combined

### US-002: Type Filtering
**As a** Grove admin  
**I want to** filter by object type  
**So that** I can focus on specific configurations

**Acceptance Criteria:**
- Type dropdown shows: All types dynamically from registry
- Selecting type filters the collection view
- Filter persists during session
- Clearing filter shows all types

### US-003: Type-Appropriate Editing
**As a** Grove admin  
**I want to** edit objects with type-specific editors  
**So that** I see relevant fields for each type

**Acceptance Criteria:**
- Clicking system prompt opens SystemPromptEditor
- Clicking feature flag opens FeatureFlagEditor
- Copilot context adapts to object type

### US-004: Future Type Extensibility
**As a** Grove developer  
**I want to** add new experience types via registry only  
**So that** I don't need to modify the console component

**Acceptance Criteria:**
- New type appears after registry + component/hook registration
- Console component itself requires no changes
- DEX compliance test passes

---

## Testing Requirements

### Unit Tests

**File:** `src/bedrock/types/__tests__/experience.types.test.ts`

```typescript
import { getAllExperienceTypes, getExperienceTypeDefinition } from '../experience.types';

describe('Experience Type Registry', () => {
  it('includes cardComponent for all types', () => {
    for (const typeDef of getAllExperienceTypes()) {
      expect(typeDef.cardComponent).toBeDefined();
      expect(typeof typeDef.cardComponent).toBe('string');
    }
  });
  
  it('includes dataHookName for all types', () => {
    for (const typeDef of getAllExperienceTypes()) {
      expect(typeDef.dataHookName).toBeDefined();
      expect(typeof typeDef.dataHookName).toBe('string');
    }
  });
  
  it('includes editorComponent for all types', () => {
    for (const typeDef of getAllExperienceTypes()) {
      expect(typeDef.editorComponent).toBeDefined();
    }
  });
  
  it('has consistent routePath for unified console', () => {
    for (const typeDef of getAllExperienceTypes()) {
      expect(typeDef.routePath).toBe('/bedrock/experience');
    }
  });
});
```

**File:** `src/bedrock/consoles/ExperienceConsole/__tests__/component-registry.test.ts`

```typescript
import { resolveCardComponent, resolveEditorComponent } from '../component-registry';
import { getAllExperienceTypes } from '../../../types/experience.types';

describe('Component Registry', () => {
  it('resolves all registered card components', () => {
    for (const typeDef of getAllExperienceTypes()) {
      expect(() => resolveCardComponent(typeDef.cardComponent)).not.toThrow();
      const Component = resolveCardComponent(typeDef.cardComponent);
      expect(Component).toBeDefined();
    }
  });
  
  it('resolves all registered editor components', () => {
    for (const typeDef of getAllExperienceTypes()) {
      expect(() => resolveEditorComponent(typeDef.editorComponent)).not.toThrow();
      const Component = resolveEditorComponent(typeDef.editorComponent);
      expect(Component).toBeDefined();
    }
  });
  
  it('throws for unknown card components', () => {
    expect(() => resolveCardComponent('UnknownCard')).toThrow(/not found in registry/);
  });
  
  it('throws for unknown editor components', () => {
    expect(() => resolveEditorComponent('UnknownEditor')).toThrow(/not found in registry/);
  });
});
```

### E2E Tests

**File:** `tests/e2e/experience-console.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Experience Console - Unified View', () => {
  test('displays objects of multiple types', async ({ page }) => {
    await page.goto('/bedrock/experience');
    
    // Should see type filter
    await expect(page.getByLabel('Type')).toBeVisible();
    
    // Verify console loaded
    await expect(page.locator('[data-testid="metrics-row"]')).toBeVisible();
  });

  test('type filter works correctly', async ({ page }) => {
    await page.goto('/bedrock/experience');
    
    // Get initial count
    const initialCards = await page.locator('[data-object-card]').count();
    
    // Filter to feature flags only
    await page.getByLabel('Type').click();
    await page.getByRole('option', { name: 'feature-flag' }).click();
    
    // All visible cards should be feature flags
    const cards = page.locator('[data-object-type="feature-flag"]');
    const filteredCount = await cards.count();
    
    // Should have filtered (assuming some of each type exist)
    if (initialCards > 0) {
      expect(filteredCount).toBeLessThanOrEqual(initialCards);
    }
  });

  test('opens correct editor for system prompt', async ({ page }) => {
    await page.goto('/bedrock/experience');
    
    // Filter to system prompts
    await page.getByLabel('Type').click();
    await page.getByRole('option', { name: 'system-prompt' }).click();
    
    // Click first card
    const firstCard = page.locator('[data-object-type="system-prompt"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      
      // Should see system prompt editor fields
      await expect(page.getByText('Identity')).toBeVisible();
      await expect(page.getByText('Voice Guidelines')).toBeVisible();
    }
  });

  test('opens correct editor for feature flag', async ({ page }) => {
    await page.goto('/bedrock/experience');
    
    // Filter to feature flags
    await page.getByLabel('Type').click();
    await page.getByRole('option', { name: 'feature-flag' }).click();
    
    // Click first card
    const firstCard = page.locator('[data-object-type="feature-flag"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      
      // Should see feature flag editor fields
      await expect(page.getByText('Flag ID')).toBeVisible();
      await expect(page.getByText('Availability')).toBeVisible();
    }
  });

  test('old feature-flags route redirects or 404s', async ({ page }) => {
    const response = await page.goto('/bedrock/feature-flags');
    
    // Should either redirect to /bedrock/experience or show 404
    // (depends on router config for unknown routes)
    expect(page.url()).not.toContain('/bedrock/feature-flags');
  });
});
```

### Visual Regression

```bash
# Capture baseline after implementation
npx playwright test tests/e2e/experience-console-baseline.spec.ts --update-snapshots
```

---

## Build Gates

After each phase:

```bash
npm run build          # TypeScript compiles
npm test               # Unit tests pass
```

After Phase 7 (all code complete):

```bash
npx playwright test    # E2E tests pass
```

Final verification:

```bash
# Full test suite
npm run build && npm test && npx playwright test

# Specific console tests
npx playwright test tests/e2e/experience-console.spec.ts

# Visual regression
npx playwright test tests/e2e/*-baseline.spec.ts
```

---

## Rollback Plan

If issues arise:

1. **Immediate:** Revert to previous commit (feature-flags-v1 state)
2. **The separate `/bedrock/feature-flags` route will still work**
3. **No data migration required** - objects unchanged in Supabase

---

## Definition of Done

- [ ] Experience console displays both system prompts and feature flags
- [ ] Type filter works correctly (dynamic from registry)
- [ ] Type-appropriate cards render for each object
- [ ] Type-appropriate editors open for each object
- [ ] `/bedrock/feature-flags` route removed
- [ ] Feature Flags navigation entry removed
- [ ] All CRUD operations work for both types
- [ ] Unit tests pass (registry, component resolution)
- [ ] E2E tests pass (console functionality)
- [ ] Build passes
- [ ] DEX compliance matrix satisfied
- [ ] Adding new type requires only registry + component registration

---

## Appendix: Future Type Addition Guide

After this sprint, adding a new experience type (e.g., `welcome-config`) requires these steps:

### Step 1: Create Schema and Default Payload

```typescript
// src/core/schema/welcome-config.ts
export interface WelcomeConfigPayload {
  headline: string;
  subheadline: string;
  ctaText: string;
  // ... other fields
}

export const DEFAULT_WELCOME_CONFIG_PAYLOAD: WelcomeConfigPayload = {
  headline: 'Welcome to Grove',
  subheadline: 'Your exploration begins here',
  ctaText: 'Get Started',
};
```

### Step 2: Create Card Component

```typescript
// src/bedrock/consoles/ExperienceConsole/WelcomeConfigCard.tsx
export const WelcomeConfigCard: React.FC<ObjectCardProps<WelcomeConfigPayload>> = (props) => {
  // ... implementation
};
```

### Step 3: Create Editor Component

```typescript
// src/bedrock/consoles/ExperienceConsole/WelcomeConfigEditor.tsx
export const WelcomeConfigEditor: React.FC<ObjectEditorProps<WelcomeConfigPayload>> = (props) => {
  // ... implementation
};
```

### Step 4: Create Data Hook

```typescript
// src/bedrock/consoles/ExperienceConsole/useWelcomeConfigData.ts
export function useWelcomeConfigData(): CollectionDataResult<WelcomeConfigPayload> {
  return useGroveData<WelcomeConfigPayload>({
    table: 'welcome_configs',
    // ... configuration
  });
}
```

### Step 5: Register in Type Registry

```typescript
// src/bedrock/types/experience.types.ts
import { WelcomeConfigPayload, DEFAULT_WELCOME_CONFIG_PAYLOAD } from '@core/schema/welcome-config';

export const EXPERIENCE_TYPE_REGISTRY = {
  // ... existing types ...
  
  'welcome-config': {
    type: 'welcome-config',
    label: 'Welcome Config',
    icon: 'waving_hand',
    description: 'Configure onboarding and welcome experiences',
    defaultPayload: DEFAULT_WELCOME_CONFIG_PAYLOAD,
    editorComponent: 'WelcomeConfigEditor',
    cardComponent: 'WelcomeConfigCard',
    dataHookName: 'useWelcomeConfigData',
    allowMultipleActive: false,
    routePath: '/bedrock/experience',
    color: '#2196F3',
  } satisfies ExperienceTypeDefinition<WelcomeConfigPayload>,
};
```

### Step 6: Register Components

```typescript
// src/bedrock/consoles/ExperienceConsole/component-registry.ts
import { WelcomeConfigCard } from './WelcomeConfigCard';
import { WelcomeConfigEditor } from './WelcomeConfigEditor';

export const CARD_COMPONENT_REGISTRY = {
  // ... existing ...
  WelcomeConfigCard,
};

export const EDITOR_COMPONENT_REGISTRY = {
  // ... existing ...
  WelcomeConfigEditor,
};
```

### Step 7: Register Hook

```typescript
// src/bedrock/consoles/ExperienceConsole/hook-registry.ts
import { useWelcomeConfigData } from './useWelcomeConfigData';

export const HOOK_REGISTRY = {
  // ... existing ...
  useWelcomeConfigData,
};
```

### Step 8: Update Unified Hook

```typescript
// src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts

// Add import
import { useWelcomeConfigData } from './useWelcomeConfigData';

// Add to union type
export type UnifiedExperiencePayload = 
  | SystemPromptPayload
  | FeatureFlagPayload
  | WelcomeConfigPayload;  // NEW

// Add hook call
const welcomeConfigData = useWelcomeConfigData();

// Add to objects merge
const objects = useMemo(() => [
  ...systemPromptData.objects,
  ...featureFlagData.objects,
  ...welcomeConfigData.objects,  // NEW
], [...]);

// Add to switch statements
case 'welcome-config':
  return welcomeConfigData.create(payload);
// ... etc for update, remove, duplicate
```

### Step 9: Create Supabase Migration

```sql
-- supabase/migrations/012_welcome_configs.sql
CREATE TABLE welcome_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Summary of Changes for New Type

| Step | File(s) | Type |
|------|---------|------|
| 1 | `core/schema/welcome-config.ts` | Create |
| 2 | `WelcomeConfigCard.tsx` | Create |
| 3 | `WelcomeConfigEditor.tsx` | Create |
| 4 | `useWelcomeConfigData.ts` | Create |
| 5 | `experience.types.ts` | Modify (add entry) |
| 6 | `component-registry.ts` | Modify (add imports) |
| 7 | `hook-registry.ts` | Modify (add import) |
| 8 | `useUnifiedExperienceData.ts` | Modify (add hook) |
| 9 | Supabase migration | Create |

**Files NOT touched:**
- `ExperienceConsole/index.ts` ✓
- `ExperienceConsole.config.ts` ✓
- `routes.tsx` ✓
- `navigation.ts` ✓

This satisfies the DEX Organic Scalability requirement—the console itself requires no modification.

---

*Specification complete. Ready for Foundation Loop execution.*
