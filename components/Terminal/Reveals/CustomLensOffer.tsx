// CustomLensOffer - Prompt to create custom lens after simulation reveal
// Shows after simulationRevealAcknowledged && !customLensId && !customLensOfferShown

import React from 'react';

// Icons
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

interface CustomLensOfferProps {
  currentLensName: string;
  onBuildLens: () => void;
  onDismiss: () => void;
}

const CustomLensOffer: React.FC<CustomLensOfferProps> = ({
  currentLensName,
  onBuildLens,
  onDismiss
}) => {
  return (
    <div className="border border-purple-200 rounded-lg bg-purple-50/50 overflow-hidden">
      <div className="p-5">
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="float-right p-1 hover:bg-purple-100 rounded transition-colors"
        >
          <XIcon className="w-4 h-4 text-ink-muted" />
        </button>

        {/* Icon */}
        <div className="flex items-center space-x-2 mb-3">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
        </div>

        {/* Content */}
        <p className="font-serif text-sm text-ink mb-2">
          You've been exploring through the <span className="font-semibold">{currentLensName}</span> lens.
        </p>

        <p className="font-serif text-sm text-ink-muted mb-4">
          It shaped every response you received — the framing, the emphasis, what got highlighted and what didn't.
        </p>

        <p className="font-display text-base text-ink mb-5">
          Want to create one that's uniquely yours?
        </p>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onBuildLens}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white font-sans text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Build My Lens</span>
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-lg border border-ink/20 text-ink font-sans text-sm hover:bg-ink/5 transition-colors"
          >
            Keep exploring with this one
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomLensOffer;
