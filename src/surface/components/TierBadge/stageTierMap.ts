// src/surface/components/TierBadge/stageTierMap.ts
// Sprint: S4-SL-TierProgression - Map botanical stages to user-facing tiers

import type { SproutStage } from '@core/schema/sprout';
import type { ResearchSproutStatus } from '@core/schema/research-sprout';
import type { SproutTier } from './TierBadge.types';

/**
 * Maps the 8 botanical lifecycle stages to 5 user-facing tiers.
 *
 * Stage (internal botanical lifecycle) → Tier (user-visible progression)
 */
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

/**
 * Maps ResearchSprout status to user-facing tiers.
 * Used for GardenTray where sprouts are ResearchSprout type.
 */
export const STATUS_TO_TIER: Record<ResearchSproutStatus, SproutTier> = {
  pending: 'seed',
  active: 'sprout',
  paused: 'sprout',
  blocked: 'seed',
  completed: 'sapling',
  archived: 'sprout',
};

/**
 * Convert a SproutStage to its corresponding SproutTier.
 * Returns 'sprout' as safe default for undefined/unknown stages.
 */
export function stageToTier(stage?: SproutStage): SproutTier {
  if (!stage) return 'sprout';
  return STAGE_TO_TIER[stage] ?? 'sprout';
}

/**
 * Convert a ResearchSproutStatus to its corresponding SproutTier.
 * Returns 'sprout' as safe default for undefined/unknown status.
 */
export function statusToTier(status?: ResearchSproutStatus): SproutTier {
  if (!status) return 'sprout';
  return STATUS_TO_TIER[status] ?? 'sprout';
}
