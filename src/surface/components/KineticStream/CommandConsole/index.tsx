// src/surface/components/KineticStream/CommandConsole/index.tsx
// Floating input console
// Sprint: kinetic-experience-v1, kinetic-scroll-v1

import React, { useState, useCallback, KeyboardEvent } from 'react';
import { ScrollToBottomFab } from './ScrollToBottomFab';

export interface CommandConsoleProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  showScrollButton?: boolean;
  onScrollToBottom?: () => void;
  isStreaming?: boolean;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({
  onSubmit,
  isLoading,
  placeholder = 'Ask anything...',
  showScrollButton = false,
  onScrollToBottom,
  isStreaming = false,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      onSubmit(trimmed);
      setValue('');
    }
  }, [value, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="kinetic-console relative">
      {/* Scroll FAB - positioned above input */}
      {onScrollToBottom && (
        <ScrollToBottomFab
          visible={showScrollButton}
          isStreaming={isStreaming}
          onClick={onScrollToBottom}
        />
      )}

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className="kinetic-console-input pr-12"
          data-testid="command-input"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !value.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                     bg-[var(--neon-green)] text-white
                     hover:bg-[var(--neon-green)]/80
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
          data-testid="submit-button"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommandConsole;
