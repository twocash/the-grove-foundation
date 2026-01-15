// src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx
// Sprint: S1-SFR-Shell - US-A002 Three-column layout (right placeholder)

import React from 'react';
import type { Sprout } from '@core/schema/sprout';

export interface ActionPanelProps {
  sprout: Sprout;
}

/**
 * ActionPanel - Right column placeholder (320px fixed)
 *
 * Will be implemented in S3||SFR-Actions to provide:
 * - Refine/edit actions
 * - Export options
 * - Stage transitions
 * - Tags management
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({ sprout }) => {
  return (
    <aside className="w-[320px] flex-shrink-0 border-l border-ink/10 dark:border-white/10 bg-paper/20 dark:bg-ink/20 overflow-y-auto">
      {/* US-A002: Placeholder content */}
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="text-4xl mb-4 opacity-30">⚡</div>
        <p className="text-sm text-ink-muted dark:text-paper/50 font-mono">
          Action Panel (S3)
        </p>
        <p className="text-xs text-ink-muted/70 dark:text-paper/40 mt-2">
          Refine, export, promote
        </p>
      </div>
    </aside>
  );
};

export default ActionPanel;
