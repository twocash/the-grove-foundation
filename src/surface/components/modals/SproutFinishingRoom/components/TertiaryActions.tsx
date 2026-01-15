// src/surface/components/modals/SproutFinishingRoom/components/TertiaryActions.tsx
// Sprint: S3||SFR-Actions - US-D002 Archive sprout to garden
// (US-D003 Note and US-D004 Export to be added in subsequent commits)

import React from 'react';
import type { Sprout } from '@core/schema/sprout';

export type TertiaryAction = 'archive' | 'annotate' | 'export';

export interface TertiaryActionsProps {
  sprout: Sprout;
  onAction: (action: TertiaryAction, payload?: unknown) => void;
}

/**
 * TertiaryActions - Bottom section with utility actions
 *
 * US-D002: Archive sprout to garden
 * US-D003: Add private note (to be added)
 * US-D004: Export document (to be added)
 */
export const TertiaryActions: React.FC<TertiaryActionsProps> = ({
  sprout,
  onAction,
}) => {
  return (
    <div className="p-4 mt-auto">
      {/* Section header */}
      <h3 className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase mb-3">
        More Actions
      </h3>

      <div className="space-y-2">
        {/* US-D002: Archive to Garden */}
        <button
          onClick={() => onAction('archive')}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-ink/5 dark:hover:bg-white/5 transition-colors text-left"
        >
          <span className="text-lg" role="img" aria-label="Archive">
            📁
          </span>
          <div>
            <span className="text-sm font-medium text-ink dark:text-paper">
              Archive to Garden
            </span>
            <p className="text-xs text-ink-muted dark:text-paper/50">
              Save for later reference
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default TertiaryActions;
