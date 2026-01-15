// src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx
// Sprint: S1-SFR-Shell - US-A002 Three-column layout (left placeholder)

import React from 'react';
import type { Sprout } from '@core/schema/sprout';

export interface ProvenancePanelProps {
  sprout: Sprout;
}

/**
 * ProvenancePanel - Left column placeholder (280px fixed)
 *
 * Will be implemented in S2||SFR-Display to show:
 * - Lens/persona context
 * - Topic hub info
 * - Journey context
 * - Knowledge files used
 */
export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({ sprout }) => {
  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-ink/10 dark:border-white/10 bg-paper/20 dark:bg-ink/20 overflow-y-auto">
      {/* US-A002: Placeholder content */}
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="text-4xl mb-4 opacity-30">📋</div>
        <p className="text-sm text-ink-muted dark:text-paper/50 font-mono">
          Provenance Panel (S2)
        </p>
        <p className="text-xs text-ink-muted/70 dark:text-paper/40 mt-2">
          Lens, hub, journey context
        </p>
      </div>
    </aside>
  );
};

export default ProvenancePanel;
