// src/bedrock/consoles/ExperienceConsole/json-render/override-history-transform.ts
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render transform (converts QualityOverride[] to renderable tree)

import type { RenderTree, RenderElement, OverrideEntryProps } from './override-history-catalog';
import { OVERRIDE_REASON_LABELS, type OverrideReasonCode } from './override-history-catalog';
import type { QualityOverride } from '@core/schema/quality-override';

/**
 * Input data for override history transform
 */
export interface OverrideHistoryData {
  sproutId: string;
  sproutTitle?: string;
  /** Overrides sorted by timestamp DESC (newest first) */
  overrides: QualityOverride[];
  /** Original assessment score */
  originalScore: number;
  /** Original assessment timestamp */
  originalAssessedAt: string;
  /** Model that performed original assessment */
  originalModel?: string;
  /** Current effective score after all overrides */
  currentScore: number;
}

/**
 * Transform options for customizing override history render output
 */
export interface OverrideHistoryTransformOptions {
  /** Custom title */
  title?: string;
  /** Maximum entries to display (default: all) */
  limit?: number;
  /** Show rollback buttons for eligible entries */
  allowRollback?: boolean;
  /** Current operator ID (for rollback permission check) */
  currentOperatorId?: string;
}

const DEFAULT_OPTIONS: OverrideHistoryTransformOptions = {
  title: 'Override History',
  allowRollback: true,
};

/**
 * Get human-readable reason label
 */
function getReasonLabel(reasonCode: OverrideReasonCode): string {
  return OVERRIDE_REASON_LABELS[reasonCode] || reasonCode;
}

/**
 * Check if an override entry can be rolled back
 * Rules:
 * - Entry is the most recent non-rolled-back override
 * - Rollback is enabled in options
 * - Entry was created by current operator OR user has admin role
 */
function canRollback(
  override: QualityOverride,
  isLatestActive: boolean,
  opts: OverrideHistoryTransformOptions
): boolean {
  if (!opts.allowRollback) return false;
  if (override.rolledBack) return false;
  if (!isLatestActive) return false;

  // If currentOperatorId is provided, check ownership
  if (opts.currentOperatorId) {
    return override.operatorId === opts.currentOperatorId;
  }

  // Default: allow if latest active
  return true;
}

/**
 * Transform QualityOverride to OverrideEntryProps
 */
function overrideToEntryProps(
  override: QualityOverride,
  isLatestActive: boolean,
  opts: OverrideHistoryTransformOptions
): OverrideEntryProps {
  return {
    id: override.id,
    timestamp: override.createdAt,
    operator: override.operatorEmail || override.operatorId,
    scoreBefore: override.scoreBefore,
    scoreAfter: override.scoreAfter,
    delta: override.scoreAfter - override.scoreBefore,
    reasonCode: override.reasonCode,
    reasonLabel: getReasonLabel(override.reasonCode),
    explanation: override.explanation,
    hasEvidence: !!override.evidenceUrl,
    evidenceUrl: override.evidenceUrl,
    rolledBack: override.rolledBack,
    rollbackTimestamp: override.rollbackTimestamp,
    rollbackOperator: override.rollbackOperatorEmail || override.rollbackOperatorId,
    canRollback: canRollback(override, isLatestActive, opts),
  };
}

/**
 * Transforms OverrideHistoryData into a json-render tree structure.
 *
 * Components used:
 * - OverrideHistoryHeader: title with sprout context
 * - OverrideTimeline: wraps entries and original score
 * - OverrideEntry: individual override record
 * - OriginalScoreEntry: original assessment anchor
 * - RollbackBadge: visual indicator for rolled-back entries
 */
export function overrideHistoryToRenderTree(
  data: OverrideHistoryData,
  options: OverrideHistoryTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  // 1. Header with sprout context
  children.push({
    type: 'OverrideHistoryHeader',
    props: {
      title: opts.title || 'Override History',
      sproutId: data.sproutId,
      sproutTitle: data.sproutTitle,
      totalOverrides: data.overrides.filter(o => !o.rolledBack).length,
    },
  });

  // 2. Apply limit if specified
  const overridesToShow = opts.limit
    ? data.overrides.slice(0, opts.limit)
    : data.overrides;

  // Find the latest active (non-rolled-back) override
  const latestActiveId = data.overrides.find(o => !o.rolledBack)?.id;

  // 3. Transform overrides to entry props
  const entries = overridesToShow.map(override =>
    overrideToEntryProps(
      override,
      override.id === latestActiveId,
      opts
    )
  );

  // 4. Create timeline with entries and original score
  children.push({
    type: 'OverrideTimeline',
    props: {
      entries,
      currentScore: data.currentScore,
      originalScore: {
        score: data.originalScore,
        assessedAt: data.originalAssessedAt,
        model: data.originalModel,
      },
    },
  });

  return {
    type: 'root',
    children,
  };
}

/**
 * Creates a render tree for empty override history (no overrides).
 */
export function createEmptyOverrideHistoryTree(
  sproutId: string,
  originalScore: number,
  originalAssessedAt: string,
  sproutTitle?: string
): RenderTree {
  return {
    type: 'root',
    children: [
      {
        type: 'OverrideHistoryHeader',
        props: {
          title: 'Override History',
          sproutId,
          sproutTitle,
          totalOverrides: 0,
        },
      },
      {
        type: 'OverrideTimeline',
        props: {
          entries: [],
          currentScore: originalScore,
          originalScore: {
            score: originalScore,
            assessedAt: originalAssessedAt,
          },
        },
      },
    ],
  };
}

/**
 * Creates a single override entry element.
 */
export function overrideToEntryElement(
  override: QualityOverride,
  canRollbackEntry = false
): RenderElement {
  return {
    type: 'OverrideEntry',
    props: {
      id: override.id,
      timestamp: override.createdAt,
      operator: override.operatorEmail || override.operatorId,
      scoreBefore: override.scoreBefore,
      scoreAfter: override.scoreAfter,
      delta: override.scoreAfter - override.scoreBefore,
      reasonCode: override.reasonCode,
      reasonLabel: getReasonLabel(override.reasonCode),
      explanation: override.explanation,
      hasEvidence: !!override.evidenceUrl,
      evidenceUrl: override.evidenceUrl,
      rolledBack: override.rolledBack,
      rollbackTimestamp: override.rollbackTimestamp,
      rollbackOperator: override.rollbackOperatorEmail || override.rollbackOperatorId,
      canRollback: canRollbackEntry,
    },
  };
}

/**
 * Creates a rollback badge element.
 */
export function createRollbackBadgeElement(
  timestamp: string,
  operator: string
): RenderElement {
  return {
    type: 'RollbackBadge',
    props: {
      timestamp,
      operator,
    },
  };
}

export default overrideHistoryToRenderTree;
