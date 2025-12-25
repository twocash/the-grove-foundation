// src/explore/LensInspector.tsx
// Lens object inspector — displays Persona as GroveObject JSON

import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { ObjectInspector } from '../shared/inspector';
import { GroveObject } from '@core/schema/grove-object';
import { Persona } from '../../data/narratives-schema';

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

  if (!persona) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Lens not found</p>
      </div>
    );
  }

  const isActive = session.activeLens === personaId;
  const groveObject = personaToGroveObject(persona, isActive);

  return (
    <ObjectInspector
      object={groveObject}
      title={persona.publicLabel}
      onClose={closeInspector}
    />
  );
}

export default LensInspector;
