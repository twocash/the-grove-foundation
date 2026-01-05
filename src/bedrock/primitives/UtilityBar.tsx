// src/bedrock/primitives/UtilityBar.tsx
// Utility score display component with progress bar
// Sprint: pipeline-inspector-v1 (Epic 3)

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UtilityBarProps {
  score: number;
  retrievalCount: number;
  trend?: 'up' | 'down' | 'stable';
  maxScore?: number;
}

// =============================================================================
// Component
// =============================================================================

export function UtilityBar({
  score,
  retrievalCount,
  trend,
  maxScore = 5,
}: UtilityBarProps) {
  // Normalize score to percentage (0-100)
  const percentage = Math.min((score / maxScore) * 100, 100);

  // Determine bar color based on score
  const getBarColor = () => {
    if (percentage >= 70) return 'var(--neon-green, #22c55e)';
    if (percentage >= 40) return 'var(--neon-cyan, #22d3ee)';
    if (percentage >= 20) return 'var(--neon-amber, #f59e0b)';
    return 'var(--glass-text-subtle)';
  };

  // Trend icon
  const getTrendIcon = () => {
    if (trend === 'up') return 'trending_up';
    if (trend === 'down') return 'trending_down';
    return 'trending_flat';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-[var(--neon-green,#22c55e)]';
    if (trend === 'down') return 'text-[var(--neon-amber,#f59e0b)]';
    return 'text-[var(--glass-text-muted)]';
  };

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[var(--glass-panel)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: getBarColor(),
            }}
          />
        </div>
        <span className="text-sm font-mono text-[var(--glass-text-secondary)] min-w-[80px] text-right">
          {score.toFixed(1)} ({retrievalCount})
        </span>
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
          <span className="material-symbols-outlined text-sm">
            {getTrendIcon()}
          </span>
          <span>
            {trend === 'up' && 'Trending up'}
            {trend === 'down' && 'Trending down'}
            {trend === 'stable' && 'Stable'}
          </span>
        </div>
      )}

      {/* Context labels */}
      <div className="flex justify-between text-xs text-[var(--glass-text-subtle)]">
        <span>Low utility</span>
        <span>High utility</span>
      </div>
    </div>
  );
}

export default UtilityBar;
