# Console Factory v2 Development Log

Sprint: Console Factory v2
Date: 2026-01-12
Status: In Progress

## Summary

Replace hard-coded console pages with a schema-driven Console Factory. The frontend implementation of Trellis architecture—separating configuration from execution.

**Architecture:** `ConsoleSchema (JSON) → ConsoleFactory (Engine) → Consistent UI`

---

## 2026-01-12

### Phase 1: Schema & Types
**Status:** Complete

Created type contracts for the Console Factory system:

**ConsoleSchema.ts** (`src/bedrock/types/ConsoleSchema.ts`):
- `FilterDef` - Filter bar configuration
- `InspectorField` - Inspector form field definition
- `InspectorSchema` - Inspector panel layout
- `SortDef` - Sort option configuration
- `ListSchema` - List/grid configuration
- `ActionDef` - Action button configuration
- `ConsoleSchema` - Complete console DNA
- `ConsoleSchemaRegistry` - Maps console IDs to schemas
- `isConsoleSchema()` - Type guard

**services/types.ts** (`src/bedrock/services/types.ts`):
- `ServiceResponse<T>` - Standard response wrapper
- `IDataService<T>` - CRUD interface contract
- `IQueryableDataService<T>` - Extended with search/count
- `ServiceRegistry` - Maps console IDs to services
- `BaseEntity`, `EntityWithMeta` - Entity base types
- `DraftState<T>`, `DraftActions<T>` - Buffered editing types
- `isSuccessResponse()`, `isBaseEntity()` - Type guards

Build: Passing
Gate: TypeScript compiles with no errors ✓

---

### Phase 2: Console Definitions
**Status:** Complete

Created console schemas in `src/bedrock/config/consoles.ts`:

**Schemas defined:**
- `systemPromptSchema` - AI behavior/personality configuration
- `featureFlagSchema` - Feature toggle management
- `researchSproutSchema` - Research thread management
- `promptArchitectConfigSchema` - Research DNA configuration

**Registry utilities:**
- `CONSOLE_SCHEMA_REGISTRY` - Maps IDs to schemas
- `getConsoleSchema()` - Lookup by ID
- `getAllConsoleSchemas()` - Get all schemas
- `hasConsoleSchema()` - Check registration

Each schema includes:
- Identity (title, subtitle, icon, color)
- Filters with field paths and options
- List config (cardVariant, sortOptions, viewToggle)
- Inspector config (fields, sections, title/status mapping)
- Card actions and inspector actions
- Metrics with pseudo-queries

Build: Passing
Gate: TypeScript compiles with no errors ✓

---

### Phase 3: Service Layer
**Status:** Complete

Created mock service implementations in `src/bedrock/services/`:

**types.ts:**
- `ServiceResponse<T>` - Standard response wrapper
- `IDataService<T>` - CRUD interface contract
- `IQueryableDataService<T>` - Extended with search/count
- `DraftState<T>`, `DraftActions<T>` - Buffered editing types
- Type guards for runtime validation

**mock-service.ts:**
- `MockDataStore<T>` - In-memory data store class
- `createMockService<T>()` - Factory for creating mock services
- Pre-configured mock services:
  - `mockSystemPromptService` with sample data
  - `mockFeatureFlagService` with sample data
  - `mockResearchSproutService` with sample data
- `MOCK_SERVICE_REGISTRY` - Maps console IDs to services

**index.ts:**
- Clean exports for all types and services

Build: Passing
Gate: TypeScript compiles with no errors ✓

---

### Phase 4: Universal Data Hook
**Status:** Complete

Created `useConsoleData` hook in `src/bedrock/hooks/useConsoleData.ts`:

**Features:**
- Schema-driven filtering with `applyFilters()`
- Sorting with `applySort()`
- Search with `applySearch()`
- Draft state management for editing
- CRUD operations via service layer
- Metric calculation from pseudo-queries
- Loading/error state management

**API surface:**
- `items`, `filteredItems`, `selectedItem` - data access
- `filters`, `sort`, `searchQuery` - filter/sort state
- `draft` - DraftState with dirty tracking
- CRUD: `refresh()`, `createItem()`, `updateItem()`, `deleteItem()`
- Draft: `loadDraft()`, `updateDraft()`, `saveDraft()`, `resetDraft()`
- `getMetricValue(query)` - compute metrics from items

Build: Passing
Gate: TypeScript compiles with no errors ✓
Commit: 0cf25a6

---

### Phase 5: FilterBar Component
**Status:** Complete

Instead of creating a new FilterBar, created schema adapters to bridge ConsoleSchema to existing components (`src/bedrock/utils/schema-adapters.ts`):

**Filter adapters:**
- `toFilterOption()` - Convert FilterDef to FilterOption
- `toFilterOptions()` - Convert array of FilterDefs
- `formatFilterLabel()` - Human-readable filter value labels

**Sort adapters:**
- `toSortOption()` - Convert SortDef to SortOption
- `toSortOptions()` - Convert array of SortDefs

**Inspector field adapters:**
- `groupFieldsBySection()` - Group fields by section for accordion layout
- `getFieldValue()` - Read value at dot-notation path
- `setFieldValue()` - Set value at dot-notation path (immutable)

**Metric adapters:**
- `evaluateMetricQuery()` - Evaluate pseudo-SQL metric queries

**Collection view adapter:**
- `toCollectionViewConfig()` - Full schema to CollectionViewConfig bridge

Build: Passing
Gate: TypeScript compiles with no errors ✓

---

### Phase 6: UniversalInspector Component
**Status:** Complete

Created schema-driven inspector panel in `src/bedrock/components/UniversalInspector.tsx`:

**Field Renderers:**
- `TextFieldRenderer` - Single-line text input
- `TextareaFieldRenderer` - Multi-line text with min-height
- `NumberFieldRenderer` - Numeric input with min/max/step
- `SelectFieldRenderer` - Dropdown select from options
- `ToggleFieldRenderer` - Boolean toggle switch
- `ReadonlyFieldRenderer` - Display-only field

**Components:**
- `StatusBanner` - Active/inactive status display with dot indicator
- `UniversalInspector` - Main component orchestrating field rendering

**Features:**
- Groups fields by section using `groupFieldsBySection()` adapter
- Renders InspectorSection for each field group
- Uses existing InspectorPanel and InspectorSection from shared/layout
- Actions footer with Save (primary), Duplicate, Delete buttons
- Draft state integration with dirty tracking

Build: Passing
Gate: TypeScript compiles with no errors ✓

---

### Phase 7: ConsoleFactory Component
**Status:** Complete

Created schema-driven console component in `src/bedrock/components/SchemaConsole.tsx`:

**Main Component:**
- `SchemaConsole<T>` - Full console rendered from schema
- Takes schema ID or ConsoleSchema object
- Wires useConsoleData hook automatically
- Integrates with BedrockUIContext for inspector management
- Supports external filters and selection control

**Universal Card:**
- `UniversalCard<T>` - Schema-driven card rendering
- Reads title, subtitle, status from schema paths
- Favorite toggle support
- Active/inactive status badges

**Features:**
- Grid and list view modes
- Search, filter, sort from schema config
- Favorites with localStorage persistence
- Metrics row integration
- Empty states (no items, no results)
- Loading skeletons

**Public API (`src/bedrock/console-factory-v2/index.ts`):**
- All types exported
- Schema registry exports
- Service exports
- Hook exports
- Adapter utility exports
- Component exports

Build: Passing
Gate: TypeScript compiles with no errors ✓

---

### Phase 8: Migration
**Status:** Pending

Replace legacy console components with SchemaConsole.

---

