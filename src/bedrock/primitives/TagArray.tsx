// src/bedrock/primitives/TagArray.tsx
// Tag/chip array component for keyword management
// Sprint: pipeline-inspector-v1 (Epic 3)

import React, { useState, KeyboardEvent } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface TagArrayProps {
  value: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  maxTags?: number;
}

// =============================================================================
// Component
// =============================================================================

export function TagArray({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  readOnly = false,
  maxTags = 20,
}: TagArrayProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (!value.includes(newTag) && value.length < maxTags) {
        onChange?.([...value, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace when input is empty
      onChange?.(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--card-bg,var(--glass-panel))] border border-[var(--card-border,var(--glass-border))] text-[var(--card-text,var(--glass-text-secondary))]"
            >
              {tag}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-0.5 w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--glass-elevated)] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {!readOnly && value.length < maxTags && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)] focus:border-[var(--neon-cyan)] focus:outline-none"
        />
      )}

      {/* Empty state */}
      {value.length === 0 && readOnly && (
        <span className="text-sm text-[var(--glass-text-subtle)] italic">
          No tags
        </span>
      )}
    </div>
  );
}

export default TagArray;
