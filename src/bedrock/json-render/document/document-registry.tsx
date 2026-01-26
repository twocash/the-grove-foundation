// src/bedrock/json-render/document/document-registry.tsx
// Sprint: S25-SFR garden-content-viewer-v1
// Pattern: json-render registry (maps catalog to React components)
// Professional markdown rendering via remark/rehype plugin ecosystem

import type React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import type { RenderElement } from '@core/json-render';
import type {
  DocumentViewProps,
  DocumentSectionProps,
  DocumentSourceProps,
  DocumentMetaProps,
} from './document-catalog';

// Import highlight.js dark theme for syntax coloring
import 'highlight.js/styles/atom-one-dark.css';

/**
 * Component registry type (matches SFR Renderer's expected interface)
 */
export interface ComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

const TIER_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  seed: { icon: '🌰', color: 'var(--neon-cyan)', label: 'Seed' },
  sprout: { icon: '🌱', color: '#22c55e', label: 'Sprout' },
  sapling: { icon: '🌿', color: '#eab308', label: 'Sapling' },
  tree: { icon: '🌳', color: '#f97316', label: 'Tree' },
  grove: { icon: '🏔️', color: '#a855f7', label: 'Grove' },
};

// ============================================================================
// MARKDOWN COMPONENT OVERRIDES (GroveSkins self-contained styling)
// ============================================================================

/**
 * Custom component overrides for ReactMarkdown.
 * Every element is self-styled via GroveSkins CSS variables.
 * No .prose class dependency. Portable across any container.
 */
const markdownComponents = {
  // Typography hierarchy
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
      style={{ color: 'var(--glass-text-primary)' }}
      className="text-base font-semibold mt-4 mb-2"
      {...props}
    />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4
      style={{ color: 'var(--glass-text-secondary)' }}
      className="text-sm font-semibold mt-3 mb-1 uppercase tracking-wide"
      {...props}
    />
  ),
  // Prose
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      style={{ color: 'var(--glass-text-body)' }}
      className="mb-3 leading-relaxed"
      {...props}
    />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong
      style={{ color: 'var(--glass-text-primary)' }}
      className="font-semibold"
      {...props}
    />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em style={{ color: 'var(--glass-text-body)' }} {...props} />
  ),
  // Lists
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      style={{ color: 'var(--glass-text-body)' }}
      className="mb-3 ml-5 list-disc space-y-1"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      style={{ color: 'var(--glass-text-body)' }}
      className="mb-3 ml-5 list-decimal space-y-1"
      {...props}
    />
  ),
  // Tables (from remark-gfm)
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
      style={{ color: 'var(--glass-text-primary)', borderColor: 'var(--glass-border)' }}
      className="px-3 py-2 text-left font-semibold border-b"
      {...props}
    />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      style={{ color: 'var(--glass-text-body)', borderColor: 'var(--glass-border)' }}
      className="px-3 py-2 border-b"
      {...props}
    />
  ),
  // Block elements
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      style={{ borderColor: 'var(--neon-cyan)', background: 'var(--glass-elevated)' }}
      className="border-l-4 pl-4 py-2 my-4 rounded-r"
      {...props}
    />
  ),
  // Code (rehype-highlight adds hljs classes for syntax coloring)
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      style={{ background: 'var(--glass-elevated)', color: 'var(--glass-text-secondary)' }}
      className="p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm"
      {...props}
    />
  ),
  code: ({
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
    // rehype-highlight adds className="hljs language-*" to code blocks
    const isBlock = className?.includes('hljs') || className?.includes('language-');

    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    return (
      <code
        style={{ color: 'var(--neon-cyan)', background: 'var(--glass-elevated)' }}
        className="px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  // Links
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
  // Task lists (from remark-gfm)
  input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="mr-2" disabled />
  ),
  // Footnotes (from remark-gfm)
  sup: (props: React.HTMLAttributes<HTMLElement>) => (
    <sup style={{ color: 'var(--neon-cyan)' }} className="text-xs" {...props} />
  ),
};

// ============================================================================
// DOCUMENT REGISTRY - React renderers
// ============================================================================

/**
 * DocumentRegistry - Maps DocumentCatalog components to React implementations
 *
 * Each component is self-contained with GroveSkins CSS variables.
 * No external .prose CSS dependency. Renders correctly anywhere.
 */
export const DocumentRegistry: ComponentRegistry = {
  /**
   * DocumentView - Top-level document wrapper
   * Displays title with tier badge
   */
  DocumentView: ({ element }) => {
    const props = element.props as DocumentViewProps;
    const tierInfo = TIER_CONFIG[props.tier] || TIER_CONFIG.seed;

    return (
      <header
        className="mb-6 pb-4 border-b"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1
            className="text-2xl font-semibold"
            style={{
              color: 'var(--glass-text-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {props.title}
          </h1>
          <span
            className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
            style={{
              color: tierInfo.color,
              backgroundColor: 'var(--glass-elevated)',
            }}
          >
            {tierInfo.icon} {tierInfo.label}
          </span>
        </div>
        {props.sectionCount !== undefined && (
          <p
            className="text-sm"
            style={{ color: 'var(--glass-text-muted)' }}
          >
            {props.sectionCount} section{props.sectionCount !== 1 ? 's' : ''}
          </p>
        )}
      </header>
    );
  },

  /**
   * DocumentSection - Section with heading + prose body
   * Uses ReactMarkdown with full plugin pipeline for professional rendering
   */
  DocumentSection: ({ element }) => {
    const props = element.props as DocumentSectionProps;
    const HeadingTag = `h${Math.min(props.level || 2, 6)}` as keyof React.JSX.IntrinsicElements;

    return (
      <section className="mb-6">
        <HeadingTag
          className={`font-semibold mb-3 ${
            (props.level || 2) <= 2 ? 'text-lg' : 'text-base'
          }`}
          style={{
            color: 'var(--glass-text-primary)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {props.heading}
        </HeadingTag>
        <div className="document-section-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
            components={markdownComponents}
          >
            {props.content}
          </ReactMarkdown>
        </div>
      </section>
    );
  },

  /**
   * DocumentSource - Source reference with numbered badge
   */
  DocumentSource: ({ element }) => {
    const props = element.props as DocumentSourceProps;
    const typeLabel = props.sourceType || 'source';

    return (
      <div
        className="flex gap-3 py-2 border-b last:border-b-0"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold"
          style={{
            color: 'var(--neon-cyan)',
            backgroundColor: 'var(--glass-elevated)',
          }}
        >
          {props.index}
        </span>
        <div className="flex-1 min-w-0">
          <a
            href={props.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline block truncate"
            style={{ color: 'var(--neon-cyan)' }}
          >
            {props.title}
          </a>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs font-mono uppercase"
              style={{ color: 'var(--glass-text-muted)' }}
            >
              {typeLabel}
            </span>
            {props.relevance !== undefined && (
              <span
                className="text-xs"
                style={{ color: 'var(--glass-text-muted)' }}
              >
                {Math.round(props.relevance * 100)}% relevant
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },

  /**
   * DocumentMeta - Compact metadata footer
   */
  DocumentMeta: ({ element }) => {
    const props = element.props as DocumentMetaProps;

    return (
      <footer
        className="pt-4 mt-4 border-t flex flex-wrap items-center gap-4 text-xs"
        style={{
          borderColor: 'var(--glass-border)',
          color: 'var(--glass-text-muted)',
        }}
      >
        {props.wordCount !== undefined && (
          <span>{props.wordCount.toLocaleString()} words</span>
        )}
        {props.charCount !== undefined && (
          <span>{props.charCount.toLocaleString()} chars</span>
        )}
        {props.confidence !== undefined && (
          <span>
            Confidence:{' '}
            <strong style={{ color: 'var(--glass-text-primary)' }}>
              {Math.round(props.confidence * 100)}%
            </strong>
          </span>
        )}
        {props.createdAt && (
          <span>
            Created: {new Date(props.createdAt).toLocaleDateString()}
          </span>
        )}
      </footer>
    );
  },
};
