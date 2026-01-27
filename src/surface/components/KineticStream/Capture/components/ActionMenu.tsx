// src/surface/components/KineticStream/Capture/components/ActionMenu.tsx
// Popup menu for selecting capture action when multiple are available
// Sprint: sprout-declarative-v1

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SelectionAction } from '../hooks/useSelectionActions';

interface ActionMenuProps {
  /** Available actions to display */
  actions: SelectionAction[];
  /** Position for the menu */
  position: { x: number; y: number };
  /** Called when an action is selected */
  onSelect: (actionId: string) => void;
  /** Called when menu is dismissed */
  onClose: () => void;
}

/**
 * ActionMenu - A popup menu for selecting between multiple capture actions
 *
 * Features:
 * - Keyboard navigation (↑/↓, Enter, Escape)
 * - Shortcut keys (e.g., 's' for sprout, 'r' for research)
 * - Hover highlighting
 * - Auto-position within viewport
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  position,
  onSelect,
  onClose,
}) => {
  const [focusIndex, setFocusIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    // Small delay to ensure animation has started
    const timer = setTimeout(() => {
      menuRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for shortcut keys first
      const shortcutAction = actions.find(a => a.shortcut === e.key.toLowerCase());
      if (shortcutAction) {
        e.preventDefault();
        onSelect(shortcutAction.id);
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setFocusIndex(i => (i + 1) % actions.length);
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setFocusIndex(i => (i - 1 + actions.length) % actions.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(actions[focusIndex].id);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, focusIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close on the click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Position within viewport
  const menuWidth = 256;
  const menuHeight = actions.length * 72 + 16; // Approximate height
  const menuX = Math.min(position.x, window.innerWidth - menuWidth - 16);
  const menuY = Math.min(position.y, window.innerHeight - menuHeight - 16);

  return (
    <motion.div
      ref={menuRef}
      tabIndex={-1}
      data-capture-ui="menu"
      className="fixed z-50 w-64 rounded-xl overflow-hidden
                 bg-[var(--glass-solid)] border border-[var(--glass-border)]
                 backdrop-blur-xl shadow-2xl
                 focus:outline-none"
      style={{ left: menuX, top: menuY }}
      onMouseDown={(e) => e.preventDefault()}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-[var(--glass-border)]">
        <span className="text-xs text-[var(--glass-text-muted)] tracking-wide">
          Capture As
        </span>
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setFocusIndex(index)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left
                       transition-colors duration-100
                       ${index === focusIndex
                         ? 'bg-white/10 ring-1 ring-[var(--neon-cyan)]'
                         : 'hover:bg-white/5'}`}
          >
            <span className="text-xl flex-shrink-0" role="img" aria-hidden="true">
              {action.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--glass-text-primary)]">
                  {action.label}
                </span>
                {action.shortcut && (
                  <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/10
                                  text-[10px] text-[var(--glass-text-muted)]
                                  font-mono">
                    {action.shortcut}
                  </kbd>
                )}
              </div>
              <span className="text-xs text-[var(--glass-text-muted)] line-clamp-1">
                {action.description}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-[var(--glass-border)]">
        <span className="text-[10px] text-[var(--glass-text-subtle)]">
          ↑↓ navigate · enter select · esc cancel
        </span>
      </div>
    </motion.div>
  );
};

export default ActionMenu;
