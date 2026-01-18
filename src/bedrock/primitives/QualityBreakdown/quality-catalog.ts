// src/bedrock/primitives/QualityBreakdown/quality-catalog.ts
// Quality Breakdown Panel - Catalog (Zod Schemas)
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: json-render pattern - Vercel Labs standard
// This catalog defines the component vocabulary for quality score visualization

import { z } from 'zod';

// =============================================================================
// Schema Definitions
// =============================================================================

/**
 * Header component - Overall score display with grade
 */
export const QualityHeaderSchema = z.object({
  type: z.literal('QualityHeader'),
  props: z.object({
    overall: z.number().min(0).max(100),
    grade: z.enum(['excellent', 'good', 'fair', 'needs-improvement']),
    gradeLabel: z.string(),
    gradeIcon: z.string(),
  }),
});

/**
 * Dimension bar - Individual quality dimension with progress bar
 */
export const DimensionBarSchema = z.object({
  type: z.literal('DimensionBar'),
  props: z.object({
    dimension: z.enum(['accuracy', 'utility', 'novelty', 'provenance']),
    label: z.string(),
    icon: z.string(),
    value: z.number().min(0).max(100),
    color: z.string(),
    grade: z.enum(['excellent', 'good', 'fair', 'needs-improvement']),
  }),
});

/**
 * Dimension group - Container for dimension bars
 */
export const DimensionGroupSchema = z.object({
  type: z.literal('DimensionGroup'),
  props: z.object({
    title: z.string().optional(),
  }),
  children: z.array(DimensionBarSchema),
});

/**
 * Metadata row - Key-value pair for assessment metadata
 */
export const MetadataRowSchema = z.object({
  type: z.literal('MetadataRow'),
  props: z.object({
    icon: z.string(),
    label: z.string(),
    value: z.string(),
  }),
});

/**
 * Metadata section - Container for metadata rows
 */
export const MetadataSectionSchema = z.object({
  type: z.literal('MetadataSection'),
  props: z.object({
    title: z.string().optional(),
  }),
  children: z.array(MetadataRowSchema),
});

/**
 * Network percentile badge - Shows position in network
 */
export const NetworkPercentileBadgeSchema = z.object({
  type: z.literal('NetworkPercentileBadge'),
  props: z.object({
    percentile: z.number().min(0).max(100),
    label: z.string(),
  }),
});

/**
 * Confidence indicator - Shows assessment confidence level
 */
export const ConfidenceIndicatorSchema = z.object({
  type: z.literal('ConfidenceIndicator'),
  props: z.object({
    confidence: z.number().min(0).max(1),
    label: z.string(),
  }),
});

/**
 * Action button - CTA for viewing full details
 */
export const ActionButtonSchema = z.object({
  type: z.literal('ActionButton'),
  props: z.object({
    label: z.string(),
    icon: z.string().optional(),
    variant: z.enum(['primary', 'secondary', 'ghost']).default('secondary'),
  }),
});

/**
 * Divider - Visual separator
 */
export const DividerSchema = z.object({
  type: z.literal('Divider'),
  props: z.object({
    spacing: z.enum(['sm', 'md', 'lg']).default('md'),
  }),
});

/**
 * Empty state - Shown when no quality data available
 */
export const EmptyStateSchema = z.object({
  type: z.literal('EmptyState'),
  props: z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string().optional(),
  }),
});

/**
 * Pending state - Shown when assessment is in progress
 */
export const PendingStateSchema = z.object({
  type: z.literal('PendingState'),
  props: z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string().optional(),
  }),
});

/**
 * Error state - Shown when assessment failed
 */
export const ErrorStateSchema = z.object({
  type: z.literal('ErrorState'),
  props: z.object({
    icon: z.string(),
    title: z.string(),
    message: z.string().optional(),
  }),
});

// =============================================================================
// Union Types
// =============================================================================

/**
 * All possible render elements
 */
export const QualityRenderElementSchema = z.discriminatedUnion('type', [
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
]);

export type QualityRenderElement = z.infer<typeof QualityRenderElementSchema>;

/**
 * Root render tree structure
 */
export const QualityRenderTreeSchema = z.object({
  type: z.literal('root'),
  children: z.array(QualityRenderElementSchema),
});

export type QualityRenderTree = z.infer<typeof QualityRenderTreeSchema>;

// =============================================================================
// Component Type Extraction
// =============================================================================

export type QualityHeader = z.infer<typeof QualityHeaderSchema>;
export type DimensionBar = z.infer<typeof DimensionBarSchema>;
export type DimensionGroup = z.infer<typeof DimensionGroupSchema>;
export type MetadataRow = z.infer<typeof MetadataRowSchema>;
export type MetadataSection = z.infer<typeof MetadataSectionSchema>;
export type NetworkPercentileBadge = z.infer<typeof NetworkPercentileBadgeSchema>;
export type ConfidenceIndicator = z.infer<typeof ConfidenceIndicatorSchema>;
export type ActionButton = z.infer<typeof ActionButtonSchema>;
export type Divider = z.infer<typeof DividerSchema>;
export type EmptyState = z.infer<typeof EmptyStateSchema>;
export type PendingState = z.infer<typeof PendingStateSchema>;
export type ErrorState = z.infer<typeof ErrorStateSchema>;

// =============================================================================
// Catalog Export
// =============================================================================

/**
 * Quality Breakdown Catalog
 *
 * Defines the component vocabulary for the quality breakdown panel.
 * Used by the registry to render components and by the transform
 * to build the render tree.
 */
export const QualityCatalog = {
  components: {
    QualityHeader: { schema: QualityHeaderSchema },
    DimensionBar: { schema: DimensionBarSchema },
    DimensionGroup: { schema: DimensionGroupSchema },
    MetadataRow: { schema: MetadataRowSchema },
    MetadataSection: { schema: MetadataSectionSchema },
    NetworkPercentileBadge: { schema: NetworkPercentileBadgeSchema },
    ConfidenceIndicator: { schema: ConfidenceIndicatorSchema },
    ActionButton: { schema: ActionButtonSchema },
    Divider: { schema: DividerSchema },
    EmptyState: { schema: EmptyStateSchema },
    PendingState: { schema: PendingStateSchema },
    ErrorState: { schema: ErrorStateSchema },
  },
} as const;

export type QualityCatalogType = typeof QualityCatalog;
