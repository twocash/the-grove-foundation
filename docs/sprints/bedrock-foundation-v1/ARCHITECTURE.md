# Architecture: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Version:** 1.0  
**Date:** December 30, 2024  

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BEDROCK ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         /bedrock/lenses                              │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ BedrockLayout                                                │    │    │
│  │  │  ┌───────────┬──────────────────────┬──────────────────┐    │    │    │
│  │  │  │BedrockNav │ LensWorkshop         │BedrockInspector  │    │    │    │
│  │  │  │           │  ┌────────────────┐  │ ┌──────────────┐ │    │    │    │
│  │  │  │ NavItems  │  │ FilterBar      │  │ │ LensEditor   │ │    │    │    │
│  │  │  │ from      │  └────────────────┘  │ └──────────────┘ │    │    │    │
│  │  │  │ config    │  ┌────────────────┐  │ ┌──────────────┐ │    │    │    │
│  │  │  │           │  │ LensGrid       │  │ │BedrockCopilot│ │    │    │    │
│  │  │  │           │  │  (ObjectGrid)  │  │ └──────────────┘ │    │    │    │
│  │  │  │           │  └────────────────┘  │                  │    │    │    │
│  │  │  └───────────┴──────────────────────┴──────────────────┘    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │ useCollectionView    │  │ usePatchHistory      │                         │
│  │ - filter/sort/fav    │  │ - undo/redo stack    │                         │
│  │ - search             │  │ - inverse patches    │                         │
│  └──────────┬───────────┘  └──────────┬───────────┘                         │
│             │                         │                                      │
│             └────────────┬────────────┘                                      │
│                          │                                                   │
│  ┌───────────────────────▼───────────────────────┐                          │
│  │ GroveApi                                       │                          │
│  │ - REST client                                  │                          │
│  │ - GroveObject envelope                         │                          │
│  │ - Optimistic updates                           │                          │
│  └───────────────────────┬───────────────────────┘                          │
│                          │                                                   │
│  ┌───────────────────────▼───────────────────────┐                          │
│  │ /api/lenses                                    │                          │
│  │ - GET / POST / PATCH / DELETE                  │                          │
│  │ - GroveObject response format                  │                          │
│  └───────────────────────────────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### GroveObject (Base)

```typescript
// src/core/schema/grove-object.ts (EXTEND)

interface GroveObjectMeta {
  id: string;
  type: GroveObjectType;
  title: string;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  createdBy: string;        // User ID or 'system'
  version: number;          // For optimistic locking
  tags?: string[];
}

interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}

type GroveObjectType = 
  | 'lens' 
  | 'sprout' 
  | 'journey' 
  | 'node' 
  | 'moment' 
  | 'hub' 
  | 'persona';
```

### Lens (Payload)

```typescript
// src/bedrock/types/lens.ts (NEW)

type LensCategory = 'role' | 'interest' | 'context' | 'custom';

type FilterOperator = 
  | 'equals' 
  | 'not_equals'
  | 'contains' 
  | 'not_contains'
  | 'in' 
  | 'not_in'
  | 'range'         // { min?, max? }
  | 'exists'        // Has value
  | 'not_exists';   // Is null/empty

interface LensFilter {
  field: string;
  operator: FilterOperator;
  value: string | string[] | number | { min?: number; max?: number };
}

interface LensPayload {
  name: string;
  description: string;
  category: LensCategory;
  filters: LensFilter[];
  sortPriority: number;
  isActive: boolean;
  iconEmoji?: string;
  color?: string;
}

type Lens = GroveObject<LensPayload>;
```

### Console Configuration

```typescript
// src/bedrock/types/console.types.ts (NEW)

interface ConsoleConfig {
  id: string;
  title: string;
  description: string;
  
  primaryAction: {
    label: string;
    icon: string;
    action: 'create' | 'custom';
  };
  
  metrics: MetricConfig[];
  navigation: NavItemConfig[];
  collectionView: CollectionViewConfig;
  copilot: CopilotConfig;
}

interface MetricConfig {
  id: string;
  label: string;
  query: string;           // e.g., 'count(*)' or 'count(where: isActive)'
  format?: 'number' | 'relative' | 'percentage';
}

interface NavItemConfig {
  id?: string;
  type?: 'divider';
  label?: string;
  icon?: string;
  filter?: Record<string, any>;
}

interface CollectionViewConfig {
  searchFields: string[];
  sortOptions: SortOption[];
  defaultSort: SortOption;
  filterOptions: FilterOption[];
  viewModes: ('grid' | 'list')[];
  defaultViewMode: 'grid' | 'list';
  favoritesKey: string;
}

interface CopilotConfig {
  enabled: boolean;
  model?: string;
  actions: CopilotAction[];
}
```

---

## API Contract

### Endpoints

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/lenses` | GET | `?page&pageSize&filters` | `ApiResponse<Lens[]>` |
| `/api/lenses/:id` | GET | - | `ApiResponse<Lens>` |
| `/api/lenses` | POST | `{ payload, meta? }` | `ApiResponse<Lens>` |
| `/api/lenses/:id` | PATCH | `{ operations: PatchOp[] }` | `ApiResponse<Lens>` |
| `/api/lenses/:id` | DELETE | - | `{ success: true }` |

### Response Envelope

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    count?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}
```

### Patch Operations

```typescript
interface PatchOperation {
  op: 'replace' | 'add' | 'remove';
  path: string;           // JSON Pointer format: /payload/description
  value?: unknown;
}

// Example: Update description
[{ op: 'replace', path: '/payload/description', value: 'New description' }]
```

---

## Component Architecture

### BedrockLayout

```typescript
interface BedrockLayoutProps {
  config: ConsoleConfig;
  navigation: React.ReactNode;
  content: React.ReactNode;
  inspector?: React.ReactNode;
  inspectorOpen: boolean;
  onInspectorToggle: () => void;
}

// Renders:
// - ConsoleHeader (from config.title, config.description, config.primaryAction)
// - MetricsRow (from config.metrics)
// - Three-column grid: nav (240px) | content (flex) | inspector (360px)
```

### useCollectionView

```typescript
interface UseCollectionViewOptions<T extends GroveObject> {
  objects: T[];
  config: CollectionViewConfig;
  initialState?: Partial<CollectionViewState>;
}

interface CollectionViewState {
  searchQuery: string;
  activeFilters: Record<string, FilterValue>;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  favorites: Set<string>;
  showFavoritesOnly: boolean;
  viewMode: 'grid' | 'list';
  navFilter: Record<string, any>;
}

interface CollectionViewReturn<T extends GroveObject> {
  // Computed
  results: T[];
  totalCount: number;
  filteredCount: number;
  
  // State
  state: CollectionViewState;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setFilter: (field: string, value: FilterValue) => void;
  clearFilters: () => void;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  toggleFavorite: (id: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setNavFilter: (filter: Record<string, any>) => void;
  
  // Derived
  activeFilterCount: number;
  isFavorite: (id: string) => boolean;
}
```

### usePatchHistory

```typescript
interface PatchHistoryEntry {
  forward: PatchOperation[];
  inverse: PatchOperation[];
  timestamp: number;
  source: 'user' | 'copilot';
}

interface UsePatchHistoryReturn {
  applyPatch: (ops: PatchOperation[], source?: 'user' | 'copilot') => void;
  undo: () => PatchOperation[] | null;
  redo: () => PatchOperation[] | null;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  clearHistory: () => void;
}
```

### BedrockCopilot

```typescript
interface BedrockCopilotProps {
  consoleId: string;
  selectedObject: GroveObject | null;
  schema: ObjectSchema | null;
  availableActions: CopilotAction[];
  onPatchGenerated: (patch: PatchOperation[]) => void;
  onPatchApplied: () => void;
  onPatchRejected: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

// Internal flow:
// 1. User types command
// 2. Send to Gemini with context (object, schema, actions)
// 3. Gemini returns patch operations
// 4. Validate against schema
// 5. Show preview diff
// 6. User clicks Apply → onPatchGenerated
// 7. Parent applies patch → onPatchApplied
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                        │
│  │ API Response │                                                        │
│  │ (Lens[])     │                                                        │
│  └──────┬───────┘                                                        │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────────┐                                                │
│  │ useCollectionView    │◀─────── User actions (search, filter, sort)    │
│  │                      │                                                │
│  │ - Filters objects    │                                                │
│  │ - Sorts results      │                                                │
│  │ - Tracks favorites   │                                                │
│  └──────────┬───────────┘                                                │
│             │                                                            │
│             │ results[]                                                  │
│             ▼                                                            │
│  ┌──────────────────────┐                                                │
│  │ ObjectGrid           │                                                │
│  │                      │                                                │
│  │ - Renders LensCard[] │                                                │
│  │ - Handles selection  │                                                │
│  └──────────┬───────────┘                                                │
│             │                                                            │
│             │ onSelect(id)                                               │
│             ▼                                                            │
│  ┌──────────────────────┐                                                │
│  │ BedrockUIContext     │                                                │
│  │                      │                                                │
│  │ - selectedObjectId   │                                                │
│  │ - inspectorOpen      │                                                │
│  └──────────┬───────────┘                                                │
│             │                                                            │
│             │ selectedObject                                             │
│             ▼                                                            │
│  ┌──────────────────────┐      ┌──────────────────────┐                  │
│  │ LensEditor           │      │ BedrockCopilot       │                  │
│  │                      │      │                      │                  │
│  │ - Form fields        │      │ - NL input           │                  │
│  │ - Direct edits       │      │ - Patch generation   │                  │
│  └──────────┬───────────┘      └──────────┬───────────┘                  │
│             │                             │                              │
│             │ onChange                    │ onPatchGenerated             │
│             └──────────────┬──────────────┘                              │
│                            │                                             │
│                            ▼                                             │
│  ┌──────────────────────────────────────────┐                            │
│  │ usePatchHistory                          │                            │
│  │                                          │                            │
│  │ - Records patch + inverse                │                            │
│  │ - Enables undo/redo                      │                            │
│  └──────────────────────┬───────────────────┘                            │
│                         │                                                │
│                         │ patch applied                                  │
│                         ▼                                                │
│  ┌──────────────────────────────────────────┐                            │
│  │ GroveApi.patch()                         │                            │
│  │                                          │                            │
│  │ - Optimistic local update                │                            │
│  │ - PATCH /api/lenses/:id                  │                            │
│  │ - Revalidate on response                 │                            │
│  └──────────────────────────────────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Copilot Context Protocol

When a lens is selected, Copilot receives:

```typescript
interface CopilotContext {
  console: 'lens-workshop';
  
  selectedObject: {
    meta: GroveObjectMeta;
    payload: LensPayload;
  };
  
  schema: {
    type: 'object';
    properties: {
      'payload.name': { type: 'string', maxLength: 100 };
      'payload.description': { type: 'string', maxLength: 500 };
      'payload.category': { type: 'string', enum: ['role', 'interest', 'context', 'custom'] };
      'payload.isActive': { type: 'boolean' };
      // ...
    };
    required: ['payload.name', 'payload.category'];
  };
  
  availableActions: [
    { id: 'edit-field', trigger: 'set * to *' },
    { id: 'validate', trigger: 'validate' },
    { id: 'duplicate', trigger: 'duplicate' },
  ];
}
```

---

## DEX Compliance

### Declarative Sovereignty ✅

| Element | Declarative Location |
|---------|---------------------|
| Navigation | `LensWorkshop.config.ts` → `navigation[]` |
| Metrics | `LensWorkshop.config.ts` → `metrics[]` |
| Filters | `LensWorkshop.config.ts` → `collectionView.filterOptions[]` |
| Sorts | `LensWorkshop.config.ts` → `collectionView.sortOptions[]` |
| Copilot actions | `LensWorkshop.config.ts` → `copilot.actions[]` |

**Test:** Non-technical user can add a filter by editing config JSON.

### Capability Agnosticism ✅

| Scenario | System Behavior |
|----------|-----------------|
| Copilot offline | Manual editing works; Copilot shows "unavailable" |
| Invalid patch | Schema validation rejects; error shown |
| Model hallucination | Preview shown; user can reject |

**Test:** System works identically without Copilot.

### Provenance ✅

| Data Point | Location |
|------------|----------|
| Creator | `meta.createdBy` |
| Created time | `meta.createdAt` |
| Updated time | `meta.updatedAt` |
| Version | `meta.version` |
| Edit source | `PatchHistoryEntry.source` ('user' | 'copilot') |

**Test:** Can trace any change to its origin.

### Organic Scalability ✅

| New Requirement | Approach |
|-----------------|----------|
| New lens category | Add to `LensCategory` type |
| New filter option | Add to `config.collectionView.filterOptions[]` |
| New console | New config + card + editor (primitives reused) |

**Test:** New object type uses Bedrock primitives without modification.

---

## File Structure

```
src/bedrock/
├── primitives/
│   ├── BedrockLayout.tsx
│   ├── BedrockNav.tsx
│   ├── BedrockInspector.tsx
│   ├── BedrockCopilot.tsx
│   ├── ConsoleHeader.tsx
│   ├── MetricsRow.tsx
│   └── StatCard.tsx
├── components/
│   ├── FilterBar.tsx
│   ├── ObjectGrid.tsx
│   ├── ObjectList.tsx
│   ├── ObjectCard.tsx
│   ├── FavoriteToggle.tsx
│   ├── ViewModeToggle.tsx
│   └── EmptyState.tsx
├── patterns/
│   ├── useCollectionView.ts
│   ├── usePatchHistory.ts
│   ├── useBedrockCopilot.ts
│   ├── GroveApi.ts
│   └── collection-view.types.ts
├── context/
│   ├── BedrockUIContext.tsx
│   └── BedrockCopilotContext.tsx
├── consoles/
│   └── LensWorkshop/
│       ├── index.ts
│       ├── LensWorkshop.tsx
│       ├── LensWorkshop.config.ts
│       ├── LensGrid.tsx
│       ├── LensCard.tsx
│       ├── LensEditor.tsx
│       └── LensCopilotActions.ts
├── types/
│   ├── lens.ts
│   ├── console.types.ts
│   └── copilot.types.ts
└── config/
    └── navigation.ts

src/app/bedrock/
├── layout.tsx
├── page.tsx
└── lenses/
    └── page.tsx

tests/
├── unit/
│   ├── useCollectionView.test.ts
│   ├── usePatchHistory.test.ts
│   └── GroveApi.test.ts
├── integration/
│   └── LensWorkshop.integration.test.ts
└── e2e/
    ├── bedrock-primitives.spec.ts
    ├── bedrock-collection.spec.ts
    ├── bedrock-crud.spec.ts
    ├── bedrock-copilot.spec.ts
    └── bedrock-baseline.spec.ts
```

---

**Proceed to MIGRATION_MAP.md.**
