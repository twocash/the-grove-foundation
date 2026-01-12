// src/explore/components/GardenTray/SproutRow.tsx
// Individual sprout row for GardenTray with expandable results
// Sprint: garden-tray-mvp, Phase 2a
// Enhanced: sprout-status-panel-v1, Phase 3c

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  /** Whether this is a newly ready sprout (for highlight) */
  isNewlyReady?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function SproutRow({ sprout, emoji, isExpanded, isNewlyReady = false }: SproutRowProps) {
  const [isResultsExpanded, setIsResultsExpanded] = useState(false);

  // Can show results only for completed sprouts with synthesis
  const hasResults = sprout.status === 'completed' && sprout.synthesis;

  const handleClick = () => {
    if (hasResults && isExpanded) {
      setIsResultsExpanded(prev => !prev);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        rounded-md transition-colors
        ${isNewlyReady ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : ''}
        ${hasResults && isExpanded ? 'hover:bg-[var(--glass-hover)] cursor-pointer' : ''}
      `}
    >
      {/* Header Row */}
      <div
        className="flex items-center gap-2 px-2 py-1.5"
        onClick={handleClick}
        title={hasResults ? 'Click to view results' : sprout.title}
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

        {/* Expand indicator for completed sprouts */}
        {isExpanded && hasResults && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[var(--glass-text-muted)]"
          >
            {isResultsExpanded ? '▼' : '▶'}
          </motion.span>
        )}
      </div>

      {/* Results Panel (Expandable) */}
      <AnimatePresence>
        {isResultsExpanded && hasResults && sprout.synthesis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[var(--glass-border)]">
              {/* Confidence Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--glass-text-muted)]">Confidence:</span>
                <ConfidenceBadge confidence={sprout.synthesis.confidence} />
              </div>

              {/* Summary */}
              <div className="text-xs text-[var(--glass-text-secondary)] leading-relaxed">
                {sprout.synthesis.summary}
              </div>

              {/* Insights Preview */}
              {sprout.synthesis.insights.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-[var(--glass-text-muted)]">Key Insights:</span>
                  <ul className="text-xs text-[var(--glass-text-secondary)] space-y-0.5 pl-3">
                    {sprout.synthesis.insights.slice(0, 3).map((insight, i) => (
                      <li key={i} className="list-disc">{insight}</li>
                    ))}
                    {sprout.synthesis.insights.length > 3 && (
                      <li className="text-[var(--glass-text-muted)]">
                        +{sprout.synthesis.insights.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Evidence Count */}
              {sprout.evidence.length > 0 && (
                <div className="text-xs text-[var(--glass-text-muted)]">
                  {sprout.evidence.length} evidence source{sprout.evidence.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 80
    ? 'text-emerald-400 bg-emerald-500/20'
    : percentage >= 60
      ? 'text-amber-400 bg-amber-500/20'
      : 'text-red-400 bg-red-500/20';

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>
      {percentage}%
    </span>
  );
}

export default SproutRow;
