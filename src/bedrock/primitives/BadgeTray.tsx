// src/bedrock/primitives/BadgeTray.tsx
// Badge Tray Component
// Sprint: S11-SL-Attribution v1 - Phase 3
//
// Container for displaying collections of achievement badges

import React from 'react';
import type { BadgeDefinition, EarnedBadge } from '@core/schema/badges';
import { getBadgeDefinition, getAllBadgeDefinitions } from '@core/schema/badges';
import { AchievementBadge, BadgeCard } from './AchievementBadge';

// =============================================================================
// Types
// =============================================================================

type TrayLayout = 'grid' | 'row' | 'list';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeTrayProps {
  /** Array of earned badge IDs or EarnedBadge records */
  earnedBadges: (string | EarnedBadge)[];
  /** Layout style */
  layout?: TrayLayout;
  /** Badge size */
  size?: BadgeSize;
  /** Show unearned badges (greyed out) */
  showUnearned?: boolean;
  /** Maximum badges to show (rest hidden with "+N more") */
  maxVisible?: number;
  /** Click handler for badge selection */
  onBadgeClick?: (badgeId: string) => void;
  /** Additional classes */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function normalizeEarnedBadge(badge: string | EarnedBadge): { badgeId: string; earnedAt?: string } {
  if (typeof badge === 'string') {
    return { badgeId: badge };
  }
  return { badgeId: badge.badgeId, earnedAt: badge.earnedAt };
}

// =============================================================================
// Component
// =============================================================================

export function BadgeTray({
  earnedBadges,
  layout = 'row',
  size = 'md',
  showUnearned = false,
  maxVisible,
  onBadgeClick,
  className = '',
  emptyMessage = 'No badges earned yet',
}: BadgeTrayProps) {
  // Normalize earned badges
  const normalizedEarned = earnedBadges.map(normalizeEarnedBadge);
  const earnedIds = new Set(normalizedEarned.map(b => b.badgeId));
  const earnedMap = new Map(normalizedEarned.map(b => [b.badgeId, b]));

  // Get all badges if showing unearned
  const allBadges = showUnearned ? getAllBadgeDefinitions() : [];
  const unearnedBadges = allBadges.filter(b => !earnedIds.has(b.id));

  // Build display list
  const displayBadges: Array<{ badge: BadgeDefinition; earned: boolean; earnedAt?: string }> = [];

  // Add earned badges first
  for (const { badgeId, earnedAt } of normalizedEarned) {
    const badge = getBadgeDefinition(badgeId);
    if (badge) {
      displayBadges.push({ badge, earned: true, earnedAt });
    }
  }

  // Add unearned badges if requested
  if (showUnearned) {
    for (const badge of unearnedBadges) {
      displayBadges.push({ badge, earned: false });
    }
  }

  // Apply max visible limit
  const visibleBadges = maxVisible ? displayBadges.slice(0, maxVisible) : displayBadges;
  const hiddenCount = maxVisible ? Math.max(0, displayBadges.length - maxVisible) : 0;

  // Empty state
  if (displayBadges.length === 0) {
    return (
      <div
        className={`text-sm text-[var(--glass-text-muted)] italic ${className}`}
        data-testid="badge-tray-empty"
      >
        {emptyMessage}
      </div>
    );
  }

  // Layout-specific container classes
  const layoutClasses: Record<TrayLayout, string> = {
    grid: 'grid grid-cols-4 gap-2',
    row: 'flex flex-wrap gap-2',
    list: 'flex flex-col gap-2',
  };

  if (layout === 'list') {
    return (
      <div className={`${layoutClasses.list} ${className}`} data-testid="badge-tray">
        {visibleBadges.map(({ badge, earned, earnedAt }) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earned}
            earnedAt={earnedAt}
            onClick={onBadgeClick ? () => onBadgeClick(badge.id) : undefined}
          />
        ))}
        {hiddenCount > 0 && (
          <div className="text-xs text-[var(--glass-text-muted)] p-2">
            +{hiddenCount} more badges
          </div>
        )}
      </div>
    );
  }

  // Grid or row layout
  return (
    <div className={`${layoutClasses[layout]} ${className}`} data-testid="badge-tray">
      {visibleBadges.map(({ badge, earned }) => (
        <AchievementBadge
          key={badge.id}
          badge={badge}
          size={size}
          variant={layout === 'grid' ? 'full' : 'compact'}
          earned={earned}
          onClick={onBadgeClick ? () => onBadgeClick(badge.id) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span
          className={`
            inline-flex items-center justify-center
            px-2 py-1 rounded-full
            bg-white/5 border border-white/10
            text-xs text-[var(--glass-text-muted)]
          `}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Badge Summary Card
// =============================================================================

export interface BadgeSummaryProps {
  /** Array of earned badge IDs */
  earnedBadges: string[];
  /** Total possible badges */
  totalBadges?: number;
  /** Click handler to show all badges */
  onShowAll?: () => void;
  /** Additional classes */
  className?: string;
}

/**
 * Compact summary showing badge count and recent badges
 */
export function BadgeSummary({
  earnedBadges,
  totalBadges,
  onShowAll,
  className = '',
}: BadgeSummaryProps) {
  const total = totalBadges ?? getAllBadgeDefinitions().length;
  const percentage = total > 0 ? Math.round((earnedBadges.length / total) * 100) : 0;
  const recentBadges = earnedBadges.slice(-3).reverse();

  return (
    <div
      className={`
        flex items-center justify-between gap-4
        p-3 rounded-lg border border-white/10 bg-white/5
        ${className}
      `}
      data-testid="badge-summary"
    >
      <div className="flex items-center gap-3">
        {/* Recent badges */}
        <div className="flex -space-x-2">
          {recentBadges.map(badgeId => (
            <AchievementBadge
              key={badgeId}
              badge={badgeId}
              size="sm"
              variant="icon-only"
            />
          ))}
          {recentBadges.length === 0 && (
            <span className="w-6 h-6 rounded-full bg-white/10 border border-white/10" />
          )}
        </div>

        {/* Count and percentage */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            {earnedBadges.length} / {total} Badges
          </span>
          <span className="text-xs text-[var(--glass-text-muted)]">
            {percentage}% complete
          </span>
        </div>
      </div>

      {/* Show all button */}
      {onShowAll && (
        <button
          onClick={onShowAll}
          className="
            text-xs text-[var(--neon-cyan)] hover:text-[var(--neon-cyan)]/80
            transition-colors
          "
        >
          View All
        </button>
      )}
    </div>
  );
}

export default BadgeTray;
