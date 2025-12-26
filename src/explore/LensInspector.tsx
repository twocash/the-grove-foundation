// src/explore/LensInspector.tsx
// Lens object inspector — displays Persona as GroveObject JSON

import { useMemo, useCallback } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector } from '../shared/inspector';
import { useVersionedObject } from '../shared/inspector/hooks/useVersionedObject';
import type { GroveObject } from '@core/schema/grove-object';
import type { Persona } from '../../data/narratives-schema';
import type { JsonPatch } from '@core/copilot';
import { getSessionId } from '../../utils/abTesting';

interface LensInspectorProps {
  personaId: string;
}

// Convert Persona to GroveObject format for display
function personaToGroveObject(persona: Persona, isActive: boolean): GroveObject {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      icon: persona.icon,
      status: isActive ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { type: 'system' },
    },
    payload: {
      color: persona.color,
      enabled: persona.enabled,
      toneGuidance: persona.toneGuidance,
      narrativeStyle: persona.narrativeStyle,
      arcEmphasis: persona.arcEmphasis,
      openingPhase: persona.openingPhase,
      defaultThreadLength: persona.defaultThreadLength,
      systemPrompt: persona.systemPrompt,
      vocabularyLevel: persona.vocabularyLevel,
      emotionalRegister: persona.emotionalRegister,
      entryPoints: persona.entryPoints,
      suggestedThread: persona.suggestedThread,
    },
  };
}

export function LensInspector({ personaId }: LensInspectorProps) {
  const { getEnabledPersonas, session } = useNarrativeEngine();
  const { closeInspector } = useWorkspaceUI();

  const personas = getEnabledPersonas();
  const persona = personas.find(p => p.id === personaId);
  const isActive = session.activeLens === personaId;

  // Memoize the initial object to prevent useVersionedObject from re-importing
  const initialObject = useMemo(
    () => (persona ? personaToGroveObject(persona, isActive) : null),
    [persona, isActive]
  );

  // Use versioned object storage
  const {
    object: versionedObject,
    version,
    loading,
    applyPatch,
  } = useVersionedObject(
    personaId,
    initialObject ?? {
      meta: { id: personaId, type: 'lens', title: '', createdAt: '', updatedAt: '' },
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

  if (!persona) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Lens not found</p>
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
      title={persona.publicLabel}
      version={version}
      onApplyPatch={handleApplyPatch}
      onClose={closeInspector}
    />
  );
}

export default LensInspector;
