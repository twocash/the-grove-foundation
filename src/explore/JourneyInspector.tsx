// src/explore/JourneyInspector.tsx
// Journey object inspector — displays Journey as GroveObject JSON
// Uses InspectorSurface for versioning

import { useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector, InspectorSurfaceProvider } from '../shared/inspector';
import type { GroveObject } from '@core/schema/grove-object';
import type { Journey } from '@core/schema/narrative';

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

  // Memoize the initial object for the surface provider
  const initialObject = useMemo(
    () => (journey ? journeyToGroveObject(journey) : null),
    [journey]
  );

  if (!journey || !initialObject) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Journey not found</p>
      </div>
    );
  }

  return (
    <InspectorSurfaceProvider
      objectId={journeyId}
      initialObject={initialObject}
    >
      <ObjectInspector
        title={journey.title}
        onClose={closeInspector}
      />
    </InspectorSurfaceProvider>
  );
}

export default JourneyInspector;
