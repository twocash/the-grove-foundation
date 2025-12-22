// src/explore/LensPicker.tsx
// Lens selection view for the workspace

import { useState, useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { Persona } from '../../data/narratives-schema';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { CollectionHeader } from '../shared';

// Map persona IDs to accent colors and Material Symbols icons
interface LensAccent {
  icon: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderHover: string;
  selectedBg: string;
  selectedBgDark: string;
}

const lensAccents: Record<string, LensAccent> = {
  'freestyle-explorer': {
    icon: 'explore',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/30',
    textLight: 'text-blue-600',
    textDark: 'dark:text-blue-400',
    borderHover: 'hover:border-blue-300',
    selectedBg: 'bg-blue-50',
    selectedBgDark: 'dark:bg-blue-900/40',
  },
  'concerned-citizen': {
    icon: 'home',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-900/30',
    textLight: 'text-red-600',
    textDark: 'dark:text-red-400',
    borderHover: 'hover:border-red-300',
    selectedBg: 'bg-red-50',
    selectedBgDark: 'dark:bg-[#3f1919]',
  },
  'academic-researcher': {
    icon: 'school',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-900/30',
    textLight: 'text-emerald-600',
    textDark: 'dark:text-emerald-400',
    borderHover: 'hover:border-emerald-300',
    selectedBg: 'bg-emerald-50',
    selectedBgDark: 'dark:bg-emerald-900/40',
  },
  'infrastructure-engineer': {
    icon: 'settings',
    bgLight: 'bg-stone-100',
    bgDark: 'dark:bg-slate-700/50',
    textLight: 'text-slate-600',
    textDark: 'dark:text-slate-300',
    borderHover: 'hover:border-indigo-300',
    selectedBg: 'bg-indigo-50',
    selectedBgDark: 'dark:bg-indigo-900/40',
  },
  'ai-investor': {
    icon: 'trending_up',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-900/30',
    textLight: 'text-amber-600',
    textDark: 'dark:text-amber-400',
    borderHover: 'hover:border-amber-300',
    selectedBg: 'bg-amber-50',
    selectedBgDark: 'dark:bg-amber-900/40',
  },
  'ai-builder': {
    icon: 'construction',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-900/30',
    textLight: 'text-violet-600',
    textDark: 'dark:text-violet-400',
    borderHover: 'hover:border-violet-300',
    selectedBg: 'bg-violet-50',
    selectedBgDark: 'dark:bg-violet-900/40',
  },
  'ai-skeptic': {
    icon: 'sentiment_dissatisfied',
    bgLight: 'bg-slate-100',
    bgDark: 'dark:bg-slate-700/50',
    textLight: 'text-slate-600',
    textDark: 'dark:text-slate-400',
    borderHover: 'hover:border-slate-400',
    selectedBg: 'bg-slate-100',
    selectedBgDark: 'dark:bg-slate-700/40',
  },
  'tech-visionary': {
    icon: 'lightbulb',
    bgLight: 'bg-pink-50',
    bgDark: 'dark:bg-pink-900/30',
    textLight: 'text-pink-600',
    textDark: 'dark:text-pink-400',
    borderHover: 'hover:border-pink-300',
    selectedBg: 'bg-pink-50',
    selectedBgDark: 'dark:bg-pink-900/40',
  },
};

// Default accent for unknown personas
const defaultAccent: LensAccent = {
  icon: 'psychology',
  bgLight: 'bg-slate-100',
  bgDark: 'dark:bg-slate-700/50',
  textLight: 'text-slate-600',
  textDark: 'dark:text-slate-400',
  borderHover: 'hover:border-slate-400',
  selectedBg: 'bg-slate-100',
  selectedBgDark: 'dark:bg-slate-700/40',
};

interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
}

function LensCard({ persona, isActive, onSelect }: LensCardProps) {
  const accent = lensAccents[persona.id] || defaultAccent;

  return (
    <button
      onClick={onSelect}
      className={`
        group flex flex-col items-start p-6 rounded-xl border transition-all text-left relative overflow-hidden
        ${isActive
          ? `border-red-200 dark:border-red-900/50 ${accent.selectedBg} ${accent.selectedBgDark} ring-1 ring-red-100 dark:ring-red-500/20`
          : `border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg dark:hover:border-slate-600 ${accent.borderHover} dark:hover:bg-slate-800`
        }
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-4 right-4 bg-red-200 dark:bg-red-500 text-red-700 dark:text-white rounded-full p-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-sm font-bold">check</span>
        </div>
      )}

      {/* Icon */}
      <div className={`${accent.bgLight} ${accent.bgDark} p-3 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <span className={`material-symbols-outlined ${accent.textLight} ${accent.textDark}`}>
          {accent.icon}
        </span>
      </div>

      {/* Label */}
      <h3 className={`text-lg font-semibold mb-2 ${isActive ? 'text-slate-900 dark:text-red-100' : 'text-slate-900 dark:text-slate-100'}`}>
        {persona.publicLabel}
      </h3>

      {/* Description */}
      <p className={`text-sm leading-relaxed ${isActive ? 'text-slate-500 dark:text-red-300/70' : 'text-slate-500 dark:text-slate-400'}`}>
        {persona.description}
      </p>
    </button>
  );
}

export function LensPicker() {
  const { getEnabledPersonas, selectLens, session } = useNarrativeEngine();
  const { navigateTo, openInspector } = useWorkspaceUI();
  const personas = getEnabledPersonas();
  const activeLensId = session.activeLens;
  const activePersona = personas.find(p => p.id === activeLensId);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter personas based on search
  const filteredPersonas = useMemo(() => {
    if (!searchQuery.trim()) return personas;
    const query = searchQuery.toLowerCase();
    return personas.filter(p =>
      p.publicLabel.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }, [personas, searchQuery]);

  const handleSelect = (personaId: string) => {
    selectLens(personaId);
    // Open inspector to show lens details
    openInspector({ type: 'lens', lensId: personaId });
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl">
        <CollectionHeader
          title="Choose Your Lens"
          description="Select a perspective to explore The Grove. Each lens shapes how ideas are presented to you, filtering the noise to match your intent."
          searchPlaceholder="Search perspectives..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          activeIndicator={activePersona ? {
            label: 'Active Lens',
            value: activePersona.publicLabel,
          } : undefined}
        />

        {/* Lens grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPersonas.map((persona) => (
            <LensCard
              key={persona.id}
              persona={persona}
              isActive={activeLensId === persona.id}
              onSelect={() => handleSelect(persona.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {filteredPersonas.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">search_off</span>
            <p className="text-slate-500 dark:text-slate-400">
              No perspectives match "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
