// src/widget/components/CommandPalette.tsx
// Full-screen command picker

import { useState, useEffect, useRef, useMemo } from 'react';
import { useWidgetUI } from '../WidgetUIContext';
import type { WidgetMode } from '@core/schema/widget';

interface WidgetCommand {
  id: string;
  name: string;
  hint: string;
  keywords: string[];
  action: 'mode' | 'action';
  payload?: WidgetMode | string;
}

const WIDGET_COMMANDS: WidgetCommand[] = [
  { id: 'explore', name: 'Explore', hint: 'Enter exploration mode', keywords: ['explore', 'terminal', 'journey'], action: 'mode', payload: 'explore' },
  { id: 'garden', name: 'Garden', hint: 'View your sprouts', keywords: ['garden', 'sprouts', 'saved'], action: 'mode', payload: 'garden' },
  { id: 'chat', name: 'Chat', hint: 'Coming soon...', keywords: ['chat', 'talk', 'assistant'], action: 'mode', payload: 'chat' },
  { id: 'help', name: 'Help', hint: 'Show available commands', keywords: ['help', '?', 'commands'], action: 'action', payload: 'help' },
  { id: 'stats', name: 'Stats', hint: 'View session statistics', keywords: ['stats', 'metrics', 'analytics'], action: 'action', payload: 'stats' },
  { id: 'settings', name: 'Settings', hint: 'Open settings', keywords: ['settings', 'config', 'preferences'], action: 'action', payload: 'settings' },
];

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, setMode } = useWidgetUI();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return WIDGET_COMMANDS;
    const lowerQuery = query.toLowerCase().replace(/^\//, '');
    return WIDGET_COMMANDS.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some(kw => kw.includes(lowerQuery))
    );
  }, [query]);

  // Reset state when opening
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus after a tick to ensure DOM is ready
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isCommandPaletteOpen]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  const executeCommand = (cmd: WidgetCommand) => {
    if (cmd.action === 'mode' && cmd.payload) {
      setMode(cmd.payload as WidgetMode);
    }
    // TODO: Handle other action types
    closeCommandPalette();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeCommandPalette();
        break;
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="command-palette-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-50"
      onClick={closeCommandPalette}
    >
      <div
        className="command-palette w-full max-w-lg bg-[var(--grove-surface)] border border-[var(--grove-border)] rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-input-wrapper flex items-center gap-3 px-4 py-3 border-b border-[var(--grove-border)]">
          <span className="text-[var(--grove-accent)]">/</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-[var(--grove-text)] placeholder-[var(--grove-text-dim)] outline-none text-lg"
          />
          <kbd className="text-xs text-[var(--grove-text-dim)] bg-[var(--grove-bg)] px-2 py-1 rounded">
            esc
          </kbd>
        </div>

        <ul className="command-list max-h-64 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <li className="px-4 py-3 text-[var(--grove-text-dim)] text-center">
              No commands found
            </li>
          ) : (
            filteredCommands.map((cmd, index) => (
              <li key={cmd.id}>
                <button
                  onClick={() => executeCommand(cmd)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                    ${index === selectedIndex
                      ? 'bg-[var(--grove-accent-muted)] text-[var(--grove-text)]'
                      : 'text-[var(--grove-text-muted)] hover:bg-[var(--grove-border)]'
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[var(--grove-accent)]">/</span>
                    <span className="font-medium">{cmd.name}</span>
                  </span>
                  <span className="text-sm text-[var(--grove-text-dim)]">{cmd.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
