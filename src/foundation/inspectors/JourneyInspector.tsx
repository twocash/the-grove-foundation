// src/foundation/inspectors/JourneyInspector.tsx
// Inspector panel for viewing and editing journey details

import { InspectorPanel, InspectorSection, InspectorDivider } from '../../shared/layout';
import { EmptyState, StatusBadge } from '../../shared/feedback';
import { useFoundationUI } from '../FoundationUIContext';
import { useNarrativeSchema } from '../hooks/useNarrativeSchema';
import type { Journey, JourneyNode } from '../../../data/narratives-schema';

interface JourneyInspectorProps {
  journeyId: string;
}

export function JourneyInspector({ journeyId }: JourneyInspectorProps) {
  const { closeInspector, openInspector } = useFoundationUI();
  const { getJourney, allNodes } = useNarrativeSchema();

  const journey = getJourney(journeyId);

  if (!journey) {
    return (
      <EmptyState
        icon="error"
        title="Journey not found"
        description="This journey may have been deleted or doesn't exist."
      />
    );
  }

  const journeyNodes = allNodes
    .filter((n) => n.journeyId === journeyId)
    .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));

  const handleNodeClick = (nodeId: string) => {
    openInspector({ type: 'node', nodeId });
  };

  return (
    <InspectorPanel
      title={journey.title}
      subtitle={journey.id}
      icon="map"
      iconColor="text-amber-600"
      iconBg="bg-amber-100 dark:bg-amber-900/30"
      onClose={closeInspector}
    >
      {/* Status */}
      <InspectorSection>
        <div className="flex items-center gap-3">
          <StatusBadge
            status={journey.status === 'active' ? 'success' : journey.status === 'draft' ? 'warning' : 'neutral'}
            label={journey.status}
          />
          {journey.version && (
            <span className="text-xs text-slate-500 dark:text-slate-400">v{journey.version}</span>
          )}
        </div>
      </InspectorSection>

      <InspectorDivider />

      {/* Description */}
      <InspectorSection title="Description">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {journey.description || 'No description provided.'}
        </p>
      </InspectorSection>

      <InspectorDivider />

      {/* Stats */}
      <InspectorSection title="Statistics">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {journeyNodes.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Nodes</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {journey.estimatedMinutes || '—'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Est. Minutes</div>
          </div>
        </div>
      </InspectorSection>

      <InspectorDivider />

      {/* Entry Point */}
      <InspectorSection title="Entry Point">
        {journey.entryNodeId ? (
          <button
            onClick={() => handleNodeClick(journey.entryNodeId!)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-primary text-sm hover:bg-primary/10 transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined text-base">play_circle</span>
            <span className="font-mono truncate">{journey.entryNodeId}</span>
          </button>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No entry node defined</p>
        )}
      </InspectorSection>

      <InspectorDivider />

      {/* Node List */}
      <InspectorSection title="Journey Nodes">
        {journeyNodes.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No nodes in this journey</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {journeyNodes.map((node, index) => (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <span className="text-xs font-mono text-slate-400 w-6">
                  {node.sequenceOrder ?? index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {node.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {node.id}
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-base">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        )}
      </InspectorSection>

      {/* Metadata */}
      {(journey.createdAt || journey.updatedAt) && (
        <>
          <InspectorDivider />
          <InspectorSection title="Metadata">
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {journey.createdAt && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Created: {new Date(journey.createdAt).toLocaleDateString()}
                </div>
              )}
              {journey.updatedAt && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Updated: {new Date(journey.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </InspectorSection>
        </>
      )}
    </InspectorPanel>
  );
}

export default JourneyInspector;
