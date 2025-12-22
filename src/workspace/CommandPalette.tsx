// src/workspace/CommandPalette.tsx
// Global command palette for workspace

import { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkspaceUI } from './WorkspaceUIContext';
import type { NavigationPath } from '@core/schema/workspace';

interface WorkspaceCommand {
  id: string;
  name: string;
  hint: string;
  keywords: string[];
  action: 'navigate' | 'action';
  path?: NavigationPath;
  handler?: () => void;
}

const WORKSPACE_COMMANDS: WorkspaceCommand[] = [
  // Explore section
  { id: 'explore', name: 'Explore', hint: 'Open Terminal', keywords: ['explore', 'terminal', 'talk', 'home'], action: 'navigate', path: ['explore'] },
  { id: 'nodes', name: 'Nodes', hint: 'Browse knowledge nodes', keywords: ['nodes', 'knowledge', 'browse'], action: 'navigate', path: ['explore', 'nodes'] },
  { id: 'journeys', name: 'Journeys', hint: 'View available journeys', keywords: ['journeys', 'paths', 'explore'], action: 'navigate', path: ['explore', 'journeys'] },
  { id: 'lenses', name: 'Lenses', hint: 'Choose a perspective', keywords: ['lenses', 'persona', 'perspective'], action: 'navigate', path: ['explore', 'lenses'] },
  // Do section (Coming Soon)
  { id: 'chat', name: 'Chat', hint: 'Coming Soon', keywords: ['chat', 'brainstorm', 'write'], action: 'navigate', path: ['do', 'chat'] },
  { id: 'apps', name: 'Apps', hint: 'Coming Soon', keywords: ['apps', 'tools', 'widgets'], action: 'navigate', path: ['do', 'apps'] },
  { id: 'agents', name: 'Agents', hint: 'Coming Soon', keywords: ['agents', 'delegate', 'tasks'], action: 'navigate', path: ['do', 'agents'] },
  // Cultivate section
  { id: 'sprouts', name: 'My Sprouts', hint: 'View your captured insights', keywords: ['sprouts', 'cultivate', 'saved'], action: 'navigate', path: ['cultivate', 'mySprouts'] },
  { id: 'commons', name: 'Commons', hint: 'Browse shared knowledge', keywords: ['commons', 'shared', 'community'], action: 'navigate', path: ['cultivate', 'commons'] },
  // Village section
  { id: 'feed', name: 'Village Feed', hint: 'See agent activity', keywords: ['feed', 'village', 'diary', 'agents'], action: 'navigate', path: ['village', 'feed'] },
];

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, navigateTo, toggleInspector } = useWorkspaceUI();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return WORKSPACE_COMMANDS;
    const lowerQuery = query.toLowerCase().replace(/^\//, '');
    return WORKSPACE_COMMANDS.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some(kw => kw.includes(lowerQuery))
    );
  }, [query]);

  // Reset state when opening
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isCommandPaletteOpen]);

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  const executeCommand = (cmd: WorkspaceCommand) => {
    if (cmd.action === 'navigate' && cmd.path) {
      navigateTo(cmd.path);
    } else if (cmd.action === 'action' && cmd.handler) {
      cmd.handler();
    }
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
          <span className="text-[var(--grove-accent)]">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search or type a command..."
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
                    <span className="font-medium">{cmd.name}</span>
                  </span>
                  <span className="text-sm text-[var(--grove-text-dim)]">{cmd.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="px-4 py-2 border-t border-[var(--grove-border)] text-xs text-[var(--grove-text-dim)]">
          <span className="mr-4">↑↓ Navigate</span>
          <span className="mr-4">↵ Select</span>
          <span>esc Close</span>
        </div>
      </div>
    </div>
  );
}
