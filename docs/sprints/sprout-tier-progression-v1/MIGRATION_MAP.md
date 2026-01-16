# Migration Map: S4-SL-TierProgression

## Overview

This document provides a file-by-file change plan for implementing tier progression visibility.

**Total Files:** 9 (4 create, 5 modify)

---

## Phase 1: Schema Extension

### File: `src/core/schema/sprout.ts`

**Action:** MODIFY

**Change:** Add optional `promotedAt` field to Sprout interface

**Location:** After line 99 (after `stage` field)

```typescript
// BEFORE (line ~99-100):
  /** Growth stage in botanical lifecycle (sprout-declarative-v1) */
  stage: SproutStage;

// AFTER:
  /** Growth stage in botanical lifecycle (sprout-declarative-v1) */
  stage: SproutStage;

  /** ISO timestamp when promoted to 'established' (S4-SL-TierProgression) */
  promotedAt?: string;
```

**Verification:** TypeScript compiles, no migration needed (optional field)

---

## Phase 2: TierBadge Component (CREATE)

### File: `src/surface/components/TierBadge/TierBadge.types.ts`

**Action:** CREATE

```typescript
export type SproutTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';

export interface TierBadgeProps {
  tier: SproutTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  status?: 'pending' | 'active' | 'ready';
  tooltip?: string | TierTooltipContent;
  className?: string;
}

export interface TierTooltipContent {
  title: string;
  description: string;
  nextTier?: string;
  criteria?: string[];
}
```

### File: `src/surface/components/TierBadge/TierBadge.config.ts`

**Action:** CREATE

```typescript
import type { SproutTier } from './TierBadge.types';

export const TIER_CONFIG = {
  emoji: {
    seed: '🌰',
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳',
    grove: '🌲',
  } as Record<SproutTier, string>,

  sizes: {
    sm: { fontSize: '16px', gap: '4px', labelSize: '12px' },
    md: { fontSize: '20px', gap: '6px', labelSize: '14px' },
    lg: { fontSize: '24px', gap: '8px', labelSize: '16px' },
  },

  labels: {
    seed: 'Seed',
    sprout: 'Sprout',
    sapling: 'Sapling',
    tree: 'Tree',
    grove: 'Grove',
  } as Record<SproutTier, string>,
} as const;
```

### File: `src/surface/components/TierBadge/stageTierMap.ts`

**Action:** CREATE

```typescript
import type { SproutStage } from '@core/schema/sprout';
import type { SproutTier } from './TierBadge.types';

export const STAGE_TO_TIER: Record<SproutStage, SproutTier> = {
  tender: 'seed',
  rooting: 'seed',
  branching: 'sprout',
  hardened: 'sprout',
  grafted: 'sprout',
  established: 'sapling',
  dormant: 'sprout',
  withered: 'seed',
};

export function stageToTier(stage?: SproutStage): SproutTier {
  if (!stage) return 'sprout'; // Default for legacy sprouts
  return STAGE_TO_TIER[stage] ?? 'sprout';
}
```

### File: `src/surface/components/TierBadge/TierBadge.tsx`

**Action:** CREATE

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { TIER_CONFIG } from './TierBadge.config';
import type { TierBadgeProps } from './TierBadge.types';

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  status = 'ready',
  tooltip,
  className = '',
}) => {
  const emoji = TIER_CONFIG.emoji[tier];
  const label = TIER_CONFIG.labels[tier];
  const sizeConfig = TIER_CONFIG.sizes[size];

  const statusStyles = {
    pending: 'opacity-40 grayscale',
    active: 'animate-pulse',
    ready: '',
  };

  const tooltipText = typeof tooltip === 'string'
    ? tooltip
    : tooltip?.title ?? `${label} tier`;

  return (
    <motion.span
      className={`inline-flex items-center ${statusStyles[status]} ${className}`}
      style={{ gap: sizeConfig.gap }}
      title={tooltipText}
      initial={false}
      whileHover={{ scale: 1.05 }}
    >
      <span
        role="img"
        aria-label={`${label} tier`}
        style={{ fontSize: sizeConfig.fontSize }}
      >
        {emoji}
      </span>
      {showLabel && (
        <span
          className="font-sans text-[var(--glass-text-secondary)]"
          style={{ fontSize: sizeConfig.labelSize }}
        >
          {label}
        </span>
      )}
    </motion.span>
  );
};
```

### File: `src/surface/components/TierBadge/index.ts`

**Action:** CREATE

```typescript
export { TierBadge } from './TierBadge';
export { stageToTier, STAGE_TO_TIER } from './stageTierMap';
export { TIER_CONFIG } from './TierBadge.config';
export type { TierBadgeProps, SproutTier, TierTooltipContent } from './TierBadge.types';
```

---

## Phase 3: Promotion Wiring

### File: `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx`

**Action:** MODIFY

**Location:** Lines 47-68 (`handlePromote` function)

```typescript
// BEFORE (lines 47-68):
const handlePromote = async (content: string, selectedItems: string[]) => {
  try {
    const response = await fetch('/api/knowledge/upload', {...});
    if (!response.ok) throw new Error('Upload failed');

    emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
    toast.success('Content promoted to Knowledge Commons');
  } catch (error) {
    toast.error('Failed to promote content');
  }
};

// AFTER:
const handlePromote = async (content: string, selectedItems: string[]) => {
  try {
    const response = await fetch('/api/knowledge/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: sprout.query,
        content,
        tier: 2,
        sourceType: 'sprout',
        sourceUrl: `sprout://${sprout.id}`,
      }),
    });

    if (!response.ok) throw new Error('Upload failed');

    // S4-SL-TierProgression: Update stage to 'established' with timestamp
    try {
      updateSprout(sprout.id, {
        stage: 'established',
        promotedAt: new Date().toISOString(),
      });
    } catch (stageError) {
      // Content saved but stage update failed - warn but don't fail
      toast.warning('Content saved, but tier update failed. Please try again.');
      console.error('Stage update failed:', stageError);
    }

    emit.custom('sproutPromotedToRag', { sproutId: sprout.id, selectedItems });
    toast.success('Promoted to Sapling! Added to Knowledge Commons.');

    // Notify parent of update
    if (onSproutUpdate) {
      const updated = getSprout(sprout.id);
      if (updated) onSproutUpdate(updated);
    }
  } catch (error) {
    toast.error('Failed to promote content');
  }
};
```

---

## Phase 4: Header Integration

### File: `src/surface/components/modals/SproutFinishingRoom/FinishingRoomHeader.tsx`

**Action:** MODIFY

**Imports to add (line ~5):**
```typescript
import { TierBadge, stageToTier } from '@surface/components/TierBadge';
```

**Replace static emoji (lines 35-37):**
```typescript
// BEFORE:
<span className="text-xl" role="img" aria-label="Sprout">
  🌱
</span>

// AFTER:
<TierBadge
  tier={stageToTier(sprout.stage)}
  size="lg"
  showLabel={false}
  tooltip={`Current tier: ${stageToTier(sprout.stage)}`}
/>
```

---

## Phase 5: GardenTray Integration

### File: `src/explore/components/GardenTray/SproutRow.tsx`

**Action:** MODIFY

**Imports to add:**
```typescript
import { TierBadge, stageToTier } from '@surface/components/TierBadge';
```

**Add TierBadge before chevron icon (in row content):**
```typescript
// Add after title, before chevron:
<TierBadge
  tier={stageToTier(sprout.stage)}
  size="sm"
  className="ml-auto mr-2 flex-shrink-0"
/>
```

**Note:** Exact location depends on current SproutRow structure. Position badge right side of row.

---

## Phase 6: Provenance Enhancement

### File: `src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx`

**Action:** MODIFY

**Add Lifecycle section after existing provenance:**
```typescript
{/* Lifecycle Section */}
<div className="border-t border-ink/10 dark:border-white/10 pt-3 mt-3">
  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-paper/60 mb-2">
    Lifecycle
  </h4>
  <div className="flex items-center gap-2">
    <TierBadge tier={stageToTier(sprout.stage)} size="md" showLabel />
  </div>
  {sprout.promotedAt && (
    <p className="text-xs text-ink-muted dark:text-paper/50 mt-1">
      Promoted {new Date(sprout.promotedAt).toLocaleDateString()}
    </p>
  )}
</div>
```

---

## Execution Order

| Order | Phase | Files | Estimated Time |
|-------|-------|-------|----------------|
| 1 | Schema | sprout.ts | 15 min |
| 2 | Component | TierBadge/* (4 files) | 1 hour |
| 3 | Wiring | ActionPanel.tsx | 30 min |
| 4 | Header | FinishingRoomHeader.tsx | 20 min |
| 5 | Tray | SproutRow.tsx | 30 min |
| 6 | Provenance | ProvenancePanel.tsx | 20 min |

**Total Estimated:** ~3 hours implementation

---

## Rollback Plan

If issues arise:

1. **Revert component additions:** Delete `src/surface/components/TierBadge/`
2. **Revert file changes:** Git revert affected files
3. **No schema rollback needed:** `promotedAt` is optional field

---

## Verification Checklist

- [ ] TypeScript compiles without errors
- [ ] TierBadge renders all 5 tiers correctly
- [ ] Promotion updates stage to 'established'
- [ ] Promotion sets promotedAt timestamp
- [ ] Header shows dynamic tier badge
- [ ] GardenTray rows show tier badges
- [ ] Provenance panel shows lifecycle section
- [ ] E2E tests pass

---

*Migration Map created by Foundation Loop v2*
