// src/bedrock/consoles/PromptWorkshop/components/QAResultsSection.tsx
// QA check results display in Inspector
// Sprint: prompt-refinement-v1

import { InspectorSection } from '../../../../shared/layout/InspectorPanel';
import type { QAIssue, QAIssueSeverity } from '@core/schema/prompt';

// =============================================================================
// Types
// =============================================================================

interface QAResultsSectionProps {
  /** QA score (0-100) */
  score?: number;
  /** List of issues identified */
  issues?: QAIssue[];
  /** ISO timestamp of last check */
  lastChecked?: string;
  /** Handler for applying auto-fixes */
  onApplyFix?: (issue: QAIssue) => void;
  /** Handler for running a new QA check */
  onRunQACheck?: () => void;
  /** Whether a QA check is currently running */
  isChecking?: boolean;
  /** Handler for duplicating library prompt to user's prompts */
  onDuplicate?: () => void;
  /** Whether duplication is in progress */
  isDuplicating?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function formatDate(isoString?: string): string {
  if (!isoString) return 'Never';
  try {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500/20';
  if (score >= 60) return 'bg-amber-500/20';
  return 'bg-red-500/20';
}

function getSeverityIcon(severity: QAIssueSeverity): string {
  switch (severity) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
  }
}

function getSeverityColor(severity: QAIssueSeverity): string {
  switch (severity) {
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-amber-400';
    case 'info':
      return 'text-blue-400';
  }
}

function getIssueTypeLabel(type: QAIssue['type']): string {
  switch (type) {
    case 'missing_context':
      return 'Missing Context';
    case 'ambiguous_intent':
      return 'Ambiguous Intent';
    case 'too_broad':
      return 'Too Broad';
    case 'too_narrow':
      return 'Too Narrow';
    case 'source_mismatch':
      return 'Source Mismatch';
  }
}

// =============================================================================
// Component
// =============================================================================

export function QAResultsSection({
  score,
  issues = [],
  lastChecked,
  onApplyFix,
  onRunQACheck,
  isChecking = false,
  onDuplicate,
  isDuplicating = false,
}: QAResultsSectionProps) {
  console.log('[QAResultsSection] Rendering with:', {
    score,
    issuesCount: issues?.length,
    issues: issues?.map(i => ({ type: i.type, autoFixAvailable: i.autoFixAvailable })),
    lastChecked,
    hasOnRunQACheck: !!onRunQACheck,
    hasOnApplyFix: !!onApplyFix,
    hasOnDuplicate: !!onDuplicate,
    isChecking
  });

  // Show different UI when no QA data exists
  if (score === undefined && issues.length === 0) {
    // Library prompts don't have QA checks available
    if (!onRunQACheck) {
      return (
        <InspectorSection title="🔍 QA Assessment" collapsible defaultCollapsed={true}>
          <div className="p-3 rounded-lg bg-[var(--glass-surface)] space-y-3">
            <div className="text-sm text-[var(--glass-text-muted)]">
              QA checks are not available for library prompts.
            </div>
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                disabled={isDuplicating}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] rounded-lg hover:bg-[var(--accent-cyan)]/30 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">
                  {isDuplicating ? 'progress_activity' : 'content_copy'}
                </span>
                {isDuplicating ? 'Duplicating...' : 'Duplicate to My Prompts'}
              </button>
            )}
          </div>
        </InspectorSection>
      );
    }

    // User-owned prompt with no QA data yet
    return (
      <InspectorSection title="🔍 QA Assessment" collapsible defaultCollapsed={false}>
        <div className="space-y-3 p-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
          <div className="text-sm text-[var(--glass-text-secondary)]">
            Run a QA check to validate this prompt against its source material.
          </div>
          <button
            onClick={onRunQACheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 rounded-lg transition-colors disabled:opacity-50"
            data-testid="qa-check-button"
          >
            <span className="material-symbols-outlined text-base">
              {isChecking ? 'progress_activity' : 'fact_check'}
            </span>
            {isChecking ? 'Checking...' : 'Run QA Check'}
          </button>
        </div>
      </InspectorSection>
    );
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  // Dynamic title based on results
  const titleEmoji = errorCount > 0 ? '❌' : warningCount > 0 ? '⚠️' : '✅';

  return (
    <InspectorSection title={`${titleEmoji} QA Assessment`} collapsible defaultCollapsed={false}>
      <div className="space-y-4">
        {/* Score header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Score badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getScoreBgColor(score ?? 0)}`}
              data-testid="qa-score"
            >
              <span className={`text-lg font-bold ${getScoreColor(score ?? 0)}`}>
                {score ?? 0}
              </span>
              <span className="text-xs text-[var(--glass-text-muted)]">/ 100</span>
            </div>

            {/* Issue counts */}
            {(errorCount > 0 || warningCount > 0) && (
              <div className="flex items-center gap-2 text-xs">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errorCount}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {warningCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Last checked */}
          <div className="text-xs text-[var(--glass-text-muted)]">
            Last checked: {formatDate(lastChecked)}
          </div>
        </div>

        {/* Issues list */}
        {issues.length > 0 && (
          <div className="space-y-2" data-testid="qa-issues">
            {issues.map((issue, index) => (
              <div
                key={index}
                className="p-3 bg-[var(--glass-panel)] rounded-lg border border-[var(--glass-border)]"
              >
                {/* Issue header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-base ${getSeverityColor(issue.severity)}`}
                    >
                      {getSeverityIcon(issue.severity)}
                    </span>
                    <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                      {getIssueTypeLabel(issue.type)}
                    </span>
                  </div>

                  {/* Refine button - populates Copilot with starter prompt */}
                  {issue.autoFixAvailable && onApplyFix && (
                    <button
                      onClick={() => onApplyFix(issue)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit_note</span>
                      Refine
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="mt-1.5 text-sm text-[var(--glass-text-secondary)]">
                  {issue.description}
                </p>

                {/* Suggested fix */}
                {issue.suggestedFix && (
                  <div className="mt-2 p-2 bg-[var(--glass-elevated)] rounded text-xs text-[var(--glass-text-muted)]">
                    <span className="font-medium">Suggestion:</span> {issue.suggestedFix}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No issues message */}
        {issues.length === 0 && score !== undefined && score >= 80 && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <span className="material-symbols-outlined text-base">check_circle</span>
            No issues found. Prompt looks good!
          </div>
        )}

        {/* Re-run button */}
        {onRunQACheck && (
          <button
            onClick={onRunQACheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">
              {isChecking ? 'progress_activity' : 'refresh'}
            </span>
            {isChecking ? 'Checking...' : 'Re-run QA Check'}
          </button>
        )}
      </div>
    </InspectorSection>
  );
}

export default QAResultsSection;
