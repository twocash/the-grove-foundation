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

  const content = (
    <>
      {/* Icon */}
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-xl text-primary">{icon}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-16 bg-surface-hover-light dark:bg-surface-hover-dark rounded animate-pulse" />
            <div className="h-4 w-24 bg-surface-hover-light dark:bg-surface-hover-dark rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold text-foreground-light dark:text-foreground-dark">
              {value}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-light dark:text-muted-dark">{label}</span>
              {trend && trendValue && (
                <span
                  className={`flex items-center gap-0.5 ${
                    trend === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : trend === 'down'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-light dark:text-muted-dark'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat'}
                  </span>
                  {trendValue}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1 truncate">
                {description}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );

  const baseClasses = `
    flex items-center gap-4 p-4 rounded-lg
    bg-surface-light dark:bg-surface-dark
    border border-border-light dark:border-border-dark
  `;

  if (isInteractive) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} w-full text-left hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors cursor-pointer`}
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
