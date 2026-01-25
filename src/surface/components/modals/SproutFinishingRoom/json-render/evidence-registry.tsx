// src/surface/components/modals/SproutFinishingRoom/json-render/evidence-registry.tsx
// Sprint: S22-WP research-writer-panel-v1
// Pattern: json-render registry for RAW research evidence display
//
// These components render the FULL research results.
// Grove design system: paper/ink colors, serif typography, forest/clay accents.

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { RenderElement } from '@core/json-render';
import type {
  EvidenceHeaderProps,
  BranchHeaderProps,
  SourceCardProps,
  FindingsListProps,
  EvidenceSummaryProps,
  SynthesisBlockProps,
  ConfidenceNoteProps,
  LimitationsListProps,
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
      <header className="mb-6 pb-4 border-b border-[var(--border)]">
        {/* Query */}
        <h1 className="text-lg font-serif font-semibold text-[var(--foreground)] mb-3">
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
          <span className="text-[var(--muted)]">
            {props.totalSources} sources
          </span>

          {/* Duration */}
          <span className="text-[var(--muted)]">
            {formatDuration(props.executionTime)}
          </span>

          {/* Timestamp */}
          <span className="text-[var(--muted)]">
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
      <div className="mt-6 mb-4 pb-2 border-b border-[var(--border)]/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono text-[var(--foreground)] font-medium">
            {props.branchQuery}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--muted)]">
              {props.sourceCount} sources
            </span>
            <span className="text-[var(--muted)]">
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
      <div className="mb-4 p-3 rounded-lg bg-[var(--panel)] border border-[var(--border)]">
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
            <p className="text-xs text-[var(--muted)] truncate">
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

        {/* Snippet - S22-WP: Show FULL content with proper markdown rendering */}
        {/* S23-SFR Phase 0c: Refactored to GroveSkin CSS variables */}
        <div className="text-sm text-[var(--foreground)]/80 border-l-2 border-[var(--accent)]/30 pl-3 ml-8 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-blockquote:my-2 prose-blockquote:border-[var(--accent)]/50 prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{props.snippet}</ReactMarkdown>
        </div>

        {/* Access timestamp */}
        <p className="text-xs text-[var(--muted)]/70 mt-2 ml-8">
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
        <h4 className="text-xs font-mono text-[var(--muted)] uppercase mb-2">
          Key Findings
        </h4>
        <ul className="space-y-1">
          {props.findings.map((finding, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-[var(--foreground)]">
              <span className="text-[var(--accent)] flex-shrink-0">•</span>
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
      <footer className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-[var(--foreground)]">{props.branchCount}</strong> research branches
          </span>
          <span>
            <strong className="text-[var(--foreground)]">{props.totalFindings}</strong> findings
          </span>
        </div>
        <span className="font-mono">
          {props.apiCallsUsed} API calls
        </span>
      </footer>
    );
  },

  /**
   * S22-WP: Synthesis Block - Main research narrative with inline citations
   * Displays the full research synthesis as formatted prose
   * Handles <cite index="..."> tags for INLINE citation rendering (not blockquotes)
   *
   * Design principle: Citations should be small superscript numbers, NOT italicized blockquotes.
   * Content should read like a normal research report with proper headings and body text.
   */
  SynthesisBlock: ({ element }) => {
    const props = element.props as SynthesisBlockProps;
    const confidencePercent = Math.round(props.confidence * 100);

    // Custom component to render <cite> tags as INLINE citation numbers
    // NOT as italicized blockquotes - that makes content unreadable
    const CitationRenderer = ({ index, children }: { index?: string; children?: React.ReactNode }) => {
      // Parse index like "20-3,20-4,20-5" into source references
      const indices = index?.split(',').map(i => i.trim().split('-')[0]).filter(Boolean) || [];
      const uniqueIndices = [...new Set(indices)];

      // Render the content as normal text with a small superscript citation number
      // S23-SFR Phase 0c: Refactored to GroveSkin CSS variables
      return (
        <span className="citation-inline">
          {/* Content rendered as normal text - NO italics, NO blockquote styling */}
          <span className="text-[var(--foreground)]">{children}</span>
          {/* Citation number as small superscript */}
          {uniqueIndices.length > 0 && (
            <sup className="text-[10px] text-[var(--accent)] font-mono ml-0.5 cursor-help" title={`Source: ${uniqueIndices.join(', ')}`}>
              [{uniqueIndices.join(',')}]
            </sup>
          )}
        </span>
      );
    };

    return (
      <article className="mb-6">
        {/* Research content - proper document styling with CLEAR heading hierarchy */}
        {/* S23-SFR Phase 0c: Refactored to GroveSkin CSS variables */}
        <div className="prose max-w-none
          text-[var(--foreground)] text-[15px] leading-relaxed
          prose-p:my-4 prose-p:text-[var(--foreground)]/90
          prose-ul:my-4 prose-ul:text-[var(--foreground)]/90
          prose-ol:my-4
          prose-li:my-1
          prose-strong:text-[var(--foreground)] prose-strong:font-semibold
          prose-em:text-[var(--foreground)]/90
          prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)]/50
          prose-blockquote:bg-[var(--accent)]/5
          prose-blockquote:pl-4 prose-blockquote:py-3 prose-blockquote:my-6 prose-blockquote:rounded-r
          prose-blockquote:text-[var(--foreground)]/90
          prose-a:text-[var(--accent)] hover:prose-a:underline
          prose-code:text-sm prose-code:bg-[var(--foreground)]/5 prose-code:px-1 prose-code:rounded">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              // Handle custom <cite> tags as inline citations
              cite: ({ node, ...props }) => {
                const indexAttr = (node?.properties?.index as string) || '';
                return <CitationRenderer index={indexAttr}>{props.children}</CitationRenderer>;
              },
              // S22-WP: Custom heading components for CLEAR visual hierarchy
              // S23-SFR Phase 0c: Refactored to GroveSkin CSS variables
              h1: ({ children }) => (
                <h1 className="text-2xl font-serif font-bold text-[var(--foreground)] mt-8 mb-4 pb-3 border-b-2 border-[var(--accent)]/30">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-serif font-semibold text-[var(--foreground)] mt-8 mb-3 pb-2 border-b border-[var(--border)]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-serif font-semibold text-[var(--accent)] mt-6 mb-2">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-sans font-semibold text-[var(--foreground)] mt-4 mb-2">
                  {children}
                </h4>
              ),
            }}
          >
            {props.content}
          </ReactMarkdown>
        </div>
      </article>
    );
  },

  /**
   * S22-WP: Confidence Note - Displays AI confidence assessment with rationale
   * Shows the model's confidence level and explanation
   */
  ConfidenceNote: ({ element }) => {
    const props = element.props as ConfidenceNoteProps;

    const levelColors = {
      high: 'bg-grove-forest/10 text-grove-forest dark:bg-grove-forest/20 border-grove-forest/30',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300',
      low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300',
    };

    const levelLabels = {
      high: 'High Confidence',
      medium: 'Moderate Confidence',
      low: 'Low Confidence',
    };

    return (
      <div className={`mb-4 p-3 rounded-lg border ${levelColors[props.level]}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-semibold uppercase">
            {levelLabels[props.level]}
          </span>
        </div>
        <p className="text-sm opacity-90">
          {props.rationale}
        </p>
      </div>
    );
  },

  /**
   * S22-WP: Limitations List - Research limitations acknowledgment
   * Shows known caveats or limitations of the research
   */
  LimitationsList: ({ element }) => {
    const props = element.props as LimitationsListProps;

    if (!props.limitations || props.limitations.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30">
        <h4 className="text-xs font-mono text-amber-700 dark:text-amber-400 uppercase mb-2 font-semibold">
          Research Limitations
        </h4>
        <ul className="space-y-1">
          {props.limitations.map((limitation, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-amber-800 dark:text-amber-300">
              <span className="flex-shrink-0">⚠️</span>
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

export default EvidenceRegistry;
