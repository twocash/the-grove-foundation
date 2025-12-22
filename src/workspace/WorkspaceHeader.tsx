// src/workspace/WorkspaceHeader.tsx
// Top bar with branding and global actions

import { useWorkspaceUI } from './WorkspaceUIContext';
import { Settings, HelpCircle } from 'lucide-react';

export function WorkspaceHeader() {
  const { openCommandPalette, toggleInspector, inspector } = useWorkspaceUI();

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-[var(--grove-bg)] border-b border-[var(--grove-border)]">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--grove-accent)] text-lg">🌳</span>
        <span className="font-medium text-[var(--grove-text)]">The Grove</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--grove-text-muted)] bg-[var(--grove-surface)] rounded border border-[var(--grove-border)] hover:border-[var(--grove-accent)] transition-colors"
        >
          <span>Search</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded bg-[var(--grove-bg)]">⌘K</kbd>
        </button>

        {/* Toggle Inspector */}
        <button
          onClick={toggleInspector}
          className={`
            p-2 rounded transition-colors
            ${inspector.isOpen
              ? 'text-[var(--grove-accent)] bg-[var(--grove-accent-muted)]'
              : 'text-[var(--grove-text-muted)] hover:text-[var(--grove-text)]'
            }
          `}
          title="Toggle Inspector (⌘\\)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="14" height="14" rx="2" />
            <line x1="10" y1="1" x2="10" y2="15" />
          </svg>
        </button>

        {/* Settings */}
        <button
          className="p-2 text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        {/* Help */}
        <button
          className="p-2 text-[var(--grove-text-muted)] hover:text-[var(--grove-text)] transition-colors"
          title="Help"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
}
