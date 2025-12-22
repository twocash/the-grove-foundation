// src/workspace/WorkspaceHeader.tsx
// Top bar with branding and global actions

import { useWorkspaceUI } from './WorkspaceUIContext';
import { useWorkspaceState } from '../lib/useWorkspaceState';

export function WorkspaceHeader() {
  const { openCommandPalette, toggleInspector, inspector } = useWorkspaceUI();
  const { effectiveTheme, preferences, toggleTheme } = useWorkspaceState();

  const isDark = effectiveTheme === 'dark';
  const themeLabel = preferences.theme === 'system'
    ? `System (${effectiveTheme})`
    : effectiveTheme === 'dark' ? 'Dark' : 'Light';

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-[var(--grove-surface)] border-b border-[var(--grove-border)] flex-shrink-0 z-10">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-2xl filled">forest</span>
        <span className="font-serif font-bold text-lg text-[var(--grove-text)]">The Grove</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2 bg-stone-100 dark:bg-slate-900 border border-[var(--grove-border)] px-2 py-1.5 rounded-md text-sm text-[var(--grove-text-muted)] min-w-[160px] justify-between group cursor-pointer hover:border-primary transition-colors"
        >
          <span>Search</span>
          <span className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1">⌘K</span>
        </button>

        {/* Toggle Inspector */}
        <button
          onClick={toggleInspector}
          className={`
            p-2 rounded-md transition-colors
            ${inspector.isOpen
              ? 'text-primary bg-stone-100 dark:bg-slate-700'
              : 'text-[var(--grove-text-muted)] hover:bg-stone-100 dark:hover:bg-slate-700'
            }
          `}
          title="Toggle Inspector (⌘\\)"
        >
          <span className="material-symbols-outlined">dock_to_right</span>
        </button>

        {/* Settings */}
        <button
          className="p-2 text-[var(--grove-text-muted)] hover:bg-stone-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          title="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[var(--grove-text-muted)] hover:bg-stone-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          title={`Theme: ${themeLabel} (click to cycle)`}
        >
          {preferences.theme === 'system' ? (
            <span className="material-symbols-outlined">contrast</span>
          ) : isDark ? (
            <span className="material-symbols-outlined">light_mode</span>
          ) : (
            <span className="material-symbols-outlined">dark_mode</span>
          )}
        </button>
      </div>
    </header>
  );
}
