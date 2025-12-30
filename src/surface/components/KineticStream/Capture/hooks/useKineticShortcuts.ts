// src/surface/components/KineticStream/Capture/hooks/useKineticShortcuts.ts
// Keyboard shortcuts for kinetic cultivation
// Sprint: kinetic-cultivation-v1

import { useEffect, useCallback } from 'react';

export interface Shortcut {
  key: string;
  modifiers: ('meta' | 'ctrl')[];
  action: () => void;
  description?: string;
}

export function useKineticShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Check if user is typing in an input field
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const hasModifier = isMac ? e.metaKey : e.ctrlKey;

    if (!hasModifier) return;

    const shortcut = shortcuts.find(s =>
      s.key.toLowerCase() === e.key.toLowerCase()
    );

    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Default shortcuts configuration
export const DEFAULT_KINETIC_SHORTCUTS: Omit<Shortcut, 'action'>[] = [
  { key: 's', modifiers: ['meta', 'ctrl'], description: 'Capture selection' },
  { key: '/', modifiers: ['meta', 'ctrl'], description: 'Show keyboard help' },
];
