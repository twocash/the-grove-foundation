// src/surface/components/modals/SproutFinishingRoom/json-render/registry.tsx
// Sprint: S2-SFR-Display - US-C001 ResearchRegistry definition
// S25-SFR: Upgraded AnalysisBlock to full ReactMarkdown + GroveSkins styling
// Pattern: json-render registry (maps catalog to React components)

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type {
  RenderElement,
  ResearchHeaderProps,
  AnalysisBlockProps,
  SourceListProps,
  LimitationsBlockProps,
  MetadataProps,
} from './catalog';

// ============================================================================
// MARKDOWN COMPONENT OVERRIDES (GroveSkins self-contained styling)
// Ported from bedrock DocumentRegistry for consistent rendering
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
      className="text-sm font-semibold mt-3 mb-1 tracking-wide"
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
  // Inline citation rendering for <cite> tags from writer output
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
 * Component registry interface
 */
export interface ComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * ResearchRegistry - Maps catalog components to React implementations
 *
 * Each component receives the full element object with type and props.
 * This allows for consistent rendering across the document tree.
 */
export const ResearchRegistry: ComponentRegistry = {
  ResearchHeader: ({ element }) => {
    const props = element.props as ResearchHeaderProps;
    return (
      <header className="mb-6 pb-4 border-b border-[var(--glass-border)]">
        <h1 className="text-xl font-serif font-semibold text-[var(--glass-text-primary)] mb-2">
          {props.position}
        </h1>
        <p className="text-sm text-[var(--glass-text-muted)]">
          <span className="font-mono text-xs mr-2">Query:</span>
          {props.query}
        </p>
      </header>
    );
  },

  AnalysisBlock: ({ element }) => {
    const props = element.props as AnalysisBlockProps;
    return (
      <article className="mb-6">
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

  SourceList: ({ element }) => {
    const props = element.props as SourceListProps;
    return (
      <section className="mb-6">
        <h3 className="text-sm font-mono text-[var(--glass-text-muted)] mb-3">
          Sources
        </h3>
        <ul className="space-y-2">
          {props.sources.map((source) => (
            <li key={source.index} className="flex gap-2 text-sm">
              <span className="text-[var(--neon-cyan)] font-mono font-semibold">
                [{source.index}]
              </span>
              <div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--neon-cyan)] hover:underline"
                >
                  {source.title}
                </a>
                {source.snippet && (
                  <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                    {source.snippet}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  },

  LimitationsBlock: ({ element }) => {
    const props = element.props as LimitationsBlockProps;
    return (
      <aside className="mb-6 p-3 rounded border-l-2" style={{ backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning)' }}>
        <h3 className="text-sm font-mono mb-2" style={{ color: 'var(--semantic-warning)' }}>
          Limitations
        </h3>
        <p className="text-sm text-[var(--glass-text-muted)]">
          {props.content}
        </p>
      </aside>
    );
  },

  Metadata: ({ element }) => {
    const props = element.props as MetadataProps;

    const statusColors = {
      complete: 'bg-[var(--glass-elevated)] text-[var(--semantic-success)]',
      partial: 'bg-[var(--glass-elevated)] text-amber-500',
      'insufficient-evidence': 'bg-[var(--glass-elevated)] text-red-500',
    };

    return (
      <footer className="pt-4 border-t border-[var(--glass-border)] flex items-center gap-4 text-xs text-[var(--glass-text-muted)]">
        <span className={`px-2 py-1 rounded font-mono ${statusColors[props.status]}`}>
          {props.status.toUpperCase().replace('-', ' ')}
        </span>
        <span>
          Confidence: <strong className="text-[var(--glass-text-primary)]">{Math.round(props.confidenceScore * 100)}%</strong>
        </span>
        <span>
          {props.wordCount.toLocaleString()} words
        </span>
      </footer>
    );
  },
};

export default ResearchRegistry;
