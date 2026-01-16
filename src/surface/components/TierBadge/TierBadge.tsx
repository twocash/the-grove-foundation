// src/surface/components/TierBadge/TierBadge.tsx
// Sprint: S4-SL-TierProgression - Visual tier badge component

import React from 'react';
import { motion } from 'framer-motion';
import { TIER_CONFIG } from './TierBadge.config';
import type { TierBadgeProps } from './TierBadge.types';

/**
 * TierBadge - Visual indicator of sprout maturity level.
 *
 * Uses emoji-first design for immediate recognition.
 * Supports three states: pending (greyed), active (pulsing), ready (static).
 */
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

  return (
    <motion.span
      className={`inline-flex items-center ${statusStyles[status]} ${className}`}
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
