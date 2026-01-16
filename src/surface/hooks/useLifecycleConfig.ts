// src/surface/hooks/useLifecycleConfig.ts
// Consumer hook for lifecycle configuration in Surface components
// Sprint: S5-SL-LifecycleEngine v1
//
// DEX: Capability Agnosticism - components read config, not implementation details
// DEX: Declarative Sovereignty - tier labels/emojis configurable without code deploy

import { useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { SproutStage } from '@core/schema/sprout';
import type {
  LifecycleConfigPayload,
  LifecycleModel,
  TierDefinition,
} from '@core/schema/lifecycle-config';
import {
  FALLBACK_TIER_CONFIG,
  FALLBACK_STAGE_TO_TIER,
  getActiveModel,
  getTierForStageFromModel,
} from '@core/schema/lifecycle-config';

// =============================================================================
// Types
// =============================================================================

export interface UseLifecycleConfigResult {
  /** Whether config is loading from Supabase */
  loading: boolean;

  /** Error loading config (null if successful or using fallback) */
  error: Error | null;

  /** The active lifecycle model (or fallback if unavailable) */
  activeModel: LifecycleModel | null;

  /** Get tier definition for a given sprout stage */
  getTierForStage: (stage: SproutStage) => TierDefinition;

  /** Get all tier definitions in order */
  allTiers: TierDefinition[];

  /** Whether using fallback config (Supabase unavailable) */
  usingFallback: boolean;
}

// =============================================================================
// Fallback Model (for fail-soft behavior)
// =============================================================================

/**
 * Fallback lifecycle model used when Supabase is unavailable.
 * Built from FALLBACK_TIER_CONFIG and FALLBACK_STAGE_TO_TIER.
 */
const FALLBACK_MODEL: LifecycleModel = {
  id: 'fallback',
  name: 'Fallback Model',
  description: 'Built-in fallback when Supabase unavailable',
  isEditable: false,
  tiers: Object.values(FALLBACK_TIER_CONFIG).sort((a, b) => a.order - b.order),
  mappings: Object.entries(FALLBACK_STAGE_TO_TIER).map(([stage, tierId]) => ({
    stage: stage as SproutStage,
    tierId,
  })),
};

// =============================================================================
// Hook
// =============================================================================

/**
 * Consumer hook for lifecycle configuration.
 *
 * Used by Surface components (like TierBadge) to read tier definitions
 * and stage-to-tier mappings. Provides fail-soft behavior when Supabase
 * is unavailable by falling back to hardcoded defaults.
 *
 * @example
 * ```tsx
 * const { getTierForStage, loading } = useLifecycleConfig();
 * const tier = getTierForStage('branching');
 * // tier = { id: 'sprout', label: 'Sprout', emoji: '🌱', order: 1 }
 * ```
 */
export function useLifecycleConfig(): UseLifecycleConfigResult {
  const { objects, loading, error } = useGroveData<LifecycleConfigPayload>('lifecycle-config');

  // Find the active config (SINGLETON pattern - only one should be active)
  const activeConfig = useMemo(() => {
    return objects.find((obj) => obj.meta.status === 'active');
  }, [objects]);

  // Get the active model from the config
  const activeModel = useMemo<LifecycleModel | null>(() => {
    if (!activeConfig) {
      return null;
    }
    return getActiveModel(activeConfig.payload) ?? null;
  }, [activeConfig]);

  // Determine if using fallback
  const usingFallback = !loading && !activeModel;

  // Get the model to use (active or fallback)
  const effectiveModel = activeModel ?? FALLBACK_MODEL;

  // All tiers in order
  const allTiers = useMemo(() => {
    return [...effectiveModel.tiers].sort((a, b) => a.order - b.order);
  }, [effectiveModel.tiers]);

  // Get tier for a given stage
  const getTierForStage = useMemo(() => {
    return (stage: SproutStage): TierDefinition => {
      // Try to get from effective model
      const tier = getTierForStageFromModel(effectiveModel, stage);
      if (tier) return tier;

      // Fallback: use hardcoded mapping
      const fallbackTierId = FALLBACK_STAGE_TO_TIER[stage];
      const fallbackTier = FALLBACK_TIER_CONFIG[fallbackTierId];
      if (fallbackTier) return fallbackTier;

      // Ultimate fallback: first tier
      console.warn(`[useLifecycleConfig] No tier found for stage: ${stage}, using first tier`);
      return effectiveModel.tiers[0] ?? FALLBACK_TIER_CONFIG.seed;
    };
  }, [effectiveModel]);

  return {
    loading,
    error: error ?? null,
    activeModel,
    getTierForStage,
    allTiers,
    usingFallback,
  };
}

export default useLifecycleConfig;
