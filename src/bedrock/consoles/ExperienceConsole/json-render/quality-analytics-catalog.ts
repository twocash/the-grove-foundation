// src/bedrock/consoles/ExperienceConsole/json-render/quality-analytics-catalog.ts
// Sprint: S19-BD-JsonRenderFactory (migrated from S10.2-SL-AICuration v3)
// Pattern: json-render catalog using factory pattern
// Defines component vocabulary for Quality Analytics Dashboard visualization

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

/**
 * QualityAnalyticsCatalog - Defines the component vocabulary for quality analytics
 *
 * This catalog constrains what components can render quality analytics data, ensuring
 * predictable, schema-compliant output. Each component has a Zod schema for validation.
 *
 * Components:
 * - AnalyticsHeader: Title with time range and last updated
 * - AnalyticsMetricRow: Row of metric cards
 * - DimensionProfile: Radar chart comparing dimensions
 * - ScoreDistribution: Horizontal bar chart of score buckets
 * - QualityTrendChart: Line chart of quality over time
 * - PercentileRanking: Network percentile display
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const AnalyticsHeaderSchema = z.object({
  title: z.string().describe('Dashboard title'),
  timeRange: z.enum(['7d', '30d', '90d', 'all']).describe('Selected time range'),
  lastUpdated: z.string().optional().describe('ISO timestamp of last update'),
});

export const AnalyticsTrendSchema = z.object({
  direction: z.enum(['up', 'down', 'neutral']),
  delta: z.number().optional(),
});

export const AnalyticsMetricSchema = z.object({
  label: z.string().describe('Metric label'),
  value: z.number().describe('Metric value'),
  format: z.enum(['number', 'percent', 'decimal']).default('number'),
  trend: AnalyticsTrendSchema.optional(),
  color: z.enum(['default', 'green', 'cyan', 'amber', 'red']).default('default'),
  icon: z.string().optional().describe('Lucide icon name'),
});

export const AnalyticsMetricRowSchema = z.object({
  metrics: z.array(AnalyticsMetricSchema),
  columns: z.number().min(2).max(6).default(4),
});

export const DimensionDataPointSchema = z.object({
  name: z.string().describe('Dimension name (accuracy, utility, novelty, provenance)'),
  label: z.string().describe('Display label'),
  score: z.number().min(0).max(100).describe('Grove score'),
  networkAvg: z.number().min(0).max(100).optional().describe('Network average'),
});

export const DimensionProfileSchema = z.object({
  dimensions: z.array(DimensionDataPointSchema),
  showNetworkComparison: z.boolean().default(true),
  title: z.string().default('Dimension Profile'),
});

export const DistributionBucketSchema = z.object({
  range: z.string().describe('Bucket range label'),
  count: z.number().describe('Number of items in bucket'),
  percentage: z.number().min(0).max(100).describe('Percentage of total'),
});

export const ScoreDistributionSchema = z.object({
  buckets: z.array(DistributionBucketSchema),
  title: z.string().default('Score Distribution'),
});

export const TrendPointSchema = z.object({
  date: z.string().describe('Date string'),
  groveAvg: z.number().describe('Grove average score'),
  networkAvg: z.number().optional().describe('Network average score'),
});

export const QualityTrendChartSchema = z.object({
  data: z.array(TrendPointSchema),
  percentile: z.number().optional().describe('Network percentile ranking'),
  title: z.string().default('Quality Trend'),
  showNetworkLine: z.boolean().default(true),
});

export const PercentileRankingSchema = z.object({
  percentile: z.number().min(0).max(100).describe('Percentile ranking'),
  groveAvg: z.number().describe('Grove average'),
  networkAvg: z.number().describe('Network average'),
  changeFromLast: z.number().optional().describe('Change from previous period'),
});

// ============================================================================
// CATALOG DEFINITION (using factory pattern)
// ============================================================================

export const QualityAnalyticsCatalog: CatalogDefinition = createCatalog({
  name: 'quality-analytics',
  version: '2.0.0',
  components: {
    AnalyticsHeader: {
      props: AnalyticsHeaderSchema,
      category: 'data',
      description: 'Dashboard title with time range and last updated',
      agentHint: 'Use at the top of quality analytics dashboards',
    },
    AnalyticsMetricRow: {
      props: AnalyticsMetricRowSchema,
      category: 'layout',
      description: 'Horizontal row of metric cards in a grid',
      agentHint: 'Group related quality metrics in a horizontal layout',
    },
    DimensionProfile: {
      props: DimensionProfileSchema,
      category: 'data',
      description: 'Radar chart comparing quality dimensions',
      agentHint: 'Show dimension scores with optional network comparison',
    },
    ScoreDistribution: {
      props: ScoreDistributionSchema,
      category: 'data',
      description: 'Horizontal bar chart of score distribution buckets',
      agentHint: 'Display score distribution across buckets',
    },
    QualityTrendChart: {
      props: QualityTrendChartSchema,
      category: 'data',
      description: 'Line chart of quality scores over time',
      agentHint: 'Show quality trends with optional network comparison line',
    },
    PercentileRanking: {
      props: PercentileRankingSchema,
      category: 'data',
      description: 'Network percentile ranking display',
      agentHint: 'Show percentile position relative to network average',
    },
  },
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type QualityAnalyticsCatalogType = typeof QualityAnalyticsCatalog;
export type AnalyticsHeaderProps = z.infer<typeof AnalyticsHeaderSchema>;
export type AnalyticsTrendProps = z.infer<typeof AnalyticsTrendSchema>;
export type AnalyticsMetricProps = z.infer<typeof AnalyticsMetricSchema>;
export type AnalyticsMetricRowProps = z.infer<typeof AnalyticsMetricRowSchema>;
export type DimensionDataPointProps = z.infer<typeof DimensionDataPointSchema>;
export type DimensionProfileProps = z.infer<typeof DimensionProfileSchema>;
export type DistributionBucketProps = z.infer<typeof DistributionBucketSchema>;
export type ScoreDistributionProps = z.infer<typeof ScoreDistributionSchema>;
export type TrendPointProps = z.infer<typeof TrendPointSchema>;
export type QualityTrendChartProps = z.infer<typeof QualityTrendChartSchema>;
export type PercentileRankingProps = z.infer<typeof PercentileRankingSchema>;

// ============================================================================
// BACKWARD COMPATIBILITY: Re-export core types
// ============================================================================

// Re-export RenderElement and RenderTree from core for consumers who imported
// from this file. New code should import directly from '@core/json-render'.
export type { RenderElement, RenderTree } from '@core/json-render';
