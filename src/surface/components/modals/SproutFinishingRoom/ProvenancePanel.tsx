// src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx
// Sprint: S2-SFR-Display - US-B001, US-B002

import React from 'react';
import type { Sprout } from '@core/schema/sprout';
import { buildCognitiveRouting } from '@core/schema/cognitive-routing';
import { CognitiveRoutingSection } from './components/CognitiveRoutingSection';

export interface ProvenancePanelProps {
  sprout: Sprout;
}

/**
 * ProvenancePanel - Left column (280px fixed)
 *
 * US-B001: Display lens origin
 * US-B002: Cognitive routing with expandable details
 * US-B003: Knowledge sources (TBD)
 * US-B004: Collapsible sections (TBD)
 */
export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({ sprout }) => {
  // US-B001: Extract lens name with fallback
  const lensName = sprout.provenance?.lens?.name || 'Default Lens';

  // US-B002: Build cognitive routing from provenance
  const cognitiveRouting = buildCognitiveRouting(sprout.provenance);

  // US-B003: Extract knowledge files
  const knowledgeFiles = sprout.provenance?.knowledgeFiles || [];

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

      {/* US-B002: Cognitive Routing Section */}
      <CognitiveRoutingSection routing={cognitiveRouting} />

      {/* US-B003: Knowledge Sources Section */}
      <section className="p-4">
        <h3 className="text-xs font-mono text-ink-muted dark:text-paper/50 uppercase mb-3 flex items-center gap-2">
          <span role="img" aria-label="Knowledge sources">📚</span>
          Knowledge Sources
        </h3>
        {knowledgeFiles.length > 0 ? (
          <ul className="space-y-1">
            {knowledgeFiles.map((file, idx) => (
              <li
                key={idx}
                className="text-sm text-ink-muted dark:text-paper/70 flex items-center gap-2"
              >
                <span className="text-ink/30 dark:text-paper/30">•</span>
                <span className="font-mono text-xs truncate">{file}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted dark:text-paper/50 italic">
            No sources referenced
          </p>
        )}
      </section>
    </aside>
  );
};

export default ProvenancePanel;
