// src/surface/components/modals/SproutFinishingRoom/ProvenancePanel.tsx
// Sprint: S2-SFR-Display - US-B001, US-B002, US-B003, US-B004
// Enhanced: S4-SL-TierProgression - Lifecycle section with TierBadge
// Enhanced: S6-SL-ObservableSignals - Usage Signals section

import React from 'react';
import type { Sprout } from '@core/schema/sprout';
import { buildCognitiveRouting } from '@core/schema/cognitive-routing';
import { CognitiveRoutingSection } from './components/CognitiveRoutingSection';
import { CollapsibleSection } from './components/CollapsibleSection';
import { FinishingRoomSignalsSection } from './components/FinishingRoomSignalsSection';
import { TierBadge, stageToTier } from '@surface/components/TierBadge';

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
    <aside className="w-[280px] flex-shrink-0 border-r border-[var(--glass-border)] overflow-y-auto" style={{ backgroundColor: 'var(--glass-elevated, transparent)' }}>
      {/* US-B001 + US-B004: Origin Section (collapsible) */}
      <CollapsibleSection
        title="Origin"
        icon="🔮"
        iconLabel="Lens"
        storageKey="origin"
        defaultExpanded={true}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
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
                className="text-sm text-[var(--glass-text-muted)] flex items-center gap-2"
              >
                <span className="text-[var(--glass-text-muted)] opacity-30">•</span>
                <span className="font-mono text-xs truncate">{file}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--glass-text-muted)] italic">
            No sources referenced
          </p>
        )}
      </CollapsibleSection>

      {/* S4-SL-TierProgression: Lifecycle Section */}
      <CollapsibleSection
        title="Lifecycle"
        icon="🌱"
        iconLabel="Lifecycle stage"
        storageKey="lifecycle"
        defaultExpanded={true}
      >
        <div className="flex items-center gap-2">
          <TierBadge tier={stageToTier(sprout.stage)} size="md" showLabel />
        </div>
        {sprout.promotedAt && (
          <p className="text-xs text-[var(--glass-text-muted)] mt-2">
            Promoted {new Date(sprout.promotedAt).toLocaleDateString()}
          </p>
        )}
      </CollapsibleSection>

      {/* S6-SL-ObservableSignals: Usage Signals Section */}
      <FinishingRoomSignalsSection
        sproutId={sprout.id}
        sproutQuery={sprout.query}
      />
    </aside>
  );
};

export default ProvenancePanel;
