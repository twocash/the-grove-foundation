# Bedrock Object Migration Methodology

**Purpose:** Systematic process for analyzing legacy Grove objects and migrating them to the Bedrock console factory pattern.

**Applies to:** All GroveObject types (Lenses/Personas, Journeys, Nodes, Hubs, Sprouts, Moments, etc.)

---

## Phase 1: Legacy Object Analysis

### Step 1.1: Find the Source of Truth

| Question | Where to Look |
|----------|---------------|
| What is the TypeScript interface? | `data/*-schema.ts`, `src/core/schema/*.ts` |
| What is the runtime data? | `data/*.json`, `data/*.ts` (DEFAULT_* exports) |
| How is it used in UI? | `src/explore/*`, `src/foundation/*`, `src/widget/*` |
| How is it used in engine? | `src/core/engine/*`, `src/core/engagement/*` |

### Step 1.2: Document Functional Purpose

Answer these questions:

1. **What problem does this object solve?**
   - User-facing function (what does the user see/do?)
   - System function (what does the engine do with it?)

2. **What are the essential fields?**
   - Fields that define identity
   - Fields that control behavior
   - Fields that are computed/derived

3. **What are the relationships?**
   - What other objects does this reference?
   - What objects reference this?

4. **What operations are performed?**
   - CRUD operations
   - Validation rules
   - Side effects (e.g., "changing X triggers Y")

### Step 1.3: Create Field Inventory

For each field in the legacy object:

| Field | Type | Purpose | UI Control | Validation | Notes |
|-------|------|---------|------------|------------|-------|
| `id` | string | Unique identifier | readonly | required | System-generated |
| `name` | string | Display name | text input | required, max 100 | User-editable |
| ... | ... | ... | ... | ... | ... |

---

## Phase 2: Schema Migration

### Step 2.1: Map to GroveObject Structure

```typescript
// Target structure for all Bedrock objects
interface GroveObject<T> {
  meta: GroveObjectMeta;  // Standard identity fields
  payload: T;             // Domain-specific fields
}

interface GroveObjectMeta {
  id: string;
  type: string;           // 'lens' | 'journey' | 'hub' | etc.
  title: string;
  description?: string;
  icon?: string;
  status?: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: { type: 'system' | 'user'; id?: string };
}
```

### Step 2.2: Define Payload Type

Map legacy fields to payload, excluding those that belong in `meta`:

```typescript
// Example: LensPayload from Persona
interface LensPayload {
  // === FIELDS FROM LEGACY ===
  publicLabel: string;      // from Persona.publicLabel
  color: PersonaColor;      // from Persona.color
  enabled: boolean;         // from Persona.enabled
  
  // ... rest of domain-specific fields
}
```

### Step 2.3: Create Transformation Functions

```typescript
// Legacy → GroveObject
function legacyToGroveObject(legacy: LegacyType): GroveObject<PayloadType> {
  return {
    meta: {
      id: legacy.id,
      type: 'object-type',
      title: legacy.displayName,
      // ... map other meta fields
    },
    payload: {
      // ... map payload fields
    },
  };
}

// GroveObject → Legacy (for backward compatibility)
function groveObjectToLegacy(obj: GroveObject<PayloadType>): LegacyType {
  return {
    id: obj.meta.id,
    displayName: obj.meta.title,
    // ... reverse mapping
  };
}
```

---

## Phase 3: Data Hook Implementation

### Step 3.1: Determine Data Source Strategy

| Phase | Strategy | Implementation |
|-------|----------|----------------|
| Development | localStorage + defaults | Load DEFAULT_*, persist to localStorage |
| Staging | API + localStorage fallback | Try API, fall back to localStorage |
| Production | API only | Full CRUD via GroveApi |

### Step 3.2: Implement useObjectData Hook

```typescript
function useObjectData(): CollectionDataResult<PayloadType> {
  // 1. Load from localStorage (with defaults as fallback)
  const [objects, setObjects] = useState(() => loadFromStorage());
  
  // 2. Auto-persist on change
  useEffect(() => saveToStorage(objects), [objects]);
  
  // 3. CRUD operations that update state
  const create = async (defaults?) => { /* ... */ };
  const update = async (id, operations) => { /* ... */ };
  const remove = async (id) => { /* ... */ };
  const duplicate = async (obj) => { /* ... */ };
  
  return { objects, loading, error, refetch, create, update, remove, duplicate };
}
```

---

## Phase 4: UI Component Design

### Step 4.1: Design Card Component

The card shows the object in grid/list view. Design based on:
- **Primary identifier** (title, icon)
- **Key status indicators** (active/draft, category badge)
- **Quick metrics** (e.g., "5 filters", "3 waypoints")

### Step 4.2: Design Editor Component

Group fields into logical sections based on functional purpose:

| Section Pattern | When to Use |
|-----------------|-------------|
| **Identity** | Name, description, icon, color |
| **Behavior** | The main functional fields |
| **Configuration** | Settings, toggles, options |
| **Relationships** | Links to other objects |
| **Metadata** | Created/updated, ID (readonly) |

### Step 4.3: Determine Copilot Actions

What AI-assisted operations make sense?

| Action | Description |
|--------|-------------|
| Generate | AI creates new content (e.g., "Write a toneGuidance for engineers") |
| Refine | AI improves existing content |
| Validate | AI checks for issues |
| Suggest | AI recommends related objects/settings |

---

## Phase 5: Console Configuration

### Step 5.1: Define ConsoleConfig

```typescript
const objectConsoleConfig: ConsoleConfig = {
  id: 'object-type',
  title: 'Object Types',
  description: 'Manage object types',
  
  metrics: [
    { id: 'total', label: 'Total', query: 'count(*)' },
    { id: 'active', label: 'Active', query: 'count(where: enabled)' },
  ],
  
  collectionView: {
    searchFields: ['meta.title', 'payload.description'],
    filterOptions: [
      { field: 'payload.category', label: 'Category', options: [...] },
    ],
    sortOptions: [
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
    ],
    defaultSort: { field: 'meta.title', direction: 'asc' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-object-favorites',
  },
  
  primaryAction: { label: 'New Object', icon: 'add' },
  copilot: { enabled: true },
};
```

### Step 5.2: Wire Up Factory

```typescript
export const ObjectConsole = createBedrockConsole<PayloadType>({
  config: objectConsoleConfig,
  useData: useObjectData,
  CardComponent: ObjectCard,
  EditorComponent: ObjectEditor,
});
```

---

## Phase 6: Validation & Testing

### Step 6.1: Functional Validation

- [ ] Legacy data loads correctly into new structure
- [ ] All CRUD operations work
- [ ] Changes persist across refresh
- [ ] No data loss on round-trip (legacy → grove → legacy)

### Step 6.2: UI Validation

- [ ] Grid view renders all objects
- [ ] Card displays correct information
- [ ] Inspector shows all editable fields
- [ ] Save/Delete/Duplicate work
- [ ] Copilot integrates correctly

### Step 6.3: Integration Validation

- [ ] Other parts of app can still consume this object type
- [ ] No breaking changes to existing functionality

---

## Migration Checklist Template

```markdown
## [Object Type] Migration

### Analysis
- [ ] Located legacy TypeScript interface
- [ ] Located runtime data source
- [ ] Documented functional purpose
- [ ] Created field inventory
- [ ] Identified relationships

### Schema
- [ ] Defined PayloadType interface
- [ ] Created legacyToGroveObject()
- [ ] Created groveObjectToLegacy() (if needed)

### Data
- [ ] Implemented useObjectData hook
- [ ] Storage key defined
- [ ] Default data loads correctly

### UI
- [ ] CardComponent implemented
- [ ] EditorComponent implemented
- [ ] Sections organized by function

### Console
- [ ] ConsoleConfig defined
- [ ] Factory wired up
- [ ] Route added

### Validation
- [ ] CRUD operations work
- [ ] Data persists
- [ ] No regressions in existing UI
```

---

## Reference Implementations

| Object Type | Migration Doc | Status |
|-------------|---------------|--------|
| Lens (Persona) | `MIGRATION-001-lens.md` | In Progress |
| Journey | `MIGRATION-002-journey.md` | Pending |
| Node (JourneyNode) | `MIGRATION-003-node.md` | Pending |
| Hub (TopicHub) | `MIGRATION-004-hub.md` | Pending |
| Sprout | `MIGRATION-005-sprout.md` | Pending |
