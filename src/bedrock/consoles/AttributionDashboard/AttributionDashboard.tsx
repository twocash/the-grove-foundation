// src/bedrock/consoles/AttributionDashboard/AttributionDashboard.tsx
// Economic Dashboard for Attribution System
// Sprint: S11-SL-Attribution v1 - Phase 4
//
// Displays token balance, reputation tier, and earned badges

import React, { useMemo } from 'react';
import { useAttributionCapture } from '../../../../hooks/useAttributionCapture';
import { GlassMetricCard, MetricsGrid } from '../../primitives/GlassMetricCard';
import { GlassPanel } from '../../primitives/GlassPanel';
import {
  ReputationTierBadge,
  TierProgressIndicator,
} from '../../primitives/ReputationTierBadge';
import { BadgeTray, BadgeSummary } from '../../primitives/BadgeTray';
import { calculateBadgeStatistics } from '@core/engine/badgeAwardEngine';
import { REPUTATION_TIER_CONFIGS } from '@core/schema/attribution';
import type { ReputationTier } from '@core/schema/attribution';

// =============================================================================
// Types
// =============================================================================

export interface AttributionDashboardProps {
  /** Grove ID to display (defaults to current session) */
  groveId?: string;
  /** Show detailed view with event history */
  showDetails?: boolean;
  /** Compact mode for embedding */
  compact?: boolean;
  /** Additional classes */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTokens(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
}

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

// =============================================================================
// Component
// =============================================================================

export function AttributionDashboard({
  groveId,
  showDetails = false,
  compact = false,
  className = '',
}: AttributionDashboardProps) {
  const {
    getTokenBalance,
    getReputationScore,
    getAttributionEvents,
    getEarnedBadges,
    getCurrentGroveId,
  } = useAttributionCapture();

  // Get data for the specified grove (or current)
  const effectiveGroveId = groveId || getCurrentGroveId();
  const tokenBalance = getTokenBalance(effectiveGroveId);
  const reputation = getReputationScore(effectiveGroveId);
  const earnedBadges = getEarnedBadges(effectiveGroveId);
  const events = getAttributionEvents();

  // Calculate badge statistics
  const badgeStats = useMemo(
    () => calculateBadgeStatistics(earnedBadges, 3),
    [earnedBadges]
  );

  // Calculate tier progress
  const tierConfig = REPUTATION_TIER_CONFIGS[reputation.currentTier];
  const nextTier = getNextTier(reputation.currentTier);
  const currentThreshold = getTierThreshold(reputation.currentTier);
  const nextThreshold = nextTier ? getTierThreshold(nextTier) : currentThreshold;
  const tierProgress = nextTier
    ? ((reputation.reputationScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;

  // Recent events (last 5)
  const recentEvents = useMemo(
    () => events.slice(-5).reverse(),
    [events]
  );

  // Compact mode - minimal display
  if (compact) {
    return (
      <div className={`flex items-center gap-4 ${className}`} data-testid="attribution-dashboard-compact">
        <ReputationTierBadge tier={reputation.currentTier} size="sm" variant="compact" />
        <span className="text-sm text-[var(--glass-text-muted)]">
          {formatTokens(tokenBalance.currentBalance)} tokens
        </span>
        <BadgeSummary earnedBadges={earnedBadges} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="attribution-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--glass-text-primary)]">
            Knowledge Economy
          </h2>
          <p className="text-sm text-[var(--glass-text-muted)]">
            Your contribution rewards and reputation
          </p>
        </div>
        <ReputationTierBadge
          tier={reputation.currentTier}
          showMultiplier
          size="lg"
          variant="full"
        />
      </div>

      {/* Metrics Row */}
      <MetricsGrid columns={3}>
        <GlassMetricCard
          label="Token Balance"
          value={formatTokens(tokenBalance.currentBalance)}
          icon="toll"
          accent="amber"
          description={`${tokenBalance.lifetimeEarned.toFixed(1)} lifetime earned`}
        />
        <GlassMetricCard
          label="Reputation Score"
          value={Math.round(reputation.reputationScore)}
          icon="military_tech"
          accent="violet"
          description={`${tierConfig.label} tier (${tierConfig.multiplier}x)`}
        />
        <GlassMetricCard
          label="Contributions"
          value={reputation.totalContributions}
          icon="edit_note"
          accent="cyan"
          description={`${tokenBalance.totalAttributions} attributions`}
        />
      </MetricsGrid>

      {/* Tier Progress */}
      <GlassPanel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
            Tier Progress
          </h3>
          {nextTier && (
            <span className="text-xs text-[var(--glass-text-muted)]">
              Next: {REPUTATION_TIER_CONFIGS[nextTier].label}
            </span>
          )}
        </div>
        <TierProgressIndicator
          score={reputation.reputationScore}
          tier={reputation.currentTier}
          size="lg"
        />
        <div className="flex justify-between mt-2 text-xs text-[var(--glass-text-muted)]">
          <span>{currentThreshold} pts</span>
          <span>{Math.round(tierProgress)}% to next tier</span>
          <span>{nextThreshold} pts</span>
        </div>
      </GlassPanel>

      {/* Badges Section */}
      <GlassPanel className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
            Achievements
          </h3>
          <span className="text-xs text-[var(--glass-text-muted)]">
            {badgeStats.earnedCount} / {badgeStats.totalBadges} badges ({badgeStats.earnedPercentage}%)
          </span>
        </div>
        <BadgeTray
          earnedBadges={earnedBadges}
          layout="row"
          size="md"
          showUnearned={showDetails}
          emptyMessage="Complete activities to earn badges"
        />
      </GlassPanel>

      {/* Recent Activity (if showDetails) */}
      {showDetails && recentEvents.length > 0 && (
        <GlassPanel className="p-4">
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentEvents.map((event) => (
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
                  Tier {event.tierLevel} • Q{Math.round(event.qualityScore)}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Stats by Category (if showDetails) */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4">
          <GlassPanel className="p-4">
            <h4 className="text-xs font-medium text-[var(--glass-text-muted)] mb-2">
              Badges by Category
            </h4>
            <div className="space-y-1">
              {Object.entries(badgeStats.byCategory).map(([category, data]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-[var(--glass-text-secondary)] capitalize">{category}</span>
                  <span className="text-[var(--glass-text-primary)]">
                    {data.earned} / {data.total}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel className="p-4">
            <h4 className="text-xs font-medium text-[var(--glass-text-muted)] mb-2">
              Badges by Rarity
            </h4>
            <div className="space-y-1">
              {Object.entries(badgeStats.byRarity).map(([rarity, data]) => (
                <div key={rarity} className="flex justify-between text-sm">
                  <span className="text-[var(--glass-text-secondary)] capitalize">{rarity}</span>
                  <span className="text-[var(--glass-text-primary)]">
                    {data.earned} / {data.total}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

export default AttributionDashboard;
