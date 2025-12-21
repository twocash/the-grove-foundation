// CommandAutocomplete - Dropdown for command suggestions
// Sprint v0.16: Command Palette feature

import React from 'react';
import { Command } from './CommandRegistry';

interface CommandAutocompleteProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
}

const CommandAutocomplete: React.FC<CommandAutocompleteProps> = ({
  commands,
  selectedIndex,
  onSelect
}) => {
  if (commands.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-ink/20 rounded shadow-sm overflow-hidden z-50">
      {commands.map((command, index) => (
        <button
          key={command.id}
          onClick={() => onSelect(command)}
          className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
            index === selectedIndex
              ? 'bg-paper'
              : 'hover:bg-paper/50'
          }`}
        >
          <span className="font-mono text-sm text-grove-forest">
            /{command.id}
          </span>
          <span className="text-xs text-ink-muted truncate">
            {command.description}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CommandAutocomplete;
