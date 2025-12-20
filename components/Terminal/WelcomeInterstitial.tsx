// WelcomeInterstitial - First-open experience for new Terminal users
// Shows welcome copy + lens selection to establish product context

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface WelcomeInterstitialProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}

const WELCOME_COPY = `Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative. You can switch lenses anytime in your journey. And we recommend it!`;

const WelcomeInterstitial: React.FC<WelcomeInterstitialProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          THE GROVE TERMINAL [v2.5.0]
        </div>
        <div className="font-mono text-xs text-grove-forest mb-6">
          Connection established.
        </div>

        {/* Welcome Copy */}
        <div className="space-y-4">
          {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
            <p key={i} className={`font-serif text-sm leading-relaxed ${i === 0 ? 'text-ink font-medium' : 'text-ink-muted'}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Select Your Starting Lens
        </div>
      </div>

      {/* Lens Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          You can switch lenses anytime by clicking on your lens in the Terminal.
        </p>
      </div>
    </div>
  );
};

export default WelcomeInterstitial;
