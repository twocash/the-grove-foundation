// src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx
// Sprint: S2-SFR-Display - US-B001, US-B002, US-B003, US-B004

import React from 'react';
import type { Sprout } from '@core/schema/sprout';
import { buildCognitiveRouting } from '@core/schema/cognitive-routing';
import { CognitiveRoutingSection } from './components/CognitiveRoutingSection';
import { CollapsibleSection } from './components/CollapsibleSection';

export interface ProvenancePanelProps {
  sprout: Sprout;
}

/**
 * ProvenancePanel - Left column (280px fixed)
 *
 * US-B001: Display lens origin
 * US-B002: Cognitive routing with expandable details
 * US-B003: Knowledge sources list
 * US-B004: Collapsible panel sections
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
      {/* US-B001 + US-B004: Origin Section (collapsible) */}
      <CollapsibleSection
        title="Origin"
        icon="🔮"
        iconLabel="Lens"
        storageKey="origin"
        defaultExpanded={true}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink dark:text-paper">
            {lensName}
          </span>
        </div>
      </CollapsibleSection>

      {/* US-B002: Cognitive Routing Section (has own expand/collapse) */}
      <CognitiveRoutingSection routing={cognitiveRouting} />

      {/* US-B003 + US-B004: Knowledge Sources Section (collapsible) */}
      <CollapsibleSection
        title="Knowledge Sources"
        icon="📚"
        iconLabel="Knowledge sources"
        storageKey="knowledge-sources"
        defaultExpanded={true}
      >
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
      </CollapsibleSection>
    </aside>
  );
};

export default ProvenancePanel;
