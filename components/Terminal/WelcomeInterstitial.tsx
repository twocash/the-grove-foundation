// WelcomeInterstitial - First-open experience for new Terminal users
// v0.14.2: Width constraint, dark mode, removed legacy header
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
  // Chat Column Unification (Sprint: chat-column-unification-v1)
  embedded?: boolean;
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
  showCreateOption = true,
  embedded = false
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        {/* Welcome Copy */}
        <div className="space-y-4 mb-6">
          {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
            <p key={i} className={`font-serif text-sm leading-relaxed ${
              embedded
                ? i === 0 ? 'text-[var(--chat-text)] font-medium' : 'text-[var(--chat-text-muted)]'
                : i === 0 ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Section Header */}
        <div className={`pb-2 border-b mb-4 ${
          embedded
            ? 'border-[var(--chat-border)]'
            : 'border-slate-200 dark:border-slate-700'
        }`}>
          <div className={`text-[10px] font-mono uppercase tracking-wider ${
            embedded ? 'text-[var(--chat-text-muted)]' : 'text-slate-500 dark:text-slate-400'
          }`}>
            Select Your Starting Lens
          </div>
        </div>

        {/* Lens Grid */}
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
          embedded={embedded}
        />

        {/* Footer hint */}
        <div className={`mt-6 pt-4 border-t ${
          embedded ? 'border-[var(--chat-border)]' : 'border-slate-200 dark:border-slate-700'
        }`}>
          <p className={`text-[10px] text-center ${
            embedded ? 'text-[var(--chat-text-muted)]' : 'text-slate-500 dark:text-slate-400'
          }`}>
            You can switch lenses anytime by clicking on your lens in the Terminal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeInterstitial;
