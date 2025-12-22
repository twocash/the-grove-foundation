// src/foundation/inspectors/NodeInspector.tsx
// Inspector panel for viewing and editing node details

import { InspectorPanel, InspectorSection, InspectorDivider } from '../../shared/layout';
import { EmptyState, StatusBadge } from '../../shared/feedback';
import { useFoundationUI } from '../FoundationUIContext';
import { useNarrativeSchema } from '../hooks/useNarrativeSchema';

interface NodeInspectorProps {
  nodeId: string;
}

export function NodeInspector({ nodeId }: NodeInspectorProps) {
  const { closeInspector, openInspector } = useFoundationUI();
  const { getNode, getJourney } = useNarrativeSchema();

  const node = getNode(nodeId);

  if (!node) {
    return (
      <EmptyState
        icon="error"
        title="Node not found"
        description="This node may have been deleted or doesn't exist."
      />
    );
  }

  const journey = node.journeyId ? getJourney(node.journeyId) : null;

  const handleJourneyClick = () => {
    if (node.journeyId) {
      openInspector({ type: 'journey', journeyId: node.journeyId });
    }
  };

  const handleNodeClick = (targetNodeId: string) => {
    openInspector({ type: 'node', nodeId: targetNodeId });
  };

  return (
    <InspectorPanel
      title={node.label}
      subtitle={node.id}
      icon="hub"
      iconColor="text-blue-600"
      iconBg="bg-blue-100 dark:bg-blue-900/30"
      onClose={closeInspector}
    >
      {/* Sequence Badge */}
      <InspectorSection>
        <div className="flex items-center gap-3 flex-wrap">
          {node.sequenceOrder !== undefined && (
            <StatusBadge status="info" label={`#${node.sequenceOrder}`} />
          )}
          {journey && (
            <button
              onClick={handleJourneyClick}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">map</span>
              {journey.title}
            </button>
          )}
        </div>
      </InspectorSection>

      <InspectorDivider />

      {/* Query */}
      <InspectorSection title="Query (LLM Instruction)">
        {node.query ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
              {node.query}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">No query defined</p>
        )}
      </InspectorSection>

      {/* Context Snippet */}
      {node.contextSnippet && (
        <>
          <InspectorDivider />
          <InspectorSection title="Context Snippet">
            <div className="p-3 bg-stone-50 dark:bg-stone-900/30 rounded-lg border-l-2 border-primary">
              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono">
                {node.contextSnippet}
              </p>
            </div>
          </InspectorSection>
        </>
      )}

      <InspectorDivider />

      {/* Navigation */}
      <InspectorSection title="Navigation">
        <div className="space-y-3">
          {/* Primary Next */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Primary Next
            </div>
            {node.primaryNext ? (
              <button
                onClick={() => handleNodeClick(node.primaryNext!)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors w-full text-left"
              >
                <span className="material-symbols-outlined text-base">arrow_forward</span>
                <span className="font-mono truncate">{node.primaryNext}</span>
              </button>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic px-3 py-2">
                End node (no continuation)
              </p>
            )}
          </div>

          {/* Alternate Next */}
          {node.alternateNext && node.alternateNext.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Alternate Paths ({node.alternateNext.length})
              </div>
              <div className="space-y-1.5">
                {node.alternateNext.map((nextId) => (
                  <button
                    key={nextId}
                    onClick={() => handleNodeClick(nextId)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors w-full text-left"
                  >
                    <span className="material-symbols-outlined text-base">fork_right</span>
                    <span className="font-mono truncate">{nextId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </InspectorSection>

      {/* Hub ID */}
      {node.hubId && (
        <>
          <InspectorDivider />
          <InspectorSection title="Topic Hub">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-primary">topic</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{node.hubId}</span>
            </div>
          </InspectorSection>
        </>
      )}

      {/* Section ID */}
      {node.sectionId && (
        <>
          <InspectorDivider />
          <InspectorSection title="Section">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-slate-500">bookmark</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{node.sectionId}</span>
            </div>
          </InspectorSection>
        </>
      )}

      {/* Metadata */}
      <InspectorDivider />
      <InspectorSection title="Metadata">
        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">fingerprint</span>
            <span className="font-mono">{node.id}</span>
          </div>
          {node.journeyId && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">link</span>
              Journey: <span className="font-mono">{node.journeyId}</span>
            </div>
          )}
        </div>
      </InspectorSection>
    </InspectorPanel>
  );
}

export default NodeInspector;
