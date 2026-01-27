// src/surface/components/modals/SproutFinishingRoom/json-render/evidence-registry.tsx
// Sprint: S22-WP research-writer-panel-v1
// S23-SFR: Migrated to GroveSkins CSS variables for unified theming
// Pattern: json-render registry for RAW research evidence display
//
// These components render the FULL research results.
// Design system: GroveSkins (quantum-glass.json) - neon accents, glass panels, dark mode.

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
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
 * S23-SFR: GroveSkins native with hex values
 * violet=#8b5cf6, amber=#f59e0b, green=#10b981, cyan=#06b6d4, muted=#94a3b8
 */
function getSourceTypeBadge(sourceType?: string): { bg: string; text: string } {
  switch (sourceType) {
    case 'academic':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400' };
    case 'practitioner':
      return { bg: 'bg-[#8b5cf6]/10', text: 'text-[#8b5cf6]' };
    case 'news':
      return { bg: 'bg-[#f59e0b]/10', text: 'text-[#f59e0b]' };
    case 'primary':
      return { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]' };
    default:
      return { bg: 'bg-[#94a3b8]/10', text: 'text-[#94a3b8]' };
  }
}

/**
 * EvidenceRegistry - Maps evidence catalog components to React implementations
 */
export const EvidenceRegistry: ComponentRegistry = {
  /**
   * Evidence Header - Query, metadata, and confidence badge
   */
  /**
   * Evidence Header - Query, metadata, and confidence badge
   * S23-SFR: GroveSkins native with hex values for reliability
   * Colors: white=#ffffff, secondary=#e2e8f0, muted=#94a3b8, green=#10b981, amber=#f59e0b, cyan=#06b6d4
   */
  EvidenceHeader: ({ element }) => {
    const props = element.props as EvidenceHeaderProps;
    const confidencePercent = Math.round(props.confidenceScore * 100);

    return (
      <header className="mb-6 pb-4 border-b border-[#1e293b]">
        {/* Query - WHITE for maximum contrast */}
        <h1 className="text-lg font-serif font-semibold text-white mb-3">
          {props.query}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Template badge */}
          {props.templateName && (
            <span className="px-2 py-1 rounded bg-[#10b981]/10 text-[#10b981] font-mono">
              {props.templateName}
            </span>
          )}

          {/* Confidence badge */}
          <span
            className={`px-2 py-1 rounded font-mono ${
              confidencePercent >= 70
                ? 'bg-[#10b981]/10 text-[#10b981]'
                : confidencePercent >= 40
                ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {confidencePercent}% confidence
          </span>

          {/* Sources count */}
          <span className="text-[#94a3b8]">
            {props.totalSources} sources
          </span>

          {/* Duration */}
          <span className="text-[#94a3b8]">
            {formatDuration(props.executionTime)}
          </span>

          {/* Timestamp */}
          <span className="text-[#94a3b8]">
            {formatDate(props.createdAt)}
          </span>
        </div>
      </header>
    );
  },

  /**
   * Branch Header - Research branch divider with query
   * S23-SFR: GroveSkins native with hex values
   */
  BranchHeader: ({ element }) => {
    const props = element.props as BranchHeaderProps;
    const relevancePercent = Math.round(props.relevanceScore * 100);

    const statusColors = {
      complete: 'text-[#10b981]',
      pending: 'text-[#f59e0b]',
      failed: 'text-red-400',
      'budget-exceeded': 'text-[#f59e0b]',
    };

    return (
      <div className="mt-6 mb-4 pb-2 border-b border-[#1e293b]/50">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono text-white font-medium">
            {props.branchQuery}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#94a3b8]">
              {props.sourceCount} sources
            </span>
            <span className="text-[#94a3b8]">
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
   * S23-SFR: GroveSkins native with hex values
   */
  SourceCard: ({ element }) => {
    const props = element.props as SourceCardProps;
    const badge = getSourceTypeBadge(props.sourceType);

    return (
      <div className="mb-4 p-3 rounded-lg bg-[rgba(17,24,39,0.6)] border border-[#1e293b]">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Citation index */}
          <span className="flex-shrink-0 w-6 h-6 rounded bg-[#06b6d4]/10 text-[#06b6d4] text-xs font-mono font-semibold flex items-center justify-center">
            {props.index}
          </span>

          {/* Title and URL */}
          <div className="flex-1 min-w-0">
            <a
              href={props.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#06b6d4] hover:underline line-clamp-1"
              title={props.title}
            >
              {props.title}
            </a>
            <p className="text-xs text-[#94a3b8] truncate">
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

        {/* Snippet - prose-invert for dark mode compatibility */}
        <div className="text-sm text-[#cbd5e1] border-l-2 border-[#06b6d4]/30 pl-3 ml-8 prose prose-sm prose-invert max-w-none prose-p:my-2 prose-p:text-[#cbd5e1] prose-ul:my-2 prose-li:my-0.5 prose-blockquote:my-2 prose-blockquote:border-[#06b6d4]/50 prose-a:text-[#06b6d4] prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{props.snippet}</ReactMarkdown>
        </div>

        {/* Access timestamp */}
        <p className="text-xs text-[#64748b] mt-2 ml-8">
          Accessed {formatDate(props.accessedAt)}
        </p>
      </div>
    );
  },

  /**
   * Findings List - Bullet list of key findings
   * S23-SFR: GroveSkins native with hex values
   */
  FindingsList: ({ element }) => {
    const props = element.props as FindingsListProps;
    const findings = Array.isArray(props.findings) ? props.findings : [];

    if (findings.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 ml-8">
        <h4 className="text-xs font-mono text-[#94a3b8] uppercase mb-2">
          Key Findings
        </h4>
        <ul className="space-y-1">
          {findings.map((finding, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-[#cbd5e1]">
              <span className="text-[#06b6d4] flex-shrink-0">•</span>
              <span>{typeof finding === 'string' ? finding : String(finding)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  },

  /**
   * Evidence Summary - Footer with execution metrics
   * S23-SFR: GroveSkins native with hex values
   */
  EvidenceSummary: ({ element }) => {
    const props = element.props as EvidenceSummaryProps;

    return (
      <footer className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-[#94a3b8]">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-white">{props.branchCount}</strong> research branches
          </span>
          <span>
            <strong className="text-white">{props.totalFindings}</strong> findings
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
      // S23-SFR: GroveSkins native with hex values
      return (
        <span className="citation-inline">
          {/* Content rendered as normal text */}
          <span className="text-[#cbd5e1]">{children}</span>
          {/* Citation number as small superscript */}
          {uniqueIndices.length > 0 && (
            <sup className="text-[10px] text-[#06b6d4] font-mono ml-0.5 cursor-help" title={`Source: ${uniqueIndices.join(', ')}`}>
              [{uniqueIndices.join(',')}]
            </sup>
          )}
        </span>
      );
    };

    return (
      <article className="mb-6">
        {/* Research content - styled via GroveSkins CSS rules in globals.css */}
        {/* S23-SFR: Removed broken Tailwind prose modifiers, using CSS rules instead */}
        <div className="prose max-w-none text-[15px] leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // Handle custom <cite> tags as inline citations
              cite: ({ node, ...props }) => {
                const indexAttr = (node?.properties?.index as string) || '';
                return <CitationRenderer index={indexAttr}>{props.children}</CitationRenderer>;
              },
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
   * S23-SFR: GroveSkins native with hex values
   */
  ConfidenceNote: ({ element }) => {
    const props = element.props as ConfidenceNoteProps;

    const levelColors = {
      high: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30',
      medium: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
      low: 'bg-red-500/10 text-red-400 border-red-400/30',
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
   * S22-WP: Added defensive array check for malformed data
   */
  LimitationsList: ({ element }) => {
    const props = element.props as LimitationsListProps;

    // S22-WP: Defensive check - ensure limitations is actually an array
    const limitations = Array.isArray(props.limitations) ? props.limitations : [];

    if (limitations.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning)' }}>
        <h4 className="text-xs font-mono uppercase mb-2 font-semibold" style={{ color: 'var(--semantic-warning)' }}>
          Research Limitations
        </h4>
        <ul className="space-y-1">
          {limitations.map((limitation, idx) => (
            <li key={idx} className="flex gap-2 text-sm" style={{ color: 'var(--semantic-warning)' }}>
              <span className="flex-shrink-0">⚠️</span>
              <span>{typeof limitation === 'string' ? limitation : String(limitation)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

export default EvidenceRegistry;
