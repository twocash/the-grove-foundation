// components/Terminal/NewMessagesIndicator.tsx
// Floating indicator showing new message count
// Sprint: kinetic-stream-polish-v1

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewMessagesIndicatorProps {
  count: number;
  onClick: () => void;
}

/**
 * Floating indicator showing new message count.
 * Appears when user has scrolled up and new messages arrive.
 */
export function NewMessagesIndicator({
  count,
  onClick
}: NewMessagesIndicatorProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          className="new-messages-indicator"
          onClick={onClick}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={`${count} new message${count > 1 ? 's' : ''}, click to scroll to bottom`}
          role="status"
          aria-live="polite"
        >
          <span>
            {count} new message{count > 1 ? 's' : ''}
          </span>
          <span className="arrow">↓</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default NewMessagesIndicator;
