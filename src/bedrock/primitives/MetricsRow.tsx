// src/bedrock/primitives/MetricsRow.tsx
// Horizontal container for metric cards
// Sprint: bedrock-foundation-v1 (Epic 3, Story 3.2)

import React from 'react';
import type { MetricConfig } from '../types/console.types';
import { StatCard } from './StatCard';

// =============================================================================
// Types
// =============================================================================

interface MetricData {
  /** Metric ID (must match MetricConfig.id) */
  id: string;
  /** Computed value */
  value: number | string;
  /** Optional trend */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
}

interface MetricsRowProps {
  /** Metric configurations from console config */
  configs: MetricConfig[];
  /** Computed metric values */
  data: MetricData[];
  /** Loading state */
  loading?: boolean;
  /** Click handler for metric cards */
  onMetricClick?: (metricId: string) => void;
  /** Number of columns (auto-adapts if not specified) */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function MetricsRow({
  configs,
  data,
  loading = false,
  onMetricClick,
  columns,
  className = '',
}: MetricsRowProps) {
  // Auto-calculate columns based on number of metrics
  const effectiveColumns = columns || Math.min(configs.length, 4) as 2 | 3 | 4 | 5 | 6;

  const gridCols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  // Create lookup for metric data
  const dataMap = new Map(data.map(d => [d.id, d]));

  return (
    <div
      className={`grid ${gridCols[effectiveColumns]} gap-4 ${className}`}
      role="list"
      aria-label="Console metrics"
    >
      {configs.map(config => {
        const metricData = dataMap.get(config.id);

        return (
          <StatCard
            key={config.id}
            config={config}
            value={metricData?.value ?? 0}
            trend={metricData?.trend}
            loading={loading}
            onClick={onMetricClick ? () => onMetricClick(config.id) : undefined}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Responsive Variant
// =============================================================================

interface ResponsiveMetricsRowProps extends Omit<MetricsRowProps, 'columns'> {
  /** Breakpoints for responsive columns */
  responsive?: {
    sm?: 1 | 2;
    md?: 2 | 3 | 4;
    lg?: 3 | 4 | 5 | 6;
  };
}

export function ResponsiveMetricsRow({
  configs,
  data,
  loading = false,
  onMetricClick,
  responsive = { sm: 2, md: 3, lg: 4 },
  className = '',
}: ResponsiveMetricsRowProps) {
  const dataMap = new Map(data.map(d => [d.id, d]));

  const responsiveClasses = `
    grid gap-4
    grid-cols-${responsive.sm || 2}
    md:grid-cols-${responsive.md || 3}
    lg:grid-cols-${responsive.lg || 4}
    ${className}
  `;

  return (
    <div
      className={responsiveClasses}
      role="list"
      aria-label="Console metrics"
    >
      {configs.map(config => {
        const metricData = dataMap.get(config.id);

        return (
          <StatCard
            key={config.id}
            config={config}
            value={metricData?.value ?? 0}
            trend={metricData?.trend}
            loading={loading}
            onClick={onMetricClick ? () => onMetricClick(config.id) : undefined}
          />
        );
      })}
    </div>
  );
}

export default MetricsRow;
