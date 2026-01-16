// src/bedrock/consoles/ExperienceConsole/json-render/index.ts
// Sprint: S6-SL-ObservableSignals v1
// Epic 7: json-render Signals Module Exports
// Pattern: json-render (Vercel Labs pattern for AI-generated component trees)

// Catalog - component vocabulary with Zod schemas
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

// Registry - maps catalog to React components
export { SignalsRegistry } from './signals-registry';
export type { SignalsComponentRegistry } from './signals-registry';

// Transform - converts SignalAggregation to render trees
export {
  signalAggregationToRenderTree,
  createEmptySignalsTree,
  eventsToTimelineElement,
} from './signals-transform';
export type { SignalsTransformOptions } from './signals-transform';

// Note: Renderer is shared with SproutFinishingRoom/json-render/Renderer.tsx
// Import from there when rendering: import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render'
