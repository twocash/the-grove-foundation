// PrivacyStep - First step of wizard establishing trust and privacy assurance

import React from 'react';

// Inline SVG icons
const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

interface PrivacyStepProps {
  onAccept: () => void;
  onCancel: () => void;
}

const PrivacyStep: React.FC<PrivacyStepProps> = ({ onAccept, onCancel }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          Custom Lens Creator
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md hover:bg-ink/5 transition-colors"
          title="Cancel"
        >
          <XIcon className="w-4 h-4 text-ink-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Shield icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-grove-forest/10">
              <ShieldIcon className="w-10 h-10 text-grove-forest" />
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display text-xl text-ink text-center mb-3">
            Before we begin — a promise
          </h2>

          {/* Privacy guarantees */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-paper border border-ink/5">
              <LockIcon className="w-5 h-5 text-grove-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-sm text-ink font-medium">
                  Everything stays in your browser
                </p>
                <p className="font-serif text-xs text-ink-muted mt-0.5">
                  Your answers are encrypted locally using Web Crypto. We never see them.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-paper border border-ink/5">
              <LockIcon className="w-5 h-5 text-grove-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-sm text-ink font-medium">
                  No accounts. No tracking.
                </p>
                <p className="font-serif text-xs text-ink-muted mt-0.5">
                  Your lens is stored only in this browser's localStorage.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg bg-paper border border-ink/5">
              <LockIcon className="w-5 h-5 text-grove-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-sm text-ink font-medium">
                  AI generates, you control
                </p>
                <p className="font-serif text-xs text-ink-muted mt-0.5">
                  We'll create 3 lens options for you to choose from. You pick.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mb-8">
            <p className="font-mono text-[10px] text-ink-muted uppercase tracking-wider mb-3">
              How it works
            </p>
            <div className="flex items-center justify-between text-xs">
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center font-mono text-ink/60 mb-1">1</div>
                <span className="text-ink-muted">Questions</span>
              </div>
              <div className="flex-1 border-t border-dashed border-ink/20 mx-2" />
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center font-mono text-ink/60 mb-1">2</div>
                <span className="text-ink-muted">Generate</span>
              </div>
              <div className="flex-1 border-t border-dashed border-ink/20 mx-2" />
              <div className="flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center font-mono text-ink/60 mb-1">3</div>
                <span className="text-ink-muted">Select</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <button
          onClick={onAccept}
          className="w-full py-3 px-4 rounded-lg bg-grove-forest text-white font-sans font-medium text-sm hover:bg-grove-forest/90 transition-colors"
        >
          I understand — let's build my lens
        </button>
        <p className="text-[10px] text-ink-muted text-center mt-3">
          Takes about 2 minutes. 5 quick questions.
        </p>
      </div>
    </div>
  );
};

export default PrivacyStep;
