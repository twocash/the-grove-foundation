// src/explore/LensInspector.tsx
// Lens configuration inspector panel

import { useState } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { Persona } from '../../data/narratives-schema';

// Reusable toggle switch
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="p-4 bg-stone-50 dark:bg-slate-900/50 border border-border-light dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {description && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{description}</span>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900
          ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

// Reusable slider
interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  valueLabel?: string;
}

function Slider({ value, onChange, label, min = 0, max = 100, valueLabel }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
        <span className="text-xs text-slate-900 dark:text-slate-300 font-mono bg-stone-200 dark:bg-slate-800 px-1.5 rounded">
          {valueLabel || value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

// Reusable select
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: { value: string; label: string }[];
}

function Select({ value, onChange, label, options }: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-stone-50 dark:bg-slate-900 border border-border-light dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary appearance-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
          arrow_drop_down
        </span>
      </div>
    </div>
  );
}

// Reusable checkbox
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border-light dark:border-slate-600 text-primary focus:ring-primary bg-stone-50 dark:bg-slate-800"
      />
    </div>
  );
}

// Info callout
interface InfoCalloutProps {
  message: string;
  variant?: 'info' | 'warning';
}

function InfoCallout({ message, variant = 'info' }: InfoCalloutProps) {
  const colors = variant === 'warning'
    ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
    : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30';

  return (
    <div className={`flex items-start gap-2 text-xs p-3 rounded-lg border ${colors}`}>
      <span className="material-symbols-outlined text-sm mt-0.5">info</span>
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}

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
  const { getEnabledPersonas, selectLens, session } = useNarrativeEngine();
  const { closeInspector, navigateTo } = useWorkspaceUI();
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
    selectLens(personaId);
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
            selectLens(personaId);
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
