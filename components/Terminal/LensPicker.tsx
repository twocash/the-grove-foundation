// LensPicker - Welcome screen for selecting a persona/lens
// Shows on first Terminal open or when user clicks "Switch" button

import React from 'react';
import { Persona, PERSONA_COLORS } from '../../data/narratives-schema';

// Lucide icon components (inline SVG for simplicity)
const ICONS: Record<string, React.FC<{ className?: string }>> = {
  Home: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  GraduationCap: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/>
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  ),
  Settings: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Globe: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  ),
  Building2: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  ),
  Briefcase: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      <rect width="20" height="14" x="2" y="6" rx="2"/>
    </svg>
  ),
  Eye: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
};

interface LensPickerProps {
  personas: Persona[];
  onSelect: (personaId: string | null) => void;
  currentLens?: string | null;
}

const LensPicker: React.FC<LensPickerProps> = ({ personas, onSelect, currentLens }) => {
  const IconComponent = (iconName: string) => {
    const Icon = ICONS[iconName] || ICONS.Eye;
    return Icon;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          THE GROVE TERMINAL [v2.5.0]
        </div>
        <div className="font-mono text-xs text-grove-forest mb-4">
          Connection established.
        </div>
        <h2 className="font-display text-xl text-ink mb-2">
          Welcome to The Grove
        </h2>
        <p className="font-serif text-sm text-ink-muted italic">
          Which lens fits you best?
        </p>
      </div>

      {/* Persona Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {personas.map(persona => {
          const Icon = IconComponent(persona.icon);
          const colors = PERSONA_COLORS[persona.color];
          const isSelected = currentLens === persona.id;

          return (
            <button
              key={persona.id}
              onClick={() => onSelect(persona.id)}
              className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group
                ${isSelected
                  ? `${colors.bgLight} ${colors.border} border-2`
                  : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'
                }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-ink/5 group-hover:bg-ink/10'} transition-colors`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-ink/60'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-sans font-semibold text-sm ${isSelected ? colors.text : 'text-ink'}`}>
                    {persona.publicLabel}
                  </div>
                  <div className="font-serif text-xs text-ink-muted italic mt-0.5 line-clamp-2">
                    "{persona.description}"
                  </div>
                </div>
                {isSelected && (
                  <div className={`${colors.bg} text-white text-[9px] font-bold uppercase px-2 py-1 rounded`}>
                    Active
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {/* "Just Exploring" Option */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group
            ${currentLens === null
              ? 'bg-ink/5 border-ink/20 border-2'
              : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'
            }`}
        >
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${currentLens === null ? 'bg-ink' : 'bg-ink/5 group-hover:bg-ink/10'} transition-colors`}>
              <ICONS.Eye className={`w-5 h-5 ${currentLens === null ? 'text-white' : 'text-ink/60'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-sans font-semibold text-sm ${currentLens === null ? 'text-ink' : 'text-ink'}`}>
                Just exploring
              </div>
              <div className="font-serif text-xs text-ink-muted italic mt-0.5">
                "I'll browse without a specific lens"
              </div>
            </div>
            {currentLens === null && (
              <div className="bg-ink text-white text-[9px] font-bold uppercase px-2 py-1 rounded">
                Active
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          You can switch your lens anytime from the Terminal header
        </p>
      </div>
    </div>
  );
};

export default LensPicker;
