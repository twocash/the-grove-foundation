// src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-registry.tsx
// Sprint: EPIC4-SL-MultiModel v1
// Epic 5: json-render Model Analytics Registry
// Pattern: json-render registry (maps catalog to React components)

import React from 'react';
import type {
  RenderElement,
  ModelAnalyticsHeaderProps,
  ModelMetricCardProps,
  ModelMetricRowProps,
  ModelComparisonProps,
  TierDistributionProps,
  ConversionFunnelProps,
  PerformanceHeatmapProps,
  ModelVariantComparisonProps,
  TimeSeriesChartProps,
  ModelSummaryProps,
} from './model-analytics-catalog';

/**
 * Component registry interface
 */
export interface ComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * ModelAnalyticsRegistry - Maps catalog components to React implementations
 *
 * Each component receives the full element object with type and props.
 * This allows for consistent rendering across the analytics dashboard.
 */
export const ModelAnalyticsRegistry: ComponentRegistry = {
  ModelAnalyticsHeader: ({ element }) => {
    const props = element.props as ModelAnalyticsHeaderProps;

    const getModelTypeColor = (type?: string) => {
      const colors: Record<string, string> = {
        botanical: 'text-emerald-400',
        academic: 'text-blue-400',
        research: 'text-violet-400',
        creative: 'text-amber-400',
      };
      return colors[type || ''] || 'text-gray-400';
    };

    return (
      <div className="mb-6 pb-4 border-b border-[var(--glass-border)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-1">
              {props.title}
            </h2>
            {props.subtitle && (
              <p className="text-sm text-[var(--glass-text-secondary)] mb-2">
                {props.subtitle}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-[var(--glass-text-muted)]">
              {props.modelType && (
                <span className={`px-2 py-1 rounded-full bg-[var(--glass-elevated)] ${getModelTypeColor(props.modelType)}`}>
                  {props.modelType}
                </span>
              )}
              {props.modelName && (
                <span className="font-mono">{props.modelName}</span>
              )}
              <span>Period: {props.period.replace('_', ' ')}</span>
            </div>
          </div>
          {props.lastUpdated && (
            <div className="text-xs text-[var(--glass-text-muted)]">
              Updated: {new Date(props.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  },

  ModelMetricCard: ({ element }) => {
    const props = element.props as ModelMetricCardProps;

    const formatValue = (value: number, format: string) => {
      switch (format) {
        case 'percent':
          return `${(value * 100).toFixed(1)}%`;
        case 'duration':
          return `${value.toFixed(1)} days`;
        case 'decimal':
          return value.toFixed(2);
        default:
          return value.toLocaleString();
      }
    };

    const getTrendIcon = (direction?: string) => {
      switch (direction) {
        case 'up':
          return 'trending_up';
        case 'down':
          return 'trending_down';
        default:
          return 'trending_flat';
      }
    };

    const getTrendColor = (direction?: string) => {
      switch (direction) {
        case 'up':
          return 'text-green-400';
        case 'down':
          return 'text-red-400';
        default:
          return 'text-gray-400';
      }
    };

    const getCardColor = (color?: string) => {
      const colors: Record<string, string> = {
        green: 'border-emerald-500/30 bg-emerald-500/5',
        red: 'border-red-500/30 bg-red-500/5',
        amber: 'border-amber-500/30 bg-amber-500/5',
        blue: 'border-blue-500/30 bg-blue-500/5',
        purple: 'border-purple-500/30 bg-purple-500/5',
        default: 'border-[var(--glass-border)] bg-[var(--glass-elevated)]',
      };
      return colors[color || 'default'] || colors.default;
    };

    return (
      <div className={`p-4 rounded-lg border ${getCardColor(props.color)} transition-all hover:border-[var(--glass-border-bright)]`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-[var(--glass-text-secondary)] text-sm font-medium">
            {props.label}
          </span>
          {props.icon && (
            <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
              {props.icon}
            </span>
          )}
        </div>
        <div className="mb-2">
          <span className="text-2xl font-semibold text-[var(--glass-text-primary)]">
            {formatValue(props.value, props.format)}
          </span>
        </div>
        {props.trend && (
          <div className="flex items-center gap-1 text-xs">
            <span className={`material-symbols-outlined text-sm ${getTrendColor(props.trend.direction)}`}>
              {getTrendIcon(props.trend.direction)}
            </span>
            <span className={getTrendColor(props.trend.direction)}>
              {props.trend.deltaPercent ? `${props.trend.deltaPercent.toFixed(1)}%` : ''}
            </span>
            {props.trend.period && (
              <span className="text-[var(--glass-text-muted)]">
                {' '}({props.trend.period})
              </span>
            )}
          </div>
        )}
        {props.helpText && (
          <p className="text-xs text-[var(--glass-text-muted)] mt-2">
            {props.helpText}
          </p>
        )}
      </div>
    );
  },

  ModelMetricRow: ({ element }) => {
    const props = element.props as ModelMetricRowProps;
    const columns = `grid-cols-${Math.min(props.columns, 6)}`;

    return (
      <div className={`grid ${columns} gap-4 mb-6`}>
        {props.metrics.map((metric, idx) => (
          <ModelAnalyticsRegistry.ModelMetricCard
            key={idx}
            element={{ type: 'ModelMetricCard', props: metric }}
          />
        ))}
      </div>
    );
  },

  ModelComparison: ({ element }) => {
    const props = element.props as ModelComparisonProps;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
          Model Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="text-left py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Model
                </th>
                {props.compareBy.map(metric => (
                  <th key={metric} className="text-right py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                    {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.models.map(model => (
                <tr key={model.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-elevated)]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: model.color || '#6b7280' }}
                      />
                      <span className="text-[var(--glass-text-primary)] font-medium">
                        {model.name}
                      </span>
                    </div>
                  </td>
                  {props.compareBy.map(metric => (
                    <td key={metric} className="text-right py-3 px-4 text-[var(--glass-text-primary)]">
                      {model.metrics[metric]?.toFixed(2) || '0.00'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  TierDistribution: ({ element }) => {
    const props = element.props as TierDistributionProps;

    // Helper to sanitize emoji: if it looks like SVG markup, use fallback
    const sanitizeEmoji = (emoji: string | undefined): string => {
      if (!emoji) return '📊';
      if (emoji.startsWith('<svg') || emoji.includes('<path')) return '📊';
      return emoji;
    };

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
          Tier Distribution
        </h3>
        <div className="space-y-3">
          {props.tiers.map(tier => (
            <div key={tier.id} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xl">{sanitizeEmoji(tier.emoji)}</span>
                <span className="text-[var(--glass-text-primary)] font-medium">
                  {tier.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--glass-text-secondary)]">
                  {tier.count.toLocaleString()}
                </span>
                <span className="text-[var(--glass-text-muted)]">
                  ({tier.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  ConversionFunnel: ({ element }) => {
    const props = element.props as ConversionFunnelProps;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
          Conversion Funnel
        </h3>
        <div className="space-y-2">
          {props.stages.map((stage, idx) => (
            <div key={idx} className="relative">
              <div
                className="h-12 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg flex items-center justify-between px-4"
                style={{
                  width: `${stage.percentage}%`,
                  minWidth: '200px',
                }}
              >
                <span className="text-[var(--glass-text-primary)] font-medium">
                  {stage.label}
                </span>
                <div className="text-right">
                  <span className="text-[var(--glass-text-primary)] font-semibold">
                    {stage.count.toLocaleString()}
                  </span>
                  {props.showConversionRates && (
                    <span className="text-[var(--glass-text-muted)] text-sm ml-2">
                      ({stage.percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  PerformanceHeatmap: ({ element }) => {
    const props = element.props as PerformanceHeatmapProps;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
          Performance Heatmap
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Metric
                </th>
                {props.models.map(model => (
                  <th key={model.id} className="text-center py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                    {model.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.metrics.map(metric => (
                <tr key={metric.name} className="border-b border-[var(--glass-border)]">
                  <td className="py-3 px-4 text-[var(--glass-text-primary)] font-medium">
                    {metric.name}
                  </td>
                  {props.models.map(model => {
                    const value = metric.values[model.id];
                    const normalized = (value - metric.min) / (metric.max - metric.min);
                    const intensity = Math.max(0.2, normalized);

                    return (
                      <td
                        key={model.id}
                        className="py-3 px-4 text-center text-[var(--glass-text-primary)]"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${intensity})`,
                        }}
                      >
                        {value?.toFixed(2) || '0.00'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  ModelVariantComparison: ({ element }) => {
    const props = element.props as ModelVariantComparisonProps;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
          Variant Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="text-left py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Variant
                </th>
                <th className="text-right py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Traffic
                </th>
                <th className="text-right py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Impressions
                </th>
                <th className="text-right py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Conversions
                </th>
                <th className="text-right py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  CR
                </th>
                <th className="text-right py-3 px-4 text-[var(--glass-text-secondary)] font-medium">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody>
              {props.variants.map(variant => (
                <tr key={variant.id} className="border-b border-[var(--glass-border)] hover:bg-[var(--glass-elevated)]">
                  <td className="py-3 px-4 text-[var(--glass-text-primary)] font-medium">
                    {variant.name}
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--glass-text-primary)]">
                    {variant.trafficAllocation.toFixed(1)}%
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--glass-text-primary)]">
                    {variant.impressions.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--glass-text-primary)]">
                    {variant.conversions.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--glass-text-primary)]">
                    {(variant.conversionRate * 100).toFixed(2)}%
                  </td>
                  <td className="text-right py-3 px-4 text-[var(--glass-text-primary)]">
                    {(variant.avgEngagementTime / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },

  TimeSeriesChart: ({ element }) => {
    const props = element.props as TimeSeriesChartProps;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-4">
          Performance Over Time
        </h3>
        <div className="h-64 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg flex items-center justify-center">
          <p className="text-[var(--glass-text-muted)]">
            Time series chart placeholder - Implement with charting library
          </p>
        </div>
      </div>
    );
  },

  ModelSummary: ({ element }) => {
    const props = element.props as ModelSummaryProps;

    const getModelTypeColor = (type: string) => {
      const colors: Record<string, string> = {
        botanical: 'text-emerald-400',
        academic: 'text-blue-400',
        research: 'text-violet-400',
        creative: 'text-amber-400',
      };
      return colors[type] || 'text-gray-400';
    };

    return (
      <div className="mb-6 p-4 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--glass-text-primary)] mb-1">
              {props.name}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={`${getModelTypeColor(props.modelType)}`}>
                {props.modelType}
              </span>
              <span className="text-[var(--glass-text-muted)]">•</span>
              <span className="text-[var(--glass-text-muted)] font-mono">
                v{props.version}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-[var(--glass-text-muted)]">
            <div>Created: {new Date(props.createdAt).toLocaleDateString()}</div>
            <div>Modified: {new Date(props.lastModified).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[var(--glass-text-muted)]">Tiers</div>
            <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
              {props.tierCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--glass-text-muted)]">Total Items</div>
            <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
              {props.totalItems.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--glass-text-muted)]">Active</div>
            <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
              {props.activeItems.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--glass-text-muted)]">Success Rate</div>
            <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
              {(props.successRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export type ModelAnalyticsComponentRegistry = ComponentRegistry;
