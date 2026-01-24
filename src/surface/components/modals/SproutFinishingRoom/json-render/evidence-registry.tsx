// src/surface/components/modals/SproutFinishingRoom/json-render/evidence-registry.tsx
// Sprint: S22-WP research-writer-panel-v1
// Pattern: json-render registry for RAW research evidence display
//
// These components render the FULL research results.
// Grove design system: paper/ink colors, serif typography, forest/clay accents.

import React from 'react';
import type { RenderElement } from '@core/json-render';
import type {
  EvidenceHeaderProps,
  BranchHeaderProps,
  SourceCardProps,
  FindingsListProps,
  EvidenceSummaryProps,
} from './evidence-catalog';

/**
 * Component registry interface (same as ResearchRegistry)
 */
export interface ComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date to readable string
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Get source type badge styles
 */
function getSourceTypeBadge(sourceType?: string): { bg: string; text: string } {
  switch (sourceType) {
    case 'academic':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' };
    case 'practitioner':
      return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' };
    case 'news':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' };
    case 'primary':
      return { bg: 'bg-grove-forest/10 dark:bg-grove-forest/20', text: 'text-grove-forest' };
    default:
      return { bg: 'bg-ink/5 dark:bg-white/10', text: 'text-ink-muted dark:text-paper/60' };
  }
}

/**
 * EvidenceRegistry - Maps evidence catalog components to React implementations
 */
export const EvidenceRegistry: ComponentRegistry = {
  /**
   * Evidence Header - Query, metadata, and confidence badge
   */
  EvidenceHeader: ({ element }) => {
    const props = element.props as EvidenceHeaderProps;
    const confidencePercent = Math.round(props.confidenceScore * 100);

    return (
      <header className="mb-6 pb-4 border-b border-ink/10 dark:border-white/10">
        {/* Query */}
        <h1 className="text-lg font-serif font-semibold text-ink dark:text-paper mb-3">
          {props.query}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Template badge */}
          {props.templateName && (
            <span className="px-2 py-1 rounded bg-grove-forest/10 dark:bg-grove-forest/20 text-grove-forest font-mono">
              {props.templateName}
            </span>
          )}

          {/* Confidence badge */}
          <span
            className={`px-2 py-1 rounded font-mono ${
              confidencePercent >= 70
                ? 'bg-grove-forest/10 text-grove-forest dark:bg-grove-forest/20'
                : confidencePercent >= 40
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {confidencePercent}% confidence
          </span>

          {/* Sources count */}
          <span className="text-ink-muted dark:text-paper/60">
            {props.totalSources} sources
          </span>

          {/* Duration */}
          <span className="text-ink-muted dark:text-paper/60">
            {formatDuration(props.executionTime)}
          </span>

          {/* Timestamp */}
          <span className="text-ink-muted dark:text-paper/60">
            {formatDate(props.createdAt)}
          </span>
        </div>
      </header>
    );
  },

  /**
   * Branch Header - Research branch divider with query
   */
  BranchHeader: ({ element }) => {
    const props = element.props as BranchHeaderProps;
    const relevancePercent = Math.round(props.relevanceScore * 100);

    const statusColors = {
      complete: 'text-grove-forest',
      pending: 'text-amber-600 dark:text-amber-400',
      failed: 'text-red-600 dark:text-red-400',
      'budget-exceeded': 'text-amber-600 dark:text-amber-400',
    };

    return (
      <div className="mt-6 mb-4 pb-2 border-b border-ink/5 dark:border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono text-ink dark:text-paper font-medium">
            {props.branchQuery}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-muted dark:text-paper/50">
              {props.sourceCount} sources
            </span>
            <span className="text-ink-muted dark:text-paper/50">
              {relevancePercent}% relevant
            </span>
            <span className={`font-mono uppercase ${statusColors[props.status]}`}>
              {props.status}
            </span>
          </div>
        </div>
      </div>
    );
  },

  /**
   * Source Card - Individual citation with full details
   */
  SourceCard: ({ element }) => {
    const props = element.props as SourceCardProps;
    const badge = getSourceTypeBadge(props.sourceType);

    return (
      <div className="mb-4 p-3 rounded-lg bg-paper dark:bg-ink/50 border border-ink/5 dark:border-white/10">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Citation index */}
          <span className="flex-shrink-0 w-6 h-6 rounded bg-grove-forest/10 dark:bg-grove-forest/20 text-grove-forest text-xs font-mono font-semibold flex items-center justify-center">
            {props.index}
          </span>

          {/* Title and URL */}
          <div className="flex-1 min-w-0">
            <a
              href={props.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-grove-forest hover:underline line-clamp-1"
              title={props.title}
            >
              {props.title}
            </a>
            <p className="text-xs text-ink-muted dark:text-paper/50 truncate">
              {props.url}
            </p>
          </div>

          {/* Source type badge */}
          {props.sourceType && (
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${badge.bg} ${badge.text}`}>
              {props.sourceType}
            </span>
          )}
        </div>

        {/* Snippet */}
        <blockquote className="text-sm text-ink/80 dark:text-paper/80 italic border-l-2 border-grove-forest/30 pl-3 ml-8">
          {props.snippet}
        </blockquote>

        {/* Access timestamp */}
        <p className="text-xs text-ink-muted dark:text-paper/40 mt-2 ml-8">
          Accessed {formatDate(props.accessedAt)}
        </p>
      </div>
    );
  },

  /**
   * Findings List - Bullet list of key findings
   */
  FindingsList: ({ element }) => {
    const props = element.props as FindingsListProps;

    if (!props.findings || props.findings.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 ml-8">
        <h4 className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase mb-2">
          Key Findings
        </h4>
        <ul className="space-y-1">
          {props.findings.map((finding, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-ink dark:text-paper">
              <span className="text-grove-forest flex-shrink-0">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  },

  /**
   * Evidence Summary - Footer with execution metrics
   */
  EvidenceSummary: ({ element }) => {
    const props = element.props as EvidenceSummaryProps;

    return (
      <footer className="mt-6 pt-4 border-t border-ink/10 dark:border-white/10 flex items-center justify-between text-xs text-ink-muted dark:text-paper/50">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-ink dark:text-paper">{props.branchCount}</strong> research branches
          </span>
          <span>
            <strong className="text-ink dark:text-paper">{props.totalFindings}</strong> findings
          </span>
        </div>
        <span className="font-mono">
          {props.apiCallsUsed} API calls
        </span>
      </footer>
    );
  },
};

export default EvidenceRegistry;
