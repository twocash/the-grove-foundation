// src/workspace/WorkspaceHeader.tsx
// Top bar with branding and global actions

import { useState, useEffect } from 'react';
import { useWorkspaceUI } from './WorkspaceUIContext';

export function WorkspaceHeader() {
  const { openCommandPalette, toggleInspector, inspector } = useWorkspaceUI();
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('grove-theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('grove-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('grove-theme', 'light');
    }
  };

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
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={`material-symbols-outlined ${isDark ? 'hidden' : ''}`}>dark_mode</span>
          <span className={`material-symbols-outlined ${isDark ? '' : 'hidden'}`}>light_mode</span>
        </button>
      </div>
    </header>
  );
}
