// src/bedrock/components/StatCard.tsx
// Statistic card component for metrics display
// Sprint: bedrock-foundation-v1

import React from 'react';

// =============================================================================
// Types
// =============================================================================

interface StatCardProps {
  /** Stat label */
  label: string;
  /** Stat value (number or formatted string) */
  value: number | string;
  /** Material Symbols icon name */
  icon?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value text (e.g., "+12%", "-5") */
  trendValue?: string;
  /** Additional description */
  description?: string;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Whether the card is in a loading state */
  loading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  description,
  onClick,
  loading,
}: StatCardProps) {
  const isInteractive = Boolean(onClick);

  // Trend color mapping using Quantum Glass variables
  const trendColor = trend === 'up'
    ? 'text-[var(--neon-green)]'
    : trend === 'down'
      ? 'text-[var(--neon-amber)]'
      : 'text-[var(--glass-text-muted)]';

  const content = (
    <>
      {/* Icon */}
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-[var(--neon-cyan)]/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-xl text-[var(--neon-cyan)]">{icon}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-16 bg-[var(--glass-panel)] rounded animate-pulse" />
            <div className="h-4 w-24 bg-[var(--glass-panel)] rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold text-[var(--glass-text-primary)]">
              {value}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--glass-text-muted)]">{label}</span>
              {trend && trendValue && (
                <span className={`flex items-center gap-0.5 ${trendColor}`}>
                  <span className="material-symbols-outlined text-sm">
                    {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat'}
                  </span>
                  {trendValue}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-[var(--glass-text-muted)] mt-1 truncate">
                {description}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );

  const baseClasses = `
    flex items-center gap-3 px-4 py-3 rounded-xl
    bg-[var(--glass-solid)] border border-white/5
    shadow-[0_0_20px_rgba(34,211,238,0.1)]
  `;

  if (isInteractive) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} w-full text-left hover:bg-[var(--glass-elevated)] hover:border-white/10 transition-colors cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}

// =============================================================================
// MetricsRow Component
// =============================================================================

interface MetricsRowProps {
  children: React.ReactNode;
  /** Number of columns (2-6) */
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function MetricsRow({ children, columns = 4 }: MetricsRowProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}

export default StatCard;
