// src/explore/LensPicker.tsx
// Lens selection view for the workspace

import { useNarrativeEngine } from '../../hooks/useNarrativeEngine';
import { Persona } from '../../data/narratives-schema';
import { useWorkspaceUI } from '../workspace/WorkspaceUIContext';
import {
  Compass,
  Home,
  GraduationCap,
  Settings,
  Globe,
  Building2,
  Briefcase,
  Boxes,
  Check,
} from 'lucide-react';

// Map icon names to components
const iconMap: Record<string, React.FC<{ className?: string; size?: number }>> = {
  Compass,
  Home,
  GraduationCap,
  Settings,
  Globe,
  Building2,
  Briefcase,
  Boxes,
};

// Map persona colors to dark theme CSS variables
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  forest: { bg: '#1a3c26', text: '#4ade80', border: '#2F5C3B' },
  moss: { bg: '#283d28', text: '#7EA16B', border: '#4a6b4a' },
  amber: { bg: '#3d3420', text: '#E0A83B', border: '#5a4a20' },
  clay: { bg: '#3d2420', text: '#D95D39', border: '#5a3a2a' },
  slate: { bg: '#1a2832', text: '#526F8A', border: '#3a4852' },
  fig: { bg: '#2d2428', text: '#6B4B56', border: '#4a3a42' },
  stone: { bg: '#2a2824', text: '#9C9285', border: '#4a4844' },
  violet: { bg: '#2a2438', text: '#8b5cf6', border: '#4a3a58' },
};

interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
}

function LensCard({ persona, isActive, onSelect }: LensCardProps) {
  const Icon = iconMap[persona.icon] || Compass;
  const colors = colorMap[persona.color] || colorMap.slate;

  return (
    <button
      onClick={onSelect}
      className={`
        relative flex flex-col items-start p-4 rounded-lg border transition-all text-left
        ${isActive
          ? 'ring-2 ring-[var(--grove-accent)] border-[var(--grove-accent)]'
          : 'border-[var(--grove-border)] hover:border-[var(--grove-accent)]/50'
        }
      `}
      style={{
        backgroundColor: isActive ? colors.bg : 'var(--grove-surface)',
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.text }}
          >
            <Check size={12} className="text-[var(--grove-bg)]" />
          </div>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon size={20} style={{ color: colors.text }} />
      </div>

      {/* Label */}
      <h3 className="font-medium text-[var(--grove-text)] mb-1">
        {persona.publicLabel}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--grove-text-muted)] line-clamp-2">
        {persona.description}
      </p>
    </button>
  );
}

export function LensPicker() {
  const { getEnabledPersonas, selectLens, session } = useNarrativeEngine();
  const { navigateTo } = useWorkspaceUI();
  const personas = getEnabledPersonas();
  const activeLensId = session.activeLens;

  const handleSelect = (personaId: string) => {
    selectLens(personaId);
    // Navigate back to Explore/Terminal after selection
    navigateTo(['explore']);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--grove-text)] mb-2">
            Choose Your Lens
          </h1>
          <p className="text-[var(--grove-text-muted)]">
            Select a perspective to explore The Grove. Each lens shapes how ideas are presented to you.
          </p>
        </div>

        {/* Active lens indicator */}
        {activeLensId && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--grove-accent-muted)] border border-[var(--grove-accent)]/30">
            <p className="text-sm text-[var(--grove-text)]">
              <span className="text-[var(--grove-accent)]">Active:</span>{' '}
              {personas.find(p => p.id === activeLensId)?.publicLabel || 'Unknown'}
            </p>
          </div>
        )}

        {/* Lens grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <LensCard
              key={persona.id}
              persona={persona}
              isActive={activeLensId === persona.id}
              onSelect={() => handleSelect(persona.id)}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-8 text-center text-sm text-[var(--grove-text-dim)]">
          <p>You can change your lens anytime from this view.</p>
        </div>
      </div>
    </div>
  );
}
