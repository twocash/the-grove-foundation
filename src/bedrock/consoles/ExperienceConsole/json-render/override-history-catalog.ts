// src/bedrock/consoles/ExperienceConsole/json-render/override-history-catalog.ts
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render catalog (Vercel Labs)
// Defines component vocabulary for Override History Timeline

import { z } from 'zod';

/**
 * OverrideHistoryCatalog - Defines components for override audit trail
 *
 * This catalog provides the vocabulary for the override history timeline,
 * showing all quality score changes with full provenance tracking.
 *
 * Components:
 * - OverrideHistoryHeader: Title with sprout context
 * - OverrideEntry: Individual override record
 * - OriginalScoreEntry: Original assessment anchor
 * - RollbackBadge: Visual indicator for rolled-back entries
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const OverrideReasonCodeSchema = z.enum([
  'incorrect_assessment',
  'missing_context',
  'model_error',
  'other',
]);

export const OverrideHistoryHeaderSchema = z.object({
  title: z.string().default('Override History'),
  sproutId: z.string().describe('Sprout ID for context'),
  sproutTitle: z.string().optional().describe('Sprout title'),
  totalOverrides: z.number().describe('Total number of overrides'),
});

export const OverrideEntrySchema = z.object({
  id: z.string().describe('Override ID'),
  timestamp: z.string().describe('ISO timestamp'),
  operator: z.string().describe('Operator email or ID'),
  scoreBefore: z.number().describe('Score before override'),
  scoreAfter: z.number().describe('Score after override'),
  delta: z.number().describe('Score change (positive or negative)'),
  reasonCode: OverrideReasonCodeSchema.describe('Reason for override'),
  reasonLabel: z.string().describe('Human-readable reason'),
  explanation: z.string().describe('Operator explanation'),
  hasEvidence: z.boolean().default(false).describe('Whether evidence was attached'),
  evidenceUrl: z.string().optional().describe('URL to evidence file'),
  // Rollback tracking
  rolledBack: z.boolean().default(false),
  rollbackTimestamp: z.string().optional(),
  rollbackOperator: z.string().optional(),
  // Can this entry be rolled back?
  canRollback: z.boolean().default(false).describe('True if this is the most recent active override'),
});

export const OriginalScoreEntrySchema = z.object({
  score: z.number().describe('Original assessment score'),
  assessedAt: z.string().describe('Assessment timestamp'),
  model: z.string().optional().describe('Model that performed assessment'),
  confidence: z.number().optional().describe('Assessment confidence'),
});

export const RollbackBadgeSchema = z.object({
  timestamp: z.string().describe('When rollback occurred'),
  operator: z.string().describe('Who performed rollback'),
});

export const OverrideTimelineSchema = z.object({
  entries: z.array(OverrideEntrySchema),
  originalScore: OriginalScoreEntrySchema,
  currentScore: z.number().describe('Current score after all overrides'),
});

// ============================================================================
// CATALOG DEFINITION
// ============================================================================

export const OverrideHistoryCatalog = {
  components: {
    OverrideHistoryHeader: { props: OverrideHistoryHeaderSchema },
    OverrideEntry: { props: OverrideEntrySchema },
    OriginalScoreEntry: { props: OriginalScoreEntrySchema },
    RollbackBadge: { props: RollbackBadgeSchema },
    OverrideTimeline: { props: OverrideTimelineSchema },
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OverrideHistoryCatalogType = typeof OverrideHistoryCatalog;
export type OverrideReasonCode = z.infer<typeof OverrideReasonCodeSchema>;
export type OverrideHistoryHeaderProps = z.infer<typeof OverrideHistoryHeaderSchema>;
export type OverrideEntryProps = z.infer<typeof OverrideEntrySchema>;
export type OriginalScoreEntryProps = z.infer<typeof OriginalScoreEntrySchema>;
export type RollbackBadgeProps = z.infer<typeof RollbackBadgeSchema>;
export type OverrideTimelineProps = z.infer<typeof OverrideTimelineSchema>;

// ============================================================================
// REASON CODE LABELS
// ============================================================================

export const OVERRIDE_REASON_LABELS: Record<OverrideReasonCode, string> = {
  incorrect_assessment: 'Incorrect Assessment',
  missing_context: 'Missing Context',
  model_error: 'Model Error',
  other: 'Other',
};

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
