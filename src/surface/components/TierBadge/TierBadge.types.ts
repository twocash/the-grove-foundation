// src/surface/components/TierBadge/TierBadge.types.ts
// Sprint: S4-SL-TierProgression - Tier badge type definitions

export type SproutTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';

export interface TierBadgeProps {
  tier: SproutTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  status?: 'pending' | 'active' | 'ready';
  tooltip?: string;
  className?: string;
}
