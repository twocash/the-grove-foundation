// src/foundation/components/MetricCard.tsx
// Foundation-styled metric display card with unified design tokens

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  highlight?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  highlight = false,
  className = '',
}) => {
  return (
    <div
      className={`
        bg-surface-light dark:bg-surface-dark
        border rounded-lg p-4
        ${highlight
          ? 'border-primary/40 dark:border-primary/40'
          : 'border-border-light dark:border-border-dark'
        }
        ${className}
      `}
    >
      {/* Label */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </div>

      {/* Value */}
      <div
        className={`
          text-xl font-semibold
          ${highlight
            ? 'text-primary'
            : 'text-slate-900 dark:text-slate-100'
          }
        `}
      >
        {value}
      </div>

      {/* Trend */}
      {trend && (
        <div
          className={`
            flex items-center gap-1 mt-2 text-xs
            ${trend.direction === 'up'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
            }
          `}
        >
          <span className="material-symbols-outlined text-sm">
            {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
          </span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
