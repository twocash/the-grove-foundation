// src/widget/components/WidgetInput.tsx
// Command input with slash command detection

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { useWidgetUI } from '../WidgetUIContext';

interface WidgetInputProps {
  onSubmit?: (message: string) => void;
  placeholder?: string;
}

export function WidgetInput({ onSubmit, placeholder = 'Type a message or command...' }: WidgetInputProps) {
  const [value, setValue] = useState('');
  const { openCommandPalette } = useWidgetUI();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // If user types "/" as first character, open command palette
    if (newValue === '/') {
      openCommandPalette();
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      if (value.startsWith('/')) {
        // Handle as command
        openCommandPalette();
      } else if (onSubmit) {
        onSubmit(value.trim());
      }
      setValue('');
    }
  };

  return (
    <div className="widget-input flex items-center gap-2 px-4 py-3 border-t border-[var(--grove-border)]">
      <span className="text-[var(--grove-text-muted)]">/</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[var(--grove-text)] placeholder-[var(--grove-text-dim)] outline-none"
      />
      <button
        onClick={openCommandPalette}
        className="command-hint px-2 py-1 text-xs text-[var(--grove-text-dim)] bg-[var(--grove-surface)] rounded border border-[var(--grove-border)] hover:border-[var(--grove-accent)] transition-colors"
        title="Open command palette (⌘K)"
      >
        ⌘K
      </button>
    </div>
  );
}
