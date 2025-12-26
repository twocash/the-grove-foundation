# Specification: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Status:** Final  
**Author:** Claude + Jim Calhoun  
**Date:** 2024-12-26

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Version records | `versioned-artifact.ts` | Add ObjectVersion with UUID + rich provenance |
| Storage abstraction | `user-preferences.ts` | New VersionedObjectStore interface following `grove:` prefix |
| Copilot integration | `useCopilot.ts` | Create version on Apply callback |
| UI state display | Pattern 4: Styling | Use token namespace for version indicator |

## New Patterns Proposed

### Proposed: Versioned Object Storage

**Why existing patterns are insufficient:**
- `versioned-artifact.ts` provides in-memory types only—no persistence
- `user-preferences.ts` handles simple key-value, not structured version history
- No existing IndexedDB usage in the project

**DEX compliance:**
- **Declarative Sovereignty:** Version schema defined in TypeScript; storage behavior in implementation
- **Capability Agnosticism:** Storage works regardless of model that generated the patch
- **Provenance as Infrastructure:** Full actor/source tracking on every version
- **Organic Scalability:** Interface supports unlimited versions; implementation can add strategies

---

## Requirements

### R1: Version Record Schema

**R1.1:** Each version record MUST have a unique identifier (UUID v4).

**R1.2:** Each version record MUST have a monotonically increasing ordinal (1, 2, 3...) within its object scope.

**R1.3:** Each version record MUST track:
- `versionId` (UUID)
- `objectId` (the object being versioned)
- `objectType` (journey, lens, sprout, etc.)
- `ordinal` (integer, starts at 1)
- `createdAt` (ISO 8601 timestamp)
- `patch` (RFC 6902 JSON Patch that produced this version)
- `previousVersionId` (link to prior version, null for v1)

**R1.4:** Each version record MUST include actor provenance:
- `actor.type`: 'human' | 'copilot' | 'system' | 'agent'
- `actor.model`: Model identifier (e.g., 'hybrid-local', 'hybrid-cloud')
- `actor.id`: Optional user/agent identifier

**R1.5:** Each version record MUST include source provenance:
- `source.type`: 'copilot' | 'direct-edit' | 'import' | 'migration' | 'system'
- `source.sessionId`: Engagement session identifier
- `source.intent`: Original user input (for copilot sources)

**R1.6:** Version records MAY include an optional human-readable message describing the change.

### R2: Storage Service

**R2.1:** Storage MUST persist across browser sessions.

**R2.2:** Storage MUST use IndexedDB as the authoritative store.

**R2.3:** Storage MUST use localStorage as a fast-read cache.

**R2.4:** Storage interface MUST be abstract (VersionedObjectStore) to support future backends.

**R2.5:** Storage keys MUST follow the `grove:` prefix pattern:
- localStorage: `grove:objects:{objectId}`
- IndexedDB database: `grove-versioning`

**R2.6:** Storage MUST limit to 50 versions per object (MVP). When exceeded, oldest versions are pruned. This limit MUST be documented in code comments as an MVP limitation.

**R2.7:** Storage operations MUST handle `typeof window === 'undefined'` for SSR safety.

### R3: Baseline Import

**R3.1:** When an object is first loaded from static JSON (no existing stored version), the system MUST auto-create a "v1 - System Import" version.

**R3.2:** The baseline version MUST have:
- `actor.type`: 'system'
- `actor.model`: null
- `source.type`: 'import'
- `patch`: Empty patch (or full object as "add" operations)
- `message`: 'Initial import from system configuration'

### R4: Copilot Integration

**R4.1:** When user clicks "Apply" on a Copilot-generated patch, the system MUST create a new version record.

**R4.2:** The version record MUST capture:
- `actor.type`: 'copilot'
- `actor.model`: 'hybrid-local' (current simulated mode)
- `source.type`: 'copilot'
- `source.sessionId`: Current engagement session ID
- `source.intent`: The user's natural language input that triggered the patch

**R4.3:** The confirmation message MUST include version number: "✓ Changes saved as v{ordinal}"

**R4.4:** Apply MUST use optimistic UI (confirm immediately, persist async). Code comments MUST note that persist-wait is a future robustness option.

### R5: Version Indicator UI

**R5.1:** ObjectInspector MUST display a version indicator in the header area.

**R5.2:** Version indicator MUST show:
- Current version ordinal (e.g., "v3")
- Relative time since last modification (e.g., "2 min ago")
- Actor type (e.g., "via Copilot")

**R5.3:** Format: `v{ordinal} • Modified {relativeTime} via {actorType}`

**R5.4:** For objects with no versions (first load), show: `Draft • Unsaved`

**R5.5:** Version indicator MAY include a "View History" button (disabled, tooltip: "Coming soon").

### R6: A2UI Compatibility

**R6.1:** All persistence logic MUST be in the service layer (VersionedObjectStore), NOT in React components.

**R6.2:** Data addressing MUST use JSON Pointer (RFC 6901) paths.

**R6.3:** Mutations MUST use JSON Patch (RFC 6902) format.

**R6.4:** The storage interface MUST be renderer-agnostic (could back React, A2UI, or any future UI layer).

---

## Data Model

### ObjectVersion

```typescript
interface ObjectVersion {
  // Identity
  versionId: string;           // UUID v4
  objectId: string;
  objectType: GroveObjectType;
  ordinal: number;             // 1, 2, 3...
  
  // Timestamp
  createdAt: string;           // ISO 8601
  
  // Provenance
  actor: VersionActor;
  source: VersionSource;
  
  // Change
  patch: JsonPatch;
  previousVersionId: string | null;
  
  // Optional
  message?: string;
}
```

### VersionActor

```typescript
interface VersionActor {
  type: 'human' | 'copilot' | 'system' | 'agent';
  model?: 'hybrid-local' | 'hybrid-cloud' | null;
  id?: string;
}
```

### VersionSource

```typescript
interface VersionSource {
  type: 'copilot' | 'direct-edit' | 'import' | 'migration' | 'system';
  sessionId?: string;
  intent?: string;
}
```

### StoredObject

```typescript
interface StoredObject<T = unknown> {
  current: GroveObject<T>;
  currentVersionId: string;
  versionCount: number;
  lastModifiedAt: string;
  lastModifiedBy: VersionActor;
}
```

---

## Interface Definition

```typescript
interface VersionedObjectStore {
  // Lifecycle
  initialize(): Promise<void>;
  
  // Read
  get(objectId: string): Promise<StoredObject | null>;
  getVersion(versionId: string): Promise<ObjectVersion | null>;
  listVersions(objectId: string, options?: ListVersionsOptions): Promise<ObjectVersion[]>;
  
  // Write
  applyPatch(
    objectId: string,
    patch: JsonPatch,
    actor: VersionActor,
    source: VersionSource,
    message?: string
  ): Promise<ObjectVersion>;
  
  importObject(
    object: GroveObject,
    actor: VersionActor
  ): Promise<ObjectVersion>;
  
  // Maintenance
  pruneVersions(objectId: string, keepCount: number): Promise<number>;
  clear(): Promise<void>;
}

interface ListVersionsOptions {
  limit?: number;      // Default: 50
  offset?: number;
  order?: 'asc' | 'desc';  // Default: 'desc'
}
```

---

## Acceptance Criteria

### P0: Must Have

- [ ] Objects modified via Copilot persist across browser refresh
- [ ] Each modification creates version with UUID, ordinal, timestamp, actor, source, patch
- [ ] Version indicator displays in ObjectInspector header
- [ ] Confirmation message shows version number
- [ ] Baseline import auto-creates v1 for static objects

### P1: Should Have

- [ ] localStorage cache for fast reads
- [ ] Graceful degradation if IndexedDB unavailable
- [ ] 50-version limit with automatic pruning

### P2: Nice to Have

- [ ] "View History" button (disabled, coming soon)
- [ ] Actor type icon in version indicator

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│  Object Inspector                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🎯 Journey: The Infinite Game                              │ │
│  │     journey                                                 │ │
│  │     v3 • Modified 2 min ago via Copilot    [View History]  │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  META                                                            │
│  └─ (fields...)                                                  │
├─────────────────────────────────────────────────────────────────┤
│  PAYLOAD                                                         │
│  └─ (fields...)                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ✨ Copilot Configurator [Beta]                                 │
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

*Canonical location: `docs/sprints/object-versioning-v1/SPEC.md`*
