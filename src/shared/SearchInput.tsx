// src/shared/SearchInput.tsx
// Typeahead search input with clear button

import { useRef } from 'react';

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SearchInput({ placeholder, value, onChange, onClear, className = '' }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)]">
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-sm text-[var(--glass-text-secondary)] placeholder:text-[var(--glass-text-subtle)] focus:outline-none focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/30 transition-colors"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-secondary)] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}
