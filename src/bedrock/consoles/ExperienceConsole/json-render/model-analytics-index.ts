// src/bedrock/consoles/ExperienceConsole/json-render/model-analytics-index.ts
// Sprint: EPIC4-SL-MultiModel v1
// Epic 5: json-render Model Analytics Module Exports
// Pattern: json-render (Vercel Labs pattern for AI-generated component trees)

// Catalog - component vocabulary with Zod schemas
export {
  ModelAnalyticsCatalog,
  ModelAnalyticsHeaderSchema,
  ModelMetricCardSchema,
  ModelMetricRowSchema,
  ModelComparisonSchema,
  TierDistributionSchema,
  ConversionFunnelSchema,
  PerformanceHeatmapSchema,
  ModelVariantComparisonSchema,
  TimeSeriesChartSchema,
  ModelSummarySchema,
} from './model-analytics-catalog';

export type {
  ModelAnalyticsCatalogType,
  ModelAnalyticsHeaderProps,
  ModelMetricCardProps,
  ModelMetricRowProps,
  ModelComparisonProps,
  TierDistributionProps,
  ConversionFunnelProps,
  PerformanceHeatmapProps,
  ModelVariantComparisonProps,
  TimeSeriesChartProps,
  TimeSeriesDataPoint,
  ModelSummaryProps,
  RenderElement,
  RenderTree,
} from './model-analytics-catalog';

// Registry - maps catalog to React components
export { ModelAnalyticsRegistry } from './model-analytics-registry';
export type { ComponentRegistry as ModelAnalyticsComponentRegistry } from './model-analytics-registry';

// Transform - converts model data to render trees
export {
  modelDataToRenderTree,
  modelsComparisonToRenderTree,
  variantComparisonToRenderTree,
  createEmptyModelAnalyticsTree,
} from './model-analytics-transform';
export type { ModelAnalyticsTransformOptions } from './model-analytics-transform';
