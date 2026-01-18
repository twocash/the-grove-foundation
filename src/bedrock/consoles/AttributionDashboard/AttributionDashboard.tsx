// src/bedrock/consoles/AttributionDashboard/AttributionDashboard.tsx
// Economic Dashboard for Attribution System
// Sprint: S11-SL-Attribution v1 - Phase 4
//
// Displays token balance, reputation tier, and earned badges
// Uses json-render pattern for consistent, composable rendering

import React, { useMemo } from 'react';
import { useAttributionCapture } from '../../../../hooks/useAttributionCapture';
import {
  attributionDataToRenderTree,
  createEmptyAttributionTree,
  AttributionRegistry,
} from '../../consoles/ExperienceConsole/json-render';
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { ReputationTierBadge, TierProgressIndicator } from '../../primitives/ReputationTierBadge';
import { BadgeSummary } from '../../primitives/BadgeTray';

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

  // Transform data to render tree
  const renderTree = useMemo(() => {
    if (!tokenBalance || !reputation) {
      return createEmptyAttributionTree(effectiveGroveId);
    }

    return attributionDataToRenderTree(
      tokenBalance,
      reputation,
      earnedBadges,
      events,
      {
        title: 'Knowledge Economy',
        subtitle: 'Your contribution rewards and reputation',
        showHeader: false, // Layout provides header via CONSOLE_METADATA
        showMetrics: true,
        showTierProgress: !compact,
        showBadges: true,
        showUnearnedBadges: showDetails,
        showRecentActivity: showDetails,
        recentActivityLimit: 5,
        showBadgeStats: showDetails,
        compact,
      }
    );
  }, [tokenBalance, reputation, earnedBadges, events, effectiveGroveId, showDetails, compact]);

  // Compact mode - minimal display using primitives directly
  if (compact) {
    return (
      <div className={`flex items-center gap-4 ${className}`} data-testid="attribution-dashboard-compact">
        <ReputationTierBadge tier={reputation.currentTier} size="sm" variant="compact" />
        <span className="text-sm text-[var(--glass-text-muted)]">
          {tokenBalance.currentBalance.toFixed(1)} tokens
        </span>
        <BadgeSummary earnedBadges={earnedBadges} />
      </div>
    );
  }

  // Full dashboard via json-render
  return (
    <div className={`p-6 space-y-6 ${className}`} data-testid="attribution-dashboard">
      {/* Header with title and tier badge */}
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

      {/* json-render content */}
      <div className="[&_.json-render-root]:space-y-6">
        <Renderer tree={renderTree} registry={AttributionRegistry} />
      </div>
    </div>
  );
}

export default AttributionDashboard;
