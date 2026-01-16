// src/surface/components/TierBadge/TierBadge.config.ts
// Sprint: S4-SL-TierProgression - Tier badge configuration (Declarative Sovereignty)
// Sprint: S5-SL-LifecycleEngine v1 - Dynamic config from Supabase

import type { SproutTier } from './TierBadge.types';

/**
 * Static fallback configuration.
 * Used when lifecycle config is not available or as default values.
 * Sprint: S5-SL-LifecycleEngine v1 - Kept as fallback, dynamic config preferred
 */
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
