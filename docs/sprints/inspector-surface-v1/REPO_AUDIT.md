# Repository Audit: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Audit Date:** 2024-12-26

---

## Current State Summary

### Inspector Component Structure

```
src/shared/inspector/
├── ObjectInspector.tsx       → Main container
├── ObjectMetaSection.tsx     → Meta fields display
├── ObjectPayloadSection.tsx  → Payload tree viewer
├── DiffPreview.tsx          → Before/after comparison
├── VersionIndicator.tsx     → Version display (Sprint 8)
└── hooks/
    ├── useCopilot.ts        → Copilot state machine
    ├── useInspectorState.ts → Local UI state
    └── useVersionedObject.ts → Versioning operations (Sprint 8)
```

### Current Coupling Analysis

**ObjectInspector.tsx dependencies:**
```typescript
// Direct hook imports
import { useCopilot } from './hooks/useCopilot';
import { useVersionedObject } from './hooks/useVersionedObject';
import { useInspectorState } from './hooks/useInspectorState';

// Direct state access
const { object, version, applyPatch } = useVersionedObject(objectId, initial);
const copilot = useCopilot(object, { onApplyPatch: ... });
const uiState = useInspectorState();
```

**Issues with current approach:**
1. Component directly depends on hook implementations
2. Can't swap data layer without modifying component
3. Testing requires mocking multiple hooks
4. No single "contract" defining Inspector operations

### Existing Patterns to Leverage

**From PROJECT_PATTERNS.md:**

| Pattern | Relevance |
|---------|-----------|
| Pattern 2: State Management | Surface manages state transitions |
| Pattern 6: Component Composition | Surface enables composition |
| Pattern 8: Canonical Source | Surface is canonical for Inspector data |

### Files to Analyze

**src/shared/inspector/hooks/useCopilot.ts:**
- Manages chat messages, model state, parsing, patch generation
- Exposes: `messages`, `sendMessage`, `applyPatch`, `rejectPatch`, `clear`
- Internal state machine (useReducer)

**src/shared/inspector/hooks/useVersionedObject.ts (Sprint 8):**
- Manages versioned object loading and persistence
- Exposes: `object`, `version`, `loading`, `error`, `applyPatch`
- Integrates with VersionedObjectStore

**src/shared/inspector/hooks/useInspectorState.ts:**
- UI-only state (expanded sections, scroll position)
- Exposes: `expandedSections`, `toggleSection`
- No persistence needed

---

## Interface Extraction Analysis

### What the Interface Should Expose

| Category | Operations | Source Hook |
|----------|------------|-------------|
| **Data Model** | `dataModel`, `setDataModel`, `getValue`, `setValue` | useVersionedObject |
| **Actions** | `dispatchAction`, `onAction` | useCopilot |
| **Versioning** | `version`, `applyPatch` | useVersionedObject |
| **Lifecycle** | `loading`, `error`, `initialize`, `dispose` | useVersionedObject |
| **Copilot** | `messages`, `currentModel` | useCopilot |

### What Stays in Components

| Concern | Why |
|---------|-----|
| UI state (expanded sections) | Component-local, not data layer |
| Scroll position | Component-local |
| Animation state | Component-local |

---

## A2UI Mapping Analysis

| Our Concept | A2UI Concept | Notes |
|-------------|--------------|-------|
| `InspectorSurface` | A2UI Application | Root coordination |
| `dataModel` | `dataModel` state | Same concept |
| `getValue(path)` | JSON Pointer resolution | RFC 6901 |
| `dispatchAction(action)` | `userAction` | Action dispatch |
| `applyPatch(patch)` | Mutation + response | We add provenance |
| `messages` | N/A | Grove Copilot extension |
| `version` | N/A | Grove versioning extension |

---

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `surface/types.ts` | Interface + action types | ~80 |
| `surface/ReactInspectorSurface.ts` | React implementation | ~120 |
| `surface/context.tsx` | React context + provider | ~40 |
| `surface/useInspectorSurface.ts` | Consumer hook | ~15 |
| `surface/index.ts` | Public exports | ~10 |

**Total new:** ~265 lines

## Files to Modify

| File | Changes | Lines |
|------|---------|-------|
| `ObjectInspector.tsx` | Consume from context | ~30 changed |
| `JourneyInspector.tsx` | Wrap with provider | ~10 changed |
| `LensInspector.tsx` | Wrap with provider | ~10 changed |

**Total modified:** ~50 lines

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing behavior | Low | High | Interface wraps, doesn't replace |
| Over-abstraction | Medium | Low | Keep interface minimal |
| Context re-render issues | Low | Medium | Memoize surface instance |
| Hook timing issues | Low | Medium | Surface owns initialization |

---

## Dependencies

**Prerequisite Sprint:**
- object-versioning-v1 must be complete (provides `useVersionedObject`)

**No new npm packages required.**

---

*Canonical location: `docs/sprints/inspector-surface-v1/REPO_AUDIT.md`*
