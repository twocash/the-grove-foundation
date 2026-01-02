# Grove Data Layer Migration Guide

**Sprint:** grove-data-layer-v1
**Date:** January 2026

This guide documents the migration from legacy data hooks to the unified Grove Data Layer.

---

## Overview

The Grove Data Layer (`@core/data`) provides a unified interface for CRUD operations on all Grove objects. It replaces the previous pattern of `useNarrativeEngine` + `useVersionedCollection` with adapter-based storage (LocalStorage, Supabase, Hybrid).

---

## Migration Patterns

### Pattern 1: Bedrock Console Data Hooks

**Before (Legacy):**
```typescript
// Direct localStorage access
const lenses = JSON.parse(localStorage.getItem('grove-lenses') || '[]');
```

**After (Data Layer):**
```typescript
import { useGroveData } from '@core/data';
import type { LensPayload } from '../../types/lens';

function useLensData() {
  const groveData = useGroveData<LensPayload>('lens');

  return {
    objects: groveData.objects,
    loading: groveData.loading,
    error: groveData.error,
    create: groveData.create,
    update: groveData.update,
    remove: groveData.remove,
    refetch: groveData.refetch,
  };
}
```

---

### Pattern 2: Runtime Component Data (LensPicker, JourneyList)

**Before (Legacy):**
```typescript
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useVersionedCollection } from '../../hooks/useVersionedCollection';

function LensPicker() {
  const { getEnabledPersonas } = useNarrativeEngine();
  const schemaPersonas = getEnabledPersonas();
  const { items: personas } = useVersionedCollection(schemaPersonas, { objectType: 'lens' });
  // ...
}
```

**After (Data Layer):**
```typescript
import { useLensPickerData } from './hooks';

function LensPicker() {
  const { personas, customLenses, refreshPersonas } = useLensPickerData();
  // ...
}
```

---

### Pattern 3: Journey List Data

**Before (Legacy):**
```typescript
const { schema } = useNarrativeEngine();
const schemaJourneys = Object.values(schema.journeys).filter(j => j.status === 'active');
const { items: journeys } = useVersionedCollection(schemaJourneys, { objectType: 'journey' });
```

**After (Data Layer):**
```typescript
import { useJourneyListData } from './hooks';

const { journeys, loading, refreshJourneys, getJourney } = useJourneyListData();
```

---

## Wrapper Hook Pattern

When migrating a component, create a wrapper hook that:

1. Uses `useGroveData<T>(type)` internally
2. Transforms `GroveObject<T>` to the interface the component expects
3. Preserves the component's external interface

**Example:**
```typescript
// src/explore/hooks/useLensPickerData.ts
import { useGroveData } from '@core/data';
import type { Persona } from '../../../data/narratives-schema';

function groveObjectToPersona(obj: GroveObject<Persona>): Persona {
  return {
    ...obj.payload,
    id: obj.meta.id,
    publicLabel: obj.meta.title || obj.payload.publicLabel,
    enabled: obj.meta.status === 'active',
  };
}

export function useLensPickerData() {
  const groveData = useGroveData<Persona>('lens');

  const personas = useMemo(() => {
    return groveData.objects
      .map(groveObjectToPersona)
      .filter(persona => persona.enabled);
  }, [groveData.objects]);

  return { personas, loading: groveData.loading, /* ... */ };
}
```

---

## Key Differences

| Aspect | Legacy Pattern | Data Layer |
|--------|----------------|------------|
| Storage | Direct localStorage | Adapter-based (Local, Supabase, Hybrid) |
| Schema | Fetched from API | Adapter-provided with defaults |
| Versioning | IndexedDB merges | Built into adapter layer |
| CRUD | Manual implementation | Unified interface |
| Subscriptions | Manual event handling | Provider-based reactive updates |

---

## Deprecated Hooks

The following hooks are deprecated and should not be used in new code:

| Hook | Replacement |
|------|-------------|
| `useVersionedCollection` | `useGroveData` or wrapper hooks |
| `useGroveObjects` | `useGroveData` |

These hooks will show strikethrough in IDEs due to `@deprecated` JSDoc tags.

---

## Files Reference

**Core Data Layer:**
- `src/core/data/grove-data-provider.ts` - Interface definition
- `src/core/data/use-grove-data.ts` - React hook
- `src/core/data/adapters/` - Storage adapters
- `src/core/data/index.ts` - Barrel exports

**Wrapper Hooks:**
- `src/explore/hooks/useLensPickerData.ts` - LensPicker data
- `src/explore/hooks/useJourneyListData.ts` - JourneyList data
- `src/bedrock/consoles/LensWorkshop/useLensData.ts` - Bedrock lens CRUD

---

## Next Steps After Migration

1. Remove deprecated hooks once all consumers are migrated
2. Enable Supabase adapter for production (server-side storage)
3. Add Supabase Realtime for cross-tab sync
4. Consider offline-first with service worker
