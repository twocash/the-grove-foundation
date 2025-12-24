// CommandAutocomplete - Dropdown for command suggestions
// Sprint v0.16: Command Palette feature

import React from 'react';
import { Command } from './CommandRegistry';

interface CommandAutocompleteProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  embedded?: boolean;
}

const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  commands,
  selectedIndex,
  onSelect,
  embedded = false
}) => {
  if (commands.length === 0) {
    return null;
  }

  return (
    <div className={`absolute bottom-full left-0 right-0 mb-1 rounded shadow-sm overflow-hidden z-50 ${
      embedded
        ? 'bg-[var(--chat-surface)] border border-[var(--chat-border)]'
        : 'bg-white border border-ink/20'
    }`}>
      {commands.map((command, index) => (
        <button
          key={command.id}
          onClick={() => onSelect(command)}
          className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
            embedded
              ? index === selectedIndex
                ? 'bg-[var(--chat-glass-hover)]'
                : 'hover:bg-[var(--chat-glass)]'
              : index === selectedIndex
                ? 'bg-paper'
                : 'hover:bg-paper/50'
          }`}
        >
          <span className={`font-mono text-sm ${embedded ? 'text-[var(--chat-text-accent)]' : 'text-grove-forest'}`}>
            /{command.id}
          </span>
          <span className={`text-xs truncate ${embedded ? 'text-[var(--chat-text-muted)]' : 'text-ink-muted'}`}>
            {command.description}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CommandAutocomplete;
