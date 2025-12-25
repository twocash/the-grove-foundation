// src/explore/LensPicker.tsx
// Lens selection view for the workspace
// Supports two modes: 'full' (workspace grid) and 'compact' (chat nav list)

import { useState, useMemo } from 'react';
import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { useCustomLens } from '../../hooks/useCustomLens';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import { useOptionalWorkspaceUI } from '../workspace/WorkspaceUIContext';
import { CollectionHeader } from '../shared';
import { useEngagement, useLensState } from '@core/engagement';

interface LensPickerProps {
  mode?: 'full' | 'compact';
  onBack?: () => void;  // For compact mode "Back to Chat"
  onAfterSelect?: (personaId: string) => void;  // Callback after lens selected (for analytics, etc.)
  onCreateCustomLens?: () => void;  // Opens custom lens wizard
}

// Union type for display
type DisplayLens = Persona | CustomLens;

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

// Compact card for chat nav picker (single column, click = inspector, button = select)
function CompactLensCard({ lens, isActive, onSelect, onView }: {
  lens: DisplayLens;
  isActive: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  const isCustom = 'isCustom' in lens && lens.isCustom;
  // Custom lenses use a special accent, personas use the accent map
  const accent = isCustom
    ? { ...defaultAccent, icon: 'auto_fix_high', bgLight: 'bg-violet-50', bgDark: 'dark:bg-violet-900/30', textLight: 'text-violet-600', textDark: 'dark:text-violet-400' }
    : lensAccents[lens.id] || defaultAccent;

  return (
    <div
      onClick={onView}
      className={`
        flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${isActive
          ? 'border-primary/50 bg-primary/10 dark:bg-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/30'
        }
      `}
    >
      <div className={`${accent.bgLight} ${accent.bgDark} p-2.5 rounded-lg shrink-0`}>
        <span className={`material-symbols-outlined ${accent.textLight} ${accent.textDark}`}>
          {accent.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${isActive ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
            {lens.publicLabel}
          </h3>
          {isCustom && (
            <span className="text-[10px] uppercase font-bold text-violet-500 dark:text-violet-400">Custom</span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 italic truncate">
          "{lens.description}"
        </p>
      </div>
      {isActive ? (
        <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary shrink-0">
          ACTIVE
        </span>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="px-3 py-1 text-xs font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
        >
          Select
        </button>
      )}
    </div>
  );
}

// Full card for workspace grid (2-column, click = inspector, button = select)
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  isInspected: boolean;
  onSelect: () => void;  // Select button click → activates lens
  onView: () => void;    // Card body click → opens inspector
}

function LensCard({ persona, isActive, isInspected, onSelect, onView }: LensCardProps) {
  const accent = lensAccents[persona.id] || defaultAccent;

  return (
    <div
      onClick={onView}
      className={`
        group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
        ${isInspected
          ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
          : isActive
            ? 'border-[var(--card-border-active)] bg-[var(--card-bg-active)] ring-1 ring-[var(--card-ring-active)]'
            : 'border-[var(--card-border-default)] dark:border-slate-700 bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
        }
      `}
    >
      {/* Header: Icon + Active Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className={`${accent.bgLight} ${accent.bgDark} p-2.5 rounded-lg`}>
          <span className={`material-symbols-outlined ${accent.textLight} ${accent.textDark} text-xl`}>
            {accent.icon}
          </span>
        </div>
        {isActive && (
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
            Active
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
        {persona.publicLabel}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">
        "{persona.description}"
      </p>

      {/* Footer: Select button (only if not active) */}
      <div className="flex items-center justify-end mt-auto">
        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}

// Custom lens card for workspace grid
interface CustomLensCardProps {
  lens: CustomLens;
  isActive: boolean;
  isInspected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete?: () => void;
}

function CustomLensCard({ lens, isActive, isInspected, onSelect, onView, onDelete }: CustomLensCardProps) {
  return (
    <div
      onClick={onView}
      className={`
        group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
        ${isInspected
          ? 'ring-2 ring-[var(--card-ring-violet)] border-[var(--card-border-violet)]'
          : isActive
            ? 'border-violet-400/50 bg-[var(--card-bg-violet-active)] ring-1 ring-violet-300/30'
            : 'border-[var(--card-border-default)] dark:border-slate-700 bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-violet-300'
        }
      `}
    >
      {/* Delete button - appears on hover */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
          title="Delete custom lens"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      )}
      
      {/* Header: Icon + Custom Badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="bg-violet-50 dark:bg-violet-900/30 p-2.5 rounded-lg">
          <span className="material-symbols-outlined text-violet-600 dark:text-violet-400 text-xl">
            auto_fix_high
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
            Custom
          </span>
          {isActive && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-violet-200 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300 font-medium">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
        {lens.publicLabel}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-4">
        "{lens.description}"
      </p>

      {/* Footer: Select button (only if not active) */}
      <div className="flex items-center justify-end mt-auto">
        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-4 py-1.5 text-xs font-medium rounded-md bg-violet-500 text-white hover:bg-violet-500/90 transition-colors shadow-sm"
          >
            Select
          </button>
        )}
      </div>
    </div>
  );
}

export function LensPicker({ mode = 'full', onBack, onAfterSelect, onCreateCustomLens }: LensPickerProps = {}) {
  // Schema helper from NarrativeEngine
  const { getEnabledPersonas } = useNarrativeEngine();
  const { customLenses, deleteCustomLens } = useCustomLens();
  const workspaceUI = useOptionalWorkspaceUI();
  const personas = getEnabledPersonas();

  // Engagement state machine for lens state and actions
  const { actor } = useEngagement();
  const { lens, selectLens: engSelectLens } = useLensState({ actor });
  const activeLensId = lens;
  // Derive inspected lens from workspace inspector state
  const inspectedLensId = (
    workspaceUI?.inspector?.isOpen &&
    workspaceUI.inspector.mode?.type === 'lens'
  ) ? workspaceUI.inspector.mode.lensId : null;
  const activePersona = personas.find(p => p.id === activeLensId);

  // Combine personas and custom lenses for display
  const allLenses: DisplayLens[] = useMemo(() => {
    return [...personas, ...customLenses];
  }, [personas, customLenses]);

  // Search state (only used in full mode)
  const [searchQuery, setSearchQuery] = useState('');

  // Filter personas based on search (full mode grid only shows personas)
  const filteredPersonas = useMemo(() => {
    if (!searchQuery.trim()) return personas;
    const query = searchQuery.toLowerCase();
    return personas.filter(p =>
      p.publicLabel.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }, [personas, searchQuery]);

  const handleSelect = (personaId: string) => {
    engSelectLens(personaId);
    // Call optional callback for analytics, engagement bus, etc.
    onAfterSelect?.(personaId);
    if (mode === 'compact' && onBack) {
      onBack();  // Return to chat after selection
    } else if (workspaceUI) {
      workspaceUI.openInspector({ type: 'lens', lensId: personaId });
    }
  };

  const handleView = (personaId: string) => {
    // Card click opens inspector in both modes
    if (workspaceUI) {
      workspaceUI.openInspector({ type: 'lens', lensId: personaId });
    }
  };

  // COMPACT MODE - Single column list for chat nav
  if (mode === 'compact') {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Back to Chat
            </button>
          )}
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Switch Lens</span>
          <div className="w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allLenses.map(lens => (
            <CompactLensCard
              key={lens.id}
              lens={lens}
              isActive={activeLensId === lens.id}
              onSelect={() => handleSelect(lens.id)}
              onView={() => handleView(lens.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // FULL MODE - Grid layout for workspace
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
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

        {/* Standard lens grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPersonas.map((persona) => (
            <LensCard
              key={persona.id}
              persona={persona}
              isActive={activeLensId === persona.id}
              isInspected={inspectedLensId === persona.id}
              onSelect={() => handleSelect(persona.id)}
              onView={() => handleView(persona.id)}
            />
          ))}
        </div>

        {/* Custom lenses section */}
        {customLenses.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Your Custom Lenses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customLenses.map((lens) => (
                <CustomLensCard
                  key={lens.id}
                  lens={lens}
                  isActive={activeLensId === lens.id}
                  isInspected={inspectedLensId === lens.id}
                  onSelect={() => handleSelect(lens.id)}
                  onView={() => handleView(lens.id)}
                  onDelete={() => deleteCustomLens(lens.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create Your Own button */}
        {onCreateCustomLens && (
          <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark">
            <button
              onClick={onCreateCustomLens}
              className="w-full p-6 rounded-xl border-2 border-dashed border-amber-400/50 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                  <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">
                    auto_fix_high
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Create Your Own Lens</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Build a perspective uniquely tailored to how you see the world
                  </p>
                </div>
                <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-amber-500 ml-auto transition-colors">
                  arrow_forward
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Empty state */}
        {filteredPersonas.length === 0 && customLenses.length === 0 && (
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
