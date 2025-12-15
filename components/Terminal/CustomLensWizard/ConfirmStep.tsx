// ConfirmStep - Final confirmation before activating custom lens

import React from 'react';
import { LensCandidate } from '../../../types/lens';

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// Narrative style labels
const STYLE_LABELS: Record<string, string> = {
  'evidence-first': 'Data-driven approach',
  'stakes-heavy': 'Impact-focused framing',
  'mechanics-deep': 'Technical depth',
  'resolution-oriented': 'Action-oriented outcomes'
};

interface ConfirmStepProps {
  selectedLens: LensCandidate;
  onConfirm: () => void;
  onBack: () => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  selectedLens,
  onConfirm,
  onBack
}) => {
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
          Confirm Lens
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 rounded-full bg-purple-100">
                <SparklesIcon className="w-10 h-10 text-purple-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-grove-forest">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Lens name */}
          <h2 className="font-display text-xl text-ink text-center mb-2">
            {selectedLens.publicLabel}
          </h2>
          <p className="font-serif text-sm text-ink-muted italic text-center mb-6">
            {selectedLens.description}
          </p>

          {/* Lens details card */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="font-mono text-[10px] text-purple-600 uppercase tracking-wider mb-3">
              Your lens will
            </p>

            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="font-serif text-sm text-ink">
                  {STYLE_LABELS[selectedLens.narrativeStyle]}
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="font-serif text-sm text-ink">
                  Shape every response to your perspective
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="font-serif text-sm text-ink">
                  Guide your journey through The Grove
                </span>
              </li>
            </ul>
          </div>

          {/* Privacy reminder */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-ink/5">
            <LockIcon className="w-4 h-4 text-grove-forest flex-shrink-0 mt-0.5" />
            <p className="font-serif text-xs text-ink-muted">
              Your lens is saved locally in this browser. No data is sent to our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50 space-y-3">
        <button
          onClick={onConfirm}
          className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white font-sans font-medium text-sm hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Activate my lens</span>
        </button>
        <p className="text-[10px] text-ink-muted text-center">
          You can edit or delete your lens anytime
        </p>
      </div>
    </div>
  );
};

export default ConfirmStep;
