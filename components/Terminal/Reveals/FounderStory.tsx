// FounderStory - Final reveal showing the founder's journey and the Ratchet thesis
// Shows after terminatorModeActive || minutesActive >= 15 || ctaViewed

import React, { useState } from 'react';
import { ArchetypeId } from '../../../types/lens';

// Icons
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

// Archetype-specific CTAs
const ARCHETYPE_CTA: Record<ArchetypeId, { text: string; subtext: string }> = {
  'academic': {
    text: "The Research Council is forming. Nominate a colleague.",
    subtext: "Shape the governance of distributed AI research."
  },
  'engineer': {
    text: "The codebase is open. What would you build?",
    subtext: "The architecture is documented. Good first issues tagged."
  },
  'concerned-citizen': {
    text: "You've seen the alternative. Share it.",
    subtext: "Help others understand what's possible."
  },
  'geopolitical': {
    text: "The Advisory Board is forming. We need policy thinkers.",
    subtext: "Shape the governance framework."
  },
  'big-ai-exec': {
    text: "Request a confidential briefing. The optionality is real.",
    subtext: "NDA available. Direct conversation with leadership."
  },
  'family-office': {
    text: "The Founding Circle is forming. This is the ground floor.",
    subtext: "Patient capital for infrastructure that compounds."
  }
};

interface FounderStoryPromptProps {
  onShow: () => void;
}

export const FounderStoryPrompt: React.FC<FounderStoryPromptProps> = ({ onShow }) => {
  return (
    <button
      onClick={onShow}
      className="w-full py-3 px-4 border-t border-b border-dashed border-ink/20 bg-paper hover:bg-ink/5 transition-colors group"
    >
      <span className="font-serif text-sm text-ink italic group-hover:text-grove-forest">
        One more thing.
      </span>
    </button>
  );
};

interface FounderStoryProps {
  archetypeId?: ArchetypeId;
  onLearnRatchet: () => void;
  onMeetFoundation: () => void;
  onJoin: () => void;
  onDismiss: () => void;
}

const FounderStory: React.FC<FounderStoryProps> = ({
  archetypeId,
  onLearnRatchet,
  onMeetFoundation,
  onJoin,
  onDismiss
}) => {
  const [showRatchet, setShowRatchet] = useState(false);

  const ctaConfig = archetypeId ? ARCHETYPE_CTA[archetypeId] : null;

  if (showRatchet) {
    // Ratchet thesis view
    return (
      <div className="border border-ink/20 rounded-lg bg-white overflow-hidden">
        <div className="p-6">
          {/* Back button */}
          <button
            onClick={() => setShowRatchet(false)}
            className="flex items-center space-x-1 text-ink-muted hover:text-ink mb-4 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="text-xs">Back</span>
          </button>

          <h3 className="font-display text-lg text-ink mb-4">
            The Ratchet Thesis
          </h3>

          <p className="font-serif text-sm text-ink mb-4">
            AI capabilities propagate. Always.
          </p>

          <p className="font-serif text-sm text-ink-muted mb-4">
            What runs on a $100M cluster today runs on a laptop in 21 months.
            The doubling time is 7 months. The lag from frontier to edge is predictable.
          </p>

          {/* Timeline visualization */}
          <div className="border border-ink/10 rounded-lg p-4 mb-6 bg-paper/50">
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center">
                <span className="w-14 text-ink-muted">2023:</span>
                <span className="text-ink">GPT-4 requires datacenter</span>
              </div>
              <div className="flex items-center">
                <span className="w-14 text-ink-muted">2024:</span>
                <span className="text-ink">Llama-70B runs on high-end desktop</span>
              </div>
              <div className="flex items-center">
                <span className="w-14 text-ink-muted">2025:</span>
                <span className="text-ink">Capable agents run on personal computers</span>
              </div>
              <div className="flex items-center">
                <span className="w-14 text-grove-forest font-semibold">2026:</span>
                <span className="text-grove-forest font-semibold">[The Grove's window opens]</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-serif text-sm text-ink-muted mb-6">
            <p>
              The question isn't whether AI capability will distribute.
              It's who builds the infrastructure when it does.
            </p>
            <p>
              Big Tech is building for concentration.
              <br />
              <span className="text-grove-forest">The Grove is building for distribution.</span>
            </p>
            <p className="italic">
              The ratchet only turns one way.
              <br />
              We're just positioning for where it lands.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRatchet(false)}
              className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onMeetFoundation}
              className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
            >
              Read the White Paper
            </button>
            <button
              onClick={onJoin}
              className="px-4 py-2 rounded-lg bg-grove-forest text-white font-sans text-sm hover:bg-grove-forest/90 transition-colors"
            >
              Join the Foundation
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main founder story view
  return (
    <div className="border border-ink/20 rounded-lg bg-white overflow-hidden">
      <div className="p-6">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="float-right p-1 hover:bg-ink/5 rounded transition-colors"
        >
          <XIcon className="w-4 h-4 text-ink-muted" />
        </button>

        {/* Icon */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 rounded-full bg-ink/5">
            <UserIcon className="w-5 h-5 text-ink" />
          </div>
        </div>

        {/* Main content */}
        <p className="font-serif text-sm text-ink mb-4">
          Everything you just experienced — the lens, the Terminal, the architecture —
          was built by <span className="font-semibold">one person</span> working with frontier AI.
        </p>

        <p className="font-serif text-sm text-ink-muted mb-4">
          Not a technical founder. Not a VC-backed team.
          A strategist who figured out how to think alongside AI.
        </p>

        <div className="border-t border-ink/10 my-4" />

        <p className="font-display text-base text-ink mb-4">
          That's the point.
        </p>

        <div className="space-y-3 font-serif text-sm text-ink-muted mb-4">
          <p>
            The Grove thesis isn't "AI will save us" or "AI will destroy us."
            It's simpler:
          </p>
          <p className="text-ink font-medium text-base">
            Distributed intelligence beats concentrated genius.
          </p>
          <p>
            And this Terminal is the proof.
          </p>
        </div>

        <div className="border-t border-ink/10 my-4" />

        <p className="font-serif text-sm text-ink-muted mb-4">
          If one person can orchestrate this in weeks, imagine what a network
          of 10,000 can build in years.
        </p>

        <p className="font-serif text-sm text-ink mb-4">
          The genius isn't the founder.
          <br />
          <span className="text-grove-forest font-semibold">The genius is the system.</span>
        </p>

        <p className="font-display text-base text-ink mb-6">
          And you're already part of it.
        </p>

        {/* Archetype-specific CTA */}
        {ctaConfig && (
          <div className="bg-grove-forest/5 border border-grove-forest/20 rounded-lg p-4 mb-6">
            <p className="font-serif text-sm text-ink mb-1">
              {ctaConfig.text}
            </p>
            <p className="font-mono text-xs text-ink-muted">
              {ctaConfig.subtext}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowRatchet(true)}
            className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
          >
            Learn about the Ratchet
          </button>
          <button
            onClick={onMeetFoundation}
            className="px-4 py-2 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
          >
            Meet the Foundation
          </button>
          <button
            onClick={onJoin}
            className="px-4 py-2 rounded-lg bg-grove-forest text-white font-sans text-sm hover:bg-grove-forest/90 transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default FounderStory;
