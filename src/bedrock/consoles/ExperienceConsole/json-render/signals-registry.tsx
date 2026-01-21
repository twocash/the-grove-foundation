// src/bedrock/consoles/ExperienceConsole/json-render/signals-registry.tsx
// Sprint: S6-SL-ObservableSignals v1
// Epic 7: json-render Signals Registry
// Pattern: json-render registry (maps catalog to React components)

import React from 'react';
import type {
  RenderElement,
  SignalHeaderProps,
  MetricCardProps,
  MetricRowProps,
  QualityGaugeProps,
  DiversityBadgeProps,
  EventBreakdownProps,
  FunnelChartProps,
  ActivityTimelineProps,
  AdvancementIndicatorProps,
} from './signals-catalog';

/**
 * Component registry interface
 */
export interface SignalsComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * Period display names
 */
const PERIOD_LABELS: Record<string, string> = {
  all_time: 'All Time',
  last_30d: 'Last 30 Days',
  last_7d: 'Last 7 Days',
};

/**
 * Event type display names and colors
 */
const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  sprout_viewed: { label: 'Views', color: 'var(--semantic-info)' },
  sprout_retrieved: { label: 'Retrievals', color: 'rgb(168, 85, 247)' }, // purple-500
  sprout_referenced: { label: 'References', color: 'rgb(99, 102, 241)' }, // indigo-500
  sprout_searched: { label: 'Searches', color: 'var(--neon-cyan)' },
  sprout_rated: { label: 'Ratings', color: 'var(--semantic-warning)' },
  sprout_exported: { label: 'Exports', color: 'var(--semantic-success)' },
  sprout_promoted: { label: 'Promotions', color: 'var(--semantic-success)' },
  sprout_refined: { label: 'Refinements', color: 'var(--semantic-info)' },
};

/**
 * SignalsRegistry - Maps catalog components to React implementations
 */
export const SignalsRegistry: SignalsComponentRegistry = {
  SignalHeader: ({ element }) => {
    const props = element.props as SignalHeaderProps;
    return (
      <header className="mb-4 pb-3 border-b border-ink/10 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink dark:text-paper">
              {props.title}
            </h2>
            {props.subtitle && (
              <p className="text-sm text-ink-muted dark:text-paper/60">
                {props.subtitle}
              </p>
            )}
          </div>
          <span className="px-2 py-1 text-xs font-mono bg-ink/5 dark:bg-white/10 rounded">
            {PERIOD_LABELS[props.period] || props.period}
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

  MetricCard: ({ element }) => {
    const props = element.props as MetricCardProps;
    const colorStyles: Record<string, React.CSSProperties> = {
      default: { borderColor: 'var(--glass-border)' },
      green: { borderColor: 'var(--semantic-success-border)', backgroundColor: 'var(--semantic-success-bg)' },
      red: { borderColor: 'var(--semantic-error-border)', backgroundColor: 'var(--semantic-error-bg)' },
      amber: { borderColor: 'var(--semantic-warning-border)', backgroundColor: 'var(--semantic-warning-bg)' },
      blue: { borderColor: 'var(--semantic-info-border)', backgroundColor: 'var(--semantic-info-bg)' },
    };

    const formatValue = (val: number): string => {
      switch (props.format) {
        case 'percent':
          return `${Math.round(val * 100)}%`;
        case 'decimal':
          return val.toFixed(2);
        default:
          return val.toLocaleString();
      }
    };

    return (
      <div className="p-3 rounded border" style={colorStyles[props.color || 'default']}>
        <p className="text-xs text-ink-muted dark:text-paper/60 uppercase font-mono mb-1">
          {props.label}
        </p>
        <p className="text-2xl font-bold text-ink dark:text-paper">
          {formatValue(props.value)}
        </p>
        {props.trend && (
          <p
            className="text-xs mt-1"
            style={{
              color: props.trend.direction === 'up' ? 'var(--semantic-success)' :
                     props.trend.direction === 'down' ? 'var(--semantic-error)' : 'var(--glass-text-muted)'
            }}
          >
            {props.trend.direction === 'up' ? '↑' : props.trend.direction === 'down' ? '↓' : '→'}
            {props.trend.delta !== undefined && ` ${props.trend.delta > 0 ? '+' : ''}${props.trend.delta}`}
            {props.trend.period && ` (${props.trend.period})`}
          </p>
        )}
      </div>
    );
  },

  MetricRow: ({ element }) => {
    const props = element.props as MetricRowProps;
    const gridCols = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };
    return (
      <div className={`grid gap-3 mb-4 ${gridCols[props.columns as keyof typeof gridCols] || 'grid-cols-4'}`}>
        {props.metrics.map((metric, i) => (
          <SignalsRegistry.MetricCard
            key={i}
            element={{ type: 'MetricCard', props: metric }}
          />
        ))}
      </div>
    );
  },

  QualityGauge: ({ element }) => {
    const props = element.props as QualityGaugeProps;
    const thresholds = props.thresholds || { low: 0.3, medium: 0.6, high: 0.8 };
    const percentage = Math.round(props.score * 100);

    let barColor = 'var(--semantic-error)';
    let statusLabel = 'Low';
    let badgeStyle: React.CSSProperties = { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' };
    if (props.score >= thresholds.high) {
      barColor = 'var(--semantic-success)';
      statusLabel = 'Excellent';
      badgeStyle = { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' };
    } else if (props.score >= thresholds.medium) {
      barColor = 'var(--semantic-warning)';
      statusLabel = 'Good';
      badgeStyle = { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' };
    } else if (props.score >= thresholds.low) {
      barColor = 'var(--neon-amber)';
      statusLabel = 'Fair';
      badgeStyle = { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--neon-amber)' };
    }

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink dark:text-paper">
            {props.label}
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded" style={badgeStyle}>
            {statusLabel}
          </span>
        </div>
        <div className="h-3 bg-ink/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="mt-1 text-right text-sm font-bold text-ink dark:text-paper">
          {percentage}%
        </p>
      </div>
    );
  },

  DiversityBadge: ({ element }) => {
    const props = element.props as DiversityBadgeProps;
    const percentage = Math.round(props.index * 100);

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink dark:text-paper">
            Diversity Index
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--semantic-success)' }}>
            {percentage}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-paper/60">Sessions</span>
            <span className="font-mono text-ink dark:text-paper">{props.breakdown.uniqueSessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-paper/60">Lenses</span>
            <span className="font-mono text-ink dark:text-paper">{props.breakdown.uniqueLenses}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted dark:text-paper/60">Hubs</span>
            <span className="font-mono text-ink dark:text-paper">{props.breakdown.uniqueHubs}</span>
          </div>
          {props.breakdown.uniqueUsers !== undefined && (
            <div className="flex justify-between">
              <span className="text-ink-muted dark:text-paper/60">Users</span>
              <span className="font-mono text-ink dark:text-paper">{props.breakdown.uniqueUsers}</span>
            </div>
          )}
        </div>
      </div>
    );
  },

  EventBreakdown: ({ element }) => {
    const props = element.props as EventBreakdownProps;

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink dark:text-paper">
            Event Breakdown
          </span>
          <span className="text-xs text-ink-muted dark:text-paper/60 font-mono">
            Total: {props.total.toLocaleString()}
          </span>
        </div>
        <div className="space-y-2">
          {props.events.map((event) => {
            const config = EVENT_TYPE_CONFIG[event.type] || { label: event.type, color: 'var(--glass-text-muted)' };
            const pct = props.total > 0 ? (event.count / props.total) * 100 : 0;

            return (
              <div key={event.type} className="flex items-center gap-2">
                <div className="w-20 text-xs text-ink-muted dark:text-paper/60 truncate">
                  {config.label}
                </div>
                <div className="flex-1 h-2 bg-ink/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, backgroundColor: config.color }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-mono text-ink dark:text-paper">
                  {event.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },

  FunnelChart: ({ element }) => {
    const props = element.props as FunnelChartProps;

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10">
        <span className="text-sm font-medium text-ink dark:text-paper mb-3 block">
          Stage Conversion Funnel
        </span>
        <div className="space-y-2">
          {props.stages.map((stage, index) => {
            const nextStage = props.stages[index + 1];
            const conversionRate = nextStage && stage.count > 0
              ? Math.round((nextStage.count / stage.count) * 100)
              : null;

            return (
              <div key={stage.stage}>
                <div className="flex items-center gap-2">
                  <div className="w-24 text-xs text-ink-muted dark:text-paper/60">
                    {stage.label}
                  </div>
                  <div className="flex-1 h-6 bg-ink/5 dark:bg-white/5 rounded overflow-hidden relative">
                    <div
                      className="h-full flex items-center justify-end pr-2"
                      style={{ width: `${stage.percentage}%`, backgroundColor: 'color-mix(in srgb, var(--semantic-success) 60%, transparent)' }}
                    >
                      <span className="text-xs font-mono text-white drop-shadow">
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs font-mono text-ink-muted dark:text-paper/60">
                    {Math.round(stage.percentage)}%
                  </span>
                </div>
                {props.showConversionRates && conversionRate !== null && (
                  <div className="ml-24 pl-2 text-xs text-ink-muted dark:text-paper/50 my-1">
                    ↓ {conversionRate}% conversion
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },

  ActivityTimeline: ({ element }) => {
    const props = element.props as ActivityTimelineProps;

    return (
      <div className="mb-4 p-4 rounded border border-ink/10 dark:border-white/10">
        <span className="text-sm font-medium text-ink dark:text-paper mb-3 block">
          Recent Activity
        </span>
        {props.events.length === 0 ? (
          <p className="text-xs text-ink-muted dark:text-paper/50 italic">
            No recent events
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {props.events.slice(0, props.limit).map((event, i) => {
              const config = EVENT_TYPE_CONFIG[event.type] || { label: event.type, color: 'var(--glass-text-muted)' };
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-ink dark:text-paper">{config.label}</span>
                  <span className="text-ink-muted dark:text-paper/50 flex-1 truncate">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },

  AdvancementIndicator: ({ element }) => {
    const props = element.props as AdvancementIndicatorProps;

    return (
      <div
        className="mb-4 p-4 rounded border"
        style={props.eligible
          ? { borderColor: 'var(--semantic-success-border)', backgroundColor: 'var(--semantic-success-bg)' }
          : {}
        }
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-ink dark:text-paper">
            Advancement Status
          </span>
          <span
            className="px-2 py-0.5 rounded text-xs font-mono"
            style={props.eligible
              ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
              : { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
            }
          >
            {props.eligible ? 'Eligible' : 'Not Yet Eligible'}
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span style={{ color: props.criteria.viewCountMet ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}>
              {props.criteria.viewCountMet ? '✓' : '○'}
            </span>
            <span className="text-ink dark:text-paper">View count threshold</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: props.criteria.qualityScoreMet ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}>
              {props.criteria.qualityScoreMet ? '✓' : '○'}
            </span>
            <span className="text-ink dark:text-paper">Quality score threshold</span>
          </div>
          {props.criteria.diversityMet !== undefined && (
            <div className="flex items-center gap-2">
              <span style={{ color: props.criteria.diversityMet ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}>
                {props.criteria.diversityMet ? '✓' : '○'}
              </span>
              <span className="text-ink dark:text-paper">Diversity requirement</span>
            </div>
          )}
          {props.criteria.daysActiveMet !== undefined && (
            <div className="flex items-center gap-2">
              <span style={{ color: props.criteria.daysActiveMet ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}>
                {props.criteria.daysActiveMet ? '✓' : '○'}
              </span>
              <span className="text-ink dark:text-paper">Activity duration</span>
            </div>
          )}
        </div>
        {props.nextTier && (
          <p className="mt-2 text-xs text-ink-muted dark:text-paper/50">
            Next tier: <span className="font-mono" style={{ color: 'var(--semantic-success)' }}>{props.nextTier}</span>
          </p>
        )}
      </div>
    );
  },
};

export default SignalsRegistry;
