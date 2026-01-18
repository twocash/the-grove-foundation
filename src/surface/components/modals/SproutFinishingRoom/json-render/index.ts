// src/surface/components/modals/SproutFinishingRoom/json-render/index.ts
// Sprint: S2-SFR-Display - US-C001 json-render module exports
// Updated: S13-BD-LayoutDensity-v1 - Added layout density exports
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

// Transform - converts domain models to render trees
export { researchDocumentToRenderTree } from './transform';

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
