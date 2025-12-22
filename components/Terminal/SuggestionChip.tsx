// components/Terminal/SuggestionChip.tsx
// Clickable suggestion chip for AI-suggested prompts
// v0.12: Part of Terminal UX modernization

import React from 'react';

interface SuggestionChipProps {
  prompt: string;
  onClick: (prompt: string) => void;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ prompt, onClick }) => {
  return (
    <button
      onClick={() => onClick(prompt)}
      className="w-full text-left px-4 py-2.5 bg-white/50 dark:bg-white/10 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/20 hover:border-primary/30 hover:shadow-sm active:scale-[0.99] transition-all duration-150 flex items-center justify-between group"
    >
      <span>{prompt}</span>
      <svg
        className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export default SuggestionChip;
