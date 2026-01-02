# Lens Workshop: Reference Implementation Plan

**Version:** 1.1  
**Date:** December 30, 2025  
**Purpose:** Establish the canonical pattern for all Bedrock consoles  
**Status:** APPROVED — Decisions finalized

---

## Why Lens Workshop First

Lens is the simplest object type with meaningful functionality:
- CRUD operations (create, read, update, delete)
- Collection display (filter, sort, favorite)
- Inspector detail view
- Copilot integration for editing

**Every pattern we establish here becomes the template for Garden, Journey Studio, Moment Designer, and all future consoles.**

---

## Resolved Design Decisions

### API Structure: REST with Standardized Envelopes

**Decision:** REST endpoints returning `GroveObject` shapes.

**Rationale:** `src/server.js` and `src/services/` already support this pattern. tRPC/GraphQL introduces build-chain overhead we don't need yet.

**Implementation:**
- Create `GroveApi` class in `bedrock/patterns/` for automatic GroveObject wrapping/unwrapping
- All endpoints return consistent envelope: `{ data: GroveObject | GroveObject[], meta: { count, page, ... } }`

### Real-time Updates: Optimistic UI, No WebSockets

**Decision:** Patch-based optimistic updates. No WebSocket infrastructure.

**Rationale:** True real-time (OT/CRDTs) is a complexity black hole. The Patch pattern provides perceived real-time without the infrastructure.

**Flow:**
1. Apply patch to local React state immediately (instant feedback)
2. Send patch to server
3. Revalidate on response (confirm or rollback)

### Favorites Persistence: Hybrid

**Decision:** localStorage primary, optional server sync.

**Rationale:** `src/lib/storage/user-preferences.ts` handles local storage well. Server sync only if auth exists.

**Implementation:**
- Fast read/write from localStorage
- Background sync to user profile when authenticated
- Graceful degradation to local-only

### Copilot Model Routing: Simulated

**Decision:** Gemini API for all Copilot actions until local/cloud split is built.

**Implementation:**
- Model indicator shows "cloud" for now
- Architecture supports future local model integration
- No changes needed when we add local routing

### Undo/Redo: Mandatory

**Decision:** Required for all editors via inverse patch stack.

**Rationale:** Workshop tools require mistake recovery. Patch pattern makes this essentially free.

**Implementation:**
- Maintain `history` array of inverse patches
- Cmd+Z / Ctrl+Z triggers undo
- Consider `zundo` if using Zustand, otherwise custom hook

---

## The Canonical Console Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BedrockLayout                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ConsoleHeader                                                           │ │
│ │ ┌───────────────────────────────────────────┬───────────────────────┐   │ │
│ │ │ Title + Description                       │ Primary Action Button │   │ │
│ │ └───────────────────────────────────────────┴───────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ MetricsRow                                                              │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │ │
│ │ │ StatCard │ │ StatCard │ │ StatCard │ │ StatCard │                     │ │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────┬──────────────────────────────────┬────────────────────────┐ │
│ │ BedrockNav │ ContentArea                      │ BedrockInspector       │ │
│ │ (240px)    │ (flex-1)                         │ (360px)                │ │
│ │            │                                  │                        │ │
│ │ NavGroup   │ ┌──────────────────────────────┐ │ ┌────────────────────┐ │ │
│ │  NavItem   │ │ FilterBar                    │ │ │ InspectorHeader    │ │ │
│ │  NavItem   │ │ Search | Filters | Sort      │ │ │                    │ │ │
│ │  NavItem   │ └──────────────────────────────┘ │ ├────────────────────┤ │ │
│ │            │ ┌──────────────────────────────┐ │ │ InspectorContent   │ │ │
│ │ NavGroup   │ │ ObjectGrid / ObjectList      │ │ │ (scrollable)       │ │ │
│ │  NavItem   │ │                              │ │ │                    │ │ │
│ │  NavItem   │ │ ┌────────┐ ┌────────┐       │ │ │ Field editors      │ │ │
│ │            │ │ │ Card   │ │ Card   │       │ │ │ Metadata           │ │ │
│ │            │ │ └────────┘ └────────┘       │ │ │ Actions            │ │ │
│ │            │ │ ┌────────┐ ┌────────┐       │ │ │                    │ │ │
│ │            │ │ │ Card   │ │ Card   │       │ │ ├────────────────────┤ │ │
│ │            │ │ └────────┘ └────────┘       │ │ │ BedrockCopilot     │ │ │
│ │            │ │                              │ │ │ (collapsible)      │ │ │
│ │            │ └──────────────────────────────┘ │ │                    │ │ │
│ │            │                                  │ └────────────────────┘ │ │
│ └────────────┴──────────────────────────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/bedrock/
├── primitives/                      # Reusable structural components
│   ├── BedrockLayout.tsx            # The shell (header, metrics, 3-col)
│   ├── BedrockNav.tsx               # Navigation column
│   ├── BedrockInspector.tsx         # Inspector + Copilot slot
│   ├── BedrockCopilot.tsx           # AI assistant panel
│   ├── ConsoleHeader.tsx            # Title, description, actions
│   ├── MetricsRow.tsx               # Horizontal stat cards
│   └── StatCard.tsx                 # Individual metric display
│
├── components/                      # Reusable UI components
│   ├── FilterBar.tsx                # Search + filter + sort controls
│   ├── ObjectGrid.tsx               # Card grid display
│   ├── ObjectList.tsx               # List display alternative
│   ├── ObjectCard.tsx               # Base card component
│   ├── FavoriteToggle.tsx           # Star button
│   ├── ViewModeToggle.tsx           # Grid/List switcher
│   └── EmptyState.tsx               # No results display
│
├── patterns/                        # Reusable hooks and logic
│   ├── useCollectionView.ts         # Filter/sort/favorite state
│   ├── useBedrockCopilot.ts         # Copilot context and actions
│   ├── usePatchHistory.ts           # Undo/redo via inverse patches
│   ├── GroveApi.ts                  # REST client with GroveObject envelope
│   └── collection-view.types.ts     # Shared type definitions
│
├── context/                         # React context providers
│   ├── BedrockUIContext.tsx         # Workspace-level state
│   └── BedrockCopilotContext.tsx    # Copilot state
│
├── consoles/                        # Individual console implementations
│   └── LensWorkshop/
│       ├── index.ts                 # Public exports
│       ├── LensWorkshop.tsx         # Console root component
│       ├── LensWorkshop.config.ts   # Declarative configuration
│       ├── LensGrid.tsx             # Content area implementation
│       ├── LensCard.tsx             # Card for grid display
│       ├── LensEditor.tsx           # Inspector content
│       └── LensCopilotActions.ts    # Console-specific Copilot actions
│
├── types/                           # TypeScript definitions
│   ├── grove-object.ts              # GroveObject base schema
│   ├── lens.ts                      # Lens-specific types
│   ├── console.types.ts             # Console configuration types
│   └── copilot.types.ts             # Copilot-related types
│
└── config/
    └── navigation.ts                # Global navigation structure
```

---

## Data Model: Lens as GroveObject

```typescript
// src/bedrock/types/grove-object.ts

interface GroveObjectMeta {
  id: string;
  type: GroveObjectType;
  title: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  tags?: string[];
}

interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}

type GroveObjectType = 'lens' | 'sprout' | 'journey' | 'node' | 'moment' | 'hub' | 'persona';
```

```typescript
// src/bedrock/types/lens.ts

type LensCategory = 'role' | 'interest' | 'context' | 'custom';

type FilterOperator = 
  | 'equals' 
  | 'not_equals'
  | 'contains' 
  | 'not_contains'
  | 'in' 
  | 'not_in'
  | 'range'        // For dates/numbers: { min?, max? }
  | 'exists'       // Has value
  | 'not_exists';  // Is empty/null

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

---

## API Pattern: GroveApi Class

```typescript
// src/bedrock/patterns/GroveApi.ts

interface ApiResponse<T> {
  data: T;
  meta: {
    count?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
}

interface PatchOperation {
  op: 'replace' | 'add' | 'remove';
  path: string;
  value?: unknown;
}

class GroveApi {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // List objects
  async list<T>(
    objectType: GroveObjectType,
    params?: { page?: number; pageSize?: number; filters?: Record<string, any> }
  ): Promise<ApiResponse<GroveObject<T>[]>> {
    // GET /api/{objectType}?page=1&pageSize=20&...
  }

  // Get single object
  async get<T>(
    objectType: GroveObjectType,
    id: string
  ): Promise<ApiResponse<GroveObject<T>>> {
    // GET /api/{objectType}/{id}
  }

  // Create object
  async create<T>(
    objectType: GroveObjectType,
    payload: T,
    meta?: Partial<GroveObjectMeta>
  ): Promise<ApiResponse<GroveObject<T>>> {
    // POST /api/{objectType}
    // Body: { payload, meta }
  }

  // Update via patch
  async patch<T>(
    objectType: GroveObjectType,
    id: string,
    operations: PatchOperation[]
  ): Promise<ApiResponse<GroveObject<T>>> {
    // PATCH /api/{objectType}/{id}
    // Body: { operations }
  }

  // Delete object
  async delete(
    objectType: GroveObjectType,
    id: string
  ): Promise<void> {
    // DELETE /api/{objectType}/{id}
  }
}

export const groveApi = new GroveApi();
```

---

## Undo/Redo Pattern: usePatchHistory

```typescript
// src/bedrock/patterns/usePatchHistory.ts

interface PatchHistoryEntry {
  forward: PatchOperation[];   // What was applied
  inverse: PatchOperation[];   // How to undo it
  timestamp: number;
  source: 'user' | 'copilot';
}

interface UsePatchHistoryReturn {
  // Apply a patch (adds to history)
  applyPatch: (operations: PatchOperation[], source?: 'user' | 'copilot') => void;
  
  // Undo/redo
  undo: () => PatchOperation[] | null;  // Returns inverse patch to apply
  redo: () => PatchOperation[] | null;  // Returns forward patch to apply
  
  // State
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  
  // Clear history (on object change)
  clearHistory: () => void;
}

function usePatchHistory(maxHistory: number = 50): UsePatchHistoryReturn {
  const [history, setHistory] = useState<PatchHistoryEntry[]>([]);
  const [position, setPosition] = useState(-1);  // Current position in history
  
  // Generate inverse patch for common operations
  const generateInverse = (
    operations: PatchOperation[],
    currentObject: GroveObject
  ): PatchOperation[] => {
    return operations.map(op => {
      if (op.op === 'replace') {
        const currentValue = getValueAtPath(currentObject, op.path);
        return { op: 'replace', path: op.path, value: currentValue };
      }
      if (op.op === 'add') {
        return { op: 'remove', path: op.path };
      }
      if (op.op === 'remove') {
        const currentValue = getValueAtPath(currentObject, op.path);
        return { op: 'add', path: op.path, value: currentValue };
      }
      return op;
    });
  };
  
  // ... implementation
}
```

---

## Console Configuration (Declarative)

```typescript
// src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts

import { ConsoleConfig } from '../../types/console.types';

export const lensWorkshopConfig: ConsoleConfig = {
  id: 'lens-workshop',
  title: 'Lens Workshop',
  description: 'Configure how content is filtered and presented to different audiences',
  
  // Primary action in header
  primaryAction: {
    label: 'New Lens',
    icon: 'plus',
    action: 'create',
  },
  
  // Metrics to display
  metrics: [
    { id: 'total', label: 'Total Lenses', query: 'count(*)' },
    { id: 'active', label: 'Active', query: 'count(where: isActive)' },
    { id: 'drafts', label: 'Drafts', query: 'count(where: !isActive)' },
    { id: 'lastEdited', label: 'Last Edited', query: 'max(updatedAt)', format: 'relative' },
  ],
  
  // Navigation structure
  navigation: [
    { id: 'all', label: 'All Lenses', icon: 'layers', filter: {} },
    { id: 'favorites', label: 'Favorites', icon: 'star', filter: { favorites: true } },
    { type: 'divider' },
    { id: 'role', label: 'By Role', icon: 'users', filter: { category: 'role' } },
    { id: 'interest', label: 'By Interest', icon: 'heart', filter: { category: 'interest' } },
    { id: 'context', label: 'By Context', icon: 'compass', filter: { category: 'context' } },
    { id: 'custom', label: 'Custom', icon: 'settings', filter: { category: 'custom' } },
  ],
  
  // Collection view configuration
  collectionView: {
    searchFields: ['meta.title', 'payload.name', 'payload.description'],
    sortOptions: [
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'meta.updatedAt', label: 'Last Modified', direction: 'desc' },
      { field: 'meta.createdAt', label: 'Created', direction: 'desc' },
      { field: 'payload.sortPriority', label: 'Priority', direction: 'asc' },
    ],
    defaultSort: { field: 'meta.updatedAt', direction: 'desc' },
    filterOptions: [
      { 
        field: 'payload.category', 
        label: 'Category', 
        type: 'select', 
        options: ['role', 'interest', 'context', 'custom'] 
      },
      { 
        field: 'payload.isActive', 
        label: 'Status', 
        type: 'boolean', 
        trueLabel: 'Active', 
        falseLabel: 'Draft' 
      },
      {
        field: 'meta.updatedAt',
        label: 'Last Modified',
        type: 'date-range',
      },
    ],
    viewModes: ['grid', 'list'],
    defaultViewMode: 'grid',
    favoritesKey: 'bedrock:lens-workshop:favorites',
  },
  
  // Copilot configuration
  copilot: {
    enabled: true,
    model: 'gemini',  // Simulated until local/cloud split
    actions: [
      { id: 'edit-field', trigger: 'set * to *', description: 'Edit a specific field' },
      { id: 'suggest-filters', trigger: 'suggest filters', description: 'Get filter recommendations' },
      { id: 'validate', trigger: 'validate', description: 'Check lens configuration' },
      { id: 'duplicate', trigger: 'duplicate', description: 'Create a copy of this lens' },
    ],
  },
};
```

---

## Implementation Sequence (Revised)

### Phase 1: The Shell (Days 1-2)

**Goal:** Empty layout renders with correct structure.

1. `BedrockLayout.tsx` — Reference existing `ThreeColumnLayout`, strip specific logic
2. `ConsoleHeader.tsx` — Title, description, primary action slot
3. `StatCard.tsx` — Single metric display
4. `MetricsRow.tsx` — Horizontal container for stats

**Exit criteria:** Navigate to `/bedrock/lenses`, see empty shell with header and metrics placeholders.

### Phase 2: The Data Layer (Days 3-5)

**Goal:** Core logic works before any UI.

1. `grove-object.ts` — Type definitions
2. `lens.ts` — Lens-specific types with expanded FilterOperator
3. `GroveApi.ts` — REST client with GroveObject envelope
4. `useCollectionView.ts` — Filter/sort/favorite hook
5. `usePatchHistory.ts` — Undo/redo via inverse patches
6. **Unit tests** for all filtering/sorting/patching logic

**Exit criteria:** `useCollectionView` tests pass. Can filter, sort, favorite mock data in isolation.

### Phase 3: The Lens Console (Days 6-10)

**Goal:** CRUD works manually (no Copilot yet).

1. `BedrockNav.tsx` — Navigation from config
2. `FilterBar.tsx` — Search, filters, sort dropdown
3. `ObjectGrid.tsx` — Card grid with selection
4. `LensCard.tsx` — Lens-specific card display
5. `BedrockInspector.tsx` — Inspector shell
6. `LensEditor.tsx` — Form-based editing with validation
7. Wire everything to `useCollectionView` and `GroveApi`

**Exit criteria:** Can create, view, edit, delete lenses via UI. Filter/sort/favorite works. Undo/redo works.

### Phase 4: The Copilot Brain (Days 11-15)

**Goal:** Natural language editing works.

1. `BedrockCopilotContext.tsx` — Context provider
2. Patch generator logic (parse intent → generate patch → validate)
3. Simple text input that logs patches to console (prove it works)
4. `BedrockCopilot.tsx` — Full UI with input, preview, apply/reject
5. `LensCopilotActions.ts` — Lens-specific action handlers
6. Connect to Gemini API

**Exit criteria:** "Set description to X" generates valid patch, shows preview, applies on confirm.

### Phase 5: Polish (Days 16-18)

**Goal:** Production-ready.

1. Empty states (no results, no selection)
2. Loading states (skeleton loaders)
3. Error handling (API failures, validation errors)
4. Keyboard navigation (arrow keys, Enter, Escape)
5. Responsive behavior (collapse panels on mobile)
6. Accessibility audit

**Exit criteria:** Console handles all edge cases gracefully.

---

## Test Strategy

### Unit Tests (Phase 2 — before UI)

```typescript
// useCollectionView.test.ts
describe('useCollectionView', () => {
  it('filters by search query across configured fields');
  it('filters by exact match (equals operator)');
  it('filters by range (dates, numbers)');
  it('filters by exists/not_exists');
  it('sorts ascending and descending');
  it('combines multiple filters with AND logic');
  it('persists favorites to localStorage');
  it('restores favorites on mount');
  it('combines nav filter with user filters');
  it('returns correct counts (total, filtered)');
});

// usePatchHistory.test.ts
describe('usePatchHistory', () => {
  it('tracks applied patches');
  it('generates correct inverse for replace');
  it('generates correct inverse for add');
  it('generates correct inverse for remove');
  it('undo returns inverse patch');
  it('redo returns forward patch');
  it('respects max history limit');
  it('clears redo stack on new patch');
});

// GroveApi.test.ts
describe('GroveApi', () => {
  it('wraps responses in GroveObject envelope');
  it('unwraps requests correctly');
  it('handles pagination params');
  it('handles filter params');
});
```

### Integration Tests (Phase 3)

```typescript
// LensWorkshop.integration.test.ts
describe('Lens Workshop', () => {
  it('loads lenses from API on mount');
  it('displays lenses in grid');
  it('filters update grid display');
  it('selecting lens opens inspector');
  it('editing field triggers patch');
  it('undo reverts last change');
  it('delete removes lens from grid');
});
```

### E2E Tests (Phase 5)

```typescript
// lens-workshop.e2e.ts
describe('Lens Workshop E2E', () => {
  it('complete CRUD flow', async () => {
    await page.goto('/bedrock/lenses');
    
    // Create
    await page.click('[data-testid="create-lens"]');
    await page.fill('[data-testid="lens-name"]', 'Test Lens');
    await page.click('[data-testid="save-lens"]');
    await expect(page.locator('[data-testid="lens-card"]')).toContainText('Test Lens');
    
    // Edit via form
    await page.click('[data-testid="lens-card"]:has-text("Test Lens")');
    await page.fill('[data-testid="lens-description"]', 'Updated description');
    await expect(page.locator('[data-testid="lens-description"]')).toHaveValue('Updated description');
    
    // Undo
    await page.keyboard.press('Control+z');
    await expect(page.locator('[data-testid="lens-description"]')).toHaveValue('');
    
    // Edit via Copilot
    await page.fill('[data-testid="copilot-input"]', 'set description to "From Copilot"');
    await page.click('[data-testid="copilot-apply"]');
    await expect(page.locator('[data-testid="lens-description"]')).toHaveValue('From Copilot');
    
    // Delete
    await page.click('[data-testid="delete-lens"]');
    await page.click('[data-testid="confirm-delete"]');
    await expect(page.locator('[data-testid="lens-card"]')).not.toContainText('Test Lens');
  });
});
```

---

## DEX Compliance Verification

### Declarative Sovereignty ✅

| Element | Declarative? | Evidence |
|---------|--------------|----------|
| Navigation items | ✅ | Defined in `LensWorkshop.config.ts` |
| Filter options | ✅ | Defined in `collectionView.filterOptions` |
| Sort options | ✅ | Defined in `collectionView.sortOptions` |
| Metrics | ✅ | Defined in `metrics` array |
| Copilot actions | ✅ | Defined in `copilot.actions` |

**Test:** Can a non-technical user add a filter option by editing config?  
**Answer:** Yes — add entry to `filterOptions` array. No code changes.

### Capability Agnosticism ✅

| Scenario | Behavior |
|----------|----------|
| Copilot offline | Editor works manually; Copilot shows "unavailable" |
| Invalid patch | Schema validation rejects; error shown; no corruption |
| Model hallucinates | Preview shown; user can reject before applying |

**Test:** Does the system break if the model hallucinates?  
**Answer:** No — patches validated and previewed before application.

### Provenance as Infrastructure ✅

| Data Point | Tracked? |
|------------|----------|
| Who created | ✅ `meta.createdBy` |
| When created | ✅ `meta.createdAt` |
| Last modified | ✅ `meta.updatedAt` |
| Version | ✅ `meta.version` |
| Edit source | ✅ Patch history tracks 'user' vs 'copilot' |

**Test:** Can we answer "who changed this and when"?  
**Answer:** Yes — full audit trail in metadata + patch history.

### Organic Scalability ✅

| New Requirement | Code Change? |
|-----------------|--------------|
| Add lens category | No — add to enum |
| Add filter option | No — add to config |
| Add sort option | No — add to config |
| New console | Minimal — config + card + editor |

**Test:** Can new object types use this pattern?  
**Answer:** Yes — BedrockLayout, useCollectionView, usePatchHistory, GroveApi all reusable.

---

## What This Establishes for Future Consoles

| Pattern | Defined Here | Reused In |
|---------|--------------|-----------|
| BedrockLayout | ✅ | All consoles |
| ConsoleConfig schema | ✅ | All consoles |
| useCollectionView | ✅ | Garden, Hub, Persona, Journey |
| usePatchHistory | ✅ | All consoles |
| GroveApi | ✅ | All consoles |
| Copilot context protocol | ✅ | All consoles |
| Patch preview flow | ✅ | All consoles |

**Future consoles only need:**
1. Object-specific types (payload schema)
2. Console config (nav, metrics, filters, copilot actions)
3. Object-specific card component
4. Object-specific editor component

---

## Checklist for Sprint Execution

### Before Starting
- [ ] On `bedrock` branch
- [ ] Read BEDROCK_SPRINT_CONTRACT.md
- [ ] No imports from `src/foundation/`

### Phase 1 Exit
- [ ] BedrockLayout renders correct structure
- [ ] ConsoleHeader shows title + action
- [ ] StatCard displays metric

### Phase 2 Exit
- [ ] GroveObject types defined
- [ ] useCollectionView tests pass
- [ ] usePatchHistory tests pass
- [ ] GroveApi tests pass

### Phase 3 Exit
- [ ] Lens grid displays from API
- [ ] Filter/sort/favorite works
- [ ] Inspector shows selected lens
- [ ] CRUD operations work
- [ ] Undo/redo works

### Phase 4 Exit
- [ ] Copilot receives context
- [ ] "Set X to Y" generates patch
- [ ] Preview shows diff
- [ ] Apply updates lens
- [ ] Invalid patches rejected

### Phase 5 Exit
- [ ] Empty states render
- [ ] Loading states render
- [ ] Errors handled gracefully
- [ ] Keyboard nav works
- [ ] Responsive behavior works

### Final Verification
- [ ] All DEX tests pass
- [ ] No Foundation imports
- [ ] Patterns documented in PROJECT_PATTERNS.md

---

*This document is the canonical reference for Lens Workshop implementation. Every pattern established here becomes the template for all Bedrock consoles.*
