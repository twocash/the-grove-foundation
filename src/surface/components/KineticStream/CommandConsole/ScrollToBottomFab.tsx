// src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx
// Floating action button to resume auto-scroll
// Sprint: kinetic-scroll-v1

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

export interface ScrollToBottomFabProps {
  visible: boolean;
  isStreaming: boolean;
  onClick: () => void;
}

export const ScrollToBottomFab: React.FC<ScrollToBottomFabProps> = ({
  visible,
  isStreaming,
  onClick,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={onClick}
          className="absolute -top-14 left-1/2 -translate-x-1/2
                     w-10 h-10 rounded-full
                     bg-[var(--glass-panel)] border border-[var(--glass-border)]
                     flex items-center justify-center
                     hover:bg-[var(--glass-solid)] hover:border-[var(--neon-cyan)]
                     transition-colors cursor-pointer
                     shadow-lg"
          aria-label="Scroll to bottom"
          data-testid="scroll-to-bottom-fab"
        >
          <ArrowDown className="w-4 h-4 text-[var(--glass-text-primary)]" />

          {/* Streaming indicator dot */}
          {isStreaming && (
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--neon-green)]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToBottomFab;
