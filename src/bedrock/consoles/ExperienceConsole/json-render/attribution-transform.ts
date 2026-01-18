// src/bedrock/consoles/ExperienceConsole/json-render/attribution-transform.ts
// Sprint: S11-SL-Attribution v1 - Phase 4
// Pattern: json-render transform (Vercel Labs)
// Converts attribution data to render trees

import type { TokenBalance, ReputationScore, ReputationTier, AttributionEvent } from '@core/schema/attribution';
import type { BadgeDefinition } from '@core/schema/badges';
import { REPUTATION_TIER_CONFIGS } from '@core/schema/attribution';
import { getBadgeDefinition, getAllBadgeDefinitions } from '@core/schema/badges';
import { calculateBadgeStatistics } from '@core/engine/badgeAwardEngine';
import type {
  RenderTree,
  RenderElement,
  AttributionHeaderProps,
  TokenBalanceCardProps,
  ReputationCardProps,
  TierProgressBarProps,
  BadgeGridProps,
  BadgeItemProps,
  RecentActivityListProps,
  AttributionEventItemProps,
  BadgeStatsSummaryProps,
  MetricsRowProps,
} from './attribution-catalog';

// ============================================================================
// TRANSFORM OPTIONS
// ============================================================================

export interface AttributionTransformOptions {
  /** Title for the panel header */
  title?: string;
  /** Subtitle for the panel header */
  subtitle?: string;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show the metrics row */
  showMetrics?: boolean;
  /** Whether to show tier progress */
  showTierProgress?: boolean;
  /** Whether to show badges */
  showBadges?: boolean;
  /** Whether to show unearned badges */
  showUnearnedBadges?: boolean;
  /** Whether to show recent activity */
  showRecentActivity?: boolean;
  /** Max recent events to show */
  recentActivityLimit?: number;
  /** Whether to show badge statistics */
  showBadgeStats?: boolean;
  /** Compact mode */
  compact?: boolean;
}

const DEFAULT_OPTIONS: Required<AttributionTransformOptions> = {
  title: 'Knowledge Economy',
  subtitle: 'Your contribution rewards and reputation',
  showHeader: true,
  showMetrics: true,
  showTierProgress: true,
  showBadges: true,
  showUnearnedBadges: false,
  showRecentActivity: true,
  recentActivityLimit: 5,
  showBadgeStats: false,
  compact: false,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNextTier(currentTier: ReputationTier): ReputationTier | null {
  const tiers: ReputationTier[] = ['novice', 'developing', 'competent', 'expert', 'legendary'];
  const index = tiers.indexOf(currentTier);
  if (index < tiers.length - 1) {
    return tiers[index + 1];
  }
  return null;
}

function getTierThreshold(tier: ReputationTier): number {
  const thresholds: Record<ReputationTier, number> = {
    novice: 0,
    developing: 100,
    competent: 500,
    expert: 2000,
    legendary: 10000,
  };
  return thresholds[tier];
}

function formatTokens(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
}

function badgeDefinitionToItem(badge: BadgeDefinition, earned: boolean, earnedAt?: string): BadgeItemProps {
  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    rarity: badge.rarity,
    category: badge.category,
    earned,
    earnedAt,
  };
}

function eventToItem(event: AttributionEvent): AttributionEventItemProps {
  return {
    id: event.id,
    finalTokens: event.finalTokens,
    tierLevel: event.tierLevel,
    qualityScore: event.qualityScore,
    timestamp: event.timestamp,
  };
}

// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================

/**
 * Transform attribution data into a render tree
 */
export function attributionDataToRenderTree(
  tokenBalance: TokenBalance,
  reputation: ReputationScore,
  earnedBadges: string[],
  events: AttributionEvent[],
  options: AttributionTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  // Header
  if (opts.showHeader && !opts.compact) {
    const headerProps: AttributionHeaderProps = {
      title: opts.title,
      subtitle: opts.subtitle,
      groveId: tokenBalance.groveId,
      compact: opts.compact,
    };
    children.push({ type: 'AttributionHeader', props: headerProps });
  }

  // Metrics Row
  if (opts.showMetrics) {
    const tierConfig = REPUTATION_TIER_CONFIGS[reputation.currentTier];
    const metricsProps: MetricsRowProps = {
      columns: 3,
      metrics: [
        {
          label: 'Token Balance',
          value: formatTokens(tokenBalance.currentBalance),
          icon: 'toll',
          accent: 'amber',
          description: `${tokenBalance.lifetimeEarned.toFixed(1)} lifetime earned`,
        },
        {
          label: 'Reputation Score',
          value: String(Math.round(reputation.reputationScore)),
          icon: 'military_tech',
          accent: 'violet',
          description: `${tierConfig.label} tier (${tierConfig.multiplier}x)`,
        },
        {
          label: 'Contributions',
          value: String(reputation.totalContributions),
          icon: 'edit_note',
          accent: 'cyan',
          description: `${tokenBalance.totalAttributions} attributions`,
        },
      ],
    };
    children.push({ type: 'MetricsRow', props: metricsProps });
  }

  // Tier Progress
  if (opts.showTierProgress && !opts.compact) {
    const nextTier = getNextTier(reputation.currentTier);
    const currentThreshold = getTierThreshold(reputation.currentTier);
    const nextThreshold = nextTier ? getTierThreshold(nextTier) : currentThreshold;
    const progressPercent = nextTier
      ? ((reputation.reputationScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      : 100;

    const tierProgressProps: TierProgressBarProps = {
      currentScore: reputation.reputationScore,
      currentTier: reputation.currentTier,
      currentThreshold,
      nextThreshold,
      nextTier,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
    };
    children.push({ type: 'TierProgressBar', props: tierProgressProps });
  }

  // Badges
  if (opts.showBadges) {
    const earnedSet = new Set(earnedBadges);
    const allBadges = getAllBadgeDefinitions();
    const badgeItems: BadgeItemProps[] = [];

    // Add earned badges first
    for (const badgeId of earnedBadges) {
      const badge = getBadgeDefinition(badgeId);
      if (badge) {
        badgeItems.push(badgeDefinitionToItem(badge, true));
      }
    }

    // Add unearned badges if requested
    if (opts.showUnearnedBadges) {
      for (const badge of allBadges) {
        if (!earnedSet.has(badge.id)) {
          badgeItems.push(badgeDefinitionToItem(badge, false));
        }
      }
    }

    const badgeStats = calculateBadgeStatistics(earnedBadges, 3);
    const badgeGridProps: BadgeGridProps = {
      badges: badgeItems,
      layout: 'row',
      size: 'md',
      showUnearned: opts.showUnearnedBadges,
      emptyMessage: 'Complete activities to earn badges',
    };
    children.push({ type: 'BadgeGrid', props: badgeGridProps });
  }

  // Recent Activity
  if (opts.showRecentActivity && events.length > 0 && !opts.compact) {
    const recentEvents = events
      .slice(-opts.recentActivityLimit)
      .reverse()
      .map(eventToItem);

    const recentActivityProps: RecentActivityListProps = {
      events: recentEvents,
      limit: opts.recentActivityLimit,
      showQuality: true,
      showTier: true,
    };
    children.push({ type: 'RecentActivityList', props: recentActivityProps });
  }

  // Badge Statistics
  if (opts.showBadgeStats && !opts.compact) {
    const badgeStats = calculateBadgeStatistics(earnedBadges);

    const badgeStatsProps: BadgeStatsSummaryProps = {
      totalBadges: badgeStats.totalBadges,
      earnedCount: badgeStats.earnedCount,
      earnedPercentage: badgeStats.earnedPercentage,
      byCategory: Object.entries(badgeStats.byCategory).map(([category, data]) => ({
        category: category as any,
        earned: data.earned,
        total: data.total,
      })),
      byRarity: Object.entries(badgeStats.byRarity).map(([rarity, data]) => ({
        rarity: rarity as any,
        earned: data.earned,
        total: data.total,
      })),
    };
    children.push({ type: 'BadgeStatsSummary', props: badgeStatsProps });
  }

  return {
    type: 'root',
    children,
  };
}

/**
 * Create an empty attribution render tree (for loading states)
 */
export function createEmptyAttributionTree(
  groveId?: string,
  options: AttributionTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  if (opts.showHeader && !opts.compact) {
    children.push({
      type: 'AttributionHeader',
      props: {
        title: opts.title,
        subtitle: 'Loading...',
        groveId,
        compact: opts.compact,
      },
    });
  }

  if (opts.showMetrics) {
    children.push({
      type: 'MetricsRow',
      props: {
        columns: 3,
        metrics: [
          { label: 'Token Balance', value: '-', icon: 'toll', accent: 'amber' },
          { label: 'Reputation Score', value: '-', icon: 'military_tech', accent: 'violet' },
          { label: 'Contributions', value: '-', icon: 'edit_note', accent: 'cyan' },
        ],
      },
    });
  }

  return {
    type: 'root',
    children,
  };
}

/**
 * Create a compact attribution render tree (for embedding)
 */
export function createCompactAttributionTree(
  tokenBalance: TokenBalance,
  reputation: ReputationScore,
  earnedBadges: string[]
): RenderTree {
  return attributionDataToRenderTree(
    tokenBalance,
    reputation,
    earnedBadges,
    [],
    {
      compact: true,
      showHeader: false,
      showMetrics: true,
      showTierProgress: false,
      showBadges: true,
      showUnearnedBadges: false,
      showRecentActivity: false,
      showBadgeStats: false,
    }
  );
}
