// src/bedrock/primitives/StatCard.tsx
// Individual metric display card for console dashboards
// Sprint: bedrock-foundation-v1 (Epic 3, Story 3.1)

import React from 'react';
import type { MetricConfig } from '../types/console.types';

// =============================================================================
// Types
// =============================================================================

interface StatCardProps {
  /** Metric configuration */
  config: MetricConfig;
  /** Computed value to display */
  value: number | string;
  /** Optional trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  /** Loading state */
  loading?: boolean;
  /** Click handler for interactive stats */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Style Mappings
// =============================================================================

type AccentColor = 'cyan' | 'violet' | 'amber' | 'green' | 'red';

const accentStyles: Record<AccentColor, { icon: string; glow: string; bg: string }> = {
  cyan: {
    icon: 'text-[var(--neon-cyan)]',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.1)]',
    bg: 'bg-[var(--neon-cyan)]/10',
  },
  violet: {
    icon: 'text-[var(--neon-violet)]',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    bg: 'bg-[var(--neon-violet)]/10',
  },
  amber: {
    icon: 'text-[var(--neon-amber)]',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.1)]',
    bg: 'bg-[var(--neon-amber)]/10',
  },
  green: {
    icon: 'text-[var(--neon-green)]',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]',
    bg: 'bg-[var(--neon-green)]/10',
  },
  red: {
    icon: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(248,113,113,0.1)]',
    bg: 'bg-red-400/10',
  },
};

const trendStyles = {
  up: { color: 'text-[var(--neon-green)]', icon: 'trending_up' },
  down: { color: 'text-[var(--neon-amber)]', icon: 'trending_down' },
  neutral: { color: 'text-[var(--glass-text-muted)]', icon: 'trending_flat' },
};

// =============================================================================
// Value Formatters
// =============================================================================

function formatValue(
  value: number | string,
  format?: MetricConfig['format']
): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'relative':
      // For relative time, just return as-is (should be pre-formatted)
      return String(value);
    case 'number':
    default:
      return value.toLocaleString();
  }
}

// =============================================================================
// Component
// =============================================================================

export function StatCard({
  config,
  value,
  trend,
  loading = false,
  onClick,
  className = '',
}: StatCardProps) {
  const accent = config.accent || 'cyan';
  const colors = accentStyles[accent];
  const isInteractive = Boolean(onClick);

  const baseClasses = `
    flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
    bg-[var(--glass-solid)] border-white/5
    ${colors.glow}
    ${isInteractive ? 'cursor-pointer hover:border-white/10 hover:bg-[var(--glass-elevated)]' : ''}
    ${className}
  `;

  const content = (
    <>
      {/* Icon */}
      {config.icon && (
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined text-2xl ${colors.icon}`}>
            {config.icon}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-20 bg-[var(--glass-panel)] rounded animate-pulse" />
            <div className="h-4 w-28 bg-[var(--glass-panel)] rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold text-[var(--glass-text-primary)] tabular-nums">
              {formatValue(value, config.format)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--glass-text-muted)]">{config.label}</span>
              {trend && (
                <span className={`flex items-center gap-0.5 ${trendStyles[trend.direction].color}`}>
                  <span className="material-symbols-outlined text-sm">
                    {trendStyles[trend.direction].icon}
                  </span>
                  {trend.value}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  if (isInteractive) {
    return (
      <button onClick={onClick} className={`${baseClasses} w-full text-left`}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

export default StatCard;
