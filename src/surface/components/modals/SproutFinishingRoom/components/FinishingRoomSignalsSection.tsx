// src/surface/components/modals/SproutFinishingRoom/components/FinishingRoomSignalsSection.tsx
// Sprint: S6-SL-ObservableSignals v1
// Epic 9: Signal analytics in Finishing Room provenance panel

import React from 'react';
import { useSproutAggregations } from '@bedrock/consoles/NurseryConsole/useSproutAggregations';
import { CollapsibleSection } from './CollapsibleSection';
import {
  signalAggregationToRenderTree,
  createEmptySignalsTree,
  SignalsRegistry,
  Renderer,
} from '../json-render';

export interface FinishingRoomSignalsSectionProps {
  /** Sprout ID to fetch signals for */
  sproutId: string;
  /** Optional sprout query for context */
  sproutQuery?: string;
}

/**
 * Builds a compact render tree for the signals section.
 * Uses minimal options since this appears in a sidebar.
 */
function buildCompactRenderTree(
  aggregation: ReturnType<typeof useSproutAggregations>['aggregation'],
  sproutId: string,
  period: 'all_time' | 'last_30d' | 'last_7d',
  sproutQuery?: string
) {
  if (aggregation) {
    return signalAggregationToRenderTree(aggregation, {
      title: '', // No title in collapsible section
      sproutQuery,
      showConversionRates: false, // Keep it compact
      showThresholds: false,
      columns: 2, // 2 columns for narrow 280px sidebar
      compact: true,
    });
  }
  return createEmptySignalsTree(sproutId, period, {
    sproutQuery,
    columns: 2,
    compact: true,
  });
}

/**
 * FinishingRoomSignalsSection - Collapsible signals section for ProvenancePanel
 *
 * Displays usage signal metrics for the current sprout using the json-render
 * pattern. Fetches aggregation data from Supabase and transforms to visual components.
 */
export function FinishingRoomSignalsSection({
  sproutId,
  sproutQuery,
}: FinishingRoomSignalsSectionProps): React.ReactElement {
  const { aggregation, loading, period } = useSproutAggregations(sproutId, 'all_time');

  const renderTree = buildCompactRenderTree(aggregation, sproutId, period, sproutQuery);

  return (
    <CollapsibleSection
      title="Usage Signals"
      icon="📊"
      iconLabel="Usage signals"
      storageKey="usage-signals"
      defaultExpanded={false}
    >
      {loading ? (
        <LoadingState />
      ) : (
        <div className="text-sm">
          <Renderer tree={renderTree} registry={SignalsRegistry} />
        </div>
      )}
    </CollapsibleSection>
  );
}

/**
 * Loading indicator for the signals section.
 */
function LoadingState(): React.ReactElement {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="text-ink-muted dark:text-paper/50 text-sm">
        Loading signals...
      </span>
    </div>
  );
}

export default FinishingRoomSignalsSection;
