// src/bedrock/components/SearchInput.tsx
// Search input for collection views
// Sprint: bedrock-foundation-v1

import React, { useState, useEffect, useCallback } from 'react';
import type { SearchInputProps } from '../patterns/collection-view.types';

// =============================================================================
// SearchInput Component
// =============================================================================

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg text-foreground-muted">
        search
      </span>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="
          w-full pl-10 pr-10 py-2 rounded-lg
          bg-surface-light dark:bg-surface-dark
          border border-border-light dark:border-border-dark
          text-foreground-light dark:text-foreground-dark
          placeholder-foreground-muted
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          text-sm
        "
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

// =============================================================================
// SearchBar Component (full-featured)
// =============================================================================

interface SearchBarProps extends SearchInputProps {
  resultCount?: number;
  totalCount?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  resultCount,
  totalCount,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <SearchInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          debounceMs={debounceMs}
        />
      </div>
      {resultCount !== undefined && totalCount !== undefined && (
        <span className="text-sm text-foreground-muted whitespace-nowrap">
          {resultCount === totalCount
            ? `${totalCount} items`
            : `${resultCount} of ${totalCount}`
          }
        </span>
      )}
    </div>
  );
}

export default SearchInput;
