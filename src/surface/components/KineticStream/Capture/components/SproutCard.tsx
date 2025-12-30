// src/surface/components/KineticStream/Capture/components/SproutCard.tsx
// Individual sprout card in the tray
// Sprint: kinetic-cultivation-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { Sprout } from '@core/schema/sprout';

interface SproutCardProps {
  sprout: Sprout;
  onDelete: (id: string) => void;
  isExpanded: boolean;
}

function timeAgo(timestamp: string | number): string {
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const SproutCard: React.FC<SproutCardProps> = ({
  sprout,
  onDelete,
  isExpanded
}) => {
  // Use response field (the captured text)
  const content = sprout.response || sprout.query || '';
  const preview = content.slice(0, 60) + (content.length > 60 ? '...' : '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group p-3 rounded-lg bg-white/5 hover:bg-white/10
                 border border-[var(--glass-border)] transition-colors"
      data-testid="sprout-card"
    >
      {isExpanded ? (
        <>
          <p className="text-sm text-[var(--glass-text-body)] mb-2 line-clamp-2">
            {preview}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {sprout.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-[var(--neon-green)]/20
                            text-[var(--neon-green)] text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-subtle)]">
                {timeAgo(sprout.capturedAt)}
              </span>
              <button
                onClick={() => onDelete(sprout.id)}
                className="p-1 rounded opacity-0 group-hover:opacity-100
                          hover:bg-red-500/20 text-[var(--glass-text-subtle)]
                          hover:text-red-400 transition-all"
                aria-label="Delete sprout"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        // Collapsed state - just show emoji
        <div className="flex items-center justify-center text-lg" role="img" aria-label="Sprout">
          {'\u{1F331}'}
        </div>
      )}
    </motion.div>
  );
};

export default SproutCard;
