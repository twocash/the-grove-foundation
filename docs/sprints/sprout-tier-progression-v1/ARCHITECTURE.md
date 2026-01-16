# Architecture: S4-SL-TierProgression

## Target State

After this sprint, the Grove codebase will have:

1. A reusable `TierBadge` component for displaying botanical lifecycle tiers
2. Visible tier indicators on sprout cards throughout the UI
3. Functional promotion that updates both RAG and sprout stage
4. Complete provenance chain including promotion timestamp

---

## Component Architecture

### New Component: TierBadge

```
src/surface/components/TierBadge/
├── TierBadge.tsx           # Main component
├── TierBadge.config.ts     # Emoji/color/size configuration
├── TierBadge.types.ts      # TypeScript interfaces
└── index.ts                # Barrel export
```

### Component API

```typescript
// TierBadge.types.ts
export type SproutTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';

export interface TierBadgeProps {
  /** The botanical tier to display */
  tier: SproutTier;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Show tier label text */
  showLabel?: boolean;

  /** Processing state affects opacity/animation */
  status?: 'pending' | 'active' | 'ready';

  /** Tooltip configuration */
  tooltip?: string | TierTooltipContent;

  /** Additional CSS classes */
  className?: string;
}

export interface TierTooltipContent {
  title: string;
  description: string;
  nextTier?: string;
  criteria?: string[];
}
```

### Configuration (Declarative)

```typescript
// TierBadge.config.ts
export const TIER_CONFIG = {
  emoji: {
    seed: '🌰',
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳',
    grove: '🌲',
  },

  sizes: {
    sm: { fontSize: '16px', gap: '4px' },
    md: { fontSize: '20px', gap: '6px' },
    lg: { fontSize: '24px', gap: '8px' },
  },

  colors: {
    seed: 'var(--card-border-default)',
    sprout: 'var(--neon-green)',
    sapling: 'var(--neon-cyan)',
    tree: 'var(--card-ring-violet)',
    grove: 'var(--grove-forest)',
  },

  labels: {
    seed: 'Seed',
    sprout: 'Sprout',
    sapling: 'Sapling',
    tree: 'Tree',
    grove: 'Grove',
  },
} as const;
```

---

## Data Flow

### Stage → Tier Mapping

```
Sprout.stage (8 values)        →     SproutTier (5 values)
─────────────────────────────────────────────────────────
tender                         →     seed
rooting                        →     seed
branching                      →     sprout
hardened                       →     sprout (default)
grafted                        →     sprout
established                    →     sapling
dormant                        →     (preserved)
withered                       →     seed
```

**Implementation:**

```typescript
// src/surface/components/TierBadge/stageTierMap.ts
import type { SproutStage } from '@core/schema/sprout';
import type { SproutTier } from './TierBadge.types';

export const STAGE_TO_TIER: Record<SproutStage, SproutTier> = {
  tender: 'seed',
  rooting: 'seed',
  branching: 'sprout',
  hardened: 'sprout',
  grafted: 'sprout',
  established: 'sapling',
  dormant: 'sprout',  // Preserve last active tier
  withered: 'seed',
};

export function stageToTier(stage: SproutStage): SproutTier {
  return STAGE_TO_TIER[stage] ?? 'sprout';
}
```

---

## Integration Points

### 1. GardenTray / SproutRow

```
Current:
┌─────────────────────────────────────────────────────┐
│ [Status] Title...                              [>]  │
└─────────────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────────────┐
│ [Status] Title...                    [TierBadge][>] │
└─────────────────────────────────────────────────────┘
```

**File:** `src/explore/components/GardenTray/SproutRow.tsx`

**Change:**
```tsx
import { TierBadge, stageToTier } from '@surface/components/TierBadge';

// In render:
<TierBadge
  tier={stageToTier(sprout.stage)}
  size="sm"
  className="ml-auto mr-2"
/>
```

### 2. FinishingRoomHeader

```
Current:
┌─────────────────────────────────────────────────────┐
│ [🌱] SPROUT FINISHING ROOM | Title...      [Close] │
└─────────────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────────────┐
│ [TierBadge lg] SPROUT FINISHING ROOM | Title [Close]│
└─────────────────────────────────────────────────────┘
```

**File:** `src/surface/components/modals/SproutFinishingRoom/FinishingRoomHeader.tsx`

**Change:**
```tsx
import { TierBadge, stageToTier } from '@surface/components/TierBadge';

// Replace static emoji:
<TierBadge
  tier={stageToTier(sprout.stage)}
  size="lg"
  showLabel={false}
/>
```

### 3. ProvenancePanel (Tier Section)

**File:** `src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx`

**Addition:** New collapsible "Lifecycle" section showing:
- Current tier with badge
- promotedAt timestamp (if applicable)
- Stage history (collapsed by default)

---

## Schema Extension

### Sprout Interface Addition

```typescript
// src/core/schema/sprout.ts
export interface Sprout {
  // ... existing fields ...

  /** Growth stage in botanical lifecycle */
  stage: SproutStage;

  /** ISO timestamp when promoted to 'established' (added S4) */
  promotedAt?: string;  // ← NEW FIELD

  // ... rest of interface ...
}
```

**Note:** Optional field, no migration required. Existing sprouts simply won't have this field.

---

## Promotion Flow

### Current Flow (Broken)

```
User clicks "Add to Field"
         │
         ▼
POST /api/knowledge/upload
         │
         ▼ (success)
emit('sproutPromotedToRag')
         │
         ▼
toast.success()
         │
         ▼
❌ Stage NOT updated (BUG)
```

### Fixed Flow

```
User clicks "Add to Field"
         │
         ▼
POST /api/knowledge/upload
         │
         ├──────────────────────────────┐
         │ (success)                    │ (failure)
         ▼                              ▼
updateSprout({                    toast.error()
  stage: 'established',
  promotedAt: new Date().toISOString()
})
         │
         ▼
emit('sproutPromotedToRag')
         │
         ▼
toast.success()
         │
         ▼
onSproutUpdate(updated)
         │
         ▼
UI reflects new tier (sapling)
```

---

## Animation Specification

### Tier Change Animation

When tier changes (e.g., sprout → sapling):

1. **Glow pulse** - 300ms animation
2. **Color transition** - Smooth color shift
3. **Scale bump** - Brief 1.05x scale

```css
@keyframes tier-advance {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.2); }
  100% { transform: scale(1); filter: brightness(1); }
}

.tier-badge--advancing {
  animation: tier-advance 300ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .tier-badge--advancing {
    animation: none;
  }
}
```

---

## Accessibility

### ARIA Labels

```tsx
<span
  role="img"
  aria-label={`${tier} tier`}
  title={tooltip}
>
  {emoji}
</span>
```

### Keyboard Navigation

- Tooltip accessible via focus
- No keyboard interaction on badge itself (display only)

### Color Independence

- Tier is indicated by emoji shape, not just color
- Status (pending/active) uses opacity, not color alone

---

## File Organization

### Files to Create

```
src/surface/components/TierBadge/
├── TierBadge.tsx
├── TierBadge.config.ts
├── TierBadge.types.ts
├── stageTierMap.ts
└── index.ts
```

### Files to Modify

```
src/core/schema/sprout.ts                    # Add promotedAt
src/surface/components/modals/SproutFinishingRoom/
├── ActionPanel.tsx                          # Fix handlePromote
├── FinishingRoomHeader.tsx                  # Use TierBadge
└── ProvenancePanel.tsx                      # Add tier section
src/explore/components/GardenTray/
└── SproutRow.tsx                            # Add TierBadge
```

---

## DEX Alignment

### Declarative Sovereignty

Configuration (TIER_CONFIG) defines:
- Emoji per tier
- Size variants
- Color tokens
- Label text

No hardcoded tier behavior in component logic.

### Capability Agnosticism

TierBadge displays state, not model capability:
- Works identically for Claude/Gemini/local model content
- Tier is based on user actions, not generation source

### Provenance as Infrastructure

- `promotedAt` timestamp captures promotion moment
- Stage history traceable in storage
- Sprout → Sapling transition is auditable

### Organic Scalability

- 5-tier system designed for future growth
- Future phases add tiers (tree, grove) without restructuring
- Component API includes future extension points

---

*Architecture document created by Foundation Loop v2*
*Sprint: S4-SL-TierProgression*
