# Repository Audit: Grove Object Model

**Sprint:** grove-object-model-v1  
**Audit Date:** December 2024  
**Scope:** All object types in Grove that could benefit from unified schema

---

## Executive Summary

Grove has **six distinct object types** scattered across different schema files with inconsistent metadata patterns. Some have timestamps, some have status fields, none have favorites, none have explicit provenance (createdBy). There is no unified base type and no generic rendering mechanism.

This audit maps what exists, identifies patterns and gaps, and recommends a unified GroveObject base type.

---

## Current Object Types Inventory

### 1. Persona (Lens)

**Location:** `src/core/schema/narrative.ts` (line 27-47)

**Current Fields:**
```typescript
interface Persona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;
  color: PersonaColor;
  enabled: boolean;
  // ... many config fields
}
```

**Metadata Analysis:**
| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title/label | ✅ | `publicLabel` |
| description | ✅ | |
| icon | ✅ | Lucide icon name |
| createdAt | ❌ | Missing |
| updatedAt | ❌ | Missing |
| createdBy | ❌ | Missing |
| status | ❌ | Uses `enabled` boolean instead |
| tags | ❌ | Missing |
| favorite | ❌ | Missing |

**Storage:** `NarrativeSchemaV2.personas` (Record)

---

### 2. Journey

**Location:** `src/core/schema/narrative.ts` (line 166-189)

**Current Fields:**
```typescript
interface Journey {
  id: string;
  title: string;
  description: string;
  entryNode: string;
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;
  icon?: string;
  color?: string;
  status: JourneyStatus;  // 'active' | 'draft'
  createdAt: string;
  updatedAt: string;
}
```

**Metadata Analysis:**
| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title | ✅ | |
| description | ✅ | |
| icon | ✅ | Optional |
| createdAt | ✅ | ISO string |
| updatedAt | ✅ | ISO string |
| createdBy | ❌ | Missing |
| status | ✅ | Has lifecycle |
| tags | ❌ | Missing |
| favorite | ❌ | Missing |

**Storage:** `NarrativeSchemaV2.journeys` (Record)

**Best Current Example:** Journey has the most complete metadata of existing types.

---

### 3. TopicHub

**Location:** `src/core/schema/narrative.ts` (line 98-133)

**Current Fields:**
```typescript
interface TopicHub {
  id: string;
  title: string;
  tags: string[];           // But for routing, not general tagging
  priority: number;
  enabled: boolean;
  path: string;
  primaryFile: string;
  supportingFiles: string[];
  maxBytes: number;
  expertFraming: string;
  keyPoints: string[];
  status: HubStatus;        // 'active' | 'draft' | 'archived'
  createdAt: string;
  updatedAt: string;
}
```

**Metadata Analysis:**
| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title | ✅ | |
| description | ❌ | Uses `expertFraming` |
| icon | ❌ | Missing |
| createdAt | ✅ | |
| updatedAt | ✅ | |
| createdBy | ❌ | Missing |
| status | ✅ | Three-state lifecycle |
| tags | ⚠️ | Present but for RAG routing |
| favorite | ❌ | Missing |

**Storage:** `NarrativeSchemaV2.hubs` (Record)

---

### 4. Card (Legacy Narrative Node)

**Location:** `src/core/schema/narrative.ts` (line 54-66)

**Current Fields:**
```typescript
interface Card {
  id: string;
  label: string;
  query: string;
  contextSnippet?: string;
  sectionId?: SectionId;
  next: string[];
  personas: string[];
  sourceDoc?: string;
  createdAt?: string;      // Optional!
  isEntry?: boolean;
}
```

**Metadata Analysis:**
| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title/label | ✅ | `label` |
| description | ❌ | Missing |
| icon | ❌ | Missing |
| createdAt | ⚠️ | Optional |
| updatedAt | ❌ | Missing |
| createdBy | ❌ | Missing |
| status | ❌ | Missing |
| tags | ❌ | Missing |
| favorite | ❌ | Missing |

**Storage:** `NarrativeSchemaV2.cards` (Record)

---

### 5. JourneyNode

**Location:** `src/core/schema/narrative.ts` (line 200-218)

**Current Fields:**
```typescript
interface JourneyNode {
  id: string;
  label: string;
  query: string;
  contextSnippet?: string;
  sectionId?: string;
  journeyId: string;       // Foreign key
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
}
```

**Metadata Analysis:**
| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title/label | ✅ | `label` |
| description | ❌ | Missing |
| icon | ❌ | Missing |
| createdAt | ❌ | Missing |
| updatedAt | ❌ | Missing |
| createdBy | ❌ | Missing |
| status | ❌ | Missing |
| tags | ❌ | Missing |
| favorite | ❌ | Missing |

**Storage:** `NarrativeSchemaV2.nodes` (Record)

---

### 6. QueuedSprout

**Location:** `src/core/schema/sprout-queue.ts` (line 45-58)

**Current Fields:**
```typescript
interface QueuedSprout {
  id: string;
  content: string;
  status: SproutQueueStatus;  // 'pending' | 'approved' | 'rejected' | 'flagged'
  captureContext: {
    userId: string;
    timestamp: string;
    lensId: string;
    journeyId?: string;
    sessionId: string;
  };
  moderation?: SproutModeration;
  targetCommons?: {
    category: string;
    tags: string[];
  };
}
```

**Metadata Analysis:**
| Field | Present | Notes |
|-------|---------|-------|
| id | ✅ | |
| title | ❌ | Uses `content` |
| description | ❌ | Missing |
| icon | ❌ | Missing |
| createdAt | ⚠️ | `captureContext.timestamp` |
| updatedAt | ❌ | Missing |
| createdBy | ⚠️ | `captureContext.userId` |
| status | ✅ | Four-state |
| tags | ⚠️ | In `targetCommons` |
| favorite | ❌ | Missing |

**Storage:** Separate queue system (API-based)

**Notes:** Sprout has the best provenance model (userId, sessionId, lensId, journeyId).

---

## Metadata Pattern Summary

| Type | id | title | desc | icon | created | updated | createdBy | status | tags | favorite |
|------|----|----|------|------|---------|---------|-----------|--------|------|----------|
| Persona | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Journey | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| TopicHub | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ | ❌ | ✅ | ⚠️ | ❌ |
| Card | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| JourneyNode | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sprout | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ✅ | ⚠️ | ❌ |

**Legend:** ✅ = Present | ⚠️ = Partial/Different field | ❌ = Missing

---

## Storage Patterns

| Type | Storage Location | Access Pattern |
|------|------------------|----------------|
| Persona | `NarrativeSchemaV2.personas` | NarrativeEngine context |
| Journey | `NarrativeSchemaV2.journeys` | NarrativeEngine context |
| TopicHub | `NarrativeSchemaV2.hubs` | NarrativeEngine context |
| Card | `NarrativeSchemaV2.cards` | NarrativeEngine context |
| JourneyNode | `NarrativeSchemaV2.nodes` | NarrativeEngine context |
| Sprout | API + queue system | useSproutQueue hook |

**Key Finding:** All schema-based types load through NarrativeEngine. Sprouts have separate API access.

---

## Current Card Components

| Component | Object Type | Location |
|-----------|-------------|----------|
| LensCard | Persona | `src/explore/LensPicker.tsx` |
| CustomLensCard | CustomLens | `src/explore/LensPicker.tsx` |
| JourneyCard | Journey | `src/explore/JourneyList.tsx` |
| LensGrid | Persona | `components/Terminal/LensGrid.tsx` |

**No generic GroveObjectCard exists.**

---

## Collection Infrastructure

### Filtering/Sorting
- **Exists:** `SproutQueueFilter` for sprout filtering
- **Missing:** Generic filter/sort for other types
- **Missing:** Unified collection hooks

### Search
- **Exists:** None across object types
- **Missing:** `useGroveObjectSearch` or similar

### Favorites
- **Exists:** None
- **Missing:** Entire feature

---

## Proposed GroveObject Base Type

Based on audit, recommend this base type:

```typescript
interface GroveObjectMeta {
  // Identity
  id: string;
  type: GroveObjectType;  // 'lens' | 'journey' | 'hub' | 'sprout' | 'node' | string
  
  // Display
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Provenance
  createdBy?: {
    type: 'human' | 'ai' | 'system';
    id?: string;
    context?: Record<string, string>;  // lensId, sessionId, etc.
  };
  
  // Lifecycle
  status?: 'active' | 'draft' | 'archived' | 'pending';
  enabled?: boolean;
  
  // Organization
  tags?: string[];
  favorite?: boolean;
}

interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;  // Type-specific data
}
```

---

## Migration Strategy Options

### Option A: Parallel System (Gradual)
Create GroveObject as new pattern. Existing types continue working. Migrate one at a time.

**Pro:** Low risk, incremental
**Con:** Two systems during transition

### Option B: Extension (Non-Breaking)
Existing types extend GroveObject. Add missing fields as optional.

**Pro:** Single system, backward compatible
**Con:** Existing types get bigger

### Option C: Wrapper (Runtime)
Create runtime wrapper that normalizes existing types to GroveObject interface.

**Pro:** No schema changes
**Con:** Adapter complexity

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema migration breaks existing data | Medium | High | Version field, backward compat |
| Performance with unified registry | Low | Medium | Lazy loading, pagination |
| Over-engineering for current needs | Medium | Medium | Start with 3-4 types, not all |
| UI complexity for generic card | Medium | Medium | Type-specific slots in generic wrapper |

---

## Recommended Approach

1. **Define GroveObjectMeta** as common metadata interface
2. **Extend Journey first** — it's closest to the target already
3. **Create GroveObjectCard** that renders any conforming type
4. **Add collection hooks** (useGroveObjects with filter/sort)
5. **Migrate other types incrementally** as they're touched

**Start simple:** Don't try to unify all 6 types in one sprint. Journey → Sprout → Persona → Hub is a natural order.

---

## DEX Compliance Check

For new Pattern 7 (Object Model):

| Pillar | Question | Answer |
|--------|----------|--------|
| Declarative Sovereignty | Can domain expert add new object type via config? | Goal of this sprint |
| Capability Agnosticism | Does it work regardless of model? | Yes, pure data schema |
| Provenance | Does every object track origin? | Yes, `createdBy` field |
| Organic Scalability | Does it grow without restructuring? | Yes, if `type` is extensible |

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/core/schema/grove-object.ts` | Create | Base type definitions |
| `src/core/schema/narrative.ts` | Modify | Extend existing types |
| `src/surface/components/GroveObjectCard.tsx` | Create | Generic renderer |
| `src/surface/hooks/useGroveObjects.ts` | Create | Collection operations |
| `PROJECT_PATTERNS.md` | Modify | Add Pattern 7 documentation |

---

## Audit Conclusion

**The gap is clear:** Grove has objects but no Object Model. Each type evolved independently with inconsistent metadata. Unifying them enables:

1. **Find anything** — Search across all object types
2. **Organize anything** — Tags, favorites, collections
3. **Extend infinitely** — New types via config
4. **AI creates things** — Standard schema for AI-generated objects

**Recommended scope for v1:**
- GroveObjectMeta type definition
- Journey extended with full metadata
- GroveObjectCard generic component
- useGroveObjects collection hook
- Pattern 7 documentation

---

*Audited by: Claude (Desktop)*  
*Sprint: grove-object-model-v1*
