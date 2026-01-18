// src/bedrock/primitives/QualityBreakdown/index.ts
// Quality Breakdown Panel - Barrel Export
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: json-render pattern implementation for quality score visualization

// Main components
export {
  QualityBreakdownPanel,
  QualityBreakdownFromMeta,
  QualityBreakdownCompact,
  type QualityBreakdownPanelProps,
  type QualityBreakdownFromMetaProps,
  type QualityBreakdownCompactProps,
} from './QualityBreakdownPanel';

// Catalog (Zod schemas)
export {
  QualityCatalog,
  QualityRenderTreeSchema,
  QualityRenderElementSchema,
  QualityHeaderSchema,
  DimensionBarSchema,
  DimensionGroupSchema,
  MetadataRowSchema,
  MetadataSectionSchema,
  NetworkPercentileBadgeSchema,
  ConfidenceIndicatorSchema,
  ActionButtonSchema,
  DividerSchema,
  EmptyStateSchema,
  PendingStateSchema,
  ErrorStateSchema,
  type QualityRenderTree,
  type QualityRenderElement,
  type QualityHeader,
  type DimensionBar,
  type DimensionGroup,
  type MetadataRow,
  type MetadataSection,
  type NetworkPercentileBadge,
  type ConfidenceIndicator,
  type ActionButton,
  type Divider,
  type EmptyState,
  type PendingState,
  type ErrorState,
  type QualityCatalogType,
} from './quality-catalog';

// Registry (React components)
export {
  QualityRegistry,
  renderElement,
  type QualityComponentRegistry,
} from './quality-registry';

// Transform (domain → render tree)
export {
  qualityScoreToRenderTree,
  sproutQualityToRenderTree,
  type QualityTransformOptions,
} from './quality-transform';
