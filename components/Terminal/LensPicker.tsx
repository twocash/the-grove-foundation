// LensPicker - Lens switching for returning users
// v0.14.1: Minimal header with back button, dark mode support
// Shows when user clicks lens pill button in TerminalControls

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface LensPickerProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onClose?: () => void;  // v0.14.1: Back to chat
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  currentLens?: string | null;
  highlightedLens?: string | null;  // v0.12e: URL lens to highlight
  showCreateOption?: boolean;
}

const LensPicker: React.FC<LensPickerProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onClose,
  onCreateCustomLens,
  onDeleteCustomLens,
  currentLens,
  highlightedLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Minimal Header with Back Button */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        {onClose ? (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </button>
        ) : (
          <div className="w-24" />
        )}
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Switch Lens
        </span>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Lens Selection */}
      <div className="flex-1 overflow-y-auto p-4">
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          currentLens={currentLens}
          highlightedLens={highlightedLens}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>
    </div>
  );
};

export default LensPicker;
