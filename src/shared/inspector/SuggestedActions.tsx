// src/shared/inspector/SuggestedActions.tsx
// Clickable suggestion chips

import type { SuggestedAction } from '@core/copilot';

interface SuggestedActionsProps {
  suggestions: SuggestedAction[];
  onSelect: (template: string) => void;
}

export function SuggestedActions({ suggestions, onSelect }: SuggestedActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion.template)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]
                     bg-indigo-900/40 text-indigo-300 border border-indigo-500/20
                     hover:bg-indigo-800/50 hover:border-indigo-500/40
                     transition-colors cursor-pointer"
        >
          {suggestion.icon && (
            <span className="material-symbols-outlined text-xs">{suggestion.icon}</span>
          )}
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
