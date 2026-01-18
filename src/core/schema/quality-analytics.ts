// src/core/schema/quality-analytics.ts
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Schema for quality analytics data structures

import { QualityDimensions, QualityGrade } from './quality';

/**
 * Time range options for analytics queries
 */
export type TimeRange = '7d' | '30d' | '90d' | 'all';

/**
 * Trend direction indicator
 */
export interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  delta: number;
  percentage?: number;
}

/**
 * Single point on a trend chart
 */
export interface TrendPoint {
  date: string;
  groveAvg: number;
  networkAvg?: number;
}

/**
 * Score distribution bucket
 */
export interface DistributionBucket {
  range: string;
  minScore: number;
  maxScore: number;
  count: number;
  percentage: number;
}

/**
 * Dimension score with network comparison
 */
export interface DimensionAnalytics {
  name: keyof QualityDimensions;
  label: string;
  score: number;
  networkAvg?: number;
}

/**
 * Complete quality analytics data structure
 */
export interface QualityAnalyticsData {
  // Summary metrics
  avgScore: number;
  scoreTrend: TrendData;
  totalAssessed: number;
  assessedTrend: TrendData;
  aboveThreshold: number;
  aboveThresholdTrend: TrendData;
  overrideCount: number;
  overrideTrend: TrendData;

  // Dimension breakdown
  dimensions: DimensionAnalytics[];

  // Distribution by score range
  distribution: DistributionBucket[];

  // Time series data
  trendData: TrendPoint[];

  // Network comparison
  networkPercentile?: number;
  networkAvg?: number;

  // Metadata
  lastUpdated: string;
  timeRange: TimeRange;
}

/**
 * Default distribution buckets
 */
export const DEFAULT_DISTRIBUTION_BUCKETS: Omit<DistributionBucket, 'count' | 'percentage'>[] = [
  { range: '<50', minScore: 0, maxScore: 49 },
  { range: '50-70', minScore: 50, maxScore: 69 },
  { range: '70-85', minScore: 70, maxScore: 84 },
  { range: '85+', minScore: 85, maxScore: 100 },
];

/**
 * Empty analytics state
 */
export const EMPTY_ANALYTICS: QualityAnalyticsData = {
  avgScore: 0,
  scoreTrend: { direction: 'neutral', delta: 0 },
  totalAssessed: 0,
  assessedTrend: { direction: 'neutral', delta: 0 },
  aboveThreshold: 0,
  aboveThresholdTrend: { direction: 'neutral', delta: 0 },
  overrideCount: 0,
  overrideTrend: { direction: 'neutral', delta: 0 },
  dimensions: [],
  distribution: [],
  trendData: [],
  lastUpdated: new Date().toISOString(),
  timeRange: '30d',
};

/**
 * Calculate trend from two values
 */
export function calculateTrend(current: number, previous: number): TrendData {
  const delta = current - previous;
  const percentage = previous !== 0 ? (delta / previous) * 100 : 0;

  return {
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
    delta: Math.abs(delta),
    percentage: Math.abs(percentage),
  };
}

/**
 * Format trend for display
 */
export function formatTrend(trend: TrendData): string {
  if (trend.direction === 'neutral') return '—';
  const sign = trend.direction === 'up' ? '+' : '-';
  return `${sign}${trend.delta.toFixed(1)}`;
}

/**
 * Get trend color class
 */
export function getTrendColor(trend: TrendData, positiveIsGood = true): string {
  if (trend.direction === 'neutral') return 'text-ink/50';
  const isPositive = trend.direction === 'up';
  const isGood = positiveIsGood ? isPositive : !isPositive;
  return isGood ? 'text-green-500' : 'text-red-500';
}

/**
 * Get trend arrow icon
 */
export function getTrendArrow(trend: TrendData): string {
  if (trend.direction === 'up') return '↑';
  if (trend.direction === 'down') return '↓';
  return '→';
}
