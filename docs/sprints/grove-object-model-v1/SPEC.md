# Specification: Grove Object Model v1

**Sprint:** grove-object-model-v1  
**Status:** Planning  
**Time Budget:** TBD (Architectural Initiative - Estimate 8-12 hours across multiple sessions)

---

## Vision

**Every thing in Grove is a GroveObject.**

Lenses, Journeys, Hubs, Sprouts, Nodes—and future types we haven't imagined—all share a common identity. They can be found, sorted, filtered, favorited, tagged, and extended. When AI starts creating new exploration pathways, it creates GroveObjects.

This sprint establishes **Pattern 7: Object Model** — the unified schema that makes all Grove content first-class citizens.

---

## Design Goals

### 1. Unified Identity
Every object in Grove has consistent metadata: who created it, when, why, and how to find it again.

### 2. Declarative Extensibility
A domain expert can define a new object type (e.g., "Thesis", "Question", "Counterpoint") by editing a schema file, without writing code.

### 3. Generic Rendering
One card component renders any GroveObject. Type-specific details handled via slots/variants.

### 4. Collection Operations
Find anything. Filter by type, tags, status, creator. Sort by date, name, relevance. Favorite for quick access.

### 5. AI-Ready
When AI generates a new journey or sprout, it creates a conforming GroveObject with full provenance.

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Object types | Pattern 3 (Narrative Schema) | Add GroveObjectMeta as base interface |
| Card rendering | Pattern 6 (Component Composition) | GroveObjectCard composes type-specific content |
| State | Pattern 2 (Engagement Machine) | Collections may need state (deferred) |
| Styling | Pattern 4 (Token Namespaces) | Use existing `--card-*` tokens from Sprint 6 |

## New Pattern Proposed

### Pattern 7: Object Model

**Why existing patterns are insufficient:**

Pattern 3 (Narrative Schema) defines individual object types but doesn't establish a common base. There's no way to:
- Query across types ("show all my recent items")
- Apply universal metadata (favorites, tags)
- Render any object with a single component
- Define new types declaratively

**DEX Compliance:**

| Pillar | Implementation |
|--------|----------------|
| Declarative Sovereignty | New types defined in config via `objectTypes` registry |
| Capability Agnosticism | Pure data schema, no model dependency |
| Provenance | Every object has `createdBy` with attribution chain |
| Organic Scalability | Extensible `type` field, optional metadata |

---

## Scope

### In Scope (v1)

1. **GroveObjectMeta interface** — Common metadata all objects share
2. **Journey extension** — First type to fully implement the pattern
3. **GroveObjectCard component** — Generic renderer with type dispatch
4. **useGroveObjects hook** — Collection access with filter/sort
5. **Favorites infrastructure** — Mark any object as favorite
6. **Pattern 7 documentation** — Add to PROJECT_PATTERNS.md

### Out of Scope (v1)

1. **Full migration of all types** — Just Journey for v1, others follow
2. **Search/indexing** — Filter by metadata only, not content search
3. **Persistence layer changes** — Work with existing NarrativeEngine storage
4. **AI object creation** — Define schema only, AI integration later
5. **Custom type definitions** — Config-driven types in v2

---

## Requirements

### REQ-1: GroveObjectMeta Interface

Define common metadata for all Grove objects:

```typescript
// src/core/schema/grove-object.ts

/**
 * The set of recognized Grove object types.
 * Extensible via config in future versions.
 */
export type GroveObjectType = 
  | 'lens'
  | 'journey'
  | 'hub'
  | 'sprout'
  | 'node'
  | 'card'
  | string;  // Allow custom types

/**
 * Provenance record for an object.
 * Tracks who/what created it and in what context.
 */
export interface GroveObjectProvenance {
  type: 'human' | 'ai' | 'system' | 'import';
  actorId?: string;        // User ID, model ID, or system identifier
  context?: {
    lensId?: string;       // Lens active when created
    journeyId?: string;    // Journey active when created
    sessionId?: string;    // Session identifier
    sourceFile?: string;   // For imports
  };
}

/**
 * Common metadata shared by all Grove objects.
 * 
 * This interface enables unified operations across object types:
 * - Find/filter by any metadata field
 * - Sort by date, title, type
 * - Mark as favorite
 * - Track provenance
 */
export interface GroveObjectMeta {
  // Identity
  id: string;
  type: GroveObjectType;
  
  // Display
  title: string;
  description?: string;
  icon?: string;           // Lucide icon name
  color?: string;          // Tailwind color or token reference
  
  // Timestamps
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
  
  // Provenance
  createdBy?: GroveObjectProvenance;
  
  // Lifecycle
  status?: 'active' | 'draft' | 'archived' | 'pending';
  
  // Organization
  tags?: string[];
  favorite?: boolean;
}

/**
 * A complete Grove object: metadata + type-specific payload.
 */
export interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}
```

### REQ-2: Journey Extension

Extend Journey to implement GroveObjectMeta. Two options:

**Option A: Embedded Meta**
```typescript
interface Journey {
  meta: GroveObjectMeta;
  // Type-specific fields
  entryNode: string;
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;
}
```

**Option B: Flattened (Backward Compatible)**
```typescript
interface Journey extends GroveObjectMeta {
  type: 'journey';  // Narrowed
  // Existing fields remain at top level
  entryNode: string;
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;
}
```

**Recommendation:** Option B (flattened) for backward compatibility. Existing code doesn't break.

### REQ-3: GroveObjectCard Component

```typescript
// src/surface/components/GroveObjectCard.tsx

interface GroveObjectCardProps {
  object: GroveObject;
  isActive?: boolean;
  isInspected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
  onFavorite?: () => void;
  variant?: 'full' | 'compact' | 'minimal';
}

function GroveObjectCard({ object, ...props }: GroveObjectCardProps) {
  // Uses --card-* tokens from Sprint 6
  // Dispatches to type-specific content renderer
}
```

**Type Dispatch:**
```typescript
function ObjectContent({ object }: { object: GroveObject }) {
  switch (object.meta.type) {
    case 'journey':
      return <JourneyContent journey={object.payload as JourneyPayload} />;
    case 'lens':
      return <LensContent lens={object.payload as Persona} />;
    default:
      return <GenericContent meta={object.meta} />;
  }
}
```

### REQ-4: useGroveObjects Hook

```typescript
// src/surface/hooks/useGroveObjects.ts

interface UseGroveObjectsOptions {
  types?: GroveObjectType[];
  status?: ('active' | 'draft' | 'archived')[];
  tags?: string[];
  favorite?: boolean;
  createdBy?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface UseGroveObjectsResult {
  objects: GroveObject[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setFavorite: (id: string, favorite: boolean) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
}

function useGroveObjects(options?: UseGroveObjectsOptions): UseGroveObjectsResult;
```

**For v1:** Hook normalizes existing Journey objects to GroveObject interface. Future versions add other types.

### REQ-5: Favorites Infrastructure

```typescript
// Stored in localStorage or user preferences
interface UserObjectPreferences {
  favorites: string[];  // Object IDs
  tags?: Record<string, string[]>;  // Custom tags per object
}
```

Favorites are user-local for v1. Cloud sync in future version.

### REQ-6: Pattern 7 Documentation

Add to PROJECT_PATTERNS.md:

```markdown
### Pattern 7: Object Model

**Need:** Unified identity and operations across all Grove content types.

**Philosophy:** Every thing in Grove is a GroveObject. Whether human-created 
or AI-generated, system-defined or user-customized, all objects share common 
identity and can be operated on uniformly.

**Use:** GroveObjectMeta interface + GroveObjectCard component

**Files:**
- `src/core/schema/grove-object.ts` → Type definitions
- `src/surface/components/GroveObjectCard.tsx` → Generic renderer
- `src/surface/hooks/useGroveObjects.ts` → Collection operations

**Extend by:**
1. Have new types implement GroveObjectMeta (flat extension)
2. Add type-specific content renderer to GroveObjectCard
3. Register type in collection hook normalization

**DO NOT:**
- ❌ Create object types without GroveObjectMeta
- ❌ Build type-specific cards that don't use --card-* tokens
- ❌ Store metadata in different structures per type
```

---

## Acceptance Criteria

### AC-1: Schema Exists
- [ ] `grove-object.ts` defines GroveObjectMeta and related types
- [ ] TypeScript compiles without errors
- [ ] Types are exported for use across codebase

### AC-2: Journey Conforms
- [ ] Journey interface extends GroveObjectMeta
- [ ] Existing Journey data still loads
- [ ] New fields (favorite, tags) are optional

### AC-3: Generic Card Works
- [ ] GroveObjectCard renders Journey objects
- [ ] Uses `--card-*` tokens from Sprint 6
- [ ] Visual states (default, inspected, active) work

### AC-4: Collection Hook Works
- [ ] useGroveObjects returns Journey objects
- [ ] Filter by status works
- [ ] Sort by date works
- [ ] Filter by favorite works

### AC-5: Favorites Work
- [ ] Can mark Journey as favorite
- [ ] Favorite persists across page refresh
- [ ] Can filter to show only favorites

### AC-6: Pattern Documented
- [ ] Pattern 7 added to PROJECT_PATTERNS.md
- [ ] Includes files, extension guidance, anti-patterns

---

## Migration Path (Post-v1)

| Version | Types Included | New Features |
|---------|----------------|--------------|
| v1 | Journey | Core schema, card, hook, favorites |
| v1.1 | + Hub | Hub extends GroveObjectMeta |
| v1.2 | + Sprout | Sprout normalization |
| v1.3 | + Persona | Lens/persona extension |
| v2 | + Custom types | Config-driven type definitions |

---

## Non-Goals (v1)

- **Card/Node migration** — Complex relationship to journeys; defer
- **Full-text search** — Requires indexing infrastructure
- **Cloud sync of favorites** — Stay local for v1
- **AI object creation** — Schema ready for it, integration later
- **Admin UI for types** — Manual config editing for now

---

## Technical Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing Journey consumers | Flattened extension maintains backward compat |
| Performance with large collections | Pagination in useGroveObjects |
| Type safety for payload | Generic <T> on GroveObject |
| localStorage limits for favorites | Max 1000 favorites, pruning strategy |

---

## Time Estimate

| Phase | Tasks | Hours |
|-------|-------|-------|
| 1 | Schema definition + types | 2 |
| 2 | Journey extension + migration | 2 |
| 3 | GroveObjectCard component | 3 |
| 4 | useGroveObjects hook | 2 |
| 5 | Favorites + localStorage | 1 |
| 6 | Documentation + testing | 2 |
| **Total** | | **12 hours** |

**Recommendation:** Split into 2-3 execution sessions.

---

*Specification complete. This establishes the unified object model that enables infinite extensibility.*
