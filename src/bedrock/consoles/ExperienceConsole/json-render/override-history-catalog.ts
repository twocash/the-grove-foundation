// src/bedrock/consoles/ExperienceConsole/json-render/override-history-catalog.ts
// Sprint: S19-BD-JsonRenderFactory (migrated from S10.2-SL-AICuration v3)
// Pattern: json-render catalog using factory pattern
// Defines component vocabulary for Override History Timeline

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

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
// CATALOG DEFINITION (using factory pattern)
// ============================================================================

export const OverrideHistoryCatalog: CatalogDefinition = createCatalog({
  name: 'override-history',
  version: '2.0.0',
  components: {
    OverrideHistoryHeader: {
      props: OverrideHistoryHeaderSchema,
      category: 'data',
      description: 'Title with sprout context and override count',
      agentHint: 'Use at the top of override history panels',
    },
    OverrideEntry: {
      props: OverrideEntrySchema,
      category: 'data',
      description: 'Individual override record with full provenance',
      agentHint: 'Display a single override entry with score change and reasoning',
    },
    OriginalScoreEntry: {
      props: OriginalScoreEntrySchema,
      category: 'data',
      description: 'Original assessment anchor for the timeline',
      agentHint: 'Show the initial AI assessment as timeline baseline',
    },
    RollbackBadge: {
      props: RollbackBadgeSchema,
      category: 'feedback',
      description: 'Visual indicator for rolled-back entries',
      agentHint: 'Mark entries that have been rolled back',
    },
    OverrideTimeline: {
      props: OverrideTimelineSchema,
      category: 'layout',
      description: 'Complete timeline with all override entries',
      agentHint: 'Display full audit trail of score changes',
    },
  },
});

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
// BACKWARD COMPATIBILITY: Re-export core types
// ============================================================================

// Re-export RenderElement and RenderTree from core for consumers who imported
// from this file. New code should import directly from '@core/json-render'.
export type { RenderElement, RenderTree } from '@core/json-render';
