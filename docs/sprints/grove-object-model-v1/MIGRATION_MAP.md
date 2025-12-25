# Migration Map: Grove Object Model v1

**Sprint:** grove-object-model-v1  
**Estimated Changes:** ~400 lines across 8 files

---

## File Change Summary

| File | Action | Lines | Purpose |
|------|--------|-------|---------|
| `src/core/schema/grove-object.ts` | CREATE | ~80 | Base type definitions |
| `src/core/schema/narrative.ts` | MODIFY | ~30 | Journey extends GroveObjectMeta |
| `src/surface/components/GroveObjectCard/index.tsx` | CREATE | ~60 | Main card component |
| `src/surface/components/GroveObjectCard/CardShell.tsx` | CREATE | ~50 | Styling wrapper |
| `src/surface/components/GroveObjectCard/JourneyContent.tsx` | CREATE | ~40 | Journey-specific content |
| `src/surface/components/GroveObjectCard/GenericContent.tsx` | CREATE | ~30 | Fallback content |
| `src/surface/hooks/useGroveObjects.ts` | CREATE | ~80 | Collection hook |
| `src/lib/storage/user-preferences.ts` | CREATE | ~40 | Favorites storage |
| `PROJECT_PATTERNS.md` | MODIFY | ~40 | Pattern 7 documentation |

---

## Migration Order

```
1. grove-object.ts (types first)
       ↓
2. narrative.ts (extend Journey)
       ↓
3. user-preferences.ts (favorites storage)
       ↓
4. useGroveObjects.ts (collection hook)
       ↓
5. CardShell.tsx (styling wrapper)
       ↓
6. JourneyContent.tsx + GenericContent.tsx (content renderers)
       ↓
7. GroveObjectCard/index.tsx (main component)
       ↓
8. PROJECT_PATTERNS.md (documentation)
```

---

## 1. CREATE: grove-object.ts

**Path:** `src/core/schema/grove-object.ts`

```typescript
// src/core/schema/grove-object.ts
// Grove Object Model - Pattern 7
// Base types for unified object identity across Grove

/**
 * Recognized Grove object types.
 * Known types get autocomplete; string allows custom types.
 */
export type GroveObjectType =
  | 'lens'
  | 'journey'
  | 'hub'
  | 'sprout'
  | 'node'
  | 'card'
  | string;

/**
 * Object lifecycle states.
 */
export type GroveObjectStatus = 'active' | 'draft' | 'archived' | 'pending';

/**
 * Provenance record tracking object origin.
 */
export interface GroveObjectProvenance {
  /** Who/what created this object */
  type: 'human' | 'ai' | 'system' | 'import';
  
  /** Identifier of the creator (user ID, model ID, etc.) */
  actorId?: string;
  
  /** Context at creation time */
  context?: {
    lensId?: string;
    journeyId?: string;
    sessionId?: string;
    sourceFile?: string;
  };
}

/**
 * Common metadata shared by all Grove objects.
 * 
 * Enables unified operations:
 * - Find/filter by any field
 * - Sort by date, title, type
 * - Mark as favorite
 * - Track provenance
 * 
 * @see Pattern 7: Object Model in PROJECT_PATTERNS.md
 */
export interface GroveObjectMeta {
  // Identity
  id: string;
  type: GroveObjectType;
  
  // Display
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // Timestamps (ISO 8601)
  createdAt: string;
  updatedAt: string;
  
  // Provenance
  createdBy?: GroveObjectProvenance;
  
  // Lifecycle
  status?: GroveObjectStatus;
  
  // Organization
  tags?: string[];
  favorite?: boolean;
}

/**
 * A complete Grove object: metadata + type-specific payload.
 * 
 * @template T - The type-specific payload interface
 */
export interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}

/**
 * Type guard: Check if object has GroveObjectMeta fields
 */
export function isGroveObjectMeta(obj: unknown): obj is GroveObjectMeta {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    typeof o.title === 'string'
  );
}
```

---

## 2. MODIFY: narrative.ts

**Path:** `src/core/schema/narrative.ts`

**Changes:**
1. Import GroveObjectMeta
2. Extend Journey interface
3. Add missing fields to Journey

**Find this section (~line 166):**
```typescript
export interface Journey {
  id: string;
  title: string;
  description: string;
  // ...
}
```

**Replace with:**
```typescript
import { GroveObjectMeta, GroveObjectProvenance } from './grove-object';

// ... (existing code)

/**
 * Journey - A narrative container that links cards to a knowledge hub
 * 
 * Extended in v1.0 to implement GroveObjectMeta (Pattern 7: Object Model)
 */
export interface Journey extends Omit<GroveObjectMeta, 'type'> {
  // Type narrowed to literal
  type: 'journey';
  
  // Entry point into the journey
  entryNode: string;
  
  // Target "Aha" moment
  targetAha: string;
  
  // Link to knowledge hub
  linkedHubId?: string;
  
  // Journey metrics
  estimatedMinutes: number;
}
```

**Note:** Use `Omit<GroveObjectMeta, 'type'>` to allow narrowing `type` to `'journey'`.

---

## 3. CREATE: user-preferences.ts

**Path:** `src/lib/storage/user-preferences.ts`

```typescript
// src/lib/storage/user-preferences.ts
// User-local preferences storage (Pattern 7: Object Model)

const STORAGE_PREFIX = 'grove:';
const FAVORITES_KEY = `${STORAGE_PREFIX}favorites`;
const TAGS_KEY = `${STORAGE_PREFIX}user-tags`;
const MAX_FAVORITES = 1000;

/**
 * Get all favorited object IDs
 */
export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Check if an object is favorited
 */
export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

/**
 * Set favorite status for an object
 */
export function setFavorite(id: string, favorite: boolean): void {
  if (typeof window === 'undefined') return;
  
  const favorites = getFavorites();
  
  if (favorite && !favorites.includes(id)) {
    const updated = [id, ...favorites].slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } else if (!favorite && favorites.includes(id)) {
    const updated = favorites.filter(f => f !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  }
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(id: string): boolean {
  const current = isFavorite(id);
  setFavorite(id, !current);
  return !current;
}

/**
 * Get user-defined tags for an object
 */
export function getUserTags(id: string): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TAGS_KEY);
  const allTags: Record<string, string[]> = stored ? JSON.parse(stored) : {};
  return allTags[id] ?? [];
}

/**
 * Set user-defined tags for an object
 */
export function setUserTags(id: string, tags: string[]): void {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(TAGS_KEY);
  const allTags: Record<string, string[]> = stored ? JSON.parse(stored) : {};
  allTags[id] = tags;
  localStorage.setItem(TAGS_KEY, JSON.stringify(allTags));
}
```

---

## 4. CREATE: useGroveObjects.ts

**Path:** `src/surface/hooks/useGroveObjects.ts`

```typescript
// src/surface/hooks/useGroveObjects.ts
// Collection hook for Grove objects (Pattern 7: Object Model)

import { useMemo, useCallback } from 'react';
import { useNarrativeEngine } from '@core/NarrativeEngine';
import { GroveObject, GroveObjectMeta, GroveObjectType } from '@core/schema/grove-object';
import { Journey } from '@core/schema/narrative';
import { getFavorites, setFavorite as storeFavorite, isFavorite } from '@lib/storage/user-preferences';

// ============================================================================
// TYPES
// ============================================================================

export interface UseGroveObjectsOptions {
  types?: GroveObjectType[];
  status?: ('active' | 'draft' | 'archived')[];
  tags?: string[];
  favorite?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface UseGroveObjectsResult {
  objects: GroveObject[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setFavorite: (id: string, favorite: boolean) => void;
  isFavorite: (id: string) => boolean;
}

// ============================================================================
// NORMALIZERS
// ============================================================================

function normalizeJourney(journey: Journey): GroveObject<Journey> {
  return {
    meta: {
      id: journey.id,
      type: 'journey',
      title: journey.title,
      description: journey.description,
      icon: journey.icon,
      color: journey.color,
      createdAt: journey.createdAt,
      updatedAt: journey.updatedAt,
      status: journey.status,
      tags: journey.tags,
      favorite: isFavorite(journey.id),
    },
    payload: journey,
  };
}

// Future: normalizeHub, normalizeSprout, etc.

// ============================================================================
// HOOK
// ============================================================================

export function useGroveObjects(options: UseGroveObjectsOptions = {}): UseGroveObjectsResult {
  const { journeys, loading, error } = useNarrativeEngine();
  
  const {
    types,
    status,
    tags,
    favorite,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;
  
  // Normalize all objects
  const allObjects = useMemo(() => {
    const result: GroveObject[] = [];
    
    // Add journeys (if type filter allows)
    if (!types || types.includes('journey')) {
      Object.values(journeys ?? {}).forEach(j => {
        result.push(normalizeJourney(j));
      });
    }
    
    // Future: Add hubs, sprouts, etc.
    
    return result;
  }, [journeys, types]);
  
  // Apply filters
  const filteredObjects = useMemo(() => {
    let result = allObjects;
    
    if (status?.length) {
      result = result.filter(o => o.meta.status && status.includes(o.meta.status));
    }
    
    if (tags?.length) {
      result = result.filter(o => 
        o.meta.tags?.some(t => tags.includes(t))
      );
    }
    
    if (favorite !== undefined) {
      result = result.filter(o => o.meta.favorite === favorite);
    }
    
    return result;
  }, [allObjects, status, tags, favorite]);
  
  // Sort
  const sortedObjects = useMemo(() => {
    const sorted = [...filteredObjects];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'title') {
        comparison = a.meta.title.localeCompare(b.meta.title);
      } else {
        const aDate = a.meta[sortBy] ?? '';
        const bDate = b.meta[sortBy] ?? '';
        comparison = aDate.localeCompare(bDate);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [filteredObjects, sortBy, sortOrder]);
  
  // Actions
  const handleSetFavorite = useCallback((id: string, fav: boolean) => {
    storeFavorite(id, fav);
    // Note: This doesn't trigger re-render. 
    // For reactivity, would need state or context.
  }, []);
  
  return {
    objects: sortedObjects,
    loading,
    error: error ?? null,
    setFavorite: handleSetFavorite,
    isFavorite,
  };
}
```

---

## 5. CREATE: CardShell.tsx

**Path:** `src/surface/components/GroveObjectCard/CardShell.tsx`

```typescript
// src/surface/components/GroveObjectCard/CardShell.tsx
// Styling wrapper using --card-* tokens (Sprint 6)

import React from 'react';
import { cn } from '@/lib/utils';
import { GroveObjectMeta } from '@core/schema/grove-object';
import { Star } from 'lucide-react';

interface CardShellProps {
  meta: GroveObjectMeta;
  isActive?: boolean;
  isInspected?: boolean;
  onFavorite?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function CardShell({
  meta,
  isActive,
  isInspected,
  onFavorite,
  onClick,
  children,
  className,
}: CardShellProps) {
  return (
    <article
      role="article"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 transition-all cursor-pointer",
        // Visual State Matrix (Sprint 6 tokens)
        isInspected
          ? "ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]"
          : isActive
            ? "bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1 ring-[var(--card-ring-active)]"
            : "border-[var(--card-border-default)] hover:border-primary/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {meta.icon && (
            <span className="text-muted-foreground">{meta.icon}</span>
          )}
          <h3 className="font-medium text-foreground">{meta.title}</h3>
        </div>
        
        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className="p-1 hover:bg-muted rounded"
          >
            <Star
              className={cn(
                "w-4 h-4",
                meta.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )}
            />
          </button>
        )}
      </div>
      
      {/* Content */}
      {children}
      
      {/* Footer: Status + Tags */}
      {(meta.status || meta.tags?.length) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
          {meta.status && meta.status !== 'active' && (
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {meta.status}
            </span>
          )}
          {meta.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
```

---

## 6. CREATE: Content Renderers

**Path:** `src/surface/components/GroveObjectCard/JourneyContent.tsx`

```typescript
// src/surface/components/GroveObjectCard/JourneyContent.tsx

import React from 'react';
import { Journey } from '@core/schema/narrative';
import { Clock, Target } from 'lucide-react';

interface JourneyContentProps {
  journey: Journey;
}

export function JourneyContent({ journey }: JourneyContentProps) {
  return (
    <div className="space-y-2">
      {journey.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {journey.description}
        </p>
      )}
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {journey.estimatedMinutes} min
        </span>
        
        {journey.targetAha && (
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{journey.targetAha}</span>
          </span>
        )}
      </div>
    </div>
  );
}
```

**Path:** `src/surface/components/GroveObjectCard/GenericContent.tsx`

```typescript
// src/surface/components/GroveObjectCard/GenericContent.tsx

import React from 'react';
import { GroveObjectMeta } from '@core/schema/grove-object';

interface GenericContentProps {
  meta: GroveObjectMeta;
}

export function GenericContent({ meta }: GenericContentProps) {
  return (
    <div className="space-y-2">
      {meta.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {meta.description}
        </p>
      )}
      
      <div className="text-xs text-muted-foreground">
        Type: {meta.type}
      </div>
    </div>
  );
}
```

---

## 7. CREATE: GroveObjectCard/index.tsx

**Path:** `src/surface/components/GroveObjectCard/index.tsx`

```typescript
// src/surface/components/GroveObjectCard/index.tsx
// Generic card renderer for Grove objects (Pattern 7: Object Model)

import React from 'react';
import { GroveObject } from '@core/schema/grove-object';
import { Journey } from '@core/schema/narrative';
import { CardShell } from './CardShell';
import { JourneyContent } from './JourneyContent';
import { GenericContent } from './GenericContent';

// ============================================================================
// CONTENT RENDERER REGISTRY
// ============================================================================

type ContentRenderer<T = unknown> = React.ComponentType<{ object: GroveObject<T> }>;

const CONTENT_RENDERERS: Record<string, ContentRenderer<any>> = {
  journey: ({ object }) => <JourneyContent journey={object.payload as Journey} />,
  // Future: hub, sprout, lens, etc.
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface GroveObjectCardProps {
  object: GroveObject;
  isActive?: boolean;
  isInspected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
  onFavorite?: () => void;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export function GroveObjectCard({
  object,
  isActive,
  isInspected,
  onSelect,
  onFavorite,
  variant = 'full',
  className,
}: GroveObjectCardProps) {
  const ContentRenderer = CONTENT_RENDERERS[object.meta.type];
  
  return (
    <CardShell
      meta={object.meta}
      isActive={isActive}
      isInspected={isInspected}
      onClick={onSelect}
      onFavorite={onFavorite}
      className={className}
    >
      {ContentRenderer ? (
        <ContentRenderer object={object} />
      ) : (
        <GenericContent meta={object.meta} />
      )}
    </CardShell>
  );
}

// Re-export for convenience
export { CardShell } from './CardShell';
export type { GroveObjectCardProps };
```

---

## 8. MODIFY: PROJECT_PATTERNS.md

**Add Pattern 7 section:**

```markdown
### Pattern 7: Object Model (Sprint: grove-object-model-v1)

**Need:** Unified identity and operations across all Grove content types.

**Philosophy:** Every thing in Grove is a GroveObject. Whether human-created or AI-generated, system-defined or user-customized, all objects share common identity and can be operated on uniformly.

**Use:** GroveObjectMeta interface + GroveObjectCard component + useGroveObjects hook

**Files:**
- `src/core/schema/grove-object.ts` → Type definitions
- `src/surface/components/GroveObjectCard/` → Generic renderer
- `src/surface/hooks/useGroveObjects.ts` → Collection operations
- `src/lib/storage/user-preferences.ts` → Favorites storage

**Extend by:**
1. Have new types implement GroveObjectMeta (flat extension)
2. Add type-specific content renderer to CONTENT_RENDERERS
3. Add normalizer function in useGroveObjects

**GroveObjectMeta fields:**
- id, type, title, description, icon, color
- createdAt, updatedAt
- createdBy (provenance)
- status, tags, favorite

**Visual States:** Uses `--card-*` tokens from Pattern 4.

**DO NOT:**
- ❌ Create object types without GroveObjectMeta
- ❌ Build type-specific cards that don't use GroveObjectCard
- ❌ Store metadata in different structures per type
- ❌ Implement favorites outside user-preferences.ts
```

---

## Verification Checklist

After migration:

- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
- [ ] Journey objects load in useGroveObjects
- [ ] GroveObjectCard renders journey
- [ ] Favorites persist across refresh
- [ ] Visual states (inspected, active) work
- [ ] Pattern 7 documented

---

*Migration map complete. Execute in order, verify at each step.*
