// src/explore/components/CitationsSection.tsx
// Expandable citations list
// Sprint: results-display-v1
//
// DEX: Provenance as Infrastructure
// Every citation is traceable to its source with full metadata.

import { useState } from 'react';
import type { Citation } from '@core/schema/research-document';
import { CitationBlock } from './CitationBlock';

interface CitationsSectionProps {
  citations: Citation[];
  /** Start expanded (default: false) */
  defaultExpanded?: boolean;
}

/**
 * CitationsSection - Expandable/collapsible citations list
 *
 * Features:
 * - Collapsible by default (shows count)
 * - Expand animation
 * - Full citation blocks when expanded
 */
export function CitationsSection({
  citations,
  defaultExpanded = false,
}: CitationsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (citations.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50
                      border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="material-symbols-outlined text-lg">info</span>
          <p className="text-sm">No citations available for this document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header - clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3
                   bg-slate-50 dark:bg-slate-900/50
                   hover:bg-slate-100 dark:hover:bg-slate-800
                   transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-lg">
            format_quote
          </span>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Sources
          </h3>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full
                           bg-purple-100 dark:bg-purple-900/40
                           text-purple-600 dark:text-purple-400">
            {citations.length}
          </span>
        </div>

        {/* Expand/collapse icon */}
        <span
          className={`material-symbols-outlined text-slate-400 transition-transform duration-200
                      ${isExpanded ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {/* Citations list - animated */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden
                    ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 space-y-3 bg-white dark:bg-slate-900/30">
          {citations
            .sort((a, b) => a.index - b.index)
            .map((citation) => (
              <CitationBlock key={citation.index} citation={citation} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default CitationsSection;
