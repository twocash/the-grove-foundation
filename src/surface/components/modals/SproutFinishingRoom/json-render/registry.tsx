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
      <header className="mb-6 pb-4 border-b border-ink/10 dark:border-white/10">
        <h1 className="text-xl font-serif font-semibold text-ink dark:text-paper mb-2">
          {props.position}
        </h1>
        <p className="text-sm text-ink-muted dark:text-paper/60">
          <span className="font-mono text-xs uppercase mr-2">Query:</span>
          {props.query}
        </p>
      </header>
    );
  },

  AnalysisBlock: ({ element }) => {
    const props = element.props as AnalysisBlockProps;
    return (
      <article className="prose prose-sm max-w-none mb-6 text-ink dark:text-paper">
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
        <h3 className="text-sm font-mono text-ink-muted dark:text-paper/50 uppercase mb-3">
          Sources
        </h3>
        <ul className="space-y-2">
          {props.sources.map((source) => (
            <li key={source.index} className="flex gap-2 text-sm">
              <span className="text-grove-forest dark:text-grove-forest/80 font-mono font-semibold">
                [{source.index}]
              </span>
              <div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-grove-forest dark:text-grove-forest/80 hover:underline"
                >
                  {source.title}
                </a>
                {source.snippet && (
                  <p className="text-xs text-ink-muted dark:text-paper/50 mt-1">
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
      <aside className="mb-6 p-3 bg-grove-clay/10 dark:bg-grove-clay/20 rounded border-l-2 border-grove-clay">
        <h3 className="text-sm font-mono text-grove-clay uppercase mb-2">
          Limitations
        </h3>
        <p className="text-sm text-ink-muted dark:text-paper/70">
          {props.content}
        </p>
      </aside>
    );
  },

  Metadata: ({ element }) => {
    const props = element.props as MetadataProps;

    const statusColors = {
      complete: 'bg-grove-forest/10 text-grove-forest dark:bg-grove-forest/20',
      partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'insufficient-evidence': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <footer className="pt-4 border-t border-ink/10 dark:border-white/10 flex items-center gap-4 text-xs text-ink-muted dark:text-paper/50">
        <span className={`px-2 py-1 rounded font-mono ${statusColors[props.status]}`}>
          {props.status.toUpperCase().replace('-', ' ')}
        </span>
        <span>
          Confidence: <strong className="text-ink dark:text-paper">{Math.round(props.confidenceScore * 100)}%</strong>
        </span>
        <span>
          {props.wordCount.toLocaleString()} words
        </span>
      </footer>
    );
  },
};

export default ResearchRegistry;
