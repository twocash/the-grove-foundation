// src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-transform.ts
// Sprint: EPIC4-SL-MultiModel v1
// Epic 5: json-render Model Analytics Transform
// Pattern: json-render transform (converts Model data to renderable tree)

import type { GroveObject } from '@core/schema/grove-object';
import type { LifecycleModelPayload, LifecycleTier } from '@core/schema/lifecycle-model';
import type { VariantPerformanceMetrics } from '@core/schema/feature-flag';
import type {
  RenderTree,
  RenderElement,
  ModelAnalyticsCatalogType,
} from './model-analytics-catalog';

/**
 * Transform options for customizing the render output
 */
export interface ModelAnalyticsTransformOptions {
  /** Show conversion rates in funnel */
  showConversionRates?: boolean;
  /** Maximum tiers to show in distribution */
  tierLimit?: number;
  /** Show legend in charts */
  showLegend?: boolean;
  /** Custom title for the header */
  title?: string;
  /** Period for analytics */
  period?: 'all_time' | 'last_30d' | 'last_7d' | 'last_24h';
}

/** Default transform options */
const DEFAULT_OPTIONS: ModelAnalyticsTransformOptions = {
  showConversionRates: true,
  tierLimit: 10,
  showLegend: true,
  title: 'Model Analytics',
  period: 'last_30d',
};

/**
 * Returns color based on model type
 */
function getModelTypeColor(modelType: string): string {
  const colors: Record<string, string> = {
    botanical: 'var(--semantic-success)',
    academic: 'var(--semantic-info)',
    research: 'var(--neon-violet)',
    creative: 'var(--neon-amber)',
  };
  return colors[modelType] || 'var(--glass-text-muted)';
}

/**
 * Returns color based on metric value relative to average
 */
function getMetricColor(value: number, average: number): 'green' | 'red' | 'default' {
  if (value > average * 1.1) return 'green';
  if (value < average * 0.9) return 'red';
  return 'default';
}

/**
 * Transforms model data into a json-render tree structure.
 *
 * The tree follows the model analytics catalog component vocabulary:
 * - ModelAnalyticsHeader: title, model info, period
 * - ModelSummary: overview with key stats
 * - ModelMetricRow: primary metrics (total items, success rate, etc.)
 * - TierDistribution: distribution across tiers
 * - ConversionFunnel: progression through tiers
 * - TimeSeriesChart: performance over time
 */
export function modelDataToRenderTree(
  model: GroveObject<LifecycleModelPayload>,
  options: ModelAnalyticsTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  const payload = model.payload;
  const meta = model.meta;

  // 1. Header with model info and period
  children.push({
    type: 'ModelAnalyticsHeader',
    props: {
      title: opts.title || 'Model Analytics',
      subtitle: meta.description || undefined,
      modelType: payload.modelType,
      modelName: payload.name,
      period: opts.period,
      lastUpdated: meta.updatedAt,
    },
  });

  // 2. Model Summary
  children.push({
    type: 'ModelSummary',
    props: {
      modelId: meta.id,
      name: payload.name,
      modelType: payload.modelType,
      version: payload.version,
      tierCount: payload.tiers.length,
      totalItems: 0, // TODO: Calculate from actual data
      activeItems: 0, // TODO: Calculate from actual data
      successRate: 0.75, // TODO: Calculate from actual data
      createdAt: meta.createdAt,
      lastModified: meta.updatedAt,
    },
  });

  // 3. Primary metrics row
  children.push({
    type: 'ModelMetricRow',
    props: {
      columns: 4,
      metrics: [
        {
          label: 'Total Items',
          value: 0, // TODO: Calculate from actual data
          format: 'number' as const,
          icon: 'inventory_2',
          color: 'default' as const,
        },
        {
          label: 'Active Items',
          value: 0, // TODO: Calculate from actual data
          format: 'number' as const,
          icon: 'trending_up',
          color: 'green' as const,
        },
        {
          label: 'Success Rate',
          value: 75, // TODO: Calculate from actual data
          format: 'percent' as const,
          icon: 'verified',
          color: 'green' as const,
        },
        {
          label: 'Avg. Completion',
          value: 5.2, // TODO: Calculate from actual data
          format: 'duration' as const,
          icon: 'schedule',
          color: 'default' as const,
          helpText: 'Days to complete',
        },
      ],
    },
  });

  // 4. Tier Distribution Chart
  children.push({
    type: 'TierDistribution',
    props: {
      tiers: payload.tiers.map(tier => ({
        id: tier.id,
        label: tier.label,
        emoji: tier.emoji,
        count: 0, // TODO: Calculate from actual data
        percentage: 0, // TODO: Calculate from actual data
      })),
      total: 0, // TODO: Calculate from actual data
    },
  });

  // 5. Conversion Funnel
  const funnelStages = payload.tiers.map((tier, index) => ({
    label: tier.label,
    count: 0, // TODO: Calculate from actual data
    percentage: 0, // TODO: Calculate from actual data
    conversionsFromPrevious: index > 0 ? 0 : undefined, // TODO: Calculate from actual data
  }));

  children.push({
    type: 'ConversionFunnel',
    props: {
      stages: funnelStages,
      showConversionRates: opts.showConversionRates,
    },
  });

  // 6. Time Series Chart (placeholder)
  children.push({
    type: 'TimeSeriesChart',
    props: {
      series: [
        {
          name: 'Completions',
          data: [], // TODO: Generate from actual time series data
          color: getModelTypeColor(payload.modelType),
        },
      ],
      yAxisLabel: 'Completions',
      showLegend: true,
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Transforms multiple models for comparison
 */
export function modelsComparisonToRenderTree(
  models: Array<GroveObject<LifecycleModelPayload>>,
  options: ModelAnalyticsTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  // 1. Header
  children.push({
    type: 'ModelAnalyticsHeader',
    props: {
      title: 'Model Comparison',
      subtitle: `Comparing ${models.length} models`,
      period: opts.period,
      lastUpdated: new Date().toISOString(),
    },
  });

  // 2. Model Comparison Chart
  children.push({
    type: 'ModelComparison',
    props: {
      models: models.map(model => ({
        id: model.meta.id,
        name: model.payload.name,
        modelType: model.payload.modelType,
        metrics: {
          totalItems: 0, // TODO: Calculate
          successRate: 0.75, // TODO: Calculate
          avgCompletionTime: 5.2, // TODO: Calculate
        },
        color: getModelTypeColor(model.payload.modelType),
      })),
      compareBy: ['totalItems', 'successRate', 'avgCompletionTime'],
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Transforms A/B test variant data for comparison
 */
export function variantComparisonToRenderTree(
  variantPerformance: Record<string, VariantPerformanceMetrics>
): RenderTree {
  const children: RenderElement[] = [];

  // 1. Header
  children.push({
    type: 'ModelAnalyticsHeader',
    props: {
      title: 'Variant Comparison',
      subtitle: 'A/B Test Performance',
      period: 'last_30d',
      lastUpdated: new Date().toISOString(),
    },
  });

  // 2. Variant Comparison
  children.push({
    type: 'ModelVariantComparison',
    props: {
      variants: Object.entries(variantPerformance).map(([variantId, metrics]) => ({
        id: variantId,
        name: variantId,
        trafficAllocation: 50, // TODO: Get from actual variant data
        impressions: metrics.impressions,
        conversions: metrics.conversions,
        conversionRate: metrics.conversionRate,
        avgEngagementTime: metrics.avgEngagementTime,
        successRate: metrics.successRate,
      })),
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Creates an empty render tree
 */
export function createEmptyModelAnalyticsTree(message: string = 'No data available'): RenderTree {
  return {
    type: 'root',
    children: [
      {
        type: 'ModelAnalyticsHeader',
        props: {
          title: 'Model Analytics',
          subtitle: message,
          period: 'last_30d',
        },
      },
    ],
  };
}
