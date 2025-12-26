// TextStep - Free-form text input step
// Sprint: wizard-engine-v1

import React from 'react';
import { TextStepSchema } from '@core/wizard';

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

interface TextStepProps {
  schema: TextStepSchema;
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  continueLabel?: string;
}

export function TextStep({
  schema,
  value,
  onChange,
  onContinue,
  continueLabel = 'Continue'
}: TextStepProps) {
  const maxLength = schema.maxLength || 280;
  const isRequired = schema.required !== false;
  const canContinue = !isRequired || value.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          {/* Question */}
          <h2 className="font-display text-lg text-ink mb-2">
            {schema.question}
          </h2>
          {schema.subtext && (
            <p className="font-serif text-sm text-ink-muted italic mb-6">
              {schema.subtext}
            </p>
          )}

          {/* Text area */}
          <div className="mt-4">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
              placeholder={schema.placeholder || 'Share your thoughts...'}
              className="w-full h-32 p-4 rounded-lg border border-ink/10 bg-white font-serif text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 resize-none"
            />
            <div className="text-right mt-1">
              <span className={`text-[10px] font-mono ${value.length > maxLength - 30 ? 'text-amber-600' : 'text-ink-muted'}`}>
                {value.length}/{maxLength}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-ink/5 bg-paper/50">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`w-full py-3 px-4 rounded-lg font-sans font-medium text-sm flex items-center justify-center space-x-2 transition-colors
            ${canContinue
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-ink/10 text-ink/40 cursor-not-allowed'
            }`}
        >
          <span>{continueLabel}</span>
          <ArrowRightIcon className="w-4 h-4" />
        </button>
        {!isRequired && (
          <p className="text-[10px] text-ink-muted text-center mt-2">
            Skip this step if you prefer
          </p>
        )}
      </div>
    </div>
  );
}
