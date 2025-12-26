// components/Terminal/CommandPalette.tsx
// Command Palette - Searchable list of available commands
// Sprint: terminal-kinetic-commands-v1

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CommandDefinition, CommandCategory, commandRegistry } from '@core/commands';

interface CommandPaletteProps {
  onSelect: (command: CommandDefinition, subcommand?: string) => void;
  onDismiss: () => void;
  initialQuery?: string;
}

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'Navigation',
  action: 'Actions',
  info: 'Information',
  system: 'System'
};

const CATEGORY_ORDER: CommandCategory[] = ['navigation', 'action', 'info', 'system'];

// Simple icon mapping using Material Symbols
const getIcon = (iconName?: string): string => {
  const iconMap: Record<string, string> = {
    Compass: 'explore',
    Glasses: 'visibility',
    Sprout: 'eco',
    BarChart3: 'bar_chart',
    TreeDeciduous: 'forest',
    Telescope: 'search',
    HelpCircle: 'help',
    Sparkles: 'auto_awesome'
  };
  return iconMap[iconName ?? ''] ?? 'terminal';
};

export function CommandPalette({ onSelect, onDismiss, initialQuery = '' }: CommandPaletteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    return commandRegistry.search(query.replace(/^\//, ''));
  }, [query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, CommandDefinition[]> = {
      navigation: [],
      action: [],
      info: [],
      system: []
    };
    filteredCommands.forEach(cmd => groups[cmd.category].push(cmd));
    return groups;
  }, [filteredCommands]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onDismiss();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onDismiss]);

  let flatIndex = 0;

  return (
    <div className="glass-panel rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
      {/* Search Input */}
      <div className="flex items-center gap-2 p-3 border-b border-[var(--glass-border)]">
        <span className="text-[var(--glass-text-muted)]">/</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] outline-none text-sm"
        />
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-[var(--glass-hover)] rounded"
        >
          <span className="material-symbols-outlined text-[var(--glass-text-muted)] text-lg">close</span>
        </button>
      </div>

      {/* Command List */}
      <div className="max-h-64 overflow-y-auto p-2">
        {CATEGORY_ORDER.map(category => {
          const commands = groupedCommands[category];
          if (commands.length === 0) return null;

          return (
            <div key={category} className="mb-2">
              <div className="text-xs font-medium text-[var(--glass-text-muted)] px-2 py-1 uppercase tracking-wide">
                {CATEGORY_LABELS[category]}
              </div>
              {commands.map(cmd => {
                const currentIndex = flatIndex++;
                const isSelected = currentIndex === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => onSelect(cmd)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'hover:bg-[var(--glass-hover)] text-[var(--glass-text-primary)]'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-white' : 'text-[var(--glass-text-muted)]'}`}>
                      {getIcon(cmd.icon)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">/{cmd.trigger}</span>
                        {cmd.aliases && cmd.aliases.length > 0 && (
                          <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-[var(--glass-text-muted)]'}`}>
                            ({cmd.aliases.map(a => `/${a}`).join(', ')})
                          </span>
                        )}
                      </div>
                      <div className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-[var(--glass-text-muted)]'}`}>
                        {cmd.description}
                      </div>
                    </div>
                    {cmd.shortcut && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20' : 'bg-[var(--glass-hover)]'
                      }`}>
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {filteredCommands.length === 0 && (
          <div className="text-center py-4 text-[var(--glass-text-muted)] text-sm">
            No commands match "{query}"
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-[var(--glass-border)] text-xs text-[var(--glass-text-muted)] flex gap-4">
        <span>
          <span className="material-symbols-outlined text-xs align-middle">keyboard_arrow_up</span>
          <span className="material-symbols-outlined text-xs align-middle">keyboard_arrow_down</span>
          {' '}Navigate
        </span>
        <span>
          <span className="material-symbols-outlined text-xs align-middle">keyboard_return</span>
          {' '}Select
        </span>
        <span>Esc Close</span>
      </div>
    </div>
  );
}
