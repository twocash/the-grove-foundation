// src/explore/components/CitationBlock.tsx
// Individual citation display with hover expansion
// Sprint: results-display-v1
//
// DEX: Provenance as Infrastructure
// Every citation shows title, URL, domain, snippet, and access timestamp.

import { useState } from 'react';
import type { Citation } from '@core/schema/research-document';

interface CitationBlockProps {
  citation: Citation;
  /** Callback when citation is clicked */
  onClick?: () => void;
  /** Scroll to this element ID when clicking inline citation */
  scrollTargetId?: string;
}

/**
 * CitationBlock - Individual citation display
 *
 * Shows:
 * - Index badge [1]
 * - Title (linked to source URL)
 * - Domain badge
 * - Snippet preview (truncated, expandable on hover)
 * - Accessed timestamp
 */
export function CitationBlock({ citation, onClick }: CitationBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format the accessed date
  const accessedDate = new Date(citation.accessedAt);
  const formattedDate = accessedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Truncate snippet for preview
  const SNIPPET_PREVIEW_LENGTH = 120;
  const isLongSnippet = citation.snippet.length > SNIPPET_PREVIEW_LENGTH;
  const snippetPreview = isLongSnippet
    ? citation.snippet.slice(0, SNIPPET_PREVIEW_LENGTH) + '...'
    : citation.snippet;

  return (
    <div
      id={`citation-${citation.index}`}
      className="group p-3 rounded-lg border border-slate-200 dark:border-slate-700
                 bg-white dark:bg-slate-900
                 hover:border-purple-300 dark:hover:border-purple-700
                 hover:shadow-sm transition-all"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={onClick}
    >
      {/* Top row: Index + Title + Domain */}
      <div className="flex items-start gap-2">
        {/* Index Badge */}
        <span className="shrink-0 w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/40
                         text-purple-600 dark:text-purple-400
                         text-xs font-semibold
                         flex items-center justify-center">
          [{citation.index}]
        </span>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          {/* Title - linked */}
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-900 dark:text-slate-100
                       hover:text-purple-600 dark:hover:text-purple-400
                       hover:underline line-clamp-2"
            onClick={(e) => e.stopPropagation()}
          >
            {citation.title}
          </a>

          {/* Domain badge + accessed date */}
          <div className="flex items-center gap-2 mt-1">
            <span className="px-1.5 py-0.5 text-xs font-mono rounded
                             bg-slate-100 dark:bg-slate-800
                             text-slate-600 dark:text-slate-400">
              {citation.domain}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Accessed {formattedDate}
            </span>
          </div>
        </div>

        {/* External link icon */}
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1 text-slate-400 hover:text-purple-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
        </a>
      </div>

      {/* Snippet - expandable */}
      <div className="mt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {isExpanded || !isLongSnippet ? citation.snippet : snippetPreview}
        </p>
        {isLongSnippet && !isExpanded && (
          <button
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
          >
            Show more
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * InlineCitation - Small superscript citation link
 * Used within markdown analysis text
 */
interface InlineCitationProps {
  index: number;
  onClick?: () => void;
}

export function InlineCitation({ index, onClick }: InlineCitationProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      // Default: scroll to citation
      const element = document.getElementById(`citation-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        element.classList.add('ring-2', 'ring-purple-500');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-purple-500');
        }, 2000);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center justify-center
                 text-[10px] font-semibold
                 text-purple-600 dark:text-purple-400
                 hover:text-purple-800 dark:hover:text-purple-300
                 bg-purple-50 dark:bg-purple-900/30
                 rounded px-1 py-0.5
                 hover:underline cursor-pointer
                 transition-colors
                 align-super -translate-y-0.5"
    >
      [{index}]
    </button>
  );
}

export default CitationBlock;
