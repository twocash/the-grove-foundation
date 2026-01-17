// src/bedrock/consoles/ExperienceConsole/json-render/index.ts
// Sprint: S6-SL-ObservableSignals v1, EPIC4-SL-MultiModel v1
// Epic 7: json-render Signals Module Exports
// Pattern: json-render (Vercel Labs pattern for AI-generated component trees)

// Signals Catalog - component vocabulary with Zod schemas
export {
  SignalsCatalog,
  SignalHeaderSchema,
  MetricCardSchema,
  MetricRowSchema,
  QualityGaugeSchema,
  DiversityBadgeSchema,
  EventBreakdownSchema,
  EventTypeCountSchema,
  FunnelChartSchema,
  FunnelStageSchema,
  ActivityTimelineSchema,
  AdvancementIndicatorSchema,
} from './signals-catalog';

export type {
  SignalsCatalogType,
  SignalHeaderProps,
  MetricCardProps,
  MetricRowProps,
  QualityGaugeProps,
  DiversityBadgeProps,
  EventBreakdownProps,
  EventTypeCount,
  FunnelChartProps,
  FunnelStageProps,
  ActivityTimelineProps,
  AdvancementIndicatorProps,
  RenderElement,
  RenderTree,
} from './signals-catalog';

// Model Analytics Catalog - component vocabulary with Zod schemas
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
} from './model-analytics-catalog';

// Registry - maps catalog to React components
export { SignalsRegistry } from './signals-registry';
export type { SignalsComponentRegistry } from './signals-registry';

export { ModelAnalyticsRegistry } from './model-analytics-registry';
export type { ComponentRegistry as ModelAnalyticsComponentRegistry } from './model-analytics-registry';

// Transform - converts SignalAggregation to render trees
export {
  signalAggregationToRenderTree,
  createEmptySignalsTree,
  eventsToTimelineElement,
} from './signals-transform';
export type { SignalsTransformOptions } from './signals-transform';

// Transform - converts Model data to render trees
export {
  modelDataToRenderTree,
  modelsComparisonToRenderTree,
  variantComparisonToRenderTree,
  createEmptyModelAnalyticsTree,
} from './model-analytics-transform';
export type { ModelAnalyticsTransformOptions } from './model-analytics-transform';

// Note: Renderer is shared with SproutFinishingRoom/json-render/Renderer.tsx
// Import from there when rendering: import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render'
