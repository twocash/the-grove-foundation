# Specification: Hub Normalization (v1.1)

**Sprint:** grove-object-model-v1.1-hub  
**Time Budget:** 2-3 hours

---

## Requirements

### REQ-1: Extend TopicHub Interface

TopicHub should implement GroveObjectMeta while preserving all existing fields.

**Current fields to map:**
- `id` → `id` ✓
- `title` → `title` ✓
- `expertFraming` → `description` (semantic mapping)
- (none) → `icon` (add as optional)
- `createdAt` → `createdAt` ✓
- `updatedAt` → `updatedAt` ✓
- (none) → `createdBy` (add as optional)
- `status` → `status` ✓ (already compatible: 'active' | 'draft' | 'archived')
- `tags` → `tags` ✓ (dual purpose: RAG routing + organization)
- (none) → `favorite` (user-local via localStorage)

**Approach:** Flattened extension, same as Journey.

---

### REQ-2: Add normalizeHub Function

```typescript
function normalizeHub(hub: TopicHub): GroveObject<TopicHub> {
  return {
    meta: {
      id: hub.id,
      type: 'hub',
      title: hub.title,
      description: hub.expertFraming,  // Map expertFraming to description
      icon: hub.icon,
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

---

### REQ-3: Create HubContent Renderer

Display hub-specific information:
- Key points (bullet list, max 3)
- File count (primaryFile + supportingFiles)
- Priority indicator
- RAG tag chips

---

### REQ-4: Register in CONTENT_RENDERERS

```typescript
const CONTENT_RENDERERS = {
  journey: JourneyContentRenderer,
  hub: HubContentRenderer,  // Add this
};
```

---

### REQ-5: Update useGroveObjects

Add hub normalization to the collection hook:

```typescript
// In useGroveObjects
if (!types || types.includes('hub')) {
  Object.values(hubs ?? {}).forEach(h => {
    result.push(normalizeHub(h));
  });
}
```

---

## Acceptance Criteria

- [ ] TopicHub interface includes optional `icon` and `createdBy` fields
- [ ] `normalizeHub()` returns valid GroveObject<TopicHub>
- [ ] HubContent renders key points and file info
- [ ] `useGroveObjects({ types: ['hub'] })` returns hubs
- [ ] `useGroveObjects({ types: ['journey', 'hub'] })` returns both
- [ ] Favorites work for hubs
- [ ] Build passes

---

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/core/schema/narrative.ts` | MODIFY | ~10 |
| `src/surface/hooks/useGroveObjects.ts` | MODIFY | ~20 |
| `src/surface/components/GroveObjectCard/HubContent.tsx` | CREATE | ~50 |
| `src/surface/components/GroveObjectCard/index.tsx` | MODIFY | ~5 |

**Total:** ~85 lines changed/added

---

*Focused extension of Pattern 7.*
