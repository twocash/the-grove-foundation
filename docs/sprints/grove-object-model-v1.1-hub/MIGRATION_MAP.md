# Migration Map: Hub Normalization (v1.1)

**Sprint:** grove-object-model-v1.1-hub  
**Estimated Changes:** ~85 lines across 4 files

---

## Migration Order

```
1. narrative.ts (extend TopicHub interface)
       ↓
2. HubContent.tsx (create renderer)
       ↓
3. GroveObjectCard/index.tsx (register renderer)
       ↓
4. useGroveObjects.ts (add normalizer + include hubs)
```

---

## 1. MODIFY: narrative.ts

**Path:** `src/core/schema/narrative.ts`

**Find the TopicHub interface and add optional GroveObjectMeta fields:**

```typescript
import { GroveObjectMeta, GroveObjectProvenance } from './grove-object';

// ... existing code ...

/**
 * TopicHub - Unified registry entry combining routing metadata and file paths
 * 
 * Extended in v1.1 to implement GroveObjectMeta (Pattern 7: Object Model)
 */
export interface TopicHub {
  id: string;
  title: string;

  // Routing configuration (for query matching)
  tags: string[];
  priority: number;
  enabled: boolean;

  // File path configuration (for RAG loading)
  path: string;
  primaryFile: string;
  supportingFiles: string[];
  maxBytes: number;

  // Expert framing (injected into prompts)
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;

  // Plugin lifecycle
  status: HubStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // === NEW: GroveObjectMeta compatibility (v1.1) ===
  /** Optional icon (Lucide icon name) */
  icon?: string;
  
  /** Optional provenance tracking */
  createdBy?: GroveObjectProvenance;
  
  /** Optional color for card rendering */
  color?: string;
}
```

**Note:** We add optional fields rather than using `extends` because TopicHub already has `status` with a compatible but different type (`HubStatus` vs general status).

---

## 2. CREATE: HubContent.tsx

**Path:** `src/surface/components/GroveObjectCard/HubContent.tsx`

```typescript
// src/surface/components/GroveObjectCard/HubContent.tsx
// Hub-specific content renderer for GroveObjectCard

import React from 'react';
import { TopicHub } from '@core/schema/narrative';
import { FileText, Tag, Zap } from 'lucide-react';

interface HubContentProps {
  hub: TopicHub;
}

export function HubContent({ hub }: HubContentProps) {
  const fileCount = 1 + (hub.supportingFiles?.length ?? 0);
  
  return (
    <div className="space-y-3">
      {/* Expert Framing (description) */}
      {hub.expertFraming && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {hub.expertFraming}
        </p>
      )}
      
      {/* Key Points */}
      {hub.keyPoints?.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1">
          {hub.keyPoints.slice(0, 3).map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <Zap className="w-3 h-3 mt-1 text-amber-500 flex-shrink-0" />
              <span className="line-clamp-1">{point}</span>
            </li>
          ))}
        </ul>
      )}
      
      {/* Footer Info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {/* File Count */}
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>
        
        {/* Priority */}
        <span className="flex items-center gap-1">
          Priority: {hub.priority}
        </span>
        
        {/* RAG Tags (first 2) */}
        {hub.tags?.length > 0 && (
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {hub.tags.slice(0, 2).join(', ')}
            {hub.tags.length > 2 && ` +${hub.tags.length - 2}`}
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## 3. MODIFY: GroveObjectCard/index.tsx

**Path:** `src/surface/components/GroveObjectCard/index.tsx`

**Add import and register HubContent:**

```typescript
// Add import
import { HubContent } from './HubContent';
import { TopicHub } from '@core/schema/narrative';

// Update CONTENT_RENDERERS
const CONTENT_RENDERERS: Record<string, ContentRenderer<any>> = {
  journey: ({ object }) => <JourneyContent journey={object.payload as Journey} />,
  hub: ({ object }) => <HubContent hub={object.payload as TopicHub} />,
};
```

---

## 4. MODIFY: useGroveObjects.ts

**Path:** `src/surface/hooks/useGroveObjects.ts`

**Add normalizeHub function and include hubs in collection:**

```typescript
// Add import
import { Journey, TopicHub } from '@core/schema/narrative';

// Add normalizer (after normalizeJourney)
function normalizeHub(hub: TopicHub): GroveObject<TopicHub> {
  return {
    meta: {
      id: hub.id,
      type: 'hub',
      title: hub.title,
      description: hub.expertFraming,
      icon: hub.icon,
      color: hub.color,
      createdAt: hub.createdAt,
      updatedAt: hub.updatedAt,
      createdBy: hub.createdBy,
      status: hub.status,
      tags: hub.tags,
      favorite: isFavorite(hub.id),
    },
    payload: hub,
  };
}

// Update allObjects useMemo to include hubs
const allObjects = useMemo(() => {
  const result: GroveObject[] = [];
  
  // Add journeys
  if (!types || types.includes('journey')) {
    Object.values(journeys ?? {}).forEach(j => {
      result.push(normalizeJourney(j));
    });
  }
  
  // Add hubs (NEW)
  if (!types || types.includes('hub')) {
    Object.values(hubs ?? {}).forEach(h => {
      result.push(normalizeHub(h));
    });
  }
  
  return result;
}, [journeys, hubs, types]);
```

**Note:** Need to also destructure `hubs` from `useNarrativeEngine()`:

```typescript
const { journeys, hubs, loading, error } = useNarrativeEngine();
```

---

## Verification Checklist

After migration:

- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
- [ ] Console: `useGroveObjects({ types: ['hub'] })` returns hub objects
- [ ] HubContent renders with key points visible
- [ ] Can favorite a hub (star persists on refresh)
- [ ] Mixed query works: `useGroveObjects({ types: ['journey', 'hub'] })`

---

## Commit Sequence

```
1. feat(schema): add GroveObjectMeta fields to TopicHub
2. feat(components): add HubContent renderer
3. feat(hooks): add hub normalization to useGroveObjects
```

---

*Focused extension following Pattern 7 methodology.*
