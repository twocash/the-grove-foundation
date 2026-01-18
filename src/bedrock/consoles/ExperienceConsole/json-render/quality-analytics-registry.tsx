// src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-registry.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render registry (maps catalog to React components)

import React from 'react';
import { SignalsRegistry } from './signals-registry';
import type {
  RenderElement,
  AnalyticsHeaderProps,
  AnalyticsMetricRowProps,
  DimensionProfileProps,
  ScoreDistributionProps,
  QualityTrendChartProps,
  PercentileRankingProps,
} from './quality-analytics-catalog';

/**
 * Component registry interface
 */
export interface QualityAnalyticsComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * Time range labels
 */
const TIME_RANGE_LABELS: Record<string, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'all': 'All Time',
};

/**
 * Trend color classes
 */
const TREND_COLORS = {
  up: 'text-grove-forest',
  down: 'text-red-500',
  neutral: 'text-ink-muted dark:text-paper/50',
};

/**
 * Metric color accents
 */
const METRIC_COLORS = {
  default: 'border-ink/10 dark:border-white/10',
  green: 'border-grove-forest/30 bg-grove-forest/5',
  cyan: 'border-cyan-500/30 bg-cyan-500/5',
  amber: 'border-amber-500/30 bg-amber-500/5',
  red: 'border-red-500/30 bg-red-500/5',
};

/**
 * QualityAnalyticsRegistry - Maps catalog components to React implementations
 * Composes with SignalsRegistry for shared components
 */
export const QualityAnalyticsRegistry: QualityAnalyticsComponentRegistry = {
  // Inherit base components from SignalsRegistry
  ...SignalsRegistry,

  AnalyticsHeader: ({ element }) => {
    const props = element.props as AnalyticsHeaderProps;
    return (
      <header className="mb-4 pb-3 border-b border-ink/10 dark:border-white/10" data-testid="analytics-header">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink dark:text-paper">
            {props.title}
          </h2>
          <span className="px-2 py-1 text-xs font-mono bg-ink/5 dark:bg-white/10 rounded">
            {TIME_RANGE_LABELS[props.timeRange] || props.timeRange}
          </span>
        </div>
        {props.lastUpdated && (
          <p className="mt-2 text-xs text-ink-muted dark:text-paper/50">
            Last updated: {new Date(props.lastUpdated).toLocaleString()}
          </p>
        )}
      </header>
    );
  },

  AnalyticsMetricRow: ({ element }) => {
    const props = element.props as AnalyticsMetricRowProps;
    const gridCols: Record<number, string> = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    const formatValue = (val: number, format: string): string => {
      switch (format) {
        case 'percent':
          return `${Math.round(val)}%`;
        case 'decimal':
          return val.toFixed(1);
        default:
          return val.toLocaleString();
      }
    };

    return (
      <div
        className={`grid gap-3 mb-4 ${gridCols[props.columns] || 'grid-cols-4'}`}
        data-testid="analytics-metric-row"
      >
        {props.metrics.map((metric, i) => (
          <div
            key={i}
            className={`p-3 rounded border ${METRIC_COLORS[metric.color || 'default']}`}
            data-testid="stat-card"
            data-metric={metric.label.toLowerCase().replace(/\s+/g, '-')}
          >
            <p className="text-xs text-ink-muted dark:text-paper/60 uppercase font-mono mb-1">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-ink dark:text-paper">
              {formatValue(metric.value, metric.format || 'number')}
            </p>
            {metric.trend && (
              <p
                className={`text-xs mt-1 flex items-center gap-1 ${TREND_COLORS[metric.trend.direction]}`}
                data-testid="trend-indicator"
                data-direction={metric.trend.direction}
              >
                {metric.trend.direction === 'up' ? '↑' : metric.trend.direction === 'down' ? '↓' : '→'}
                {metric.trend.delta !== undefined && (
                  <span>{metric.trend.delta > 0 ? '+' : ''}{metric.trend.delta.toFixed(1)}</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  },

  DimensionProfile: ({ element }) => {
    const props = element.props as DimensionProfileProps;

    // Simple bar-based radar visualization (no external charts library)
    // For full Recharts integration, this would use RadarChart
    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10" data-testid="dimension-profile-chart">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink dark:text-paper">
            {props.title}
          </span>
          {props.showNetworkComparison && (
            <div className="flex items-center gap-3 text-xs" data-testid="radar-legend">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-grove-forest rounded-full" />
                <span className="text-ink-muted dark:text-paper/60">Your grove</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-dashed border-blue-400 rounded-full" />
                <span className="text-ink-muted dark:text-paper/60">Network average</span>
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {props.dimensions.map((dim) => (
            <div key={dim.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink dark:text-paper font-medium">{dim.label}</span>
                <span className="text-ink-muted dark:text-paper/60 font-mono">
                  {dim.score}
                  {dim.networkAvg !== undefined && (
                    <span className="text-blue-400 ml-2">({dim.networkAvg})</span>
                  )}
                </span>
              </div>
              <div className="relative h-2 bg-ink/10 dark:bg-white/10 rounded-full overflow-hidden">
                {/* Network average line (if showing comparison) */}
                {props.showNetworkComparison && dim.networkAvg !== undefined && (
                  <div
                    className="absolute h-full w-0.5 bg-blue-400 opacity-60 z-10"
                    style={{ left: `${dim.networkAvg}%` }}
                    data-testid="network-average-line"
                  />
                )}
                {/* Grove score bar */}
                <div
                  className="h-full bg-grove-forest transition-all duration-500"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  ScoreDistribution: ({ element }) => {
    const props = element.props as ScoreDistributionProps;

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10" data-testid="score-distribution-chart">
        <span className="text-sm font-medium text-ink dark:text-paper mb-3 block">
          {props.title}
        </span>
        <div className="space-y-2">
          {props.buckets.map((bucket) => (
            <div key={bucket.range} className="flex items-center gap-2" data-testid="distribution-bar">
              <span className="w-12 text-xs text-ink-muted dark:text-paper/60 text-right font-mono">
                {bucket.range}
              </span>
              <div className="flex-1 h-4 bg-ink/10 dark:bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-grove-forest/70 flex items-center justify-end pr-1"
                  style={{ width: `${bucket.percentage}%` }}
                >
                  {bucket.percentage >= 15 && (
                    <span className="text-xs text-white font-mono">
                      {bucket.count}
                    </span>
                  )}
                </div>
              </div>
              <span className="w-10 text-xs text-ink-muted dark:text-paper/60 font-mono" data-testid="distribution-percentage">
                {Math.round(bucket.percentage)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },

  QualityTrendChart: ({ element }) => {
    const props = element.props as QualityTrendChartProps;

    // Simplified line chart visualization
    // For full Recharts integration, this would use LineChart
    const maxValue = Math.max(
      ...props.data.map(d => Math.max(d.groveAvg, d.networkAvg || 0))
    );
    const minValue = Math.min(
      ...props.data.map(d => Math.min(d.groveAvg, d.networkAvg || 100))
    );
    const range = maxValue - minValue || 1;

    const getY = (value: number) => {
      return ((maxValue - value) / range) * 100;
    };

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10" data-testid="quality-trend-chart">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink dark:text-paper">
            {props.title}
          </span>
          {props.percentile && (
            <span className="text-xs text-ink-muted dark:text-paper/60" data-testid="percentile-ranking">
              Your grove is in the <span className="font-bold text-grove-forest">{props.percentile}th</span> percentile
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-grove-forest" />
            <span className="text-ink-muted dark:text-paper/60">Grove Average</span>
          </span>
          {props.showNetworkLine && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 border-t border-dashed border-blue-400" />
              <span className="text-ink-muted dark:text-paper/60">Network Average</span>
            </span>
          )}
        </div>

        {/* Chart area */}
        <div className="relative h-32 border-l border-b border-ink/10 dark:border-white/10">
          {/* Y-axis labels */}
          <div className="absolute -left-8 top-0 text-xs text-ink-muted dark:text-paper/50 font-mono">
            {maxValue.toFixed(0)}
          </div>
          <div className="absolute -left-8 bottom-0 text-xs text-ink-muted dark:text-paper/50 font-mono">
            {minValue.toFixed(0)}
          </div>

          {/* Data points and lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Grove line */}
            <polyline
              fill="none"
              stroke="#2F5C3B"
              strokeWidth="2"
              points={props.data.map((d, i) => {
                const x = (i / (props.data.length - 1 || 1)) * 100;
                const y = getY(d.groveAvg);
                return `${x}%,${y}%`;
              }).join(' ')}
              className="recharts-line"
            />
            {/* Network line (dashed) */}
            {props.showNetworkLine && props.data.some(d => d.networkAvg !== undefined) && (
              <polyline
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                points={props.data.map((d, i) => {
                  const x = (i / (props.data.length - 1 || 1)) * 100;
                  const y = getY(d.networkAvg || minValue);
                  return `${x}%,${y}%`;
                }).join(' ')}
                className="recharts-line"
              />
            )}
          </svg>

          {/* X-axis labels */}
          <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-ink-muted dark:text-paper/50 font-mono">
            {props.data.length > 0 && (
              <>
                <span>{props.data[0]?.date}</span>
                <span>{props.data[props.data.length - 1]?.date}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  },

  PercentileRanking: ({ element }) => {
    const props = element.props as PercentileRankingProps;

    return (
      <div className="p-4 rounded border border-grove-forest/30 bg-grove-forest/5" data-testid="percentile-ranking-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink dark:text-paper">Network Ranking</span>
          <span className="text-2xl font-bold text-grove-forest">
            {props.percentile}<span className="text-sm">th</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-paper/60">Your Grove</span>
            <span className="font-mono text-ink dark:text-paper">{props.groveAvg.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-paper/60">Network Avg</span>
            <span className="font-mono text-blue-400">{props.networkAvg.toFixed(1)}</span>
          </div>
        </div>
        {props.changeFromLast !== undefined && props.changeFromLast !== 0 && (
          <p className={`text-xs mt-2 ${props.changeFromLast > 0 ? 'text-grove-forest' : 'text-red-500'}`}>
            {props.changeFromLast > 0 ? '↑' : '↓'} {Math.abs(props.changeFromLast)} percentile points from last period
          </p>
        )}
      </div>
    );
  },
};

export default QualityAnalyticsRegistry;
