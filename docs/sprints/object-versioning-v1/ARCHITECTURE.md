# Architecture: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Date:** 2024-12-26

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          VERSIONING ARCHITECTURE                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────┐                                                     │
│  │   React Components   │                                                     │
│  │   ┌───────────────┐ │                                                     │
│  │   │ObjectInspector│ │                                                     │
│  │   └───────┬───────┘ │                                                     │
│  │           │         │                                                     │
│  │   ┌───────▼───────┐ │                                                     │
│  │   │  useCopilot   │ │                                                     │
│  │   └───────┬───────┘ │                                                     │
│  └───────────┼─────────┘                                                     │
│              │                                                                │
│              │ applyPatch(objectId, patch, actor, source)                    │
│              ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER (Renderer-Agnostic)                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  │                    VersionedObjectStore (Interface)                 │ │
│  │  │                                                                      │ │
│  │  │  get(objectId) → StoredObject | null                                │ │
│  │  │  getVersion(versionId) → ObjectVersion | null                       │ │
│  │  │  listVersions(objectId) → ObjectVersion[]                           │ │
│  │  │  applyPatch(objectId, patch, actor, source) → ObjectVersion         │ │
│  │  │  importObject(object, actor) → ObjectVersion                        │ │
│  │  │                                                                      │ │
│  │  └────────────────────────────┬────────────────────────────────────────┘ │
│  │                               │                                          │ │
│  │                  ┌────────────┴────────────┐                             │ │
│  │                  ▼                         ▼                             │ │
│  │  ┌────────────────────────┐  ┌────────────────────────────────┐         │ │
│  │  │   IndexedDB Store      │  │      localStorage Cache         │         │ │
│  │  │   (Authoritative)      │  │      (Fast Read)                │         │ │
│  │  │                        │  │                                 │         │ │
│  │  │  DB: grove-versioning  │  │  grove:objects:{id}            │         │ │
│  │  │  ├─ objects            │  │  └─ StoredObject (no versions) │         │ │
│  │  │  └─ versions           │  │                                 │         │ │
│  │  └────────────────────────┘  └────────────────────────────────┘         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Version schema is TypeScript types; behavior is implementation. Domain experts define what provenance means via the Actor/Source vocabulary. |
| **Capability Agnosticism** | Storage works identically regardless of which model generated the patch. `actor.model` is metadata, not branching logic. |
| **Provenance as Infrastructure** | Every version records actor (who), source (how), intent (why), patch (what), timestamp (when). Unbroken chain from v1. |
| **Organic Scalability** | Interface supports unlimited versions. Implementation applies 50-version cap as MVP pragmatism. Cap is configurable. |

---

## Component Design

### 1. Core Types (src/core/versioning/schema.ts)

```typescript
import { JsonPatch } from '../copilot/schema';
import { GroveObjectType } from '../schema/grove-object';

/**
 * Actor types in the hybrid architecture
 * - hybrid-local: Processed by local model (simulated or real 7B)
 * - hybrid-cloud: Routed to cloud API for complex reasoning
 */
export type HybridModelId = 'hybrid-local' | 'hybrid-cloud';

/**
 * Who made this change
 */
export interface VersionActor {
  type: 'human' | 'copilot' | 'system' | 'agent';
  
  /**
   * Model routing identifier
   * UI displays friendly labels ("Local 7B (Simulated)")
   * Backend uses this for analytics/routing
   */
  model?: HybridModelId | null;
  
  /** User or agent identifier (for future user management) */
  id?: string;
}

/**
 * How this change was made
 */
export interface VersionSource {
  type: 'copilot' | 'direct-edit' | 'import' | 'migration' | 'system';
  
  /** Engagement session identifier */
  sessionId?: string;
  
  /** Original user input (for copilot sources) */
  intent?: string;
}

/**
 * A single version of a Grove object
 */
export interface ObjectVersion {
  /** UUID v4 for this specific version */
  versionId: string;
  
  /** The object being versioned */
  objectId: string;
  
  /** Object type (journey, lens, sprout, etc.) */
  objectType: GroveObjectType;
  
  /** Monotonic ordinal within object (1, 2, 3...) */
  ordinal: number;
  
  /** ISO 8601 timestamp */
  createdAt: string;
  
  /** Provenance: who */
  actor: VersionActor;
  
  /** Provenance: how */
  source: VersionSource;
  
  /** RFC 6902 patch that produced this version */
  patch: JsonPatch;
  
  /** Link to prior version (null for v1) */
  previousVersionId: string | null;
  
  /** Human-readable change description */
  message?: string;
}

/**
 * Stored object with version metadata
 */
export interface StoredObject<T = unknown> {
  /** Current materialized state */
  current: GroveObject<T>;
  
  /** Current version ID */
  currentVersionId: string;
  
  /** Total version count */
  versionCount: number;
  
  /** ISO timestamp of last modification */
  lastModifiedAt: string;
  
  /** Who made the last change */
  lastModifiedBy: VersionActor;
}
```

### 2. Store Interface (src/core/versioning/store.ts)

```typescript
import { GroveObject } from '../schema/grove-object';
import { JsonPatch } from '../copilot/schema';
import { ObjectVersion, VersionActor, VersionSource, StoredObject } from './schema';

export interface ListVersionsOptions {
  limit?: number;      // Default: 50
  offset?: number;     // For pagination
  order?: 'asc' | 'desc';  // Default: 'desc' (newest first)
}

/**
 * Abstract interface for versioned object storage.
 * 
 * This abstraction enables:
 * 1. Current: IndexedDB + localStorage implementation
 * 2. Future: A2UI data model integration
 * 3. Future: Cloud sync layer
 */
export interface VersionedObjectStore {
  /**
   * Initialize storage (open IndexedDB, etc.)
   */
  initialize(): Promise<void>;
  
  /**
   * Get object with current state and version metadata
   */
  get(objectId: string): Promise<StoredObject | null>;
  
  /**
   * Get a specific version record
   */
  getVersion(versionId: string): Promise<ObjectVersion | null>;
  
  /**
   * List versions for an object
   */
  listVersions(objectId: string, options?: ListVersionsOptions): Promise<ObjectVersion[]>;
  
  /**
   * Apply a patch, creating a new version
   * Returns the created version
   */
  applyPatch(
    objectId: string,
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;
  
  /**
   * Import an object (creates baseline v1)
   */
  importObject(
    object: GroveObject,
    actor: VersionActor
  ): Promise<ObjectVersion>;
  
  /**
   * Prune old versions, keeping the N most recent
   * Returns count of pruned versions
   * 
   * MVP: Called automatically when version count exceeds 50.
   * This limit is an MVP constraint; future versions may 
   * support unlimited history or configurable retention.
   */
  pruneVersions(objectId: string, keepCount: number): Promise<number>;
  
  /**
   * Clear all stored data (for testing/reset)
   */
  clear(): Promise<void>;
}
```

### 3. IndexedDB Implementation (src/core/versioning/indexeddb.ts)

**Database Schema:**
```
Database: grove-versioning (v1)

Object Store: objects
  - Key: objectId (string)
  - Value: StoredObject
  - Indexes: none (primary key lookup only)

Object Store: versions  
  - Key: versionId (string)
  - Value: ObjectVersion
  - Indexes:
    - objectId: for listing versions of an object
    - objectId_ordinal: compound index for ordering
```

**Key Operations:**

```typescript
// Write path (applyPatch)
async applyPatch(...): Promise<ObjectVersion> {
  const tx = db.transaction(['objects', 'versions'], 'readwrite');
  
  // 1. Get current object
  const stored = await tx.objectStore('objects').get(objectId);
  if (!stored) throw new Error('Object not found');
  
  // 2. Apply patch to get new state
  const newState = applyPatchToObject(stored.current, patch);
  
  // 3. Create version record
  const version: ObjectVersion = {
    versionId: generateUUID(),
    objectId,
    objectType: stored.current.meta.type,
    ordinal: stored.versionCount + 1,
    createdAt: new Date().toISOString(),
    actor,
    source,
    patch,
    previousVersionId: stored.currentVersionId,
    message
  };
  
  // 4. Update stored object
  const updated: StoredObject = {
    current: newState,
    currentVersionId: version.versionId,
    versionCount: version.ordinal,
    lastModifiedAt: version.createdAt,
    lastModifiedBy: actor
  };
  
  // 5. Write both
  await tx.objectStore('versions').put(version);
  await tx.objectStore('objects').put(updated, objectId);
  
  // 6. Update cache
  updateCache(objectId, updated);
  
  // 7. Prune if over limit (MVP: 50 versions)
  if (version.ordinal > VERSION_LIMIT) {
    await this.pruneVersions(objectId, VERSION_LIMIT);
  }
  
  return version;
}
```

### 4. localStorage Cache (src/core/versioning/cache.ts)

```typescript
const CACHE_PREFIX = 'grove:objects:';

export function getCached(objectId: string): StoredObject | null {
  if (typeof window === 'undefined') return null;
  const key = `${CACHE_PREFIX}${objectId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
}

export function setCache(objectId: string, obj: StoredObject): void {
  if (typeof window === 'undefined') return;
  const key = `${CACHE_PREFIX}${objectId}`;
  // Cache stores current state + metadata, NOT full version history
  localStorage.setItem(key, JSON.stringify(obj));
}

export function clearCache(objectId: string): void {
  if (typeof window === 'undefined') return;
  const key = `${CACHE_PREFIX}${objectId}`;
  localStorage.removeItem(key);
}
```

### 5. React Hook (src/shared/inspector/hooks/useVersionedObject.ts)

```typescript
export function useVersionedObject(
  objectId: string,
  initialObject: GroveObject
) {
  const [storedObject, setStoredObject] = useState<StoredObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load on mount
  useEffect(() => {
    async function load() {
      const store = getVersionedObjectStore();
      await store.initialize();
      
      let stored = await store.get(objectId);
      
      // Auto-import if not found
      if (!stored) {
        const version = await store.importObject(initialObject, {
          type: 'system',
          model: null
        });
        stored = await store.get(objectId);
      }
      
      setStoredObject(stored);
      setLoading(false);
    }
    
    load().catch(setError);
  }, [objectId, initialObject]);
  
  // Apply patch function
  const applyPatch = useCallback(async (
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ) => {
    const store = getVersionedObjectStore();
    const version = await store.applyPatch(objectId, patch, actor, source, message);
    
    // Refresh stored object
    const updated = await store.get(objectId);
    setStoredObject(updated);
    
    return version;
  }, [objectId]);
  
  return {
    object: storedObject?.current ?? initialObject,
    version: storedObject ? {
      ordinal: storedObject.versionCount,
      lastModifiedAt: storedObject.lastModifiedAt,
      lastModifiedBy: storedObject.lastModifiedBy
    } : null,
    loading,
    error,
    applyPatch
  };
}
```

### 6. Version Indicator (src/shared/inspector/VersionIndicator.tsx)

```typescript
interface VersionIndicatorProps {
  ordinal: number | null;
  lastModifiedAt: string | null;
  lastModifiedBy: VersionActor | null;
}

export function VersionIndicator({ 
  ordinal, 
  lastModifiedAt, 
  lastModifiedBy 
}: VersionIndicatorProps) {
  if (!ordinal) {
    return (
      <div className="text-sm text-muted-foreground">
        Draft • Unsaved
      </div>
    );
  }
  
  const relativeTime = formatRelativeTime(lastModifiedAt);
  const actorLabel = getActorLabel(lastModifiedBy);
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-medium">v{ordinal}</span>
      <span>•</span>
      <span>Modified {relativeTime} via {actorLabel}</span>
      <button 
        disabled 
        title="Coming soon"
        className="text-xs opacity-50 hover:opacity-75"
      >
        View History
      </button>
    </div>
  );
}

function getActorLabel(actor: VersionActor | null): string {
  if (!actor) return 'Unknown';
  switch (actor.type) {
    case 'copilot': return 'Copilot';
    case 'human': return 'Manual Edit';
    case 'system': return 'System';
    case 'agent': return 'Agent';
    default: return actor.type;
  }
}
```

---

## Data Flow

### Write Path (User applies Copilot patch)

```
1. User types natural language edit in Copilot
2. Copilot generates JsonPatch
3. User clicks "Apply"
4. useCopilot calls onApplyPatch with patch
5. Parent component calls useVersionedObject.applyPatch()
   - actor: { type: 'copilot', model: 'hybrid-local' }
   - source: { type: 'copilot', sessionId, intent: userInput }
6. Store creates ObjectVersion record
7. Store writes to IndexedDB
8. Store updates localStorage cache
9. React state updates
10. VersionIndicator shows "v{N} • Modified just now via Copilot"
```

### Read Path (Page load)

```
1. Component mounts with objectId + initialObject
2. useVersionedObject hook initializes
3. Check localStorage cache first (fast)
4. If cache miss, load from IndexedDB
5. If IndexedDB empty, auto-import initialObject as v1
6. Return stored object to component
7. VersionIndicator renders based on version metadata
```

---

## A2UI Compatibility Notes

The architecture is designed for future A2UI adoption:

| Current Implementation | A2UI Equivalent |
|------------------------|-----------------|
| `useVersionedObject.applyPatch()` | `userAction` dispatch |
| JsonPatch operations | A2UI mutations |
| JSON Pointer paths in patch | A2UI data binding |
| `source.intent` | `userAction.context` |
| `VersionedObjectStore` interface | Could back A2UI data model |

When implementing `inspector-surface-v1` (next sprint), the `VersionedObjectStore` will be wired to the `InspectorSurface` abstraction.

---

*Canonical location: `docs/sprints/object-versioning-v1/ARCHITECTURE.md`*
