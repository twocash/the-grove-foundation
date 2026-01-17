// src/surface/components/TierBadge/TierBadge.tsx
// Sprint: S4-SL-TierProgression - Visual tier badge component
// Sprint: S5-SL-LifecycleEngine v1 - Dynamic config from Supabase
// Sprint: S7-SL-AutoAdvancement v1 - Advancement tooltip and indicator

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TIER_CONFIG } from './TierBadge.config';
import type { TierBadgeProps, SproutTier } from './TierBadge.types';
import { useLifecycleConfig } from '../../hooks/useLifecycleConfig';

/**
 * Check if advancement was recent (within 24 hours)
 */
function isRecentAdvancement(advancedAt: string): boolean {
  const advancedTime = new Date(advancedAt).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return now - advancedTime < twentyFourHours;
}

/**
 * Format relative time for tooltip
 */
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

/**
 * TierBadge - Visual indicator of sprout maturity level.
 *
 * Uses emoji-first design for immediate recognition.
 * Supports three states: pending (greyed), active (pulsing), ready (static).
 *
 * Sprint: S5-SL-LifecycleEngine v1 - Reads emoji/labels from lifecycle config
 * with fallback to static TIER_CONFIG when config unavailable.
 *
 * Sprint: S7-SL-AutoAdvancement v1 - Added advancement metadata and indicator:
 * - Shows rich tooltip with advancement provenance
 * - Displays sparkle indicator for recent advancements (24h)
 */
export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = false,
  status = 'ready',
  tooltip,
  className = '',
  advancementMeta,
  showAdvancementIndicator = true,
}) => {
  const { allTiers, loading } = useLifecycleConfig();

  // Get emoji and label from lifecycle config, falling back to static config
  const { emoji, label } = useMemo(() => {
    // Find tier definition from lifecycle config
    const tierDef = allTiers.find((t) => t.id === tier);

    if (tierDef) {
      // Sanitize emoji: if it looks like SVG markup, use fallback
      const rawEmoji = tierDef.emoji;
      const isSvgString = rawEmoji && (rawEmoji.startsWith('<svg') || rawEmoji.includes('<path'));

      return {
        emoji: isSvgString ? (TIER_CONFIG.emoji[tier as SproutTier] ?? '🌱') : rawEmoji,
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

  // Sprint: S7-SL-AutoAdvancement v1 - Build rich tooltip with advancement info
  const computedTooltip = useMemo(() => {
    // If explicit tooltip provided, use it
    if (tooltip) return tooltip;

    // Base tooltip
    let tip = `${label} tier`;

    // Add advancement metadata if available
    if (advancementMeta) {
      const typeLabel = advancementMeta.advancementType === 'auto-advancement'
        ? 'Auto-advanced'
        : 'Manually advanced';
      const timeStr = formatRelativeTime(advancementMeta.advancedAt);
      tip = `${label} tier\n${typeLabel} from ${advancementMeta.fromTier} ${timeStr}`;
    }

    return tip;
  }, [tooltip, label, advancementMeta]);

  // Sprint: S7-SL-AutoAdvancement v1 - Check if should show recent advancement indicator
  const showRecentIndicator = useMemo(() => {
    if (!showAdvancementIndicator || !advancementMeta) return false;
    return isRecentAdvancement(advancementMeta.advancedAt);
  }, [showAdvancementIndicator, advancementMeta]);

  return (
    <motion.span
      className={`inline-flex items-center ${statusStyles[status]} ${loadingStyle} ${className}`}
      style={{ gap: sizeConfig.gap }}
      title={computedTooltip}
      initial={false}
      whileHover={{ scale: 1.05 }}
    >
      {/* Main emoji */}
      <span
        role="img"
        aria-label={`${label} tier`}
        style={{ fontSize: sizeConfig.fontSize }}
        className="relative"
      >
        {emoji}
        {/* Sprint: S7-SL-AutoAdvancement v1 - Recent advancement sparkle indicator */}
        {showRecentIndicator && (
          <motion.span
            className="absolute -top-1 -right-1 text-yellow-400"
            style={{ fontSize: `calc(${sizeConfig.fontSize} * 0.4)` }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            ✨
          </motion.span>
        )}
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
