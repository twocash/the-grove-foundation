// src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx
// Sprint: S2-SFR-Display - US-B001 Display lens origin

import React from 'react';
import type { Sprout } from '@core/schema/sprout';

export interface ProvenancePanelProps {
  sprout: Sprout;
}

/**
 * ProvenancePanel - Left column (280px fixed)
 *
 * US-B001: Display lens origin
 * US-B002: Cognitive routing (TBD)
 * US-B003: Knowledge sources (TBD)
 * US-B004: Collapsible sections (TBD)
 */
export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({ sprout }) => {
  // US-B001: Extract lens name with fallback
  const lensName = sprout.provenance?.lens?.name || 'Default Lens';

  return (
    <aside className="w-[280px] flex-shrink-0 border-r border-ink/10 dark:border-white/10 bg-paper/20 dark:bg-ink/20 overflow-y-auto">
      {/* US-B001: Origin Section */}
      <section className="p-4 border-b border-ink/10 dark:border-white/10">
        <h3 className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase mb-3">
          Origin
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="Lens">
            🔮
          </span>
          <span className="text-sm font-medium text-ink dark:text-paper">
            {lensName}
          </span>
        </div>
      </section>

      {/* Placeholder for US-B002: Cognitive Routing */}
      <section className="p-4 border-b border-ink/10 dark:border-white/10">
        <p className="text-xs text-ink-muted dark:text-paper/50 font-mono">
          Cognitive Routing (US-B002)
        </p>
      </section>

      {/* Placeholder for US-B003: Knowledge Sources */}
      <section className="p-4">
        <p className="text-xs text-ink-muted dark:text-paper/50 font-mono">
          Knowledge Sources (US-B003)
        </p>
      </section>
    </aside>
  );
};

export default ProvenancePanel;
