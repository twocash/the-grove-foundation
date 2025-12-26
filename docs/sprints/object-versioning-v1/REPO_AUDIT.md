# Repository Audit: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Audit Date:** 2024-12-26

---

## Current State Summary

### Storage Infrastructure

**localStorage (via user-preferences.ts):**
- Simple key-value storage with `grove:` prefix
- Handles favorites and user tags
- No versioning or history capability
- Pattern we should follow for cache layer

**IndexedDB:**
- Not currently used in the project
- Will be new infrastructure for version records

### Versioning Stubs (versioned-artifact.ts)

```typescript
// Existing interfaces (Sprint 4 stubs)
interface VersionedArtifact {
  id: string;
  version: number;           // Simple ordinal
  createdAt: string;
  updatedAt: string;
  status: ArtifactStatus;
  versionHistory?: VersionHistoryEntry[];
}

interface VersionHistoryEntry {
  version: number;
  timestamp: string;
  action: VersionAction;
  changedFields?: string[];
  changedBy?: string;        // Simple string, not rich provenance
}
```

**Gap Analysis:**
- ✅ Has ordinal versioning concept
- ✅ Has history entries concept
- ❌ No UUID for version identification
- ❌ No full patch storage (only `changedFields`)
- ❌ No rich actor/source provenance
- ❌ No storage persistence (in-memory only)
- ❌ No integration with Copilot patches

### Copilot System (src/core/copilot/)

**Current flow:**
```
parser.ts       → parseIntent() → ParsedIntent
patch-generator.ts → generatePatch() → JsonPatch
validator.ts    → validatePatch() → ValidationResult
schema.ts       → CopilotMessage, JsonPatchOperation types
```

**Hook (useCopilot.ts):**
```typescript
const applyPatch = useCallback((messageId: string) => {
  // 1. Find message with patch
  // 2. Apply via rfc6902
  // 3. Call onApplyPatch callback
  // 4. Update message status to 'applied'
  // 5. Add confirmation message
  // Returns the patch
}, [...]);
```

**Integration Point:** The `onApplyPatch(patch)` callback is where version creation will hook in.

### Object Inspector (src/shared/inspector/)

**Files:**
```
ObjectInspector.tsx        → Main container, renders sections
ObjectMetaSection.tsx      → Meta fields display
ObjectPayloadSection.tsx   → Payload tree viewer
DiffPreview.tsx           → Before/after comparison
hooks/
  useCopilot.ts           → Copilot state machine
  useInspectorState.ts    → Local UI state
```

**Current Header:**
```typescript
// ObjectInspector.tsx header area
<div className="flex items-center gap-3 mb-4">
  <div className="text-2xl">{object.meta.icon}</div>
  <div>
    <h1>{object.meta.title}</h1>
    <div>{object.meta.type}</div>
  </div>
</div>
```

**Integration Point:** Add version indicator after type badge.

### Engagement Session

**Files:**
```
src/core/engagement/persistence.ts  → Session ID management
src/core/engagement/context.tsx     → Engagement provider
```

**Existing Session Pattern:**
```typescript
// From persistence.ts
export function getSessionId(): string {
  // Returns or creates session ID
}
```

**Integration Point:** Use this for `source.sessionId` in version records.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/versioned-artifact.ts` | Extend with ObjectVersion, VersionActor, VersionSource types |
| `src/shared/inspector/hooks/useCopilot.ts` | Create version on Apply |
| `src/shared/inspector/ObjectInspector.tsx` | Add VersionIndicator |
| `src/explore/JourneyInspector.tsx` | Load from versioned store |
| `src/explore/LensInspector.tsx` | Load from versioned store |

## Files to Create

| File | Purpose |
|------|---------|
| `src/core/versioning/schema.ts` | ObjectVersion, VersionActor, VersionSource types |
| `src/core/versioning/store.ts` | VersionedObjectStore interface |
| `src/core/versioning/indexeddb.ts` | IndexedDB implementation |
| `src/core/versioning/cache.ts` | localStorage caching layer |
| `src/core/versioning/utils.ts` | UUID generation, message formatting |
| `src/core/versioning/index.ts` | Public exports |
| `src/shared/inspector/VersionIndicator.tsx` | Version display component |
| `src/shared/inspector/hooks/useVersionedObject.ts` | React hook for versioned operations |

---

## Dependencies

### External Packages

**Already Available:**
- `rfc6902` — JSON Patch library (used by Copilot)
- No new npm packages required

**IndexedDB:**
- Using native browser IndexedDB API
- Consider `idb` wrapper for cleaner async (optional, evaluate during implementation)

### Internal Dependencies

```
src/core/versioning/
  └── depends on: src/core/copilot/schema.ts (JsonPatch types)
  └── depends on: src/core/engagement/persistence.ts (session ID)
  └── depends on: src/core/schema/grove-object.ts (GroveObject type)

src/shared/inspector/hooks/useVersionedObject.ts
  └── depends on: src/core/versioning/store.ts
  
src/shared/inspector/hooks/useCopilot.ts
  └── will depend on: src/core/versioning/store.ts
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IndexedDB API complexity | Medium | Low | Use async/await wrapper; fallback to localStorage-only |
| Quota limits | Low | Medium | 50-version cap per object |
| Cross-tab conflicts | Medium | Low | Last-write-wins for MVP; noted for future |
| SSR hydration mismatch | Medium | Medium | Guard with `typeof window !== 'undefined'` |
| Inspector coupling | Low | High | Abstract via VersionedObjectStore interface |

---

## Test Coverage Needed

| Area | Tests |
|------|-------|
| Version creation | Unit: `applyPatch` creates version with correct fields |
| Version retrieval | Unit: `get` returns stored object with version metadata |
| Ordinal increment | Unit: Version ordinal increases monotonically |
| Persistence | Integration: Object survives page reload |
| Cache coherence | Unit: localStorage cache matches IndexedDB |
| Baseline import | Unit: First load creates v1 |

---

*Canonical location: `docs/sprints/object-versioning-v1/REPO_AUDIT.md`*
