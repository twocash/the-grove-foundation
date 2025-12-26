# Migration Map: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Date:** 2024-12-26

---

## File Overview

### New Files (~450 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/versioning/schema.ts` | ~80 | Type definitions |
| `src/core/versioning/store.ts` | ~40 | Interface definition |
| `src/core/versioning/indexeddb.ts` | ~180 | IndexedDB implementation |
| `src/core/versioning/cache.ts` | ~40 | localStorage caching |
| `src/core/versioning/utils.ts` | ~30 | UUID generation, formatting |
| `src/core/versioning/index.ts` | ~15 | Public exports |
| `src/shared/inspector/VersionIndicator.tsx` | ~50 | Version display component |
| `src/shared/inspector/hooks/useVersionedObject.ts` | ~60 | React hook |

### Modified Files (~80 lines changed)

| File | Changes | Lines |
|------|---------|-------|
| `src/shared/inspector/ObjectInspector.tsx` | Add VersionIndicator | ~15 |
| `src/shared/inspector/hooks/useCopilot.ts` | Wire to versioning store | ~25 |
| `src/explore/JourneyInspector.tsx` | Use versioned hook | ~20 |
| `src/explore/LensInspector.tsx` | Use versioned hook | ~20 |

---

## Detailed File Plan

### New: src/core/versioning/schema.ts

```typescript
// Types imported from existing modules
import { JsonPatch } from '../copilot/schema';
import { GroveObjectType, GroveObject } from '../schema/grove-object';

// New types
export type HybridModelId = 'hybrid-local' | 'hybrid-cloud';

export interface VersionActor { ... }
export interface VersionSource { ... }
export interface ObjectVersion { ... }
export interface StoredObject<T = unknown> { ... }

// Display helpers
export function getActorLabel(actor: VersionActor): string { ... }
export function getModelLabel(model: HybridModelId | null): string { ... }
```

### New: src/core/versioning/store.ts

```typescript
// Interface only, no implementation
export interface ListVersionsOptions { ... }
export interface VersionedObjectStore { ... }

// Singleton accessor
let storeInstance: VersionedObjectStore | null = null;
export function getVersionedObjectStore(): VersionedObjectStore { ... }
export function setVersionedObjectStore(store: VersionedObjectStore): void { ... }
```

### New: src/core/versioning/indexeddb.ts

```typescript
import { VersionedObjectStore, ListVersionsOptions } from './store';
import { ObjectVersion, StoredObject, VersionActor, VersionSource } from './schema';
import { JsonPatch } from '../copilot/schema';
import { GroveObject } from '../schema/grove-object';
import { applyPatch } from 'rfc6902';
import { generateUUID } from './utils';
import { getCached, setCache, clearCache } from './cache';

const DB_NAME = 'grove-versioning';
const DB_VERSION = 1;

/**
 * MVP version limit per object.
 * This is a pragmatic constraint, not architectural.
 * Future versions may support configurable retention.
 */
const VERSION_LIMIT = 50;

export class IndexedDBVersionStore implements VersionedObjectStore {
  private db: IDBDatabase | null = null;
  
  async initialize(): Promise<void> { ... }
  async get(objectId: string): Promise<StoredObject | null> { ... }
  async getVersion(versionId: string): Promise<ObjectVersion | null> { ... }
  async listVersions(objectId: string, options?: ListVersionsOptions): Promise<ObjectVersion[]> { ... }
  async applyPatch(...): Promise<ObjectVersion> { ... }
  async importObject(...): Promise<ObjectVersion> { ... }
  async pruneVersions(objectId: string, keepCount: number): Promise<number> { ... }
  async clear(): Promise<void> { ... }
  
  private openDatabase(): Promise<IDBDatabase> { ... }
}
```

### New: src/core/versioning/cache.ts

```typescript
const CACHE_PREFIX = 'grove:objects:';

export function getCached(objectId: string): StoredObject | null { ... }
export function setCache(objectId: string, obj: StoredObject): void { ... }
export function clearCache(objectId: string): void { ... }
export function clearAllCache(): void { ... }
```

### New: src/core/versioning/utils.ts

```typescript
/**
 * Generate UUID v4
 * Uses crypto.randomUUID() where available, fallback for older browsers
 */
export function generateUUID(): string { ... }

/**
 * Format relative time (e.g., "2 min ago", "just now")
 */
export function formatRelativeTime(isoDate: string): string { ... }

/**
 * Generate change message from patch
 * e.g., "Updated title and description"
 */
export function generateChangeMessage(patch: JsonPatch): string { ... }
```

### New: src/core/versioning/index.ts

```typescript
// Types
export type { HybridModelId, VersionActor, VersionSource, ObjectVersion, StoredObject } from './schema';
export { getActorLabel, getModelLabel } from './schema';

// Interface
export type { ListVersionsOptions, VersionedObjectStore } from './store';
export { getVersionedObjectStore, setVersionedObjectStore } from './store';

// Implementation
export { IndexedDBVersionStore } from './indexeddb';

// Utilities
export { generateUUID, formatRelativeTime, generateChangeMessage } from './utils';
```

### New: src/shared/inspector/VersionIndicator.tsx

```typescript
import { VersionActor, getActorLabel, formatRelativeTime } from '../../core/versioning';

interface VersionIndicatorProps {
  ordinal: number | null;
  lastModifiedAt: string | null;
  lastModifiedBy: VersionActor | null;
}

export function VersionIndicator(props: VersionIndicatorProps) { ... }
```

### New: src/shared/inspector/hooks/useVersionedObject.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { GroveObject } from '../../../core/schema/grove-object';
import { JsonPatch } from '../../../core/copilot/schema';
import { 
  VersionActor, 
  VersionSource, 
  ObjectVersion,
  getVersionedObjectStore 
} from '../../../core/versioning';

export interface UseVersionedObjectResult { ... }

export function useVersionedObject(
  objectId: string,
  initialObject: GroveObject
): UseVersionedObjectResult { ... }
```

---

## Modified: src/shared/inspector/ObjectInspector.tsx

**Before:**
```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="text-2xl">{object.meta.icon}</div>
  <div>
    <h1>{object.meta.title}</h1>
    <div>{object.meta.type}</div>
  </div>
</div>
```

**After:**
```tsx
import { VersionIndicator } from './VersionIndicator';

// ... in component:
<div className="flex items-center gap-3 mb-4">
  <div className="text-2xl">{object.meta.icon}</div>
  <div>
    <h1>{object.meta.title}</h1>
    <div className="flex items-center gap-2">
      <span>{object.meta.type}</span>
      <VersionIndicator 
        ordinal={version?.ordinal ?? null}
        lastModifiedAt={version?.lastModifiedAt ?? null}
        lastModifiedBy={version?.lastModifiedBy ?? null}
      />
    </div>
  </div>
</div>
```

---

## Modified: src/shared/inspector/hooks/useCopilot.ts

**Before:**
```typescript
const applyPatch = useCallback((messageId: string) => {
  // ... find message, validate
  onApplyPatch(message.patch);
  // ... update state
  return message.patch;
}, [...]);
```

**After:**
```typescript
import { getSessionId } from '../../../core/engagement/persistence';
import { getVersionedObjectStore } from '../../../core/versioning';

const applyPatch = useCallback(async (messageId: string) => {
  // ... find message, validate
  
  // Find the user message that triggered this patch
  const userMessageIndex = state.messages.findIndex(m => m.id === messageId);
  const userMessage = state.messages
    .slice(0, userMessageIndex)
    .reverse()
    .find(m => m.role === 'user');
  
  // Create version with provenance
  const store = getVersionedObjectStore();
  const version = await store.applyPatch(
    object.meta.id,
    message.patch,
    {
      type: 'copilot',
      model: 'hybrid-local', // Current simulated mode
    },
    {
      type: 'copilot',
      sessionId: getSessionId(),
      intent: userMessage?.content ?? 'Unknown intent',
    },
    generateChangeMessage(message.patch)
  );
  
  // Update confirmation message with version
  const confirmMessage: CopilotMessage = {
    id: generateId(),
    role: 'assistant',
    content: `✓ Changes saved as v${version.ordinal}`,
    timestamp: new Date(),
  };
  
  // ... rest of state updates
  onApplyPatch(message.patch, version);
  
  return message.patch;
}, [...]);
```

---

## Modified: src/explore/JourneyInspector.tsx

**Before:**
```tsx
export function JourneyInspector({ journey, onClose }: Props) {
  const groveObject = journeyToGroveObject(journey);
  
  return (
    <ObjectInspector
      object={groveObject}
      onApplyPatch={(patch) => {
        // Apply to journey state
      }}
      onClose={onClose}
    />
  );
}
```

**After:**
```tsx
import { useVersionedObject } from '../shared/inspector/hooks/useVersionedObject';

export function JourneyInspector({ journey, onClose }: Props) {
  const initialObject = journeyToGroveObject(journey);
  
  const { object, version, loading, applyPatch } = useVersionedObject(
    journey.id,
    initialObject
  );
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <ObjectInspector
      object={object}
      version={version}
      onApplyPatch={async (patch) => {
        await applyPatch(
          patch,
          { type: 'copilot', model: 'hybrid-local' },
          { type: 'copilot', sessionId: getSessionId() }
        );
      }}
      onClose={onClose}
    />
  );
}
```

---

## Dependency Graph

```
src/core/versioning/
├── schema.ts           ← Imports from copilot/schema, schema/grove-object
├── store.ts            ← Imports from schema.ts
├── cache.ts            ← No dependencies
├── utils.ts            ← No dependencies
├── indexeddb.ts        ← Imports from store, schema, cache, utils, copilot/schema
└── index.ts            ← Re-exports all

src/shared/inspector/
├── VersionIndicator.tsx        ← Imports from versioning/
├── hooks/useVersionedObject.ts ← Imports from versioning/, schema/
├── hooks/useCopilot.ts         ← Imports from versioning/, engagement/
└── ObjectInspector.tsx         ← Imports VersionIndicator

src/explore/
├── JourneyInspector.tsx ← Imports useVersionedObject
└── LensInspector.tsx    ← Imports useVersionedObject
```

---

## Build Order

1. **Epic 1:** Core types and interface (`schema.ts`, `store.ts`, `utils.ts`)
2. **Epic 2:** Storage implementation (`cache.ts`, `indexeddb.ts`, `index.ts`)
3. **Epic 3:** Copilot integration (`useCopilot.ts` modifications)
4. **Epic 4:** UI components (`VersionIndicator.tsx`, `useVersionedObject.ts`)
5. **Epic 5:** Inspector wiring (`ObjectInspector.tsx`, `JourneyInspector.tsx`, `LensInspector.tsx`)

---

*Canonical location: `docs/sprints/object-versioning-v1/MIGRATION_MAP.md`*
