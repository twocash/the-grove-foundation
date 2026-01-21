// src/bedrock/consoles/ExperienceConsole/json-render/override-history-registry.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render registry (maps catalog to React components)

import React from 'react';
import type {
  RenderElement,
  OverrideHistoryHeaderProps,
  OverrideEntryProps,
  OriginalScoreEntryProps,
  RollbackBadgeProps,
  OverrideTimelineProps,
} from './override-history-catalog';
import { OVERRIDE_REASON_LABELS } from './override-history-catalog';

/**
 * Component registry interface
 */
export interface OverrideHistoryComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * Format relative time
 */
const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

/**
 * Format score change with delta
 */
const formatScoreChange = (before: number, after: number): { text: string; color: string } => {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  const color = delta >= 0 ? 'text-grove-forest' : 'text-[var(--semantic-error)]';
  return {
    text: `${before} → ${after} (${sign}${delta})`,
    color,
  };
};

/**
 * OverrideHistoryRegistry - Maps catalog components to React implementations
 * Reuses ActivityTimeline pattern from SignalsCatalog
 */
export const OverrideHistoryRegistry: OverrideHistoryComponentRegistry = {
  OverrideHistoryHeader: ({ element }) => {
    const props = element.props as OverrideHistoryHeaderProps;

    return (
      <header className="mb-4 pb-3 border-b border-ink/10 dark:border-white/10" data-testid="override-history-header">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink dark:text-paper">
              {props.title}
            </h3>
            {props.sproutTitle && (
              <p className="text-sm text-ink-muted dark:text-paper/60 truncate">
                {props.sproutTitle}
              </p>
            )}
          </div>
          <span className="px-2 py-1 text-xs font-mono bg-ink/5 dark:bg-white/10 rounded">
            {props.totalOverrides} override{props.totalOverrides !== 1 ? 's' : ''}
          </span>
        </div>
      </header>
    );
  },

  OverrideEntry: ({ element }) => {
    const props = element.props as OverrideEntryProps;
    const scoreChange = formatScoreChange(props.scoreBefore, props.scoreAfter);

    return (
      <div
        className={`relative pl-6 pb-4 border-l-2 ${
          props.rolledBack
            ? 'border-ink/20 dark:border-white/20 opacity-60'
            : 'border-grove-forest'
        }`}
        data-testid="override-entry"
        data-rolled-back={props.rolledBack}
      >
        {/* Timeline dot */}
        <div
          className={`absolute -left-2 w-4 h-4 rounded-full border-2 ${
            props.rolledBack
              ? 'bg-ink/20 dark:bg-white/20 border-ink/30 dark:border-white/30'
              : 'bg-grove-forest border-grove-forest'
          }`}
        />

        <div className="bg-ink/5 dark:bg-white/5 rounded p-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink dark:text-paper" data-testid="entry-date">
                {formatRelativeTime(props.timestamp)}
              </span>
              {props.rolledBack && (
                <span
                  className="px-1.5 py-0.5 text-xs font-mono rounded"
                  style={{ backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }}
                  data-testid="rollback-badge"
                >
                  ROLLED BACK
                </span>
              )}
            </div>
            {props.canRollback && !props.rolledBack && (
              <button
                className="text-xs text-ink-muted dark:text-paper/50 transition-colors"
                style={{ }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--semantic-error)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                data-testid="rollback-button"
              >
                Rollback
              </button>
            )}
          </div>

          {/* Operator */}
          <p className="text-xs text-ink-muted dark:text-paper/60 mb-2" data-testid="entry-operator">
            by {props.operator}
          </p>

          {/* Score change */}
          <p className={`text-sm font-mono ${scoreChange.color}`} data-testid="entry-score-change">
            {scoreChange.text}
          </p>

          {/* Reason and explanation */}
          <div className="mt-2 text-sm">
            <span className="font-medium text-ink dark:text-paper" data-testid="entry-reason">
              {props.reasonLabel}
            </span>
            <p className="text-ink/70 dark:text-paper/70 mt-1" data-testid="entry-explanation">
              "{props.explanation}"
            </p>
          </div>

          {/* Evidence indicator */}
          {props.hasEvidence && (
            <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--semantic-info)' }}>
              <span>📎</span>
              <a
                href={props.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Evidence attached
              </a>
            </div>
          )}

          {/* Rollback info */}
          {props.rolledBack && props.rollbackTimestamp && (
            <div className="mt-2 pt-2 border-t border-ink/10 dark:border-white/10 text-xs text-ink-muted dark:text-paper/50">
              Rolled back on {new Date(props.rollbackTimestamp).toLocaleDateString()}
              {props.rollbackOperator && ` by ${props.rollbackOperator}`}
            </div>
          )}
        </div>
      </div>
    );
  },

  OriginalScoreEntry: ({ element }) => {
    const props = element.props as OriginalScoreEntryProps;

    return (
      <div
        className="relative pl-6 pt-2"
        data-testid="original-score-entry"
      >
        {/* Timeline terminator */}
        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-ink/40 dark:bg-white/40" />

        <div className="bg-ink/5 dark:bg-white/5 rounded p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink dark:text-paper">
              Original score
            </span>
            <span className="text-lg font-bold text-ink dark:text-paper">
              {props.score}
            </span>
          </div>
          <p className="text-xs text-ink-muted dark:text-paper/50 mt-1">
            Assessed: {new Date(props.assessedAt).toLocaleDateString()}
            {props.model && ` · ${props.model}`}
          </p>
        </div>
      </div>
    );
  },

  RollbackBadge: ({ element }) => {
    const props = element.props as RollbackBadgeProps;

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded"
        style={{ backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }}
        data-testid="rollback-badge"
      >
        <span>↩</span>
        <span>Rolled back {formatRelativeTime(props.timestamp)}</span>
      </span>
    );
  },

  OverrideTimeline: ({ element }) => {
    const props = element.props as OverrideTimelineProps;

    if (props.entries.length === 0) {
      return (
        <div className="p-6 text-center" data-testid="empty-state">
          <div className="text-4xl mb-2">✓</div>
          <h4 className="text-lg font-medium text-ink dark:text-paper mb-1">
            No overrides for this content
          </h4>
          <p className="text-sm text-ink-muted dark:text-paper/60">
            The current quality score is the original automated assessment.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-0" data-testid="override-history-timeline">
        {/* Current score indicator */}
        <div className="mb-4 p-3 rounded bg-grove-forest/10 border border-grove-forest/30" data-testid="current-score">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink dark:text-paper">
              Current Score
            </span>
            <span className="text-xl font-bold text-grove-forest">
              {props.currentScore}
            </span>
          </div>
        </div>

        {/* Timeline entries */}
        {props.entries.map((entry) => (
          <OverrideHistoryRegistry.OverrideEntry
            key={entry.id}
            element={{ type: 'OverrideEntry', props: entry }}
          />
        ))}

        {/* Original score anchor */}
        <OverrideHistoryRegistry.OriginalScoreEntry
          element={{ type: 'OriginalScoreEntry', props: props.originalScore }}
        />
      </div>
    );
  },
};

export default OverrideHistoryRegistry;
