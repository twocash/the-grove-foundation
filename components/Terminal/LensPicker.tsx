// LensPicker - Lens switching for returning users
// Shows when user clicks lens pill button in TerminalControls
// Uses LensGrid for shared lens rendering

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface LensPickerProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  currentLens?: string | null;
  showCreateOption?: boolean;
}

const LensPicker: React.FC<LensPickerProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  currentLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
          THE GROVE TERMINAL [v2.5.0]
        </div>
        <h2 className="font-display text-xl text-ink mb-2">
          Switch Lens
        </h2>
        <p className="font-serif text-sm text-ink-muted italic">
          Change your perspective on the subject matter.
        </p>
      </div>

      {/* Lens Selection */}
      <div className="flex-1 overflow-y-auto p-4">
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          currentLens={currentLens}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          Your current lens shapes how we explore topics together.
        </p>
      </div>
    </div>
  );
};

export default LensPicker;
