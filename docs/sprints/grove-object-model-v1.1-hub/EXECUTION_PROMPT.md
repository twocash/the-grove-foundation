# Execution Prompt: Hub Normalization (v1.1)

**Sprint:** grove-object-model-v1.1-hub  
**For:** Claude Code CLI  
**Time Budget:** 2-3 hours

---

## Pre-Flight Checklist

```bash
cd C:\GitHub\the-grove-foundation
git pull origin main  # Get Sprint 6 + 7 merges
pnpm install
pnpm build  # Must pass
```

**Verify Pattern 7 exists:**
- `src/core/schema/grove-object.ts` exists
- `src/surface/components/GroveObjectCard/` directory exists
- `src/surface/hooks/useGroveObjects.ts` exists

---

## Context

You are extending Pattern 7 (Object Model) to include TopicHub.

**Goal:** Hubs become first-class GroveObjects that can be filtered, favorited, and rendered with the generic card system.

---

## Step 1: Extend TopicHub Interface

**File:** `src/core/schema/narrative.ts`

Add optional GroveObjectMeta fields to TopicHub interface:

```typescript
// Add to imports at top of file
import { GroveObjectProvenance } from './grove-object';
```

Then add these fields to the TopicHub interface (after the existing `updatedAt` field):

```typescript
  // === GroveObjectMeta compatibility (v1.1) ===
  /** Optional icon (Lucide icon name) */
  icon?: string;
  
  /** Optional provenance tracking */
  createdBy?: GroveObjectProvenance;
  
  /** Optional color for card rendering */
  color?: string;
```

**Verify:** `pnpm build`

---

## Step 2: Create HubContent.tsx

**File:** `src/surface/components/GroveObjectCard/HubContent.tsx`

Create new file with hub-specific content renderer.

See MIGRATION_MAP.md Section 2 for exact code.

Key elements:
- Expert framing as description
- Key points (max 3, with Zap icon)
- File count
- Priority indicator
- RAG tag chips

**Verify:** `pnpm build`

---

## Step 3: Register HubContent

**File:** `src/surface/components/GroveObjectCard/index.tsx`

Add import:
```typescript
import { HubContent } from './HubContent';
import { TopicHub } from '@core/schema/narrative';
```

Add to CONTENT_RENDERERS:
```typescript
hub: ({ object }) => <HubContent hub={object.payload as TopicHub} />,
```

**Verify:** `pnpm build`

---

## Step 4: Add Hub to useGroveObjects

**File:** `src/surface/hooks/useGroveObjects.ts`

1. Update import to include TopicHub:
```typescript
import { Journey, TopicHub } from '@core/schema/narrative';
```

2. Destructure hubs from NarrativeEngine:
```typescript
const { journeys, hubs, loading, error } = useNarrativeEngine();
```

3. Add normalizeHub function (after normalizeJourney):
```typescript
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
```

4. Update allObjects useMemo to include hubs:
```typescript
// Add hubs
if (!types || types.includes('hub')) {
  Object.values(hubs ?? {}).forEach(h => {
    result.push(normalizeHub(h));
  });
}
```

5. Update useMemo dependencies:
```typescript
}, [journeys, hubs, types]);
```

**Verify:** `pnpm build`

---

## Manual Test Matrix

| # | Test | Expected |
|---|------|----------|
| 1 | `useGroveObjects()` | Returns journeys AND hubs |
| 2 | `useGroveObjects({ types: ['hub'] })` | Returns only hubs |
| 3 | `useGroveObjects({ types: ['journey', 'hub'] })` | Returns both |
| 4 | Render GroveObjectCard with hub | Shows HubContent |
| 5 | Click favorite star on hub | Persists on refresh |
| 6 | Filter by status | Hubs respect status filter |

---

## Troubleshooting

### hubs undefined in useNarrativeEngine
Check if NarrativeEngine exposes hubs. May need:
```typescript
const hubs = schema?.hubs ?? schema?.globalSettings?.topicHubs ?? {};
```

### HubContent not rendering
Verify CONTENT_RENDERERS has 'hub' key and import is correct.

### Type errors on TopicHub
Ensure grove-object.ts GroveObjectProvenance is exported.

---

## Success Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm test` passes  
- [ ] Hubs appear in useGroveObjects output
- [ ] HubContent shows key points
- [ ] Favorites work for hubs
- [ ] Mixed type queries work

---

## Commit Messages

```
feat(schema): add GroveObjectMeta fields to TopicHub
feat(components): add HubContent renderer for GroveObjectCard
feat(hooks): add hub normalization to useGroveObjects
```

---

## Reference Files

- `docs/sprints/grove-object-model-v1.1-hub/SPEC.md`
- `docs/sprints/grove-object-model-v1.1-hub/MIGRATION_MAP.md`
- `docs/sprints/grove-object-model-v1/ARCHITECTURE.md` (Pattern 7 reference)

---

*Extension sprint. Follow Pattern 7 methodology.*
