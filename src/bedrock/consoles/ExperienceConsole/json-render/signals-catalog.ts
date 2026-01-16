// src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts
// Sprint: S6-SL-ObservableSignals v1
// Epic 7: json-render Signals Catalog
// Pattern: json-render catalog (Vercel Labs)

import { z } from 'zod';

/**
 * SignalsCatalog - Defines the component vocabulary for signal analytics visualization
 *
 * This catalog constrains what components can render signal data, ensuring predictable,
 * schema-compliant output. Each component has a Zod schema for validation.
 *
 * Components:
 * - SignalHeader: Title and period selector
 * - MetricCard: Single metric with label and optional trend
 * - MetricRow: Horizontal row of metric cards
 * - QualityGauge: Quality score visualization (0-1)
 * - DiversityBadge: Diversity index with breakdown
 * - EventBreakdown: Pie/bar chart of event types
 * - FunnelChart: Stage conversion funnel
 * - ActivityTimeline: Recent event activity (stub)
 * - AdvancementIndicator: Eligibility status
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const SignalHeaderSchema = z.object({
  title: z.string().describe('Title for the signals panel'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  period: z.enum(['all_time', 'last_30d', 'last_7d']).describe('Aggregation period'),
  sproutId: z.string().optional().describe('Sprout ID for per-sprout view'),
  lastUpdated: z.string().optional().describe('ISO timestamp of last aggregation'),
});

export const MetricCardSchema = z.object({
  label: z.string().describe('Metric label'),
  value: z.number().describe('Metric value'),
  format: z.enum(['number', 'percent', 'decimal']).default('number'),
  trend: z.object({
    direction: z.enum(['up', 'down', 'flat']),
    delta: z.number().optional(),
    period: z.string().optional(),
  }).optional(),
  icon: z.string().optional().describe('Icon name (lucide-react)'),
  color: z.enum(['default', 'green', 'red', 'amber', 'blue']).default('default'),
});

export const MetricRowSchema = z.object({
  metrics: z.array(MetricCardSchema),
  columns: z.number().min(2).max(6).default(4),
});

export const QualityGaugeSchema = z.object({
  score: z.number().min(0).max(1).describe('Quality score 0-1'),
  label: z.string().default('Quality Score'),
  thresholds: z.object({
    low: z.number().default(0.3),
    medium: z.number().default(0.6),
    high: z.number().default(0.8),
  }).optional(),
});

export const DiversityBadgeSchema = z.object({
  index: z.number().min(0).max(1).describe('Diversity index 0-1'),
  breakdown: z.object({
    uniqueSessions: z.number(),
    uniqueLenses: z.number(),
    uniqueHubs: z.number(),
    uniqueUsers: z.number().optional(),
  }),
});

export const EventTypeCountSchema = z.object({
  type: z.string(),
  count: z.number(),
  percentage: z.number().optional(),
});

export const EventBreakdownSchema = z.object({
  events: z.array(EventTypeCountSchema),
  total: z.number(),
  showLabels: z.boolean().default(true),
});

export const FunnelStageSchema = z.object({
  stage: z.string(),
  label: z.string(),
  count: z.number(),
  percentage: z.number().describe('Percentage of total (0-100)'),
});

export const FunnelChartSchema = z.object({
  stages: z.array(FunnelStageSchema),
  showConversionRates: z.boolean().default(true),
});

export const ActivityTimelineSchema = z.object({
  events: z.array(z.object({
    type: z.string(),
    timestamp: z.string(),
    sproutId: z.string().optional(),
  })),
  limit: z.number().default(10),
});

export const AdvancementIndicatorSchema = z.object({
  eligible: z.boolean(),
  qualityScore: z.number().min(0).max(1),
  criteria: z.object({
    viewCountMet: z.boolean(),
    qualityScoreMet: z.boolean(),
    diversityMet: z.boolean().optional(),
    daysActiveMet: z.boolean().optional(),
  }),
  nextTier: z.string().optional(),
});

// ============================================================================
// CATALOG DEFINITION
// ============================================================================

export const SignalsCatalog = {
  components: {
    SignalHeader: { props: SignalHeaderSchema },
    MetricCard: { props: MetricCardSchema },
    MetricRow: { props: MetricRowSchema },
    QualityGauge: { props: QualityGaugeSchema },
    DiversityBadge: { props: DiversityBadgeSchema },
    EventBreakdown: { props: EventBreakdownSchema },
    FunnelChart: { props: FunnelChartSchema },
    ActivityTimeline: { props: ActivityTimelineSchema },
    AdvancementIndicator: { props: AdvancementIndicatorSchema },
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SignalsCatalogType = typeof SignalsCatalog;
export type SignalHeaderProps = z.infer<typeof SignalHeaderSchema>;
export type MetricCardProps = z.infer<typeof MetricCardSchema>;
export type MetricRowProps = z.infer<typeof MetricRowSchema>;
export type QualityGaugeProps = z.infer<typeof QualityGaugeSchema>;
export type DiversityBadgeProps = z.infer<typeof DiversityBadgeSchema>;
export type EventBreakdownProps = z.infer<typeof EventBreakdownSchema>;
export type EventTypeCount = z.infer<typeof EventTypeCountSchema>;
export type FunnelChartProps = z.infer<typeof FunnelChartSchema>;
export type FunnelStageProps = z.infer<typeof FunnelStageSchema>;
export type ActivityTimelineProps = z.infer<typeof ActivityTimelineSchema>;
export type AdvancementIndicatorProps = z.infer<typeof AdvancementIndicatorSchema>;

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
