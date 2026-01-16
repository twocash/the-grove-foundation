// src/surface/components/TierBadge/TierBadge.tsx
// Sprint: S4-SL-TierProgression - Visual tier badge component
// Sprint: S5-SL-LifecycleEngine v1 - Dynamic config from Supabase

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TIER_CONFIG } from './TierBadge.config';
import type { TierBadgeProps, SproutTier } from './TierBadge.types';
import { useLifecycleConfig } from '../../hooks/useLifecycleConfig';

/**
 * TierBadge - Visual indicator of sprout maturity level.
 *
 * Uses emoji-first design for immediate recognition.
 * Supports three states: pending (greyed), active (pulsing), ready (static).
 *
 * Sprint: S5-SL-LifecycleEngine v1 - Reads emoji/labels from lifecycle config
 * with fallback to static TIER_CONFIG when config unavailable.
 */
export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  status = 'ready',
  tooltip,
  className = '',
}) => {
  const { allTiers, loading } = useLifecycleConfig();

  // Get emoji and label from lifecycle config, falling back to static config
  const { emoji, label } = useMemo(() => {
    // Find tier definition from lifecycle config
    const tierDef = allTiers.find((t) => t.id === tier);

    if (tierDef) {
      return {
        emoji: tierDef.emoji,
        label: tierDef.label,
      };
    }

    // Fallback to static config
    return {
      emoji: TIER_CONFIG.emoji[tier as SproutTier] ?? '🌱',
      label: TIER_CONFIG.labels[tier as SproutTier] ?? tier,
    };
  }, [allTiers, tier]);

  const sizeConfig = TIER_CONFIG.sizes[size];

  const statusStyles = {
    pending: 'opacity-40 grayscale',
    active: 'animate-pulse',
    ready: '',
  };

  // Add loading state (subtle opacity reduction while loading)
  const loadingStyle = loading ? 'opacity-80' : '';

  return (
    <motion.span
      className={`inline-flex items-center ${statusStyles[status]} ${loadingStyle} ${className}`}
      style={{ gap: sizeConfig.gap }}
      title={tooltip ?? `${label} tier`}
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
