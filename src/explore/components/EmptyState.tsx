// src/explore/components/EmptyState.tsx
// Empty state display for when no evidence is found
// Sprint: polish-demo-prep-v1
//
// DEX: Capability Agnosticism
// Graceful degradation with actionable suggestions.

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface EmptyStateProps {
  /** The query that returned no results */
  query: string;
  /** Callback for starting a new query */
  onNewQuery?: () => void;
  /** Callback for suggesting alternative queries */
  onSuggestedQuery?: (query: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function EmptyState({
  query,
  onNewQuery,
  onSuggestedQuery,
  className = '',
}: EmptyStateProps) {
  // Generate query suggestions based on the original query
  const suggestions = generateSuggestions(query);

  return (
    <div className={`p-6 text-center ${className}`}>
      {/* Icon */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-full
                      bg-slate-100 dark:bg-slate-800
                      flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">
          search_off
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No evidence found
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        We couldn't find relevant sources for your research query
      </p>

      {/* Original query display */}
      <div className="max-w-md mx-auto p-3 rounded-lg
                      bg-slate-50 dark:bg-slate-900/50
                      border border-slate-200 dark:border-slate-700 mb-6">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
          Your query
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 italic">
          "{query}"
        </p>
      </div>

      {/* Suggestions */}
      <div className="text-left max-w-md mx-auto mb-6">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
          Try these to improve results:
        </p>
        <ul className="space-y-2">
          <SuggestionItem icon="spellcheck" text="Check spelling and try again" />
          <SuggestionItem icon="tune" text="Use more specific terms" />
          <SuggestionItem icon="expand" text="Broaden your search if too narrow" />
          <SuggestionItem icon="format_quote" text="Try different phrasing" />
        </ul>
      </div>

      {/* Alternative query suggestions */}
      {suggestions.length > 0 && onSuggestedQuery && (
        <div className="max-w-md mx-auto mb-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Alternative queries to try:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestedQuery(suggestion)}
                className="px-3 py-1.5 text-xs font-medium
                           bg-purple-50 dark:bg-purple-900/30
                           text-purple-700 dark:text-purple-300
                           border border-purple-200 dark:border-purple-800/50
                           rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50
                           transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      {onNewQuery && (
        <button
          onClick={onNewQuery}
          className="inline-flex items-center gap-2 px-4 py-2
                     text-sm font-medium text-white
                     bg-purple-600 hover:bg-purple-700
                     rounded-lg shadow-sm transition-colors"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          Try Different Query
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

interface SuggestionItemProps {
  icon: string;
  text: string;
}

function SuggestionItem({ icon, text }: SuggestionItemProps) {
  return (
    <li className="flex items-start gap-2">
      <span className="material-symbols-outlined text-sm text-purple-500 mt-0.5">
        {icon}
      </span>
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {text}
      </span>
    </li>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate alternative query suggestions based on the original query.
 * Simple heuristics - in production, this could use AI/ML.
 */
function generateSuggestions(query: string): string[] {
  const suggestions: string[] = [];
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // If query is very short, suggest more specific terms
  if (words.length <= 2) {
    return [];
  }

  // Suggest using fewer terms (first 2 words)
  if (words.length >= 3) {
    suggestions.push(words.slice(0, 2).join(' '));
  }

  // Suggest using different word combinations
  if (words.length >= 4) {
    suggestions.push(`${words[0]} ${words[words.length - 1]}`);
  }

  return suggestions.slice(0, 3);
}

// =============================================================================
// Export
// =============================================================================

export default EmptyState;
