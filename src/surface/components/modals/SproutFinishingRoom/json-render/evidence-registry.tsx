// src/surface/components/modals/SproutFinishingRoom/json-render/evidence-registry.tsx
// Sprint: S22-WP research-writer-panel-v1
// S23-SFR: Migrated to GroveSkins CSS variables for unified theming
// S25-SFR: Full GroveSkins binding - CSS variables, font families, ReactMarkdown overrides
// Pattern: json-render registry for RAW research evidence display
//
// These components render the FULL research results.
// Design system: GroveSkins (quantum-glass.json) - neon accents, glass panels, adaptive theming.

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

// ============================================================================
// MARKDOWN COMPONENT OVERRIDES (GroveSkins self-contained styling)
// Shared between SynthesisBlock and SourceCard for consistent rendering
// Ported from ResearchRegistry for full GroveSkins compliance
// ============================================================================

const markdownComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      style={{ color: 'var(--glass-text-primary)', fontFamily: 'var(--font-display)' }}
      className="text-xl font-semibold mt-6 mb-3"
      {...props}
    />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      style={{ color: 'var(--glass-text-primary)', fontFamily: 'var(--font-display)' }}
      className="text-lg font-semibold mt-5 mb-2"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      style={{ color: 'var(--glass-text-primary)', fontFamily: 'var(--font-heading)' }}
      className="text-base font-semibold mt-4 mb-2"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      style={{ color: 'var(--glass-text-secondary)', fontFamily: 'var(--font-heading)' }}
      className="text-sm font-semibold mt-3 mb-1 uppercase tracking-wide"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      style={{ color: 'var(--glass-text-body)', fontFamily: 'var(--font-body)' }}
      className="mb-3 leading-relaxed"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong style={{ color: 'var(--glass-text-primary)', fontFamily: 'var(--font-body)' }} className="font-semibold" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em style={{ color: 'var(--glass-text-body)', fontFamily: 'var(--font-body)' }} {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      style={{ color: 'var(--glass-text-body)', fontFamily: 'var(--font-body)' }}
      className="mb-3 ml-5 list-disc space-y-1"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      style={{ color: 'var(--glass-text-body)', fontFamily: 'var(--font-body)' }}
      className="mb-3 ml-5 list-decimal space-y-1"
      {...props}
    />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4">
      <table
        style={{ borderColor: 'var(--glass-border)' }}
        className="w-full text-sm border-collapse"
        {...props}
      />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead style={{ background: 'var(--glass-elevated)' }} {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      style={{ color: 'var(--glass-text-primary)', borderColor: 'var(--glass-border)', fontFamily: 'var(--font-body)' }}
      className="px-3 py-2 text-left font-semibold border-b"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      style={{ color: 'var(--glass-text-body)', borderColor: 'var(--glass-border)', fontFamily: 'var(--font-body)' }}
      className="px-3 py-2 border-b"
      {...props}
    />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      style={{ borderColor: 'var(--neon-cyan)', background: 'var(--glass-elevated)', fontFamily: 'var(--font-body)' }}
      className="border-l-4 pl-4 py-2 my-4 rounded-r"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      style={{ background: 'var(--glass-elevated)', color: 'var(--glass-text-secondary)', fontFamily: 'var(--font-mono)' }}
      className="p-4 rounded-lg overflow-x-auto my-4 text-sm"
      {...props}
    />
  ),
  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
    const isBlock = className?.includes('hljs') || className?.includes('language-');
    if (isBlock) {
      return <code className={className} style={{ fontFamily: 'var(--font-mono)' }} {...props}>{children}</code>;
    }
    return (
      <code
        style={{ color: 'var(--neon-cyan)', background: 'var(--glass-elevated)', fontFamily: 'var(--font-mono)' }}
        className="px-1.5 py-0.5 rounded text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      style={{ color: 'var(--neon-cyan)' }}
      className="hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  hr: () => <hr style={{ borderColor: 'var(--glass-border)' }} className="my-6" />,
  // Inline citation rendering for <cite> tags from research output
  cite: ({ node, ...props }: { node?: { properties?: { index?: string } }; children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) => {
    const indexAttr = (node?.properties?.index as string) || '';
    const indices = indexAttr?.split(',').map(i => i.trim().split('-')[0]).filter(Boolean) || [];
    const uniqueIndices = [...new Set(indices)];
    return (
      <span className="citation-inline">
        <span style={{ color: 'var(--glass-text-body)', fontFamily: 'var(--font-body)' }}>{props.children}</span>
        {uniqueIndices.length > 0 && (
          <sup
            className="text-[10px] ml-0.5 cursor-help"
            style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}
            title={`Source: ${uniqueIndices.join(', ')}`}
          >
            [{uniqueIndices.join(',')}]
          </sup>
        )}
      </span>
    );
  },
};

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
 * Get source type badge styles - GroveSkins native
 * Uses CSS variables with color-mix for transparent backgrounds
 */
function getSourceTypeBadge(sourceType?: string): React.CSSProperties {
  switch (sourceType) {
    case 'academic':
      return {
        backgroundColor: 'color-mix(in srgb, var(--neon-cyan) 15%, transparent)',
        color: 'var(--neon-cyan)',
      };
    case 'practitioner':
      return {
        backgroundColor: 'color-mix(in srgb, #8b5cf6 15%, transparent)',
        color: '#8b5cf6',
      };
    case 'news':
      return {
        backgroundColor: 'color-mix(in srgb, var(--semantic-warning) 15%, transparent)',
        color: 'var(--semantic-warning)',
      };
    case 'primary':
      return {
        backgroundColor: 'color-mix(in srgb, var(--semantic-success) 15%, transparent)',
        color: 'var(--semantic-success)',
      };
    default:
      return {
        backgroundColor: 'color-mix(in srgb, var(--glass-text-muted) 15%, transparent)',
        color: 'var(--glass-text-muted)',
      };
  }
}

/**
 * EvidenceRegistry - Maps evidence catalog components to React implementations
 * S25-SFR: All components use GroveSkins CSS variables and font bindings
 */
export const EvidenceRegistry: ComponentRegistry = {
  /**
   * Evidence Header - Query, metadata, and confidence badge
   */
  EvidenceHeader: ({ element }) => {
    const props = element.props as EvidenceHeaderProps;
    const confidencePercent = Math.round(props.confidenceScore * 100);

    return (
      <header className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        {/* Query */}
        <h1
          className="text-lg font-semibold mb-3"
          style={{ color: 'var(--glass-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {props.query}
        </h1>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Template badge */}
          {props.templateName && (
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--semantic-success) 15%, transparent)',
                color: 'var(--semantic-success)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {props.templateName}
            </span>
          )}

          {/* Confidence badge */}
          <span
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: confidencePercent >= 70
                ? 'color-mix(in srgb, var(--semantic-success) 15%, transparent)'
                : confidencePercent >= 40
                ? 'color-mix(in srgb, var(--semantic-warning) 15%, transparent)'
                : 'color-mix(in srgb, var(--semantic-error) 15%, transparent)',
              color: confidencePercent >= 70
                ? 'var(--semantic-success)'
                : confidencePercent >= 40
                ? 'var(--semantic-warning)'
                : 'var(--semantic-error)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {confidencePercent}% confidence
          </span>

          {/* Sources count */}
          <span style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {props.totalSources} sources
          </span>

          {/* Duration */}
          <span style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {formatDuration(props.executionTime)}
          </span>

          {/* Timestamp */}
          <span style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}>
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

    const statusColorMap: Record<string, string> = {
      complete: 'var(--semantic-success)',
      pending: 'var(--semantic-warning)',
      failed: 'var(--semantic-error)',
      'budget-exceeded': 'var(--semantic-warning)',
    };

    return (
      <div className="mt-6 mb-4 pb-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center justify-between">
          <h2
            className="text-sm font-medium"
            style={{ color: 'var(--glass-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {props.branchQuery}
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {props.sourceCount} sources
            </span>
            <span style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {relevancePercent}% relevant
            </span>
            <span
              className="uppercase"
              style={{
                color: statusColorMap[props.status] || 'var(--glass-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
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
    const badgeStyle = getSourceTypeBadge(props.sourceType);

    return (
      <div
        className="mb-4 p-3 rounded-lg border"
        style={{ background: 'var(--glass-elevated)', borderColor: 'var(--glass-border)' }}
      >
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Citation index */}
          <span
            className="flex-shrink-0 w-6 h-6 rounded text-xs font-semibold flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--neon-cyan) 15%, transparent)',
              color: 'var(--neon-cyan)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {props.index}
          </span>

          {/* Title and URL */}
          <div className="flex-1 min-w-0">
            <a
              href={props.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline line-clamp-1"
              style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-body)' }}
              title={props.title}
            >
              {props.title}
            </a>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              {props.url}
            </p>
          </div>

          {/* Source type badge */}
          {props.sourceType && (
            <span
              className="px-2 py-0.5 rounded text-xs"
              style={{ ...badgeStyle, fontFamily: 'var(--font-mono)' }}
            >
              {props.sourceType}
            </span>
          )}
        </div>

        {/* Snippet - rendered with full GroveSkins markdown overrides */}
        <div
          className="text-sm border-l-2 pl-3 ml-8"
          style={{ borderColor: 'color-mix(in srgb, var(--neon-cyan) 30%, transparent)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {props.snippet}
          </ReactMarkdown>
        </div>

        {/* Access timestamp */}
        <p
          className="text-xs mt-2 ml-8"
          style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
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
    const findings = Array.isArray(props.findings) ? props.findings : [];

    if (findings.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 ml-8">
        <h4
          className="text-xs uppercase mb-2"
          style={{ color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Key Findings
        </h4>
        <ul className="space-y-1">
          {findings.map((finding, idx) => (
            <li key={idx} className="flex gap-2 text-sm">
              <span className="flex-shrink-0" style={{ color: 'var(--neon-cyan)' }}>•</span>
              <span style={{ color: 'var(--glass-text-body)', fontFamily: 'var(--font-body)' }}>
                {typeof finding === 'string' ? finding : String(finding)}
              </span>
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
      <footer
        className="mt-6 pt-4 border-t flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--glass-border)', color: 'var(--glass-text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        <div className="flex items-center gap-4">
          <span>
            <strong style={{ color: 'var(--glass-text-primary)' }}>{props.branchCount}</strong> research branches
          </span>
          <span>
            <strong style={{ color: 'var(--glass-text-primary)' }}>{props.totalFindings}</strong> findings
          </span>
        </div>
        <span>
          {props.apiCallsUsed} API calls
        </span>
      </footer>
    );
  },

  /**
   * S22-WP: Synthesis Block - Main research narrative with inline citations
   * Displays the full research synthesis as formatted prose
   * S25-SFR: Full GroveSkins markdownComponents for consistent rendering
   *
   * Design principle: Citations should be small superscript numbers, NOT italicized blockquotes.
   * Content should read like a normal research report with proper headings and body text.
   */
  SynthesisBlock: ({ element }) => {
    const props = element.props as SynthesisBlockProps;

    return (
      <article className="mb-6">
        {/* Research content - full GroveSkins via markdownComponents */}
        <div className="text-[15px] leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {props.content}
          </ReactMarkdown>
        </div>
      </article>
    );
  },

  /**
   * S22-WP: Confidence Note - Displays AI confidence assessment with rationale
   */
  ConfidenceNote: ({ element }) => {
    const props = element.props as ConfidenceNoteProps;

    const levelStyles: Record<string, React.CSSProperties> = {
      high: {
        backgroundColor: 'color-mix(in srgb, var(--semantic-success) 15%, transparent)',
        color: 'var(--semantic-success)',
        borderColor: 'color-mix(in srgb, var(--semantic-success) 30%, transparent)',
      },
      medium: {
        backgroundColor: 'color-mix(in srgb, var(--semantic-warning) 15%, transparent)',
        color: 'var(--semantic-warning)',
        borderColor: 'color-mix(in srgb, var(--semantic-warning) 30%, transparent)',
      },
      low: {
        backgroundColor: 'color-mix(in srgb, var(--semantic-error) 15%, transparent)',
        color: 'var(--semantic-error)',
        borderColor: 'color-mix(in srgb, var(--semantic-error) 30%, transparent)',
      },
    };

    const levelLabels = {
      high: 'High Confidence',
      medium: 'Moderate Confidence',
      low: 'Low Confidence',
    };

    return (
      <div
        className="mb-4 p-3 rounded-lg border"
        style={levelStyles[props.level] || levelStyles.medium}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs font-semibold uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {levelLabels[props.level]}
          </span>
        </div>
        <p className="text-sm opacity-90" style={{ fontFamily: 'var(--font-body)' }}>
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

    // S22-WP: Defensive check - ensure limitations is actually an array
    const limitations = Array.isArray(props.limitations) ? props.limitations : [];

    if (limitations.length === 0) {
      return null;
    }

    return (
      <div
        className="mb-4 p-4 rounded-lg border"
        style={{ backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning)' }}
      >
        <h4
          className="text-xs uppercase mb-2 font-semibold"
          style={{ color: 'var(--semantic-warning)', fontFamily: 'var(--font-mono)' }}
        >
          Research Limitations
        </h4>
        <ul className="space-y-1">
          {limitations.map((limitation, idx) => (
            <li
              key={idx}
              className="flex gap-2 text-sm"
              style={{ color: 'var(--semantic-warning)', fontFamily: 'var(--font-body)' }}
            >
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
