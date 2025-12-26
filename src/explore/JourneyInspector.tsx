// src/explore/JourneyInspector.tsx
// Journey object inspector — displays Journey as GroveObject JSON

import { useMemo, useCallback } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector } from '../shared/inspector';
import { useVersionedObject } from '../shared/inspector/hooks/useVersionedObject';
import type { GroveObject } from '@core/schema/grove-object';
import type { Journey } from '@core/schema/narrative';
import type { JsonPatch } from '@core/copilot';
import { getSessionId } from '../../utils/abTesting';

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

  // Memoize the initial object to prevent useVersionedObject from re-importing
  const initialObject = useMemo(
    () => (journey ? journeyToGroveObject(journey) : null),
    [journey]
  );

  // Use versioned object storage
  const {
    object: versionedObject,
    version,
    loading,
    applyPatch,
  } = useVersionedObject(
    journeyId,
    initialObject ?? {
      meta: { id: journeyId, type: 'journey', title: '', createdAt: '', updatedAt: '' },
      payload: {},
    }
  );

  // Handle patch application with versioning
  const handleApplyPatch = useCallback(
    async (patch: JsonPatch) => {
      return applyPatch(
        patch,
        { type: 'copilot', model: 'hybrid-local' },
        { type: 'copilot', sessionId: getSessionId() }
      );
    },
    [applyPatch]
  );

  if (!journey) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Journey not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2 animate-spin">progress_activity</span>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <ObjectInspector
      object={versionedObject}
      title={journey.title}
      version={version}
      onApplyPatch={handleApplyPatch}
      onClose={closeInspector}
    />
  );
}

export default JourneyInspector;
