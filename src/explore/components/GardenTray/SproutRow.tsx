// src/explore/components/GardenTray/SproutRow.tsx
// Individual sprout row for GardenTray
// Sprint: garden-tray-mvp, Phase 2a

import React from 'react';
import { motion } from 'framer-motion';
import type { ResearchSprout } from '@core/schema/research-sprout';

// =============================================================================
// Types
// =============================================================================

interface SproutRowProps {
  /** The sprout to display */
  sprout: ResearchSprout;
  /** Status emoji to show */
  emoji: string;
  /** Whether the tray is expanded */
  isExpanded: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function SproutRow({ sprout, emoji, isExpanded }: SproutRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md
                 hover:bg-[var(--glass-hover)] cursor-pointer
                 transition-colors"
      title={sprout.title}
    >
      {/* Status Emoji */}
      <span className="text-sm flex-shrink-0" role="img" aria-label={sprout.status}>
        {emoji}
      </span>

      {/* Title - only visible when expanded */}
      {isExpanded && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[var(--glass-text-primary)] truncate flex-1"
        >
          {sprout.title}
        </motion.span>
      )}
    </motion.div>
  );
}

export default SproutRow;
