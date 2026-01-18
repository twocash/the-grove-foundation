// src/bedrock/primitives/quality/index.ts
// Quality Primitives - Barrel Export
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Centralized exports for quality-related primitives

// Score Badge
export {
  QualityScoreBadge,
  QualityPendingBadge,
  QualityScoreMini,
  type QualityScoreBadgeProps,
  type QualityPendingBadgeProps,
  type QualityScoreMiniProps,
} from '../QualityScoreBadge';

// Tooltip
export {
  QualityTooltip,
  QualityMiniTooltip,
  type QualityTooltipProps,
  type QualityMiniTooltipProps,
} from '../QualityTooltip';

// Breakdown Panel (json-render pattern)
export {
  QualityBreakdownPanel,
  QualityBreakdownFromMeta,
  QualityBreakdownCompact,
  type QualityBreakdownPanelProps,
  type QualityBreakdownFromMetaProps,
  type QualityBreakdownCompactProps,
} from '../QualityBreakdown';

// Catalog
export {
  QualityCatalog,
  QualityRenderTreeSchema,
  QualityRenderElementSchema,
  type QualityRenderTree,
  type QualityRenderElement,
  type QualityCatalogType,
} from '../QualityBreakdown/quality-catalog';

// Registry
export {
  QualityRegistry,
  renderElement,
  type QualityComponentRegistry,
} from '../QualityBreakdown/quality-registry';

// Transform
export {
  qualityScoreToRenderTree,
  sproutQualityToRenderTree,
  type QualityTransformOptions,
} from '../QualityBreakdown/quality-transform';
