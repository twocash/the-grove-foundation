// SimulationReveal - "You're already in the Grove" reveal after first journey
// Shows after journeysCompleted >= 1 && !simulationRevealShown

import React, { useState } from 'react';
import { ArchetypeId } from '../../../types/lens';

// Icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

// Archetype-specific opening lines
const ARCHETYPE_OPENINGS: Record<ArchetypeId | 'default', string> = {
  'academic': "This terminal is a working prototype of the research infrastructure we're proposing.",
  'engineer': "The architecture you've been exploring? You're running on it.",
  'concerned-citizen': "You just experienced what distributed AI feels like — no Big Tech in the loop.",
  'geopolitical': "This is the countervailing infrastructure in action.",
  'big-ai-exec': "This is the hedge. Running. Now.",
  'family-office': "The infrastructure thesis you just explored? You're the proof of concept.",
  'default': "This terminal isn't a mockup."
};

interface SimulationRevealProps {
  minutesActive: number;
  archetypeId?: ArchetypeId;
  onAcknowledge: () => void;
  onHowItWorks: () => void;
}

const SimulationReveal: React.FC<SimulationRevealProps> = ({
  minutesActive,
  archetypeId,
  onAcknowledge,
  onHowItWorks
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);

  const openingLine = archetypeId
    ? ARCHETYPE_OPENINGS[archetypeId]
    : ARCHETYPE_OPENINGS.default;

  if (!isExpanded) {
    // Collapsed state - subtle prompt
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full py-3 px-4 border-t border-b border-dashed border-grove-forest/20 bg-grove-forest/5 hover:bg-grove-forest/10 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <span className="font-serif text-sm text-grove-forest italic">
            You've been in the Grove for {minutesActive} {minutesActive === 1 ? 'minute' : 'minutes'} now.
          </span>
          <ChevronDownIcon className="w-4 h-4 text-grove-forest opacity-50 group-hover:opacity-100" />
        </div>
      </button>
    );
  }

  if (showArchitecture) {
    // Architecture explanation view
    return (
      <div className="border border-grove-forest/20 rounded-lg bg-white overflow-hidden">
        <div className="p-6">
          <h3 className="font-mono text-xs text-grove-forest uppercase tracking-widest mb-4">
            The Architecture
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="font-sans text-ink-muted">Your lens:</span>
              <span className="font-mono text-ink">Generated client-side, stored locally</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-sans text-ink-muted">Your questions:</span>
              <span className="font-mono text-ink">Processed, not stored</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-sans text-ink-muted">The responses:</span>
              <span className="font-mono text-ink">Assembled from distributed knowledge</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-sans text-ink-muted">Your session:</span>
              <span className="font-mono text-ink">Encrypted in your browser</span>
            </div>
          </div>

          <div className="border-t border-ink/10 pt-4 mb-4">
            <p className="font-mono text-[10px] text-grove-forest uppercase tracking-wider mb-2">
              What's real now
            </p>
            <ul className="space-y-1 text-sm font-serif text-ink-muted">
              <li className="flex items-start">
                <span className="text-grove-forest mr-2">→</span>
                The RAG retrieval architecture
              </li>
              <li className="flex items-start">
                <span className="text-grove-forest mr-2">→</span>
                The persona-driven response shaping
              </li>
              <li className="flex items-start">
                <span className="text-grove-forest mr-2">→</span>
                The local-first privacy model
              </li>
            </ul>
          </div>

          <div className="border-t border-ink/10 pt-4 mb-6">
            <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-2">
              What's coming
            </p>
            <ul className="space-y-1 text-sm font-serif text-ink-muted">
              <li className="flex items-start">
                <span className="text-ink-muted mr-2">→</span>
                True distributed inference across contributor nodes
              </li>
              <li className="flex items-start">
                <span className="text-ink-muted mr-2">→</span>
                Agent communities running on personal computers
              </li>
              <li className="flex items-start">
                <span className="text-ink-muted mr-2">→</span>
                Knowledge commons that no single entity controls
              </li>
            </ul>
          </div>

          <p className="font-serif text-sm text-ink italic mb-6">
            You're using the demo. The Foundation is building the infrastructure.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={onAcknowledge}
              className="flex-1 py-2 px-4 rounded-lg bg-grove-forest text-white font-sans text-sm font-medium hover:bg-grove-forest/90 transition-colors"
            >
              Continue exploring
            </button>
            <button
              onClick={onHowItWorks}
              className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
            >
              Learn about the Foundation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main reveal view
  return (
    <div className="border border-grove-forest/20 rounded-lg bg-white overflow-hidden">
      <div className="p-6">
        {/* Close button */}
        <button
          onClick={() => setIsExpanded(false)}
          className="float-right p-1 hover:bg-ink/5 rounded transition-colors"
        >
          <ChevronUpIcon className="w-4 h-4 text-ink-muted" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-grove-forest" />
          <span className="font-mono text-[10px] text-grove-forest uppercase tracking-widest">
            Revelation
          </span>
        </div>

        <p className="font-display text-lg text-ink mb-4">
          {openingLine}
        </p>

        <div className="space-y-3 font-serif text-sm text-ink-muted mb-6">
          <p>
            You're interacting with a RAG system that retrieves context from distributed knowledge stores.
            Your lens was generated locally. Your session state exists only in your browser.
          </p>
          <p>
            No central server processed your persona.
            No cloud LLM holds your conversation history.
          </p>
          <p className="text-ink font-medium">
            This is what distributed AI infrastructure feels like.
          </p>
        </div>

        <div className="border-t border-ink/10 pt-4 mb-6">
          <p className="font-display text-base text-ink">
            The simulation isn't coming.
            <br />
            <span className="text-grove-forest">You're already in it.</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAcknowledge}
            className="px-4 py-2 rounded-lg bg-grove-forest text-white font-sans text-sm font-medium hover:bg-grove-forest/90 transition-colors"
          >
            Continue exploring
          </button>
          <button
            onClick={() => setShowArchitecture(true)}
            className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
          >
            How does this work?
          </button>
          <button
            onClick={onAcknowledge}
            className="px-4 py-2 rounded-lg border border-ink/10 text-ink-muted font-sans text-lg hover:bg-ink/5 transition-colors"
            title="Mind blown"
          >
            🤯
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationReveal;
