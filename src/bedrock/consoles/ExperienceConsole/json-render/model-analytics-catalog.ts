// src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-catalog.ts
// Sprint: EPIC4-SL-MultiModel v1
// Epic 5: json-render Model Analytics Catalog
// Pattern: json-render catalog (Vercel Labs)

import { z } from 'zod';

/**
 * ModelAnalyticsCatalog - Defines the component vocabulary for model analytics visualization
 *
 * This catalog constrains what components can render model data, ensuring predictable,
 * schema-compliant output. Each component has a Zod schema for validation.
 *
 * Components:
 * - ModelAnalyticsHeader: Title and period selector with model type
 * - ModelMetricCard: Single metric with label, value, and trend
 * - ModelMetricRow: Horizontal row of metric cards
 * - ModelComparisonChart: Side-by-side comparison of models
 * - TierDistributionChart: Distribution of items across tiers
 * - ConversionFunnel: Model-specific progression funnel
 * - PerformanceHeatmap: Performance metrics heatmap
 * - ModelVariantComparison: A/B test variant comparison
 * - TimeSeriesChart: Time-based performance data
 * - ModelSummary: Model overview with key stats
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const ModelAnalyticsHeaderSchema = z.object({
  title: z.string().describe('Title for the model analytics panel'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  modelType: z.enum(['botanical', 'academic', 'research', 'creative']).optional().describe('Model type'),
  modelName: z.string().optional().describe('Model name'),
  period: z.enum(['all_time', 'last_30d', 'last_7d', 'last_24h']).default('last_30d').describe('Aggregation period'),
  lastUpdated: z.string().optional().describe('ISO timestamp of last aggregation'),
});

export const ModelMetricCardSchema = z.object({
  label: z.string().describe('Metric label'),
  value: z.number().describe('Metric value'),
  format: z.enum(['number', 'percent', 'decimal', 'duration']).default('number'),
  trend: z.object({
    direction: z.enum(['up', 'down', 'flat']),
    delta: z.number().optional(),
    period: z.string().optional(),
    deltaPercent: z.number().optional(),
  }).optional(),
  icon: z.string().optional().describe('Icon name (material-symbols)'),
  color: z.enum(['default', 'green', 'red', 'amber', 'blue', 'purple']).default('default'),
  helpText: z.string().optional().describe('Optional help text for the metric'),
});

export const ModelMetricRowSchema = z.object({
  metrics: z.array(ModelMetricCardSchema),
  columns: z.number().min(2).max(6).default(4),
});

export const ModelComparisonSchema = z.object({
  models: z.array(z.object({
    id: z.string(),
    name: z.string(),
    modelType: z.enum(['botanical', 'academic', 'research', 'creative']),
    metrics: z.record(z.string(), z.number()),
    color: z.string().optional(),
  })),
  compareBy: z.array(z.string()).describe('Metric keys to compare'),
});

export const TierDistributionSchema = z.object({
  tiers: z.array(z.object({
    id: z.string(),
    label: z.string(),
    emoji: z.string().optional(),
    count: z.number(),
    percentage: z.number().min(0).max(100),
  })),
  total: z.number(),
});

export const ConversionFunnelSchema = z.object({
  stages: z.array(z.object({
    label: z.string(),
    count: z.number(),
    percentage: z.number().min(0).max(100),
    conversionsFromPrevious: z.number().min(0).max(100).optional(),
  })),
  showConversionRates: z.boolean().default(true),
});

export const PerformanceHeatmapSchema = z.object({
  metrics: z.array(z.object({
    name: z.string(),
    values: z.record(z.string(), z.number()), // modelId -> value
    min: z.number(),
    max: z.number(),
  })),
  models: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['botanical', 'academic', 'research', 'creative']),
  })),
});

export const ModelVariantComparisonSchema = z.object({
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    trafficAllocation: z.number(),
    impressions: z.number(),
    conversions: z.number(),
    conversionRate: z.number(),
    avgEngagementTime: z.number(),
    successRate: z.number(),
  })),
});

export const TimeSeriesDataPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});

export const TimeSeriesChartSchema = z.object({
  series: z.array(z.object({
    name: z.string(),
    data: z.array(TimeSeriesDataPointSchema),
    color: z.string().optional(),
  })),
  yAxisLabel: z.string().optional(),
  showLegend: z.boolean().default(true),
});

export const ModelSummarySchema = z.object({
  modelId: z.string(),
  name: z.string(),
  modelType: z.enum(['botanical', 'academic', 'research', 'creative']),
  version: z.string(),
  tierCount: z.number(),
  totalItems: z.number(),
  activeItems: z.number(),
  avgCompletionTime: z.number().optional(),
  successRate: z.number(),
  createdAt: z.string(),
  lastModified: z.string(),
});

// ============================================================================
// CATALOG DEFINITION
// ============================================================================

export const ModelAnalyticsCatalog = {
  components: {
    ModelAnalyticsHeader: { props: ModelAnalyticsHeaderSchema },
    ModelMetricCard: { props: ModelMetricCardSchema },
    ModelMetricRow: { props: ModelMetricRowSchema },
    ModelComparison: { props: ModelComparisonSchema },
    TierDistribution: { props: TierDistributionSchema },
    ConversionFunnel: { props: ConversionFunnelSchema },
    PerformanceHeatmap: { props: PerformanceHeatmapSchema },
    ModelVariantComparison: { props: ModelVariantComparisonSchema },
    TimeSeriesChart: { props: TimeSeriesChartSchema },
    ModelSummary: { props: ModelSummarySchema },
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ModelAnalyticsCatalogType = typeof ModelAnalyticsCatalog;
export type ModelAnalyticsHeaderProps = z.infer<typeof ModelAnalyticsHeaderSchema>;
export type ModelMetricCardProps = z.infer<typeof ModelMetricCardSchema>;
export type ModelMetricRowProps = z.infer<typeof ModelMetricRowSchema>;
export type ModelComparisonProps = z.infer<typeof ModelComparisonSchema>;
export type TierDistributionProps = z.infer<typeof TierDistributionSchema>;
export type ConversionFunnelProps = z.infer<typeof ConversionFunnelSchema>;
export type PerformanceHeatmapProps = z.infer<typeof PerformanceHeatmapSchema>;
export type ModelVariantComparisonProps = z.infer<typeof ModelVariantComparisonSchema>;
export type TimeSeriesChartProps = z.infer<typeof TimeSeriesChartSchema>;
export type TimeSeriesDataPoint = z.infer<typeof TimeSeriesDataPointSchema>;
export type ModelSummaryProps = z.infer<typeof ModelSummarySchema>;

// ============================================================================
// ELEMENT TYPES (shared with other catalogs)
// ============================================================================

export interface RenderElement<T = unknown> {
  type: string;
  props: T;
}

export interface RenderTree {
  type: 'root';
  children: RenderElement[];
}
