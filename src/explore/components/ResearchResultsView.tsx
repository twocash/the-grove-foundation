// src/explore/components/ResearchResultsView.tsx
// Main research document display component
// Sprint: results-display-v1
//
// DEX: Declarative Sovereignty
// Component renders any ResearchDocument - no hardcoded display logic.

import { useState, useCallback } from 'react';
import type { ResearchDocument } from '@core/schema/research-document';
import { PositionCard, ConfidenceBadge } from './PositionCard';
import { AnalysisSection } from './AnalysisSection';
import { CitationsSection } from './CitationsSection';

interface ResearchResultsViewProps {
  /** The research document to display */
  document: ResearchDocument;
  /** Optional: show compact version */
  compact?: boolean;
  /** Callback when copy is clicked */
  onCopy?: () => void;
  /** Callback when "Add to KB" is clicked (v1: disabled) */
  onAddToKnowledgeBase?: () => void;
  /** Callback when back button is clicked */
  onBack?: () => void;
}

/**
 * ResearchResultsView - Main results display component
 *
 * Composes:
 * - PositionCard (thesis statement)
 * - AnalysisSection (markdown with inline citations)
 * - LimitationsNote (if present)
 * - CitationsSection (expandable)
 * - ResultsActions (copy, add to KB)
 */
export function ResearchResultsView({
  document,
  compact = false,
  onCopy,
  onAddToKnowledgeBase,
  onBack,
}: ResearchResultsViewProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    const markdown = formatDocumentAsMarkdown(document);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [document, onCopy]);

  // Handle insufficient evidence state
  if (document.status === 'insufficient-evidence') {
    return (
      <InsufficientEvidenceView
        query={document.query}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700
                      flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800
                         text-slate-500 hover:text-slate-700 dark:hover:text-slate-300
                         transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30
                            border border-green-200 dark:border-green-800/50
                            flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg">
                article
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Research Results
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {document.wordCount} words · {document.citations.length} sources
              </p>
            </div>
          </div>
        </div>

        {/* Top-level confidence badge */}
        <ConfidenceBadge score={document.confidenceScore} status={document.status} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Original query */}
        <QueryDisplay query={document.query} />

        {/* Position statement */}
        <PositionCard
          position={document.position}
          confidenceScore={document.confidenceScore}
          status={document.status}
        />

        {/* Analysis section */}
        {!compact && (
          <AnalysisSection
            analysis={document.analysis}
            citations={document.citations}
          />
        )}

        {/* Limitations note */}
        {document.limitations && (
          <LimitationsNote limitations={document.limitations} />
        )}

        {/* Citations section */}
        <CitationsSection
          citations={document.citations}
          defaultExpanded={compact ? false : document.citations.length <= 3}
        />
      </div>

      {/* Actions footer */}
      <ResultsActions
        onCopy={handleCopy}
        copySuccess={copySuccess}
        onAddToKnowledgeBase={onAddToKnowledgeBase}
        disableKB={true} // v1: disabled
      />
    </div>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

interface QueryDisplayProps {
  query: string;
}

function QueryDisplay({ query }: QueryDisplayProps) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50
                    border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-slate-400 text-base mt-0.5">
          search
        </span>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Research Query
          </p>
          <p className="text-sm text-slate-900 dark:text-slate-100">
            {query}
          </p>
        </div>
      </div>
    </div>
  );
}

interface LimitationsNoteProps {
  limitations: string;
}

function LimitationsNote({ limitations }: LimitationsNoteProps) {
  return (
    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20
                    border border-amber-200 dark:border-amber-800/50">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">
          warning
        </span>
        <div>
          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Limitations
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            {limitations}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ResultsActionsProps {
  onCopy: () => void;
  copySuccess: boolean;
  onAddToKnowledgeBase?: () => void;
  disableKB?: boolean;
}

function ResultsActions({
  onCopy,
  copySuccess,
  onAddToKnowledgeBase,
  disableKB = false,
}: ResultsActionsProps) {
  return (
    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700
                    flex items-center justify-between gap-2">
      {/* Left side: stats placeholder */}
      <div className="text-xs text-slate-400 dark:text-slate-500">
        Generated by Grove Research
      </div>

      {/* Right side: actions */}
      <div className="flex items-center gap-2">
        {/* Add to Knowledge Base (disabled for v1) */}
        <button
          onClick={onAddToKnowledgeBase}
          disabled={disableKB}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                     text-slate-500 dark:text-slate-400
                     border border-slate-200 dark:border-slate-700 rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-slate-50 dark:hover:bg-slate-800
                     transition-colors"
          title={disableKB ? 'Coming in a future update' : 'Add to Knowledge Base'}
        >
          <span className="material-symbols-outlined text-base">library_add</span>
          <span className="hidden sm:inline">Add to KB</span>
        </button>

        {/* Copy to clipboard */}
        <button
          onClick={onCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                     rounded-lg transition-all
                     ${copySuccess
                       ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                       : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/60'
                     }`}
        >
          <span className="material-symbols-outlined text-base">
            {copySuccess ? 'check' : 'content_copy'}
          </span>
          <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Insufficient Evidence View
// =============================================================================

interface InsufficientEvidenceViewProps {
  query: string;
  onBack?: () => void;
}

function InsufficientEvidenceView({ query, onBack }: InsufficientEvidenceViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700
                      flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800
                       text-slate-500 hover:text-slate-700 dark:hover:text-slate-300
                       transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800
                          border border-slate-200 dark:border-slate-700
                          flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              search_off
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Insufficient Evidence
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800
                        flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-slate-400">
            psychology_alt
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Not Enough Evidence
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          The research didn't find enough reliable sources to form a meaningful position on this topic.
        </p>

        {/* Original query */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50
                        border border-slate-200 dark:border-slate-700 max-w-md">
          <p className="text-xs font-medium text-slate-400 mb-1">Original Query</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 italic">
            "{query}"
          </p>
        </div>

        {/* Suggestions */}
        <div className="mt-6 text-left max-w-md">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Try these to improve results:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-purple-500 mt-0.5">
                lightbulb
              </span>
              <span>Rephrase your query with more specific terms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-purple-500 mt-0.5">
                lightbulb
              </span>
              <span>Break complex questions into smaller parts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-sm text-purple-500 mt-0.5">
                lightbulb
              </span>
              <span>Include relevant keywords or domain terms</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format ResearchDocument as markdown for clipboard
 */
function formatDocumentAsMarkdown(doc: ResearchDocument): string {
  const lines: string[] = [];

  // Title/Query
  lines.push(`# ${doc.query}`);
  lines.push('');

  // Position
  lines.push('## Position');
  lines.push('');
  lines.push(`> ${doc.position}`);
  lines.push('');

  // Analysis
  lines.push('## Analysis');
  lines.push('');
  lines.push(doc.analysis);
  lines.push('');

  // Limitations
  if (doc.limitations) {
    lines.push('## Limitations');
    lines.push('');
    lines.push(doc.limitations);
    lines.push('');
  }

  // Citations
  if (doc.citations.length > 0) {
    lines.push('## Sources');
    lines.push('');
    doc.citations.forEach((citation) => {
      lines.push(`${citation.index}. [${citation.title}](${citation.url}) - ${citation.domain}`);
    });
    lines.push('');
  }

  // Metadata
  lines.push('---');
  lines.push(`*Generated: ${new Date(doc.createdAt).toLocaleDateString()}*`);
  lines.push(`*Confidence: ${Math.round(doc.confidenceScore * 100)}%*`);
  lines.push(`*Word Count: ${doc.wordCount}*`);

  return lines.join('\n');
}

export default ResearchResultsView;
