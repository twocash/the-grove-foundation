# unified-experience-console-v1 Development Log

Sprint: Unified Experience Console
Date: 2026-01-12
Status: In Progress

## Summary

Refactoring the Experience console to be truly polymorphic—driven by `EXPERIENCE_TYPE_REGISTRY` rather than hardcoded to a single type. After this sprint, adding a new experience type requires only registry entries and component/hook registration, with no modifications to the console itself.

Key changes:
- **Extended Registry**: `ExperienceTypeDefinition` gains `cardComponent`, `dataHookName`, `metrics`, `filters`, `sortOptions`
- **Component/Hook Registries**: Runtime resolution of components and data hooks
- **Unified Data Hook**: Composes data from all registered types
- **Route Cleanup**: Remove `/bedrock/feature-flags` route (consolidated into `/bedrock/experience`)

---

## 2026-01-12

### Phase 1: Extend Registry Schema
**Status:** Complete

Extended `ExperienceTypeDefinition` with:
- `cardComponent: string` - Component name for grid/list cards
- `dataHookName: string` - Hook name for CRUD operations
- `metrics?: MetricDefinition[]` - Type-specific metrics
- `filters?: FilterDefinition[]` - Type-specific filters
- `sortOptions?: SortDefinition[]` - Type-specific sort options
- `searchFields?: string[]` - Type-specific search fields

Added new interfaces:
- `MetricDefinition` - For console header metrics
- `FilterDefinition` - For console filter bar
- `SortDefinition` - For console sort dropdown

Updated registry entries with all new fields.
Changed `feature-flag.routePath` from `/bedrock/feature-flags` to `/bedrock/experience`.

Build: Passing

---

### Phase 2: Create Component Registry
**Status:** Complete

Created component registry with:
- `CARD_COMPONENT_REGISTRY` - Maps string names to Card components
- `EDITOR_COMPONENT_REGISTRY` - Maps string names to Editor components
- `resolveCardComponent()` - Runtime resolution with fail-fast error
- `resolveEditorComponent()` - Runtime resolution with fail-fast error

File: `src/bedrock/consoles/ExperienceConsole/component-registry.ts`

Build: Passing

---

### Phase 3: Create Hook Registry
**Status:** Complete

Created hook registry with:
- `HOOK_REGISTRY` - Maps string names to data hooks
- `resolveDataHook()` - Runtime resolution with fail-fast error
- `hasDataHook()` - Check if hook is registered
- `validateHookRegistrations()` - Validate all types have registered hooks

File: `src/bedrock/consoles/ExperienceConsole/hook-registry.ts`

Note: React hooks cannot be called dynamically, so this registry is primarily for validation and introspection. Actual hook calls must be explicit in `useUnifiedExperienceData`.

Build: Passing

---

### Phase 4: Create Unified Data Hook
**Status:** Complete

Created unified data hook that:
- Calls all registered type hooks explicitly (React Rules of Hooks)
- Merges objects from all sources
- Routes CRUD operations to appropriate underlying hook based on object type
- Maintains type discrimination via `object.meta.type`

File: `src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts`

Key types:
- `UnifiedExperiencePayload` - Union of `SystemPromptPayload | FeatureFlagPayload`

Build: Passing

---

### Phase 5: Update Console Config for Dynamic Generation
**Status:** Complete

Rewrote `ExperienceConsole.config.ts` with dynamic generation:
- `getUnifiedConsoleTypes()` - Gets types that display in unified console
- `generateFilterOptions()` - Generates filters from registry
- `generateSortOptions()` - Generates sorts from registry
- `generateMetrics()` - Generates metrics from registry
- `generateSearchFields()` - Collects search fields from all types

Configuration now generated from `EXPERIENCE_TYPE_REGISTRY` at runtime.

Build: Passing

---

### Phase 6: Create Polymorphic Console Component
**Status:** Complete

Rewrote `index.ts` with polymorphic components:
- `PolymorphicCard` - Resolves card component based on `object.meta.type`
- `PolymorphicEditor` - Resolves editor component based on `object.meta.type`
- Uses `React.createElement` for dynamic component rendering
- Re-exports all type-specific components, hooks, and configs

The ExperienceConsole is now truly polymorphic—new types appear automatically when added to registry.

Build: Passing

---

### Phase 7: Route and Navigation Cleanup
**Status:** Complete

Removed feature-flags route and navigation:
- `routes.tsx`: Removed FeatureFlagConsole import and `/feature-flags` route
- `navigation.ts`: Removed feature-flags nav item and metadata entry
- Updated Experience description to "Unified management: system prompts, feature flags, and more"

Build: Passing

---

### Phase 8: Delete Obsolete Files
**Status:** Complete

Deleted obsolete files:
- `FeatureFlagConsole.tsx` - Standalone console wrapper (now replaced by polymorphic console)

Preserved files:
- `FeatureFlagConsole.config.ts` - Contains `CATEGORY_CONFIG` used by card/editor components

Build: Passing

---

### Phase 9: Visual Verification
**Status:** Complete

Verified at `http://localhost:3001/bedrock/experience`:
- Title: "Experience" with subtitle "Unified management: system prompts, feature flags, and more"
- Metrics: Shows Total, System Prompt, Feature Flag counts (dynamically generated)
- Filters: State, Type, Availability, Category, Header (registry-driven)
- Cards: Both system prompts and feature flags display in unified grid
- Polymorphic rendering: Each type uses its own card component
- Navigation: Feature Flags entry removed, only Experience remains

All phases complete. Sprint successful.

---

## Sprint Complete

**Summary:**
The Experience console is now truly polymorphic. Adding a new experience type requires:
1. Add type definition to `EXPERIENCE_TYPE_REGISTRY`
2. Create Card and Editor components
3. Create data hook
4. Register components in `component-registry.ts`
5. Register hook in `hook-registry.ts`
6. Add hook call to `useUnifiedExperienceData.ts` (React Rules of Hooks constraint)

No modifications needed to the console itself.

**DEX Compliance:**
- Declarative Sovereignty: Components resolved from registry config
- Capability Agnosticism: Console works regardless of which types are registered
- Provenance: Type registry documents all type metadata
- Organic Scalability: New types appear without console modification
