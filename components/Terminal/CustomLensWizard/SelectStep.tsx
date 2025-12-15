// SelectStep - Display and select from AI-generated lens options

import React, { useState } from 'react';
import { LensCandidate } from '../../../types/lens';

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
);

// Narrative style labels
const STYLE_LABELS: Record<string, string> = {
  'evidence-first': 'Data-driven',
  'stakes-heavy': 'Impact-focused',
  'mechanics-deep': 'Technical',
  'resolution-oriented': 'Action-oriented'
};

// Archetype emphasis tags
const ARCHETYPE_EMPHASIS: Record<string, string[]> = {
  'academic': ['Research', 'Evidence', 'Institution'],
  'engineer': ['Architecture', 'Implementation', 'Systems'],
  'concerned-citizen': ['Personal impact', 'Agency', 'Accessibility'],
  'geopolitical': ['Policy', 'Systemic risk', 'Strategic'],
  'big-ai-exec': ['Market dynamics', 'Optionality', 'Positioning'],
  'family-office': ['Long-term', 'Infrastructure', 'Generational']
};

interface SelectStepProps {
  options: LensCandidate[];
  onSelect: (candidate: LensCandidate) => void;
  onRefine: () => void;
  onBack: () => void;
}

interface LensCardProps {
  lens: LensCandidate;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}

const LensCard: React.FC<LensCardProps> = ({
  lens,
  isSelected,
  isExpanded,
  onSelect,
  onExpand
}) => {
  const emphasisTags = ARCHETYPE_EMPHASIS[lens.archetypeMapping] || [];

  return (
    <div
      className={`rounded-lg border transition-all duration-200 overflow-hidden
        ${isSelected
          ? 'bg-purple-50 border-purple-300 border-2 shadow-md'
          : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'
        }`}
    >
      {/* Main card content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-display text-base ${isSelected ? 'text-purple-700' : 'text-ink'}`}>
            {lens.publicLabel}
          </h3>
          {isSelected && (
            <div className="flex-shrink-0 ml-2">
              <CheckIcon className="w-5 h-5 text-purple-600" />
            </div>
          )}
        </div>

        <p className="font-serif text-sm text-ink-muted italic mb-3">
          {lens.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded-full bg-ink/5 text-[10px] font-mono text-ink-muted">
            {STYLE_LABELS[lens.narrativeStyle] || lens.narrativeStyle}
          </span>
          {emphasisTags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-purple-100 text-[10px] font-mono text-purple-600">
              {tag}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onExpand}
            className="flex items-center space-x-1 text-xs text-ink-muted hover:text-ink transition-colors"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Hide details' : 'Preview'}</span>
          </button>
          {!isSelected && (
            <button
              onClick={onSelect}
              className="ml-auto px-3 py-1.5 rounded-md bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Expanded preview */}
      {isExpanded && (
        <div className="border-t border-ink/5 p-4 bg-ink/[0.02]">
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-2">
            How this lens will shape responses
          </p>
          <p className="font-serif text-xs text-ink-muted leading-relaxed">
            {lens.toneGuidance.slice(0, 200)}
            {lens.toneGuidance.length > 200 && '...'}
          </p>

          {/* Arc emphasis visualization */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {(['hook', 'stakes', 'mechanics', 'evidence', 'resolution'] as const).map((phase) => (
              <div key={phase} className="text-center">
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex space-x-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-4 rounded-sm ${
                          i < lens.arcEmphasis[phase]
                            ? 'bg-purple-400'
                            : 'bg-ink/10'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-ink-muted capitalize">{phase}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectStep: React.FC<SelectStepProps> = ({
  options,
  onSelect,
  onRefine,
  onBack
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelect(options[selectedIndex]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
        <button
          onClick={onBack}
          className="flex items-center space-x-1 p-1.5 -ml-1.5 rounded-md hover:bg-ink/5 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-ink-muted" />
          <span className="text-xs text-ink-muted">Back</span>
        </button>
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          Select Your Lens
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto">
          <p className="font-serif text-sm text-ink-muted text-center mb-6">
            I've generated 3 lenses that might fit you. Select the one that resonates most.
          </p>

          {/* Lens cards */}
          <div className="space-y-3">
            {options.map((lens, index) => (
              <LensCard
                key={index}
                lens={lens}
                isSelected={selectedIndex === index}
                isExpanded={expandedIndex === index}
                onSelect={() => handleSelect(index)}
                onExpand={() => handleExpand(index)}
              />
            ))}
          </div>

          {/* Refine option */}
          <div className="mt-6 text-center">
            <button
              onClick={onRefine}
              className="inline-flex items-center space-x-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>None of these fit? Refine my answers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <button
          onClick={handleConfirm}
          disabled={selectedIndex === null}
          className={`w-full py-3 px-4 rounded-lg font-sans font-medium text-sm transition-colors
            ${selectedIndex !== null
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
            }`}
        >
          Continue with selected lens
        </button>
      </div>
    </div>
  );
};

export default SelectStep;
