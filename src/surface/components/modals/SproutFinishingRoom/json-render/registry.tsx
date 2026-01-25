// src/surface/components/modals/SproutFinishingRoom/json-render/registry.tsx
// Sprint: S2-SFR-Display - US-C001 ResearchRegistry definition
// Pattern: json-render registry (maps catalog to React components)

import React from 'react';
import type {
  RenderElement,
  ResearchHeaderProps,
  AnalysisBlockProps,
  SourceListProps,
  LimitationsBlockProps,
  MetadataProps,
} from './catalog';

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
          <span className="font-mono text-xs uppercase mr-2">Query:</span>
          {props.query}
        </p>
      </header>
    );
  },

  AnalysisBlock: ({ element }) => {
    const props = element.props as AnalysisBlockProps;
    return (
      <article className="prose prose-sm max-w-none mb-6 text-[var(--glass-text-primary)]">
        {/* Whitespace-preserved text - markdown rendering can be added later */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {props.content}
        </div>
      </article>
    );
  },

  SourceList: ({ element }) => {
    const props = element.props as SourceListProps;
    return (
      <section className="mb-6">
        <h3 className="text-sm font-mono text-[var(--glass-text-muted)] uppercase mb-3">
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
        <h3 className="text-sm font-mono uppercase mb-2" style={{ color: 'var(--semantic-warning)' }}>
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
