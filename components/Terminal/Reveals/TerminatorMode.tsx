// TerminatorMode - Network overlay showing the "agent view"
// Shows after simulationRevealAcknowledged && (topicsExplored >= 5 || customLensId || minutesActive >= 10)

import React, { useState } from 'react';

// Icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

interface TerminatorModePromptProps {
  topicsExplored: number;
  onActivate: () => void;
  onDismiss: () => void;
}

export const TerminatorModePrompt: React.FC<TerminatorModePromptProps> = ({
  topicsExplored,
  onActivate,
  onDismiss
}) => {
  return (
    <button
      onClick={onActivate}
      className="w-full py-3 px-4 border-t border-b border-dashed border-ink/20 bg-ink/5 hover:bg-ink/10 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="font-serif text-sm text-ink">
            You've explored {topicsExplored} topics through your lens.
          </span>
          <span className="font-mono text-xs text-grove-forest mt-0.5">
            Want to see what the agents see?
          </span>
        </div>
        <span className="px-3 py-1.5 rounded-md bg-ink text-white font-mono text-xs uppercase tracking-wider opacity-80 group-hover:opacity-100 transition-opacity">
          Activate Terminator Lens
        </span>
      </div>
    </button>
  );
};

interface TerminatorModeOverlayProps {
  onDeactivate: () => void;
  onStay: () => void;
}

export const TerminatorModeOverlay: React.FC<TerminatorModeOverlayProps> = ({
  onDeactivate,
  onStay
}) => {
  return (
    <div className="border-2 border-red-500/50 rounded-lg bg-ink overflow-hidden">
      <div className="p-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm text-red-400 uppercase tracking-widest">
              Terminator Lens Active
            </span>
          </div>
          <button
            onClick={onDeactivate}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <XIcon className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <p className="font-sans text-sm text-white/80 mb-4">
          Overlay mode enabled. You now see the Grove as the agents experience it.
        </p>

        {/* Network Status Panel */}
        <div className="border border-white/20 rounded-lg p-4 mb-6 bg-white/5">
          <p className="font-mono text-xs text-white/60 uppercase tracking-wider mb-3">
            Network Status
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Connected nodes:</span>
              <span className="text-green-400">847</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Your contribution:</span>
              <span className="text-green-400">0.003% of reasoning</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Knowledge commons queries:</span>
              <span className="text-green-400">12,847/sec</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Efficiency credits:</span>
              <span className="text-green-400">2.4M in circulation</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Active agent communities:</span>
              <span className="text-green-400">34</span>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-3 mb-6">
          <p className="font-serif text-sm text-white/80">
            Every response you received was assembled from fragments across the network.
          </p>
          <p className="font-serif text-sm text-white/80">
            No single node held your conversation.
            <br />
            No single entity controlled the knowledge.
          </p>
          <p className="font-serif text-sm text-white/60 italic">
            The agents don't experience "The Grove."
            <br />
            They experience each other.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onDeactivate}
            className="px-4 py-2 rounded-lg border border-white/30 text-white font-sans text-sm hover:bg-white/10 transition-colors"
          >
            Return to human view
          </button>
          <button
            onClick={onStay}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-sans text-sm hover:bg-red-700 transition-colors"
          >
            Stay in Terminator mode
          </button>
        </div>
      </div>
    </div>
  );
};

interface TerminatorResponseMetadataProps {
  sourceCount: number;
  retrievalMs: number;
  synthesisMs: number;
  lensName: string;
  isCustomLens: boolean;
  arcPhase: string;
  arcEmphasis: number;
}

export const TerminatorResponseMetadata: React.FC<TerminatorResponseMetadataProps> = ({
  sourceCount,
  retrievalMs,
  synthesisMs,
  lensName,
  isCustomLens,
  arcPhase,
  arcEmphasis
}) => {
  return (
    <div className="mt-3 border-t border-red-500/30 pt-3 bg-ink/90 rounded-b-lg px-3 pb-3 -mx-4 -mb-3">
      <p className="font-mono text-[10px] text-red-400 uppercase tracking-wider mb-2">
        Assembly Metadata
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-white/40">Sources:</span>
          <span className="text-white/70">{sourceCount} knowledge fragments</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Retrieval:</span>
          <span className="text-white/70">{retrievalMs}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Synthesis:</span>
          <span className="text-white/70">{synthesisMs}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Lens modulation:</span>
          <span className="text-white/70">
            {lensName} {isCustomLens ? '(custom)' : ''}
          </span>
        </div>
        <div className="flex justify-between col-span-2">
          <span className="text-white/40">Arc phase:</span>
          <span className="text-white/70">
            {arcPhase} (emphasis: {arcEmphasis}/4)
          </span>
        </div>
      </div>
    </div>
  );
};

export default {
  TerminatorModePrompt,
  TerminatorModeOverlay,
  TerminatorResponseMetadata
};
