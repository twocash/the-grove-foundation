// GeneratingStep - Loading state while AI generates lens options

import React from 'react';

// Icons
const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
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

interface GeneratingStepProps {
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

const GeneratingStep: React.FC<GeneratingStepProps> = ({
  error,
  onRetry,
  onCancel
}) => {
  if (error) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-center px-4 py-3 border-b border-ink/5">
          <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
            Generation Failed
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <div className="p-4 rounded-full bg-red-50 mx-auto mb-4 w-fit">
              <AlertCircleIcon className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="font-display text-lg text-ink mb-2">
              Something went wrong
            </h2>
            <p className="font-serif text-sm text-ink-muted mb-6">
              {error}
            </p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={onRetry}
                className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white font-sans font-medium text-sm hover:bg-purple-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3 px-4 rounded-lg bg-ink/5 text-ink font-sans font-medium text-sm hover:bg-ink/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          Generating Lenses
        </div>
      </div>

      {/* Progress bar (indeterminate) */}
      <div className="h-1 bg-ink/5 overflow-hidden">
        <div className="h-full bg-purple-500 animate-pulse" style={{ width: '60%' }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm text-center">
          {/* Animated icon */}
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderIcon className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          <h2 className="font-display text-lg text-ink mb-2">
            Analyzing your perspective...
          </h2>

          <p className="font-serif text-sm text-ink-muted">
            Creating 3 lens options tailored to your worldview
          </p>

          {/* Progress stages */}
          <div className="mt-8 space-y-2 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="font-mono text-xs text-ink-muted">
                Processing responses
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <span className="font-mono text-xs text-ink-muted/60">
                Generating tone guidance
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <span className="font-mono text-xs text-ink-muted/60">
                Mapping to archetypes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          This usually takes 5-10 seconds
        </p>
      </div>
    </div>
  );
};

export default GeneratingStep;
