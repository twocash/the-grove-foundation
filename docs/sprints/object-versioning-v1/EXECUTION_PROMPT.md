# Execution Prompt: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Status:** Ready for Execution  
**Estimated:** 6-7 hours

---

## Context

You are implementing versioned object storage for the Grove Inspector. The Copilot Configurator already works for editing objects, but changes don't persist across page refresh. This sprint adds:

1. Version records with full provenance (who, what, when, how, why)
2. IndexedDB storage with localStorage caching
3. Version indicator in the Inspector UI
4. Auto-import baseline (v1) for new objects

**Key Files to Reference:**
- `docs/sprints/object-versioning-v1/ARCHITECTURE.md` — Full technical design
- `docs/sprints/object-versioning-v1/DECISIONS.md` — ADRs with rationale
- `docs/sprints/object-versioning-v1/MIGRATION_MAP.md` — File changes

---

## Pre-Execution Checklist

```bash
cd C:\GitHub\the-grove-foundation
git checkout main
git pull
git checkout -b feature/object-versioning-v1

# Verify build works
npm run build
npm test
```

---

## Epic 1: Core Schema & Interface

### File: src/core/versioning/schema.ts

```typescript
// src/core/versioning/schema.ts
// Version record types with full provenance for DEX Pillar III

import { JsonPatch } from '../copilot/schema';
import { GroveObjectType, GroveObject } from '../schema/grove-object';

/**
 * Model routing identifiers for the hybrid architecture.
 * - hybrid-local: Processed by local model (simulated or real 7B)
 * - hybrid-cloud: Routed to cloud API for complex reasoning
 * 
 * UI displays friendly labels (e.g., "Local 7B (Simulated)").
 * Backend uses these for analytics and routing.
 */
export type HybridModelId = 'hybrid-local' | 'hybrid-cloud';

/**
 * Who made this change (Provenance: Actor)
 */
export interface VersionActor {
  type: 'human' | 'copilot' | 'system' | 'agent';
  
  /** Model routing identifier (null for system/human) */
  model?: HybridModelId | null;
  
  /** User or agent identifier (for future user management) */
  id?: string;
}

/**
 * How this change was made (Provenance: Source)
 */
export interface VersionSource {
  type: 'copilot' | 'direct-edit' | 'import' | 'migration' | 'system';
  
  /** Engagement session identifier */
  sessionId?: string;
  
  /** Original user input that triggered this change */
  intent?: string;
}

/**
 * A single version of a Grove object.
 * Implements DEX Pillar III: Provenance as Infrastructure.
 */
export interface ObjectVersion {
  /** UUID v4 for this specific version */
  versionId: string;
  
  /** The object being versioned */
  objectId: string;
  
  /** Object type (journey, lens, sprout, etc.) */
  objectType: GroveObjectType;
  
  /** Monotonic ordinal within object scope (1, 2, 3...) */
  ordinal: number;
  
  /** ISO 8601 timestamp */
  createdAt: string;
  
  /** Provenance: who made this change */
  actor: VersionActor;
  
  /** Provenance: how was this change made */
  source: VersionSource;
  
  /** RFC 6902 patch that produced this version from the previous */
  patch: JsonPatch;
  
  /** Link to prior version (null for v1) */
  previousVersionId: string | null;
  
  /** Human-readable change description */
  message?: string;
}

/**
 * Stored object with version metadata.
 * This is what gets persisted and cached.
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

/**
 * Get display label for actor type
 */
export function getActorLabel(actor: VersionActor | null): string {
  if (!actor) return 'Unknown';
  switch (actor.type) {
    case 'copilot': return 'Copilot';
    case 'human': return 'Manual Edit';
    case 'system': return 'System';
    case 'agent': return 'Agent';
    default: return actor.type;
  }
}

/**
 * Get display label for model identifier
 */
export function getModelLabel(model: HybridModelId | null | undefined): string {
  if (!model) return '';
  switch (model) {
    case 'hybrid-local': return 'Local 7B (Simulated)';
    case 'hybrid-cloud': return 'Cloud API';
    default: return model;
  }
}
```

### File: src/core/versioning/store.ts

```typescript
// src/core/versioning/store.ts
// Abstract interface for versioned object storage

import { GroveObject } from '../schema/grove-object';
import { JsonPatch } from '../copilot/schema';
import { ObjectVersion, VersionActor, VersionSource, StoredObject } from './schema';

export interface ListVersionsOptions {
  /** Maximum versions to return. Default: 50 */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order. Default: 'desc' (newest first) */
  order?: 'asc' | 'desc';
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
  /** Initialize storage (open database, etc.) */
  initialize(): Promise<void>;
  
  /** Get object with current state and version metadata */
  get(objectId: string): Promise<StoredObject | null>;
  
  /** Get a specific version record */
  getVersion(versionId: string): Promise<ObjectVersion | null>;
  
  /** List versions for an object */
  listVersions(objectId: string, options?: ListVersionsOptions): Promise<ObjectVersion[]>;
  
  /** Apply a patch, creating a new version. Returns the created version. */
  applyPatch(
    objectId: string,
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;
  
  /** Import an object (creates baseline v1) */
  importObject(object: GroveObject, actor: VersionActor): Promise<ObjectVersion>;
  
  /** Prune old versions, keeping the N most recent. Returns count pruned. */
  pruneVersions(objectId: string, keepCount: number): Promise<number>;
  
  /** Clear all stored data */
  clear(): Promise<void>;
}

// Singleton store instance
let storeInstance: VersionedObjectStore | null = null;

/**
 * Get the versioned object store singleton.
 * Lazily initializes with IndexedDB implementation.
 */
export function getVersionedObjectStore(): VersionedObjectStore {
  if (!storeInstance) {
    // Lazy import to avoid circular dependencies
    const { IndexedDBVersionStore } = require('./indexeddb');
    storeInstance = new IndexedDBVersionStore();
  }
  return storeInstance;
}

/**
 * Set the store instance (for testing or alternative implementations)
 */
export function setVersionedObjectStore(store: VersionedObjectStore): void {
  storeInstance = store;
}
```

### File: src/core/versioning/utils.ts

```typescript
// src/core/versioning/utils.ts
// Utility functions for versioning

import { JsonPatch } from '../copilot/schema';

/**
 * Generate UUID v4.
 * Uses crypto.randomUUID() where available, fallback for older browsers.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format ISO timestamp as relative time.
 * e.g., "just now", "2 min ago", "1 hour ago", "yesterday"
 */
export function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return 'never';
  
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  
  return date.toLocaleDateString();
}

/**
 * Generate human-readable change message from patch operations.
 * e.g., "Updated title and description"
 */
export function generateChangeMessage(patch: JsonPatch): string {
  if (!patch || patch.length === 0) {
    return 'No changes';
  }
  
  // Extract field names from paths
  const fields = patch.map((op) => {
    const path = op.path;
    // Extract last segment of path, e.g., "/meta/title" -> "title"
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1];
  });
  
  // Deduplicate
  const uniqueFields = [...new Set(fields)];
  
  if (uniqueFields.length === 0) {
    return 'Modified content';
  }
  
  if (uniqueFields.length === 1) {
    return `Updated ${uniqueFields[0]}`;
  }
  
  if (uniqueFields.length === 2) {
    return `Updated ${uniqueFields[0]} and ${uniqueFields[1]}`;
  }
  
  return `Updated ${uniqueFields.slice(0, -1).join(', ')}, and ${uniqueFields[uniqueFields.length - 1]}`;
}
```

### Build Gate: Epic 1

```bash
npm run build
# Should compile with no errors
```

---

## Epic 2: Storage Implementation

### File: src/core/versioning/cache.ts

```typescript
// src/core/versioning/cache.ts
// localStorage caching layer for fast reads

import { StoredObject } from './schema';

const CACHE_PREFIX = 'grove:objects:';

/**
 * Get cached stored object.
 * Returns null if not in cache or in SSR environment.
 */
export function getCached(objectId: string): StoredObject | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `${CACHE_PREFIX}${objectId}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Set cached stored object.
 * Stores current state + metadata, NOT full version history.
 */
export function setCache(objectId: string, obj: StoredObject): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${CACHE_PREFIX}${objectId}`;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (error) {
    // Storage full or other error - cache is optional
    console.warn('Failed to cache object:', error);
  }
}

/**
 * Clear cache for a single object.
 */
export function clearCache(objectId: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `${CACHE_PREFIX}${objectId}`;
  localStorage.removeItem(key);
}

/**
 * Clear all versioned object cache.
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
```

### File: src/core/versioning/indexeddb.ts

```typescript
// src/core/versioning/indexeddb.ts
// IndexedDB implementation of VersionedObjectStore

import { VersionedObjectStore, ListVersionsOptions } from './store';
import { ObjectVersion, StoredObject, VersionActor, VersionSource } from './schema';
import { JsonPatch } from '../copilot/schema';
import { GroveObject } from '../schema/grove-object';
import { applyPatch as applyRfc6902Patch } from 'rfc6902';
import { generateUUID } from './utils';
import { getCached, setCache, clearCache } from './cache';

const DB_NAME = 'grove-versioning';
const DB_VERSION = 1;
const OBJECTS_STORE = 'objects';
const VERSIONS_STORE = 'versions';

/**
 * MVP version limit per object.
 * 
 * This is a pragmatic constraint for the MVP, not an architectural limitation.
 * Future versions may support:
 * - Configurable retention policies
 * - Unlimited history with archival
 * - Time-based retention
 */
const VERSION_LIMIT = 50;

export class IndexedDBVersionStore implements VersionedObjectStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.openDatabase().then((db) => {
      this.db = db;
    });

    return this.initPromise;
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Objects store: keyed by objectId
        if (!db.objectStoreNames.contains(OBJECTS_STORE)) {
          db.createObjectStore(OBJECTS_STORE, { keyPath: 'current.meta.id' });
        }

        // Versions store: keyed by versionId, indexed by objectId
        if (!db.objectStoreNames.contains(VERSIONS_STORE)) {
          const versionsStore = db.createObjectStore(VERSIONS_STORE, { keyPath: 'versionId' });
          versionsStore.createIndex('objectId', 'objectId', { unique: false });
          versionsStore.createIndex('objectId_ordinal', ['objectId', 'ordinal'], { unique: true });
        }
      };
    });
  }

  async get(objectId: string): Promise<StoredObject | null> {
    // Try cache first
    const cached = getCached(objectId);
    if (cached) return cached;

    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(OBJECTS_STORE, 'readonly');
      const store = tx.objectStore(OBJECTS_STORE);
      const request = store.get(objectId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as StoredObject | undefined;
        if (result) {
          setCache(objectId, result);
        }
        resolve(result ?? null);
      };
    });
  }

  async getVersion(versionId: string): Promise<ObjectVersion | null> {
    await this.initialize();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(VERSIONS_STORE, 'readonly');
      const store = tx.objectStore(VERSIONS_STORE);
      const request = store.get(versionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }

  async listVersions(objectId: string, options: ListVersionsOptions = {}): Promise<ObjectVersion[]> {
    const { limit = 50, offset = 0, order = 'desc' } = options;

    await this.initialize();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(VERSIONS_STORE, 'readonly');
      const store = tx.objectStore(VERSIONS_STORE);
      const index = store.index('objectId');
      const request = index.getAll(IDBKeyRange.only(objectId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        let versions = request.result as ObjectVersion[];
        
        // Sort by ordinal
        versions.sort((a, b) => 
          order === 'desc' ? b.ordinal - a.ordinal : a.ordinal - b.ordinal
        );
        
        // Apply pagination
        versions = versions.slice(offset, offset + limit);
        
        resolve(versions);
      };
    });
  }

  async applyPatch(
    objectId: string,
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    // Get current object
    const stored = await this.get(objectId);
    if (!stored) {
      throw new Error(`Object not found: ${objectId}`);
    }

    // Apply patch to get new state
    const newState = JSON.parse(JSON.stringify(stored.current));
    applyRfc6902Patch(newState, patch);

    // Create version record
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
      message,
    };

    // Update stored object
    const updated: StoredObject = {
      current: newState,
      currentVersionId: version.versionId,
      versionCount: version.ordinal,
      lastModifiedAt: version.createdAt,
      lastModifiedBy: actor,
    };

    // Write both in a transaction
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([OBJECTS_STORE, VERSIONS_STORE], 'readwrite');
      
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore(VERSIONS_STORE).put(version);
      tx.objectStore(OBJECTS_STORE).put(updated);
    });

    // Update cache
    setCache(objectId, updated);

    // Prune if over limit
    // MVP: 50 version limit. This is a pragmatic constraint.
    // Future versions may support configurable retention.
    if (version.ordinal > VERSION_LIMIT) {
      // Fire and forget - don't block on pruning
      this.pruneVersions(objectId, VERSION_LIMIT).catch(console.error);
    }

    return version;
  }

  async importObject(object: GroveObject, actor: VersionActor): Promise<ObjectVersion> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const objectId = object.meta.id;

    // Check if already exists
    const existing = await this.get(objectId);
    if (existing) {
      // Already imported, return current version info
      const versions = await this.listVersions(objectId, { limit: 1 });
      if (versions.length > 0) {
        return versions[0];
      }
    }

    // Create baseline version
    const version: ObjectVersion = {
      versionId: generateUUID(),
      objectId,
      objectType: object.meta.type,
      ordinal: 1,
      createdAt: new Date().toISOString(),
      actor: { type: 'system', model: null },
      source: { type: 'import' },
      patch: [], // Empty patch for baseline
      previousVersionId: null,
      message: 'Initial import from system configuration',
    };

    // Create stored object
    const stored: StoredObject = {
      current: object,
      currentVersionId: version.versionId,
      versionCount: 1,
      lastModifiedAt: version.createdAt,
      lastModifiedBy: version.actor,
    };

    // Write both
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([OBJECTS_STORE, VERSIONS_STORE], 'readwrite');
      
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore(VERSIONS_STORE).put(version);
      tx.objectStore(OBJECTS_STORE).put(stored);
    });

    // Update cache
    setCache(objectId, stored);

    return version;
  }

  async pruneVersions(objectId: string, keepCount: number): Promise<number> {
    await this.initialize();
    if (!this.db) return 0;

    const allVersions = await this.listVersions(objectId, { 
      limit: 1000, 
      order: 'desc' 
    });

    if (allVersions.length <= keepCount) {
      return 0;
    }

    const toPrune = allVersions.slice(keepCount);

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(VERSIONS_STORE, 'readwrite');
      const store = tx.objectStore(VERSIONS_STORE);
      
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      for (const version of toPrune) {
        store.delete(version.versionId);
      }
    });

    return toPrune.length;
  }

  async clear(): Promise<void> {
    await this.initialize();
    if (!this.db) return;

    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction([OBJECTS_STORE, VERSIONS_STORE], 'readwrite');
      
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore(OBJECTS_STORE).clear();
      tx.objectStore(VERSIONS_STORE).clear();
    });

    // Clear all cache
    const { clearAllCache } = require('./cache');
    clearAllCache();
  }
}
```

### File: src/core/versioning/index.ts

```typescript
// src/core/versioning/index.ts
// Public API for versioning module

// Types
export type { 
  HybridModelId, 
  VersionActor, 
  VersionSource, 
  ObjectVersion, 
  StoredObject 
} from './schema';

export { getActorLabel, getModelLabel } from './schema';

// Interface
export type { ListVersionsOptions, VersionedObjectStore } from './store';
export { getVersionedObjectStore, setVersionedObjectStore } from './store';

// Implementation
export { IndexedDBVersionStore } from './indexeddb';

// Utilities
export { generateUUID, formatRelativeTime, generateChangeMessage } from './utils';
```

### Build Gate: Epic 2

```bash
npm run build
npm test -- --grep versioning  # If tests exist
```

---

## Epic 3-6: Continue with MIGRATION_MAP.md

The remaining epics follow the patterns in `MIGRATION_MAP.md`:

- **Epic 3:** Modify `useCopilot.ts` to create versions on Apply
- **Epic 4:** Create `VersionIndicator.tsx` and `useVersionedObject.ts`
- **Epic 5:** Wire versioning into `ObjectInspector.tsx`, `JourneyInspector.tsx`, `LensInspector.tsx`
- **Epic 6:** Testing and QA

See `MIGRATION_MAP.md` for detailed before/after code snippets for each modification.

---

## Final Verification

```bash
# Full build
npm run build
npm test
npm run lint

# Manual QA Checklist
# [ ] Open journey in inspector
# [ ] Make edit via Copilot
# [ ] Click Apply
# [ ] Verify "Saved as v2" confirmation
# [ ] Verify version indicator shows "v2 • Modified just now via Copilot"
# [ ] Refresh page
# [ ] Verify changes persisted
# [ ] Verify version indicator still shows v2
# [ ] Check DevTools → Application → IndexedDB → grove-versioning
```

---

## Commit Strategy

```bash
# After Epic 1
git add src/core/versioning/schema.ts src/core/versioning/store.ts src/core/versioning/utils.ts
git commit -m "feat(versioning): add core types and interface"

# After Epic 2
git add src/core/versioning/
git commit -m "feat(versioning): add IndexedDB storage implementation"

# After Epic 3
git add src/shared/inspector/hooks/useCopilot.ts
git commit -m "feat(versioning): integrate copilot with version creation"

# After Epic 4
git add src/shared/inspector/VersionIndicator.tsx src/shared/inspector/hooks/useVersionedObject.ts
git commit -m "feat(versioning): add version indicator UI components"

# After Epic 5
git add src/shared/inspector/ src/explore/
git commit -m "feat(versioning): wire versioning throughout inspector"

# After Epic 6
git add .
git commit -m "test(versioning): add tests and documentation"

# Final
git push -u origin feature/object-versioning-v1
# Create PR
```

---

## Troubleshooting

### IndexedDB not available
- Check if running in incognito/private mode
- Fallback: localStorage-only mode (degrade gracefully)

### Version not persisting
- Check browser DevTools → Application → IndexedDB
- Verify `grove-versioning` database exists
- Check console for errors

### Version indicator not updating
- Verify `useVersionedObject` hook is returning version metadata
- Check that `ObjectInspector` receives version prop

### Cache/IndexedDB mismatch
- Clear cache: `localStorage.removeItem('grove:objects:{id}')`
- Or clear all: Run `store.clear()` in console

---

*Canonical location: `docs/sprints/object-versioning-v1/EXECUTION_PROMPT.md`*
