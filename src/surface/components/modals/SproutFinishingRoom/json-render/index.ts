// src/surface/components/modals/SproutFinishingRoom/json-render/index.ts
// Sprint: S2-SFR-Display - US-C001 json-render module exports
// Updated: S13-BD-LayoutDensity-v1 - Added layout density exports
// Updated: S22-WP research-writer-panel-v1 - Added evidence catalog/registry
// Pattern: json-render (Vercel Labs pattern for AI-generated component trees)

// Catalog - component vocabulary with Zod schemas
export {
  ResearchCatalog,
  ResearchHeaderSchema,
  AnalysisBlockSchema,
  SourceSchema,
  SourceListSchema,
  LimitationsBlockSchema,
  MetadataSchema,
} from './catalog';

export type {
  ResearchCatalogType,
  ResearchHeaderProps,
  AnalysisBlockProps,
  SourceListProps,
  LimitationsBlockProps,
  MetadataProps,
  RenderElement,
  RenderTree,
} from './catalog';

// Registry - maps catalog to React components
export { ResearchRegistry } from './registry';
export type { ComponentRegistry } from './registry';

// Evidence Catalog & Registry (S22-WP) - for RAW research display
export {
  EvidenceCatalog,
  EvidenceHeaderSchema,
  BranchHeaderSchema,
  SourceCardSchema,
  FindingsListSchema,
  EvidenceSummarySchema,
} from './evidence-catalog';
export type {
  EvidenceCatalogType,
  EvidenceHeaderProps,
  BranchHeaderProps,
  SourceCardProps,
  FindingsListProps,
  EvidenceSummaryProps,
} from './evidence-catalog';
export { EvidenceRegistry } from './evidence-registry';

// Promotion Catalog & Registry (S24-SFR) - for Garden promotion display
export {
  PromotionCatalog,
  PromotionStatusSchema,
  PromotionBadgeSchema,
} from './promotion-catalog';
export type {
  PromotionCatalogType,
  PromotionStatusProps,
  PromotionBadgeProps,
} from './promotion-catalog';
export { PromotionRegistry } from './promotion-registry';

// Transform - converts domain models to render trees
export { researchDocumentToRenderTree } from './transform';
export {
  evidenceBundleToRenderTree,
  sproutResearchToRenderTree,
  sproutSynthesisToRenderTree,
  sproutFullReportToRenderTree,
  sproutSourcesToRenderTree,
} from './evidence-transform';
export {
  promotionResultToRenderTree,
  promotionBadgeToRenderTree,
} from './promotion-transform';

// Renderer - renders trees using registry
export { Renderer, useLayoutContext } from './Renderer';

// Layout Density System (S13-BD-LayoutDensity-v1)
export type { LayoutDensity, LayoutConfig, ResolvedLayout } from './layout-types';
export { DENSITY_PRESETS, DEFAULT_DENSITY } from './layout-presets';
export { useResolvedLayout } from './useResolvedLayout';

// Signals module (from ExperienceConsole json-render)
// Re-exported for use in FinishingRoom signals section
export {
  SignalsRegistry,
  signalAggregationToRenderTree,
  createEmptySignalsTree,
} from '@bedrock/consoles/ExperienceConsole/json-render';
