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
**Status:** In Progress

Creating `useConsoleData` hook for schema-driven data management.

---

