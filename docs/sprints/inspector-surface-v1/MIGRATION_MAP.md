# Migration Map: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Date:** 2024-12-26

---

## File Overview

### New Files (~265 lines)

| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/inspector/surface/types.ts` | ~80 | Interface + action types |
| `src/shared/inspector/surface/ReactInspectorSurface.ts` | ~120 | React implementation |
| `src/shared/inspector/surface/context.tsx` | ~50 | Context + provider + hook |
| `src/shared/inspector/surface/index.ts` | ~15 | Public exports |

### Modified Files (~50 lines)

| File | Changes | Lines |
|------|---------|-------|
| `src/shared/inspector/ObjectInspector.tsx` | Consume from context | ~25 |
| `src/explore/JourneyInspector.tsx` | Wrap with provider | ~10 |
| `src/explore/LensInspector.tsx` | Wrap with provider | ~10 |

---

## New: src/shared/inspector/surface/types.ts

Complete interface definition with JSDoc and A2UI mapping notes.

See ARCHITECTURE.md Section 1 for full implementation.

Key exports:
- `InspectorAction` — Discriminated union of action types
- `ActionHandler` — Handler function type
- `VersionInfo` — Version metadata for display
- `ModelInfo` — Model info for display
- `InspectorSurface<T>` — Main interface

---

## New: src/shared/inspector/surface/ReactInspectorSurface.ts

Class implementation wrapping existing functionality.

See ARCHITECTURE.md Section 2 for full implementation.

Key features:
- Manages state internally
- Calls VersionedObjectStore for persistence
- Notifies React via callback
- Handles action dispatch

---

## New: src/shared/inspector/surface/context.tsx

React context and provider.

See ARCHITECTURE.md Section 3 for full implementation.

Key exports:
- `InspectorSurfaceProvider` — Creates and provides surface
- `useInspectorSurface()` — Consumes surface from context

---

## New: src/shared/inspector/surface/index.ts

```typescript
// src/shared/inspector/surface/index.ts

// Types
export type { 
  InspectorSurface, 
  InspectorAction, 
  ActionHandler,
  VersionInfo,
  ModelInfo
} from './types';

// Implementation
export { ReactInspectorSurface } from './ReactInspectorSurface';
export type { ReactInspectorSurfaceConfig } from './ReactInspectorSurface';

// Context
export { 
  InspectorSurfaceProvider, 
  useInspectorSurface 
} from './context';
export type { InspectorSurfaceProviderProps } from './context';
```

---

## Modified: src/shared/inspector/ObjectInspector.tsx

**Before:**
```tsx
import { useCopilot } from './hooks/useCopilot';
import { useVersionedObject } from './hooks/useVersionedObject';

export function ObjectInspector({ 
  objectId, 
  initialObject, 
  onClose 
}: Props) {
  const { object, version, applyPatch } = useVersionedObject(objectId, initialObject);
  const copilot = useCopilot(object, {
    onApplyPatch: (patch) => {
      applyPatch(patch, { type: 'copilot', model: 'hybrid-local' }, ...);
    }
  });
  
  // ... render using object, version, copilot
}
```

**After:**
```tsx
import { useInspectorSurface } from './surface';

export function ObjectInspector({ onClose }: Props) {
  const surface = useInspectorSurface();
  
  // Derive values from surface
  const object = surface.dataModel;
  const version = surface.version;
  const messages = surface.messages;
  const loading = surface.loading;
  const error = surface.error;
  
  // Handle actions
  const handleSendMessage = (content: string) => {
    surface.dispatchAction({ type: 'SEND_MESSAGE', content });
  };
  
  const handleApplyPatch = (messageId: string) => {
    surface.dispatchAction({ type: 'APPLY_PATCH', messageId });
  };
  
  // ... render using surface state
}
```

**Key Changes:**
- Remove direct hook imports
- Use `useInspectorSurface()` instead
- Dispatch actions instead of calling methods directly
- Props simplified (no objectId/initialObject — provider handles)

---

## Modified: src/explore/JourneyInspector.tsx

**Before:**
```tsx
import { ObjectInspector } from '../shared/inspector/ObjectInspector';

export function JourneyInspector({ journey, onClose }: Props) {
  const groveObject = journeyToGroveObject(journey);
  
  return (
    <ObjectInspector
      objectId={journey.id}
      initialObject={groveObject}
      onClose={onClose}
    />
  );
}
```

**After:**
```tsx
import { ObjectInspector } from '../shared/inspector/ObjectInspector';
import { InspectorSurfaceProvider } from '../shared/inspector/surface';

export function JourneyInspector({ journey, onClose }: Props) {
  const groveObject = journeyToGroveObject(journey);
  
  return (
    <InspectorSurfaceProvider
      objectId={journey.id}
      initialObject={groveObject}
    >
      <ObjectInspector onClose={onClose} />
    </InspectorSurfaceProvider>
  );
}
```

**Key Changes:**
- Wrap ObjectInspector with InspectorSurfaceProvider
- Pass objectId and initialObject to provider
- ObjectInspector props simplified

---

## Modified: src/explore/LensInspector.tsx

**Before:**
```tsx
import { ObjectInspector } from '../shared/inspector/ObjectInspector';

export function LensInspector({ lens, onClose }: Props) {
  const groveObject = lensToGroveObject(lens);
  
  return (
    <ObjectInspector
      objectId={lens.id}
      initialObject={groveObject}
      onClose={onClose}
    />
  );
}
```

**After:**
```tsx
import { ObjectInspector } from '../shared/inspector/ObjectInspector';
import { InspectorSurfaceProvider } from '../shared/inspector/surface';

export function LensInspector({ lens, onClose }: Props) {
  const groveObject = lensToGroveObject(lens);
  
  return (
    <InspectorSurfaceProvider
      objectId={lens.id}
      initialObject={groveObject}
    >
      <ObjectInspector onClose={onClose} />
    </InspectorSurfaceProvider>
  );
}
```

---

## Dependency Graph

```
src/shared/inspector/surface/
├── types.ts           ← Imports from versioning, copilot
├── ReactInspectorSurface.ts ← Imports types, versioning store
├── context.tsx        ← Imports types, ReactInspectorSurface
└── index.ts           ← Re-exports all

src/shared/inspector/
└── ObjectInspector.tsx ← Imports from surface/

src/explore/
├── JourneyInspector.tsx ← Imports ObjectInspector, surface provider
└── LensInspector.tsx    ← Imports ObjectInspector, surface provider
```

---

## Build Order

1. **Epic 1:** Types (`types.ts`)
2. **Epic 2:** Implementation (`ReactInspectorSurface.ts`)
3. **Epic 3:** Context (`context.tsx`, `index.ts`)
4. **Epic 4:** Wire ObjectInspector
5. **Epic 5:** Wire parent inspectors (Journey, Lens)

---

*Canonical location: `docs/sprints/inspector-surface-v1/MIGRATION_MAP.md`*
