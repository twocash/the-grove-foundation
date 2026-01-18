// src/bedrock/consoles/ExperienceConsole/json-render/attribution-registry.tsx
// Sprint: S11-SL-Attribution v1 - Phase 4
// Pattern: json-render registry (Vercel Labs)
// Maps attribution catalog to React implementations

import React from 'react';
import type {
  RenderElement,
  AttributionHeaderProps,
  TokenBalanceCardProps,
  ReputationCardProps,
  TierProgressBarProps,
  BadgeGridProps,
  RecentActivityListProps,
  BadgeStatsSummaryProps,
  MetricsRowProps,
} from './attribution-catalog';
import { REPUTATION_TIER_CONFIGS } from '@core/schema/attribution';

/**
 * Component registry interface
 */
export interface AttributionComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

// ============================================================================
// COLOR & STYLE CONFIGS
// ============================================================================

const tierColorMap: Record<string, { bg: string; text: string; border: string }> = {
  novice: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  developing: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  competent: { bg: 'bg-[var(--neon-green)]/10', text: 'text-[var(--neon-green)]', border: 'border-[var(--neon-green)]/30' },
  expert: { bg: 'bg-[var(--neon-violet)]/10', text: 'text-[var(--neon-violet)]', border: 'border-[var(--neon-violet)]/30' },
  legendary: { bg: 'bg-[var(--neon-amber)]/15', text: 'text-[var(--neon-amber)]', border: 'border-[var(--neon-amber)]/40' },
};

const accentColorMap: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: 'bg-[var(--neon-amber)]/10', text: 'text-[var(--neon-amber)]', border: 'border-[var(--neon-amber)]/30' },
  cyan: { bg: 'bg-[var(--neon-cyan)]/10', text: 'text-[var(--neon-cyan)]', border: 'border-[var(--neon-cyan)]/30' },
  violet: { bg: 'bg-[var(--neon-violet)]/10', text: 'text-[var(--neon-violet)]', border: 'border-[var(--neon-violet)]/30' },
  green: { bg: 'bg-[var(--neon-green)]/10', text: 'text-[var(--neon-green)]', border: 'border-[var(--neon-green)]/30' },
  default: { bg: 'bg-white/5', text: 'text-[var(--glass-text-primary)]', border: 'border-white/10' },
};

const rarityColorMap: Record<string, { bg: string; border: string; glow: string }> = {
  common: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', glow: '' },
  uncommon: { bg: 'bg-[var(--neon-green)]/10', border: 'border-[var(--neon-green)]/30', glow: 'shadow-sm' },
  rare: { bg: 'bg-[var(--neon-violet)]/10', border: 'border-[var(--neon-violet)]/30', glow: 'shadow-[0_0_8px_var(--neon-violet)/20]' },
  legendary: { bg: 'bg-[var(--neon-amber)]/15', border: 'border-[var(--neon-amber)]/40', glow: 'shadow-[0_0_12px_var(--neon-amber)/30]' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
}

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

export const AttributionRegistry: AttributionComponentRegistry = {
  AttributionHeader: ({ element }) => {
    const props = element.props as AttributionHeaderProps;
    return (
      <header className="mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
              {props.title}
            </h2>
            {props.subtitle && (
              <p className="text-sm text-[var(--glass-text-muted)]">
                {props.subtitle}
              </p>
            )}
          </div>
          {props.groveId && (
            <span className="px-2 py-1 text-xs font-mono bg-white/5 border border-white/10 rounded">
              {props.groveId.slice(0, 8)}...
            </span>
          )}
        </div>
      </header>
    );
  },

  TokenBalanceCard: ({ element }) => {
    const props = element.props as TokenBalanceCardProps;
    const colors = accentColorMap[props.accent || 'amber'];

    return (
      <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`material-symbols-outlined text-lg ${colors.text}`}>
            {props.icon || 'toll'}
          </span>
          <span className="text-xs text-[var(--glass-text-muted)] uppercase font-mono">
            Token Balance
          </span>
        </div>
        <p className="text-2xl font-bold text-[var(--glass-text-primary)]">
          {formatNumber(props.currentBalance)}
        </p>
        <p className="text-xs text-[var(--glass-text-muted)] mt-1">
          {formatNumber(props.lifetimeEarned)} lifetime earned
        </p>
      </div>
    );
  },

  ReputationCard: ({ element }) => {
    const props = element.props as ReputationCardProps;
    const colors = accentColorMap[props.accent || 'violet'];
    const tierConfig = REPUTATION_TIER_CONFIGS[props.currentTier];

    return (
      <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`material-symbols-outlined text-lg ${colors.text}`}>
            {props.icon || 'military_tech'}
          </span>
          <span className="text-xs text-[var(--glass-text-muted)] uppercase font-mono">
            Reputation Score
          </span>
        </div>
        <p className="text-2xl font-bold text-[var(--glass-text-primary)]">
          {Math.round(props.reputationScore)}
        </p>
        <p className="text-xs text-[var(--glass-text-muted)] mt-1">
          {tierConfig?.label || props.currentTier} tier ({props.tierMultiplier}x)
        </p>
      </div>
    );
  },

  TierProgressBar: ({ element }) => {
    const props = element.props as TierProgressBarProps;
    const tierConfig = REPUTATION_TIER_CONFIGS[props.currentTier];
    const colors = tierColorMap[props.currentTier] || tierColorMap.novice;

    return (
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            Tier Progress
          </span>
          {props.nextTier && (
            <span className="text-xs text-[var(--glass-text-muted)]">
              Next: {REPUTATION_TIER_CONFIGS[props.nextTier]?.label}
            </span>
          )}
        </div>

        {/* Current tier badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
            {tierConfig?.badgeIcon} {tierConfig?.label || props.currentTier}
          </span>
          <span className="text-xs text-[var(--glass-text-muted)]">
            {Math.round(props.currentScore)} pts
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bg.replace('/10', '')}`}
            style={{ width: `${props.progressPercent}%` }}
          />
        </div>

        {/* Threshold labels */}
        <div className="flex justify-between mt-2 text-xs text-[var(--glass-text-muted)]">
          <span>{props.currentThreshold} pts</span>
          <span>{Math.round(props.progressPercent)}% to next tier</span>
          <span>{props.nextThreshold} pts</span>
        </div>
      </div>
    );
  },

  BadgeGrid: ({ element }) => {
    const props = element.props as BadgeGridProps;

    const visibleBadges = props.maxVisible
      ? props.badges.slice(0, props.maxVisible)
      : props.badges;
    const hiddenCount = props.maxVisible
      ? Math.max(0, props.badges.length - props.maxVisible)
      : 0;

    // Filter based on earned status if not showing unearned
    const displayBadges = props.showUnearned
      ? visibleBadges
      : visibleBadges.filter(b => b.earned);

    if (displayBadges.length === 0) {
      return (
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <p className="text-sm text-[var(--glass-text-muted)] italic">
            {props.emptyMessage}
          </p>
        </div>
      );
    }

    const layoutClasses: Record<string, string> = {
      grid: 'grid grid-cols-4 gap-2',
      row: 'flex flex-wrap gap-2',
      list: 'flex flex-col gap-2',
    };

    const sizeClasses: Record<string, string> = {
      sm: 'w-6 h-6 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base',
    };

    return (
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            Achievements
          </span>
          <span className="text-xs text-[var(--glass-text-muted)]">
            {props.badges.filter(b => b.earned).length} / {props.badges.length} badges
          </span>
        </div>

        <div className={layoutClasses[props.layout || 'row']}>
          {displayBadges.map((badge) => {
            const rarity = rarityColorMap[badge.rarity] || rarityColorMap.common;
            const isEarned = badge.earned;

            return (
              <div
                key={badge.id}
                className={`
                  ${sizeClasses[props.size || 'md']}
                  rounded-full flex items-center justify-center
                  border ${rarity.border} ${rarity.bg} ${rarity.glow}
                  ${!isEarned ? 'opacity-30 grayscale' : ''}
                  transition-all
                `}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="material-symbols-outlined">
                  {badge.icon}
                </span>
              </div>
            );
          })}

          {hiddenCount > 0 && (
            <span className="px-2 py-1 text-xs text-[var(--glass-text-muted)] bg-white/5 rounded-full">
              +{hiddenCount}
            </span>
          )}
        </div>
      </div>
    );
  },

  RecentActivityList: ({ element }) => {
    const props = element.props as RecentActivityListProps;
    const displayEvents = props.events.slice(0, props.limit || 5);

    if (displayEvents.length === 0) {
      return (
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <span className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 block">
            Recent Activity
          </span>
          <p className="text-xs text-[var(--glass-text-muted)] italic">
            No recent events
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-lg border border-white/10 bg-white/5">
        <span className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 block">
          Recent Activity
        </span>
        <div className="space-y-2">
          {displayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--neon-cyan)]">
                  add_circle
                </span>
                <span className="text-sm text-[var(--glass-text-secondary)]">
                  +{event.finalTokens.toFixed(1)} tokens
                </span>
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">
                {props.showTier && `Tier ${event.tierLevel}`}
                {props.showTier && props.showQuality && ' • '}
                {props.showQuality && `Q${Math.round(event.qualityScore)}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  BadgeStatsSummary: ({ element }) => {
    const props = element.props as BadgeStatsSummaryProps;

    return (
      <div className="grid grid-cols-2 gap-4">
        {/* By Category */}
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h4 className="text-xs font-medium text-[var(--glass-text-muted)] mb-2">
            Badges by Category
          </h4>
          <div className="space-y-1">
            {props.byCategory.map((cat) => (
              <div key={cat.category} className="flex justify-between text-sm">
                <span className="text-[var(--glass-text-secondary)] capitalize">
                  {cat.category}
                </span>
                <span className="text-[var(--glass-text-primary)]">
                  {cat.earned} / {cat.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By Rarity */}
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h4 className="text-xs font-medium text-[var(--glass-text-muted)] mb-2">
            Badges by Rarity
          </h4>
          <div className="space-y-1">
            {props.byRarity.map((rar) => (
              <div key={rar.rarity} className="flex justify-between text-sm">
                <span className="text-[var(--glass-text-secondary)] capitalize">
                  {rar.rarity}
                </span>
                <span className="text-[var(--glass-text-primary)]">
                  {rar.earned} / {rar.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },

  MetricsRow: ({ element }) => {
    const props = element.props as MetricsRowProps;
    const gridCols: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };

    return (
      <div className={`grid gap-4 mb-4 ${gridCols[props.columns] || 'grid-cols-3'}`}>
        {props.metrics.map((metric, i) => {
          const colors = accentColorMap[metric.accent || 'default'];
          return (
            <div key={i} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
              <div className="flex items-center gap-2 mb-2">
                {metric.icon && (
                  <span className={`material-symbols-outlined text-lg ${colors.text}`}>
                    {metric.icon}
                  </span>
                )}
                <span className="text-xs text-[var(--glass-text-muted)] uppercase font-mono">
                  {metric.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-[var(--glass-text-primary)]">
                {metric.value}
              </p>
              {metric.description && (
                <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                  {metric.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  },
};

export default AttributionRegistry;
