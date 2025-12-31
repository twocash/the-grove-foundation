// src/bedrock/primitives/GlassMetricCard.tsx
// Quantum Glass metric card for pipeline statistics
// Sprint: kinetic-pipeline-v1 (Story 6.0)

import React from 'react';

// =============================================================================
// Types
// =============================================================================

type NeonAccent = 'green' | 'cyan' | 'amber' | 'violet';
type TrendDirection = 'up' | 'down' | 'neutral';

interface GlassMetricCardProps {
  /** Metric label */
  label: string;
  /** Metric value (number or formatted string) */
  value: number | string;
  /** Material Symbols icon name */
  icon?: string;
  /** Neon accent color */
  accent?: NeonAccent;
  /** Trend direction */
  trend?: TrendDirection;
  /** Trend value text (e.g., "+12%", "-5") */
  trendValue?: string;
  /** Additional description */
  description?: string;
  /** Whether the card is in a loading state */
  loading?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Additional classes */
  className?: string;
}

// =============================================================================
// Style Mappings
// =============================================================================

const accentStyles: Record<NeonAccent, { icon: string; glow: string; bg: string }> = {
  green: {
    icon: 'text-[var(--neon-green)]',
    glow: 'shadow-[0_0_20px_var(--neon-green)/10]',
    bg: 'bg-[var(--neon-green)]/10',
  },
  cyan: {
    icon: 'text-[var(--neon-cyan)]',
    glow: 'shadow-[0_0_20px_var(--neon-cyan)/10]',
    bg: 'bg-[var(--neon-cyan)]/10',
  },
  amber: {
    icon: 'text-[var(--neon-amber)]',
    glow: 'shadow-[0_0_20px_var(--neon-amber)/10]',
    bg: 'bg-[var(--neon-amber)]/10',
  },
  violet: {
    icon: 'text-[var(--neon-violet)]',
    glow: 'shadow-[0_0_20px_var(--neon-violet)/10]',
    bg: 'bg-[var(--neon-violet)]/10',
  },
};

const trendStyles: Record<TrendDirection, { color: string; icon: string }> = {
  up: { color: 'text-[var(--neon-green)]', icon: 'trending_up' },
  down: { color: 'text-[var(--neon-amber)]', icon: 'trending_down' },
  neutral: { color: 'text-[var(--glass-text-muted)]', icon: 'trending_flat' },
};

// =============================================================================
// Component
// =============================================================================

export function GlassMetricCard({
  label,
  value,
  icon,
  accent = 'cyan',
  trend,
  trendValue,
  description,
  loading = false,
  onClick,
  className = '',
}: GlassMetricCardProps) {
  const isInteractive = Boolean(onClick);
  const colors = accentStyles[accent];

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
      {icon && (
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined text-2xl ${colors.icon}`}>{icon}</span>
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
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--glass-text-muted)]">{label}</span>
              {trend && trendValue && (
                <span className={`flex items-center gap-0.5 ${trendStyles[trend].color}`}>
                  <span className="material-symbols-outlined text-sm">
                    {trendStyles[trend].icon}
                  </span>
                  {trendValue}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-[var(--glass-text-subtle)] mt-1 truncate">
                {description}
              </p>
            )}
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

// =============================================================================
// MetricsGrid Component
// =============================================================================

interface MetricsGridProps {
  children: React.ReactNode;
  /** Number of columns (2-6) */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function MetricsGrid({ children, columns = 4, className = '' }: MetricsGridProps) {
  const gridCols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

export default GlassMetricCard;
