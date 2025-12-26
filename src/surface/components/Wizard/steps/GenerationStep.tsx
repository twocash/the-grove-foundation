// GenerationStep - Loading state while generation occurs
// Sprint: wizard-engine-v1

import React, { useEffect } from 'react';
import { GenerationStepSchema } from '@core/wizard';

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

interface GenerationStepProps {
  schema: GenerationStepSchema;
  isGenerating?: boolean;
  hasOptions?: boolean;
  error: string | null;
  onGenerate?: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

export function GenerationStep({
  schema,
  isGenerating = false,
  hasOptions = false,
  error,
  onGenerate,
  onRetry,
  onCancel
}: GenerationStepProps) {
  // Auto-trigger generation when component mounts (moved from StepRenderer to comply with hooks rules)
  useEffect(() => {
    if (!isGenerating && !hasOptions && !error && onGenerate) {
      onGenerate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
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
    );
  }

  return (
    <div className="flex-1 flex flex-col">
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
            {schema.loadingTitle}
          </h2>

          <p className="font-serif text-sm text-ink-muted">
            {schema.loadingSubtext}
          </p>

          {/* Progress stages */}
          {schema.progressStages && (
            <div className="mt-8 space-y-2 text-left">
              {schema.progressStages.map((stage, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    index === 0 ? 'bg-purple-500 animate-pulse' : 'bg-purple-300'
                  }`} />
                  <span className={`font-mono text-xs ${
                    index === 0 ? 'text-ink-muted' : 'text-ink-muted/60'
                  }`}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          {schema.estimatedTime || 'This usually takes a few seconds'}
        </p>
      </div>
    </div>
  );
}
