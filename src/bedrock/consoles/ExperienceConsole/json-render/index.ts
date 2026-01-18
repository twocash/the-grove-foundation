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

// Attribution Catalog - component vocabulary with Zod schemas
export {
  AttributionCatalog,
  AttributionHeaderSchema,
  TokenBalanceCardSchema,
  ReputationCardSchema,
  ReputationTierSchema,
  TierProgressBarSchema,
  BadgeRaritySchema,
  BadgeCategorySchema,
  BadgeItemSchema,
  BadgeGridSchema,
  AttributionEventItemSchema,
  RecentActivityListSchema,
  BadgeCategoryStatsSchema,
  BadgeRarityStatsSchema,
  BadgeStatsSummarySchema,
  MetricsRowSchema,
} from './attribution-catalog';

export type {
  AttributionCatalogType,
  AttributionHeaderProps,
  TokenBalanceCardProps,
  ReputationCardProps,
  ReputationTier as AttributionReputationTier,
  TierProgressBarProps,
  BadgeRarity,
  BadgeCategory,
  BadgeItemProps,
  BadgeGridProps,
  AttributionEventItemProps,
  RecentActivityListProps,
  BadgeCategoryStatsProps,
  BadgeRarityStatsProps,
  BadgeStatsSummaryProps,
  MetricsRowProps as AttributionMetricsRowProps,
  RenderElement as AttributionRenderElement,
  RenderTree as AttributionRenderTree,
} from './attribution-catalog';

// Attribution Registry - maps catalog to React components
export { AttributionRegistry } from './attribution-registry';
export type { AttributionComponentRegistry } from './attribution-registry';

// Attribution Transform - converts attribution data to render trees
export {
  attributionDataToRenderTree,
  createEmptyAttributionTree,
  createCompactAttributionTree,
} from './attribution-transform';
export type { AttributionTransformOptions } from './attribution-transform';

// ============================================================================
// S10.2-SL-AICuration v3 - Quality Analytics, Score Attribution, Override History
// ============================================================================

// Quality Analytics Catalog - component vocabulary with Zod schemas
export {
  QualityAnalyticsCatalog,
  AnalyticsHeaderSchema,
  AnalyticsMetricRowSchema,
  DimensionProfileSchema,
  ScoreDistributionSchema,
  QualityTrendChartSchema,
  PercentileRankingSchema,
} from './quality-analytics-catalog';

export type {
  QualityAnalyticsCatalogType,
  AnalyticsHeaderProps,
  AnalyticsMetricRowProps,
  AnalyticsMetricProps,
  TrendDirection,
  DimensionProfileProps,
  ScoreDistributionProps,
  QualityTrendChartProps,
  PercentileRankingProps,
  RenderElement as QualityAnalyticsRenderElement,
  RenderTree as QualityAnalyticsRenderTree,
} from './quality-analytics-catalog';

// Quality Analytics Registry - maps catalog to React components
export { QualityAnalyticsRegistry } from './quality-analytics-registry';
export type { QualityAnalyticsComponentRegistry } from './quality-analytics-registry';

// Quality Analytics Transform - converts analytics data to render trees
export {
  qualityAnalyticsToRenderTree,
  createEmptyAnalyticsTree,
  dimensionBreakdownToElement,
} from './quality-analytics-transform';
export type { QualityAnalyticsTransformOptions } from './quality-analytics-transform';

// Score Attribution Catalog - component vocabulary with Zod schemas
// NOTE: Distinct from AttributionCatalog (tokens/badges). This is for "Why This Score?" panel.
export {
  ScoreAttributionCatalog,
  ScoreAttributionHeaderSchema,
  StarRatingSchema,
  AttributionDimensionSchema,
  AttributionOverrideCtaSchema,
  AttributionMetadataSchema,
  EDUCATIONAL_TONE_GUIDELINES,
} from './score-attribution-catalog';

export type {
  ScoreAttributionCatalogType,
  ScoreAttributionHeaderProps,
  StarRatingProps,
  AttributionDimensionProps,
  AttributionOverrideCtaProps,
  AttributionMetadataProps,
  RenderElement as ScoreAttributionRenderElement,
  RenderTree as ScoreAttributionRenderTree,
} from './score-attribution-catalog';

// Score Attribution Registry - maps catalog to React components
export { ScoreAttributionRegistry } from './score-attribution-registry';
export type { ScoreAttributionComponentRegistry } from './score-attribution-registry';

// Score Attribution Transform - converts attribution data to render trees
export {
  scoreAttributionToRenderTree,
  createPendingAttributionTree,
  dimensionToElement,
} from './score-attribution-transform';
export type {
  ScoreAttributionTransformOptions,
  ScoreAttributionData,
  DimensionAttribution,
} from './score-attribution-transform';

// Override History Catalog - component vocabulary with Zod schemas
export {
  OverrideHistoryCatalog,
  OverrideHistoryHeaderSchema,
  OverrideEntrySchema,
  OriginalScoreEntrySchema,
  RollbackBadgeSchema,
  OverrideTimelineSchema,
  OverrideReasonCodeSchema,
  OVERRIDE_REASON_LABELS,
} from './override-history-catalog';

export type {
  OverrideHistoryCatalogType,
  OverrideReasonCode,
  OverrideHistoryHeaderProps,
  OverrideEntryProps,
  OriginalScoreEntryProps,
  RollbackBadgeProps,
  OverrideTimelineProps,
  RenderElement as OverrideHistoryRenderElement,
  RenderTree as OverrideHistoryRenderTree,
} from './override-history-catalog';

// Override History Registry - maps catalog to React components
export { OverrideHistoryRegistry } from './override-history-registry';
export type { OverrideHistoryComponentRegistry } from './override-history-registry';

// Override History Transform - converts override data to render trees
export {
  overrideHistoryToRenderTree,
  createEmptyOverrideHistoryTree,
  overrideToEntryElement,
  createRollbackBadgeElement,
} from './override-history-transform';
export type {
  OverrideHistoryTransformOptions,
  OverrideHistoryData,
} from './override-history-transform';

// Note: Renderer is shared with SproutFinishingRoom/json-render/Renderer.tsx
// Import from there when rendering: import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render'
