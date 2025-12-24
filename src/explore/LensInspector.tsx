// src/explore/LensInspector.tsx
// Lens configuration inspector panel

import { useState } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { Persona } from '../../data/narratives-schema';
import { useEngagement, useLensState } from '@core/engagement';
import { Toggle, Slider, Select, Checkbox } from '../shared/forms';
import { InfoCallout } from '../shared/feedback';

// Accent colors for lens icons
const lensIcons: Record<string, { icon: string; color: string; bg: string }> = {
  'freestyle-explorer': { icon: 'explore', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  'concerned-citizen': { icon: 'home', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-[#3f1919]' },
  'academic-researcher': { icon: 'school', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  'infrastructure-engineer': { icon: 'settings', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-stone-100 dark:bg-slate-700/50' },
  'ai-investor': { icon: 'trending_up', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  'ai-builder': { icon: 'construction', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
  'ai-skeptic': { icon: 'sentiment_dissatisfied', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/50' },
  'tech-visionary': { icon: 'lightbulb', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/30' },
};

interface LensInspectorProps {
  personaId: string;
}

export function LensInspector({ personaId }: LensInspectorProps) {
  const { getEnabledPersonas, session } = useNarrativeEngine();
  const { closeInspector, navigateTo } = useWorkspaceUI();

  // Engagement state machine for lens selection
  const { actor } = useEngagement();
  const { selectLens: engSelectLens } = useLensState({ actor });
  const personas = getEnabledPersonas();
  const persona = personas.find(p => p.id === personaId);

  // Local configuration state (would persist to preferences in real implementation)
  const [toneIntensity, setToneIntensity] = useState(75);
  const [primarySource, setPrimarySource] = useState('default');
  const [includeOpinions, setIncludeOpinions] = useState(true);

  const isActive = session.activeLens === personaId;
  const iconInfo = lensIcons[personaId] || { icon: 'psychology', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700/50' };

  if (!persona) {
    return (
      <div className="p-5 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <p>Lens not found</p>
      </div>
    );
  }

  const handleActivate = () => {
    engSelectLens(personaId);
    navigateTo(['explore']);
  };

  const getToneLabel = (value: number) => {
    if (value < 25) return 'Minimal';
    if (value < 50) return 'Low';
    if (value < 75) return 'Medium';
    return 'High';
  };

  // Source options based on persona type
  const sourceOptions = [
    { value: 'default', label: 'Default for this lens' },
    { value: 'academic', label: 'Academic Sources' },
    { value: 'industry', label: 'Industry Reports' },
    { value: 'news', label: 'News & Commentary' },
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Lens Header */}
      <div className="flex items-start gap-3 p-1">
        <div className={`w-10 h-10 rounded-lg ${iconInfo.bg} border border-border-light dark:border-slate-700 flex items-center justify-center shrink-0`}>
          <span className={`material-symbols-outlined ${iconInfo.color}`}>{iconInfo.icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{persona.publicLabel}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{persona.description?.substring(0, 50) || 'Perspective'}</p>
        </div>
      </div>

      {/* Active Toggle */}
      <Toggle
        checked={isActive}
        onChange={() => {
          if (!isActive) handleActivate();
        }}
        label="Lens Active"
        description={isActive ? 'Currently in use' : 'Click to activate'}
      />

      {/* Primary Action Button */}
      <button
        onClick={() => {
          if (!isActive) {
            engSelectLens(personaId);
          }
          navigateTo(['explore']);
        }}
        className={`
          w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all
          ${isActive
            ? 'bg-primary text-white hover:bg-primary/90 shadow-md'
            : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
          }
        `}
      >
        <span className="material-symbols-outlined text-lg">chat</span>
        {isActive ? 'Continue Exploring' : 'Start Exploring'}
      </button>

      {/* Configuration Section */}
      <div className="border-t border-border-light dark:border-border-dark pt-5 space-y-5">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
          Configuration
        </h4>

        <Slider
          value={toneIntensity}
          onChange={setToneIntensity}
          label="Tone Intensity"
          valueLabel={getToneLabel(toneIntensity)}
        />

        <Select
          value={primarySource}
          onChange={setPrimarySource}
          label="Primary Source"
          options={sourceOptions}
        />

        <Checkbox
          checked={includeOpinions}
          onChange={setIncludeOpinions}
          label="Include Opinion Pieces"
        />
      </div>

      {/* Info Callout */}
      <div className="border-t border-border-light dark:border-border-dark pt-4">
        <InfoCallout
          variant="warning"
          message={`This lens emphasizes ${persona.publicLabel.toLowerCase()} perspectives. Some technical details may be simplified or omitted.`}
        />
      </div>
    </div>
  );
}
