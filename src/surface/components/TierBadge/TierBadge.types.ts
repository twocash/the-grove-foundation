// src/surface/components/TierBadge/TierBadge.types.ts
// Sprint: S4-SL-TierProgression - Tier badge type definitions
// Sprint: S7-SL-AutoAdvancement v1 - Added advancement metadata

export type SproutTier = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';

/**
 * Advancement metadata for tooltip display
 * Sprint: S7-SL-AutoAdvancement v1
 */
export interface AdvancementMeta {
  /** Previous tier before advancement */
  fromTier: SproutTier;
  /** Timestamp of advancement */
  advancedAt: string;
  /** Type of advancement */
  advancementType: 'auto-advancement' | 'manual-override';
  /** Rule that triggered advancement (for auto) */
  ruleId?: string;
}

export interface TierBadgeProps {
  tier: SproutTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  status?: 'pending' | 'active' | 'ready';
  tooltip?: string;
  className?: string;
  /** Advancement metadata for rich tooltip - Sprint: S7-SL-AutoAdvancement v1 */
  advancementMeta?: AdvancementMeta;
  /** Show recent advancement indicator - Sprint: S7-SL-AutoAdvancement v1 */
  showAdvancementIndicator?: boolean;
}
