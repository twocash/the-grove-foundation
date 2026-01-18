// src/bedrock/primitives/ReputationTierBadge.tsx
// Reputation Tier Badge Component
// Sprint: S11-SL-Attribution v1 - Phase 3
//
// Displays user reputation tier with visual styling distinct from QualityScoreBadge (S10)
// QualityScoreBadge = Content quality grades (A-F)
// ReputationTierBadge = User reputation tiers (Novice→Legendary)

import React from 'react';
import type { ReputationTier, ReputationTierConfig } from '@core/schema/attribution';
import { REPUTATION_TIER_CONFIGS } from '@core/schema/attribution';

// =============================================================================
// Types
// =============================================================================

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'full' | 'compact' | 'icon-only';

export interface ReputationTierBadgeProps {
  /** Current reputation tier */
  tier: ReputationTier;
  /** Optional: Show multiplier (e.g., "1.3x") */
  showMultiplier?: boolean;
  /** Size variant */
  size?: BadgeSize;
  /** Display variant */
  variant?: BadgeVariant;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional classes */
  className?: string;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Color Mapping (Quantum Glass + Tier Colors)
// =============================================================================

// Map tier config colors to neon variables for glass theme consistency
const tierColorMap: Record<ReputationTier, { bg: string; text: string; border: string; glow: string }> = {
  novice: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    glow: '',
  },
  developing: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_8px_rgba(59,130,246,0.2)]',
  },
  competent: {
    bg: 'bg-[var(--neon-green)]/10',
    text: 'text-[var(--neon-green)]',
    border: 'border-[var(--neon-green)]/30',
    glow: 'shadow-[0_0_10px_var(--neon-green)/20]',
  },
  expert: {
    bg: 'bg-[var(--neon-violet)]/10',
    text: 'text-[var(--neon-violet)]',
    border: 'border-[var(--neon-violet)]/30',
    glow: 'shadow-[0_0_12px_var(--neon-violet)/25]',
  },
  legendary: {
    bg: 'bg-[var(--neon-amber)]/15',
    text: 'text-[var(--neon-amber)]',
    border: 'border-[var(--neon-amber)]/40',
    glow: 'shadow-[0_0_15px_var(--neon-amber)/30]',
  },
};

// Size styles
const sizeStyles: Record<BadgeSize, { padding: string; text: string; icon: string; gap: string }> = {
  sm: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 'text-xs', gap: 'gap-1' },
  md: { padding: 'px-2 py-1', text: 'text-xs', icon: 'text-sm', gap: 'gap-1.5' },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'text-base', gap: 'gap-2' },
};

// =============================================================================
// Component
// =============================================================================

export function ReputationTierBadge({
  tier,
  showMultiplier = false,
  size = 'md',
  variant = 'full',
  showTooltip = true,
  className = '',
  testId = 'reputation-tier-badge',
}: ReputationTierBadgeProps) {
  const config = REPUTATION_TIER_CONFIGS[tier];
  const colors = tierColorMap[tier];
  const sizes = sizeStyles[size];

  // Build tooltip content
  const tooltipContent = `${config.label} (${config.multiplier}x multiplier)\nScore range: ${config.minScore}-${config.maxScore}`;

  // Legendary tier gets special animation
  const isLegendary = tier === 'legendary';
  const legendaryAnimation = isLegendary ? 'animate-glow-breathe' : '';

  if (variant === 'icon-only') {
    return (
      <span
        className={`
          inline-flex items-center justify-center
          w-6 h-6 rounded-full border
          ${colors.bg} ${colors.border} ${colors.glow}
          ${legendaryAnimation}
          ${className}
        `}
        title={showTooltip ? tooltipContent : undefined}
        data-testid={testId}
        data-tier={tier}
      >
        <span className={`${sizes.icon}`}>{config.badgeIcon}</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={`
          inline-flex items-center ${sizes.gap} ${sizes.padding}
          rounded-full border font-medium
          ${colors.bg} ${colors.text} ${colors.border} ${colors.glow}
          ${sizes.text}
          ${legendaryAnimation}
          ${className}
        `}
        title={showTooltip ? tooltipContent : undefined}
        data-testid={testId}
        data-tier={tier}
      >
        <span>{config.badgeIcon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  // Full variant (default)
  return (
    <span
      className={`
        inline-flex items-center ${sizes.gap} ${sizes.padding}
        rounded-full border font-medium
        ${colors.bg} ${colors.text} ${colors.border} ${colors.glow}
        ${sizes.text}
        ${legendaryAnimation}
        ${className}
      `}
      title={showTooltip ? tooltipContent : undefined}
      data-testid={testId}
      data-tier={tier}
    >
      <span>{config.badgeIcon}</span>
      <span>{config.label}</span>
      {showMultiplier && (
        <span className="opacity-70">({config.multiplier}x)</span>
      )}
    </span>
  );
}

// =============================================================================
// Convenience Components
// =============================================================================

export function NoviceBadge(props: Omit<ReputationTierBadgeProps, 'tier'>) {
  return <ReputationTierBadge tier="novice" {...props} />;
}

export function DevelopingBadge(props: Omit<ReputationTierBadgeProps, 'tier'>) {
  return <ReputationTierBadge tier="developing" {...props} />;
}

export function CompetentBadge(props: Omit<ReputationTierBadgeProps, 'tier'>) {
  return <ReputationTierBadge tier="competent" {...props} />;
}

export function ExpertBadge(props: Omit<ReputationTierBadgeProps, 'tier'>) {
  return <ReputationTierBadge tier="expert" {...props} />;
}

export function LegendaryBadge(props: Omit<ReputationTierBadgeProps, 'tier'>) {
  return <ReputationTierBadge tier="legendary" {...props} />;
}

// =============================================================================
// Tier Progress Indicator
// =============================================================================

export interface TierProgressIndicatorProps {
  /** Current reputation score (0-100) */
  score: number;
  /** Current tier */
  tier: ReputationTier;
  /** Size variant */
  size?: BadgeSize;
  /** Additional classes */
  className?: string;
}

/**
 * Shows current tier with progress bar to next tier
 */
export function TierProgressIndicator({
  score,
  tier,
  size = 'md',
  className = '',
}: TierProgressIndicatorProps) {
  const config = REPUTATION_TIER_CONFIGS[tier];
  const colors = tierColorMap[tier];
  const sizes = sizeStyles[size];

  // Calculate progress within current tier
  const tierRange = config.maxScore - config.minScore;
  const scoreInTier = score - config.minScore;
  const progress = tierRange > 0 ? Math.min(100, Math.max(0, (scoreInTier / tierRange) * 100)) : 100;

  return (
    <div className={`flex flex-col gap-1 ${className}`} data-testid="tier-progress-indicator">
      <div className="flex items-center justify-between">
        <ReputationTierBadge tier={tier} size={size} variant="compact" />
        <span className={`${sizes.text} ${colors.text} opacity-70`}>
          {Math.round(score)} pts
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colors.bg.replace('/10', '')}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default ReputationTierBadge;
