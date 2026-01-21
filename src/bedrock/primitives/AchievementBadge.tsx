// src/bedrock/primitives/AchievementBadge.tsx
// Achievement Badge Component
// Sprint: S11-SL-Attribution v1 - Phase 3
//
// Displays individual achievement/milestone badges from the badge system

import React from 'react';
import type { BadgeDefinition, BadgeRarity } from '@core/schema/badges';
import { BADGE_RARITY_CONFIGS, getBadgeDefinition } from '@core/schema/badges';

// =============================================================================
// Types
// =============================================================================

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'full' | 'compact' | 'icon-only';

export interface AchievementBadgeProps {
  /** Badge definition or badge ID */
  badge: BadgeDefinition | string;
  /** Size variant */
  size?: BadgeSize;
  /** Display variant */
  variant?: BadgeVariant;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Whether the badge is earned (affects opacity) */
  earned?: boolean;
  /** Additional classes */
  className?: string;
  /** Test ID */
  testId?: string;
  /** Click handler */
  onClick?: () => void;
}

// =============================================================================
// Rarity Color Mapping
// =============================================================================

const rarityColorMap: Record<BadgeRarity, { bg: string; text: string; border: string; glow: string }> = {
  common: {
    bg: 'bg-[var(--glass-panel)]',
    text: 'text-[var(--glass-text-muted)]',
    border: 'border-[var(--glass-border)]',
    glow: '',
  },
  uncommon: {
    bg: 'bg-[var(--neon-cyan)]/10',
    text: 'text-[var(--neon-cyan)]',
    border: 'border-[var(--neon-cyan)]/30',
    glow: 'shadow-[0_0_8px_var(--neon-cyan)/20]',
  },
  rare: {
    bg: 'bg-[var(--neon-violet)]/10',
    text: 'text-[var(--neon-violet)]',
    border: 'border-[var(--neon-violet)]/30',
    glow: 'shadow-[0_0_10px_var(--neon-violet)/25]',
  },
  legendary: {
    bg: 'bg-[var(--neon-amber)]/15',
    text: 'text-[var(--neon-amber)]',
    border: 'border-[var(--neon-amber)]/40',
    glow: 'shadow-[0_0_15px_var(--neon-amber)/30]',
  },
};

// Size styles
const sizeStyles: Record<BadgeSize, { padding: string; text: string; icon: string; gap: string; iconSize: string }> = {
  sm: { padding: 'px-1.5 py-0.5', text: 'text-[10px]', icon: 'text-xs', gap: 'gap-1', iconSize: 'w-5 h-5' },
  md: { padding: 'px-2 py-1', text: 'text-xs', icon: 'text-sm', gap: 'gap-1.5', iconSize: 'w-6 h-6' },
  lg: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'text-base', gap: 'gap-2', iconSize: 'w-8 h-8' },
};

// =============================================================================
// Component
// =============================================================================

export function AchievementBadge({
  badge,
  size = 'md',
  variant = 'full',
  showTooltip = true,
  earned = true,
  className = '',
  testId = 'achievement-badge',
  onClick,
}: AchievementBadgeProps) {
  // Resolve badge definition
  const badgeDef = typeof badge === 'string' ? getBadgeDefinition(badge) : badge;

  if (!badgeDef) {
    return null;
  }

  const rarityConfig = BADGE_RARITY_CONFIGS[badgeDef.rarity];
  const colors = rarityColorMap[badgeDef.rarity];
  const sizes = sizeStyles[size];

  // Build tooltip content
  const tooltipContent = `${badgeDef.name}\n${badgeDef.description}\nRarity: ${badgeDef.rarity}`;

  // Legendary gets animation, unearned gets opacity reduction
  const isLegendary = badgeDef.rarity === 'legendary';
  const legendaryAnimation = isLegendary && earned ? 'animate-glow-breathe' : '';
  const earnedOpacity = earned ? '' : 'opacity-40';

  // Interactive styles
  const interactive = onClick ? 'cursor-pointer hover:scale-105 transition-transform' : '';

  if (variant === 'icon-only') {
    return (
      <span
        className={`
          inline-flex items-center justify-center
          ${sizes.iconSize} rounded-full border
          ${colors.bg} ${colors.border} ${colors.glow}
          ${legendaryAnimation} ${earnedOpacity} ${interactive}
          ${className}
        `}
        title={showTooltip ? tooltipContent : undefined}
        data-testid={testId}
        data-badge-id={badgeDef.id}
        data-earned={earned}
        onClick={onClick}
      >
        <span className={`material-symbols-outlined ${sizes.icon}`}>{badgeDef.icon}</span>
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
          ${legendaryAnimation} ${earnedOpacity} ${interactive}
          ${className}
        `}
        title={showTooltip ? tooltipContent : undefined}
        data-testid={testId}
        data-badge-id={badgeDef.id}
        data-earned={earned}
        onClick={onClick}
      >
        <span className={`material-symbols-outlined ${sizes.icon}`}>{badgeDef.icon}</span>
        <span>{badgeDef.name}</span>
      </span>
    );
  }

  // Full variant (default)
  return (
    <div
      className={`
        inline-flex flex-col items-center ${sizes.gap} p-2
        rounded-lg border
        ${colors.bg} ${colors.border} ${colors.glow}
        ${legendaryAnimation} ${earnedOpacity} ${interactive}
        ${className}
      `}
      title={showTooltip ? tooltipContent : undefined}
      data-testid={testId}
      data-badge-id={badgeDef.id}
      data-earned={earned}
      onClick={onClick}
    >
      <span
        className={`
          flex items-center justify-center
          ${sizes.iconSize} rounded-full
          ${colors.bg}
        `}
      >
        <span className={`material-symbols-outlined ${sizes.icon} ${colors.text}`}>
          {badgeDef.icon}
        </span>
      </span>
      <span className={`${sizes.text} ${colors.text} font-medium text-center`}>
        {badgeDef.name}
      </span>
    </div>
  );
}

// =============================================================================
// Badge Card (Expanded View)
// =============================================================================

export interface BadgeCardProps {
  /** Badge definition or badge ID */
  badge: BadgeDefinition | string;
  /** Whether the badge is earned */
  earned?: boolean;
  /** Earned timestamp (ISO string) */
  earnedAt?: string;
  /** Additional classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Expanded badge card with full details
 */
export function BadgeCard({
  badge,
  earned = true,
  earnedAt,
  className = '',
  onClick,
}: BadgeCardProps) {
  const badgeDef = typeof badge === 'string' ? getBadgeDefinition(badge) : badge;

  if (!badgeDef) {
    return null;
  }

  const colors = rarityColorMap[badgeDef.rarity];
  const earnedOpacity = earned ? '' : 'opacity-50';
  const interactive = onClick ? 'cursor-pointer hover:border-white/20 transition-colors' : '';

  // Format earned date
  const earnedDate = earnedAt ? new Date(earnedAt).toLocaleDateString() : null;

  return (
    <div
      className={`
        flex items-start gap-3 p-3
        rounded-lg border bg-white/5
        ${colors.border} ${earnedOpacity} ${interactive}
        ${className}
      `}
      data-testid="badge-card"
      data-badge-id={badgeDef.id}
      onClick={onClick}
    >
      <AchievementBadge
        badge={badgeDef}
        size="lg"
        variant="icon-only"
        earned={earned}
        showTooltip={false}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${colors.text}`}>{badgeDef.name}</span>
          <span className="text-[10px] text-[var(--glass-text-muted)] uppercase">
            {badgeDef.rarity}
          </span>
        </div>
        <p className="text-xs text-[var(--glass-text-muted)] mt-0.5">
          {badgeDef.description}
        </p>
        {earned && earnedDate && (
          <p className="text-[10px] text-[var(--glass-text-muted)] mt-1">
            Earned {earnedDate}
          </p>
        )}
        {!earned && (
          <p className="text-[10px] text-[var(--glass-text-muted)] mt-1 italic">
            Not yet earned
          </p>
        )}
      </div>
    </div>
  );
}

export default AchievementBadge;
