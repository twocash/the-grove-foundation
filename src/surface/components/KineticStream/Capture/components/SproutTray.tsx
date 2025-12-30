// src/surface/components/KineticStream/Capture/components/SproutTray.tsx
// Collapsible tray showing captured sprouts
// Sprint: kinetic-cultivation-v1

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SproutCard } from './SproutCard';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';
import type { Sprout } from '@core/schema/sprout';

export interface SproutTrayProps {
  /** All sprouts to display (from useSproutStorage) */
  sprouts: Sprout[];
  /** Handler to delete a sprout */
  onDelete: (id: string) => void;
  /** Session sprout count for badge */
  sessionCount: number;
}

export const SproutTray: React.FC<SproutTrayProps> = ({
  sprouts: allSprouts,
  onDelete,
  sessionCount
}) => {
  const { collapsedWidth, expandedWidth } = SPROUT_CAPTURE_CONFIG.ui.tray;
  const { counterSpring } = SPROUT_CAPTURE_CONFIG.animation;

  const [isExpanded, setIsExpanded] = useState(false);

  // Get sprouts (most recent first, max 10)
  const sprouts = useMemo(() =>
    allSprouts.slice().reverse().slice(0, 10),
    [allSprouts]
  );
  const totalCount = sessionCount;

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
    console.log('[Tray] Sprout deleted:', id.slice(0, 8));
  }, [onDelete]);

  return (
    <motion.div
      className="fixed right-0 top-0 h-full z-40
                 bg-[var(--tray-bg)] backdrop-blur-xl
                 border-l border-[var(--tray-border)]
                 shadow-[var(--tray-shadow)]
                 flex flex-col"
      initial={false}
      animate={{
        width: isExpanded ? expandedWidth : collapsedWidth,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      data-testid="sprout-tray"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-hidden="true">
            {SPROUT_CAPTURE_CONFIG.defaultAction.icon}
          </span>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-[var(--glass-text-secondary)]"
            >
              Sprouts
            </motion.span>
          )}
        </div>

        {/* Counter badge */}
        <motion.span
          key={totalCount}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', ...counterSpring }}
          className="flex items-center justify-center min-w-[20px] h-5
                    px-1.5 rounded-full text-xs font-medium
                    bg-[var(--tray-badge-bg)] text-[var(--tray-badge-text)]"
        >
          {totalCount}
        </motion.span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {sprouts.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[var(--glass-text-subtle)] text-center py-8"
            >
              {isExpanded ? 'Select text to plant sprouts' : ''}
            </motion.p>
          ) : (
            <div className="space-y-2">
              {sprouts.map(sprout => (
                <SproutCard
                  key={sprout.id}
                  sprout={sprout}
                  onDelete={handleDelete}
                  isExpanded={isExpanded}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer hint when expanded */}
      {isExpanded && sprouts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 border-t border-[var(--glass-border)] text-center"
        >
          <span className="text-xs text-[var(--glass-text-subtle)]">
            {totalCount} sprout{totalCount !== 1 ? 's' : ''} captured
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SproutTray;
