// LensGrid - Shared lens rendering for WelcomeInterstitial and LensPicker
// v0.14.1: Dark mode support
// Extracted from LensPicker to enable DRY lens display across components

import React from 'react';
import { Persona, PERSONA_COLORS, PersonaColor, getPersonaColors } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';

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
  ),
  Compass: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  Sparkles: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  ),
  Plus: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  ),
  Trash2: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      <line x1="10" x2="10" y1="11" y2="17"/>
      <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
  )
};

// Extended color mapping for custom lenses - uses fig (earthy purple alternative)
const EXTENDED_PERSONA_COLORS: Record<PersonaColor | 'custom', {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  dot: string;
}> = {
  ...PERSONA_COLORS,
  custom: {
    bg: 'bg-[#6B4B56]',       // Fig
    bgLight: 'bg-[#6B4B56]/10',
    text: 'text-[#6B4B56]',
    border: 'border-[#6B4B56]/30',
    dot: 'bg-[#6B4B56]'
  }
};

interface LensGridProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  currentLens?: string | null;
  highlightedLens?: string | null;  // v0.12e: URL lens to highlight
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}

const LensGrid: React.FC<LensGridProps> = ({
  personas,
  customLenses = [],
  currentLens,
  highlightedLens,
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  showCreateOption = true
}) => {
  const IconComponent = (iconName: string) => {
    const Icon = ICONS[iconName] || ICONS.Eye;
    return Icon;
  };

  const getColors = (color: PersonaColor | 'custom' | 'purple') => {
    const mappedColor = color === 'purple' ? 'custom' : color;
    return EXTENDED_PERSONA_COLORS[mappedColor as keyof typeof EXTENDED_PERSONA_COLORS] || PERSONA_COLORS.fig;
  };

  return (
    <div className="space-y-3">
      {/* Custom Lenses Section */}
      {customLenses.length > 0 && (
        <>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-2 pb-1">
            Your Custom Lenses
          </div>
          {customLenses.map(lens => {
            const Icon = IconComponent(lens.icon);
            const colors = getColors(lens.color as PersonaColor | 'purple');
            const isSelected = currentLens === lens.id;

            return (
              <div key={lens.id} className="relative group">
                <button
                  onClick={() => onSelect(lens.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200
                    ${isSelected
                      ? `${colors.bgLight} ${colors.border} border-2`
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm dark:hover:shadow-none'
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'} transition-colors`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-sans font-semibold text-sm ${isSelected ? colors.text : 'text-slate-900 dark:text-slate-100'}`}>
                        {lens.publicLabel}
                      </div>
                      <div className="font-serif text-xs text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-2">
                        "{lens.description}"
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                        {lens.journeysCompleted} {lens.journeysCompleted === 1 ? 'journey' : 'journeys'} completed
                      </div>
                    </div>
                    {isSelected && (
                      <div className={`${colors.bg} text-white text-[9px] font-bold uppercase px-2 py-1 rounded`}>
                        Active
                      </div>
                    )}
                  </div>
                </button>
                {/* Delete button (appears on hover) */}
                {onDeleteCustomLens && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this custom lens? This cannot be undone.')) {
                        onDeleteCustomLens(lens.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 dark:bg-slate-800/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/30 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                    title="Delete lens"
                  >
                    <ICONS.Trash2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hover:text-red-500" />
                  </button>
                )}
              </div>
            );
          })}
          <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
        </>
      )}

      {/* Standard Lenses Section Header (only if custom lenses exist) */}
      {customLenses.length > 0 && (
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 pt-1 pb-1">
          Standard Lenses
        </div>
      )}

      {/* Standard Personas */}
      {personas.map(persona => {
        const Icon = IconComponent(persona.icon);
        const colors = getPersonaColors(persona.color);
        const isSelected = currentLens === persona.id;
        const isHighlighted = highlightedLens === persona.id && !isSelected;

        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative
              ${isSelected
                ? `${colors.bgLight} ${colors.border} border-2`
                : isHighlighted
                  ? `bg-grove-clay/5 border-grove-clay/40 border-2 ring-2 ring-grove-clay/20 ring-offset-1`
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm dark:hover:shadow-none'
              }`}
          >
            {/* v0.12e: URL lens highlight badge */}
            {isHighlighted && (
              <div className="absolute -top-2 left-4 bg-grove-clay text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded">
                Shared with you
              </div>
            )}
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${isSelected ? colors.bg : isHighlighted ? 'bg-grove-clay/20' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'} transition-colors`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : isHighlighted ? 'text-grove-clay' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-sans font-semibold text-sm ${isSelected ? colors.text : isHighlighted ? 'text-grove-clay' : 'text-slate-900 dark:text-slate-100'}`}>
                  {persona.publicLabel}
                </div>
                <div className="font-serif text-xs text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-2">
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

      {/* "Create Your Own" Option - CLAY ORANGE dashed border for emphasis */}
      {showCreateOption && onCreateCustomLens && (
        <>
          <div className="border-t border-slate-200 dark:border-slate-700 my-3" />
          <button
            onClick={onCreateCustomLens}
            className="w-full text-left p-4 rounded-lg border-2 border-dashed border-grove-clay/40
                       transition-all duration-200 group
                       hover:border-grove-clay hover:bg-grove-clay/5"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-grove-clay/10 group-hover:bg-grove-clay/20 transition-colors">
                <ICONS.Sparkles className="w-5 h-5 text-grove-clay/60 group-hover:text-grove-clay" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans font-medium text-sm text-grove-clay/80 group-hover:text-grove-clay">
                  Create your own lens
                </div>
                <div className="font-serif text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">
                  "Build a lens that's uniquely yours"
                </div>
              </div>
              <ICONS.Plus className="w-4 h-4 text-grove-clay/40 group-hover:text-grove-clay self-center" />
            </div>
          </button>
        </>
      )}
    </div>
  );
};

export default LensGrid;
