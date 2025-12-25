// src/explore/JourneyInspector.tsx
// Journey object inspector — displays Journey as GroveObject JSON

import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector } from '../shared/inspector';
import { GroveObject } from '@core/schema/grove-object';
import { Journey } from '@core/schema/narrative';

interface JourneyInspectorProps {
  journeyId: string;
}

// Convert Journey to GroveObject format for display
function journeyToGroveObject(journey: Journey): GroveObject {
  return {
    meta: {
      id: journey.id,
      type: 'journey',
      title: journey.title,
      description: journey.description,
      icon: journey.icon,
      color: journey.color,
      status: journey.status,
      createdAt: journey.createdAt,
      updatedAt: journey.updatedAt,
      createdBy: journey.createdBy,
      tags: journey.tags,
    },
    payload: {
      entryNode: journey.entryNode,
      targetAha: journey.targetAha,
      linkedHubId: journey.linkedHubId,
      estimatedMinutes: journey.estimatedMinutes,
    },
  };
}

export function JourneyInspector({ journeyId }: JourneyInspectorProps) {
  const { getJourney } = useNarrativeEngine();
  const { closeInspector } = useWorkspaceUI();

  const journey = getJourney(journeyId);

  if (!journey) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Journey not found</p>
      </div>
    );
  }

  const groveObject = journeyToGroveObject(journey);

  return (
    <ObjectInspector
      object={groveObject}
      title={journey.title}
      onClose={closeInspector}
    />
  );
}

export default JourneyInspector;
