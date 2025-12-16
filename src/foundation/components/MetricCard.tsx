// src/foundation/components/MetricCard.tsx
// Foundation-styled metric display card

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
        f-panel rounded p-4
        ${highlight ? 'border-holo-cyan/40' : ''}
        ${className}
      `}
    >
      {/* Label */}
      <div className="text-xs text-gray-500 mb-1 font-sans">{label}</div>

      {/* Value */}
      <div
        className={`
          text-xl font-mono font-medium
          ${highlight ? 'text-holo-cyan' : 'text-white'}
        `}
      >
        {value}
      </div>

      {/* Trend */}
      {trend && (
        <div
          className={`
            flex items-center gap-1 mt-2 text-xs font-mono
            ${trend.direction === 'up' ? 'text-holo-lime' : 'text-holo-red'}
          `}
        >
          {trend.direction === 'up' ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
