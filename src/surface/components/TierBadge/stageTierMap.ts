// src/surface/components/TierBadge/stageTierMap.ts
// Sprint: S4-SL-TierProgression - Map botanical stages to user-facing tiers
// Sprint: S5-SL-LifecycleEngine v1 - Dynamic mappings from Supabase config

import { useMemo, useCallback } from 'react';
import type { SproutStage } from '@core/schema/sprout';
import type { ResearchSproutStatus } from '@core/schema/research-sprout';
import type { SproutTier } from './TierBadge.types';
import { useLifecycleConfig } from '../../hooks/useLifecycleConfig';

/**
 * Static fallback: Maps the 8 botanical lifecycle stages to 5 user-facing tiers.
 * Sprint: S5-SL-LifecycleEngine v1 - Kept as fallback, dynamic config preferred
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
 *
 * Note: This is a static function using hardcoded mappings.
 * For dynamic mappings from lifecycle config, use useStageTierMapping hook.
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

// =============================================================================
// Dynamic Mapping Hook (S5-SL-LifecycleEngine v1)
// =============================================================================

export interface UseStageTierMappingResult {
  /** Convert stage to tier using lifecycle config (with fallback) */
  stageToTier: (stage?: SproutStage) => SproutTier;
  /** Convert status to tier (static, no config dependency) */
  statusToTier: (status?: ResearchSproutStatus) => SproutTier;
  /** Whether mappings are from lifecycle config (vs fallback) */
  usingConfig: boolean;
  /** Whether config is loading */
  loading: boolean;
}

/**
 * Hook for dynamic stage-to-tier mapping from lifecycle config.
 *
 * Uses mappings from the active lifecycle model in Supabase.
 * Falls back to static STAGE_TO_TIER when config unavailable.
 *
 * @example
 * ```tsx
 * const { stageToTier, loading } = useStageTierMapping();
 * const tier = stageToTier(sprout.stage);
 * ```
 */
export function useStageTierMapping(): UseStageTierMappingResult {
  const { getTierForStage, usingFallback, loading } = useLifecycleConfig();

  // Build dynamic stageToTier function
  const dynamicStageToTier = useCallback(
    (stage?: SproutStage): SproutTier => {
      if (!stage) return 'sprout';

      // Get tier from lifecycle config
      const tierDef = getTierForStage(stage);

      // Return tier ID, cast to SproutTier (ID matches tier type)
      return tierDef.id as SproutTier;
    },
    [getTierForStage]
  );

  // statusToTier is static (no lifecycle config for ResearchSproutStatus)
  const staticStatusToTier = useMemo(
    () => (status?: ResearchSproutStatus): SproutTier => {
      if (!status) return 'sprout';
      return STATUS_TO_TIER[status] ?? 'sprout';
    },
    []
  );

  return {
    stageToTier: dynamicStageToTier,
    statusToTier: staticStatusToTier,
    usingConfig: !usingFallback,
    loading,
  };
}
