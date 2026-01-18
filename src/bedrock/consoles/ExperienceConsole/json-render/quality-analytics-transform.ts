// src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-transform.ts
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render transform (converts QualityAnalyticsData to renderable tree)

import type { RenderTree, RenderElement, AnalyticsMetricProps, TrendDirection } from './quality-analytics-catalog';
import type { QualityAnalyticsData, TimeRange, TrendData } from '@core/schema/quality-analytics';

/**
 * Transform options for customizing analytics render output
 */
export interface QualityAnalyticsTransformOptions {
  /** Title for the analytics section */
  title?: string;
  /** Time range for display */
  timeRange?: TimeRange;
  /** Show network comparison data */
  showNetworkComparison?: boolean;
  /** Number of columns for metric row (default 4) */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Compact mode - hides less essential components */
  compact?: boolean;
  /** Include percentile ranking card */
  showPercentileRanking?: boolean;
}

const DEFAULT_OPTIONS: QualityAnalyticsTransformOptions = {
  title: 'Quality Analytics',
  timeRange: '30d',
  showNetworkComparison: true,
  columns: 4,
  compact: false,
  showPercentileRanking: true,
};

/**
 * Get trend direction from TrendData
 */
function mapTrendDirection(direction: 'up' | 'down' | 'neutral'): TrendDirection {
  return direction;
}

/**
 * Get metric color based on value and thresholds
 */
function getScoreColor(score: number): 'green' | 'cyan' | 'amber' | 'red' | 'default' {
  if (score >= 80) return 'green';
  if (score >= 60) return 'cyan';
  if (score >= 40) return 'amber';
  if (score > 0) return 'red';
  return 'default';
}

/**
 * Format trend data for metric props
 */
function formatTrend(trend: TrendData | undefined): { direction: TrendDirection; delta: number } | undefined {
  if (!trend) return undefined;
  return {
    direction: mapTrendDirection(trend.direction),
    delta: trend.delta,
  };
}

/**
 * Calculate override rate from counts
 */
function calculateOverrideRate(overrideCount: number, totalAssessed: number): number {
  if (totalAssessed === 0) return 0;
  return (overrideCount / totalAssessed) * 100;
}

/**
 * Transforms QualityAnalyticsData into a json-render tree structure.
 *
 * Components used:
 * - AnalyticsHeader: title, timeRange, lastUpdated
 * - AnalyticsMetricRow: primary metrics (avgScore, totalAssessed, aboveThreshold, overrideCount)
 * - DimensionProfile: bar chart of dimension scores
 * - ScoreDistribution: horizontal bar chart of score buckets
 * - QualityTrendChart: line chart over time
 * - PercentileRanking: network ranking card
 */
export function qualityAnalyticsToRenderTree(
  data: QualityAnalyticsData,
  options: QualityAnalyticsTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  // 1. Header with time range
  children.push({
    type: 'AnalyticsHeader',
    props: {
      title: opts.title || 'Quality Analytics',
      timeRange: opts.timeRange || data.timeRange,
      lastUpdated: data.lastUpdated,
    },
  });

  // 2. Primary metrics row
  const overrideRate = calculateOverrideRate(data.overrideCount, data.totalAssessed);
  const aboveThresholdRate = data.totalAssessed > 0
    ? (data.aboveThreshold / data.totalAssessed) * 100
    : 0;

  const primaryMetrics: AnalyticsMetricProps[] = [
    {
      label: 'Avg Score',
      value: data.avgScore,
      format: 'decimal',
      color: getScoreColor(data.avgScore),
      trend: formatTrend(data.scoreTrend),
    },
    {
      label: 'Assessed',
      value: data.totalAssessed,
      format: 'number',
      color: 'default',
      trend: formatTrend(data.assessedTrend),
    },
    {
      label: 'Above Threshold',
      value: aboveThresholdRate,
      format: 'percent',
      color: aboveThresholdRate >= 70 ? 'green' : aboveThresholdRate >= 50 ? 'cyan' : 'amber',
      trend: formatTrend(data.aboveThresholdTrend),
    },
    {
      label: 'Overrides',
      value: data.overrideCount,
      format: 'number',
      color: overrideRate > 20 ? 'amber' : 'default',
      trend: formatTrend(data.overrideTrend),
    },
  ];

  children.push({
    type: 'AnalyticsMetricRow',
    props: {
      metrics: primaryMetrics,
      columns: opts.columns || 4,
    },
  });

  // 3. Dimension profile (bar visualization)
  if (!opts.compact && data.dimensions && data.dimensions.length > 0) {
    children.push({
      type: 'DimensionProfile',
      props: {
        title: 'Quality Dimensions',
        dimensions: data.dimensions.map(dim => ({
          name: dim.name,
          label: dim.label,
          score: dim.score,
          networkAvg: opts.showNetworkComparison ? dim.networkAvg : undefined,
        })),
        showNetworkComparison: opts.showNetworkComparison && data.dimensions.some(d => d.networkAvg !== undefined),
      },
    });
  }

  // 4. Score distribution chart
  if (!opts.compact && data.distribution && data.distribution.length > 0) {
    children.push({
      type: 'ScoreDistribution',
      props: {
        title: 'Score Distribution',
        buckets: data.distribution.map(bucket => ({
          range: bucket.range,
          count: bucket.count,
          percentage: bucket.percentage,
        })),
      },
    });
  }

  // 5. Quality trend chart
  if (!opts.compact && data.trendData && data.trendData.length > 0) {
    children.push({
      type: 'QualityTrendChart',
      props: {
        title: 'Quality Over Time',
        data: data.trendData.map(point => ({
          date: point.date,
          groveAvg: point.groveAvg,
          networkAvg: opts.showNetworkComparison ? point.networkAvg : undefined,
        })),
        showNetworkLine: opts.showNetworkComparison && data.trendData.some(p => p.networkAvg !== undefined),
        percentile: data.networkPercentile,
      },
    });
  }

  // 6. Percentile ranking card
  if (opts.showPercentileRanking && data.networkPercentile !== undefined && data.networkAvg !== undefined) {
    children.push({
      type: 'PercentileRanking',
      props: {
        percentile: data.networkPercentile,
        groveAvg: data.avgScore,
        networkAvg: data.networkAvg,
      },
    });
  }

  return {
    type: 'root',
    children,
  };
}

/**
 * Creates a minimal render tree for empty analytics state.
 */
export function createEmptyAnalyticsTree(
  options: QualityAnalyticsTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    type: 'root',
    children: [
      {
        type: 'AnalyticsHeader',
        props: {
          title: opts.title || 'Quality Analytics',
          timeRange: opts.timeRange || '30d',
        },
      },
      {
        type: 'AnalyticsMetricRow',
        props: {
          metrics: [
            { label: 'Avg Score', value: 0, format: 'decimal' as const },
            { label: 'Assessed', value: 0, format: 'number' as const },
            { label: 'Above Threshold', value: 0, format: 'percent' as const },
            { label: 'Overrides', value: 0, format: 'number' as const },
          ],
          columns: opts.columns || 4,
        },
      },
    ],
  };
}

/**
 * Creates a dimension-only render element for focused analysis.
 */
export function dimensionBreakdownToElement(
  dimensions: QualityAnalyticsData['dimensions'],
  showNetworkComparison = true
): RenderElement {
  return {
    type: 'DimensionProfile',
    props: {
      title: 'Quality Dimensions',
      dimensions: dimensions.map(dim => ({
        name: dim.name,
        label: dim.label,
        score: dim.score,
        networkAvg: showNetworkComparison ? dim.networkAvg : undefined,
      })),
      showNetworkComparison: showNetworkComparison && dimensions.some(d => d.networkAvg !== undefined),
    },
  };
}

export default qualityAnalyticsToRenderTree;
