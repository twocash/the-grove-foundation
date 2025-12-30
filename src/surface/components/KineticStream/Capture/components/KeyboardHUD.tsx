// src/surface/components/KineticStream/Capture/components/KeyboardHUD.tsx
// Keyboard shortcuts overlay
// Sprint: kinetic-cultivation-v1

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface KeyboardHUDProps {
  onDismiss: () => void;
}

const shortcuts = [
  { keys: '\u2318S', keysWin: 'Ctrl+S', description: 'Capture selection' },
  { keys: '\u2318/', keysWin: 'Ctrl+/', description: 'Show this help' },
];

export const KeyboardHUD: React.FC<KeyboardHUDProps> = ({ onDismiss }) => {
  const isMac = typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  useEffect(() => {
    const handleKeyDown = () => onDismiss();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-2xl
                   backdrop-blur-xl p-6 min-w-[280px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-[var(--glass-text-primary)] mb-4 text-center">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-3">
          {shortcuts.map(({ keys, keysWin, description }) => (
            <div key={keys} className="flex items-center justify-between gap-8">
              <span className="px-2 py-1 rounded bg-white/10 text-[var(--glass-text-primary)]
                             font-mono text-sm">
                {isMac ? keys : keysWin}
              </span>
              <span className="text-[var(--glass-text-muted)] text-sm">{description}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--glass-text-subtle)] text-center mt-4">
          Press any key to dismiss
        </p>
      </motion.div>
    </motion.div>
  );
};

export default KeyboardHUD;
